import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, ShoppingCart, BarChart2,
  ArrowRight, CheckCircle, Boxes, Receipt, Landmark, ChevronRight,
  Zap, Globe, Lock, Sparkles, Star, Menu, X, MoveRight,
  FileText, Bell, Camera, MessageSquare, Send, Package,
  DollarSign, Users, PieChart, Wallet, CreditCard, Building2,
  ChevronDown, Play, Shield, Smartphone, Monitor, Bot,
  ReceiptText, ScanLine, CircleDollarSign, Layers, BadgeCheck,
  ArrowUpRight, ArrowDownRight, Clock, Hash, Plus,
} from 'lucide-react'
import AppLogo from '../components/ui/AppLogo'

/* ─── useInView hook ──────────────────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function FadeIn({ children, delay = 0, className = '', up = 28 }) {
  const [ref, visible] = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : `translateY(${up}px)`,
        transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

/* ─── NAV ─────────────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Aura AI', href: '#aura' },
  { label: 'How it works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
]

/* ─── DATA ────────────────────────────────────────────────────────────────── */
const STATS = [
  { value: '10+', label: 'Invoice templates', icon: FileText },
  { value: '100%', label: 'Free forever', icon: BadgeCheck },
  { value: '∞', label: 'Products & SKUs', icon: Boxes },
  { value: '2', label: 'Workspace types', icon: Layers },
]

const HOW = [
  {
    step: '01',
    title: 'Create your workspace',
    desc: 'Sign up in seconds. Choose Personal for solo finances or Business for full operations. No credit card required.',
    icon: Building2,
    color: 'emerald',
  },
  {
    step: '02',
    title: 'Add products & customers',
    desc: 'Import your inventory, set up customer profiles, and configure your invoice preferences in minutes.',
    icon: Package,
    color: 'violet',
  },
  {
    step: '03',
    title: 'Let Aura do the heavy lifting',
    desc: 'Ask Aura to create orders, scan receipts, generate reports — all with a single message. Business runs itself.',
    icon: Bot,
    color: 'blue',
  },
]

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Freelance Designer',
    avatar: 'PS',
    avatarBg: 'bg-violet-500',
    stars: 5,
    text: 'OpenLedger replaced three separate apps for me. Invoicing, expense tracking, and inventory — all in one beautiful tool. Aura saved me hours every week.',
  },
  {
    name: 'Marcus Chen',
    role: 'Restaurant Owner',
    avatar: 'MC',
    avatarBg: 'bg-emerald-500',
    stars: 5,
    text: 'The receipt scanner is incredible. I photograph supplier invoices and Aura extracts everything automatically. Stock levels update in real time. Game changer.',
  },
  {
    name: 'Aisha Okonkwo',
    role: 'Boutique Retailer',
    avatar: 'AO',
    avatarBg: 'bg-amber-500',
    stars: 5,
    text: "I was skeptical about a free tool being this good. The invoice templates look more professional than what I paid $80/month for before. My clients love it.",
  },
  {
    name: 'Daniel Torres',
    role: 'Logistics Consultant',
    avatar: 'DT',
    avatarBg: 'bg-blue-500',
    stars: 5,
    text: 'The PO to GRN to Invoice flow is exactly what my clients needed. And the AR/AP aging reports are clear and actionable. Everything just works.',
  },
]

/* ─── PHONE MOCKUP ────────────────────────────────────────────────────────── */
function PhoneMockup() {
  return (
    <div className="relative w-[220px] h-[440px] flex-shrink-0">
      {/* Phone shell */}
      <div className="absolute inset-0 bg-zinc-900 rounded-[2.8rem] shadow-[0_32px_80px_rgba(0,0,0,0.45)] border-[3px] border-zinc-700 overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <span className="text-[9px] text-white/70 font-medium">9:41</span>
          <div className="w-16 h-4 bg-zinc-800 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <div className="flex gap-1 items-center">
            <div className="w-3 h-2 border border-white/50 rounded-[1px] relative"><div className="absolute inset-[1px] right-0.5 bg-white/50 rounded-[1px]" /></div>
          </div>
        </div>
        {/* App content */}
        <div className="px-3 pt-1 pb-16 h-full overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[9px] text-white/40">Good morning,</p>
              <p className="text-[12px] font-bold text-white">Dashboard</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">A</span>
            </div>
          </div>
          {/* Balance card */}
          <div className="bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-2xl p-3 mb-3 border border-zinc-600/40">
            <p className="text-[8px] text-white/40 mb-0.5">Total Revenue</p>
            <p className="text-[18px] font-bold text-white">$24,820</p>
            <div className="flex items-center gap-1 mt-1">
              <div className="flex items-center gap-0.5 bg-emerald-500/20 rounded-full px-1.5 py-0.5">
                <ArrowUpRight size={6} className="text-emerald-400" />
                <span className="text-[7px] text-emerald-400 font-medium">12.4%</span>
              </div>
              <span className="text-[7px] text-white/30">vs last month</span>
            </div>
          </div>
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {[
              { label: 'Invoices', value: '18', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Low Stock', value: '3', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-2 border border-white/5`}>
                <p className={`text-[14px] font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[7px] text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
          {/* Recent activity */}
          <p className="text-[8px] font-semibold text-white/40 mb-1.5 uppercase tracking-wider">Recent</p>
          <div className="space-y-1.5">
            {[
              { label: 'Invoice #042', amt: '+$2,400', color: 'text-emerald-400', icon: '📄' },
              { label: 'Office Supplies', amt: '-$340', color: 'text-red-400', icon: '🧾' },
              { label: 'PO #018 sent', amt: '$1,200', color: 'text-blue-400', icon: '📦' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between bg-white/5 rounded-xl px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">{r.icon}</span>
                  <span className="text-[8px] text-white/70">{r.label}</span>
                </div>
                <span className={`text-[8px] font-semibold ${r.color}`}>{r.amt}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Floating pill nav */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[160px] bg-zinc-800/95 backdrop-blur rounded-full py-2 px-4 flex items-center justify-between border border-zinc-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
          {[
            { icon: BarChart2, active: true },
            { icon: FileText, active: false },
            { icon: Boxes, active: false },
            { icon: Wallet, active: false },
          ].map(({ icon: Icon, active }, i) => (
            <div key={i} className={`w-7 h-7 rounded-full flex items-center justify-center ${active ? 'bg-white' : ''}`}>
              <Icon size={12} className={active ? 'text-zinc-900' : 'text-white/40'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── DESKTOP MOCKUP ──────────────────────────────────────────────────────── */
function DesktopMockup() {
  return (
    <div className="relative w-[340px] flex-shrink-0">
      {/* Screen */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 shadow-[0_24px_60px_rgba(0,0,0,0.4)] overflow-hidden">
        {/* Mac-style titlebar */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 border-b border-zinc-700">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <div className="ml-2 flex-1 bg-zinc-700 rounded-md h-4 flex items-center px-2">
            <span className="text-[7px] text-zinc-400">app.openledger.io</span>
          </div>
        </div>
        {/* App UI */}
        <div className="flex h-[220px]">
          {/* Sidebar */}
          <div className="w-[50px] bg-zinc-950 flex flex-col items-center py-3 gap-3 border-r border-zinc-800">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
              <AppLogo className="w-4 h-4" />
            </div>
            {[BarChart2, FileText, Boxes, ShoppingCart, Landmark].map((Icon, i) => (
              <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-zinc-700' : ''}`}>
                <Icon size={13} className={i === 0 ? 'text-white' : 'text-zinc-600'} />
              </div>
            ))}
          </div>
          {/* Main */}
          <div className="flex-1 p-3 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-white">Overview</p>
              <div className="bg-violet-600 rounded-md px-2 py-0.5 text-[7px] text-white">+ New invoice</div>
            </div>
            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {[
                { label: 'Revenue', value: '$24.8K', up: true },
                { label: 'Expenses', value: '$8.2K', up: false },
                { label: 'Profit', value: '$16.6K', up: true },
              ].map(m => (
                <div key={m.label} className="bg-zinc-800 rounded-lg p-1.5 border border-zinc-700">
                  <p className="text-[7px] text-zinc-500">{m.label}</p>
                  <p className="text-[10px] font-bold text-white">{m.value}</p>
                  <div className={`flex items-center gap-0.5 ${m.up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {m.up ? <ArrowUpRight size={7} /> : <ArrowDownRight size={7} />}
                    <span className="text-[6px]">{m.up ? '+12%' : '-4%'}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Chart placeholder */}
            <div className="bg-zinc-800 rounded-lg p-2 border border-zinc-700 mb-2">
              <p className="text-[7px] text-zinc-500 mb-1.5">Revenue trend</p>
              <div className="flex items-end gap-1 h-10">
                {[30, 45, 35, 60, 55, 70, 80, 65, 85, 90, 75, 95].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i === 11 ? '#10b981' : i > 8 ? '#6366f1' : '#3f3f46' }} />
                ))}
              </div>
            </div>
            {/* Recent invoices */}
            <div className="space-y-1">
              {[
                { id: '#042', client: 'Acme Corp', amt: '$2,400', status: 'Paid' },
                { id: '#041', client: 'Nova Labs', amt: '$890', status: 'Pending' },
              ].map(inv => (
                <div key={inv.id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-2 py-1 border border-zinc-700">
                  <span className="text-[7px] text-zinc-400">{inv.id}</span>
                  <span className="text-[7px] text-zinc-300">{inv.client}</span>
                  <span className="text-[7px] font-semibold text-white">{inv.amt}</span>
                  <span className={`text-[6px] px-1.5 py-0.5 rounded-full font-medium ${inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{inv.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Stand */}
      <div className="mx-auto w-16 h-3 bg-zinc-700 rounded-b-lg" />
      <div className="mx-auto w-28 h-1.5 bg-zinc-600 rounded-full" />
    </div>
  )
}

/* ─── AURA CHAT MOCKUP ────────────────────────────────────────────────────── */
function AuraChatMockup() {
  const messages = [
    { from: 'user', text: "Create a sales order for 50 units of Basmati Rice for Priya's Kitchen" },
    { from: 'aura', text: "Done! Created Sales Order #SO-089 for Priya's Kitchen — 50 × Basmati Rice at ₹120/kg. Total: ₹6,000. Shall I convert it to an invoice?", action: 'SO-089 created' },
    { from: 'user', text: 'Yes, and send the invoice by email' },
    { from: 'aura', text: 'Invoice #INV-042 generated using your Classic template and emailed to priya@kitchen.com. Payment link included. 🎉', action: 'Invoice sent' },
  ]
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-700/60 overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.5)] max-w-md w-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800/80 border-b border-zinc-700/60">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg">
          <Sparkles size={14} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Aura AI</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[11px] text-zinc-400">Powered by Gemini · Always on</p>
          </div>
        </div>
      </div>
      {/* Messages */}
      <div className="p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {m.from === 'aura' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles size={10} className="text-white" />
              </div>
            )}
            <div className="max-w-[78%] space-y-1.5">
              <div className={`rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed ${
                m.from === 'user'
                  ? 'bg-white text-zinc-900 rounded-br-md'
                  : 'bg-zinc-800 text-zinc-100 rounded-bl-md border border-zinc-700/60'
              }`}>
                {m.text}
              </div>
              {m.action && (
                <div className="flex items-center gap-1.5 px-2">
                  <CheckCircle size={11} className="text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-medium">{m.action}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Input */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2.5 border border-zinc-700/60">
          <span className="flex-1 text-[12px] text-zinc-500">Ask Aura anything...</span>
          <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center">
            <Send size={12} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── RECEIPT SCANNER VISUAL ──────────────────────────────────────────────── */
function ReceiptScannerVisual() {
  return (
    <div className="relative mt-4 h-40">
      {/* Receipt */}
      <div className="absolute left-2 top-0 w-28 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-2.5 border border-zinc-100">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-4 h-4 rounded bg-zinc-900 flex items-center justify-center">
            <span className="text-[7px] text-white font-bold">R</span>
          </div>
          <div>
            <div className="h-1 w-10 bg-zinc-700 rounded-full" />
            <div className="h-0.5 w-6 bg-zinc-300 rounded-full mt-0.5" />
          </div>
        </div>
        <div className="space-y-1.5">
          {['Olive Oil 2L', 'Basmati 5kg', 'Sugar 1kg', 'Black Pepper'].map((item, i) => (
            <div key={item} className="flex items-center justify-between">
              <div className="h-1 rounded-full bg-zinc-200" style={{ width: `${50 + i * 8}%` }} />
              <div className="h-1 w-8 rounded-full bg-zinc-300" />
            </div>
          ))}
        </div>
        <div className="mt-2 pt-1.5 border-t border-zinc-200">
          <div className="flex justify-between">
            <div className="h-1 w-8 bg-zinc-700 rounded-full" />
            <div className="h-1 w-10 bg-zinc-700 rounded-full" />
          </div>
        </div>
      </div>
      {/* Scan line animation */}
      <div className="absolute left-2 top-0 w-28 h-full overflow-hidden rounded-xl pointer-events-none">
        <div className="scan-line absolute w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />
      </div>
      {/* Extracted items panel */}
      <div className="absolute right-0 top-2 w-32 bg-zinc-900 rounded-xl border border-zinc-700/60 p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-1 mb-2">
          <Sparkles size={9} className="text-violet-400" />
          <span className="text-[8px] font-semibold text-violet-400">Extracted by Aura</span>
        </div>
        <div className="space-y-1.5">
          {[
            { name: 'Olive Oil 2L', price: '$12.50' },
            { name: 'Basmati 5kg', price: '$8.90' },
            { name: 'Sugar 1kg', price: '$2.30' },
          ].map(item => (
            <div key={item.name} className="flex items-center justify-between">
              <span className="text-[7px] text-zinc-300 truncate max-w-[60%]">{item.name}</span>
              <span className="text-[7px] font-semibold text-emerald-400">{item.price}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-1.5 border-t border-zinc-700">
          <div className="flex justify-between">
            <span className="text-[7px] text-zinc-500">Total</span>
            <span className="text-[8px] font-bold text-white">$23.70</span>
          </div>
        </div>
        <div className="mt-1.5 bg-emerald-600/20 rounded-lg px-1.5 py-0.5 flex items-center gap-1">
          <CheckCircle size={8} className="text-emerald-400" />
          <span className="text-[7px] text-emerald-400">Added to inventory</span>
        </div>
      </div>
    </div>
  )
}

/* ─── BENTO CARDS ─────────────────────────────────────────────────────────── */
function BentoCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Aura AI — full-width hero card */}
      <FadeIn className="md:col-span-3" delay={0.05}>
        <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-3xl p-7 border border-zinc-700/60 overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.35)] transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-32 w-48 h-48 rounded-full bg-blue-600/8 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-violet-600/20 border border-violet-500/30 rounded-full px-3 py-1 mb-3">
                <Sparkles size={12} className="text-violet-400" />
                <span className="text-xs font-semibold text-violet-300">Aura AI · Gemini Powered</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Your AI business assistant</h3>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
                Ask Aura to create sales orders, purchase orders, invoices, scan receipts, check stock levels, summarize finances — all in plain English. No forms, no clicks.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Create orders', 'Scan receipts', 'Answer questions', 'Generate reports', 'Track expenses'].map(tag => (
                  <span key={tag} className="text-[11px] bg-white/5 border border-white/10 rounded-full px-2.5 py-1 text-zinc-400">{tag}</span>
                ))}
              </div>
            </div>
            {/* Mini chat preview */}
            <div className="w-full md:w-72 bg-zinc-800/60 border border-zinc-700/60 rounded-2xl p-3 space-y-2.5 backdrop-blur">
              {[
                { from: 'user', text: "What's my profit this month?" },
                { from: 'aura', text: '$16,620 net profit (↑23% vs last month). Top earner: Olive Oil ×40 units.' },
                { from: 'user', text: 'Low stock alerts?' },
                { from: 'aura', text: '3 items below threshold: Sugar (12%), Black Pepper (8%), Rice (5%). Reorder now?' },
              ].map((m, i) => (
                <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`text-[11px] leading-relaxed rounded-xl px-3 py-1.5 max-w-[80%] ${m.from === 'user' ? 'bg-white/10 text-white' : 'bg-violet-600/20 text-violet-200 border border-violet-500/20'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Receipt Scanner */}
      <FadeIn className="md:col-span-2" delay={0.1}>
        <div className="bg-white rounded-3xl p-7 border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.07)] h-full hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-300">
          <div className="inline-flex items-center gap-2 bg-emerald-50 rounded-full px-3 py-1 mb-3">
            <ScanLine size={12} className="text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-600">Receipt Scanner</span>
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-1">Scan. Extract. Done.</h3>
          <p className="text-zinc-500 text-sm">Photograph any receipt with your camera. Aura extracts items, prices and quantities — automatically added to your books.</p>
          <ReceiptScannerVisual />
        </div>
      </FadeIn>

      {/* Invoicing */}
      <FadeIn delay={0.15}>
        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-700/60 h-full hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-300 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 mb-3">
            <ReceiptText size={12} className="text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">Invoicing</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">10 pro templates</h3>
          <p className="text-zinc-400 text-sm">PDF export, email delivery, payment links. Clients pay faster.</p>
          <div className="mt-4 flex gap-2 overflow-hidden">
            {['Classic', 'Modern', 'Minimal', 'Bold'].map((t, i) => (
              <div key={t} style={{ opacity: 1 - i * 0.18, transform: `rotate(${(i - 1.5) * 2}deg) scale(${1 - i * 0.04})` }}
                className="flex-shrink-0 w-16 bg-white rounded-lg shadow-lg p-1.5 flex flex-col gap-0.5" style2={{ height: '88px' }}>
                <div className="h-1 w-6 bg-zinc-900 rounded-full" />
                <div className="h-0.5 w-8 bg-zinc-200 rounded-full" />
                <div className="flex-1 mt-1 space-y-0.5">
                  {[...Array(5)].map((_, j) => <div key={j} className="h-0.5 bg-zinc-100 rounded-full" />)}
                </div>
                <div className="text-[6px] font-bold text-zinc-700 text-right">{t}</div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Inventory */}
      <FadeIn delay={0.1}>
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.07)] h-full hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-300">
          <div className="inline-flex items-center gap-2 bg-violet-50 rounded-full px-3 py-1 mb-3">
            <Boxes size={12} className="text-violet-600" />
            <span className="text-xs font-semibold text-violet-600">Inventory</span>
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-1">Stock that tracks itself</h3>
          <p className="text-zinc-500 text-sm">Real-time levels, low-stock alerts, movement history.</p>
          <div className="mt-4 space-y-2.5">
            {[
              { name: 'Basmati Rice', pct: 78, color: 'bg-violet-500', alert: false },
              { name: 'Olive Oil', pct: 32, color: 'bg-amber-500', alert: true },
              { name: 'Sugar 1kg', pct: 8, color: 'bg-red-500', alert: true },
            ].map(s => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-600 font-medium">{s.name}</span>
                  <div className="flex items-center gap-1.5">
                    {s.alert && <Bell size={9} className="text-amber-500" />}
                    <span className="text-xs font-bold text-zinc-800">{s.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Finance */}
      <FadeIn delay={0.15}>
        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-700/60 h-full hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all duration-300 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/8 rounded-full blur-3xl" />
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-3">
            <Landmark size={12} className="text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">Finance</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Full financial clarity</h3>
          <p className="text-zinc-400 text-sm">AR/AP aging, budgets, group spending — all in one view.</p>
          <div className="mt-4 space-y-2">
            {[
              { label: 'Income', value: '$24,820', icon: ArrowUpRight, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Expenses', value: '$8,200', icon: ArrowDownRight, color: 'text-red-400', bg: 'bg-red-500/10' },
              { label: 'Net Profit', value: '$16,620', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            ].map(f => (
              <div key={f.label} className={`flex items-center justify-between ${f.bg} rounded-xl px-3 py-2`}>
                <div className="flex items-center gap-2">
                  <f.icon size={12} className={f.color} />
                  <span className="text-xs text-zinc-400">{f.label}</span>
                </div>
                <span className={`text-sm font-bold ${f.color}`}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Orders */}
      <FadeIn delay={0.05}>
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.07)] h-full hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-300">
          <div className="inline-flex items-center gap-2 bg-blue-50 rounded-full px-3 py-1 mb-3">
            <ShoppingCart size={12} className="text-blue-600" />
            <span className="text-xs font-semibold text-blue-600">Orders</span>
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-1">PO → GRN → Invoice</h3>
          <p className="text-zinc-500 text-sm">Complete purchase and sales order flows with one-click conversions.</p>
          <div className="mt-4 flex items-center gap-1.5 flex-wrap">
            {['Purchase Order', '→', 'GRN', '→', 'Invoice', '→', 'Payment'].map((step, i) => (
              <span key={i} className={i % 2 === 0
                ? 'text-[10px] font-semibold bg-zinc-900 text-white rounded-full px-2 py-0.5'
                : 'text-zinc-400 text-xs'}>{step}</span>
            ))}
          </div>
          <div className="mt-3 space-y-1.5">
            {[
              { id: 'PO-018', vendor: 'FreshFoods Co.', status: 'Received', color: 'bg-emerald-50 text-emerald-700' },
              { id: 'SO-089', vendor: "Priya's Kitchen", status: 'Processing', color: 'bg-blue-50 text-blue-700' },
            ].map(o => (
              <div key={o.id} className="flex items-center justify-between bg-zinc-50 rounded-xl px-3 py-1.5">
                <span className="text-xs font-mono text-zinc-600">{o.id}</span>
                <span className="text-xs text-zinc-500 truncate mx-2">{o.vendor}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${o.color}`}>{o.status}</span>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

    </div>
  )
}

/* ─── MAIN COMPONENT ──────────────────────────────────────────────────────── */
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  /* Fix body scroll (app CSS sets body to fixed) */
  useEffect(() => {
    document.body.style.overflow = 'auto'
    document.body.style.position = 'static'
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
    }
  }, [])

  /* Navbar background on scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Auto-rotate testimonials */
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-inter overflow-x-hidden">

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.08)]' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-8">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
                <AppLogo className="w-5 h-5" />
              </div>
              <span className="text-[17px] font-bold text-zinc-900 tracking-tight">OpenLedger</span>
            </a>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 flex-1">
              {NAV_LINKS.map(l => (
                <a key={l.label} href={l.href}
                  className="px-3 py-1.5 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all font-medium">
                  {l.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all">
                Sign in
              </Link>
              <Link to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-full transition-all shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
                Get started free
              </Link>
            </div>

            {/* Mobile menu toggle */}
            <button className="md:hidden ml-auto w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors"
              onClick={() => setMenuOpen(o => !o)}>
              {menuOpen ? <X size={20} className="text-zinc-700" /> : <Menu size={20} className="text-zinc-700" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-zinc-100 px-4 py-4 space-y-1">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg">
                {l.label}
              </a>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" className="px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg text-center">Sign in</Link>
              <Link to="/register" className="px-3 py-2.5 text-sm font-semibold text-white bg-zinc-900 rounded-full text-center">Get started free</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="blob-1 absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-violet-400/10 blur-3xl" />
          <div className="blob-2 absolute top-[10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400/8 blur-3xl" />
          <div className="blob-3 absolute bottom-[-5%] left-[30%] w-[400px] h-[400px] rounded-full bg-emerald-400/8 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left: text */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <FadeIn delay={0}>
                <div className="inline-flex items-center gap-1.5 bg-white border border-zinc-200 rounded-full px-4 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                  <span className="text-xs font-semibold text-zinc-700">Aura AI</span>
                  <span className="text-zinc-300">·</span>
                  <span className="text-xs font-medium text-zinc-500">Free forever</span>
                  <span className="text-zinc-300">·</span>
                  <span className="text-xs font-medium text-zinc-500">PWA</span>
                </div>
              </FadeIn>

              {/* Headline */}
              <FadeIn delay={0.1}>
                <h1 className="text-[2.8rem] md:text-[3.8rem] lg:text-[4.2rem] font-black text-zinc-900 leading-[1.08] tracking-tight mb-5">
                  Your business,<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-violet-700 to-blue-600">
                    beautifully managed.
                  </span>
                </h1>
              </FadeIn>

              <FadeIn delay={0.18}>
                <p className="text-lg md:text-xl text-zinc-500 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                  OpenLedger combines AI-powered automation, professional invoicing, real-time inventory and complete financial management — in a free app that works beautifully on mobile and desktop.
                </p>
              </FadeIn>

              {/* CTAs */}
              <FadeIn delay={0.24}>
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                  <Link to="/register"
                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 text-white text-sm font-semibold rounded-full hover:bg-zinc-800 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:-translate-y-0.5">
                    Start free — no card needed
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link to="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold rounded-full hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                    Sign in
                  </Link>
                </div>
                <p className="text-xs text-zinc-400 mt-3 text-center lg:text-left">
                  Install to home screen · Works offline · Always free
                </p>
              </FadeIn>

              {/* Social proof */}
              <FadeIn delay={0.3}>
                <div className="mt-8 flex items-center gap-3 justify-center lg:justify-start">
                  <div className="flex -space-x-2">
                    {[
                      { init: 'PS', bg: 'bg-violet-500' },
                      { init: 'MC', bg: 'bg-emerald-500' },
                      { init: 'AO', bg: 'bg-amber-500' },
                      { init: 'DT', bg: 'bg-blue-500' },
                      { init: '+', bg: 'bg-zinc-700' },
                    ].map((av, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full border-2 border-[#f5f5f5] flex items-center justify-center text-[9px] font-bold text-white ${av.bg}`}>
                        {av.init}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5 mb-0.5">
                      {[...Array(5)].map((_, i) => <Star key={i} size={11} className="text-amber-400 fill-amber-400" />)}
                    </div>
                    <p className="text-xs text-zinc-500">Loved by 500+ businesses</p>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Right: mockups */}
            <div className="flex-shrink-0 relative flex items-end gap-6 justify-center">
              {/* Floating notifications */}
              <div className="absolute -top-4 left-0 z-20 bg-white border border-zinc-100 rounded-2xl px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.1)] notif-float-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle size={12} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-800">Invoice sent</p>
                    <p className="text-[9px] text-zinc-400">$2,400 · Acme Corp</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-16 -right-2 z-20 bg-white border border-zinc-100 rounded-2xl px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.1)] notif-float-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                    <Bell size={12} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-800">Low stock alert</p>
                    <p className="text-[9px] text-zinc-400">Sugar · 8% remaining</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-20 -left-4 z-20 bg-zinc-900 border border-zinc-700/60 rounded-2xl px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.25)] notif-float-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <Sparkles size={12} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-white">Aura creating order…</p>
                    <p className="text-[9px] text-zinc-400">SO-089 · Priya's Kitchen</p>
                  </div>
                </div>
              </div>

              <PhoneMockup />
              <div className="hidden lg:block -mb-4">
                <DesktopMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ───────────────────────────────────────────────────── */}
      <section className="relative bg-zinc-900 py-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-violet-500/8 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <FadeIn key={s.label} delay={i * 0.08}>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-black text-white mb-1 tracking-tight">{s.value}</div>
                  <div className="text-sm text-zinc-400 font-medium">{s.label}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES BENTO ────────────────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-zinc-900 text-white rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
                <Zap size={12} />
                Everything you need
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-zinc-900 mb-4">Powerful tools.<br />Zero complexity.</h2>
              <p className="text-lg text-zinc-500 max-w-xl mx-auto">Every feature you need to run a modern business — invoicing, inventory, AI assistant, finance — in one free app.</p>
            </div>
          </FadeIn>
          <BentoCards />
        </div>
      </section>

      {/* ── AURA AI SHOWCASE ──────────────────────────────────────────────── */}
      <section id="aura" className="relative py-20 md:py-28 bg-zinc-900 overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/15 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <FadeIn>
                <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs font-semibold text-violet-300 mb-5">
                  <Sparkles size={12} />
                  Meet Aura AI
                </div>
              </FadeIn>
              <FadeIn delay={0.08}>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-5 leading-tight">
                  Your AI business<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">runs on autopilot.</span>
                </h2>
              </FadeIn>
              <FadeIn delay={0.14}>
                <p className="text-lg text-zinc-400 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                  Powered by Google Gemini, Aura understands your business context and can handle complex multi-step tasks from a single chat message.
                </p>
              </FadeIn>
              <FadeIn delay={0.2}>
                <div className="space-y-3 mb-8">
                  {[
                    { icon: ShoppingCart, text: 'Create sales & purchase orders instantly', color: 'text-blue-400' },
                    { icon: ScanLine, text: 'Scan receipts and auto-add to inventory', color: 'text-emerald-400' },
                    { icon: BarChart2, text: 'Get financial summaries and insights', color: 'text-violet-400' },
                    { icon: FileText, text: 'Generate and send invoices by email', color: 'text-amber-400' },
                  ].map(item => (
                    <div key={item.text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <item.icon size={14} className={item.color} />
                      </div>
                      <span className="text-sm text-zinc-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              </FadeIn>
              <FadeIn delay={0.26}>
                <Link to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold rounded-full hover:opacity-90 transition-all shadow-[0_8px_24px_rgba(139,92,246,0.35)] hover:shadow-[0_12px_32px_rgba(139,92,246,0.45)] hover:-translate-y-0.5">
                  Try Aura for free
                  <ArrowRight size={15} />
                </Link>
              </FadeIn>
            </div>
            {/* Chat mockup */}
            <FadeIn className="flex-shrink-0 w-full max-w-md" delay={0.15}>
              <AuraChatMockup />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-700 rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
                <Clock size={12} />
                Up in minutes
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-zinc-900 mb-4">How it works</h2>
              <p className="text-lg text-zinc-500 max-w-lg mx-auto">From sign-up to running your first invoice in under 5 minutes.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent" />
            {HOW.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.12}>
                <div className="relative bg-white rounded-3xl p-7 border border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-300 h-full">
                  <div className={`w-12 h-12 rounded-2xl mb-5 flex items-center justify-center bg-${step.color}-100`}>
                    <step.icon size={22} className={`text-${step.color}-600`} />
                  </div>
                  <div className="absolute top-7 right-7 text-5xl font-black text-zinc-100 select-none leading-none">{step.step}</div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-2">{step.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
                <Star size={12} className="fill-amber-600" />
                Loved by businesses
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-zinc-900 mb-4">Real results, real people</h2>
              <p className="text-lg text-zinc-500 max-w-lg mx-auto">Freelancers, retailers and restaurants run their entire business on OpenLedger.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.08}>
                <div className={`bg-white rounded-3xl p-7 border transition-all duration-300 hover:-translate-y-0.5 ${activeTestimonial === i ? 'border-zinc-300 shadow-[0_8px_32px_rgba(0,0,0,0.1)]' : 'border-zinc-100 shadow-[0_2px_8px_rgba(0,0,0,0.07)]'}`}>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(t.stars)].map((_, j) => <Star key={j} size={13} className="text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-zinc-700 text-[15px] leading-relaxed mb-5">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-[11px] font-bold text-white">{t.avatar}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                      <p className="text-xs text-zinc-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-1.5 text-xs font-semibold mb-4">
                <BadgeCheck size={12} />
                Simple pricing
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-zinc-900 mb-4">Free. Forever.</h2>
              <p className="text-lg text-zinc-500 max-w-lg mx-auto">No hidden fees, no paywalls. Everything is free during launch — including Business features.</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                name: 'Personal',
                price: '$0',
                period: 'forever',
                badge: null,
                desc: 'Perfect for freelancers and solopreneurs managing personal finances.',
                features: ['Income & expense tracking', 'Unlimited transactions', 'Budget management', 'Receipt scanning with Aura', 'Group spending', 'AR/AP aging reports', 'PWA — install to home screen'],
                cta: 'Start personal',
                ctaStyle: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
                border: 'border-zinc-200',
              },
              {
                name: 'Business',
                price: '$0',
                period: 'during launch',
                badge: 'Free during launch',
                desc: 'Full business operations — invoicing, inventory, orders, AI assistant.',
                features: ['Everything in Personal', '10 invoice templates · PDF export', 'Inventory & stock management', 'Purchase & Sales orders (PO→GRN)', 'Aura AI assistant', 'Customer & vendor management', 'Email invoice delivery', '∞ products & SKUs'],
                cta: 'Start business',
                ctaStyle: 'bg-zinc-900 text-white hover:bg-zinc-800',
                border: 'border-zinc-900',
              },
            ].map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.1}>
                <div className={`relative bg-white rounded-3xl p-8 border-2 ${plan.border} shadow-[0_2px_8px_rgba(0,0,0,0.07)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col`}>
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[11px] font-bold px-4 py-1 rounded-full whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-zinc-900 mb-1">{plan.name}</h3>
                    <div className="flex items-end gap-2 mb-1">
                      <span className="text-5xl font-black text-zinc-900">{plan.price}</span>
                      <span className="text-zinc-500 text-sm mb-1.5">{plan.period}</span>
                    </div>
                    <p className="text-sm text-zinc-500">{plan.desc}</p>
                  </div>
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-700">
                        <CheckCircle size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className={`block text-center py-3 px-6 rounded-full text-sm font-semibold transition-all ${plan.ctaStyle}`}>
                    {plan.cta} →
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-10 md:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="relative bg-zinc-900 rounded-[2.5rem] px-8 py-16 md:px-16 md:py-20 overflow-hidden text-center">
              {/* Decorative blobs */}
              <div className="absolute top-[-30%] right-[-10%] w-96 h-96 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
              <div className="absolute bottom-[-20%] left-[-5%] w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-white/80 mb-6">
                  <Sparkles size={12} />
                  Free forever · No credit card
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-5 leading-tight">
                  Start managing your<br />business the smart way.
                </h2>
                <p className="text-lg text-zinc-400 mb-9 max-w-lg mx-auto">
                  Join hundreds of businesses who run their operations on OpenLedger. Free, powerful, and beautiful on every device.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link to="/register"
                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-zinc-900 text-sm font-bold rounded-full hover:bg-zinc-100 transition-all shadow-[0_8px_24px_rgba(255,255,255,0.15)] hover:shadow-[0_12px_32px_rgba(255,255,255,0.2)] hover:-translate-y-0.5">
                    Get started — it's free
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link to="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white text-sm font-semibold rounded-full hover:bg-white/15 transition-all">
                    Already have an account
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="py-12 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
                <AppLogo className="w-5 h-5" />
              </div>
              <span className="text-[15px] font-bold text-zinc-900">OpenLedger</span>
            </div>
            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              {['Features', 'Aura AI', 'Pricing', 'How it works'].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, '')}`} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors font-medium">{l}</a>
              ))}
            </div>
            {/* Right */}
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Sign in</Link>
              <Link to="/register" className="text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-700 rounded-full px-4 py-2 transition-all">Get started free</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-400">© {new Date().getFullYear()} OpenLedger · Free forever · Built with ❤️ for small businesses</p>
          </div>
        </div>
      </footer>

      {/* ── KEYFRAME ANIMATIONS ───────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }

        @keyframes blob-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.97); }
        }
        @keyframes blob-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 20px) scale(1.04); }
          66% { transform: translate(20px, -10px) scale(0.98); }
        }
        @keyframes blob-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15px, -25px) scale(1.06); }
        }
        .blob-1 { animation: blob-drift-1 18s ease-in-out infinite; }
        .blob-2 { animation: blob-drift-2 22s ease-in-out infinite; }
        .blob-3 { animation: blob-drift-3 16s ease-in-out infinite; }

        @keyframes notif-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .notif-float-1 { animation: notif-float 4s ease-in-out infinite; }
        .notif-float-2 { animation: notif-float 5s ease-in-out infinite 1s; }
        .notif-float-3 { animation: notif-float 4.5s ease-in-out infinite 2s; }

        @keyframes scan-anim {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .scan-line { animation: scan-anim 2s linear infinite; }

        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  )
}
