import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/adventure", label: "Adventure" },
  { to: "/classic", label: "Classic" },
  { to: "/practice", label: "Practice" },
  { to: "/collection", label: "Collection" },
  { to: "/profile", label: "Profile" },
  { to: "/settings", label: "Settings" },
  { to: "/import-export", label: "Import/Export" },
  { to: "/statistics", label: "Statistics" },
  ...(import.meta.env.DEV ? [{ to: "/design-system", label: "DS" }, { to: "/analysis", label: "Analysis" }] : []),
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-slate-700 bg-primary px-4 py-2 overflow-x-auto">
        <span className="text-lg sm:text-xl font-bold text-secondary shrink-0">Opening Quest</span>
        <nav className="flex gap-0.5 shrink-0">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `rounded px-2 sm:px-3 py-1.5 text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-primary-light text-secondary"
                    : "text-slate-300 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex-1 overflow-auto bg-surface p-3 sm:p-4 lg:p-6">{children}</main>
    </div>
  );
}
