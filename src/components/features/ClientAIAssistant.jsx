import { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, X, Send, Bot, User, Loader2, RefreshCw, Wrench, Check, Ban } from 'lucide-react'
import { useClientAI } from '../../hooks/useClientAI'
import useGroupStore from '../../store/groupStore'
import { useGroups } from '../../hooks/useGroups'

// Human-readable summaries of what each write tool does

const SUGGESTIONS = [
  'How much did I spend this month?',
  'Show my recent orders',
  'Explain how GST works',
  'Add ₹500 grocery expense for today',
]

export default function ClientAIAssistant({ triggerRef }) {
  const [open, setOpen]         = useState(false)
  const [input, setInput]       = useState('')
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hi! I'm Aura — your AI assistant. Ask me anything: your spending, orders, inventory, vendors, invoices, or any general question. I'm here to help." }
  ])
  const [streamingText, setStreamingText] = useState('')
  const [activeToolLabel, setActiveToolLabel] = useState(null)
  const toolWasCalledRef = useRef(false)
  const [rateLimitSecs, setRateLimitSecs] = useState(0)
  const rateLimitTimer = useRef(null)
  // Pending write-tool confirmation
  const [pendingConfirm, setPendingConfirm] = useState(null) // { calls, resolve }
  const confirmResolveRef = useRef(null)

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  const groupId     = useGroupStore((s) => s.activeGroupId)
  const { data: groups = [] } = useGroups()
  const activeGroup = groups.find((g) => g._id === groupId)

  const MODEL_LABELS = {
    'gemini-3.1-flash-lite-preview': 'Gemini 3.1 Flash Lite',
    'gemini-3.5-flash':              'Gemini 3.5 Flash',
    'gemini-2.5-flash-lite':         'Gemini 2.5 Flash Lite',
    'gemini-2.5-flash':              'Gemini 2.5 Flash',
  }
  const modelId    = activeGroup?.aiModel || 'gemini-2.5-flash-lite'
  const modelLabel = MODEL_LABELS[modelId] || modelId

  const { ready, loading, error, init, sendMessage, reset } = useClientAI(groupId)

  useEffect(() => {
    if (open && groupId) init()
  }, [open, groupId, init])

  // Expose open handler to external trigger (e.g. BottomNav)
  useEffect(() => {
    if (triggerRef) triggerRef.current = () => setOpen(true)
  }, [triggerRef])

  // Reset session when groupId OR model changes so the new model is always used
  useEffect(() => {
    reset()
    setMessages([{ role: 'model', text: "Hi! I'm Aura — your AI assistant. Ask me anything: your spending, orders, inventory, vendors, invoices, or any general question. I'm here to help." }])
    setStreamingText('')
    setActiveToolLabel(null)
    if (open && groupId) setTimeout(() => init(), 50)
  }, [groupId, modelId, reset])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, activeToolLabel, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open, ready])

  // Start a countdown after a rate-limit hit
  const startRateLimitCountdown = useCallback((seconds) => {
    clearInterval(rateLimitTimer.current)
    setRateLimitSecs(seconds)
    rateLimitTimer.current = setInterval(() => {
      setRateLimitSecs((s) => {
        if (s <= 1) { clearInterval(rateLimitTimer.current); return 0 }
        return s - 1
      })
    }, 1000)
  }, [])

  useEffect(() => () => clearInterval(rateLimitTimer.current), [])

  if (!activeGroup?.aiEnabled) return null

  const handleConfirm = (confirmed) => {
    setPendingConfirm(null)
    confirmResolveRef.current?.(confirmed)
    confirmResolveRef.current = null
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading || rateLimitSecs > 0 || pendingConfirm) return
    setInput('')
    setStreamingText('')
    setActiveToolLabel(null)
    toolWasCalledRef.current = false

    setMessages((m) => [...m, { role: 'user', text }])

    try {
      const reply = await sendMessage(text, {
        onToken: (partial) => {
          setStreamingText(partial)
          setActiveToolLabel(null)
        },
        onToolCall: (label) => {
          toolWasCalledRef.current = true
          setStreamingText('')
          setActiveToolLabel(label)
        },
        onToolDone: () => {
          setActiveToolLabel(null)
        },
        onConfirm: (calls) => new Promise((resolve) => {
          confirmResolveRef.current = resolve
          setPendingConfirm({ calls })
        }),
        onRateLimit: (secs) => startRateLimitCountdown(secs),
      })
      setStreamingText('')
      setActiveToolLabel(null)
      if (reply) setMessages((m) => [...m, { role: 'model', text: reply }])
    } catch (err) {
      setStreamingText('')
      setActiveToolLabel(null)
      const msg = err?.message || 'Something went wrong. Please try again.'
      // Extract wait seconds from rate-limit message and start countdown
      const waitMatch = msg.match(/Try again in (\d+) seconds?/)
      if (waitMatch) startRateLimitCountdown(parseInt(waitMatch[1], 10))
      setMessages((m) => [...m, { role: 'model', text: msg }])
    }
  }

  const handleReset = () => {
    reset()
    setMessages([{ role: 'model', text: "Hi! I'm Aura — your AI assistant. Ask me anything: your spending, orders, inventory, vendors, invoices, or any general question. I'm here to help." }])
    setStreamingText('')
    setActiveToolLabel(null)
    setTimeout(() => init(), 50)
  }

  return (
    <>
      {/* Floating button — desktop only */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-zinc-900 text-white shadow-lg items-center justify-center hover:bg-zinc-700 active:scale-95 transition-all"
        title="AI Assistant"
      >
        <Sparkles size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-end md:items-end md:justify-end p-0 md:p-6 pointer-events-none">
          <div className="absolute inset-0 bg-black/20 md:hidden pointer-events-auto" onClick={() => setOpen(false)} />

          <div className="relative bg-white w-full md:w-96 md:max-w-full h-[75vh] md:h-[600px] rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 animate-[slideUp_0.2s_ease-out] pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-900 rounded-t-3xl md:rounded-t-2xl flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-white" />
                <span className="text-sm font-semibold text-white">Aura</span>
                <span className="text-xs text-zinc-400 ml-1">{modelLabel}</span>
                {ready && <span className="w-1.5 h-1.5 rounded-full bg-green-400 ml-1" title="Connected" />}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleReset} className="text-zinc-400 hover:text-white transition-colors" title="New conversation">
                  <RefreshCw size={15} />
                </button>
                <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mx-3 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex-shrink-0">
                {error}
              </div>
            )}

            {/* Connecting state */}
            {!ready && !error && (
              <div className="flex-1 flex items-center justify-center gap-2 text-zinc-400 text-sm">
                <Loader2 size={16} className="animate-spin" />
                Connecting…
              </div>
            )}

            {ready && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {m.role === 'model' && (
                        <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot size={13} className="text-white" />
                        </div>
                      )}
                      <div className={[
                        'max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap',
                        m.role === 'user'
                          ? 'bg-zinc-900 text-white rounded-br-md'
                          : 'bg-zinc-100 text-zinc-800 rounded-bl-md',
                      ].join(' ')}>
                        {m.text}
                      </div>
                      {m.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User size={13} className="text-zinc-600" />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Tool-calling indicator */}
                  {activeToolLabel && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot size={13} className="text-white" />
                      </div>
                      <div className="bg-zinc-100 rounded-2xl rounded-bl-md px-3 py-2 flex items-center gap-2">
                        <Wrench size={12} className="text-zinc-400 animate-pulse flex-shrink-0" />
                        <span className="text-xs text-zinc-500">{activeToolLabel}</span>
                      </div>
                    </div>
                  )}

                  {/* Streaming text bubble */}
                  {streamingText && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot size={13} className="text-white" />
                      </div>
                      <div className="max-w-[80%] rounded-2xl rounded-bl-md px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap bg-zinc-100 text-zinc-800">
                        {streamingText}
                        <span className="inline-block w-1 h-3.5 bg-zinc-400 ml-0.5 animate-pulse rounded-sm align-text-bottom" />
                      </div>
                    </div>
                  )}

                  {/* Write-confirm card */}
                  {pendingConfirm && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot size={13} className="text-white" />
                      </div>
                      <div className="max-w-[80%] bg-amber-50 border border-amber-200 rounded-2xl rounded-bl-md px-3 py-2.5 text-sm">
                        <p className="font-medium text-amber-900 mb-1.5">Confirm action{pendingConfirm.calls.length > 1 ? 's' : ''}:</p>
                        <ul className="space-y-0.5 mb-3">
                          {pendingConfirm.calls.map((call, i) => {
                            const label = call.name.replace(/_/g, ' ')
                            const detail = call.args?.name || call.args?.amount || call.args?.description || ''
                            return (
                              <li key={i} className="text-amber-800 text-xs">
                                • {label}{detail ? `: "${detail}"` : ''}
                              </li>
                            )
                          })}
                        </ul>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirm(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg hover:bg-zinc-700 active:scale-95 transition-all"
                          >
                            <Check size={12} /> Confirm
                          </button>
                          <button
                            onClick={() => handleConfirm(false)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 text-zinc-700 text-xs font-medium rounded-lg hover:border-zinc-400 active:scale-95 transition-all"
                          >
                            <Ban size={12} /> Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Thinking indicator (before first token or tool) */}
                  {loading && !streamingText && !activeToolLabel && !pendingConfirm && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
                        <Bot size={13} className="text-white" />
                      </div>
                      <div className="bg-zinc-100 rounded-2xl rounded-bl-md px-4 py-3">
                        <Loader2 size={15} className="animate-spin text-zinc-400" />
                      </div>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* Suggestions */}
                {messages.length <= 1 && (
                  <div className="px-4 pb-2 flex-shrink-0">
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTIONS.map((s) => (
                        <button key={s} onClick={() => setInput(s)}
                          className="text-xs bg-zinc-100 text-zinc-600 rounded-full px-3 py-1.5 hover:bg-zinc-200 active:bg-zinc-300 transition-colors text-left">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div
                  className="flex flex-col border-t border-zinc-100 flex-shrink-0"
                  style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
                >
                  <div className="flex items-center gap-2 px-3 py-3">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                      placeholder="Ask anything…"
                      disabled={rateLimitSecs > 0 || !!pendingConfirm}
                      className="flex-1 h-10 px-3 rounded-xl border border-zinc-200 text-sm outline-none focus:border-zinc-900 bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={send}
                      disabled={!input.trim() || loading || rateLimitSecs > 0 || !!pendingConfirm}
                      className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center disabled:opacity-40 active:bg-zinc-700 transition-colors flex-shrink-0"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
