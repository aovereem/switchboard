export function Footer() {
  return (
    <footer className="mt-10 text-center text-xs text-gray-600 space-x-4">
      <a href="/terms" className="hover:text-gray-400 transition-colors">Terms of Use</a>
      <span>·</span>
      <a href="/privacy" className="hover:text-gray-400 transition-colors">Privacy</a>
      <span>·</span>
      <a
        href="https://github.com/aovereem/switchboard"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-gray-400 transition-colors"
      >
        Open Source (MIT)
      </a>
    </footer>
  );
}
