import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, TrendingUp, TrendingDown, ShoppingCart, BarChart2, Users,
  ArrowRight, CheckCircle, Boxes, Receipt, Landmark, ChevronRight,
  Zap, Globe, Lock, Sparkles, Star, Menu, X, MoveRight,
} from 'lucide-react'

/* ─── tiny animation hook ──────────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function FadeIn({ children, delay = 0, className = '' }) {
  const [ref, visible] = useInView()
  return (
    <div ref={ref} className={className}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(28px)', transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s` }}>
      {children}
    </div>
  )
}

/* ─── data ──────────────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
]

const STATS = [
  { value: '10+', label: 'Invoice templates' },
  { value: '100%', label: 'Free to use' },
  { value: '2', label: 'Workspace types' },
  { value: '∞', label: 'Products & SKUs' },
]

const BENTO = [
  {
    col: 'md:col-span-2', size: 'large',
    icon: Receipt, iconBg: 'bg-zinc-900', iconColor: 'text-white',
    tag: 'Invoicing', tagColor: 'bg-zinc-100 text-zinc-600',
    title: '10 stunning invoice templates',
    desc: 'Classic, modern, minimal, bold and more. Send professional PDF invoices via email in one tap.',
    visual: (
      <div className="mt-4 flex gap-2 overflow-hidden">
        {['Classic','Modern','Minimal','Bold','Elegant'].map((t, i) => (
          <div key={t} style={{ opacity: 1 - i * 0.15, transform: `rotate(${i * 1.5 - 3}deg) scale(${1 - i * 0.03})` }}
            className="flex-shrink-0 w-24 h-32 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-zinc-100 p-2 flex flex-col gap-1">
            <div className="h-1.5 w-8 bg-zinc-900 rounded-full" />
            <div className="h-1 w-12 bg-zinc-200 rounded-full" />
            <div className="flex-1 mt-1 flex flex-col gap-0.5">
              {[...Array(5)].map((_, j) => <div key={j} className="h-0.5 bg-zinc-100 rounded-full" />)}
            </div>
            <div className="text-[7px] font-bold text-zinc-900 text-right">{t}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    col: 'md:col-span-1', size: 'medium',
    icon: Boxes, iconBg: 'bg-violet-600', iconColor: 'text-white',
    tag: 'Inventory', tagColor: 'bg-violet-50 text-violet-600',
    title: 'Stock that tracks itself',
    desc: 'Real-time levels, low-stock alerts, movement history and adjustments.',
    visual: (
      <div className="mt-4 space-y-2">
        {[{ name: 'Basmati Rice', pct: 78, color: 'bg-violet-500' }, { name: 'Olive Oil', pct: 32, color: 'bg-amber-500' }, { name: 'Sugar', pct: 12, color: 'bg-red-500' }].map(s => (
          <div key={s.name}>
            <div className="flex justify-between text-[10px] text-zinc-500 mb-0.5"><span>{s.name}</span><span>{s.pct}%</span></div>
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} /></div>
          </div>
        ))}
      </div>
    ),
  },
  {
    col: 'md:col-span-1', size: 'medium',
    icon: TrendingUp, iconBg: 'bg-emerald-600', iconColor: 'text-white',
    tag: 'AR / AP', tagColor: 'bg-emerald-50 text-emerald-700',
    title: 'Cash flow at a glance',
    desc: 'Know exactly what you\'re owed and what you owe with aging breakdowns.',
    visual: (
      <div className="mt-4 flex gap-3">
        <div className="flex-1 bg-emerald-50 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-emerald-600 mb-1">Receivable</p>
          <p className="text-lg font-extrabold text-emerald-700">$8,240</p>
          <p className="text-[10px] text-emerald-500">13 invoices</p>
        </div>
        <div className="flex-1 bg-red-50 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-red-500 mb-1">Payable</p>
          <p className="text-lg font-extrabold text-red-600">$3,180</p>
          <p className="text-[10px] text-red-400">7 invoices</p>
        </div>
      </div>
    ),
  },
  {
    col: 'md:col-span-1', size: 'medium',
    icon: ShoppingCart, iconBg: 'bg-blue-600', iconColor: 'text-white',
    tag: 'Purchases', tagColor: 'bg-blue-50 text-blue-600',
    title: 'PO to invoice in seconds',
    desc: 'Purchase orders → GRN → invoice with full tax tracking at every step.',
    visual: (
      <div className="mt-4 flex items-center gap-1.5 text-[10px] font-semibold">
        {['PO', '→', 'GRN', '→', 'Invoice'].map((s, i) => (
          <span key={i} className={s === '→' ? 'text-zinc-300' : 'bg-blue-50 text-blue-700 px-2 py-1 rounded-lg'}>{s}</span>
        ))}
      </div>
    ),
  },
  {
    col: 'md:col-span-2', size: 'large',
    icon: BarChart2, iconBg: 'bg-amber-500', iconColor: 'text-white',
    tag: 'Finance', tagColor: 'bg-amber-50 text-amber-700',
    title: 'Personal & business finances unified',
    desc: 'Track income, expenses, budgets and group spending in one beautiful dashboard.',
    visual: (
      <div className="mt-4 flex items-end gap-1.5 h-16">
        {[40,65,45,80,55,90,70,95,60,85,75,100].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-amber-400 to-amber-200" style={{ height: `${h}%` }} />
        ))}
      </div>
    ),
  },
]

const STEPS = [
  { n: '01', title: 'Create your workspace', desc: 'Sign up free, choose Personal or Business, and name your space. Ready in under a minute.' },
  { n: '02', title: 'Add your products & vendors', desc: 'Import your catalogue, set prices, tax rates and stock levels. Templates help you get started instantly.' },
  { n: '03', title: 'Manage orders & invoices', desc: 'Raise POs, track deliveries, issue invoices and get paid — all from one clean dashboard.' },
]

const TESTIMONIALS = [
  { name: 'Priya S.', role: 'Retail shop owner', stars: 5, text: 'Finally an app that handles purchase orders AND invoices together. Saves me hours every single week.' },
  { name: 'Rahul M.', role: 'Freelance consultant', stars: 5, text: 'The invoice templates look incredibly professional. My clients always ask which software I use.' },
  { name: 'Ananya K.', role: 'Restaurant manager', stars: 5, text: 'Stock tracking and purchase orders in one place — exactly what our café needed. Highly recommend.' },
  { name: 'Dev P.', role: 'E-commerce owner', stars: 5, text: 'The AR/AP aging feature alone is worth it. I always know who owes me money and when.' },
]

const PLANS = [
  {
    name: 'Personal',
    badge: null,
    price: 'Free',
    period: 'forever',
    desc: 'For households & individuals',
    features: ['Expense & income tracking', 'Budget planning', 'Wishlist & shopping cart', 'Shared group spaces', 'Finance overview dashboard'],
    cta: 'Start for free',
    dark: false,
  },
  {
    name: 'Business',
    badge: 'Most popular',
    price: 'Free',
    period: 'during launch',
    desc: 'For teams, shops & companies',
    features: ['Everything in Personal', 'Purchase & sales orders', 'Inventory management', 'AR / AP aging reports', '10 invoice templates', 'PDF export & email delivery'],
    cta: 'Start your workspace',
    dark: true,
  },
]

/* ─── component ─────────────────────────────────────────────────────────────── */
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Allow scrolling on the landing page (app CSS sets body overflow:hidden)
  useEffect(() => {
    const body = document.body
    const prevOverflow = body.style.overflow
    const prevPosition = body.style.position
    const prevWidth = body.style.width
    body.style.overflow = 'auto'
    body.style.position = 'static'
    body.style.width = 'auto'
    return () => {
      body.style.overflow = prevOverflow
      body.style.position = prevPosition
      body.style.width = prevWidth
    }
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06)]' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center shadow-md">
              <Package size={15} className="text-white" />
            </div>
            <span className="font-extrabold text-zinc-900 tracking-tight text-lg">OpenLedger</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">{l.label}</a>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">Sign in</Link>
            <Link to="/register" className="text-sm font-bold bg-zinc-900 text-white px-5 py-2.5 rounded-xl hover:bg-zinc-800 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
              Get started free
            </Link>
          </div>
          <button className="md:hidden p-2 rounded-lg hover:bg-zinc-100" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-zinc-100 px-5 py-4 flex flex-col gap-4">
            {NAV_LINKS.map(l => <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="text-sm font-medium text-zinc-700">{l.label}</a>)}
            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100">
              <Link to="/login" className="text-sm font-semibold text-zinc-700 py-2.5 text-center border border-zinc-200 rounded-xl">Sign in</Link>
              <Link to="/register" className="text-sm font-bold bg-zinc-900 text-white py-2.5 text-center rounded-xl">Get started free</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-40" style={{ animation: 'blob1 8s ease-in-out infinite' }} />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-30" style={{ animation: 'blob2 10s ease-in-out infinite' }} />
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-30" style={{ animation: 'blob3 12s ease-in-out infinite' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-5 text-center py-24">
          <div className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-600 text-xs font-semibold px-4 py-2 rounded-full mb-8 shadow-sm"
            style={{ animation: 'fadeSlideUp 0.6s ease forwards', opacity: 0 }}>
            <Sparkles size={12} className="text-amber-500" />
            The complete business management app — 100% free
          </div>

          <h1 style={{ animation: 'fadeSlideUp 0.6s ease 0.1s forwards', opacity: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tighter text-zinc-900 leading-[1.05] mb-6">
            Your business,<br />
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #18181b 0%, #52525b 50%, #18181b 100%)' }}>
                beautifully managed.
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-violet-400 via-blue-400 to-emerald-400" />
            </span>
          </h1>

          <p style={{ animation: 'fadeSlideUp 0.6s ease 0.2s forwards', opacity: 0 }}
            className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Purchase orders, sales, invoicing, inventory, AR&nbsp;/&nbsp;AP and finance tracking — all in one stunning app that works on every device.
          </p>

          <div style={{ animation: 'fadeSlideUp 0.6s ease 0.3s forwards', opacity: 0 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link to="/register"
              className="group inline-flex items-center justify-center gap-2 bg-zinc-900 text-white font-bold px-8 py-4 rounded-2xl text-sm transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-0.5">
              Start for free
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login"
              className="inline-flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-700 font-semibold px-8 py-4 rounded-2xl text-sm hover:bg-zinc-50 transition-all shadow-sm">
              Sign in to your account
            </Link>
          </div>

          {/* Floating dashboard preview */}
          <div style={{ animation: 'floatUp 0.8s ease 0.4s forwards', opacity: 0 }}
            className="relative mx-auto max-w-3xl">
            <div className="bg-white rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.15)] border border-zinc-200/80 overflow-hidden">
              {/* Titlebar */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-100 bg-zinc-50">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="flex-1 mx-3 bg-white border border-zinc-200 rounded-md h-5 flex items-center px-2">
                  <span className="text-[9px] text-zinc-400">openledger-frontend.vercel.app/dashboard</span>
                </div>
              </div>
              {/* App UI mockup */}
              <div className="p-4 bg-[#f5f5f5]">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-zinc-900 rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp size={10} className="text-emerald-400" />
                      <span className="text-[9px] text-zinc-400 font-semibold">Receivable</span>
                    </div>
                    <p className="text-base font-black text-emerald-400">$8,240</p>
                    <p className="text-[8px] text-zinc-500">13 unpaid invoices</p>
                  </div>
                  <div className="bg-zinc-900 rounded-2xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingDown size={10} className="text-red-400" />
                      <span className="text-[9px] text-zinc-400 font-semibold">Payable</span>
                    </div>
                    <p className="text-base font-black text-red-400">$3,180</p>
                    <p className="text-[8px] text-zinc-500">7 unpaid invoices</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { l: 'Pending POs', v: '4', c: 'text-blue-600' },
                    { l: 'Pending SOs', v: '7', c: 'text-violet-600' },
                    { l: 'Stock Value', v: '$12k', c: 'text-zinc-900' },
                    { l: 'Low Stock', v: '3', c: 'text-red-500' },
                  ].map(s => (
                    <div key={s.l} className="bg-white rounded-xl p-2.5 shadow-sm">
                      <p className={`text-sm font-black ${s.c}`}>{s.v}</p>
                      <p className="text-[8px] text-zinc-400 leading-tight mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold text-zinc-700">Recent Sales Orders</span>
                    <span className="text-[8px] text-zinc-400">See all →</span>
                  </div>
                  {[{ id: 'SO-0042', c: 'Keshav Traders', v: '$1,240', s: 'Confirmed', sc: 'text-emerald-600 bg-emerald-50' },
                    { id: 'SO-0041', c: 'Bhumi Stores', v: '$860', s: 'Pending', sc: 'text-amber-600 bg-amber-50' }].map(r => (
                    <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-zinc-50 last:border-0">
                      <span className="text-[8px] font-mono font-bold text-zinc-700">{r.id}</span>
                      <span className="text-[8px] text-zinc-500">{r.c}</span>
                      <span className="text-[8px] font-bold text-zinc-900">{r.v}</span>
                      <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${r.sc}`}>{r.s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* floating badges */}
            <div className="absolute -left-4 top-16 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-zinc-100 px-3 py-2.5 flex items-center gap-2 hidden md:flex">
              <div className="w-7 h-7 bg-emerald-50 rounded-xl flex items-center justify-center"><CheckCircle size={14} className="text-emerald-600" /></div>
              <div><p className="text-[10px] font-bold text-zinc-900">Invoice sent</p><p className="text-[9px] text-zinc-400">SINV-0048 · $2,400</p></div>
            </div>
            <div className="absolute -right-4 bottom-20 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-zinc-100 px-3 py-2.5 hidden md:flex items-center gap-2">
              <div className="w-7 h-7 bg-violet-50 rounded-xl flex items-center justify-center"><Boxes size={14} className="text-violet-600" /></div>
              <div><p className="text-[10px] font-bold text-zinc-900">Low stock alert</p><p className="text-[9px] text-zinc-400">Sugar · 3 units left</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────────── */}
      <section className="bg-zinc-900 py-12">
        <div className="max-w-4xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((s, i) => (
              <FadeIn key={s.label} delay={i * 0.1}>
                <p className="text-3xl md:text-4xl font-black text-white tracking-tight">{s.value}</p>
                <p className="text-xs font-semibold text-zinc-500 mt-1">{s.label}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bento features ───────────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-24">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full mb-4">
              <Zap size={11} /> Features
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight">Everything you need.<br />Nothing you don't.</h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">One app replacing five spreadsheets. Built for small businesses and freelancers who mean business.</p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-min">
          {BENTO.map((b, i) => {
            const Icon = b.icon
            return (
              <FadeIn key={b.title} delay={i * 0.08} className={b.col}>
                <div className="h-full bg-white rounded-3xl p-6 border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${b.iconBg}`}>
                      <Icon size={18} className={b.iconColor} />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${b.tagColor}`}>{b.tag}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-zinc-900 mb-1.5 leading-snug">{b.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{b.desc}</p>
                  {b.visual}
                </div>
              </FadeIn>
            )
          })}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────────── */}
      <section id="how" className="bg-zinc-900 py-24 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-4xl mx-auto px-5 relative">
          <FadeIn>
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 bg-white/10 px-3 py-1.5 rounded-full mb-4">
                <Globe size={11} /> Getting started
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">Up and running<br />in minutes.</h2>
              <p className="text-zinc-400 text-lg">No setup fees. No credit card. No complexity.</p>
            </div>
          </FadeIn>
          <div className="flex flex-col md:flex-row gap-8 relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
            {STEPS.map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.15} className="flex-1">
                <div className="relative">
                  <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mb-5 relative z-10 backdrop-blur-sm">
                    <span className="text-xl font-black text-white">{s.n}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.4}>
            <div className="text-center mt-14">
              <Link to="/register"
                className="group inline-flex items-center gap-2 bg-white text-zinc-900 font-bold px-8 py-4 rounded-2xl text-sm hover:bg-zinc-100 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)]">
                Start your workspace
                <MoveRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 py-24">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full mb-4">
              <Star size={11} /> Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Loved by small businesses.</h2>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <div className="bg-white rounded-3xl p-7 border border-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all duration-300 group">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, i) => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-zinc-700 leading-relaxed mb-5 font-medium">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-zinc-900 rounded-full flex items-center justify-center text-white text-sm font-black">{t.name[0]}</div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{t.name}</p>
                    <p className="text-xs text-zinc-400">{t.role}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-zinc-50 py-24">
        <div className="max-w-4xl mx-auto px-5">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full mb-4">
                <Lock size={11} /> Pricing
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Simple, honest pricing.</h2>
              <p className="text-zinc-500 text-lg">Both plans are completely free during our launch period.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLANS.map((p, i) => (
              <FadeIn key={p.name} delay={i * 0.15}>
                <div className={`relative rounded-3xl p-8 border transition-all ${p.dark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-[0_2px_12px_rgba(0,0,0,0.06)]'}`}>
                  {p.badge && (
                    <span className="absolute -top-3 left-6 bg-gradient-to-r from-violet-500 to-blue-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md">
                      {p.badge}
                    </span>
                  )}
                  <p className={`text-xs font-semibold mb-1 ${p.dark ? 'text-zinc-500' : 'text-zinc-400'}`}>{p.desc}</p>
                  <h3 className={`text-2xl font-extrabold mb-1 ${p.dark ? 'text-white' : 'text-zinc-900'}`}>{p.name}</h3>
                  <div className="flex items-end gap-1.5 mb-6">
                    <span className={`text-5xl font-black tracking-tighter ${p.dark ? 'text-white' : 'text-zinc-900'}`}>{p.price}</span>
                    <span className={`text-sm font-medium mb-1.5 ${p.dark ? 'text-zinc-500' : 'text-zinc-400'}`}>/ {p.period}</span>
                  </div>
                  <ul className="flex flex-col gap-2.5 mb-8">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle size={15} className={p.dark ? 'text-emerald-400 flex-shrink-0' : 'text-emerald-600 flex-shrink-0'} />
                        <span className={p.dark ? 'text-zinc-300' : 'text-zinc-600'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/register"
                    className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold transition-all ${p.dark ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-[0_4px_16px_rgba(255,255,255,0.1)]' : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-[0_4px_16px_rgba(0,0,0,0.12)]'}`}>
                    {p.cta} <ChevronRight size={15} />
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 py-24">
        <FadeIn>
          <div className="relative bg-zinc-900 rounded-[2.5rem] overflow-hidden px-8 py-16 text-center">
            {/* decorative bg */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <p className="text-zinc-500 text-sm font-semibold mb-4">Get started today — it's free</p>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-5 leading-tight">
                Ready to run your<br />business smarter?
              </h2>
              <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">Join thousands of businesses already using OpenLedger to manage orders, stock and finances.</p>
              <Link to="/register"
                className="group inline-flex items-center gap-2 bg-white text-zinc-900 font-black px-10 py-4 rounded-2xl text-sm hover:bg-zinc-100 transition-all shadow-[0_8px_30px_rgba(255,255,255,0.15)] hover:shadow-[0_12px_40px_rgba(255,255,255,0.2)] hover:-translate-y-0.5">
                Create your free account
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-100 py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Package size={13} className="text-white" />
            </div>
            <span className="font-extrabold text-zinc-900 tracking-tight">OpenLedger</span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">© {new Date().getFullYear()} OpenLedger · Built for small businesses that mean business.</p>
          <div className="flex gap-6">
            {NAV_LINKS.map(l => <a key={l.label} href={l.href} className="text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors">{l.label}</a>)}
            <Link to="/login" className="text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

      {/* ── Keyframes ────────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blob1 {
          0%, 100% { transform: translate(0,0) scale(1); }
          33%  { transform: translate(30px,-20px) scale(1.05); }
          66%  { transform: translate(-20px,15px) scale(0.95); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0,0) scale(1); }
          33%  { transform: translate(-25px,20px) scale(1.05); }
          66%  { transform: translate(20px,-15px) scale(0.95); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0,0) scale(1); }
          33%  { transform: translate(20px,25px) scale(0.95); }
          66%  { transform: translate(-15px,-20px) scale(1.05); }
        }
      `}</style>

    </div>
  )
}
