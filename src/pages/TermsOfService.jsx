import { Link } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import AppLogo from '../components/ui/AppLogo'

export default function TermsOfService() {
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
            <FileText size={17} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400">Legal</p>
            <h1 className="text-3xl font-black tracking-[-0.02em]">Terms of Service</h1>
          </div>
        </div>

        <p className="text-sm text-zinc-400 mb-10">Last updated: August 28, 2026</p>

        <div className="space-y-10 text-[15px] leading-relaxed text-zinc-600 max-w-2xl">
          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using OpenLedger, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">2. Description of Service</h2>
            <p>OpenLedger is a financial management and inventory tracking application designed for households and businesses. Features include transaction tracking, product management, invoicing, budgeting, group collaboration, and AI-assisted bookkeeping.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>You must provide accurate information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must not share your account with others or allow unauthorized access.</li>
              <li>You must be at least 13 years old to use this service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">4. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Use the service for any unlawful purpose.</li>
              <li>Attempt to gain unauthorized access to the service or its systems.</li>
              <li>Interfere with or disrupt the service or servers.</li>
              <li>Upload malicious code or content.</li>
              <li>Scrape, crawl, or otherwise extract data from the service without permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">5. Your Data</h2>
            <p>You retain ownership of all data you enter into OpenLedger. We do not claim ownership of your financial records, products, invoices, or any other content you create. See our <Link to="/privacy" className="text-zinc-900 underline underline-offset-2 hover:text-zinc-600 transition-colors">Privacy Policy</Link> for details on how we handle your data.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">6. Group Collaboration</h2>
            <p>When you create or join a group, data within that group is shared with all group members. You are responsible for who you invite to your groups and the data you share within them.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">7. Service Availability</h2>
            <p>We strive to keep OpenLedger available at all times but do not guarantee uninterrupted access. We may temporarily suspend the service for maintenance, updates, or unforeseen circumstances.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">8. Limitation of Liability</h2>
            <p>OpenLedger is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to financial losses resulting from reliance on data within the application.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">9. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through the Settings page.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">10. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-zinc-900 mb-3">11. Contact</h2>
            <p>For questions about these terms, contact us at <a href="mailto:swapnilhgf@gmail.com" className="text-zinc-900 underline underline-offset-2 hover:text-zinc-600 transition-colors">swapnilhgf@gmail.com</a>.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
