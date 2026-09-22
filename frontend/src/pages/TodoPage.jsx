import { useState, useCallback, useRef } from 'react'
import { AnimatePresence, motion, Reorder } from 'framer-motion'
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiTarget, FiArrowLeft, FiCoffee, FiCheckCircle, FiFlag, FiClock } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useSidebarStore } from '../store/sidebarStore'
import { useUiStore } from '../store/uiStore'
import Navbar from '../components/Navbar/Navbar'
import Sidebar from '../components/Sidebar/Sidebar'
import LofiScene from '../components/LibraryScene/LofiScene'
import SleepReminderBanner from '../components/Motivation/SleepReminderBanner'
import YearHeatmap from '../components/Todo/YearHeatmap'

const PRIORITY_ORDER = ['low', 'medium', 'high']
const PRIORITY_META = {
  high: { label: 'High', dot: 'bg-coral-500', text: 'text-coral-400', border: 'border-coral-500/40', bg: 'bg-coral-500/10' },
  medium: { label: 'Medium', dot: 'bg-accent-blue', text: 'text-accent-blue', border: 'border-accent-blue/40', bg: 'bg-accent-blue/10' },
  low: { label: 'Low', dot: 'bg-offwhite/40', text: 'text-offwhite/60', border: 'border-offwhite/20', bg: 'bg-white/5' },
}

function nextPriority(current) {
  const idx = PRIORITY_ORDER.indexOf(current || 'medium')
  return PRIORITY_ORDER[(idx + 1) % PRIORITY_ORDER.length]
}

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="glass rounded-full px-4 py-2 text-xs text-offwhite/90 shadow-xl"
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function StatTile({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="glass glass-card rounded-xl p-5 flex items-center gap-4"
    >
      <div className="rounded-full p-3 shrink-0" style={{ backgroundColor: `${color}22`, color }}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-offwhite/60 mb-0.5 truncate">{label}</p>
        <p className="text-xl font-bold" style={{ color }}>{value}</p>
      </div>
    </motion.div>
  )
}

function TodoItem({ todo, onToggle, onRemove, onEdit, onToggleGoal, onCyclePriority }) {
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
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className="glass glass-card rounded-xl px-5 py-4 flex items-center gap-4 group cursor-grab active:cursor-grabbing"
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
        <span className={`flex-1 text-sm ${todo.done ? 'line-through text-offwhite/55' : 'text-offwhite/90'}`}>
          {todo.text}
        </span>
      )}

      <button
        onClick={() => onToggleGoal(todo.id)}
        className={`shrink-0 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue ${todo.goal ? 'text-coral-500' : 'text-offwhite/30 hover:text-coral-500/70'}`}
        aria-label="Mark as today's goal"
        title="Today's goal"
      >
        <FiTarget size={15} />
      </button>

      {todo.goal && (
        <button
          onClick={() => onCyclePriority(todo.id, todo.priority)}
          className={`shrink-0 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue ${PRIORITY_META[todo.priority || 'medium'].border} ${PRIORITY_META[todo.priority || 'medium'].text} ${PRIORITY_META[todo.priority || 'medium'].bg}`}
          aria-label="Cycle goal priority"
          title="Click to change priority"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_META[todo.priority || 'medium'].dot}`} />
          {PRIORITY_META[todo.priority || 'medium'].label}
        </button>
      )}

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
        {editing ? (
          <>
            <button onClick={save} className="text-emerald-500 hover:text-emerald-400 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue" aria-label="Save">
              <FiCheck size={14} />
            </button>
            <button onClick={() => setEditing(false)} className="text-offwhite/60 hover:text-offwhite p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue" aria-label="Cancel">
              <FiX size={14} />
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="text-offwhite/60 hover:text-accent-blue p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue" aria-label="Edit task">
            <FiEdit2 size={14} />
          </button>
        )}
        <button onClick={() => onRemove(todo.id)} className="text-offwhite/60 hover:text-coral-500 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue" aria-label="Delete task">
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
  const setTodoPriority = useSidebarStore((s) => s.setTodoPriority)
  const setTodos = useSidebarStore((s) => s.setTodos)
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed)
  const [text, setText] = useState('')
  const [asGoal, setAsGoal] = useState(false)
  const [toasts, setToasts] = useState([])
  const toastIdRef = useRef(0)
  const contentPaddingClass = sidebarCollapsed ? 'pl-0 md:pl-24' : 'pl-0 md:pl-72'

  const notify = useCallback((message) => {
    const id = ++toastIdRef.current
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2200)
  }, [])

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    addTodo(trimmed, { goal: asGoal })
    setText('')
    setAsGoal(false)
    notify('Task added')
  }

  const handleToggle = (id) => {
    const willComplete = !todos.find((t) => t.id === id)?.done
    toggleTodo(id)
    notify(willComplete ? 'Nice work — task completed 🎉' : 'Marked as pending')
  }

  const handleRemove = (id) => {
    removeTodo(id)
    notify('Task removed')
  }

  const cyclePriority = (id, current) => {
    setTodoPriority(id, nextPriority(current))
    notify(`Priority set to ${PRIORITY_META[nextPriority(current)].label}`)
  }

  const doneToday = todos.filter((t) => t.done).length
  const goals = [...todos.filter((t) => t.goal)].sort(
    (a, b) => PRIORITY_ORDER.indexOf(b.priority || 'medium') - PRIORITY_ORDER.indexOf(a.priority || 'medium')
  )
  const priorityRank = (t) => (t.goal ? PRIORITY_ORDER.indexOf(t.priority || 'medium') : -1)
  const pendingTodos = todos.filter((t) => !t.done).sort((a, b) => priorityRank(b) - priorityRank(a))
  const completedTodos = todos.filter((t) => t.done)

  return (
    <div className="relative min-h-screen w-full bg-lofi-950 text-offwhite">
      <LofiScene />
      <Navbar />
      <Sidebar />
      <SleepReminderBanner />

      <div className={`relative z-10 ${contentPaddingClass} px-6 sm:px-10 py-28 max-w-5xl mx-auto transition-[padding] duration-300`}>
        <button
          onClick={() => navigate('/study')}
          className="flex items-center gap-2 text-sm text-offwhite/60 hover:text-offwhite mb-8 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
        >
          <FiArrowLeft size={14} /> Back to study room
        </button>

        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">To-Do &amp; Goals</h1>
        <p className="text-offwhite/60 mb-12">Plan your session, track your progress, stay on target.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-14">
          <StatTile icon={FiCheckCircle} label="Completed Today" value={`${doneToday}/${todos.length}`} color="#34d399" />
          <StatTile icon={FiFlag} label="Today's Goals" value={goals.length} color="#ff8066" />
          <div className="col-span-2 sm:col-span-1">
            <StatTile icon={FiClock} label="Pending" value={pendingTodos.length} color="#7fb3e0" />
          </div>
        </div>

        {goals.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-offwhite/60 mb-4">Today's Goals</h3>
            <div className="flex flex-wrap gap-2.5">
              {goals.map((g) => {
                const meta = PRIORITY_META[g.priority || 'medium']
                return (
                  <span
                    key={g.id}
                    className={`inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 border ${
                      g.done ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : `${meta.border} ${meta.text} ${meta.bg}`
                    }`}
                  >
                    {!g.done && <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />}
                    {g.text}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-12">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Add a task…"
            className="flex-1 glass rounded-xl px-5 py-3.5 text-sm outline-none focus:ring-1 focus:ring-accent-blue"
          />
          <button
            onClick={() => setAsGoal((g) => !g)}
            className={`rounded-xl px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue ${asGoal ? 'bg-coral-500/80 text-walnut-950' : 'glass text-offwhite/70 hover:text-coral-500'}`}
            aria-label="Toggle mark as goal"
            title="Mark as today's goal"
          >
            <FiTarget size={16} />
          </button>
          <button
            onClick={submit}
            className="bg-accent-blue/90 hover:bg-accent-blue hover:shadow-lg hover:shadow-accent-blue/20 text-walnut-950 rounded-xl px-5 font-medium flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offwhite"
          >
            <FiPlus size={16} /> Add
          </button>
        </div>

        <section className="mb-14">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-offwhite/60 mb-4">Pending</h3>
          {pendingTodos.length === 0 ? (
            <div className="glass rounded-xl p-10 flex flex-col items-center gap-3 text-center text-offwhite/55 text-sm">
              <FiCoffee size={22} className="text-offwhite/40" />
              Nothing pending — add a task above or enjoy the quiet.
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              values={pendingTodos}
              onReorder={(newOrder) => {
                setTodos([...newOrder, ...completedTodos])
              }}
              className="space-y-3"
            >
              <AnimatePresence initial={false}>
                {pendingTodos.map((t) => (
                  <TodoItem
                    key={t.id}
                    todo={t}
                    onToggle={handleToggle}
                    onRemove={handleRemove}
                    onEdit={editTodo}
                    onToggleGoal={toggleTodoGoal}
                    onCyclePriority={cyclePriority}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>
          )}
        </section>

        <section className="mb-14">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-offwhite/60 mb-4">Completed</h3>
          {completedTodos.length === 0 ? (
            <p className="text-sm text-offwhite/55">Nothing completed yet.</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {completedTodos.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="glass rounded-xl px-5 py-4 flex items-center gap-4 opacity-70"
                  >
                    <input
                      type="checkbox"
                      checked={t.done}
                      onChange={() => handleToggle(t.id)}
                      className="accent-emerald-500 w-4 h-4"
                    />
                    <span className="flex-1 text-sm line-through text-offwhite/55">{t.text}</span>
                    <button
                      onClick={() => handleRemove(t.id)}
                      className="text-offwhite/60 hover:text-coral-500 p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
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

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <YearHeatmap />
        </motion.section>
      </div>

      <Toast toasts={toasts} />
    </div>
  )
}
