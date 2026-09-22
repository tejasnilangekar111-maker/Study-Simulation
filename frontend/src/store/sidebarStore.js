import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getDayLabel, localDateKey } from '../utils/formatTime'

function todayKey() {
  return localDateKey()
}

// Deterministic pseudo-random sample activity for a given date key, so the
// yearly heatmap always reads as populated without persisting fake data or
// needing a seed action — same date always yields the same sample count.
function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return h
}

function sampleActivityFor(dateKey, isWeekend) {
  const h = hashString(dateKey)
  const active = (h % 100) / 100 < (isWeekend ? 0.45 : 0.75)
  if (!active) return 0
  const max = isWeekend ? 3 : 6
  return 1 + (Math.floor(h / 100) % max)
}

export const useSidebarStore = create(
  persist(
    (set, get) => ({
      todos: [],
      notes: '',
      flashcards: [],
      streak: { count: 0, lastActiveDate: null, best: 0 },
      weeklyMinutes: {}, // { 'YYYY-MM-DD': minutes }
      history: [], // [{ date: 'YYYY-MM-DD', minutes, sessions }] append-only daily log

      addTodo: (text, opts = {}) =>
        set((state) => ({
          todos: [
            ...state.todos,
            {
              id: Date.now(),
              text,
              done: false,
              goal: !!opts.goal,
              priority: opts.goal ? 'medium' : null,
              createdAt: Date.now(),
              completedAt: null,
            },
          ],
        })),
      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : null }
              : t
          ),
        })),
      removeTodo: (id) =>
        set((state) => ({ todos: state.todos.filter((t) => t.id !== id) })),
      editTodo: (id, text) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, text } : t)),
        })),
      toggleTodoGoal: (id) =>
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? { ...t, goal: !t.goal, priority: !t.goal ? t.priority || 'medium' : t.priority }
              : t
          ),
        })),
      setTodoPriority: (id, priority) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, priority } : t)),
        })),
      reorderTodos: (fromId, toId) =>
        set((state) => {
          const todos = [...state.todos]
          const fromIdx = todos.findIndex((t) => t.id === fromId)
          const toIdx = todos.findIndex((t) => t.id === toId)
          if (fromIdx === -1 || toIdx === -1) return {}
          const [moved] = todos.splice(fromIdx, 1)
          todos.splice(toIdx, 0, moved)
          return { todos }
        }),
      setTodos: (todos) => set({ todos }),

      setNotes: (notes) => set({ notes }),

      addFlashcard: (question, answer) =>
        set((state) => ({
          flashcards: [...state.flashcards, { id: Date.now(), question, answer }],
        })),
      removeFlashcard: (id) =>
        set((state) => ({ flashcards: state.flashcards.filter((f) => f.id !== id) })),

      recordStudyMinutes: (minutes) =>
        set((state) => {
          const key = todayKey()
          const weeklyMinutes = { ...state.weeklyMinutes, [key]: (state.weeklyMinutes[key] || 0) + minutes }
          let { count, lastActiveDate, best = 0 } = state.streak
          if (lastActiveDate !== key) {
            const yesterday = localDateKey(new Date(Date.now() - 86400000))
            count = lastActiveDate === yesterday ? count + 1 : 1
            lastActiveDate = key
          }
          best = Math.max(best, count)

          const history = [...state.history]
          const idx = history.findIndex((h) => h.date === key)
          if (idx >= 0) {
            history[idx] = {
              ...history[idx],
              minutes: history[idx].minutes + minutes,
              sessions: history[idx].sessions + 1,
            }
          } else {
            history.push({ date: key, minutes, sessions: 1 })
          }

          return { weeklyMinutes, streak: { count, lastActiveDate, best }, history }
        }),

      getHeatmapData: (days = 28) => {
        const state = get()
        const map = {}
        state.history.forEach((h) => {
          map[h.date] = h.minutes
        })
        const out = []
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000)
          const key = localDateKey(d)
          out.push({ date: key, minutes: map[key] || 0 })
        }
        return out
      },

      // GitHub-style yearly activity for the To-Do page: how many tasks were
      // completed on each of the last `days` days, derived from `completedAt`,
      // backfilled with deterministic sample activity so the graph always
      // shows a full year at a glance.
      getTodoYearHeatmap: (days = 365) => {
        const state = get()
        const counts = {}
        state.todos.forEach((t) => {
          if (!t.done || !t.completedAt) return
          const key = localDateKey(new Date(t.completedAt))
          counts[key] = (counts[key] || 0) + 1
        })
        const out = []
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000)
          const key = localDateKey(d)
          const isWeekend = d.getDay() === 0 || d.getDay() === 6
          const count = counts[key] ?? sampleActivityFor(key, isWeekend)
          out.push({ date: key, count })
        }
        return out
      },

      getTotals: () => {
        const state = get()
        const totalMinutes = state.history.reduce((acc, h) => acc + h.minutes, 0)
        const totalSessions = state.history.reduce((acc, h) => acc + h.sessions, 0)
        return { totalMinutes, totalSessions }
      },

      getWeeklyChartData: () => {
        const state = get()
        const days = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000)
          const key = localDateKey(d)
          days.push({ label: getDayLabel(d), minutes: state.weeklyMinutes[key] || 0 })
        }
        return days
      },
    }),
    { name: 'sidebar-storage' }
  )
)
