import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Landing,
});

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .l-body {
    font-family: 'Inter', -apple-system, sans-serif;
    font-weight: 300;
    background: #080808;
    color: #f0ece0;
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  /* Typography */
  .l-serif { font-family: 'Cormorant Garamond', Georgia, serif !important; }
  .l-gold { color: #C9A84C; }
  .l-muted { color: rgba(240,236,224,0.45); }
  .l-mid { color: rgba(240,236,224,0.7); }
  .l-eyebrow {
    font-size: 11px;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: #C9A84C;
    font-weight: 500;
  }

  /* Nav */
  .l-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; flex-direction: column;
    background: rgba(8,8,8,0.8);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(201,168,76,0.12);
    /* glass fills status bar area, content pushed below it */
    padding-top: env(safe-area-inset-top);
  }
  .l-nav-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 2.5rem; height: 64px;
  }
  .l-nav-logo {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none;
  }
  .l-nav-mark {
    width: 32px; height: 32px; border-radius: 7px;
    border: 1px solid rgba(201,168,76,0.3);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px; color: #C9A84C;
    background: rgba(201,168,76,0.05);
  }
  .l-nav-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px; color: #f0ece0; letter-spacing: 0.03em;
  }
  .l-nav-links {
    display: flex; align-items: center; gap: 2rem;
    list-style: none;
  }
  .l-nav-links a {
    font-size: 13px; color: rgba(240,236,224,0.6);
    text-decoration: none; letter-spacing: 0.02em;
    transition: color 0.15s;
  }
  .l-nav-links a:hover { color: #f0ece0; }
  .l-nav-right { display: flex; align-items: center; gap: 1rem; }

  /* Buttons */
  .l-btn-primary {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.65rem 1.5rem; border-radius: 6px;
    background: linear-gradient(135deg, #D4A843, #9A7530);
    color: #080808; font-size: 13px; font-weight: 500;
    text-decoration: none; letter-spacing: 0.02em;
    transition: opacity 0.15s, transform 0.15s; white-space: nowrap;
    border: none; cursor: pointer;
  }
  .l-btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }

  .l-btn-ghost {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.65rem 1.5rem; border-radius: 6px;
    border: 1px solid rgba(201,168,76,0.25);
    color: rgba(240,236,224,0.75); font-size: 13px;
    text-decoration: none; letter-spacing: 0.02em;
    transition: border-color 0.15s, color 0.15s; white-space: nowrap;
  }
  .l-btn-ghost:hover { border-color: rgba(201,168,76,0.55); color: #f0ece0; }

  .l-btn-text {
    display: inline-flex; align-items: center; gap: 0.35rem;
    font-size: 13px; color: rgba(240,236,224,0.5);
    text-decoration: none; transition: color 0.15s;
  }
  .l-btn-text:hover { color: rgba(240,236,224,0.85); }

  /* Sections */
  .l-section { padding: 7rem 2rem; max-width: 1120px; margin: 0 auto; }
  .l-section-wide { padding: 7rem 2rem; max-width: 1280px; margin: 0 auto; }

  /* Hero */
  .l-hero {
    min-height: 100svh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    /* top padding = nav height + safe area + breathing room */
    padding: calc(env(safe-area-inset-top) + 8rem) 2rem 6rem;
    position: relative; overflow: hidden;
  }
  .l-hero-glow {
    position: absolute; inset: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 70% 55% at 50% 30%, rgba(201,168,76,0.07) 0%, transparent 65%),
      radial-gradient(ellipse 40% 30% at 20% 80%, rgba(30,60,120,0.08) 0%, transparent 50%);
  }
  .l-hero-badge {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.35rem 1rem; border-radius: 100px;
    border: 1px solid rgba(201,168,76,0.2);
    background: rgba(201,168,76,0.04);
    font-size: 11px; letter-spacing: 0.25em; color: #C9A84C;
    text-transform: uppercase; margin-bottom: 2.5rem;
  }
  .l-hero-badge-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #C9A84C; animation: l-pulse 2s ease-in-out infinite;
  }
  .l-hero-h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(3.5rem, 9vw, 7.5rem);
    font-weight: 400; line-height: 1.0; letter-spacing: -0.015em;
    margin-bottom: 2rem; max-width: 900px;
  }
  .l-hero-sub {
    font-size: clamp(1rem, 1.8vw, 1.15rem);
    color: rgba(240,236,224,0.65); max-width: 520px;
    line-height: 1.75; margin: 0 auto 3rem; font-weight: 300;
  }
  .l-hero-actions {
    display: flex; gap: 0.75rem; align-items: center;
    flex-wrap: wrap; justify-content: center; margin-bottom: 4rem;
  }
  .l-hero-proof {
    display: flex; align-items: center; gap: 2rem;
    flex-wrap: wrap; justify-content: center;
    font-size: 12px; color: rgba(240,236,224,0.35); letter-spacing: 0.1em;
  }
  .l-hero-proof-item { display: flex; align-items: center; gap: 0.4rem; }

  /* Industry strip */
  .l-strip {
    border-top: 1px solid rgba(201,168,76,0.1);
    border-bottom: 1px solid rgba(201,168,76,0.1);
    background: #0d0d0d;
    display: flex; overflow: hidden;
  }
  .l-strip-item {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 0.5rem;
    padding: 2rem 1rem;
    border-right: 1px solid rgba(201,168,76,0.1);
    font-size: 10px; letter-spacing: 0.3em; color: rgba(240,236,224,0.35);
    text-transform: uppercase; transition: color 0.2s, background 0.2s; cursor: default;
  }
  .l-strip-item:last-child { border-right: none; }
  .l-strip-item:hover { color: rgba(240,236,224,0.65); background: rgba(201,168,76,0.02); }
  .l-strip-icon { font-size: 1.3rem; margin-bottom: 0.25rem; }

  /* Bento grid */
  .l-bento {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-auto-rows: 200px;
    gap: 1.5px;
    background: rgba(201,168,76,0.12);
    border: 1px solid rgba(201,168,76,0.12);
    border-radius: 16px; overflow: hidden;
  }
  .l-bento-cell {
    background: #0d0d0d; padding: 2.25rem;
    display: flex; flex-direction: column;
    transition: background 0.2s;
  }
  .l-bento-cell:hover { background: #111; }
  .l-bento-wide { grid-column: span 7; }
  .l-bento-narrow { grid-column: span 5; }
  .l-bento-full { grid-column: span 12; grid-row: span 1; }
  .l-bento-third { grid-column: span 4; }
  .l-bento-tag {
    font-size: 10px; letter-spacing: 0.3em; color: #C9A84C;
    text-transform: uppercase; margin-bottom: 1rem; font-weight: 500;
  }
  .l-bento-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.6rem; font-weight: 400; margin-bottom: 0.75rem; line-height: 1.2;
  }
  .l-bento-desc {
    font-size: 13px; color: rgba(240,236,224,0.45); line-height: 1.7; font-weight: 300;
  }
  .l-bento-icon {
    width: 40px; height: 40px; border-radius: 10px;
    border: 1px solid rgba(201,168,76,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem; margin-bottom: 1.25rem;
    background: rgba(201,168,76,0.04);
  }

  /* Stats */
  .l-stats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 1.5px; background: rgba(201,168,76,0.12);
    border: 1px solid rgba(201,168,76,0.12);
    border-radius: 16px; overflow: hidden;
  }
  .l-stat {
    background: #0d0d0d; padding: 2.75rem 2rem; text-align: center;
    transition: background 0.2s;
  }
  .l-stat:hover { background: #111; }
  .l-stat-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 3.5rem; color: #C9A84C; line-height: 1; margin-bottom: 0.5rem;
  }
  .l-stat-label { font-size: 11px; letter-spacing: 0.2em; color: rgba(240,236,224,0.4); text-transform: uppercase; }

  /* Steps */
  .l-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3rem; }
  .l-step-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 5rem; color: rgba(201,168,76,0.1); line-height: 1; margin-bottom: 1rem;
    font-weight: 300;
  }
  .l-step-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.2rem; font-weight: 400; margin-bottom: 0.75rem;
  }
  .l-step-desc { font-size: 13px; color: rgba(240,236,224,0.45); line-height: 1.7; font-weight: 300; }

  /* Testimonials */
  .l-testimonials { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5px; }
  .l-testimonial {
    background: #0d0d0d; padding: 2.25rem;
    border: 1px solid rgba(201,168,76,0.1); border-radius: 12px;
  }
  .l-testimonial-text {
    font-size: 14px; color: rgba(240,236,224,0.75); line-height: 1.75;
    margin-bottom: 1.5rem; font-weight: 300;
    font-family: 'Cormorant Garamond', serif; font-size: 1rem;
  }
  .l-testimonial-author { font-size: 11px; letter-spacing: 0.15em; color: rgba(240,236,224,0.4); text-transform: uppercase; }
  .l-testimonial-role { font-size: 11px; color: #C9A84C; letter-spacing: 0.1em; margin-top: 0.2rem; }

  /* Pricing */
  .l-pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; max-width: 760px; margin: 0 auto; }
  .l-pricing-card {
    background: #0d0d0d; border: 1px solid rgba(201,168,76,0.15);
    border-radius: 16px; padding: 2.5rem; position: relative;
    transition: border-color 0.2s;
  }
  .l-pricing-card:hover { border-color: rgba(201,168,76,0.35); }
  .l-pricing-card-pro {
    background: linear-gradient(160deg, rgba(201,168,76,0.05), #0d0d0d 60%);
    border-color: rgba(201,168,76,0.5);
  }
  .l-pricing-badge {
    position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
    background: linear-gradient(135deg, #D4A843, #9A7530);
    color: #080808; font-size: 10px; font-weight: 600; letter-spacing: 0.2em;
    padding: 3px 14px; border-radius: 100px; white-space: nowrap; text-transform: uppercase;
  }
  .l-pricing-tier { font-size: 10px; letter-spacing: 0.35em; color: #C9A84C; text-transform: uppercase; margin-bottom: 1rem; }
  .l-pricing-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 3.25rem; line-height: 1; margin-bottom: 0.25rem;
  }
  .l-pricing-cadence { font-size: 12px; color: rgba(240,236,224,0.4); margin-bottom: 2rem; }
  .l-pricing-feature {
    display: flex; align-items: flex-start; gap: 0.6rem;
    font-size: 13px; color: rgba(240,236,224,0.65); line-height: 1.5;
    padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .l-pricing-feature:last-of-type { border-bottom: none; }
  .l-pricing-check { color: #C9A84C; font-size: 11px; margin-top: 2px; flex-shrink: 0; }

  /* CTA section */
  .l-cta {
    text-align: center; padding: 8rem 2rem;
    border-top: 1px solid rgba(201,168,76,0.1);
    background: radial-gradient(ellipse 70% 60% at 50% 0%, rgba(201,168,76,0.05) 0%, transparent 65%);
  }

  /* Footer */
  .l-footer {
    border-top: 1px solid rgba(201,168,76,0.1);
    padding: 2.5rem;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 1.5rem; background: #080808;
  }
  .l-footer-left { font-size: 12px; color: rgba(240,236,224,0.3); letter-spacing: 0.05em; }
  .l-footer-links { display: flex; gap: 2rem; }
  .l-footer-links a { font-size: 12px; color: rgba(240,236,224,0.3); text-decoration: none; transition: color 0.15s; }
  .l-footer-links a:hover { color: rgba(240,236,224,0.65); }

  /* Divider */
  .l-hairline {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(201,168,76,0.3) 50%, transparent);
  }

  @keyframes l-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  @media (max-width: 900px) {
    .l-nav-links { display: none; }
    .l-nav-row { padding: 0 1.25rem; }
    .l-hero {
      padding: calc(env(safe-area-inset-top) + 5.5rem) 1.5rem 4rem;
      min-height: 100svh;
    }
    .l-hero-h1 { font-size: clamp(2.6rem, 11vw, 4rem); margin-bottom: 1.25rem; }
    .l-hero-sub { font-size: 0.95rem; margin-bottom: 2rem; }
    .l-hero-actions { flex-direction: column; gap: 0.6rem; width: 100%; }
    .l-hero-actions a, .l-hero-actions button {
      width: 100%; justify-content: center;
      padding: 0.9rem 1.5rem !important; font-size: 14px !important;
    }
    .l-hero-proof { gap: 1rem; font-size: 11px; }
    .l-bento { grid-template-columns: 1fr; grid-auto-rows: auto; }
    .l-bento-wide, .l-bento-narrow, .l-bento-full, .l-bento-third { grid-column: span 1; }
    .l-stats { grid-template-columns: repeat(2, 1fr); }
    .l-steps { grid-template-columns: 1fr 1fr; gap: 2rem; }
    .l-testimonials { grid-template-columns: 1fr; }
    .l-pricing-grid { grid-template-columns: 1fr; }
    .l-section { padding: 4rem 1.5rem; }
  }
`;

export default function Landing() {
  return (
    <div className="l-body">
      <style>{STYLES}</style>

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="l-nav">
        <div className="l-nav-row">
          <Link to="/" className="l-nav-logo">
            <div className="l-nav-mark l-serif">Au</div>
            <div className="l-nav-name">Aurum OS</div>
          </Link>

          <ul className="l-nav-links">
            <li><a href="#platform">Platform</a></li>
            <li><a href="#how">How it works</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><Link to="/dashboard" style={{ color: "inherit" }}>Intelligence</Link></li>
          </ul>

          <div className="l-nav-right">
            <Link to="/login" className="l-btn-text">Sign in</Link>
            <Link to="/onboarding" className="l-btn-primary">Get started free →</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="l-hero">
        <div className="l-hero-glow" />

        <div className="l-hero-badge">
          <div className="l-hero-badge-dot" />
          Early Access — Now Open
        </div>

        <h1 className="l-hero-h1 l-serif">
          The operating system<br />
          for <em className="l-gold">luxury industries.</em>
        </h1>

        <p className="l-hero-sub">
          AI mentor, live market intelligence, content creation, and
          structured learning — built for ambitious professionals breaking
          into superyachts, private aviation, ultra-prime real estate, and collector cars.
        </p>

        <div className="l-hero-actions">
          <Link to="/onboarding" className="l-btn-primary" style={{ padding: "0.85rem 2rem", fontSize: 14 }}>
            Start for free — no card needed
          </Link>
          <a href="#platform" className="l-btn-ghost" style={{ padding: "0.85rem 2rem", fontSize: 14 }}>
            See the platform
          </a>
        </div>

        <div className="l-hero-proof">
          <div className="l-hero-proof-item">
            <span style={{ color: "#C9A84C" }}>✦</span>
            No experience required
          </div>
          <div className="l-hero-proof-item">
            <span style={{ color: "#C9A84C" }}>✦</span>
            4 luxury industries
          </div>
          <div className="l-hero-proof-item">
            <span style={{ color: "#C9A84C" }}>✦</span>
            Free plan available
          </div>
        </div>
      </section>

      {/* ── INDUSTRY STRIP ───────────────────────────────── */}
      <div className="l-strip">
        {[
          ["⚓", "Superyachts"],
          ["✈", "Private Aviation"],
          ["🏛", "Ultra-Prime Real Estate"],
          ["🏎", "Collector Cars"],
        ].map(([icon, label]) => (
          <div key={label} className="l-strip-item">
            <div className="l-strip-icon">{icon}</div>
            {label}
          </div>
        ))}
      </div>

      {/* ── STATS ────────────────────────────────────────── */}
      <div style={{ padding: "5rem 2rem 0", maxWidth: 1120, margin: "0 auto" }}>
        <div className="l-stats">
          {[
            ["4", "Luxury industries"],
            ["80+", "Industry events mapped"],
            ["24 / 7", "AI mentor access"],
            ["6h", "Intelligence refresh cycle"],
          ].map(([num, label]) => (
            <div key={label} className="l-stat">
              <div className="l-stat-num l-serif">{num}</div>
              <div className="l-stat-label">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PLATFORM / BENTO ─────────────────────────────── */}
      <section id="platform" className="l-section">
        <p className="l-eyebrow" style={{ marginBottom: "1.25rem" }}>The Platform</p>
        <h2 className="l-serif" style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)", lineHeight: 1.1, marginBottom: "1rem", maxWidth: 700 }}>
          Everything you need to<br /><em className="l-gold">break in and rise fast.</em>
        </h2>
        <p className="l-mid" style={{ fontSize: "1.05rem", maxWidth: 520, lineHeight: 1.75, marginBottom: "3rem", fontWeight: 300 }}>
          Six integrated systems working together — so you spend less time researching and more time in the room.
        </p>

        <div className="l-bento">
          {/* Row 1 */}
          <div className="l-bento-cell l-bento-wide" style={{ gridRow: "span 2" }}>
            <div className="l-bento-icon">⚡</div>
            <div className="l-bento-tag">AI Mentor</div>
            <div className="l-bento-title l-serif">AURUM — your personal strategist.</div>
            <div className="l-bento-desc" style={{ marginTop: "auto" }}>
              Ask anything — market positioning, outreach scripts, deal structuring, networking moves.
              AURUM knows your level, your industry, your goal. It remembers your journey and adapts with you.
              Available 24 / 7. Feels nothing like a chatbot.
            </div>
          </div>
          <div className="l-bento-cell l-bento-narrow">
            <div className="l-bento-icon">📡</div>
            <div className="l-bento-tag">Live Intelligence</div>
            <div className="l-bento-title l-serif" style={{ fontSize: "1.3rem" }}>The signal beneath the noise.</div>
            <div className="l-bento-desc" style={{ fontSize: 12, marginTop: "auto" }}>
              Real-time market intelligence curated every 6 hours from 30+ luxury industry sources. Deals, people, market moves — turned into actionable insights.
            </div>
          </div>
          <div className="l-bento-cell l-bento-narrow">
            <div className="l-bento-icon">✦</div>
            <div className="l-bento-tag">Content Studio</div>
            <div className="l-bento-title l-serif" style={{ fontSize: "1.3rem" }}>Viral content in 30 seconds.</div>
            <div className="l-bento-desc" style={{ fontSize: 12, marginTop: "auto" }}>
              Generate Instagram, TikTok, and LinkedIn posts tuned to the luxury world. Hooks, scripts, captions, AI visuals — platform-optimized, industry-specific.
            </div>
          </div>

          {/* Row 2 */}
          <div className="l-bento-cell l-bento-third">
            <div className="l-bento-icon">🎓</div>
            <div className="l-bento-tag">Academy</div>
            <div className="l-bento-title l-serif" style={{ fontSize: "1.2rem" }}>Structured learning paths.</div>
            <div className="l-bento-desc" style={{ fontSize: 12, marginTop: "auto" }}>
              Industry-specific curricula. From zero to closing your first deal — insider terminology, client psychology, deal flow.
            </div>
          </div>
          <div className="l-bento-cell l-bento-third">
            <div className="l-bento-icon">📅</div>
            <div className="l-bento-tag">Event Calendar</div>
            <div className="l-bento-title l-serif" style={{ fontSize: "1.2rem" }}>Know where to be.</div>
            <div className="l-bento-desc" style={{ fontSize: 12, marginTop: "auto" }}>
              80+ industry events mapped — Monaco Yacht Show, NBAA, Pebble Beach, MIPIM. With content prep windows. Never miss the room again.
            </div>
          </div>
          <div className="l-bento-cell l-bento-third">
            <div className="l-bento-icon">🎯</div>
            <div className="l-bento-tag">Daily Execution</div>
            <div className="l-bento-title l-serif" style={{ fontSize: "1.2rem" }}>Your game plan, daily.</div>
            <div className="l-bento-desc" style={{ fontSize: 12, marginTop: "auto" }}>
              AI-generated daily tasks tailored to your level — networking, content, outreach, learning. A complete execution system that compounds.
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how" className="l-section" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <p className="l-eyebrow" style={{ marginBottom: "1.25rem" }}>How it works</p>
        <h2 className="l-serif" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.1, marginBottom: "5rem" }}>
          From zero to <em className="l-gold">operator</em><br />in four steps.
        </h2>
        <div className="l-steps">
          {[
            ["01", "Choose your world", "Pick your target industry — yachts, jets, real estate, or cars. AURUM OS calibrates everything to your sector."],
            ["02", "Get your daily brief", "Every session, AURUM delivers your tasks, market signals, and one sharp recommendation — tailored to your exact level."],
            ["03", "Execute and compound", "Complete tasks, study the academy, generate content, ask the mentor. Each action compounds into real proximity."],
            ["04", "Enter the room", "Show up to events knowing the names, the deals, the dynamics. Positioned. Ready. Belonging."],
          ].map(([num, title, desc]) => (
            <div key={num}>
              <div className="l-step-num l-serif">{num}</div>
              <div className="l-step-title l-serif">{title}</div>
              <p className="l-step-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────── */}
      <section className="l-section" style={{ paddingTop: "2rem" }}>
        <p className="l-eyebrow" style={{ marginBottom: "3rem", textAlign: "center" }}>Early operators</p>
        <div className="l-testimonials" style={{ gap: "1.25rem" }}>
          {[
            {
              quote: "I'd been trying to break into yacht brokerage for two years. AURUM gave me the language, the network moves, and the daily structure I was missing. First mandate in three months.",
              name: "A. Marchetti",
              role: "Superyacht Brokerage · Monaco",
            },
            {
              quote: "The intelligence feed alone is worth the subscription. I'm showing up to conversations knowing more than people who've been in private aviation for a decade. That's positioning.",
              name: "D. Rousseau",
              role: "Private Aviation · London",
            },
            {
              quote: "I created my first luxury real estate post in the studio and it got 15k views. The content angle was sharper than anything I'd have written myself. AURUM thinks like an insider.",
              name: "H. Vargas",
              role: "Ultra-Prime Real Estate · Dubai",
            },
          ].map((t) => (
            <div key={t.name} className="l-testimonial">
              <p className="l-testimonial-text l-serif">"{t.quote}"</p>
              <div className="l-testimonial-author">{t.name}</div>
              <div className="l-testimonial-role">{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section id="pricing" className="l-section" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <p className="l-eyebrow" style={{ marginBottom: "1.25rem", textAlign: "center" }}>Pricing</p>
        <h2 className="l-serif" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.1, marginBottom: "1rem", textAlign: "center" }}>
          Start free.<br /><em className="l-gold">Scale when ready.</em>
        </h2>
        <p className="l-mid" style={{ fontSize: "1rem", textAlign: "center", marginBottom: "3.5rem", fontWeight: 300 }}>
          No experience required. No credit card to start. Cancel anytime.
        </p>

        <div className="l-pricing-grid">
          {/* Free */}
          <div className="l-pricing-card">
            <div className="l-pricing-tier">Initiate</div>
            <div className="l-pricing-price l-serif">Free</div>
            <div className="l-pricing-cadence">Forever</div>
            {[
              "AURUM Mentor — 10 messages / day",
              "Live Intelligence feed",
              "Daily execution tasks",
              "Academy — Module 01",
              "Industry event calendar",
            ].map((f) => (
              <div key={f} className="l-pricing-feature">
                <span className="l-pricing-check">—</span>
                {f}
              </div>
            ))}
            <div style={{ marginTop: "2rem" }}>
              <Link to="/onboarding" className="l-btn-ghost" style={{ width: "100%", justifyContent: "center" }}>
                Get started free
              </Link>
            </div>
          </div>

          {/* Pro */}
          <div className="l-pricing-card l-pricing-card-pro">
            <div className="l-pricing-badge">Most popular</div>
            <div className="l-pricing-tier">Operator</div>
            <div className="l-pricing-price l-serif">£29</div>
            <div className="l-pricing-cadence">per month · cancel anytime</div>
            {[
              "AURUM Mentor — unlimited conversations",
              "Full intelligence feed — all signals + actions",
              "Full Academy — all tracks, all modules",
              "Content Studio — unlimited generation",
              "AI Tutor — role-play simulations",
              "Network introductions — AI-drafted",
              "Priority AI responses",
            ].map((f) => (
              <div key={f} className="l-pricing-feature">
                <span className="l-pricing-check" style={{ color: "#C9A84C" }}>✓</span>
                {f}
              </div>
            ))}
            <div style={{ marginTop: "2rem" }}>
              <Link to="/onboarding" className="l-btn-primary" style={{ width: "100%", justifyContent: "center", padding: "0.85rem 1.5rem" }}>
                Start Operator →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <div className="l-cta">
        <p className="l-eyebrow" style={{ marginBottom: "1.5rem" }}>Early Access</p>
        <h2 className="l-serif" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.05, maxWidth: 720, margin: "0 auto 1.5rem", fontWeight: 400 }}>
          The room is waiting.<br />
          <em className="l-gold">Are you ready to enter?</em>
        </h2>
        <p className="l-mid" style={{ fontSize: "1.05rem", maxWidth: 480, lineHeight: 1.75, margin: "0 auto 3rem", fontWeight: 300 }}>
          Join ambitious professionals using AURUM OS to compress a decade of proximity into months.
        </p>
        <Link to="/onboarding" className="l-btn-primary" style={{ padding: "1rem 2.5rem", fontSize: 14 }}>
          Start for free — no card needed →
        </Link>
      </div>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="l-footer">
        <div className="l-footer-left">© 2026 Aurum OS. All rights reserved.</div>
        <div className="l-footer-links">
          <Link to="/dashboard">Enter the OS</Link>
          <a href="#pricing">Pricing</a>
          <a href="#platform">Platform</a>
          <a href="mailto:hello@aurumos.com">Contact</a>
        </div>
      </footer>
    </div>
  );
}
