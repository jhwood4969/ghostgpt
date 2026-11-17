import { Link } from "react-router-dom";
import { GhostMark } from "../components/GhostMark";

export function Landing() {
  return (
    <div className="landing">
      <section className="hero" aria-label="GhostGPT">
        <div className="hero-media" aria-hidden="true">
          <img src="/banner.png" alt="" className="hero-banner" />
          <div className="hero-veil" />
          <div className="signal-waves" />
        </div>

        <div className="hero-copy">
          <p className="brand-hero">
            <GhostMark size={42} className="brand-mark" />
            GhostGPT
          </p>
          <h1 className="hero-title">Uncensored AI chat and API</h1>
          <p className="hero-lede">
            Multi-model routing across Nano, Pro, and Ultra — built for developers who need speed,
            code, and an OpenAI-compatible gateway.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/chat">
              Open chat
            </Link>
            <Link className="btn btn-ghost" to="/api">
              View API
            </Link>
          </div>
        </div>
      </section>

      <section className="section stack-section" id="platform">
        <h2>One platform, three signal strengths</h2>
        <p className="section-lede">
          Pick the tier that matches the job — then route through the same chat UI and API contract.
        </p>
        <div className="tier-row" role="list">
          {[
            {
              name: "Nano",
              blurb: "Fast answers for drafts, lookups, and high-volume prompts.",
            },
            {
              name: "Pro",
              blurb: "Balanced reasoning for engineering work and long threads.",
            },
            {
              name: "Ultra",
              blurb: "Maximum fidelity for hard problems and production code.",
            },
          ].map((tier) => (
            <article key={tier.name} className="tier" role="listitem">
              <h3>{tier.name}</h3>
              <p>{tier.blurb}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section stack-section" id="capabilities">
        <h2>Built for serious workflows</h2>
        <p className="section-lede">
          Low-latency streaming, key-gated access, and a developer toolchain that stays out of the way.
        </p>
        <ul className="capability-list">
          <li>
            <strong>Streaming chat</strong>
            <span>Token-by-token replies in the browser with local session history.</span>
          </li>
          <li>
            <strong>OpenAI-compatible API</strong>
            <span>
              Drop-in <code>/v1/chat/completions</code> and <code>/v1/models</code> with{" "}
              <code>ghost_</code> keys.
            </span>
          </li>
          <li>
            <strong>Ghost IDE</strong>
            <span>A focused workspace for code generation and refactors.</span>
          </li>
        </ul>
      </section>

      <section className="section cta-section">
        <h2>Stay in the signal</h2>
        <p className="section-lede">Launch chat now, or wire your tools to the GhostGPT gateway.</p>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/chat">
            Start chatting
          </Link>
          <Link className="btn btn-ghost" to="/code">
            Open Ghost IDE
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <span>GhostGPT</span>
        <span className="muted">ghostgpt.live</span>
      </footer>
    </div>
  );
}
