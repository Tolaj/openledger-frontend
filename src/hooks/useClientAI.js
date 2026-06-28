import { useState, useCallback, useRef } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getKeyAndContext } from '../api/clientAi'
import { TOOL_DECLARATIONS, runTool } from '../lib/geminiTools'

const DEFAULT_MODEL = 'gemini-2.5-flash-lite'

// Converts raw Gemini SDK errors into clean user-facing messages
export function cleanGeminiError(err) {
  const raw = err?.message || String(err) || ''
  console.error('[Ledger AI error]', raw)

  if (raw.includes('429') || raw.includes('quota') || raw.includes('Too Many Requests')) {
    const isDaily = raw.includes('PerDay') || raw.includes('per_day') || raw.includes('requests_per_day')
    if (isDaily) {
      return 'Daily request limit reached for this model. Switch to a different model in Settings → AI to continue.'
    }
    const retryMatch = raw.match(/retry[^\d]*([\d.]+)s/i) || raw.match(/retryDelay[^"]*"([\d.]+)s"/i)
    const wait = retryMatch ? `Try again in ${Math.ceil(parseFloat(retryMatch[1]))} seconds.` : 'Try again in a moment.'
    return `Rate limit exceeded. ${wait} Switch to a different model in Settings → AI if this keeps happening.`
  }

  if (raw.includes('403') || raw.includes('API_KEY') || raw.includes('Forbidden') || raw.includes('unregistered callers')) {
    return 'Invalid or missing Gemini API key. Go to Settings → AI and check your key.'
  }

  if (raw.includes('404') || raw.includes('not found for API version')) {
    return 'Gemini model unavailable. The model may have changed — contact support.'
  }

  if (raw.includes('503') || raw.includes('high demand') || raw.includes('overloaded') || raw.includes('unavailable')) {
    return 'Gemini is under high demand right now. Please wait a moment and try again.'
  }

  if (raw.includes('500') || raw.includes('Internal')) {
    return 'Gemini returned a server error. Please try again.'
  }

  if (raw === 'AI session not initialised') {
    return 'AI is still connecting. Please wait a moment and try again.'
  }

  // Unknown error — show trimmed actual message so it's debuggable
  return raw.length > 0 ? raw.slice(0, 300) : 'Something went wrong. Please try again.'
}

const SYSTEM_PROMPT = (context) => `You are Aura, a smart AI assistant inside OpenLedger (finance & inventory app). Today: ${new Date().toISOString().slice(0, 10)}. Currency: ${context.split('\n')[0]?.replace('Currency: ', '') || 'INR'}.

You answer ANY question — general knowledge, coding, science, advice — AND manage the user's app data using tools.

TOOL USE RULES (follow exactly):
1. User asks to DO something with app data → call the right tool immediately. No asking for confirmation, no preamble.
2. "place order / create order / add order" → call get_products first (to find product id), then immediately call create_order. Do NOT stop between steps.
3. "show / list / how many / what" → call the relevant GET tool, then answer directly. Never ask "what would you like to do?"
4. Never call multiple unneeded tools. One tool per step.
5. After writes: one sentence confirmation.

FORMAT RULES:
- Dates: YYYY-MM-DD
- Order/wishlist prices: strings ("500.00"). PO/invoice prices: numbers.
- Order names: "order-XXXX" (random 4 digits) unless user specifies.
- Orders: use splitType "equal", omit splitAmong (defaults to all members).

App snapshot: ${context}`

// Tools that mutate data — require user confirmation before running
const WRITE_TOOLS = new Set([
  'create_finance_entry','update_finance_entry','delete_finance_entry',
  'create_order','delete_order',
  'create_product','update_product','delete_product',
  'create_category','delete_category',
  'create_budget','update_budget','delete_budget',
  'create_stock_adjustment',
  'create_wishlist','delete_wishlist',
  'create_recurring','update_recurring','delete_recurring',
  'create_recipient','update_recipient','delete_recipient',
  'create_general_order','update_general_order','delete_general_order',
  'create_general_invoice','update_general_invoice','delete_general_invoice',
  'create_vendor','update_vendor','delete_vendor',
  'create_customer','update_customer','delete_customer',
  'create_purchase_order','update_purchase_order','delete_purchase_order',
  'create_sales_order','update_sales_order','delete_sales_order',
  'create_purchase_invoice','update_purchase_invoice','delete_purchase_invoice',
  'create_sales_invoice','update_sales_invoice','delete_sales_invoice',
  'create_grn','delete_grn',
  'create_delivery','delete_delivery',
])

// Human-readable labels shown in the chat UI while tools run
const TOOL_LABELS = {
  get_spending_summary:    'Fetching spending summary…',
  get_finance_entries:     'Fetching transactions…',
  create_finance_entry:    'Recording transaction…',
  update_finance_entry:    'Updating transaction…',
  delete_finance_entry:    'Deleting transaction…',
  get_orders:              'Fetching orders…',
  create_order:            'Creating order…',
  delete_order:            'Deleting order…',
  get_products:            'Fetching products…',
  create_product:          'Creating product…',
  update_product:          'Updating product…',
  delete_product:          'Deleting product…',
  get_categories:          'Fetching categories…',
  create_category:         'Creating category…',
  delete_category:         'Deleting category…',
  get_budgets:             'Fetching budgets…',
  create_budget:           'Creating budget…',
  update_budget:           'Updating budget…',
  delete_budget:           'Deleting budget…',
  get_inventory:           'Fetching inventory…',
  get_stock_movements:     'Fetching stock history…',
  create_stock_adjustment: 'Adjusting stock…',
  get_wishlists:           'Fetching wishlists…',
  create_wishlist:         'Creating wishlist…',
  delete_wishlist:         'Deleting wishlist…',
  get_recurring:           'Fetching recurring schedules…',
  create_recurring:        'Creating recurring schedule…',
  update_recurring:        'Updating recurring schedule…',
  delete_recurring:        'Deleting recurring schedule…',
  get_recipients:          'Fetching recipients…',
  create_recipient:        'Creating recipient…',
  update_recipient:        'Updating recipient…',
  delete_recipient:        'Deleting recipient…',
  get_general_orders:      'Fetching general orders…',
  create_general_order:    'Creating general order…',
  update_general_order:    'Updating general order…',
  delete_general_order:    'Deleting general order…',
  get_general_invoices:    'Fetching general invoices…',
  create_general_invoice:  'Creating general invoice…',
  update_general_invoice:  'Updating general invoice…',
  delete_general_invoice:  'Deleting general invoice…',
  get_vendors:             'Fetching vendors…',
  create_vendor:           'Creating vendor…',
  update_vendor:           'Updating vendor…',
  delete_vendor:           'Deleting vendor…',
  get_customers:           'Fetching customers…',
  create_customer:         'Creating customer…',
  update_customer:         'Updating customer…',
  delete_customer:         'Deleting customer…',
  get_purchase_orders:     'Fetching purchase orders…',
  create_purchase_order:   'Creating purchase order…',
  update_purchase_order:   'Updating purchase order…',
  delete_purchase_order:   'Deleting purchase order…',
  get_sales_orders:        'Fetching sales orders…',
  create_sales_order:      'Creating sales order…',
  update_sales_order:      'Updating sales order…',
  delete_sales_order:      'Deleting sales order…',
  get_purchase_invoices:   'Fetching purchase invoices…',
  create_purchase_invoice: 'Creating purchase invoice…',
  update_purchase_invoice: 'Updating purchase invoice…',
  delete_purchase_invoice: 'Deleting purchase invoice…',
  get_sales_invoices:      'Fetching sales invoices…',
  create_sales_invoice:    'Creating sales invoice…',
  update_sales_invoice:    'Updating sales invoice…',
  delete_sales_invoice:    'Deleting sales invoice…',
  get_grns:                'Fetching GRNs…',
  create_grn:              'Recording goods receipt…',
  delete_grn:              'Deleting GRN…',
  get_deliveries:          'Fetching deliveries…',
  create_delivery:         'Recording delivery…',
  delete_delivery:         'Deleting delivery…',
}

// Manages a persistent Gemini chat session with full tool calling support.
export function useClientAI(groupId) {
  const [ready,      setReady]      = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [toolStatus, setToolStatus] = useState(null)
  const [error,      setError]      = useState(null)

  const sessionRef     = useRef(null)
  const initGroupIdRef = useRef(null)
  const groupIdRef     = useRef(groupId)
  groupIdRef.current   = groupId
  const apiKeyRef      = useRef(null)
  const modelIdRef     = useRef(DEFAULT_MODEL)

  const init = useCallback(async () => {
    if (!groupId) return
    if (initGroupIdRef.current === groupId && sessionRef.current) return

    setReady(false)
    setError(null)
    try {
      const res = await getKeyAndContext(groupId)
      const { apiKey, model: modelId, context } = res.data
      apiKeyRef.current  = apiKey
      modelIdRef.current = modelId || DEFAULT_MODEL

      const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
        model: modelId || DEFAULT_MODEL,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
      })

      sessionRef.current = model.startChat({
        history: [
          { role: 'user',  parts: [{ text: SYSTEM_PROMPT(context) }] },
          { role: 'model', parts: [{ text: "Got it! I'm Aura — ready to help with anything, whether it's your app data or a general question. What's on your mind?" }] },
        ],
      })
      initGroupIdRef.current = groupId
      setReady(true)
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to initialise AI')
    }
  }, [groupId])

  // Sends a message and runs the agentic loop until Gemini gives a final text answer.
  // onToken(fullTextSoFar) — stream tokens
  // onToolCall(label)      — a tool is executing (including rate-limit waits)
  // onToolDone()           — all tools done, about to stream final answer
  const sendMessage = useCallback(async (text, { onToken, onToolCall, onToolDone, onConfirm, onRateLimit } = {}) => {
    if (!sessionRef.current) throw new Error('AI session not initialised')
    setLoading(true)
    setToolStatus(null)

    // Wraps sendMessageStream with a single automatic 429 retry.
    // If the retry also 429s, throws immediately — don't keep looping.
    const sendWithRetry = async (messageOrParts) => {
      try {
        return await sessionRef.current.sendMessageStream(messageOrParts)
      } catch (err) {
        const raw = err?.message || ''
        const is429 = raw.includes('429') || raw.includes('quota') || raw.includes('Too Many Requests')
        if (!is429) throw err

        // Daily quota exhausted — retry won't help, throw immediately
        const isDaily = raw.includes('PerDay') || raw.includes('per_day') || raw.includes('requests_per_day')
        if (isDaily) throw err

        const retryMatch = raw.match(/retry[^\d]*([\d.]+)s/i)
        const waitSecs   = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60

        // Surface countdown to the UI amber bar immediately
        onRateLimit?.(waitSecs)

        // Count down in the tool indicator too
        for (let s = waitSecs; s > 0; s--) {
          const label = `Rate limited — retrying in ${s}s…`
          setToolStatus(label)
          onToolCall?.(label)
          await new Promise((r) => setTimeout(r, 1000))
        }
        setToolStatus(null)

        // Single retry — if this also 429s, let it throw to the UI
        return await sessionRef.current.sendMessageStream(messageOrParts)
      }
    }

    try {
      // First turn: use streaming so the user sees tokens arriving in real time
      const firstResult = await sendWithRetry(text)
      let streamedText = ''
      for await (const chunk of firstResult.stream) {
        const token = chunk.text?.() || ''
        if (token) { streamedText += token; onToken?.(streamedText) }
      }
      const firstResponse = await firstResult.response
      let pendingCalls = firstResponse.functionCalls?.() || []

      // No tool calls on the first turn — we're done
      if (!pendingCalls.length) {
        onToolDone?.()
        return streamedText || firstResponse.text?.() || ''
      }

      // Agentic loop — switch to non-streaming sendMessage for tool-result rounds.
      // sendMessageStream returns empty chunks after function responses on
      // gemini-2.5-flash-lite; sendMessage's response.text() is always reliable.
      while (pendingCalls.length) {
        // Check if any pending call is a write operation
        const writeCalls = pendingCalls.filter((c) => WRITE_TOOLS.has(c.name))
        if (writeCalls.length && onConfirm) {
          const confirmed = await onConfirm(writeCalls)
          if (!confirmed) {
            // User cancelled — tell Gemini and let it respond
            const cancelParts = pendingCalls.map((call) => ({
              functionResponse: { name: call.name, response: { cancelled: true, message: 'User cancelled this operation.' } }
            }))
            setToolStatus(null)
            const cancelRes = await sessionRef.current.sendMessage(cancelParts)
            onToolDone?.()
            const cancelText = cancelRes.response.text?.() || 'Cancelled.'
            for (let i = 0; i < cancelText.length; i++) {
              onToken?.(cancelText.slice(0, i + 1))
              if (i % 8 === 7) await new Promise((r) => setTimeout(r, 0))
            }
            return cancelText
          }
        }

        const label = pendingCalls.map((c) => TOOL_LABELS[c.name] || `Running ${c.name}…`).join(' · ')
        setToolStatus(label)
        onToolCall?.(label)

        const functionParts = await Promise.all(
          pendingCalls.map(async (call) => {
            const output = await runTool(call.name, call.args || {}, groupIdRef.current)
            // Gemini function_response.response must be a Struct (object), not an array
            const response = Array.isArray(output) ? { result: output } : (output || { ok: true })
            return { functionResponse: { name: call.name, response } }
          })
        )

        setToolStatus(null)

        const res = await sessionRef.current.sendMessage(functionParts)
        pendingCalls = res.response.functionCalls?.() || []

        if (!pendingCalls.length) {
          onToolDone?.()
          const answer = res.response.text?.() || ''
          // Simulate streaming so the UI still feels responsive
          for (let i = 0; i < answer.length; i++) {
            onToken?.(answer.slice(0, i + 1))
            if (i % 8 === 7) await new Promise((r) => setTimeout(r, 0))
          }
          return answer
        }
        // More tool calls — keep looping
      }
    } catch (err) {
      // Surface rate-limit wait time even for errors in the tool loop
      const raw = err?.message || ''
      const is429 = raw.includes('429') || raw.includes('quota') || raw.includes('Too Many Requests')
      const isDaily = raw.includes('PerDay') || raw.includes('per_day') || raw.includes('requests_per_day')
      if (is429 && !isDaily) {
        const rm = raw.match(/retry[^\d]*([\d.]+)s/i)
        onRateLimit?.(rm ? Math.ceil(parseFloat(rm[1])) : 60)
      }
      throw new Error(cleanGeminiError(err))
    } finally {
      setLoading(false)
      setToolStatus(null)
    }
  }, [])

  // Client-side receipt scan — calls Gemini directly, no backend round-trip
  const scanReceipt = useCallback(async (imageBase64, mimeType, products = []) => {
    if (!apiKeyRef.current) throw new Error('AI session not initialised')
    const productHint = products.length
      ? `\nKnown products in catalog (match by name):\n${products.map((p) => `- id:${p._id} name:"${p.name}" unit:${p.unit || 'pcs'} price:${p.price}`).join('\n')}`
      : ''
    const prompt = `You are a receipt scanner for a finance app.
Extract every line item and return ONLY a JSON object (no markdown, no explanation):
{
  "storeName": "string or null",
  "date": "YYYY-MM-DD or null",
  "items": [
    { "description": "item name", "qty": number, "unit": "pcs/kg/ltr/etc", "unitPrice": number, "taxRate": 0, "matchedProductId": "id or null" }
  ],
  "subtotal": number or null,
  "tax": number or null,
  "grandTotal": number or null
}
${productHint}
Rules: qty defaults to 1; unitPrice is per-unit; taxRate is percentage (0 if unknown); matchedProductId only if confident match.`

    const genModel = new GoogleGenerativeAI(apiKeyRef.current).getGenerativeModel({ model: modelIdRef.current })
    const result = await genModel.generateContent([
      prompt,
      { inlineData: { mimeType, data: imageBase64 } },
    ])
    const raw = result.response.text().trim()
    // Strip markdown code fences if present
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    const jsonStr = stripped.startsWith('{') ? stripped : stripped.match(/\{[\s\S]*\}/)?.[0]
    if (!jsonStr) throw new Error('Gemini did not return valid JSON for this receipt. Try a clearer photo.')
    try {
      return JSON.parse(jsonStr)
    } catch {
      // Last resort: attempt to repair truncated JSON by closing open brackets
      const repaired = jsonStr.replace(/,\s*$/, '') + (jsonStr.split('[').length > jsonStr.split(']').length ? ']}' : '}')
      return JSON.parse(repaired)
    }
  }, [])

  const reset = useCallback(() => {
    sessionRef.current     = null
    initGroupIdRef.current = null
    apiKeyRef.current      = null
    modelIdRef.current     = DEFAULT_MODEL
    setReady(false)
    setError(null)
    setToolStatus(null)
  }, [])

  return { ready, loading, toolStatus, error, init, sendMessage, scanReceipt, reset }
}
