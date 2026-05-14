import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { BlackHoleTaskCore } from './BlackHoleTaskCore'

export type AuthMode = 'login' | 'register'

function useDesktopScene() {
  const [canShowScene, setCanShowScene] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 900px) and (prefers-reduced-motion: no-preference)')
    const update = () => setCanShowScene(media.matches)

    update()
    media.addEventListener('change', update)

    return () => media.removeEventListener('change', update)
  }, [])

  return canShowScene
}

interface AuthShellProps {
  children: ReactNode
  mode: AuthMode
}

export function AuthShell({ children, mode }: AuthShellProps) {
  const canShowScene = useDesktopScene()

  return (
    <main className={`auth-shell auth-shell--${mode}`}>
      <section className="auth-visual" aria-hidden="true">
        {canShowScene ? <BlackHoleTaskCore mode={mode} /> : <div className="auth-visual-fallback" />}
      </section>
      <section className="auth-panel">{children}</section>
    </main>
  )
}
