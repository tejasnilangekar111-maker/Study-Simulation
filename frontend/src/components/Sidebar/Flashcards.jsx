import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { useSidebarStore } from '../../store/sidebarStore'

function Card({ card, onDelete }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div className="relative" style={{ perspective: 800 }}>
      <motion.div
        onClick={() => setFlipped((f) => !f)}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="h-20 rounded-lg bg-white/10 hover:bg-white/15 cursor-pointer relative"
      >
        <div
          className="absolute inset-0 flex items-center justify-center p-2 text-xs text-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {card.question}
        </div>
        <div
          className="absolute inset-0 flex items-center justify-center p-2 text-xs text-center text-emerald-500"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {card.answer}
        </div>
      </motion.div>
      <button
        onClick={() => onDelete(card.id)}
        className="absolute -top-1.5 -right-1.5 bg-walnut-900 rounded-full p-1 text-offwhite/60 hover:text-coral-500"
        aria-label="Delete flashcard"
      >
        <FiTrash2 size={10} />
      </button>
    </div>
  )
}

export default function Flashcards() {
  const flashcards = useSidebarStore((s) => s.flashcards)
  const addFlashcard = useSidebarStore((s) => s.addFlashcard)
  const removeFlashcard = useSidebarStore((s) => s.removeFlashcard)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  const submit = () => {
    if (!question.trim() || !answer.trim()) return
    addFlashcard(question.trim(), answer.trim())
    setQuestion('')
    setAnswer('')
  }

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-offwhite/60 mb-2">Flashcards</h4>
      <div className="grid grid-cols-2 gap-2 mb-2">
        {flashcards.map((c) => (
          <Card key={c.id} card={c} onDelete={removeFlashcard} />
        ))}
      </div>
      <div className="space-y-1.5">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Question"
          className="w-full bg-white/10 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-accent-blue"
        />
        <div className="flex gap-2">
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Answer"
            className="flex-1 bg-white/10 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-accent-blue"
          />
          <button onClick={submit} className="bg-white/10 hover:bg-white/20 rounded-lg px-2" aria-label="Add flashcard">
            <FiPlus size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
