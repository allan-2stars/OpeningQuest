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
  { to: "/design-system", label: "DS" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 border-b border-slate-700 bg-primary px-6 py-3">
        <span className="text-xl font-bold text-secondary">Opening Quest</span>
        <nav className="flex gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `rounded px-3 py-1.5 text-sm transition-colors ${
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
      <main className="flex-1 overflow-auto bg-surface p-6">{children}</main>
    </div>
  );
}
