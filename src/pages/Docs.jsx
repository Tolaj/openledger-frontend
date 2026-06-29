import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Sparkles, ScanLine, FileText, Boxes,
  ShoppingCart, TrendingUp, Users, Smartphone, Rocket, HelpCircle,
} from 'lucide-react'
import AppLogo from '../components/ui/AppLogo'

const SECTIONS = [
  { id: 'getting-started', label: 'Getting started', icon: Rocket },
  { id: 'workspaces',      label: 'Workspaces & groups', icon: Users },
  { id: 'aura',           label: 'Aura AI assistant', icon: Sparkles },
  { id: 'scanner',        label: 'Receipt scanner', icon: ScanLine },
  { id: 'inventory',      label: 'Products & inventory', icon: Boxes },
  { id: 'orders',         label: 'Orders', icon: ShoppingCart },
  { id: 'invoicing',      label: 'Invoicing', icon: FileText },
  { id: 'finance',        label: 'Finance & budgets', icon: TrendingUp },
  { id: 'install',        label: 'Install as an app', icon: Smartphone },
  { id: 'faq',            label: 'FAQ', icon: HelpCircle },
]

function Section({ id, icon: Icon, title, tag, children }) {
  return (
    <section id={id} className="scroll-mt-24 pb-14 border-b border-zinc-100 last:border-0">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
          <Icon size={17} className="text-white" />
        </div>
        <div>
          {tag && <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">{tag}</p>}
          <h2 className="text-2xl font-black tracking-[-0.02em]">{title}</h2>
        </div>
      </div>
      <div className="prose-docs space-y-4 text-[15px] leading-relaxed text-zinc-600 max-w-2xl">{children}</div>
    </section>
  )
}

function Step({ n, title, children }) {
  return (
    <div className="flex gap-4">
      <span className="shrink-0 w-7 h-7 rounded-full bg-zinc-100 text-zinc-900 text-xs font-bold flex items-center justify-center">{n}</span>
      <div className="pt-0.5">
        <p className="font-semibold text-zinc-900 text-[15px]">{title}</p>
        <p className="text-sm text-zinc-500 mt-0.5">{children}</p>
      </div>
    </div>
  )
}

function Pill({ children, tone = 'zinc' }) {
  const tones = {
    zinc: 'bg-zinc-100 text-zinc-700',
    violet: 'bg-violet-50 text-violet-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
  }
  return <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${tones[tone]}`}>{children}</span>
}

export default function Docs() {
  const [active, setActive] = useState(SECTIONS[0].id)

  // unlock the globally-fixed body so this page can scroll on the window
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

  // scroll-spy for the sidebar
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) })
      },
      { rootMargin: '-30% 0px -60% 0px' }
    )
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) obs.observe(el) })
    return () => obs.disconnect()
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
            <span className="ml-1 text-[11px] font-mono text-zinc-400 border border-zinc-200 rounded-full px-2 py-0.5">docs</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 px-3 py-2 transition-colors flex items-center gap-1.5">
              <ArrowLeft size={14} /> Home
            </Link>
            <Link to="/register" className="group text-sm font-semibold bg-zinc-900 text-white pl-4 pr-3.5 py-2 rounded-full hover:bg-zinc-700 transition-all flex items-center gap-1">
              Get started <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <div className="border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-14 md:py-20">
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-[0.25em] mb-4">[ documentation ]</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-[-0.04em] leading-[1.0]">How OpenLedger works.</h1>
          <p className="mt-5 text-lg text-zinc-500 max-w-xl">Everything you need to run your money — at home or in business. Start with the basics, then dive into each feature.</p>
        </div>
      </div>

      {/* body */}
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-12 grid md:grid-cols-[220px_1fr] gap-10 lg:gap-16">
        {/* sidebar */}
        <aside className="hidden md:block">
          <nav className="sticky top-24 space-y-1">
            {SECTIONS.map(s => {
              const Icon = s.icon
              return (
                <a key={s.id} href={`#${s.id}`}
                  className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg transition-colors ${active === s.id ? 'bg-zinc-100 text-zinc-900 font-semibold' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'}`}>
                  <Icon size={15} className={active === s.id ? 'text-zinc-900' : 'text-zinc-400'} /> {s.label}
                </a>
              )
            })}
          </nav>
        </aside>

        {/* content */}
        <main>
          <Section id="getting-started" icon={Rocket} tag="Start here" title="Getting started">
            <p>OpenLedger is a single app for tracking money, sending invoices, managing inventory, and automating the busywork with AI — and it's completely free.</p>
            <div className="space-y-4 mt-6">
              <Step n="1" title="Create your free account">Sign up with your email — no credit card required. You'll be up and running in under a minute.</Step>
              <Step n="2" title="Pick Personal or Business">Choose <Pill>Personal</Pill> for household and individual money, or <Pill tone="violet">Business</Pill> for shops, teams and companies. You can run both.</Step>
              <Step n="3" title="Add your details">Bring in your products, vendors or expense categories — or just start chatting with Aura to set things up.</Step>
            </div>
          </Section>

          <Section id="workspaces" icon={Users} tag="Spaces" title="Workspaces & groups">
            <p>Every account starts with your own private space. You can create <strong>shared groups</strong> to split expenses with family, roommates, or teammates — everyone sees the same ledger in real time.</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Switch between spaces from the group switcher at the top.</li>
              <li>Each group has its own products, finance, orders and cart.</li>
              <li>Invite members and assign permissions per page.</li>
            </ul>
          </Section>

          <Section id="aura" icon={Sparkles} tag="AI" title="Aura AI assistant">
            <p>Aura is your built-in AI assistant. Just say what you need in plain language — at home or at work.</p>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2 text-sm">
              <p className="text-zinc-500">Try asking:</p>
              <p className="text-zinc-800">"How much did I spend on groceries this month?"</p>
              <p className="text-zinc-800">"Create a sales order — 50kg Basmati for Rahul Stores"</p>
              <p className="text-zinc-800">"Which invoices are overdue?"</p>
            </div>
            <p>Aura can draft orders and invoices, log expenses, scan receipts, and explain your numbers. <Pill tone="violet">Business</Pill> workspaces unlock order and invoice actions.</p>
          </Section>

          <Section id="scanner" icon={ScanLine} tag="Automation" title="Receipt scanner">
            <p>Snap a photo of any receipt — or use your live camera — and OpenLedger reads every line item, prices it, and drops it straight into your cart.</p>
            <div className="space-y-4 mt-2">
              <Step n="1" title="Open the scanner">Tap the scan button and pick a photo or take one.</Step>
              <Step n="2" title="Review extracted items">Each line item is detected with quantity and price. Unrecognised products are created for you automatically.</Step>
              <Step n="3" title="Add to cart">Select what you want and add it in one tap.</Step>
            </div>
          </Section>

          <Section id="inventory" icon={Boxes} tag="Catalogue" title="Products & inventory">
            <p>Manage your full catalogue with prices, units, tax rates and categories. Turn on <strong>inventory tracking</strong> for any product to keep live stock counts.</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Stock updates automatically with every purchase and sale.</li>
              <li>Get <Pill tone="emerald">low-stock</Pill> alerts before you run out.</li>
              <li>See total stock value at a glance on your dashboard.</li>
            </ul>
          </Section>

          <Section id="orders" icon={ShoppingCart} tag="Business" title="Orders">
            <p><Pill tone="violet">Business</Pill> Manage the full purchase-to-payment cycle.</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Purchase orders</strong> to your vendors, with goods-receipt notes (GRNs).</li>
              <li><strong>Sales orders</strong> to your customers, with delivery tracking.</li>
              <li>Partial fulfilment and status tracking from draft to complete.</li>
            </ul>
          </Section>

          <Section id="invoicing" icon={FileText} tag="Billing" title="Invoicing">
            <p>Create polished invoices from <strong>10 beautiful templates</strong>, export to PDF, and email them in one tap.</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Convert any sales order into an invoice instantly.</li>
              <li>Track receivables (AR) and payables (AP) with aging reports.</li>
              <li>See what's <Pill tone="emerald">paid</Pill>, <Pill tone="blue">sent</Pill>, or overdue at a glance.</li>
            </ul>
          </Section>

          <Section id="finance" icon={TrendingUp} tag="Money" title="Finance & budgets">
            <p>Track income and expenses, set budgets, and understand where your money goes — for personal and business spaces alike.</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Categorised income & expense tracking.</li>
              <li>Monthly budgets and planning.</li>
              <li>Shared group finances split fairly between members.</li>
            </ul>
          </Section>

          <Section id="install" icon={Smartphone} tag="PWA" title="Install as an app">
            <p>OpenLedger is a Progressive Web App — install it on your phone or desktop for a native, full-screen experience that works offline.</p>
            <div className="space-y-4 mt-2">
              <Step n="iOS" title="Safari → Share → Add to Home Screen">Open OpenLedger in Safari, tap Share, then "Add to Home Screen".</Step>
              <Step n="Android" title="Chrome → Install app">Tap the menu and choose "Install app" or "Add to Home screen".</Step>
              <Step n="Desktop" title="Install icon in the address bar">Click the install icon on the right of your browser's address bar.</Step>
            </div>
          </Section>

          <Section id="faq" icon={HelpCircle} tag="Help" title="FAQ">
            <div className="space-y-5">
              <div>
                <p className="font-semibold text-zinc-900">Is it really free?</p>
                <p className="text-sm text-zinc-500 mt-1">Yes. Personal is free forever, and Business is free during our launch.</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Can I use it for both home and business?</p>
                <p className="text-sm text-zinc-500 mt-1">Absolutely — create separate workspaces and switch between them anytime.</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Is my data private?</p>
                <p className="text-sm text-zinc-500 mt-1">Your data belongs to you and is only shared with members you invite to a group.</p>
              </div>
            </div>
          </Section>

          {/* CTA */}
          <div className="mt-12 rounded-2xl bg-zinc-900 p-8 text-center">
            <h3 className="text-2xl font-black text-white tracking-[-0.02em] mb-2">Ready to try it?</h3>
            <p className="text-zinc-400 text-sm mb-6">Create your free account and start in under a minute.</p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-white text-zinc-900 font-bold px-6 py-3 rounded-full text-sm hover:bg-zinc-100 transition-all">
              Get started free <ArrowRight size={15} />
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
