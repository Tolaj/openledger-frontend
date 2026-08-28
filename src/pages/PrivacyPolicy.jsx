import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'
import AppLogo from '../components/ui/AppLogo'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-3xl mx-auto flex items-center gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <AppLogo size={14} />
            </div>
            <span className="font-bold text-sm">OpenLedger</span>
          </Link>
          <div className="flex-1" />
          <Link to="/" className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-900 transition-colors">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-14">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center">
            <Shield size={17} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">Legal</p>
            <h1 className="text-3xl font-black tracking-[-0.02em]">Privacy Policy</h1>
          </div>
        </div>

        <p className="text-sm text-zinc-400 mb-10">Last updated: August 28, 2026</p>

        <div className="space-y-10 text-[15px] leading-relaxed text-zinc-600 max-w-2xl">
          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">1. Information We Collect</h2>
            <p className="mb-3">When you use OpenLedger, we may collect the following information:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-zinc-900">Account information</strong> — your name, email address, and country when you register.</li>
              <li><strong className="text-zinc-900">Business data</strong> — products, transactions, invoices, and financial records you create within the app.</li>
              <li><strong className="text-zinc-900">Authentication data</strong> — if you sign in with Google, we receive your name and email from your Google account.</li>
              <li><strong className="text-zinc-900">Device information</strong> — browser type, operating system, and push notification tokens if you enable notifications.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To provide, maintain, and improve the OpenLedger service.</li>
              <li>To authenticate your identity and secure your account.</li>
              <li>To send transactional emails such as group invitations.</li>
              <li>To deliver push notifications you have opted in to.</li>
              <li>To generate financial reports and insights within your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">3. Data Storage & Security</h2>
            <p>Your data is stored in secured cloud databases. We use industry-standard encryption for data in transit (TLS) and apply access controls to protect your information. Sensitive credentials such as SMTP passwords are encrypted at rest using AES-256-GCM.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">4. Data Sharing</h2>
            <p className="mb-3">We do not sell your personal data. We may share information only in these circumstances:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-zinc-900">With your group members</strong> — data within a shared group is visible to all members of that group.</li>
              <li><strong className="text-zinc-900">Service providers</strong> — we use third-party services (e.g., email delivery, cloud hosting) that process data on our behalf.</li>
              <li><strong className="text-zinc-900">Legal requirements</strong> — if required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">5. Your Rights</h2>
            <p>You can access, update, or delete your account data at any time through the Settings page. If you wish to delete your account entirely, contact us and we will remove your data from our systems.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">6. Cookies & Local Storage</h2>
            <p>OpenLedger uses browser local storage to maintain your session, preferences, and active group selection. We do not use third-party tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">7. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. We will notify you of significant changes by posting a notice within the app.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">8. Contact</h2>
            <p>If you have questions about this privacy policy, please reach out to us at <a href="mailto:swapnilhgf@gmail.com" className="text-zinc-900 underline underline-offset-2 hover:text-zinc-600 transition-colors">swapnilhgf@gmail.com</a>.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
