import { useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { useSidebarStore } from '../../store/sidebarStore'

export default function TodoList() {
  const todos = useSidebarStore((s) => s.todos)
  const addTodo = useSidebarStore((s) => s.addTodo)
  const toggleTodo = useSidebarStore((s) => s.toggleTodo)
  const removeTodo = useSidebarStore((s) => s.removeTodo)
  const [text, setText] = useState('')

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    addTodo(trimmed)
    setText('')
  }

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-offwhite/60 mb-2">To-Do List</h4>
      <div className="flex gap-2 mb-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Add a task…"
          className="flex-1 bg-white/10 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-accent-blue"
        />
        <button onClick={submit} className="bg-white/10 hover:bg-white/20 rounded-lg px-2" aria-label="Add task">
          <FiPlus size={16} />
        </button>
      </div>
      <ul className="space-y-1 max-h-40 overflow-y-auto">
        {todos.map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-sm group">
            <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} className="accent-emerald-500" />
            <span className={`flex-1 ${t.done ? 'line-through text-offwhite/40' : ''}`}>{t.text}</span>
            <button
              onClick={() => removeTodo(t.id)}
              className="opacity-0 group-hover:opacity-100 text-offwhite/50 hover:text-coral-500 transition-opacity"
              aria-label="Delete task"
            >
              <FiTrash2 size={14} />
            </button>
          </li>
        ))}
        {todos.length === 0 && <li className="text-xs text-offwhite/40">No tasks yet.</li>}
      </ul>
    </div>
  )
}
