import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, X } from 'lucide-react'
import { MentorApiError, streamMentorChat } from '../../services/mentorApi'
import type { Language } from '../../types'
import {
  createMentorTextFile,
  extractMentorGeneratedFiles,
  isMentorFileRequest,
  saveMentorGeneratedFile,
  type MentorGeneratedFile,
} from '../../utils/mentorFiles'
import { getErrorMessage } from '../../utils/errors'
import { translate } from '../../utils/i18n'
import type { TranslationKey } from '../../utils/i18n'
import { MentorGeneratedFileCard } from './MentorGeneratedFileCard'

interface MentorPanelProps {
  isOpen: boolean
  page: string
  language: Language
  subjectId?: number
  taskId?: number
  onClose: () => void
}

interface MentorMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  files?: MentorGeneratedFile[]
  isError?: boolean
}

type MentorConnectionStatus = 'ready' | 'offline'

const quickPrompts: TranslationKey[] = [
  'mentor.quick.activeLabs',
  'mentor.quick.urgent',
  'mentor.quick.deadlines',
  'mentor.quick.accepted',
]

export function MentorPanel({
  isOpen,
  page,
  language,
  subjectId,
  taskId,
  onClose,
}: MentorPanelProps) {
  const [messages, setMessages] = useState<MentorMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<MentorConnectionStatus>('ready')
  const [sessionId, setSessionId] = useState<string>()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const contextKey = `${page}:${subjectId ?? ''}:${taskId ?? ''}`
  const t = (key: TranslationKey) => translate(language, key)
  const visibleStatus = isSending ? 'thinking' : connectionStatus
  const statusLabel = t(`mentor.status.${visibleStatus}` as TranslationKey)
  const contextTarget = taskId
    ? `#${taskId}`
    : subjectId
      ? `#${subjectId}`
      : t('workspace')
  const contextLabel = `${language.toUpperCase()} · ${contextTarget}`

  useEffect(() => {
    if (!isOpen) return

    inputRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }
  }, [isOpen, isSending, messages])

  useEffect(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setMessages([])
    setSessionId(undefined)
    setIsSending(false)
    setConnectionStatus('ready')
  }, [contextKey])

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  const sendMessage = async (rawMessage: string) => {
    const message = rawMessage.trim()
    if (!message || isSending) return

    const assistantMessageId = crypto.randomUUID()
    const expectsFile = isMentorFileRequest(message)
    const controller = new AbortController()
    abortControllerRef.current = controller
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: 'user', content: message },
      { id: assistantMessageId, role: 'assistant', content: '' },
    ])
    setInput('')
    setIsSending(true)
    setConnectionStatus('ready')

    let bufferedTokens = ''
    let animationFrameId: number | null = null
    const flushTokens = () => {
      animationFrameId = null
      if (!bufferedTokens) return
      const contentToAppend = bufferedTokens
      bufferedTokens = ''
      setMessages((current) => current.map((item) => (
        item.id === assistantMessageId
          ? { ...item, content: item.content + contentToAppend }
          : item
      )))
    }

    try {
      const response = await streamMentorChat(
        {
          message,
          page,
          session_id: sessionId,
          subject_id: subjectId,
          task_id: taskId,
          language,
        },
        (token) => {
          bufferedTokens += token
          if (animationFrameId === null) {
            animationFrameId = window.requestAnimationFrame(flushTokens)
          }
        },
        controller.signal,
      )
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
        flushTokens()
      }
      setSessionId(response.session_id)

      if (expectsFile) {
        const extractedFiles = extractMentorGeneratedFiles(response.answer)
        const files = extractedFiles.length > 0
          ? extractedFiles
          : [createMentorTextFile(response.answer)]
        setMessages((current) => current.map((item) => (
          item.id === assistantMessageId ? { ...item, files } : item
        )))
      }
    } catch (error) {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }
      if (controller.signal.aborted) {
        setMessages((current) => current.filter((item) => item.id !== assistantMessageId))
        return
      }

      const isOffline = error instanceof MentorApiError && error.status === 503
      setConnectionStatus(isOffline ? 'offline' : 'ready')
      setMessages((current) => current.map((item) => (
        item.id === assistantMessageId
          ? {
              ...item,
              content: isOffline ? t('mentor.error.offline') : getErrorMessage(error),
              isError: true,
            }
          : item
      )))
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
        setIsSending(false)
      }
    }
  }

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage(input)
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.aside
          id="cyberlab-mentor-panel"
          aria-label={t('mentor.title')}
          initial={{ opacity: 0, x: 32, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 32, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-2 right-2 top-2 z-50 flex max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-[var(--r-lg)] border border-[var(--panel-border)] bg-[var(--surface)] text-[var(--text-main)] shadow-[var(--shadow-lg)]"
          style={{
            width: 'clamp(360px, 36vw, 500px)',
            backdropFilter: 'var(--surface-blur)',
          }}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--panel-border)] px-5 py-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">{t('mentor.title')}</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--panel-border)] bg-[var(--surface-soft)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: visibleStatus === 'offline'
                        ? 'var(--accent-debt)'
                        : visibleStatus === 'thinking'
                          ? 'var(--accent-high)'
                          : 'var(--accent-ok)',
                    }}
                    animate={visibleStatus === 'thinking' ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }}
                    transition={{ duration: 0.9, repeat: visibleStatus === 'thinking' ? Infinity : 0 }}
                  />
                  {statusLabel}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                {t('mentor.subtitle')}
              </p>
            </div>
            <button
              type="button"
              aria-label={t('mentor.action.close')}
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--panel-border)] bg-[var(--surface-soft)] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-main)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
            >
              <X size={17} />
            </button>
          </header>

          <div
            className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5"
            aria-live="polite"
            aria-busy={isSending}
          >
            {messages.length === 0 ? (
              <div className="rounded-[var(--r-md)] border border-dashed border-[var(--panel-border)] bg-[var(--surface-soft)] px-4 py-5 text-sm leading-6 text-[var(--text-muted)]">
                {t('mentor.empty')}
              </div>
            ) : null}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`${message.role === 'user' ? 'max-w-[88%]' : 'w-full max-w-[92%]'} space-y-2`}>
                  <div
                    className="whitespace-pre-wrap break-words rounded-[var(--r-md)] px-3.5 py-3 text-sm leading-6"
                    style={
                      message.role === 'user'
                        ? {
                            color: 'var(--active-text)',
                            background: 'var(--active)',
                            boxShadow: 'var(--shadow-sm)',
                          }
                        : {
                            color: message.isError ? 'var(--accent-debt)' : 'var(--text-main)',
                            background: 'var(--surface-soft)',
                            border: '1px solid var(--panel-border)',
                          }
                    }
                  >
                    {message.content || (
                      <span className="flex items-center gap-1.5 py-1" aria-label={t('mentor.status.thinking')}>
                        {[0, 1, 2].map((index) => (
                          <motion.span
                            key={index}
                            className="h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]"
                            animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }}
                            transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.14 }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                  {message.files?.map((file) => (
                    <MentorGeneratedFileCard
                      key={file.id}
                      file={file}
                      language={language}
                      onDownload={() => saveMentorGeneratedFile(file)}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={submitMessage}
            className="shrink-0 border-t border-[var(--panel-border)] bg-[var(--surface-soft)]/50 p-4"
          >
            <div className="mb-2 flex flex-wrap gap-1.5" aria-label={t('mentor.title')}>
              {quickPrompts.map((promptKey) => (
                <button
                  key={promptKey}
                  type="button"
                  disabled={isSending}
                  onClick={() => void sendMessage(t(promptKey))}
                  className="rounded-full border border-[var(--panel-border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-muted)] transition hover:border-[rgba(var(--accent-primary-rgb),0.4)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-main)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t(promptKey)}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2 rounded-[var(--r-md)] border border-[var(--panel-border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-inset-sm)] focus-within:border-[rgba(var(--accent-primary-rgb),0.48)]">
              <textarea
                ref={inputRef}
                value={input}
                maxLength={10_000}
                rows={1}
                aria-label={t('mentor.placeholder')}
                placeholder={t('mentor.placeholder')}
                disabled={isSending}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    event.currentTarget.form?.requestSubmit()
                  }
                }}
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-[var(--text-main)] outline-none placeholder:text-[var(--text-faint)] disabled:opacity-60"
              />
              <button
                type="submit"
                aria-label={t('mentor.action.send')}
                disabled={!input.trim() || isSending}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-[var(--shadow-active)] transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              >
                <Send size={17} />
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
              <span className="truncate">{t('mentor.context')}: {contextLabel}</span>
              <span className="shrink-0">{t('mentor.hint.send')}</span>
            </div>
          </form>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
