import { useState } from 'react'
import { timeOfDayGreeting } from '../lib/format'
import { CHAT_MODELS } from '../lib/models'

interface GreetingHeaderProps {
  isPremium: boolean
  model: string
  onModelChange: (model: string) => void
}

/** Greeting, plan pill, and the AI model settings popover. */
export function GreetingHeader({
  isPremium,
  model,
  onModelChange,
}: GreetingHeaderProps) {
  const [open, setOpen] = useState(false)
  const greeting = timeOfDayGreeting()

  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, Sarah
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Here's what your ingredient costs are doing to your margins.
        </p>
      </div>
      <div className="relative flex flex-none items-center gap-2">
        <span className="rounded-full border border-gray-800 bg-gray-900 px-2.5 py-0.5 text-xs font-semibold text-gray-400">
          {isPremium ? 'Pro plan' : 'Free plan'}
        </span>
        <button
          type="button"
          aria-label="AI model settings"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-800 bg-gray-900 text-base text-gray-100 hover:border-gray-700"
          onClick={() => setOpen((value) => !value)}
        >
          ⚙
        </button>
        {open && (
          <div className="absolute right-0 top-11 z-10 w-80 rounded-xl border border-gray-800 bg-gray-900 p-4">
            <h3 className="text-sm font-semibold text-gray-100">AI model</h3>
            <p className="mt-0.5 mb-2.5 text-xs text-gray-400">
              Choose which OpenRouter model reads the chat.
            </p>
            <div className="flex flex-col gap-2 text-sm">
              {CHAT_MODELS.map((option) => (
                <label key={option.id} className="flex cursor-pointer items-start gap-2">
                  <input
                    type="radio"
                    name="model"
                    value={option.id}
                    checked={model === option.id}
                    onChange={() => onModelChange(option.id)}
                    className="mt-1"
                  />
                  <span className="text-gray-100">
                    {option.label}
                    <code className="block font-mono text-xs text-gray-500">
                      {option.id}
                    </code>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
