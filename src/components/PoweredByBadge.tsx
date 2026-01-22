export default function PoweredByBadge() {
  // Manually update this number when you make changes
  const buildNumber = 347; // <-- Just increment this yourself

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <p className="text-xs font-medium text-gray-400 whitespace-nowrap">
        Powered by Kelpie AI | v0.8.0.{buildNumber}
      </p>
    </div>
  );
}