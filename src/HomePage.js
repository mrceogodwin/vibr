import { useEffect, useState } from "react";

const NAV = [
  ["FEED", "feed"],
  ["COLLABS", "collabs"],
  ["BOUNTIES", "bounties"],
  ["HACKATHONS", "hackathons"],
  ["COMMUNITY", "community"],
  ["LEADERBOARD", "leaderboard"],
];

const CHAPTERS = [
  { code: "NG", flag: "🇳🇬", name: "NIGERIA HUB", note: "The heartbeat of West Africa's builder movement." },
  { code: "KE", flag: "🇰🇪", name: "KENYA HUB", note: "A home for East Africa's product and AI talent." },
  { code: "GH", flag: "🇬🇭", name: "GHANA HUB", note: "Fintech, agritech and the next wave of founders." },
  { code: "ZA", flag: "🇿🇦", name: "SOUTH AFRICA HUB", note: "Connect with builders across the southern region." },
];

const RANKS = [
  ["🌱", "SEEDLING", "0–499 PTS", "Access the feed and community"],
  ["⚡", "BUILDER", "500–1,999 PTS", "Unlock bounties and collaboration"],
  ["🔥", "VIBE LORD", "2,000–4,999 PTS", "Earn visibility across VIBR"],
  ["👑", "LEGEND", "5,000–9,999 PTS", "Mentorship and speaking opportunities"],
  ["🌍", "ICON", "10,000+ PTS", "A place in the Pan-African hall of fame"],
];

function Brand({ onClick }) {
  return (
    <button className="vh-brand" onClick={onClick} aria-label="VIBR home">
      <span className="vh-brand-v">V</span><span className="vh-brand-i">I</span><span className="vh-brand-b">B</span><span className="vh-brand-r">R</span><i>.</i>
    </button>
  );
}

function Arrow() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function Stat({ value, label }) {
  return <div className="vh-stat"><strong>{value}</strong><span>{label}</span></div>;
}

function DropCard({ post, index, onOpen }) {
  const profile = post.profiles || post.profile || {};
  const name = profile.full_name || profile.username || "VIBR Builder";
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const location = profile.country || "AFRICA";
  const votes = Array.isArray(post.votes) ? post.votes.length : Number(post.vote_count || 0);
  const tags = Array.isArray(post.tags) ? post.tags.slice(0, 2) : [];
  return (
    <button className="vh-drop-card" onClick={onOpen} aria-label={"Open project " + (post.title || "project")}>
      <div className="vh-drop-card-top">
        <span className={"vh-avatar vh-avatar-" + index}>{initials || "B"}</span>
        <span className="vh-drop-author"><b>{name}</b><small>{location}</small></span>
        <span className="vh-drop-votes">▲ {votes}</span>
      </div>
      <strong className="vh-drop-title">{post.title || "Untitled project"}</strong>
      <p>{post.description || "A new project from the VIBR builder community."}</p>
      {tags.length > 0 && <div className="vh-drop-tags">{tags.map((tag, i) => <span key={String(tag)} className={"vh-tag-chip vh-tag-chip-" + i}>{String(tag).toUpperCase()}</span>)}</div>}
    </button>
  );
}

export default function LandingPage({ navigate, getPosts }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [drops, setDrops] = useState([]);
  const [dropsLoading, setDropsLoading] = useState(true);

  const go = (page) => {
    setMenuOpen(false);
    navigate(page);
  };

  useEffect(() => {
    let active = true;
    if (typeof getPosts !== "function") {
      setDropsLoading(false);
      return () => { active = false; };
    }
    getPosts({ limit: 3, offset: 0 })
      .then((rows) => { if (active) setDrops(Array.isArray(rows) ? rows.slice(0, 3) : []); })
      .catch(() => { if (active) setDrops([]); })
      .finally(() => { if (active) setDropsLoading(false); });
    return () => { active = false; };
  }, [getPosts]);

  return (
    <main className="vh">
      <style>{CSS}</style>
      <header className="vh-nav">
        <Brand onClick={() => go("landing")} />
        <nav className={"vh-nav-links" + (menuOpen ? " vh-nav-links-open" : "")} aria-label="Main navigation">
          {NAV.map(([label, page]) => <button key={page} onClick={() => go(page)}>{label}</button>)}
        </nav>
        <div className="vh-nav-actions">
          <button className="vh-login" onClick={() => go("account-login")}>LOG IN</button>
          <button className="vh-join" onClick={() => go("account-signup")}>JOIN VIBR</button>
          <button className={"vh-menu" + (menuOpen ? " vh-menu-open" : "")} onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
            <span/><span/><span/>
          </button>
        </div>
      </header>

      <section className="vh-hero">
        <div className="vh-hero-copy">
          <div className="vh-kicker"><span/> AFRICA'S BUILDER MOVEMENT — EST. 2025</div>
          <h1><span className="vh-word-drop">DROP.</span><span className="vh-word-build">BUILD.</span><span className="vh-word-vibe">VIBE.</span></h1>
          <p className="vh-hero-lede">The network for Africa's next generation of builders.</p>
          <p className="vh-hero-sub">Show what you're building. Find your people. Get seen by the community and the world.</p>
          <div className="vh-hero-actions">
            <button className="vh-primary" onClick={() => go("account-signup")}>JOIN VIBR <Arrow/></button>
            <button className="vh-secondary" onClick={() => go("feed")}>EXPLORE THE FEED</button>
          </div>
          <div className="vh-stats">
            <Stat value="12K+" label="BUILDERS"/>
            <Stat value="54" label="COUNTRIES"/>
            <Stat value="3K+" label="PROJECTS"/>
          </div>
        </div>

        <div className="vh-hero-visual" role="img" aria-label="African young builders collaborating around a laptop, with headphones, green code and a digital Africa network">
          <div className="vh-terminal">
            <span>&gt; build()</span><span>&gt; deploy()</span><b>&gt; vibe()</b><span>&gt; africa.connect()</span>
          </div>
          <div className="vh-visual-caption"><i/> BUILT TOGETHER. BUILT IN AFRICA.</div>
          <div className="vh-feed-panel">
            <div className="vh-feed-head"><span><i/> LATEST DROPS</span><button onClick={() => go("feed")}>VIEW FEED <Arrow/></button></div>
            <div className="vh-feed-grid">
              {drops.map((post, index) => <DropCard key={post.id || index} post={post} index={index} onOpen={() => go("feed")}/>)}
              {!dropsLoading && drops.length === 0 && (
                <div className="vh-feed-empty">
                  <b>THE NEXT BIG BUILD COULD BE YOURS.</b>
                  <span>Be the first to share a project with the VIBR community.</span>
                  <button onClick={() => go("account-signup")}>JOIN THE MOVEMENT <Arrow/></button>
                </div>
              )}
              {dropsLoading && <div className="vh-feed-loading"><span/> LOADING COMMUNITY PROJECTS</div>}
            </div>
          </div>
          <div className="vh-flag-rail" aria-hidden="true"><i/><i/><i/></div>
        </div>
      </section>

      <div className="vh-ticker" aria-label="VIBR tagline">
        <span>DROP. BUILD. VIBE.</span><b>◆</b><span>54 COUNTRIES. ONE HUB.</span><b>◆</b><span>AFRICA BUILDS DIFFERENT.</span>
      </div>

      <section className="vh-feature-row" aria-label="What you can do on VIBR">
        <button className="vh-feature" onClick={() => go("drop")}>
          <span className="vh-feature-icon">🔥</span><span className="vh-feature-divider"/>
          <span className="vh-feature-copy"><b>DROP YOUR BUILD</b><small>Post projects and get feedback from African builders who understand your market.</small><em>EXPLORE <Arrow/></em></span>
        </button>
        <button className="vh-feature" onClick={() => go("collabs")}>
          <span className="vh-feature-icon">🤝</span><span className="vh-feature-divider"/>
          <span className="vh-feature-copy"><b>FIND YOUR CREW</b><small>Meet designers, developers and co-founders across the continent.</small><em>EXPLORE <Arrow/></em></span>
        </button>
        <button className="vh-feature" onClick={() => go("leaderboard")}>
          <span className="vh-feature-icon">🌍</span><span className="vh-feature-divider"/>
          <span className="vh-feature-copy"><b>GET SEEN GLOBALLY</b><small>Put your work in front of builders, companies and investors worldwide.</small><em>EXPLORE <Arrow/></em></span>
        </button>
      </section>

      <section className="vh-section vh-chapters">
        <div className="vh-section-heading">
          <div><span className="vh-eyebrow">54 COUNTRIES. ONE COMMUNITY.</span><h2>COUNTRY <i>CHAPTERS</i></h2></div>
          <button onClick={() => go("community")}>EXPLORE THE COMMUNITY <Arrow/></button>
        </div>
        <div className="vh-chapter-grid">
          {CHAPTERS.map((chapter) => (
            <button className="vh-chapter" key={chapter.code} onClick={() => go("community")}>
              <span className="vh-chapter-top"><b>{chapter.code}</b><i>{chapter.flag}</i></span>
              <strong>{chapter.name}</strong><small>{chapter.note}</small><em>EXPLORE CHAPTER <Arrow/></em>
            </button>
          ))}
        </div>
      </section>

      <section className="vh-ranks-section">
        <div className="vh-section-heading vh-ranks-heading">
          <div><span className="vh-eyebrow">EVERY DROP EARNS POINTS. CLIMB. GET RECOGNIZED.</span><h2>THE VIBE <i>RANKS</i></h2></div>
          <button onClick={() => go("leaderboard")}>SEE LEADERBOARD <Arrow/></button>
        </div>
        <div className="vh-rank-grid">
          {RANKS.map(([icon, name, points, description]) => (
            <article className={"vh-rank rank-" + name.toLowerCase().replace(/\s+/g, "")} key={name}>
              <span>{icon}</span><b>{name}</b><strong>{points}</strong><small>{description}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="vh-marketplace">
        <article className="vh-market-panel vh-investors">
          <span className="vh-eyebrow">FOR INVESTORS</span>
          <h2>AFRICA'S DEAL<br/><i>FLOW IS HERE.</i></h2>
          <p>Discover promising builders and projects creating solutions for African markets.</p>
          <ul><li>Explore projects by sector and stage</li><li>Discover emerging builder talent</li><li>Find startups worth backing</li></ul>
          <button className="vh-market-button vh-market-gold" onClick={() => go("account-signup")}>EXPLORE VIBR <Arrow/></button>
        </article>
        <article className="vh-market-panel vh-companies">
          <span className="vh-eyebrow">FOR COMPANIES</span>
          <h2>HIRE AFRICAN<br/><i>BUILDERS.</i></h2>
          <p>Find skilled African talent, post bounties and sponsor hackathons.</p>
          <ul><li>Search by skill, country and rank</li><li>Post bounties and collaboration calls</li><li>Support the next wave of African tech</li></ul>
          <button className="vh-market-button vh-market-green" onClick={() => go("account-signup")}>CREATE AN ACCOUNT <Arrow/></button>
        </article>
      </section>

      <section className="vh-closing">
        <span className="vh-eyebrow">AFRICA BUILDS DIFFERENT.</span>
        <h2>YOUR NEXT BUILD<br/><i>STARTS HERE.</i></h2>
        <p>Meet your people. Find your next idea. Build something worth sharing.</p>
        <div><button className="vh-primary" onClick={() => go("account-signup")}>JOIN THE MOVEMENT <Arrow/></button><button className="vh-secondary" onClick={() => go("feed")}>SEE THE FEED</button></div>
      </section>

      <footer className="vh-footer">
        <div className="vh-footer-spectrum" aria-hidden="true"><i/><i/><i/></div>
        <div className="vh-footer-main">
          <div className="vh-footer-brand-col">
            <Brand onClick={() => go("landing")}/>
            <span className="vh-footer-kicker">AFRICA'S BUILDER MOVEMENT</span>
            <p>A home for Africa's builders, creators and problem-solvers. Share what you're making, find your people and build what comes next.</p>
            <strong className="vh-footer-motto">DROP. <i>BUILD.</i> <b>VIBE.</b></strong>
          </div>
          <div className="vh-footer-links">
            <b>DISCOVER</b>
            <button onClick={() => go("feed")}>The Feed</button>
            <button onClick={() => go("leaderboard")}>Vibe Ranks</button>
            <button onClick={() => go("community")}>Country Chapters</button>
            <button onClick={() => go("community")}>Community</button>
          </div>
          <div className="vh-footer-links">
            <b>BUILD WITH VIBR</b>
            <button onClick={() => go("drop")}>Drop Your Build</button>
            <button onClick={() => go("collabs")}>Find Your Crew</button>
            <button onClick={() => go("hackathons")}>Hackathons</button>
            <button onClick={() => go("bounties")}>Bounties</button>
          </div>
          <div className="vh-footer-links">
            <b>GET STARTED</b>
            <button onClick={() => go("account-signup")}>Create Account</button>
            <button onClick={() => go("account-login")}>Log In</button>
            <button onClick={() => go("companies")}>For Companies</button>
            <button onClick={() => go("leaderboard")}>Meet the Builders</button>
          </div>
        </div>
        <div className="vh-footer-bottom">
          <span>© 2026 VIBR. ALL RIGHTS RESERVED.</span>
          <span className="vh-footer-unity">54 COUNTRIES <i>◆</i> ONE HUB.</span>
          <button onClick={() => window.scrollTo({top:0,behavior:"smooth"})}>BACK TO TOP ↑</button>
        </div>
      </footer>
    </main>
  );
}

const CSS = `
.vh{--ink:#0b0b0b;--paper:#f5f1e8;--red:#df2929;--gold:#f5ae00;--green:#167a43;background:var(--paper);color:var(--ink);min-height:100vh;overflow:hidden;font-family:Inter,Arial,sans-serif}
.vh *{box-sizing:border-box}
.vh button{font:inherit}
.vh button:focus-visible{outline:3px solid var(--gold);outline-offset:3px}
.vh-nav{height:74px;background:var(--paper);border-bottom:2px solid var(--ink);padding:0 clamp(18px,4vw,64px);display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px;position:relative;z-index:30}
.vh-brand{border:0;background:transparent;padding:0;display:flex;align-items:baseline;gap:2px;justify-self:start;cursor:pointer;font-family:Arial Narrow,Impact,sans-serif;font-size:30px;font-weight:900;letter-spacing:2px;line-height:1}
.vh-brand-v{color:var(--ink)}.vh-brand-i{color:var(--red)}.vh-brand-b{color:var(--ink)}.vh-brand-r{color:var(--green)}.vh-brand i{font-style:normal;color:var(--gold);font-size:25px}
.vh-nav-links{display:flex;align-items:center;gap:clamp(14px,2.2vw,34px)}
.vh-nav-links button,.vh-footer button{border:0;background:none;color:inherit;cursor:pointer}
.vh-nav-links button{font-family:Arial Narrow,Impact,sans-serif;font-size:12px;letter-spacing:2px;font-weight:700;padding:10px 0;position:relative}
.vh-nav-links button:after{content:"";position:absolute;left:0;right:100%;bottom:3px;height:2px;background:var(--red);transition:right .2s}
.vh-nav-links button:hover:after{right:0}
.vh-nav-actions{display:flex;align-items:center;justify-content:flex-end;gap:10px}
.vh-login,.vh-join{height:42px;padding:0 20px;border:2px solid var(--ink);background:transparent;color:var(--ink);font-family:Arial Narrow,Impact,sans-serif;font-size:12px;letter-spacing:2px;cursor:pointer}
.vh-join{background:var(--ink);color:var(--gold)}
.vh-login:hover{background:var(--ink);color:var(--paper)}.vh-join:hover{background:var(--gold);color:var(--ink);border-color:var(--gold)}
.vh-menu{display:none;width:42px;height:42px;background:transparent;border:1px solid var(--ink);padding:10px;flex-direction:column;justify-content:center;gap:5px;cursor:pointer}
.vh-menu span{display:block;height:2px;width:100%;background:var(--ink);transition:transform .2s,opacity .2s}
.vh-hero{display:grid;grid-template-columns:minmax(330px,35%) minmax(0,65%);min-height:610px;border-bottom:2px solid var(--ink)}
.vh-hero-copy{background:var(--paper);padding:clamp(30px,4vw,64px) clamp(22px,4vw,64px) 28px;display:flex;flex-direction:column;justify-content:center;min-width:0}
.vh-kicker{display:inline-flex;align-items:center;gap:10px;width:fit-content;max-width:100%;background:var(--green);color:#fff;padding:9px 13px;margin-bottom:24px;font-family:Arial Narrow,Impact,sans-serif;font-weight:700;font-size:10px;letter-spacing:2.3px}
.vh-kicker span{width:6px;height:6px;border-radius:50%;background:var(--gold)}
.vh-hero h1{margin:0;font-family:Arial Narrow,Impact,sans-serif;font-size:clamp(64px,7.7vw,128px);font-weight:900;line-height:.78;letter-spacing:-3px;display:flex;flex-direction:column;align-items:flex-start}
.vh-hero h1 span{display:block}
.vh-word-drop{color:var(--ink)}.vh-word-build{color:var(--gold);text-shadow:2px 2px 0 var(--ink)}.vh-word-vibe{color:var(--red)}
.vh-hero-lede{font-size:clamp(15px,1.4vw,20px);font-weight:650;line-height:1.4;margin:24px 0 7px;max-width:470px}
.vh-hero-sub{font-size:13px;color:#625f59;line-height:1.7;margin:0;max-width:440px}
.vh-hero-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}
.vh-primary,.vh-secondary{min-height:50px;display:inline-flex;align-items:center;justify-content:center;gap:12px;padding:0 22px;border:2px solid var(--ink);font-family:Arial Narrow,Impact,sans-serif;font-size:14px;letter-spacing:2px;font-weight:800;cursor:pointer;transition:transform .16s,background .16s,color .16s}
.vh-primary{background:var(--red);color:#fff;border-color:var(--ink)}.vh-primary:hover{background:var(--ink);color:var(--gold);transform:translateY(-2px)}
.vh-secondary{background:transparent;color:var(--ink)}.vh-secondary:hover{background:var(--ink);color:var(--paper);transform:translateY(-2px)}
.vh-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid #9b968d;margin-top:auto;padding-top:18px}
.vh-stat{display:flex;flex-direction:column;gap:4px;padding:0 10px;border-right:1px solid #a8a197}
.vh-stat:first-child{padding-left:0}.vh-stat:last-child{border-right:0}
.vh-stat strong{font-family:Arial Narrow,Impact,sans-serif;font-size:clamp(25px,3vw,39px);line-height:1;font-weight:900}
.vh-stat span{font-family:Arial Narrow,Impact,sans-serif;font-size:10px;letter-spacing:2.5px;font-weight:700;color:#5c5852}
.vh-hero-visual{position:relative;min-width:0;min-height:610px;background:#050807 url("/home/vibr-community-hero.webp") center 38%/cover no-repeat;display:flex;align-items:flex-end;padding:24px 22px 20px;isolation:isolate}
.vh-hero-visual:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.06),rgba(0,0,0,.05) 40%,rgba(0,0,0,.7));z-index:-1}
.vh-terminal{position:absolute;top:25px;left:28px;display:flex;flex-direction:column;gap:5px;color:#e8eee8;font:12px/1.25 ui-monospace,Consolas,monospace;text-shadow:0 2px 4px #000}
.vh-terminal b{color:#ffc52e;font-weight:700}
.vh-visual-caption{position:absolute;top:26px;right:54px;color:#fff;font-family:Arial Narrow,Impact,sans-serif;font-size:10px;letter-spacing:2px;text-shadow:0 2px 6px #000}
.vh-visual-caption i,.vh-feed-head i{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--red);margin-right:7px;box-shadow:0 0 0 4px rgba(223,41,41,.18)}
.vh-flag-rail{position:absolute;right:0;top:0;bottom:0;width:24px;display:flex;flex-direction:column}
.vh-flag-rail i{display:block;flex:1}.vh-flag-rail i:nth-child(1){background:var(--red)}.vh-flag-rail i:nth-child(2){background:var(--gold)}.vh-flag-rail i:nth-child(3){background:var(--green)}
.vh-feed-panel{width:100%;position:relative;background:rgba(5,7,7,.9);backdrop-filter:blur(7px);border:1px solid rgba(255,255,255,.84);color:#fff;padding:11px 14px 12px;z-index:2;max-width:100%;margin-right:16px}
.vh-feed-head{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(255,255,255,.42);padding-bottom:8px;margin-bottom:8px}
.vh-feed-head>span{font-family:Arial Narrow,Impact,sans-serif;font-size:12px;letter-spacing:3px;font-weight:800}
.vh-feed-head i{width:7px;height:7px;margin-right:8px}
.vh-feed-head button,.vh-feed-empty button{display:inline-flex;align-items:center;gap:8px;background:none;border:0;color:var(--gold);font-family:Arial Narrow,Impact,sans-serif;font-size:10px;letter-spacing:2px;cursor:pointer}
.vh-feed-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}
.vh-drop-card{padding:8px 12px 4px;background:transparent;border:0;border-right:1px solid rgba(255,255,255,.32);color:#fff;text-align:left;min-width:0;cursor:pointer}
.vh-drop-card:first-child{padding-left:4px}.vh-drop-card:last-child{border-right:0}
.vh-drop-card:hover .vh-drop-title{color:var(--gold)}
.vh-drop-card-top{display:flex;align-items:center;gap:9px;min-width:0}
.vh-avatar{height:30px;width:30px;display:grid;place-items:center;flex-shrink:0;background:var(--red);color:#fff;font-family:Arial Narrow,Impact,sans-serif;font-weight:900}
.vh-avatar-1{background:var(--gold);color:var(--ink)}.vh-avatar-2{background:var(--green)}
.vh-drop-author{display:flex;flex-direction:column;min-width:0;line-height:1.2}
.vh-drop-author b{font-size:11px;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.vh-drop-author small{font-size:9px;color:#aaa;margin-top:3px}
.vh-drop-votes{margin-left:auto;color:var(--gold);font-family:Arial Narrow,Impact,sans-serif;font-size:11px;white-space:nowrap}
.vh-drop-title{display:block;font-size:11px;line-height:1.35;margin:9px 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vh-drop-card p{font-size:10px;line-height:1.4;color:#d0d0d0;margin:0 0 6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.vh-drop-tags{display:flex;gap:5px;flex-wrap:wrap}
.vh-tag-chip{font-family:Arial Narrow,Impact,sans-serif;font-size:8px;letter-spacing:1px;border:1px solid var(--green);color:#70e5a0;padding:2px 6px}
.vh-tag-chip-1{border-color:var(--gold);color:#ffcf45}
.vh-feed-empty{grid-column:1/-1;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 4px}
.vh-feed-empty b{font-family:Arial Narrow,Impact,sans-serif;font-size:13px;letter-spacing:1.5px}
.vh-feed-empty span{font-size:11px;color:#bbb}
.vh-feed-empty button{margin-left:auto}
.vh-feed-loading{grid-column:1/-1;color:#bbb;font:10px Arial,sans-serif;letter-spacing:2px;padding:14px 4px}
.vh-feed-loading span{display:inline-block;width:7px;height:7px;background:var(--green);border-radius:50%;margin-right:7px}
.vh-ticker{min-height:50px;background:var(--ink);color:#fff;display:flex;justify-content:space-around;align-items:center;gap:20px;padding:12px 24px;border-bottom:2px solid var(--ink);font-family:Arial Narrow,Impact,sans-serif;font-size:clamp(11px,1.4vw,17px);font-weight:900;letter-spacing:3px;text-align:center}
.vh-ticker span:nth-of-type(1){color:var(--red)}.vh-ticker span:nth-of-type(2){color:var(--gold)}.vh-ticker span:nth-of-type(3){color:#3db66b}
.vh-ticker b{color:#fff;font-size:10px}
.vh-feature-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));background:var(--paper);border-bottom:2px solid var(--ink)}
.vh-feature{display:flex;align-items:flex-start;gap:20px;text-align:left;min-width:0;min-height:185px;padding:clamp(24px,3vw,44px);border:0;border-right:2px solid var(--ink);background:var(--paper);color:var(--ink);cursor:pointer;transition:background .18s}
.vh-feature:last-child{border-right:0}.vh-feature:hover{background:#fff}
.vh-feature-icon{font-size:33px;line-height:1;flex-shrink:0}
.vh-feature-divider{width:2px;align-self:stretch;background:var(--ink);opacity:.75;flex-shrink:0}
.vh-feature-copy{display:flex;flex-direction:column;gap:8px;min-width:0}
.vh-feature-copy b{font-family:Arial Narrow,Impact,sans-serif;font-size:clamp(18px,2vw,26px);font-weight:900;letter-spacing:1.2px;line-height:1.1}
.vh-feature-copy small{font-size:13px;line-height:1.55;color:#5f5b56}
.vh-feature-copy em{display:flex;align-items:center;gap:7px;font-style:normal;color:var(--red);font-family:Arial Narrow,Impact,sans-serif;font-size:10px;font-weight:800;letter-spacing:2px;margin-top:6px}
.vh-section{padding:62px clamp(18px,4vw,64px);background:var(--paper);color:var(--ink)}
.vh-section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:22px;margin-bottom:25px}
.vh-eyebrow{display:block;font-family:Arial Narrow,Impact,sans-serif;font-size:10px;letter-spacing:3px;color:var(--green);font-weight:800;margin-bottom:8px}
.vh-section-heading h2,.vh-market-panel h2,.vh-closing h2{font-family:Arial Narrow,Impact,sans-serif;font-size:clamp(32px,4.2vw,54px);line-height:.95;letter-spacing:-.5px;margin:0;font-weight:900}
.vh-section-heading h2 i{color:var(--red);font-style:normal}
.vh-section-heading>button{display:inline-flex;align-items:center;gap:9px;border:0;border-bottom:2px solid var(--red);padding:8px 0;background:transparent;color:var(--ink);font-family:Arial Narrow,Impact,sans-serif;font-size:11px;letter-spacing:1.8px;font-weight:800;cursor:pointer}
.vh-chapter-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:2px solid var(--ink)}
.vh-chapter{display:flex;flex-direction:column;gap:10px;text-align:left;min-width:0;padding:24px 20px 22px;border:0;border-right:2px solid var(--ink);background:transparent;color:var(--ink);cursor:pointer}
.vh-chapter:last-child{border-right:0}.vh-chapter:hover{background:#fff}
.vh-chapter-top{display:flex;align-items:center;justify-content:space-between}
.vh-chapter-top b{font-size:25px;font-weight:500;letter-spacing:1px}.vh-chapter-top i{font-size:22px;font-style:normal}
.vh-chapter>strong{font-family:Arial Narrow,Impact,sans-serif;font-size:20px;letter-spacing:1px}
.vh-chapter>small{color:#625e58;font-size:12px;line-height:1.55;min-height:38px}
.vh-chapter>em{display:flex;align-items:center;gap:6px;color:var(--red);font-family:Arial Narrow,Impact,sans-serif;font-size:9px;font-style:normal;letter-spacing:1.7px;font-weight:800;margin-top:4px}
.vh-ranks-section{padding:62px clamp(18px,4vw,64px) 70px;background:var(--ink);color:#fff}
.vh-ranks-heading h2{color:#fff}.vh-ranks-heading h2 i{color:var(--gold)}.vh-ranks-heading .vh-eyebrow{color:#bcb7ad}
.vh-ranks-heading>button{color:#fff;border-color:var(--gold)}
.vh-rank-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
.vh-rank{display:flex;flex-direction:column;align-items:center;text-align:center;padding:25px 12px;min-height:188px;border:1px solid #434343;background:#111;gap:9px}
.vh-rank>span{font-size:29px;line-height:1.1}
.vh-rank>b{font-family:Arial Narrow,Impact,sans-serif;font-size:15px;letter-spacing:1px}
.vh-rank>strong{font:800 10px Arial Narrow,sans-serif;letter-spacing:1px;color:var(--gold)}
.vh-rank>small{font-size:11px;color:#a6a6a6;line-height:1.45}
.rank-icon{border-color:var(--gold)}
.vh-marketplace{display:grid;grid-template-columns:1fr 1fr;border-top:2px solid var(--ink);border-bottom:2px solid var(--ink)}
.vh-market-panel{min-width:0;padding:clamp(34px,5vw,70px);display:flex;flex-direction:column;align-items:flex-start}
.vh-investors{background:var(--ink);color:#fff;border-right:2px solid var(--ink)}
.vh-companies{background:var(--paper);color:var(--ink)}
.vh-investors .vh-eyebrow{color:var(--gold)}.vh-companies .vh-eyebrow{color:var(--green)}
.vh-market-panel h2{font-size:clamp(38px,5vw,66px);margin:5px 0 18px}
.vh-market-panel h2 i{font-style:normal;color:var(--gold)}.vh-companies h2 i{color:var(--green)}
.vh-market-panel>p{max-width:440px;font-size:14px;line-height:1.7;color:inherit;opacity:.76;margin:0 0 18px}
.vh-market-panel ul{list-style:none;padding:0;margin:0 0 26px;display:grid;gap:10px}
.vh-market-panel li{font-size:12px;line-height:1.45}
.vh-market-panel li:before{content:"◆";font-size:8px;color:var(--gold);margin-right:10px}
.vh-companies li:before{color:var(--green)}
.vh-market-button{display:inline-flex;align-items:center;gap:10px;min-height:48px;padding:0 20px;border:2px solid var(--ink);font-family:Arial Narrow,Impact,sans-serif;font-size:12px;letter-spacing:2px;font-weight:800;cursor:pointer}
.vh-market-gold{background:var(--gold);color:var(--ink)}.vh-market-green{background:var(--green);color:#fff;border-color:var(--ink)}
.vh-market-button:hover{filter:brightness(1.08);transform:translateY(-1px)}
.vh-closing{padding:78px 20px 82px;background:var(--red);color:#fff;text-align:center;position:relative;overflow:hidden}
.vh-closing:before{content:"VIBR";position:absolute;font-family:Arial Narrow,Impact,sans-serif;font-size:clamp(120px,24vw,310px);font-weight:900;letter-spacing:-12px;color:rgba(255,255,255,.055);left:50%;top:42%;transform:translate(-50%,-50%);pointer-events:none}
.vh-closing>*{position:relative}
.vh-closing .vh-eyebrow{color:#ffe7b3}
.vh-closing h2{font-size:clamp(44px,7vw,88px);margin-bottom:13px}
.vh-closing h2 i{font-style:normal;color:var(--ink)}
.vh-closing p{margin:0 auto 25px;max-width:500px;font-size:14px;line-height:1.65}
.vh-closing>div{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}
.vh-closing .vh-primary{background:var(--ink);border-color:var(--ink);color:var(--gold)}
.vh-closing .vh-secondary{border-color:#fff;color:#fff}
.vh-footer{background:radial-gradient(90% 130% at 8% 0%,rgba(22,122,67,.13),transparent 48%),#080a09;color:#fff;padding:0 clamp(18px,4vw,64px) 20px;border-top:2px solid #20231f}
.vh-footer-spectrum{height:5px;display:grid;grid-template-columns:1fr 1fr 1fr;margin:0 calc(clamp(18px,4vw,64px) * -1) 0}
.vh-footer-spectrum i:nth-child(1){background:var(--red)}.vh-footer-spectrum i:nth-child(2){background:var(--gold)}.vh-footer-spectrum i:nth-child(3){background:var(--green)}
.vh-footer .vh-brand{font-size:36px}.vh-footer .vh-brand-v,.vh-footer .vh-brand-b{color:#fff}
.vh-footer-main{display:grid;grid-template-columns:minmax(240px,1.55fr) repeat(3,minmax(125px,.8fr));gap:clamp(24px,4vw,58px);padding:48px 0 40px;border-bottom:1px solid #343832}
.vh-footer-brand-col{max-width:380px}
.vh-footer-kicker{display:block;margin-top:16px;color:#77bd91;font-family:Arial Narrow,Impact,sans-serif;font-size:10px;letter-spacing:2.5px;font-weight:800}
.vh-footer-brand-col p{max-width:340px;color:#b3b7b0;font-size:13px;line-height:1.8;margin:12px 0 18px}
.vh-footer-motto{display:block;color:#fff;font-family:Arial Narrow,Impact,sans-serif;font-size:18px;letter-spacing:2.4px}
.vh-footer-motto i{font-style:normal;color:var(--gold)}.vh-footer-motto b{color:var(--red)}
.vh-footer-links{display:flex;flex-direction:column;align-items:flex-start;gap:13px;padding-top:5px}
.vh-footer-links>b{font-family:Arial Narrow,Impact,sans-serif;color:var(--gold);font-size:11px;letter-spacing:2.2px;margin-bottom:5px}
.vh-footer-links button{padding:0;color:#c7c9c4;text-align:left;font-size:13px;line-height:1.4;transition:color .16s,transform .16s}
.vh-footer-links button:hover{color:#fff;transform:translateX(3px)}
.vh-footer-bottom{padding-top:18px;display:flex;align-items:center;justify-content:space-between;gap:16px;color:#888e86;font-family:Arial Narrow,Impact,sans-serif;font-size:10px;letter-spacing:1.8px}
.vh-footer-unity{color:#d8d8d2}.vh-footer-unity i{font-size:8px;color:var(--red);font-style:normal;margin:0 8px}
.vh-footer-bottom>button{border:1px solid #4a5049;background:transparent;color:#d8d8d2;padding:9px 12px;font-family:Arial Narrow,Impact,sans-serif;font-size:9px;letter-spacing:1.5px;cursor:pointer}
.vh-footer-bottom>button:hover{border-color:var(--gold);color:var(--gold)}
@media(max-width:1100px){
  .vh-nav{grid-template-columns:auto 1fr auto;gap:12px;padding:0 20px}
  .vh-nav-links{gap:12px}.vh-nav-links button{font-size:10px;letter-spacing:1.3px}
  .vh-login,.vh-join{padding:0 13px}
  .vh-hero{grid-template-columns:minmax(300px,38%) minmax(0,62%)}
  .vh-feature{gap:14px;padding:26px 18px}
  .vh-drop-card{padding-left:8px;padding-right:8px}
  .vh-drop-card p{display:none}
}
@media(max-width:760px){
  .vh-nav{height:66px;grid-template-columns:1fr auto;padding:0 16px}
  .vh-brand{font-size:28px}
  .vh-menu{display:flex}
  .vh-menu-open span:first-child{transform:translateY(7px) rotate(45deg)}
  .vh-menu-open span:nth-child(2){opacity:0}
  .vh-menu-open span:last-child{transform:translateY(-7px) rotate(-45deg)}
  .vh-nav-links{display:none;position:absolute;top:66px;left:0;right:0;padding:12px 18px 18px;background:var(--paper);border-bottom:2px solid var(--ink);align-items:stretch;flex-direction:column;gap:0}
  .vh-nav-links-open{display:flex}
  .vh-nav-links button{text-align:left;font-size:13px;padding:13px 0;border-bottom:1px solid #d2ccc1}
  .vh-nav-links button:after{display:none}
  .vh-nav-actions{gap:7px}.vh-login,.vh-join{height:38px;padding:0 11px;font-size:10px}
  .vh-hero{display:flex;flex-direction:column;min-height:0}
  .vh-hero-copy{padding:32px 20px 22px;min-height:0}
  .vh-kicker{font-size:8px;letter-spacing:1.5px;margin-bottom:20px}
  .vh-hero h1{font-size:clamp(67px,17vw,112px);letter-spacing:-2px}
  .vh-hero-lede{font-size:16px;margin-top:20px}
  .vh-hero-sub{font-size:12px}
  .vh-hero-actions{margin-top:20px;gap:8px}
  .vh-primary,.vh-secondary{min-height:46px;padding:0 13px;font-size:11px;letter-spacing:1.2px}
  .vh-stats{margin-top:26px;padding-top:15px}
  .vh-stat{padding:0 7px}.vh-stat strong{font-size:28px}.vh-stat span{font-size:8px;letter-spacing:1.5px}
  .vh-hero-visual{min-height:450px;padding:0 12px 13px;background-position:center 30%}
  .vh-terminal{top:15px;left:16px;font-size:10px}
  .vh-visual-caption{top:16px;right:30px;font-size:8px;letter-spacing:1px}
  .vh-feed-panel{margin-right:16px;padding:9px 10px}
  .vh-feed-head>span{font-size:10px;letter-spacing:2px}.vh-feed-head button{font-size:8px}
  .vh-feed-grid{grid-template-columns:1fr}
  .vh-drop-card{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto;gap:4px 10px;padding:7px 3px;border-right:0;border-bottom:1px solid rgba(255,255,255,.22)}
  .vh-drop-card:last-child{border-bottom:0}
  .vh-drop-card-top{grid-column:1/3}
  .vh-drop-title{margin:0;font-size:10px;white-space:normal;grid-column:1}
  .vh-drop-card p{display:none}
  .vh-drop-tags{grid-column:2;grid-row:2;justify-content:flex-end;align-items:start}
  .vh-feed-empty{gap:7px}.vh-feed-empty b{font-size:11px}.vh-feed-empty span{font-size:10px}
  .vh-ticker{min-height:44px;justify-content:flex-start;overflow:hidden;white-space:nowrap;gap:18px;padding:10px 16px;font-size:11px;letter-spacing:2px}
  .vh-ticker b{flex-shrink:0}.vh-ticker span{flex-shrink:0}
  .vh-feature-row{grid-template-columns:1fr}
  .vh-feature{min-height:0;padding:21px 20px;border-right:0;border-bottom:2px solid var(--ink);gap:16px}
  .vh-feature:last-child{border-bottom:0}
  .vh-feature-icon{font-size:29px}
  .vh-feature-copy b{font-size:21px}
  .vh-feature-copy small{font-size:12px}
  .vh-section{padding:42px 18px}
  .vh-section-heading{align-items:flex-start;flex-direction:column;gap:12px}
  .vh-section-heading h2{font-size:38px}
  .vh-chapter-grid{grid-template-columns:1fr 1fr}
  .vh-chapter{padding:18px 13px;border-bottom:2px solid var(--ink)}
  .vh-chapter:nth-child(2){border-right:0}
  .vh-chapter:nth-child(3),.vh-chapter:nth-child(4){border-bottom:0}
  .vh-chapter>strong{font-size:16px}
  .vh-chapter>small{font-size:11px;min-height:52px}
  .vh-ranks-section{padding:42px 18px}
  .vh-rank-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .vh-rank{min-height:160px;padding:18px 9px}
  .vh-rank:last-child{grid-column:1/-1}
  .vh-marketplace{grid-template-columns:1fr}
  .vh-market-panel{padding:38px 22px}
  .vh-investors{border-right:0;border-bottom:2px solid var(--ink)}
  .vh-market-panel h2{font-size:49px}
  .vh-closing{padding:58px 18px}
  .vh-closing h2{font-size:clamp(42px,12vw,68px)}
  .vh-footer{padding:0 18px 16px}
  .vh-footer-spectrum{margin:0 -18px}
  .vh-footer-main{grid-template-columns:1fr 1fr;gap:30px 18px;padding:34px 0 28px}
  .vh-footer-brand-col{grid-column:1/-1;max-width:100%}
  .vh-footer-brand-col p{max-width:460px}
  .vh-footer-links{gap:12px}
  .vh-footer-links>b{font-size:10px;letter-spacing:1.7px}
  .vh-footer-links button{font-size:12px}
  .vh-footer-bottom{font-size:8px;letter-spacing:1px;flex-wrap:wrap;justify-content:space-between}
  .vh-footer-unity{order:3;width:100%;text-align:center;padding-top:4px}
  .vh-footer-bottom>button{padding:8px 9px;font-size:8px}

}
@media(max-width:390px){
  .vh-login{display:none}
  .vh-hero-actions{display:grid;grid-template-columns:1fr}
  .vh-primary,.vh-secondary{width:100%}
  .vh-stats{grid-template-columns:repeat(3,minmax(0,1fr))}
  .vh-stat strong{font-size:24px}
}
`;
