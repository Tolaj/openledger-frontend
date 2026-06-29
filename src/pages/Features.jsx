import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, Sparkles, ScanLine, FileText, Boxes,
  ShoppingCart, TrendingUp, Users, Send,
} from 'lucide-react'
import AppLogo from '../components/ui/AppLogo'

/* ── small visuals ─────────────────────────────────────────────────────── */
function AuraViz() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm space-y-2.5">
      <div className="flex justify-end">
        <div className="bg-zinc-900 text-white text-xs px-3 py-2 rounded-2xl rounded-br-md max-w-[85%]">How much did I spend on groceries this month?</div>
      </div>
      <div className="flex justify-start">
        <div className="bg-zinc-50 border border-zinc-100 text-zinc-700 text-xs px-3 py-2 rounded-2xl rounded-bl-md max-w-[85%]">₹6,200 across 14 trips — 18% less than last month 👏</div>
      </div>
      <div className="flex justify-end">
        <div className="bg-zinc-900 text-white text-xs px-3 py-2 rounded-2xl rounded-br-md max-w-[85%]">Raise a sales order — 50kg Basmati for Rahul Stores</div>
      </div>
      <div className="flex justify-start">
        <div className="bg-zinc-50 border border-zinc-100 text-zinc-700 text-xs px-3 py-2 rounded-2xl rounded-bl-md max-w-[88%]">
          <p className="mb-1.5">Done — here's the draft:</p>
          <div className="rounded-lg border border-zinc-100 bg-white p-2 space-y-1">
            <div className="flex justify-between"><span className="text-zinc-400">Order</span><span className="font-mono font-semibold text-zinc-900">SO-0043</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Total</span><span className="font-bold text-zinc-900">₹4,500</span></div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-zinc-100 rounded-xl pl-3 pr-1.5 py-1.5">
        <span className="text-xs text-zinc-400 flex-1">Ask Aura anything…</span>
        <div className="w-6 h-6 rounded-lg bg-zinc-900 flex items-center justify-center"><Send size={11} className="text-white" /></div>
      </div>
    </div>
  )
}

function ScannerViz() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4 mb-4">
        <div className="h-2 w-20 bg-zinc-200 rounded-full mx-auto mb-3" />
        {[['Whole Milk ×2', '₹68'], ['Brown Bread', '₹42'], ['Free-range Eggs', '₹96'], ['Olive Oil 1L', '₹540']].map(([a, b]) => (
          <div key={a} className="flex justify-between text-[11px] mb-1"><span className="text-zinc-500">{a}</span><span className="font-mono text-zinc-700">{b}</span></div>
        ))}
        <div className="border-t border-dashed border-zinc-200 my-2" />
        <div className="flex justify-between text-xs font-bold text-zinc-900"><span>Total</span><span>₹746</span></div>
      </div>
      {['Whole Milk', 'Brown Bread', 'Free-range Eggs'].map(x => (
        <div key={x} className="flex items-center gap-2 mb-1.5"><Check size={13} className="text-emerald-500" /><span className="text-xs text-zinc-600">{x} <span className="text-zinc-400">added to cart</span></span></div>
      ))}
    </div>
  )
}

function InvoiceViz() {
  const t = [{ a: '#18181b', r: '-8deg', x: '-26%', z: 10 }, { a: '#7c3aed', r: '0deg', x: '0%', z: 30 }, { a: '#0ea5e9', r: '8deg', x: '26%', z: 20 }]
  return (
    <div className="relative h-56 flex items-center justify-center">
      {t.map((c, i) => (
        <div key={i} className="absolute w-32" style={{ transform: `translateX(${c.x}) rotate(${c.r})`, zIndex: c.z }}>
          <div className="rounded-xl bg-white border border-zinc-100 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
            <div className="flex justify-between mb-2.5"><div className="w-4 h-4 rounded" style={{ background: c.a }} /><div className="h-1.5 w-7 rounded-full" style={{ background: c.a, opacity: .3 }} /></div>
            <div className="space-y-1.5">{[12, 9, 11].map((w, k) => <div key={k} className="h-1.5 rounded-full bg-zinc-100" style={{ width: `${w * 4}px` }} />)}</div>
            <div className="h-2 w-8 rounded-full mt-3" style={{ background: c.a, opacity: .85 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function InventoryViz() {
  const rows = [
    { n: 'Basmati Rice', q: 84, s: 'ok' },
    { n: 'Whole Milk', q: 12, s: 'ok' },
    { n: 'Olive Oil 1L', q: 2, s: 'low' },
    { n: 'Brown Bread', q: 0, s: 'out' },
  ]
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-2.5">
      {rows.map(r => (
        <div key={r.n} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center"><Boxes size={15} className="text-zinc-500" /></div>
          <span className="text-sm text-zinc-700 flex-1">{r.n}</span>
          <span className="text-sm font-bold text-zinc-900">{r.q}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.s === 'ok' ? 'bg-emerald-50 text-emerald-700' : r.s === 'low' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
            {r.s === 'ok' ? 'In stock' : r.s === 'low' ? 'Low' : 'Out'}
          </span>
        </div>
      ))}
    </div>
  )
}

function OrdersViz() {
  const rows = [
    { id: 'PO-0038', n: 'Annapurna Mills', s: 'Received', c: 'bg-blue-50 text-blue-700' },
    { id: 'SO-0042', n: 'Global Supply', s: 'Pending', c: 'bg-amber-50 text-amber-700' },
    { id: 'SO-0043', n: 'Rahul Stores', s: 'Confirmed', c: 'bg-violet-50 text-violet-700' },
    { id: 'SINV-0051', n: 'Bhumi Stores', s: 'Paid', c: 'bg-emerald-50 text-emerald-700' },
  ]
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-2.5">
      {rows.map(r => (
        <div key={r.id} className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-400 w-20">{r.id}</span>
          <span className="text-sm text-zinc-700 flex-1 truncate">{r.n}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.c}`}>{r.s}</span>
        </div>
      ))}
    </div>
  )
}

function FinanceViz() {
  const bars = [48, 62, 40, 78, 55, 88, 70, 60]
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between mb-4">
        <div><p className="text-[11px] text-zinc-400">This month</p><p className="text-2xl font-black tracking-tight">₹42,800</p></div>
        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
      </div>
      <div className="flex items-end gap-1.5 h-24">
        {bars.map((h, i) => <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-zinc-900 to-zinc-500" style={{ height: `${h}%` }} />)}
      </div>
    </div>
  )
}

/* ── feature data ──────────────────────────────────────────────────────── */
const FEATURES = [
  {
    id: 'aura', tag: 'AI ASSISTANT', accent: '#7c3aed', icon: Sparkles, Viz: AuraViz,
    title: 'Aura — your AI assistant',
    lead: 'Run your money by simply talking. Aura understands plain language and does the work for you, at home or at work.',
    points: [
      'Ask anything: "How much did I spend on groceries?"',
      'Create orders & invoices by chat',
      'Scan receipts and log expenses hands-free',
      'Get instant, plain-language explanations of your numbers',
      'Powered by the latest AI models',
    ],
  },
  {
    id: 'scanner', tag: 'AUTOMATION', accent: '#e11d48', icon: ScanLine, Viz: ScannerViz,
    title: 'Receipt scanner',
    lead: 'Snap a photo of any receipt and every line item is read, priced and dropped into your cart — no manual entry.',
    points: [
      'Works with photos or your live camera',
      'Detects each item with quantity and price',
      'Auto-creates new products and categories',
      'Add everything to your cart in one tap',
    ],
  },
  {
    id: 'invoicing', tag: 'BILLING', accent: '#0284c7', icon: FileText, Viz: InvoiceViz,
    title: 'Invoicing',
    lead: 'Send invoices that look professional. Ten beautiful templates, instant PDF export, and one-tap email delivery.',
    points: [
      '10 polished, customizable templates',
      'Export to PDF or email directly',
      'Convert any sales order into an invoice',
      'Track receivables (AR) & payables (AP) aging',
      'See paid, sent and overdue at a glance',
    ],
  },
  {
    id: 'inventory', tag: 'CATALOGUE', accent: '#059669', icon: Boxes, Viz: InventoryViz,
    title: 'Products & inventory',
    lead: 'Manage your full catalogue and keep live stock counts that update automatically with every order.',
    points: [
      'Prices, units, tax rates and categories',
      'Live stock that updates with purchases & sales',
      'Low-stock alerts before you run out',
      'Total stock value on your dashboard',
    ],
  },
  {
    id: 'orders', tag: 'BUSINESS', accent: '#2563eb', icon: ShoppingCart, Viz: OrdersViz,
    title: 'Purchase & sales orders',
    lead: 'Manage the full purchase-to-payment cycle — from raising an order to receiving goods and getting paid.',
    points: [
      'Purchase orders with goods-receipt notes (GRNs)',
      'Sales orders with delivery tracking',
      'Partial fulfilment and status tracking',
      'Flow straight into invoices',
    ],
  },
  {
    id: 'finance', tag: 'MONEY', accent: '#d97706', icon: TrendingUp, Viz: FinanceViz,
    title: 'Finance & budgets',
    lead: 'Understand exactly where your money goes. Track income and expenses, set budgets and split group finances fairly.',
    points: [
      'Categorised income & expense tracking',
      'Monthly budgets and planning',
      'Shared group finances split between members',
      'Clear dashboards and trends',
    ],
  },
]

export default function Features() {
  useEffect(() => {
    const b = document.body, h = document.documentElement
    const prev = { bo: b.style.overflow, bp: b.style.position, bw: b.style.width, bh: b.style.height, hh: h.style.height, bg: b.style.background, hbg: h.style.background }
    b.style.overflow = 'visible'; b.style.position = 'static'; b.style.width = 'auto'; b.style.height = 'auto'
    h.style.height = 'auto'; b.style.background = '#fff'; h.style.background = '#fff'
    return () => {
      b.style.overflow = prev.bo; b.style.position = prev.bp; b.style.width = prev.bw
      b.style.height = prev.bh; h.style.height = prev.hh; b.style.background = prev.bg; h.style.background = prev.hbg
    }
  }, [])

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* nav */}
      <header className="sticky top-0 z-50 bg-white/70 border-b border-zinc-200/60"
        style={{ backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-zinc-900 rounded-[10px] flex items-center justify-center"><AppLogo size={15} /></div>
            <span className="font-bold tracking-tight">OpenLedger</span>
            <span className="ml-1 text-[11px] font-mono text-zinc-400 border border-zinc-200 rounded-full px-2 py-0.5">features</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/docs" className="hidden sm:block text-sm font-medium text-zinc-600 hover:text-zinc-900 px-3 py-2 transition-colors">Docs</Link>
            <Link to="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 px-3 py-2 transition-colors flex items-center gap-1.5"><ArrowLeft size={14} /> Home</Link>
            <Link to="/register" className="group text-sm font-semibold bg-zinc-900 text-white pl-4 pr-3.5 py-2 rounded-full hover:bg-zinc-700 transition-all flex items-center gap-1">
              Get started <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <div className="border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 md:py-20">
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-[0.25em] mb-4">[ features ]</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-[-0.04em] leading-[1.0]">Everything in one place.</h1>
          <p className="mt-5 text-lg text-zinc-500 max-w-xl">From AI-powered automation to invoicing and inventory — here's everything OpenLedger does, in detail.</p>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {FEATURES.map(f => (
              <a key={f.id} href={`#${f.id}`} className="text-xs font-semibold border border-zinc-200 hover:border-zinc-400 px-3 py-1.5 rounded-full transition-colors" style={{ color: f.accent }}>
                {f.title.split(' — ')[0]}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* feature sections */}
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-24 space-y-24 md:space-y-32">
        {FEATURES.map((f, i) => {
          const Icon = f.icon, Viz = f.Viz, reverse = i % 2 === 1
          return (
            <section key={f.id} id={f.id} className="grid md:grid-cols-2 gap-10 md:gap-16 items-center scroll-mt-24">
              <div className={reverse ? 'md:order-2' : ''}>
                <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold tracking-wider px-3 py-1.5 rounded-full border mb-5"
                  style={{ color: f.accent, borderColor: `${f.accent}33`, background: `${f.accent}0f` }}>
                  <Icon size={13} /> {f.tag}
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-[-0.03em] leading-[1.05] mb-4">{f.title}</h2>
                <p className="text-zinc-500 text-lg leading-relaxed mb-7 max-w-md">{f.lead}</p>
                <ul className="space-y-3">
                  {f.points.map(p => (
                    <li key={p} className="flex items-start gap-3">
                      <span className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${f.accent}1a` }}>
                        <Check size={12} style={{ color: f.accent }} />
                      </span>
                      <span className="text-sm text-zinc-700 font-medium">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={reverse ? 'md:order-1' : ''}>
                <div className="relative rounded-[1.75rem] border border-zinc-100 bg-gradient-to-b from-zinc-50 to-white p-6 md:p-8">
                  <div className="absolute -inset-6 opacity-50 blur-3xl pointer-events-none rounded-full"
                    style={{ background: `radial-gradient(circle at 50% 40%, ${f.accent}1f, transparent 65%)` }} />
                  <div className="relative"><Viz /></div>
                </div>
              </div>
            </section>
          )
        })}
      </div>

      {/* extras */}
      <div className="border-t border-zinc-100 bg-zinc-50/60">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-20">
          <h2 className="text-2xl md:text-3xl font-black tracking-[-0.03em] mb-8 text-center">And the essentials, covered</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Users, t: 'Shared workspaces', d: 'Create groups to split expenses with family, roommates or teammates — one shared ledger, in real time.' },
              { icon: Sparkles, t: 'Personal & Business', d: 'Run both modes from one account and switch between them anytime.' },
              { icon: ArrowRight, t: 'Installs anywhere', d: 'A Progressive Web App — install it on phone or desktop, works offline.' },
            ].map(c => {
              const Icon = c.icon
              return (
                <div key={c.t} className="rounded-2xl border border-zinc-200 bg-white p-6">
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center mb-4"><Icon size={16} className="text-white" /></div>
                  <h3 className="text-sm font-bold mb-1.5">{c.t}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{c.d}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-20 md:py-28">
        <div className="rounded-[2rem] bg-zinc-900 px-6 py-20 text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-[-0.04em] text-white mb-5">Try it all, free.</h2>
          <p className="text-zinc-400 text-lg mb-9 max-w-md mx-auto">Create your free account and put every feature to work in minutes.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-zinc-900 font-bold px-8 py-4 rounded-full text-sm hover:bg-zinc-100 transition-all">
            Get started free <ArrowRight size={16} />
          </Link>
          <p className="mt-6"><Link to="/docs" className="text-zinc-400 text-sm hover:text-white transition-colors">Read the docs →</Link></p>
        </div>
      </div>
    </div>
  )
}
