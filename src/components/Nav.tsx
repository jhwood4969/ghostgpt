import { NavLink } from "react-router-dom";
import { GhostMark } from "./GhostMark";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/chat", label: "Chat" },
  { to: "/code", label: "Ghost IDE" },
  { to: "/api", label: "API" },
];

export function Nav() {
  return (
    <header className="site-nav">
      <NavLink to="/" className="brand-lockup" end>
        <GhostMark size={28} className="brand-mark" />
        <span className="brand-word">GhostGPT</span>
      </NavLink>
      <nav className="nav-links" aria-label="Primary">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
