import { useState, useEffect } from 'react';

export default function PoweredByBadge() {
  const [version, setVersion] = useState('0.1.5.0');

  useEffect(() => {
    // Get the build number from environment variable (set during build)
    const buildNumber = import.meta.env.VITE_BUILD_NUMBER || '0';
    setVersion(`0.1.5.${buildNumber}`);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-yellow-400 px-4 py-2 rounded-lg shadow-lg border-2 border-yellow-600/50 backdrop-blur-sm">
        <p className="text-xs font-medium whitespace-nowrap">
          Powered by Kelpie AI | v{version} | DEMO PURPOSES ONLY
        </p>
      </div>
    </div>
  );
}