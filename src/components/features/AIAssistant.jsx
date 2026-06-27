import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Bot, User, Loader2 } from 'lucide-react'
import { useChat } from '../../hooks/useAI'
import useGroupStore from '../../store/groupStore'
import { useGroups } from '../../hooks/useGroups'

export default function AIAssistant() {
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hi! I'm your AI assistant. Ask me anything about your spending, products, or orders." }
  ])
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)
  const groupId   = useGroupStore((s) => s.activeGroupId)
  const { data: groups = [] } = useGroups()
  const activeGroup = groups.find((g) => g._id === groupId)
  const { mutate: sendChat, isPending } = useChat()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  if (!activeGroup?.aiEnabled) return null

  const send = () => {
    const text = input.trim()
    if (!text || isPending) return
    setInput('')

    const userMsg = { role: 'user', text }
    setMessages((m) => [...m, userMsg])

    // Build history in Gemini format (exclude welcome msg and error messages)
    const history = messages
      .slice(1)
      .filter((m) => m.text?.trim() && (m.role === 'user' || m.role === 'model'))
      .map((m) => ({ role: m.role, parts: [{ text: m.text }] }))

    sendChat({ groupId, message: text, history }, {
      onSuccess: (res) => setMessages((m) => [...m, { role: 'model', text: res?.data?.reply || res?.reply || '' }]),
      onError: (err) => {
        const msg = err?.response?.data?.error || err?.message || ''
        setMessages((m) => [...m, { role: 'model', text: msg || 'Something went wrong. Please try again.' }])
      },
    })
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-12 h-12 rounded-full bg-zinc-900 text-white shadow-lg flex items-center justify-center hover:bg-zinc-700 active:scale-95 transition-all"
        title="AI Assistant"
      >
        <Sparkles size={20} />
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-end md:items-end md:justify-end p-0 md:p-6">
          {/* Backdrop (mobile only) */}
          <div className="absolute inset-0 bg-black/20 md:hidden" onClick={() => setOpen(false)} />

          <div className="relative bg-white w-full md:w-96 md:max-w-full h-[75vh] md:h-[600px] rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 animate-[slideUp_0.2s_ease-out]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-900 rounded-t-3xl md:rounded-t-2xl flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-white" />
                <span className="text-sm font-semibold text-white">AI Assistant</span>
                <span className="text-xs text-zinc-400 ml-1">powered by Gemini</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

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
              {isPending && (
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
                  {[
                    'How much did I spend this month?',
                    'What are my top spending categories?',
                    'Show me my most ordered products',
                    'Any tips to save money?',
                  ].map((s) => (
                    <button key={s} onClick={() => { setInput(s) }}
                      className="text-xs bg-zinc-100 text-zinc-600 rounded-full px-3 py-1.5 hover:bg-zinc-200 active:bg-zinc-300 transition-colors text-left">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-zinc-100 flex-shrink-0" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask anything…"
                className="flex-1 h-10 px-3 rounded-xl border border-zinc-200 text-sm outline-none focus:border-zinc-900 bg-zinc-50"
              />
              <button
                onClick={send}
                disabled={!input.trim() || isPending}
                className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center disabled:opacity-40 active:bg-zinc-700 transition-colors flex-shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
