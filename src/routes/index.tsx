import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, background: "#0A0A0A", color: "#fff", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500&display=swap');
        .au-serif { font-family: 'Playfair Display', serif !important; }
        .au-gold { color: #C9A84C !important; }
        .au-muted { color: rgba(255,255,255,0.45) !important; }
        .au-mid { color: rgba(255,255,255,0.7) !important; }
        .au-border { border: 0.5px solid rgba(201,168,76,0.2) !important; }
        .au-btn-primary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 1rem 2.5rem; border-radius: 100px;
          background: linear-gradient(135deg, #E8C97A, #9A7A2E);
          color: #000; font-size: 14px; font-weight: 500;
          text-decoration: none; letter-spacing: 0.05em;
          transition: opacity 0.2s, transform 0.2s;
        }
        .au-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .au-btn-ghost {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 1rem 2.5rem; border-radius: 100px;
          border: 1px solid rgba(201,168,76,0.2);
          color: rgba(255,255,255,0.8); font-size: 14px;
          text-decoration: none; letter-spacing: 0.05em;
          transition: border-color 0.2s, color 0.2s;
        }
        .au-btn-ghost:hover { border-color: rgba(201,168,76,0.5); color: #fff; }
        .au-feature-card { background: #111; transition: background 0.2s; }
        .au-feature-card:hover { background: #1A1A1A; }
        .au-mode-pill { transition: color 0.2s, background 0.2s; }
        .au-mode-pill:hover { color: #C9A84C !important; background: rgba(201,168,76,0.04) !important; }
        .au-pricing-card { transition: border-color 0.2s; }
        .au-pricing-card:hover { border-color: rgba(201,168,76,0.5) !important; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2.5rem", borderBottom: "0.5px solid rgba(201,168,76,0.2)", background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#C9A84C", background: "#111" }}>Au</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#fff", letterSpacing: "0.05em" }}>Aurum OS</div>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#C9A84C", marginTop: -2 }}>Intelligence Platform</div>
          </div>
        </div>
        <Link to="/dashboard" className="au-btn-primary" style={{ padding: "0.6rem 1.5rem", fontSize: 13 }}>Enter the OS →</Link>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "8rem 2rem 6rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(201,168,76,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ fontSize: 10, letterSpacing: "0.4em", color: "#C9A84C", textTransform: "uppercase", marginBottom: "2rem", opacity: 0.9 }}>Aurum OS · Now in Early Access</div>
        <h1 className="au-serif" style={{ fontSize: "clamp(3rem, 8vw, 7rem)", lineHeight: 1.0, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: "2rem", maxWidth: 900 }}>
          Your entry into<br /><em style={{ color: "#C9A84C" }}>luxury industries.</em>
        </h1>
        <p style={{ fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "rgba(255,255,255,0.7)", maxWidth: 560, margin: "0 auto 3rem", fontWeight: 300, lineHeight: 1.7 }}>
          The AI operating system for ambitious professionals breaking into superyachts, private aviation, ultra-prime real estate, and collector cars — with or without experience.
        </p>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
          <Link to="/onboarding" className="au-btn-primary">Start for free →</Link>
          <a href="#how" className="au-btn-ghost">See how it works</a>
        </div>
      </section>

      {/* MODES STRIP */}
      <div style={{ borderTop: "0.5px solid rgba(201,168,76,0.2)", borderBottom: "0.5px solid rgba(201,168,76,0.2)", background: "#111", display: "flex", justifyContent: "center" }}>
        {[["⚓", "Superyachts"], ["✈", "Private Aviation"], ["🏛", "Ultra-Prime Real Estate"], ["🏎", "Collector Cars"]].map(([icon, label]) => (
          <div key={label} className="au-mode-pill" style={{ flex: 1, maxWidth: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "1.75rem 1rem", borderRight: "0.5px solid rgba(201,168,76,0.2)", fontSize: 11, letterSpacing: "0.2em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>
            <div style={{ fontSize: 20 }}>{icon}</div>
            {label}
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section style={{ padding: "7rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.4em", color: "#C9A84C", textTransform: "uppercase", marginBottom: "1.5rem" }}>The Platform</div>
        <h2 className="au-serif" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 400, lineHeight: 1.1, marginBottom: "1.5rem" }}>
          Everything you need to<br /><em style={{ color: "#C9A84C" }}>break in and rise fast.</em>
        </h2>
        <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.7)", maxWidth: 560, lineHeight: 1.8, marginBottom: "4rem" }}>
          Aurum OS combines live market intelligence, an AI mentor, content creation, and a structured learning system — all built around one goal: getting you into the room.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5px", background: "rgba(201,168,76,0.2)", border: "0.5px solid rgba(201,168,76,0.2)", borderRadius: 16, overflow: "hidden" }}>
          {[
            ["⚡", "AURUM Mentor", "Your personal AI strategist. Ask anything — market positioning, outreach scripts, deal structuring, network moves. Available 24/7, remembers your journey."],
            ["📡", "Live Intelligence", "Real-time industry signals curated every 6 hours. Market moves, deal news, key players — turned into actionable insights for your sector."],
            ["✦", "Content Studio", "Generate viral-ready content for Instagram, TikTok, and LinkedIn in under 30 seconds. Built for the luxury world — hooks, scripts, captions, visuals."],
            ["🎓", "Academy Tracks", "Structured learning paths for each industry. From zero to closing your first deal — with insider terminology, client psychology, and deal flow."],
            ["📅", "Event Calendar", "Every major industry event mapped — Monaco Yacht Show, NBAA, Pebble Beach, MIPIM. Know where to be, months in advance."],
            ["🎯", "Daily Execution", "AI-generated daily tasks tailored to your level. Networking, content, outreach, learning — a complete execution system that builds momentum."],
          ].map(([icon, title, desc]) => (
            <div key={title} className="au-feature-card" style={{ padding: "2.5rem" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: "1.5rem", background: "#0A0A0A" }}>{icon}</div>
              <div className="au-serif" style={{ fontSize: "1.2rem", fontWeight: 400, marginBottom: "0.75rem" }}>{title}</div>
              <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: "0 2rem 7rem", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1px", background: "rgba(201,168,76,0.2)", border: "0.5px solid rgba(201,168,76,0.2)", borderRadius: 16, overflow: "hidden" }}>
          {[["4", "Luxury Industries"], ["231+", "Live Intelligence Articles"], ["80+", "Industry Events Mapped"], ["24/7", "AI Mentor Access"]].map(([num, label]) => (
            <div key={label} style={{ background: "#111", padding: "3rem 2.5rem", textAlign: "center" }}>
              <div className="au-serif" style={{ fontSize: "3rem", fontWeight: 400, color: "#C9A84C", lineHeight: 1, marginBottom: "0.5rem" }}>{num}</div>
              <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: "7rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.4em", color: "#C9A84C", textTransform: "uppercase", marginBottom: "1.5rem" }}>How it works</div>
        <h2 className="au-serif" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 400, lineHeight: 1.1, marginBottom: "5rem" }}>
          From zero to <em style={{ color: "#C9A84C" }}>operator</em><br />in four steps.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "3rem" }}>
          {[
            ["01", "Choose your industry", "Pick your target world — yachts, jets, real estate, or cars. Aurum OS calibrates everything to that sector."],
            ["02", "Get your daily brief", "Every morning, AURUM delivers your tasks, market signals, and one recommendation tailored to your level."],
            ["03", "Execute and learn", "Complete tasks, study the academy, create content, ask the mentor — build real momentum every single day."],
            ["04", "Enter the room", "Show up at events, close introductions, position yourself — with the knowledge, network, and presence to belong."],
          ].map(([num, title, desc]) => (
            <div key={num}>
              <div className="au-serif" style={{ fontSize: "4rem", color: "rgba(201,168,76,0.15)", lineHeight: 1, marginBottom: "1rem" }}>{num}</div>
              <div className="au-serif" style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>{title}</div>
              <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: "7rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.4em", color: "#C9A84C", textTransform: "uppercase", marginBottom: "1.5rem" }}>Pricing</div>
        <h2 className="au-serif" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 400, lineHeight: 1.1, marginBottom: "1.5rem" }}>
          Start free.<br /><em style={{ color: "#C9A84C" }}>Scale when you're ready.</em>
        </h2>
        <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.7)", maxWidth: 560, lineHeight: 1.8, marginBottom: "4rem" }}>No experience required. No credit card needed to start. Cancel anytime.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          <div className="au-pricing-card" style={{ background: "#111", border: "0.5px solid rgba(201,168,76,0.2)", borderRadius: 16, padding: "2.5rem" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#C9A84C", textTransform: "uppercase", marginBottom: "1rem" }}>Initiate</div>
            <div className="au-serif" style={{ fontSize: "3rem", fontWeight: 400, lineHeight: 1 }}>Free</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: "2rem", marginTop: "0.25rem" }}>Forever</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
              {["AURUM Mentor — 10 messages/day", "Live Intelligence feed", "Daily execution tasks", "Academy — Module 1", "Event calendar"].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>
                  <span style={{ color: "#C9A84C", opacity: 0.7 }}>—</span>{f}
                </li>
              ))}
            </ul>
            <Link to="/onboarding" className="au-btn-ghost" style={{ width: "100%", justifyContent: "center" }}>Get started free</Link>
          </div>
          <div className="au-pricing-card" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.06), #111)", border: "1px solid #C9A84C", borderRadius: 16, padding: "2.5rem", position: "relative" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #E8C97A, #9A7A2E)", color: "#000", fontSize: 10, fontWeight: 500, letterSpacing: "0.2em", padding: "4px 16px", borderRadius: 100, whiteSpace: "nowrap", textTransform: "uppercase" }}>Most popular</div>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#C9A84C", textTransform: "uppercase", marginBottom: "1rem" }}>Operator</div>
            <div className="au-serif" style={{ fontSize: "3rem", fontWeight: 400, lineHeight: 1 }}>£29</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: "2rem", marginTop: "0.25rem" }}>per month · billed monthly</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
              {["AURUM Mentor — unlimited", "Live Intelligence — all signals", "Full Academy — all tracks", "Content Studio — unlimited", "Conversation history — 5 sessions", "AI Tutor — unlimited", "Priority support"].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>
                  <span style={{ color: "#C9A84C", opacity: 0.7 }}>—</span>{f}
                </li>
              ))}
            </ul>
            <Link to="/onboarding" className="au-btn-primary" style={{ width: "100%", justifyContent: "center" }}>Start Operator →</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div style={{ textAlign: "center", padding: "8rem 2rem", borderTop: "0.5px solid rgba(201,168,76,0.2)", background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.4em", color: "#C9A84C", textTransform: "uppercase", marginBottom: "1.5rem" }}>Early Access</div>
        <h2 className="au-serif" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 400, lineHeight: 1.1, maxWidth: 700, margin: "0 auto 1.5rem" }}>
          The room is waiting.<br /><em style={{ color: "#C9A84C" }}>Are you ready to enter?</em>
        </h2>
        <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.7)", maxWidth: 560, lineHeight: 1.8, margin: "0 auto 3rem" }}>
          Join ambitious professionals already using Aurum OS to break into the world's most exclusive industries.
        </p>
        <Link to="/onboarding" className="au-btn-primary">Start for free — no card needed →</Link>
      </div>

      {/* FOOTER */}
      <footer style={{ borderTop: "0.5px solid rgba(201,168,76,0.2)", padding: "3rem 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem", background: "#111" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>© 2026 Aurum OS. All rights reserved.</div>
        <div style={{ display: "flex", gap: "2rem" }}>
          {[["Enter the OS", "/dashboard"], ["Pricing", "#pricing"], ["Contact", "mailto:hello@aurumos.com"]].map(([label, href]) => (
            href.startsWith("/") ? (
              <Link key={label} to={href as "/dashboard"} style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textDecoration: "none", letterSpacing: "0.1em" }}>{label}</Link>
            ) : (
              <a key={label} href={href} style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textDecoration: "none", letterSpacing: "0.1em" }}>{label}</a>
            )
          ))}
        </div>
      </footer>
    </div>
  );
}
