export function TermsPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center p-6">
      <div className="w-full max-w-2xl mt-12">
        <a href="/" className="text-accent hover:text-accent-dim text-sm transition-colors">
          ← Back to Switchboard
        </a>

        <h1 className="text-3xl font-bold text-white mt-6 mb-1">Terms of Use</h1>
        <p className="text-gray-500 text-sm mb-8">Effective date: March 2025</p>

        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-semibold text-base mb-2">1. Acceptance</h2>
            <p>
              By accessing or using Switchboard ("the Service"), you agree to these Terms of Use.
              If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">2. What Switchboard Is</h2>
            <p>
              Switchboard is a browser-based tool that facilitates direct peer-to-peer (P2P)
              communication using WebRTC. The service provides only a temporary signaling
              channel to help browsers establish direct connections. No audio, video, screen
              content, or chat messages ever pass through or are stored on any server operated
              by this service.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">3. Acceptable Use</h2>
            <p className="mb-2">You agree <strong className="text-white">not</strong> to use Switchboard to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Engage in any activity that violates applicable local, national, or international law</li>
              <li>Distribute, transmit, or solicit child sexual abuse material (CSAM) or any illegal content</li>
              <li>Harass, threaten, or harm any individual</li>
              <li>Facilitate fraud, extortion, or any criminal enterprise</li>
              <li>Transmit malware or attempt to disrupt the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">4. No Moderation or Monitoring</h2>
            <p>
              Because all communication is end-to-end peer-to-peer and no content is routed
              through our servers, we have no technical ability to monitor, record, or moderate
              any communications made through Switchboard. You are solely responsible for
              your own conduct and all content you transmit.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">5. No Warranties</h2>
            <p>
              The Service is provided "as is" without warranty of any kind. We make no
              guarantees of uptime, connection quality, or fitness for any particular purpose.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, the operators of Switchboard shall not
              be liable for any damages arising from your use of the Service, including but not
              limited to any content transmitted between users.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">7. Changes</h2>
            <p>
              These terms may be updated at any time. Continued use of the Service after
              changes constitutes acceptance of the updated terms.
            </p>
          </section>
        </div>

        <div className="mt-12 mb-8 text-center text-xs text-gray-600 space-x-4">
          <a href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
          <span>·</span>
          <a href="/" className="hover:text-gray-400 transition-colors">Home</a>
        </div>
      </div>
    </div>
  );
}
