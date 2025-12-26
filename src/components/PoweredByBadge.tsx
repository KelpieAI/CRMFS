export default function PoweredByBadge() {
  // Manually update this number when you make changes
  const buildNumber = 112; // <-- Just increment this yourself

  return (
    <div className="fixed bottom-4 right-4 z-50">
       <p className="text-xs font-medium whitespace-nowrap">
          Powered by Kelpie AI | v0.1.5.{buildNumber} | DEMO PURPOSES ONLY
        </p>
      </div>
    </div>
  );
}