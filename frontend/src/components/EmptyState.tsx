export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
      {text}
    </div>
  )
}
