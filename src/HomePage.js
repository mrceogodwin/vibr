import { useEffect, useState } from "react";
import "./HomePage.css";

const NAV = [
  ["FEED", "feed"],
  ["COLLABS", "collabs"],
  ["BOUNTIES", "bounties"],
  ["HACKATHONS", "hackathons"],
  ["COMMUNITY", "community"],
  ["LEADERBOARD", "leaderboard"],
];

const TONES = ["red", "gold", "green"];

const DEMO_CARDS = [
  {
    id: "demo-obioma",
    name: "Obioma Kalu",
    initial: "O",
    votes: 312,
    pitch: "Healthcare booking via USSD — no smartphone needed",
    tags: ["HEALTHTECH", "USSD"],
    tone: "red",
  },
  {
    id: "demo-kofi",
    name: "Kofi Osei",
    initial: "K",
    votes: 445,
    pitch: "Pan-African crypto remittance — zero fees across 30 currencies",
    tags: ["FINTECH", "WEB3"],
    tone: "gold",
  },
  {
    id: "demo-nadia",
    name: "Nadia Wanjiru",
    initial: "N",
    votes: 198,
    pitch: "Offline AI tutor for township kids — zero data cost",
    tags: ["AI", "EDTECH"],
    tone: "green",
  },
];

const FEATURES = [
  {
    icon: "🔥",
    title: "DROP YOUR BUILD",
    copy: "Post projects, get feedback from African builders who understand your market.",
    page: "drop",
  },
  {
    icon: "🤝",
    title: "FIND YOUR CREW",
    copy: "Match with designers, devs, and co-founders across 54 African countries.",
    page: "collabs",
  },
  {
    icon: "🌍",
    title: "GET SEEN GLOBALLY",
    copy: "Investors worldwide watch VIBR for the next wave of African tech talent.",
    page: "leaderboard",
  },
];

// Pexels license (free commercial use). Photo by Konteh Graphics:
// https://www.pexels.com/photo/young-professionals-collaborating-on-laptop-34708698/
const HERO_SRC = "/home/hero-2400.webp";
const HERO_SRCSET = "/home/hero-1200.webp 1200w, /home/hero-1600.webp 1600w, /home/hero-2400.webp 2400w, /home/hero-3200.webp 3200w";
const HERO_SIZES = "(max-width: 1120px) 100vw, 64vw";

const AFRICA_DOTS = "47,7 52,7 57,7 62,7 67,7 37,12 42,12 47,12 52,12 57,12 62,12 67,12 72,12 77,12 32,17 37,17 42,17 47,17 52,17 57,17 62,17 67,17 72,17 77,17 82,17 27,22 32,22 37,22 42,22 47,22 52,22 57,22 62,22 67,22 72,22 77,22 82,22 27,27 32,27 37,27 42,27 47,27 52,27 57,27 62,27 67,27 72,27 77,27 82,27 27,32 32,32 37,32 42,32 47,32 52,32 57,32 62,32 67,32 72,32 77,32 82,32 22,37 27,37 32,37 37,37 42,37 47,37 52,37 57,37 62,37 67,37 72,37 77,37 82,37 87,37 17,42 22,42 27,42 32,42 37,42 42,42 47,42 52,42 57,42 62,42 67,42 72,42 77,42 82,42 87,42 92,42 17,47 22,47 27,47 32,47 37,47 42,47 47,47 52,47 57,47 62,47 67,47 72,47 77,47 82,47 87,47 92,47 17,52 22,52 27,52 32,52 37,52 42,52 47,52 52,52 57,52 62,52 67,52 72,52 77,52 82,52 87,52 12,57 17,57 22,57 27,57 32,57 37,57 42,57 47,57 52,57 57,57 62,57 67,57 72,57 77,57 17,62 22,62 27,62 32,62 37,62 42,62 47,62 52,62 57,62 62,62 67,62 72,62 77,62 82,62 17,67 22,67 27,67 32,67 37,67 42,67 47,67 52,67 57,67 62,67 67,67 72,67 77,67 82,67 17,72 22,72 27,72 32,72 37,72 42,72 47,72 52,72 57,72 62,72 67,72 72,72 77,72 82,72 22,77 27,77 32,77 37,77 42,77 47,77 52,77 57,77 62,77 67,77 72,77 77,77 27,82 32,82 37,82 42,82 47,82 52,82 57,82 62,82 67,82 72,82 77,82 27,87 32,87 37,87 42,87 47,87 52,87 57,87 62,87 67,87 72,87 32,92 37,92 42,92 47,92 52,92 57,92 62,92 67,92 72,92 102,92 37,97 42,97 47,97 52,97 57,97 62,97 67,97 97,97 102,97 107,97 37,102 42,102 47,102 52,102 57,102 62,102 67,102 97,102 102,102 107,102 37,107 42,107 47,107 52,107 57,107 62,107 97,107 102,107 107,107 37,112 42,112 47,112 52,112 57,112 62,112 102,112 42,117 47,117 52,117 57,117 42,122 47,122 52,122 57,122 47,127 52,127".split(" ").map((pair) => pair.split(",").map(Number));

function makeRain(columns, rows) {
  const lines = [];
  for (let column = 0; column < columns; column += 1) {
    let seed = (column + 3) * 97;
    let text = "";
    for (let row = 0; row < rows; row += 1) {
      seed = (seed * 1103515245 + 12345) % 2147483647;
      text += `${seed & 1 ? "1" : "0"}\n`;
    }
    lines.push(text);
  }
  return lines;
}

const RAIN = makeRain(14, 32);

function normalizeTags(tags) {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : [tags];
  return list
    .map((tag) => {
      if (Array.isArray(tag)) return String(tag[0] || "");
      if (tag && typeof tag === "object") return String(tag.name || tag.label || "");
      return String(tag || "");
    })
    .map((tag) => tag.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 2);
}

function toCard(post, index) {
  if (!post || typeof post !== "object") return null;
  const profile = post.profiles || post.profile || {};
  const name = String(profile.full_name || profile.username || "VIBR Builder").trim() || "VIBR Builder";
  const pitch = String(post.title || post.description || "A new project from the VIBR community.").trim();
  const votes = Array.isArray(post.votes) ? post.votes.length : Number(post.vote_count || 0);
  return {
    id: post.id || `post-${index}`,
    name,
    initial: (name.replace(/[^A-Za-z0-9]/g, "")[0] || "V").toUpperCase(),
    votes: Number.isFinite(votes) ? votes : 0,
    pitch,
    tags: normalizeTags(post.tags),
    tone: TONES[index % TONES.length],
  };
}

function Brand({ onClick }) {
  return (
    <button type="button" className="vh-logo" onClick={onClick} aria-label="VIBR home">
      <span className="vh-logo-v">V</span>
      <span className="vh-logo-i">I</span>
      <span className="vh-logo-b">B</span>
      <span className="vh-logo-r">R</span>
      <span className="vh-logo-dot" aria-hidden="true" />
    </button>
  );
}

function TickerLine() {
  return (
    <p className="vh-ticker-line">
      <span className="is-red">DROP. BUILD. VIBE.</span>
      <span className="is-slash" aria-hidden="true">/</span>
      <span className="is-gold">54 COUNTRIES. ONE HUB.</span>
      <span className="is-slash" aria-hidden="true">/</span>
      <span className="is-green">AFRICA BUILDS DIFFERENT.</span>
    </p>
  );
}

function HeroArt() {
  return (
    <div className="vh-photo-frame">
      <img
        className="vh-hero-photo"
        src={HERO_SRC}
        srcSet={HERO_SRCSET}
        sizes={HERO_SIZES}
        width="2400"
        height="1600"
        alt="Three young African builders leaning in around a laptop."
        fetchPriority="high"
      />
      <div className="vh-hero-shade" aria-hidden="true" />
      <div className="vh-rain" aria-hidden="true">
        {RAIN.map((column, index) => <span key={index}>{column}</span>)}
      </div>
      <pre className="vh-term" aria-hidden="true">
        <span><i>&gt;</i> build()</span>
        <span><i>&gt;</i> deploy()</span>
        <span><i>&gt;</i> <b>vibe()</b></span>
        <span><i>&gt;</i> africa.connect()</span>
      </pre>
      <svg className="vh-africa" viewBox="0 0 120 140" aria-hidden="true">
        {AFRICA_DOTS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.35" />)}
      </svg>
      <p className="vh-photo-credit">Photo by Konteh Graphics on Pexels.</p>
    </div>
  );
}

function FeedCard({ card, onOpen }) {
  return (
    <button
      type="button"
      className="vh-card"
      onClick={onOpen}
      aria-label={`${card.name}, ${card.votes} votes. ${card.pitch}`}
    >
      <span className="vh-card-top">
        <span className={`vh-avatar is-${card.tone}`} aria-hidden="true">{card.initial}</span>
        <span className="vh-card-name">{card.name}</span>
        <span className="vh-card-votes">▲ {card.votes}</span>
      </span>
      <span className="vh-card-pitch">{card.pitch}</span>
      {card.tags.length > 0 && (
        <span className="vh-card-tags">
          {card.tags.map((tag) => <span key={tag}>{tag}</span>)}
        </span>
      )}
    </button>
  );
}

export default function LandingPage({ navigate, getPosts }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cards, setCards] = useState(DEMO_CARDS);

  const go = (page) => {
    setMenuOpen(false);
    navigate(page);
  };

  useEffect(() => {
    let active = true;
    if (typeof getPosts !== "function") return undefined;
    getPosts({ limit: 3, offset: 0 })
      .then((rows) => {
        if (!active) return;
        const next = (Array.isArray(rows) ? rows : []).slice(0, 3).map(toCard).filter(Boolean);
        if (next.length) setCards(next);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [getPosts]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="vh">
      <header className="vh-header">
        <Brand onClick={() => go("landing")} />
        <nav
          id="vh-nav"
          className={menuOpen ? "vh-nav is-open" : "vh-nav"}
          aria-label="Main"
        >
          {NAV.map(([label, page]) => (
            <button key={page} type="button" onClick={() => go(page)}>{label}</button>
          ))}
          <button type="button" className="vh-menu-login" onClick={() => go("account-login")}>LOG IN</button>
        </nav>
        <div className="vh-nav-actions">
          <button type="button" className="vh-login" onClick={() => go("account-login")}>LOG IN</button>
          <button type="button" className="vh-join" onClick={() => go("account-signup")}>JOIN VIBR</button>
          <button
            type="button"
            className={menuOpen ? "vh-burger is-open" : "vh-burger"}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="vh-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main id="main-content">
        <section className="vh-hero" aria-labelledby="vh-headline">
          <div className="vh-hero-copy">
            <p className="vh-kicker">
              <span className="vh-kicker-dot" aria-hidden="true" />
              AFRICA'S BUILDER MOVEMENT — EST. 2025
            </p>
            <h1 id="vh-headline">
              <span className="is-drop">DROP.</span>
              <span className="is-build">BUILD.</span>
              <span className="is-vibe">VIBE.</span>
            </h1>
            <p className="vh-lede">The network for Africa's next generation of builders.</p>
            <div className="vh-hero-actions">
              <button type="button" className="vh-btn vh-btn-red" onClick={() => go("account-signup")}>
                JOIN VIBR <span aria-hidden="true">→</span>
              </button>
              <button type="button" className="vh-btn vh-btn-ghost" onClick={() => go("feed")}>
                EXPLORE THE FEED
              </button>
            </div>
            <ul className="vh-stats">
              <li><strong>12K+</strong><span>BUILDERS</span></li>
              <li><strong>54</strong><span>COUNTRIES</span></li>
              <li><strong>3K+</strong><span>PROJECTS</span></li>
            </ul>
          </div>

          <div className="vh-hero-visual">
            <div className="vh-hero-stage">
              <HeroArt />
              <aside className="vh-feed" aria-label="Live feed">
                <div className="vh-feed-head">
                  <span className="vh-live-dot" aria-hidden="true" />
                  <span>LIVE FEED</span>
                  <span className="vh-caret" aria-hidden="true" />
                </div>
                <div className="vh-feed-grid" style={{ "--vh-cols": cards.length }} aria-live="polite">
                  {cards.map((card) => (
                    <FeedCard key={card.id} card={card} onOpen={() => go("feed")} />
                  ))}
                </div>
              </aside>
            </div>
            <div className="vh-flag" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </section>

        <div className="vh-ticker" role="region" aria-label="Drop. Build. Vibe. 54 countries. One hub. Africa builds different.">
          <div className="vh-ticker-static">
            <TickerLine />
          </div>
          <div className="vh-ticker-marquee" aria-hidden="true">
            <div className="vh-ticker-track">
              <TickerLine />
              <TickerLine />
            </div>
          </div>
        </div>

        <section className="vh-features" aria-label="What you can do on VIBR">
          {FEATURES.map((feature) => (
            <button key={feature.page} type="button" className="vh-feature" onClick={() => go(feature.page)}>
              <span className="vh-feature-icon" aria-hidden="true">{feature.icon}</span>
              <span className="vh-feature-rule" aria-hidden="true" />
              <span className="vh-feature-copy">
                <strong>{feature.title}</strong>
                <small>{feature.copy}</small>
              </span>
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
