import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getDayLabel, localDateKey } from '../utils/formatTime'

function todayKey() {
  return localDateKey()
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
          todos: state.todos.map((t) => (t.id === id ? { ...t, goal: !t.goal } : t)),
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
