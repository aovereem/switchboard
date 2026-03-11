export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center p-6">
      <div className="w-full max-w-2xl mt-12">
        <a href="/" className="text-accent hover:text-accent-dim text-sm transition-colors">
          ← Back to Switchboard
        </a>

        <h1 className="text-3xl font-bold text-white mt-6 mb-1">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Effective date: March 2025</p>

        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-semibold text-base mb-2">The Short Version</h2>
            <p className="text-gray-200">
              We collect nothing. When your session ends, nothing about it remains anywhere.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">What We Do Not Collect</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>No account, email address, or personal identifier is ever required</li>
              <li>No audio, video, screen content, or chat messages are transmitted to or stored by us</li>
              <li>No usage analytics or tracking scripts are loaded</li>
              <li>No cookies are set</li>
              <li>No IP addresses are logged or retained</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">How It Works</h2>
            <p>
              Switchboard uses a signaling server hosted on Cloudflare Workers solely to help
              two browsers find each other. This signaling channel carries only small
              connection-setup messages (SDP offers/answers and ICE candidates — technical
              handshake data with no user content). Once browsers are connected, all
              communication flows directly between them (WebRTC P2P) and the server is
              uninvolved.
            </p>
            <p className="mt-2">
              Signaling messages are held in memory only for the duration of the session and
              are discarded when the last participant leaves the room.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">Third-Party Services</h2>
            <p>
              Switchboard uses Google's public STUN servers (
              <span className="font-mono text-gray-400">stun.l.google.com</span>) to assist
              with NAT traversal. Your IP address may be visible to Google's STUN servers
              during connection setup, as is standard for any WebRTC application. Refer to
              Google's privacy policy for their data practices.
            </p>
            <p className="mt-2">
              The app is served by Cloudflare Pages. Standard Cloudflare access logs may
              include your IP address and request metadata as part of their infrastructure
              operation. Refer to Cloudflare's privacy policy for details.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">Open Source</h2>
            <p>
              Switchboard is open source. You can inspect exactly how it works at{' '}
              <a
                href="https://github.com/aovereem/switchboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-dim transition-colors"
              >
                github.com/aovereem/switchboard
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-base mb-2">Contact</h2>
            <p>
              Questions? Open an issue on the{' '}
              <a
                href="https://github.com/aovereem/switchboard/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-dim transition-colors"
              >
                GitHub repository
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 mb-8 text-center text-xs text-gray-600 space-x-4">
          <a href="/terms" className="hover:text-gray-400 transition-colors">Terms of Use</a>
          <span>·</span>
          <a href="/" className="hover:text-gray-400 transition-colors">Home</a>
        </div>
      </div>
    </div>
  );
}
