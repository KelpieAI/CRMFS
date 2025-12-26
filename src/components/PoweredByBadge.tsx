export default function PoweredByBadge() {
  // Manually update this number when you make changes
  const buildNumber = 73; // <-- Just increment this yourself

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-yellow-400 px-4 py-2 rounded-lg shadow-lg border-2 border-yellow-600/50 backdrop-blur-sm">
        <p className="text-xs font-medium whitespace-nowrap">
          Powered by Kelpie AI | v0.1.5.{buildNumber} | DEMO PURPOSES ONLY
        </p>
      </div>
    </div>
  );
}