import type { ReactNode } from 'react'
import { TriggerQuestion } from './TriggerQuestion'

export type AuthMode = 'login' | 'register'

interface AuthShellProps {
  children: ReactNode
  mode: AuthMode
  visual?: ReactNode
}

export function AuthShell({ children, mode, visual }: AuthShellProps) {
  return (
    <main className={`auth-shell auth-shell--${mode}`}>
      <section className="auth-visual" aria-hidden="true">
        {visual ?? <div className="auth-visual-fallback" />}
      </section>
      <TriggerQuestion />
      <section className="auth-panel">{children}</section>
    </main>
  )
}
