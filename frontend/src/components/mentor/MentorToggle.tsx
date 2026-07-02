import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Language } from '../../types'
import type { MentorMode } from '../../types/mentor'
import { MentorPanel } from './MentorPanel'

interface MentorToggleProps {
  page: string
  language: Language
  subjectId?: number
  taskId?: number
}

const MENTOR_OPEN_KEY = 'cyberlab_mentor_open'
const MENTOR_MODE_KEY = 'cyberlab_mentor_mode'
const mentorModes: MentorMode[] = ['lab', 'code', 'report', 'deadline', 'chat']

function readStoredOpenState(): boolean {
  try {
    return localStorage.getItem(MENTOR_OPEN_KEY) === 'true'
  } catch {
    return false
  }
}

function readStoredMode(): MentorMode {
  try {
    const storedMode = localStorage.getItem(MENTOR_MODE_KEY)
    return mentorModes.includes(storedMode as MentorMode) ? (storedMode as MentorMode) : 'lab'
  } catch {
    return 'lab'
  }
}

function storeMentorPreference(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // The mentor remains usable when browser storage is unavailable.
  }
}

export function MentorToggle({
  page,
  language,
  subjectId,
  taskId,
}: MentorToggleProps) {
  const [isOpen, setIsOpen] = useState(readStoredOpenState)
  const [mode, setMode] = useState<MentorMode>(readStoredMode)

  useEffect(() => {
    storeMentorPreference(MENTOR_OPEN_KEY, String(isOpen))
  }, [isOpen])

  useEffect(() => {
    storeMentorPreference(MENTOR_MODE_KEY, mode)
  }, [mode])

  const closePanel = useCallback(() => setIsOpen(false), [])

  return (
    <>
      <motion.div
        className={`fixed bottom-5 z-[60] ${isOpen ? 'max-sm:hidden' : ''}`}
        style={{
          right: isOpen ? 'calc(clamp(360px, 34vw, 460px) + 24px)' : '20px',
        }}
        initial={false}
        animate={{ scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.button
          type="button"
          aria-label={isOpen ? 'Close CyberLab Mentor' : 'Open CyberLab Mentor'}
          aria-controls="cyberlab-mentor-panel"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="group relative grid h-16 w-16 place-items-center rounded-[44%_56%_48%_52%/53%_42%_58%_47%] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-primary)]"
          whileHover={{ scale: 1.08, rotate: [0, -3, 3, 0] }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <span
            aria-hidden="true"
            className="absolute inset-[-5px] rounded-[inherit] opacity-75 blur-[9px] transition duration-300 group-hover:opacity-100 group-hover:blur-[12px]"
            style={{
              background:
                'conic-gradient(from 210deg, rgba(61, 232, 255, 0.95), rgba(141, 88, 255, 0.95), rgba(var(--accent-primary-rgb), 0.95), rgba(61, 232, 255, 0.95))',
            }}
          />
          <span className="absolute inset-0 rounded-[inherit] bg-black shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_28px_rgba(0,0,0,0.48)]" />
          <svg
            aria-hidden="true"
            viewBox="0 0 64 64"
            className="relative h-12 w-12 overflow-visible"
          >
            <path d="M15 24 18 9l12 10h5L47 9l2 16c4 4 6 9 6 15 0 11-10 17-23 17S9 51 9 40c0-6 2-12 6-16Z" fill="#050505" />
            <ellipse cx="24" cy="34" rx="5.5" ry="7" fill="#fff" />
            <ellipse cx="41" cy="34" rx="5.5" ry="7" fill="#fff" />
            <ellipse cx="25" cy="36" rx="2" ry="3" fill="#111" />
            <ellipse cx="40" cy="36" rx="2" ry="3" fill="#111" />
            <path d="M29 45c2 1.8 4 1.8 7 0" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="2" opacity=".8" />
          </svg>
        </motion.button>
      </motion.div>

      <MentorPanel
        isOpen={isOpen}
        mode={mode}
        page={page}
        language={language}
        subjectId={subjectId}
        taskId={taskId}
        onClose={closePanel}
        onModeChange={setMode}
      />
    </>
  )
}
