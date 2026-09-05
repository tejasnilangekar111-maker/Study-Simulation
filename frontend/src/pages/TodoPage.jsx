import { useState } from 'react'
import { AnimatePresence, motion, Reorder } from 'framer-motion'
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiTarget, FiArrowLeft } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useSidebarStore } from '../store/sidebarStore'
import Navbar from '../components/Navbar/Navbar'
import Sidebar from '../components/Sidebar/Sidebar'
import LofiScene from '../components/LibraryScene/LofiScene'
import SleepReminderBanner from '../components/Motivation/SleepReminderBanner'

function TodoItem({ todo, onToggle, onRemove, onEdit, onToggleGoal }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.text)

  const save = () => {
    const trimmed = draft.trim()
    if (trimmed) onEdit(todo.id, trimmed)
    setEditing(false)
  }

  return (
    <Reorder.Item
      value={todo}
      layout
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className="glass rounded-xl px-4 py-3 flex items-center gap-3 group cursor-grab active:cursor-grabbing"
    >
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo.id)}
        className="accent-emerald-500 w-4 h-4 shrink-0"
      />

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="flex-1 bg-white/10 rounded-lg px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-accent-blue"
        />
      ) : (
        <span className={`flex-1 text-sm ${todo.done ? 'line-through text-offwhite/40' : 'text-offwhite/90'}`}>
          {todo.text}
        </span>
      )}

      <button
        onClick={() => onToggleGoal(todo.id)}
        className={`shrink-0 transition-colors ${todo.goal ? 'text-coral-500' : 'text-offwhite/30 hover:text-coral-500/70'}`}
        aria-label="Mark as today's goal"
        title="Today's goal"
      >
        <FiTarget size={15} />
      </button>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {editing ? (
          <>
            <button onClick={save} className="text-emerald-500 hover:text-emerald-400 p-1" aria-label="Save">
              <FiCheck size={14} />
            </button>
            <button onClick={() => setEditing(false)} className="text-offwhite/50 hover:text-offwhite p-1" aria-label="Cancel">
              <FiX size={14} />
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="text-offwhite/50 hover:text-accent-blue p-1" aria-label="Edit task">
            <FiEdit2 size={14} />
          </button>
        )}
        <button onClick={() => onRemove(todo.id)} className="text-offwhite/50 hover:text-coral-500 p-1" aria-label="Delete task">
          <FiTrash2 size={14} />
        </button>
      </div>
    </Reorder.Item>
  )
}

export default function TodoPage() {
  const navigate = useNavigate()
  const todos = useSidebarStore((s) => s.todos)
  const addTodo = useSidebarStore((s) => s.addTodo)
  const toggleTodo = useSidebarStore((s) => s.toggleTodo)
  const removeTodo = useSidebarStore((s) => s.removeTodo)
  const editTodo = useSidebarStore((s) => s.editTodo)
  const toggleTodoGoal = useSidebarStore((s) => s.toggleTodoGoal)
  const setTodos = useSidebarStore((s) => s.setTodos)
  const [text, setText] = useState('')
  const [asGoal, setAsGoal] = useState(false)

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    addTodo(trimmed, { goal: asGoal })
    setText('')
    setAsGoal(false)
  }

  const doneToday = todos.filter((t) => t.done).length
  const goals = todos.filter((t) => t.goal)
  const pendingTodos = todos.filter((t) => !t.done)
  const completedTodos = todos.filter((t) => t.done)

  return (
    <div className="relative min-h-screen w-full bg-lofi-950 text-offwhite">
      <LofiScene />
      <Navbar />
      <Sidebar />
      <SleepReminderBanner />

      <div className="relative z-10 pl-0 md:pl-[280px] px-6 py-24 max-w-4xl mx-auto transition-all">
        <button
          onClick={() => navigate('/study')}
          className="flex items-center gap-2 text-sm text-offwhite/60 hover:text-offwhite mb-6"
        >
          <FiArrowLeft size={14} /> Back to study room
        </button>

        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">To-Do &amp; Goals</h1>
        <p className="text-offwhite/60 mb-8">Plan your session, track your progress, stay on target.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
          <div className="glass rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-offwhite/50 mb-1">Completed Today</p>
            <p className="text-2xl font-bold text-emerald-400">
              {doneToday}/{todos.length}
            </p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-offwhite/50 mb-1">Today's Goals</p>
            <p className="text-2xl font-bold text-coral-500">{goals.length}</p>
          </div>
          <div className="glass rounded-xl p-4 col-span-2 sm:col-span-1">
            <p className="text-xs uppercase tracking-wide text-offwhite/50 mb-1">Pending</p>
            <p className="text-2xl font-bold text-accent-blue">{pendingTodos.length}</p>
          </div>
        </div>

        {goals.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-offwhite/60 mb-3">Today's Goals</h3>
            <div className="flex flex-wrap gap-2">
              {goals.map((g) => (
                <span
                  key={g.id}
                  className={`text-xs rounded-full px-3 py-1.5 border ${
                    g.done
                      ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                      : 'border-coral-500/40 text-coral-400 bg-coral-500/10'
                  }`}
                >
                  {g.text}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-8">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Add a task…"
            className="flex-1 glass rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-accent-blue"
          />
          <button
            onClick={() => setAsGoal((g) => !g)}
            className={`rounded-xl px-3 transition-colors ${asGoal ? 'bg-coral-500/80 text-walnut-950' : 'glass text-offwhite/70 hover:text-coral-500'}`}
            aria-label="Toggle mark as goal"
            title="Mark as today's goal"
          >
            <FiTarget size={16} />
          </button>
          <button
            onClick={submit}
            className="bg-accent-blue/90 hover:bg-accent-blue text-walnut-950 rounded-xl px-5 font-medium flex items-center gap-2"
          >
            <FiPlus size={16} /> Add
          </button>
        </div>

        <section className="mb-10">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-offwhite/60 mb-3">Pending</h3>
          {pendingTodos.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center text-offwhite/40 text-sm">
              Nothing pending — add a task above or enjoy the quiet.
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              values={pendingTodos}
              onReorder={(newOrder) => {
                setTodos([...newOrder, ...completedTodos])
              }}
              className="space-y-2"
            >
              <AnimatePresence initial={false}>
                {pendingTodos.map((t) => (
                  <TodoItem
                    key={t.id}
                    todo={t}
                    onToggle={toggleTodo}
                    onRemove={removeTodo}
                    onEdit={editTodo}
                    onToggleGoal={toggleTodoGoal}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>
          )}
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-offwhite/60 mb-3">Completed</h3>
          {completedTodos.length === 0 ? (
            <p className="text-sm text-offwhite/40">Nothing completed yet.</p>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {completedTodos.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="glass rounded-xl px-4 py-3 flex items-center gap-3 opacity-70"
                  >
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => toggleTodo(t.id)}
                      className="accent-emerald-500 w-4 h-4"
                    />
                    <span className="flex-1 text-sm line-through text-offwhite/40">{t.text}</span>
                    <button
                      onClick={() => removeTodo(t.id)}
                      className="text-offwhite/50 hover:text-coral-500 p-1"
                      aria-label="Delete task"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
