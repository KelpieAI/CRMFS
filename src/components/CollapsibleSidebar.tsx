import React, { useEffect, useMemo, useState } from "react";

type SidebarMode = "expanded" | "collapsed" | "hover";

type NavItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
};

const LS_KEY = "crmfs.sidebarMode";

function DashIcon() {
  // “dash” icon as requested (simple)
  return (
    <span className="inline-block w-5 text-center font-black leading-none">—</span>
  );
}

export function AppSidebar({
  brandTitle = "Kelpie AI",
  brandSub = "CRMFS",
  items,
  onSignOut,
}: {
  brandTitle?: string;
  brandSub?: string;
  items: NavItem[];
  onSignOut: () => void;
}) {
  const [mode, setMode] = useState<SidebarMode>("expanded");
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(LS_KEY) as SidebarMode | null;
    if (saved === "expanded" || saved === "collapsed" || saved === "hover") {
      setMode(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LS_KEY, mode);
  }, [mode]);

  const actuallyExpanded = useMemo(() => {
    if (mode === "expanded") return true;
    if (mode === "collapsed") return false;
    // hover mode
    return isHovering;
  }, [mode, isHovering]);

  return (
    <aside
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={[
        "h-screen sticky top-0 flex flex-col border-r",
        "bg-slate-950/95 border-white/10 text-white",
        "transition-[width] duration-200 ease-out",
        actuallyExpanded ? "w-64" : "w-20",
      ].join(" ")}
    >
      {/* Brand */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <div className="h-11 w-11 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 flex items-center justify-center font-extrabold text-emerald-300">
            K
          </div>
          {actuallyExpanded && (
            <div className="min-w-0">
              <div className="font-extrabold leading-tight truncate">{brandTitle}</div>
              <div className="text-xs text-white/60 truncate">{brandSub}</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 flex-1">
        <div className="space-y-2">
          {items.map((it) => (
            <button
              key={it.key}
              onClick={it.onClick}
              className={[
                "w-full flex items-center gap-3 rounded-xl border px-3 py-3",
                "transition-colors",
                it.active
                  ? "bg-emerald-400/15 border-emerald-400/30 text-white"
                  : "bg-transparent border-transparent text-white/70 hover:bg-white/5 hover:border-white/10 hover:text-white",
                actuallyExpanded ? "justify-start" : "justify-center",
              ].join(" ")}
              title={!actuallyExpanded ? it.label : undefined}
            >
              <span className="text-lg">{it.icon}</span>
              {actuallyExpanded && <span className="font-semibold">{it.label}</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom controls */}
      <div className="p-3 space-y-2 border-t border-white/10">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
          <div className={actuallyExpanded ? "px-2 pb-2 text-xs text-white/60" : "sr-only"}>
            Sidebar mode
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMode("expanded")}
              className={[
                "rounded-lg border px-2 py-2 text-sm",
                "transition-colors",
                mode === "expanded"
                  ? "bg-emerald-400/20 border-emerald-400/30 text-white"
                  : "bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white",
              ].join(" ")}
              title="Expanded"
            >
              <DashIcon />
            </button>

            <button
              onClick={() => setMode("collapsed")}
              className={[
                "rounded-lg border px-2 py-2 text-sm",
                "transition-colors",
                mode === "collapsed"
                  ? "bg-emerald-400/20 border-emerald-400/30 text-white"
                  : "bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white",
              ].join(" ")}
              title="Collapsed"
            >
              <DashIcon />
            </button>

            <button
              onClick={() => setMode("hover")}
              className={[
                "rounded-lg border px-2 py-2 text-sm",
                "transition-colors",
                mode === "hover"
                  ? "bg-emerald-400/20 border-emerald-400/30 text-white"
                  : "bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:text-white",
              ].join(" ")}
              title="Expand on hover"
            >
              <DashIcon />
            </button>
          </div>

          {actuallyExpanded && (
            <div className="px-2 pt-2 text-xs text-white/50">
              Hover mode expands while your cursor is over the sidebar.
            </div>
          )}
        </div>

        <button
          onClick={onSignOut}
          className={[
            "w-full rounded-xl border border-red-500/25",
            "bg-red-500/10 hover:bg-red-500/15 text-red-100",
            "px-3 py-3 font-semibold transition-colors",
          ].join(" ")}
        >
          {actuallyExpanded ? "Sign out" : "⎋"}
        </button>
      </div>
    </aside>
  );
}
