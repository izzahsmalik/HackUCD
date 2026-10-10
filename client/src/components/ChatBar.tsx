import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'
import { askQuestion } from '../api/query'

const CHIPS = [
  'What needs attention today?',
  'If chocolate rises 15%, which bakes need repricing?',
  'What if butter goes up 12% in 6 months?',
  'What if it doubles?',
]

interface ChatBarProps {
  model: string
  /** When false the input is replaced by the Pro upsell. */
  isPremium: boolean
  onUpgrade: () => void
}

type Reply = { text: string; model: string } | { error: string } | null

/** Fixed bottom chat bar: suggestion chips, ⌘K focus, and the AI reply. */
export function ChatBar({ model, isPremium, onUpgrade }: ChatBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [reply, setReply] = useState<Reply>(null)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function ask(question: string) {
    const trimmed = question.trim()
    if (!trimmed || busy) return
    setText('')
    setBusy(true)
    try {
      const { answer } = await askQuestion(trimmed, model)
      setReply({ text: answer, model })
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        // Guard rejection: offer the upgrade path instead of an error.
        setReply({ error: '__upsell__' })
      } else {
        setReply({
          error:
            error instanceof ApiError
              ? error.message
              : 'Could not reach the server',
        })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-gray-800 bg-gray-900">
      <div className="mx-auto max-w-4xl px-5 pb-3 pt-3">
        <div aria-live="polite">
          {reply !== null &&
            ('error' in reply ? (
              reply.error === '__upsell__' ? (
                <div className="mb-2.5 rounded border border-gray-800 border-l-4 border-l-indigo-600 bg-gray-950 px-3.5 py-2.5 text-sm text-gray-300">
                  Chat is a Pro feature — your free diagnosis always stays
                  visible.{' '}
                  <button
                    type="button"
                    className="font-semibold text-indigo-400 hover:text-indigo-300"
                    onClick={onUpgrade}
                  >
                    Upgrade to Pro
                  </button>
                </div>
              ) : (
                <div className="mb-2.5 rounded border border-red-900 bg-gray-950 px-3.5 py-2.5 text-sm text-red-400">
                  {reply.error}
                </div>
              )
            ) : (
              <div className="mb-2.5 rounded border border-gray-800 border-l-4 border-l-indigo-600 bg-gray-950 px-3.5 py-2.5 text-sm text-gray-300">
                {reply.text}
                <small className="mt-1.5 block text-xs text-gray-500">
                  Answered by {reply.model} via OpenRouter.
                </small>
              </div>
            ))}
        </div>

        {isPremium ? (
          <>
            <div className="mb-2.5 flex gap-2 overflow-x-auto pb-0.5">
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="flex-none rounded-full border border-gray-700 bg-transparent px-3 py-1.5 text-[13px] text-gray-300 hover:border-indigo-600 hover:text-gray-100"
                  onClick={() => {
                    setText(chip)
                    void ask(chip)
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-950 p-1 pl-3 focus-within:border-indigo-600">
              <kbd className="rounded border border-gray-800 bg-gray-900 px-1.5 py-0.5 font-mono text-[11px] text-gray-500">
                ⌘K
              </kbd>
              <input
                ref={inputRef}
                type="text"
                value={text}
                placeholder="Ask a question or run a what-if…"
                aria-label="Ask MarginGuard"
                className="min-w-0 flex-1 bg-transparent px-1.5 py-2 text-sm text-gray-100 outline-none"
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void ask(text)
                }}
              />
              <button
                type="button"
                disabled={busy}
                className="rounded-md bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void ask(text)}
              >
                {busy ? 'Thinking…' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-gray-400">
            <span>
              Chat is a Pro feature — your free diagnosis always stays visible.
            </span>
            <button
              type="button"
              className="flex-none rounded-md bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-indigo-500"
              onClick={onUpgrade}
            >
              Upgrade to Pro
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
