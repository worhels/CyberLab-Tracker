export function EmptyState({ text }: { text: string }) {
  return (
    <div className="app-empty p-6 text-center text-sm">
      {text}
    </div>
  )
}
