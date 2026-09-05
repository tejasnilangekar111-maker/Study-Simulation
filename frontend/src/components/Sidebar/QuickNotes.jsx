import { useSidebarStore } from '../../store/sidebarStore'

export default function QuickNotes() {
  const notes = useSidebarStore((s) => s.notes)
  const setNotes = useSidebarStore((s) => s.setNotes)

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-offwhite/60 mb-2">Quick Notes</h4>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Jot something down…"
        rows={4}
        className="w-full bg-white/10 rounded-lg px-2 py-1.5 text-sm outline-none resize-none focus:ring-1 focus:ring-accent-blue"
      />
    </div>
  )
}
