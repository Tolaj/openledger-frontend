import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, Check, Sparkles, Menu, X, Plus,
  TrendingUp, TrendingDown, Boxes, AlertTriangle,
  ScanLine, FileText, ShoppingCart, Send, Download, Smartphone,
} from 'lucide-react'
import AppLogo from '../components/ui/AppLogo'
import { getDeferredPrompt, clearDeferredPrompt, onInstallAvailable } from '../lib/pwa'

/* ════════════════════════════════════════════════════════════════════════
   Primitives
   ════════════════════════════════════════════════════════════════════════ */
function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, seen]
}

function Reveal({ children, delay = 0, y = 24, className = '' }) {
  const [ref, seen] = useInView()
  return (
    <div ref={ref} className={className} style={{
      opacity: seen ? 1 : 0,
      transform: seen ? 'none' : `translateY(${y}px)`,
      transition: `opacity .8s cubic-bezier(.16,1,.3,1) ${delay}s, transform .8s cubic-bezier(.16,1,.3,1) ${delay}s`,
    }}>
      {children}
    </div>
  )
}

function TiltCard({ children, className = '', max = 7 }) {
  const ref = useRef(null)
  const onMove = (e) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(1000px) rotateY(${px * max}deg) rotateX(${-py * max}deg)`
  }
  const reset = () => { if (ref.current) ref.current.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)' }
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={reset} className={className}
      style={{ transition: 'transform .3s cubic-bezier(.16,1,.3,1)', transformStyle: 'preserve-3d' }}>
      {children}
    </div>
  )
}

function CountUp({ to, suffix = '', prefix = '', duration = 1400 }) {
  const [ref, seen] = useInView(0.4)
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!seen) return
    let raf, start
    const tick = (t) => {
      if (!start) start = t
      const p = Math.min((t - start) / duration, 1)
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, to, duration])
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>
}

/* A bento cell: seamless white tile in the grid mosaic, lights up on hover */
function Cell({ className = '', children, span = '', pad = 'p-6 md:p-7', glow = 'rgba(124,58,237,0.06)' }) {
  const ref = useRef(null)
  const onMove = (e) => {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <div ref={ref} onMouseMove={onMove}
      className={`group/cell relative bg-white overflow-hidden transition-colors duration-300 hover:bg-zinc-50/70 ${pad} ${span} ${className}`}>
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover/cell:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(300px circle at var(--mx) var(--my), ${glow}, transparent 70%)` }} />
      <div className="relative h-full">{children}</div>
    </div>
  )
}

/* Bordered mosaic frame with crosshair plus-marks at the corners */
function Mosaic({ children, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      {/* corner crosshairs */}
      {[
        'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
        'top-0 right-0 translate-x-1/2 -translate-y-1/2',
        'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
        'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
      ].map((p, i) => (
        <Plus key={i} size={16} strokeWidth={1.25} className={`absolute ${p} text-zinc-300 z-20 pointer-events-none`} />
      ))}
      <div className="rounded-[1.25rem] overflow-hidden border border-zinc-200 bg-zinc-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-px">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════
   Mini product visuals
   ════════════════════════════════════════════════════════════════════════ */
const AURA_SCRIPT = [
  { role: 'user', kind: 'text', text: 'Create a sales order — 50kg Basmati for Rahul Stores' },
  { role: 'ai', kind: 'card' },
  { role: 'user', kind: 'text', text: 'Confirm & send it' },
  { role: 'ai', kind: 'text', text: '✅ Confirmed & emailed to rahul@stores.in' },
]

function AuraChat() {
  const [ref, seen] = useInView(0.4)
  const [count, setCount] = useState(0)
  const [typing, setTyping] = useState(false)
  useEffect(() => {
    if (!seen) return
    let timers = []
    const run = () => {
      setCount(0)
      AURA_SCRIPT.forEach((m, i) => {
        if (m.role === 'ai') timers.push(setTimeout(() => setTyping(true), i * 1050 + 250))
        timers.push(setTimeout(() => { setTyping(false); setCount(i + 1) }, i * 1050 + 850))
      })
      timers.push(setTimeout(run, AURA_SCRIPT.length * 1050 + 2600))
    }
    run()
    return () => timers.forEach(clearTimeout)
  }, [seen])
  return (
    <div ref={ref} className="flex flex-col justify-end space-y-2.5 h-full">
      {AURA_SCRIPT.slice(0, count).map((m, i) => (
        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`} style={{ animation: 'msgIn .4s cubic-bezier(.16,1,.3,1) both' }}>
          {m.kind === 'card' ? (
            <div className="bg-white border border-zinc-200 text-zinc-700 text-xs leading-relaxed px-3 py-2.5 rounded-2xl rounded-bl-md max-w-[90%] shadow-sm">
              <p className="mb-2">Done — here's the draft:</p>
              <div className="rounded-lg border border-zinc-100 p-2 bg-zinc-50 space-y-1">
                <div className="flex justify-between"><span className="text-zinc-400">Order</span><span className="font-mono font-semibold text-zinc-900">SO-0043</span></div>
                <div className="flex justify-between"><span className="text-zinc-400">Total</span><span className="font-bold text-zinc-900">₹4,500</span></div>
              </div>
            </div>
          ) : (
            <div className={`text-xs leading-relaxed px-3 py-2 rounded-2xl max-w-[88%] ${m.role === 'user' ? 'bg-zinc-900 text-white rounded-br-md' : 'bg-white border border-zinc-200 text-zinc-700 rounded-bl-md shadow-sm'}`}>{m.text}</div>
          )}
        </div>
      ))}
      {typing && (
        <div className="flex justify-start" style={{ animation: 'msgIn .3s ease both' }}>
          <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-1 shadow-sm">
            {[0, 1, 2].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-zinc-400" style={{ animation: `dot 1.2s ease-in-out ${d * 0.15}s infinite` }} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function ReceiptMini() {
  return (
    <div className="relative rounded-xl bg-zinc-50 border border-zinc-100 p-3.5 overflow-hidden">
      <div className="space-y-1.5">
        <div className="h-1.5 w-16 bg-zinc-200 rounded-full mx-auto mb-2.5" />
        {[['Whole Milk ×2', '₹68'], ['Brown Bread', '₹42'], ['Olive Oil 1L', '₹540']].map(([a, b]) => (
          <div key={a} className="flex justify-between text-[10px]"><span className="text-zinc-500">{a}</span><span className="font-mono text-zinc-700">{b}</span></div>
        ))}
        <div className="border-t border-dashed border-zinc-200 my-1.5" />
        <div className="flex justify-between text-[11px] font-bold text-zinc-900"><span>Total</span><span>₹650</span></div>
      </div>
      <div className="absolute left-0 right-0 h-10 pointer-events-none"
        style={{ background: 'linear-gradient(180deg,transparent,rgba(225,29,72,0.18),transparent)', animation: 'scan 2.4s ease-in-out infinite' }} />
    </div>
  )
}

function InvoiceMini() {
  const t = [{ a: '#18181b', r: '-8deg', x: '-22%', z: 10 }, { a: '#7c3aed', r: '0deg', x: '0%', z: 30 }, { a: '#0ea5e9', r: '8deg', x: '22%', z: 20 }]
  return (
    <div className="relative h-28 flex items-center justify-center">
      {t.map((c, i) => (
        <div key={i} className="absolute w-24" style={{ transform: `translateX(${c.x}) rotate(${c.r})`, zIndex: c.z }}>
          <div className="rounded-lg bg-white border border-zinc-100 p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="flex justify-between mb-2"><div className="w-3.5 h-3.5 rounded" style={{ background: c.a }} /><div className="h-1 w-5 rounded-full" style={{ background: c.a, opacity: .3 }} /></div>
            <div className="space-y-1">{[10, 7, 9].map((w, k) => <div key={k} className="h-1 rounded-full bg-zinc-100" style={{ width: `${w * 3}px` }} />)}</div>
            <div className="h-1.5 w-6 rounded-full mt-2" style={{ background: c.a, opacity: .8 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function FinanceMini() {
  const bars = [48, 62, 40, 78, 55, 88, 70]
  return (
    <div className="flex items-end gap-1.5 h-20">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-zinc-900 to-zinc-500" style={{ height: `${h}%`, animation: `grow .8s cubic-bezier(.16,1,.3,1) ${i * 0.07}s both`, transformOrigin: 'bottom' }} />
      ))}
    </div>
  )
}

/* Full dashboard preview sized for a wide hero tile */
function DashHero() {
  const kpis = [
    { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', v: '$8,240', l: 'Receivable' },
    { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50', v: '₹3,180', l: 'Payable' },
    { icon: Boxes, color: 'text-blue-500', bg: 'bg-blue-50', v: '₹12.4k', l: 'Stock value' },
    { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', v: '3', l: 'Low stock' },
  ]
  return (
    <div className="rounded-2xl bg-[#f6f6f7] p-4 sm:p-5 w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] text-zinc-400 leading-none mb-1 font-mono">/dashboard</p>
          <p className="text-sm font-bold text-zinc-900 tracking-tight">Rahul Traders</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white text-[11px] font-bold">RT</div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <div key={k.l} className="rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)] p-3">
              <div className={`w-7 h-7 rounded-lg ${k.bg} flex items-center justify-center mb-2`}><Icon size={14} className={k.color} /></div>
              <p className="text-lg font-bold tracking-tight text-zinc-900 leading-none">{k.v}</p>
              <p className="text-[10px] text-zinc-400 mt-1">{k.l}</p>
            </div>
          )
        })}
      </div>
      <div className="rounded-xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)] p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-bold text-zinc-900">Recent orders</p>
          <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">See all <ArrowRight size={10} /></span>
        </div>
        <div className="space-y-2">
          {[
            { id: 'SINV-0051', n: 'Bhumi Stores', a: '₹2,400', s: 'Paid', c: 'text-emerald-700 bg-emerald-50' },
            { id: 'SO-0042', n: 'Global Supply', a: '₹860', s: 'Pending', c: 'text-amber-700 bg-amber-50' },
            { id: 'PO-0038', n: 'Annapurna Mills', a: '₹2,100', s: 'Received', c: 'text-blue-700 bg-blue-50' },
          ].map(r => (
            <div key={r.id} className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono text-zinc-400 w-16 shrink-0">{r.id}</span>
              <span className="text-[11px] text-zinc-600 flex-1 truncate">{r.n}</span>
              <span className="text-[11px] font-bold text-zinc-900">{r.a}</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${r.c}`}>{r.s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* dust kicked up by the heavy logo / name landing */
const DUST_LOGO = [
  { s: 9,  tx: '-118px', ty: '-38px', d: 1.0 }, { s: 7,  tx: '-88px',  ty: '-72px', d: 1.1 },
  { s: 11, tx: '-48px',  ty: '-92px', d: 0.9 }, { s: 6,  tx: '2px',    ty: '-104px',d: 1.2 },
  { s: 9,  tx: '58px',   ty: '-88px', d: 0.95 },{ s: 7,  tx: '94px',   ty: '-64px', d: 1.05 },
  { s: 11, tx: '124px',  ty: '-32px', d: 0.9 }, { s: 6,  tx: '142px',  ty: '6px',   d: 1.05 },
  { s: 8,  tx: '-142px', ty: '2px',   d: 1.0 }, { s: 6,  tx: '-70px',  ty: '16px',  d: 1.15 },
  { s: 8,  tx: '72px',   ty: '18px',  d: 1.05 },{ s: 10, tx: '28px',   ty: '-54px', d: 0.85 },
  { s: 5,  tx: '-30px',  ty: '-60px', d: 1.1 }, { s: 7,  tx: '108px',  ty: '-18px', d: 0.95 },
]
const DUST_NAME = [
  { s: 6, tx: '-150px', ty: '-10px', d: 0.85 },{ s: 5, tx: '-100px', ty: '-26px', d: 0.95 },
  { s: 7, tx: '-52px',  ty: '-32px', d: 0.8 }, { s: 7, tx: '54px',   ty: '-32px', d: 0.9 },
  { s: 6, tx: '104px',  ty: '-22px', d: 0.85 },{ s: 5, tx: '154px',  ty: '-8px',  d: 0.95 },
]

/* ════════════════════════════════════════════════════════════════════════
   Page
   ════════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // PWA install handling
  const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent)
  const [canInstall, setCanInstall] = useState(!!getDeferredPrompt())
  useEffect(() => onInstallAvailable((e) => setCanInstall(!!e)), [])
  const handleInstall = async () => {
    const evt = getDeferredPrompt()
    if (evt) {
      evt.prompt()
      await evt.userChoice
      clearDeferredPrompt()
      setCanInstall(false)
    } else {
      // No native prompt available (e.g. iOS Safari) — show step-by-step guide
      navigate('/docs#install')
    }
  }

  // first-visit splash (once per browser)
  const [splash, setSplash] = useState(() => {
    try { return !sessionStorage.getItem('ol_splash_seen') } catch { return false }
  })
  const [splashOut, setSplashOut] = useState(false)
  useEffect(() => {
    if (!splash) return
    document.body.style.overflow = 'hidden'
    const t1 = setTimeout(() => setSplashOut(true), 3200)
    const t2 = setTimeout(() => {
      setSplash(false)
      document.body.style.overflow = 'visible'
      try { sessionStorage.setItem('ol_splash_seen', '1') } catch (_) { }
    }, 3750)
    return () => { clearTimeout(t1); clearTimeout(t2); document.body.style.overflow = 'visible' }
  }, [splash])

  useEffect(() => {
    const b = document.body, h = document.documentElement
    const prev = { bo: b.style.overflow, bp: b.style.position, bw: b.style.width, bh: b.style.height, hh: h.style.height, bg: b.style.background, hbg: h.style.background }
    // let the window be the scroll container (not the body) so window.scrollY tracks
    b.style.overflow = 'visible'; b.style.position = 'static'; b.style.width = 'auto'; b.style.height = 'auto'
    h.style.height = 'auto'
    b.style.background = '#fff'; h.style.background = '#fff'
    const meta = document.querySelector('meta[name="theme-color"]')
    const prevMeta = meta?.getAttribute('content')
    meta?.setAttribute('content', '#ffffff')
    return () => {
      b.style.overflow = prev.bo; b.style.position = prev.bp; b.style.width = prev.bw
      b.style.height = prev.bh; h.style.height = prev.hh
      b.style.background = prev.bg; h.style.background = prev.hbg
      if (prevMeta) meta?.setAttribute('content', prevMeta)
    }
  }, [])

  useEffect(() => {
    const fn = () => setScrolled((window.scrollY || document.documentElement.scrollTop || 0) > 12)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const auraRef = useRef(null)
  useEffect(() => {
    const move = (e) => {
      const el = auraRef.current; if (!el) return
      el.style.setProperty('--cx', `${e.clientX}px`); el.style.setProperty('--cy', `${e.clientY}px`)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white overflow-x-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* first-visit splash */}
      {splash && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white overflow-hidden"
          style={{ animation: splashOut ? 'splashOut .55s ease forwards' : 'none' }}>
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full opacity-70 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.22), transparent 65%)' }} />
          <div className="relative flex flex-col items-center gap-6"
            style={{ animation: 'shake .5s cubic-bezier(.36,.07,.19,.97) .58s both' }}>
            {/* logo — heavy drop + dust */}
            <div className="relative">
              <div className="w-20 h-20 rounded-[22px] bg-zinc-900 flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
                style={{ animation: 'dropHeavy .72s .15s both', transformOrigin: 'bottom center' }}>
                <AppLogo size={44} />
              </div>
              {/* shockwave */}
              <span className="absolute left-1/2 bottom-0 w-24 h-24 rounded-full border-2 border-zinc-400 pointer-events-none"
                style={{ animation: 'shock .6s ease-out .62s both' }} />
              {/* dust */}
              {DUST_LOGO.map((p, i) => (
                <span key={i} className="absolute left-1/2 bottom-1 rounded-full bg-zinc-500/70 pointer-events-none blur-[0.5px]"
                  style={{ width: p.s, height: p.s, '--tx': p.tx, '--ty': p.ty, animation: `dust ${p.d}s ease-out .62s both` }} />
              ))}
            </div>
            {/* name — heavy drop + dust */}
            <div className="relative">
              <span className="block font-black tracking-tight text-xl text-zinc-900"
                style={{ animation: 'dropHeavy .6s .55s both', transformOrigin: 'bottom center' }}>OpenLedger</span>
              {DUST_NAME.map((p, i) => (
                <span key={i} className="absolute left-1/2 bottom-0 rounded-full bg-zinc-500/70 pointer-events-none blur-[0.5px]"
                  style={{ width: p.s, height: p.s, '--tx': p.tx, '--ty': p.ty, animation: `dust ${p.d}s ease-out 1s both` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* full-page blueprint grid */}
      <div className="pointer-events-none fixed inset-0 -z-10"
        style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.035) 1px,transparent 1px)', backgroundSize: '80px 80px' }} />
      {/* cursor aurora */}
      <div ref={auraRef} className="pointer-events-none fixed inset-0 -z-10 hidden md:block"
        style={{ background: 'radial-gradient(480px circle at var(--cx,50%) var(--cy,0%), rgba(124,58,237,0.06), transparent 70%)' }} />

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-zinc-200/60 shadow-[0_1px_20px_rgba(0,0,0,0.04)]' : 'border-b border-transparent'}`}
        style={scrolled ? { backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)' } : undefined}>
        <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-zinc-900 rounded-[10px] flex items-center justify-center"><AppLogo size={15} /></div>
            <span className="font-bold tracking-tight">OpenLedger</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link to="/features" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Features</Link>
            <a href="#pricing" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Pricing</a>
            <Link to="/docs" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Docs</Link>
          </nav>
          <div className="hidden md:flex items-center gap-1.5">
            <Link to="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 px-3 py-2 transition-colors">Sign in</Link>
            <Link to="/register" className="group text-sm font-semibold bg-zinc-900 text-white pl-4 pr-3.5 py-2 rounded-full hover:bg-zinc-700 transition-all flex items-center gap-1">
              Get started <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <button className="md:hidden -mr-2 p-2" onClick={() => setMenuOpen(o => !o)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-zinc-100 px-5 py-5 flex flex-col gap-1">
            <Link to="/features" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-zinc-700 py-2">Features</Link>
            <a href="#pricing" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-zinc-700 py-2">Pricing</a>
            <Link to="/docs" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-zinc-700 py-2">Docs</Link>
            <div className="pt-3 mt-2 border-t border-zinc-100 flex flex-col gap-2">
              <Link to="/login" className="text-sm font-medium text-center py-2.5 border border-zinc-200 rounded-xl">Sign in</Link>
              <Link to="/register" className="text-sm font-semibold text-center bg-zinc-900 text-white py-2.5 rounded-xl">Get started free</Link>
            </div>
          </div>
        )}
      </header>

      {/* ════════ HERO BENTO ════════ */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 pt-28 md:pt-36 pb-16">
        <Mosaic>
          {/* Headline tile */}
          <Cell span="md:col-span-2 md:row-span-2" pad="p-8 md:p-11">
            <div className="flex flex-col h-full justify-center">
              <div style={{ animation: 'fadeUp .7s cubic-bezier(.16,1,.3,1) both' }}
                className="inline-flex w-fit items-center gap-2 text-[11px] font-mono font-medium text-zinc-500 border border-zinc-200 pl-1.5 pr-3 py-1 rounded-full mb-7">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded-full"><Sparkles size={9} /> NEW</span>
                Aura — your AI money assistant
              </div>
              <h1 style={{ animation: 'fadeUp .7s cubic-bezier(.16,1,.3,1) .08s both' }}
                className="text-[2.75rem] leading-[0.92] sm:text-6xl md:text-[4.25rem] md:leading-[0.9] font-black tracking-[-0.05em]">
                Your whole<br />money life,<br />
                <span className="bg-gradient-to-r from-zinc-900 via-zinc-500 to-zinc-900 bg-clip-text text-transparent">on one grid.</span>
              </h1>
              <p style={{ animation: 'fadeUp .7s cubic-bezier(.16,1,.3,1) .16s both' }}
                className="mt-6 text-base md:text-lg text-zinc-500 max-w-md leading-relaxed">
                For home or business — track money, send invoices, manage inventory and let AI do the busywork. Beautifully simple, and completely free.
              </p>
              <div style={{ animation: 'fadeUp .7s cubic-bezier(.16,1,.3,1) .24s both' }} className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/register" className="group inline-flex items-center justify-center gap-2 bg-zinc-900 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-zinc-700 transition-all hover:-translate-y-0.5">
                  Start for free <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <button onClick={handleInstall} className="inline-flex items-center justify-center gap-2 bg-white text-zinc-900 font-semibold px-6 py-3 rounded-full text-sm border border-zinc-200 hover:border-zinc-300 transition-all">
                  {isMobile ? <Smartphone size={15} /> : <Download size={15} />}
                  {isMobile ? 'Install app' : 'Download app'}
                </button>
              </div>
              <p className="mt-7 text-[11px] text-zinc-400 font-mono">no credit card · free forever · installs as an app</p>
            </div>
          </Cell>

          {/* Dashboard preview tile */}
          <Cell span="md:col-span-2 md:row-span-2" pad="p-6 md:p-8" glow="rgba(2,132,199,0.07)">
            <div className="flex items-center justify-center h-full">
              <TiltCard className="w-full max-w-sm relative">
                <div className="absolute -inset-6 rounded-full opacity-60 blur-3xl pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.18), transparent 65%)' }} />
                <div className="relative shadow-[0_24px_70px_rgba(0,0,0,0.14)] rounded-2xl">
                  <DashHero />
                </div>
              </TiltCard>
            </div>
          </Cell>

          {/* Stat tiles */}
          <Cell span="md:col-span-1" pad="p-6">
            <p className="text-3xl md:text-4xl font-black tracking-tight"><CountUp to={100} suffix="%" /></p>
            <p className="text-xs text-zinc-400 font-medium mt-1">Free forever</p>
          </Cell>
          <Cell span="md:col-span-1" pad="p-6">
            <p className="text-3xl md:text-4xl font-black tracking-tight"><CountUp to={10} suffix="+" /></p>
            <p className="text-xs text-zinc-400 font-medium mt-1">Invoice templates</p>
          </Cell>
          <Cell span="md:col-span-1" pad="p-6">
            <p className="text-3xl md:text-4xl font-black tracking-tight">AI</p>
            <p className="text-xs text-zinc-400 font-medium mt-1">Built-in assistant</p>
          </Cell>
          <Cell span="md:col-span-1" pad="p-6">
            <p className="text-3xl md:text-4xl font-black tracking-tight">PWA</p>
            <p className="text-xs text-zinc-400 font-medium mt-1">Installs anywhere</p>
          </Cell>
        </Mosaic>
      </section>

      {/* ════════ FEATURE BENTO ════════ */}
      <section id="features" className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-24 scroll-mt-20">
        <Reveal>
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <p className="text-xs font-mono text-zinc-400 uppercase tracking-[0.25em] mb-3">[ what's inside ]</p>
              <h2 className="text-4xl md:text-6xl font-black tracking-[-0.04em] leading-[0.98]">Less software.<br /><span className="text-zinc-300">More done.</span></h2>
            </div>
            <p className="text-sm text-zinc-500 max-w-xs">Whether you're splitting bills at home or running a storefront — one tool does it all.</p>
          </div>
        </Reveal>

        <Reveal y={32}>
          <Mosaic>
            {/* Aura — big tile */}
            <Cell span="md:col-span-2 md:row-span-2" pad="p-7 md:p-8">
              <div className="flex flex-col h-full">
                <div className="inline-flex w-fit items-center gap-2 text-[11px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full border border-violet-200 bg-violet-50 text-violet-700 mb-4"><Sparkles size={12} /> AURA AI</div>
                <h3 className="text-2xl md:text-3xl font-black tracking-[-0.03em] mb-2">An AI that runs the busywork.</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-6 max-w-sm">At home or at work — ask about your spending, log expenses, draft orders or scan receipts. Aura just gets it done.</p>
                <div className="mt-auto rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 h-[300px] overflow-hidden"><AuraChat /></div>
              </div>
            </Cell>

            {/* Receipt scanner — tall */}
            <Cell span="md:col-span-2 md:row-span-1" pad="p-7" glow="rgba(225,29,72,0.06)">
              <div className="flex items-start gap-5">
                <div className="flex-1">
                  <div className="inline-flex w-fit items-center gap-2 text-[11px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full border border-rose-200 bg-rose-50 text-rose-600 mb-4"><ScanLine size={12} /> SCANNER</div>
                  <h3 className="text-xl md:text-2xl font-black tracking-[-0.03em] mb-2">Snap a receipt. That's it.</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">Every line item is read, priced and dropped straight into your cart.</p>
                </div>
                <div className="w-32 shrink-0"><ReceiptMini /></div>
              </div>
            </Cell>

            {/* Invoicing */}
            <Cell span="md:col-span-1 md:row-span-1" pad="p-7" glow="rgba(2,132,199,0.06)">
              <div className="inline-flex w-fit items-center gap-2 text-[11px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full border border-sky-200 bg-sky-50 text-sky-600 mb-4"><FileText size={12} /> INVOICING</div>
              <h3 className="text-lg font-black tracking-[-0.02em] mb-3">Invoices worth sending.</h3>
              <InvoiceMini />
            </Cell>

            {/* Finance */}
            <Cell span="md:col-span-1 md:row-span-1" pad="p-7" glow="rgba(245,158,11,0.06)">
              <div className="inline-flex w-fit items-center gap-2 text-[11px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-600 mb-4"><TrendingUp size={12} /> FINANCE</div>
              <h3 className="text-lg font-black tracking-[-0.02em] mb-3">Your numbers, clear.</h3>
              <FinanceMini />
            </Cell>
          </Mosaic>
        </Reveal>
      </section>

      {/* ════════ THE CYCLE ════════ */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-24">
        <Reveal>
          <Mosaic>
            <Cell span="md:col-span-4" pad="p-8 md:p-12">
              <p className="text-xs font-mono text-violet-500 uppercase tracking-[0.25em] mb-3">[ for businesses ]</p>
              <h2 className="text-3xl md:text-5xl font-black tracking-[-0.04em] leading-[1.02] max-w-xl">Running a business? The full cycle, covered.</h2>
              <p className="mt-3 text-sm text-zinc-500 max-w-md">Switch to a Business workspace for orders, inventory and invoicing — purchase to payment, without the spreadsheets.</p>
            </Cell>
            {[
              { icon: ShoppingCart, t: 'Orders', d: 'Purchase & sales orders, GRNs, delivery tracking.', c: 'text-blue-500 bg-blue-50' },
              { icon: Boxes, t: 'Inventory', d: 'Live stock with every order. Low-stock alerts.', c: 'text-emerald-600 bg-emerald-50' },
              { icon: FileText, t: 'Invoicing', d: 'Beautiful PDFs, email delivery, aging reports.', c: 'text-violet-600 bg-violet-50' },
              { icon: TrendingUp, t: 'Finance', d: 'Income, expenses, budgets, group finances.', c: 'text-amber-500 bg-amber-50' },
            ].map(c => {
              const Icon = c.icon
              return (
                <Cell key={c.t} span="md:col-span-1" pad="p-6">
                  <div className={`w-9 h-9 rounded-xl ${c.c} flex items-center justify-center mb-4`}><Icon size={17} /></div>
                  <h3 className="text-sm font-bold mb-1.5">{c.t}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">{c.d}</p>
                </Cell>
              )
            })}
          </Mosaic>
        </Reveal>
      </section>

      {/* ════════ PRICING ════════ */}
      <section id="pricing" className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-24 scroll-mt-20">
        <Reveal>
          <div className="text-center mb-10">
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-[0.25em] mb-3">[ pricing ]</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em]">Free. Genuinely.</h2>
          </div>
        </Reveal>
        <Reveal y={28}>
          <Mosaic>
            <Cell span="md:col-span-2" pad="p-8">
              <div className="flex flex-col h-full">
                <p className="text-xs text-zinc-400 mb-1">For households & individuals</p>
                <h3 className="text-lg font-black mb-3">Personal</h3>
                <div className="flex items-end gap-1.5 mb-6"><span className="text-4xl font-black tracking-tight">Free</span><span className="text-sm text-zinc-400 mb-1">/ forever</span></div>
                <ul className="space-y-2.5 mb-7">
                  {['Expense & income tracking', 'Budgets & planning', 'Wishlist & shopping cart', 'Shared group spaces'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm"><Check size={15} className="shrink-0 text-emerald-600" /><span className="text-zinc-600">{f}</span></li>
                  ))}
                </ul>
                <Link to="/register" className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold bg-white border border-zinc-300 text-zinc-900 hover:bg-zinc-50 transition-all">Get started <ArrowRight size={14} /></Link>
              </div>
            </Cell>
            <Cell span="md:col-span-2" pad="p-8" className="!bg-zinc-900 hover:!bg-zinc-900" glow="rgba(124,58,237,0.18)">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-zinc-500">For shops, teams & companies</p>
                  <span className="inline-block text-[10px] font-bold bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-2.5 py-0.5 rounded-full">Most popular</span>
                </div>
                <h3 className="text-lg font-black mb-3 text-white">Business</h3>
                <div className="flex items-end gap-1.5 mb-6"><span className="text-4xl font-black tracking-tight text-white">Free</span><span className="text-sm text-zinc-500 mb-1">/ during launch</span></div>
                <ul className="space-y-2.5 mb-7">
                  {['Everything in Personal', 'Purchase & sales orders', 'Inventory & stock control', 'AR / AP aging reports', '10 invoice templates', 'Aura AI assistant'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm"><Check size={15} className="shrink-0 text-emerald-400" /><span className="text-zinc-300">{f}</span></li>
                  ))}
                </ul>
                <Link to="/register" className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold bg-white text-zinc-900 hover:bg-zinc-100 transition-all">Start your workspace <ArrowRight size={14} /></Link>
              </div>
            </Cell>
          </Mosaic>
        </Reveal>
      </section>

      {/* ════════ CTA ════════ */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 py-16 md:py-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-[1.5rem] bg-zinc-900 px-6 py-20 md:py-28 text-center">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 -translate-x-1/2 -top-1/3 w-[800px] h-[800px] opacity-50"
                style={{ background: 'conic-gradient(from 90deg at 50% 50%, transparent, rgba(139,92,246,0.35), rgba(56,189,248,0.25), transparent)', filter: 'blur(70px)', animation: 'spin 20s linear infinite' }} />
            </div>
            <div className="relative">
              <h2 className="text-4xl md:text-7xl font-black tracking-[-0.05em] leading-[0.95] mb-6 text-white">
                Run it all from<br /><span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">your pocket.</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-10 max-w-md mx-auto">Ditch the spreadsheets for something you'll actually enjoy using.</p>
              <Link to="/register" className="group inline-flex items-center gap-2 bg-white text-zinc-900 font-bold px-8 py-4 rounded-full text-sm hover:bg-zinc-100 transition-all hover:-translate-y-0.5">
                Create your free account <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-200/70 py-10 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center"><AppLogo size={13} /></div>
            <span className="font-bold text-sm">OpenLedger</span>
          </div>
          <p className="text-xs text-zinc-400 order-3 md:order-2 font-mono">© {new Date().getFullYear()} OpenLedger — for households and businesses alike.</p>
          <div className="flex gap-6 order-2 md:order-3">
            <Link to="/features" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">Features</Link>
            <a href="#pricing" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">Pricing</a>
            <Link to="/docs" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">Docs</Link>
            <Link to="/login" className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
        @keyframes scan   { 0% { top: -12%; } 100% { top: 100%; } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes msgIn  { from { opacity: 0; transform: translateY(8px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes dot    { 0%,60%,100% { opacity: .25; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
        @keyframes grow   { from { transform: scaleY(0); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
        @keyframes splashOut  { from { opacity: 1; } to { opacity: 0; visibility: hidden; } }
        @keyframes dropHeavy {
          0%   { opacity: 0; transform: translateY(-240px) scale(1.12); animation-timing-function: cubic-bezier(.45,.05,.95,.4); }
          45%  { opacity: 1; }
          62%  { transform: translateY(0) scaleX(1.14) scaleY(.8); }
          74%  { transform: translateY(-22px) scaleX(.93) scaleY(1.1); }
          86%  { transform: translateY(0) scaleX(1.05) scaleY(.96); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes dust {
          0%   { opacity: 0; transform: translate(-50%, 0) scale(.3); }
          15%  { opacity: .85; }
          100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), var(--ty)) scale(1.1); }
        }
        @keyframes shock {
          0%   { opacity: .5; transform: translateX(-50%) scale(.25); }
          100% { opacity: 0; transform: translateX(-50%) scale(2.3); }
        }
        @keyframes shake {
          0%   { transform: translate(0,0); }
          12%  { transform: translate(-5px, 4px); }
          24%  { transform: translate(6px, -3px); }
          38%  { transform: translate(-5px, 2px); }
          52%  { transform: translate(4px, 3px); }
          66%  { transform: translate(-3px, -2px); }
          80%  { transform: translate(2px, 1px); }
          100% { transform: translate(0,0); }
        }
        @media (prefers-reduced-motion: reduce) { *,*::before,*::after { animation-duration:.001ms!important; animation-iteration-count:1!important; } }
      `}</style>
    </div>
  )
}
