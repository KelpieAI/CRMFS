import { VERSION_STRING } from '../lib/version';

export default function PoweredByBadge() {
  return (
    <div
      className="fixed bottom-4 right-4 z-50"
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <p className="text-xs font-medium text-gray-400 whitespace-nowrap">
        Powered by Kelpie AI | {VERSION_STRING}
      </p>
    </div>
  );
}