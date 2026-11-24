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

        <div className="vh-hero-visual">
          <img className="vh-hero-photo" src="/home/vibr-community-hero.webp" alt="Four African young builders collaborating around a VIBR laptop, with headphones, green Matrix code and a connected map of Africa."/>
          <div className="vh-feed-panel">
            <div className="vh-feed-head"><span><i/> LIVE FEED <b>|</b></span></div>
            <div className="vh-feed-grid">
              {drops.map((post, index) => <DropCard key={post.id || index} post={post} index={index} onOpen={() => go("feed")}/>)}
              {!dropsLoading && drops.length > 0 && Array.from({length:Math.max(0,3-drops.length)}).map((_,index) => (
                <div className="vh-drop-empty-card" key={"invite-"+index}>
                  <span className="vh-drop-empty-mark">{index===0?"+":"↗"}</span>
                  <b>{index===0?"YOUR BUILD NEXT?":"FIND YOUR CREW"}</b>
                  <small>{index===0?"Share your project with the VIBR builder community.":"Meet developers, designers and co-founders across Africa."}</small>
                  <button onClick={() => go(index===0?"drop":"collabs")}>{index===0?"DROP A BUILD":"EXPLORE COLLABS"} <Arrow/></button>
                </div>
              ))}
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
        <span>DROP. BUILD. VIBE.</span><b>/</b><span>54 COUNTRIES. ONE HUB.</span><b>/</b><span>AFRICA BUILDS DIFFERENT.</span>
      </div>

      <section className="vh-feature-row" aria-label="What you can do on VIBR">
        <button className="vh-feature" onClick={() => go("drop")}>
          <span className="vh-feature-icon">🔥</span><span className="vh-feature-divider"/>
          <span className="vh-feature-copy"><b>DROP YOUR BUILD</b><small>Post projects and get feedback from African builders who understand your market.</small></span>
        </button>
        <button className="vh-feature" onClick={() => go("collabs")}>
          <span className="vh-feature-icon">🤝</span><span className="vh-feature-divider"/>
          <span className="vh-feature-copy"><b>FIND YOUR CREW</b><small>Match with designers, devs, and co-founders across 54 African countries.</small></span>
        </button>
        <button className="vh-feature" onClick={() => go("leaderboard")}>
          <span className="vh-feature-icon vh-feature-globe">🌍</span><span className="vh-feature-divider"/>
          <span className="vh-feature-copy"><b>GET SEEN GLOBALLY</b><small>Investors worldwide watch VIBR for the next wave of African tech talent.</small></span>
        </button>
      </section>

      <section className="vh-section vh-chapters">
        <div className="vh-section-heading">
          <div><span className="vh-eyebrow">54 COUNTRIES. ONE COMMUNITY.</span><h2>COUNTRY <i>CHAPTERS</i></h2></div>
          <button onClick={() => go("community")}>EXPLORE THE COMMUNITY <Arrow/></button>
        </div>
        <div className="vh-chapter-grid">
          {CHAPTERS.map((chapter, index) => (
            <button className="vh-chapter" key={chapter.code} onClick={() => go("community")}>
              <span className="vh-chapter-top"><b>{chapter.code}</b><i aria-hidden="true">{String(index + 1).padStart(2, "0")}</i></span>
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
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap');
.vh{--ink:#090909;--paper:#f5f1e8;--red:#e3262d;--gold:#f4ae00;--green:#147b43;--muted:#6b6861;min-height:100vh;overflow:hidden;color:var(--ink);background:var(--paper);font-family:"DM Sans",Arial,sans-serif}
.vh *{box-sizing:border-box}.vh button{font:inherit}.vh button:focus-visible{outline:3px solid var(--gold);outline-offset:3px}
.vh-nav{height:74px;padding:0 3.2%;display:grid;grid-template-columns:22.3% minmax(0,1fr) 21.7%;align-items:center;position:relative;z-index:30;border-bottom:2px solid var(--ink);background-color:var(--paper);background-image:radial-gradient(rgba(30,25,17,.075) .55px,transparent .65px);background-size:4px 4px}
.vh-nav:before,.vh-nav:after{content:"";position:absolute;top:17px;bottom:17px;width:2px;background:var(--ink)}.vh-nav:before{left:22.3%}.vh-nav:after{right:21.7%}
.vh-brand{border:0;background:transparent;padding:0;justify-self:start;display:flex;align-items:baseline;gap:4px;cursor:pointer;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:39px;line-height:1;font-weight:900;letter-spacing:5px}
.vh-brand-v{color:var(--ink)}.vh-brand-i{color:var(--red)}.vh-brand-b{color:var(--gold)}.vh-brand-r{color:var(--green)}.vh-brand i{font-style:normal;color:var(--green);font-size:.75em;margin-left:-2px}
.vh-nav-links{min-width:0;display:flex;align-items:center;justify-content:center;gap:clamp(17px,2.4vw,40px)}
.vh-nav-links button,.vh-footer button{border:0;background:none;color:inherit;cursor:pointer}
.vh-nav-links button{padding:10px 0;position:relative;white-space:nowrap;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:17px;line-height:1;font-weight:800;letter-spacing:1.8px}
.vh-nav-links button:after{content:"";position:absolute;left:0;right:100%;bottom:2px;height:2px;background:var(--red);transition:right .18s ease}.vh-nav-links button:hover:after{right:0}
.vh-nav-actions{display:flex;align-items:center;justify-content:flex-end;gap:12px}
.vh-login,.vh-join{height:46px;min-width:112px;padding:0 20px;border:2px solid var(--ink);background:transparent;color:var(--ink);cursor:pointer;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif!important;font-size:17px!important;font-weight:700!important;letter-spacing:2px;white-space:nowrap}
.vh-join{min-width:151px;background:var(--ink);color:var(--gold)}.vh-login:hover{background:var(--ink);color:var(--paper)}.vh-join:hover{background:var(--gold);border-color:var(--gold);color:var(--ink)}
.vh-menu{display:none;width:42px;height:42px;padding:10px;border:1px solid var(--ink);background:transparent;flex-direction:column;justify-content:center;gap:5px;cursor:pointer}.vh-menu span{height:2px;width:100%;display:block;background:var(--ink);transition:transform .18s,opacity .18s}
.vh-menu-open span:first-child{transform:translateY(7px) rotate(45deg)}.vh-menu-open span:nth-child(2){opacity:0}.vh-menu-open span:last-child{transform:translateY(-7px) rotate(-45deg)}
.vh-hero{display:grid;grid-template-columns:34.6% 65.4%;height:637px;min-height:637px;border-bottom:2px solid var(--ink)}
.vh-hero-copy{min-width:0;height:637px;padding:32px clamp(28px,3.15vw,53px) 28px;display:flex;flex-direction:column;align-items:flex-start;background-color:#f6f2e9;background-image:radial-gradient(rgba(30,25,17,.075) .55px,transparent .65px);background-size:4px 4px}
.vh-kicker{min-height:30px;max-width:100%;display:inline-flex;align-items:center;gap:10px;margin:0 0 20px;padding:5px 14px;background:var(--green);color:#fff;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:14px;line-height:1;font-weight:800;letter-spacing:2.4px;white-space:nowrap}
.vh-kicker span{width:6px;height:6px;flex:0 0 6px;border-radius:50%;background:var(--gold)}
.vh-hero h1{width:100%;margin:0;display:flex;flex-direction:column;align-items:flex-start;transform:none;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:clamp(94px,7.45vw,125px);font-weight:900;line-height:.81;letter-spacing:-1.6px}
.vh-hero h1 span{display:block;white-space:nowrap}.vh-word-drop{color:var(--ink)}.vh-word-build{color:var(--gold);text-shadow:2px 2px 0 var(--ink)}.vh-word-vibe{color:var(--red)}
.vh-hero-lede{max-width:100%;margin:10px 0 0;color:#161616;font-size:18px;font-weight:500;line-height:1.4;letter-spacing:-.25px}.vh-hero-sub{display:none}
.vh-hero-actions{width:100%;max-width:480px;display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:28px}
.vh-primary,.vh-secondary{min-width:0;min-height:56px;display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:0 12px;border:2px solid var(--ink);cursor:pointer;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif!important;font-size:18px!important;line-height:1;font-weight:800!important;letter-spacing:2px;white-space:nowrap;transition:background .16s,color .16s,transform .16s}
.vh-primary{background:var(--red);color:#fff}.vh-primary:hover{background:var(--ink);color:var(--gold);transform:translateY(-2px)}.vh-secondary{background:transparent;color:var(--ink)}.vh-secondary:hover{background:var(--ink);color:var(--paper);transform:translateY(-2px)}
.vh-stats{width:100%;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin-top:auto;padding-top:18px;border-top:1px solid #a8a196}
.vh-stat{min-width:0;display:flex;flex-direction:column;gap:4px;padding:0 18px;border-right:2px solid #bcb5a9}.vh-stat:first-child{padding-left:0}.vh-stat:last-child{border-right:0}
.vh-stat strong{color:var(--ink);font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:39px;line-height:1;font-weight:900}.vh-stat span{color:#36332e;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:13px;line-height:1;font-weight:800;letter-spacing:3px}
.vh-hero-visual{min-width:0;height:637px;position:relative;overflow:hidden;background:#050807}
.vh-hero-photo{position:absolute;top:0;left:0;display:block;width:calc(100% - 40px);height:auto;aspect-ratio:840 / 360;object-fit:contain;object-position:top left}
.vh-flag-rail{position:absolute;z-index:1;top:0;right:0;bottom:0;width:40px;display:flex;flex-direction:column}.vh-flag-rail i{display:block;flex:1}.vh-flag-rail i:nth-child(1){background:var(--red)}.vh-flag-rail i:nth-child(2){background:var(--gold)}.vh-flag-rail i:nth-child(3){background:var(--green)}
.vh-feed-panel{position:absolute;z-index:3;left:26px;right:58px;bottom:18px;height:170px;min-width:0;display:flex;flex-direction:column;padding:10px 13px 11px;border:1px solid rgba(255,255,255,.92);color:#fff;background:rgba(5,7,7,.97)}
.vh-feed-head{min-height:25px;display:flex;align-items:center;justify-content:flex-start;gap:12px;margin-bottom:5px;padding-bottom:7px;border-bottom:1px solid rgba(255,255,255,.55)}
.vh-feed-head>span{display:flex;align-items:center;gap:10px;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:16px;line-height:1;font-weight:800;letter-spacing:3px}.vh-feed-head>span>b{margin-left:12px;color:#d9d9d9;font-weight:500}
.vh-feed-head i,.vh-live-dot{display:inline-block;width:8px;height:8px;flex:0 0 8px;border-radius:50%;background:var(--red);box-shadow:0 0 0 4px rgba(227,38,45,.16)}
.vh-feed-head button,.vh-feed-empty button{display:inline-flex;align-items:center;gap:7px;border:0;background:none;color:var(--gold);cursor:pointer;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:11px;letter-spacing:1.8px}
.vh-feed-grid{min-height:0;flex:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}
.vh-drop-card{min-width:0;display:block;padding:7px 13px 3px;border:0;border-right:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;text-align:left;cursor:pointer}.vh-drop-card:first-child{padding-left:6px}.vh-drop-card:last-child{border-right:0}.vh-drop-card:hover .vh-drop-title{color:var(--gold)}
.vh-drop-card-top{min-width:0;display:flex;align-items:center;gap:10px}.vh-avatar{width:31px;height:31px;flex:0 0 31px;display:grid;place-items:center;background:var(--red);color:#fff;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:15px;font-weight:900}.vh-avatar-1{background:var(--gold);color:var(--ink)}.vh-avatar-2{background:var(--green)}
.vh-drop-author{min-width:0;display:flex;flex-direction:column;line-height:1.2}.vh-drop-author b{overflow:hidden;color:#fff;font-size:13px;white-space:nowrap;text-overflow:ellipsis}.vh-drop-author small{margin-top:3px;color:#aaa;font-size:9px}
.vh-drop-votes{margin-left:auto;color:var(--gold);font-family:"Barlow Condensed",sans-serif;font-size:13px;white-space:nowrap}.vh-drop-title{display:block;margin:6px 0 4px;color:#fff;font-size:12px;line-height:1.3;font-weight:700;overflow-wrap:anywhere}
.vh-drop-card p{display:-webkit-box;margin:0 0 5px;color:#d0d0d0;font-size:11px;line-height:1.35;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.vh-drop-tags{display:flex;gap:6px;flex-wrap:wrap}
.vh-tag-chip{padding:2px 6px;border:1px solid var(--green);color:#66dc92;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:10px;font-weight:700;letter-spacing:1px}.vh-tag-chip-1{border-color:var(--gold);color:#ffcb43}
.vh-drop-empty-card{min-width:0;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:7px;padding:8px 13px 5px;border-right:1px solid rgba(255,255,255,.35);color:#fff}.vh-drop-empty-card:last-child{border-right:0}
.vh-drop-empty-mark{width:29px;height:29px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.7);color:var(--gold);font-size:21px}
.vh-drop-empty-card>b{color:#fff;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:14px;font-weight:800;letter-spacing:1.3px}.vh-drop-empty-card>small{max-width:220px;color:#bdbdbd;font-size:10px;line-height:1.4}
.vh-drop-empty-card>button{display:inline-flex;align-items:center;gap:6px;padding:0;border:0;background:transparent;color:var(--gold);cursor:pointer;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:10px;font-weight:800;letter-spacing:1.2px}
.vh-feed-empty{grid-column:1/-1;display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 4px}.vh-feed-empty b{font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:15px;letter-spacing:1.5px}.vh-feed-empty span{color:#bbb;font-size:11px}.vh-feed-empty button{margin-left:auto}
.vh-feed-loading{grid-column:1/-1;align-self:center;color:#bbb;font:11px "DM Sans",Arial,sans-serif;letter-spacing:1.5px;padding:14px 4px}.vh-feed-loading span{display:inline-block;width:7px;height:7px;margin-right:7px;border-radius:50%;background:var(--green)}
.vh-ticker{min-height:50px;display:flex;align-items:center;justify-content:space-around;gap:16px;padding:10px 4%;border-bottom:2px solid var(--ink);background:var(--ink);color:#fff;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:20px;line-height:1;font-weight:800;letter-spacing:3px;text-align:center}
.vh-ticker span:nth-of-type(1){color:var(--red)}.vh-ticker span:nth-of-type(2){color:var(--gold)}.vh-ticker span:nth-of-type(3){color:#38a95d}.vh-ticker b{color:#fff;font-size:20px;font-weight:600}
.vh-feature-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-bottom:2px solid var(--ink);background-color:#f6f2e9;background-image:radial-gradient(rgba(30,25,17,.075) .55px,transparent .65px);background-size:4px 4px}
.vh-feature{min-width:0;min-height:166px;display:flex;align-items:center;gap:20px;padding:24px 3.1%;border:0;border-right:2px solid var(--ink);background:transparent;color:var(--ink);text-align:left;cursor:pointer;transition:background .18s}.vh-feature:last-child{border-right:0}.vh-feature:hover{background:rgba(255,255,255,.48)}
.vh-feature-icon{flex:0 0 43px;font-size:39px;line-height:1;text-align:center}.vh-feature-globe{filter:hue-rotate(48deg) saturate(1.25)}.vh-feature-divider{width:2px;height:62px;flex:0 0 2px;background:var(--ink)}
.vh-feature-copy{min-width:0;display:flex;flex-direction:column;gap:7px}.vh-feature-copy b{color:var(--ink);font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:clamp(22px,2vw,29px);line-height:1.05;font-weight:800;letter-spacing:.6px}.vh-feature-copy small{color:#35322d;font-size:13px;line-height:1.55}
.vh-section{padding:62px clamp(18px,4vw,64px);background:var(--paper);color:var(--ink)}.vh-section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:22px;margin-bottom:25px}
.vh-eyebrow{display:block;margin-bottom:8px;color:var(--green);font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:12px;font-weight:800;letter-spacing:3px}
.vh-section-heading h2,.vh-market-panel h2,.vh-closing h2{margin:0;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:clamp(36px,4.2vw,58px);line-height:.95;letter-spacing:-.5px;font-weight:900}.vh-section-heading h2 i{color:var(--red);font-style:normal}
.vh-section-heading>button{display:inline-flex;align-items:center;gap:9px;padding:8px 0;border:0;border-bottom:2px solid var(--red);background:transparent;color:var(--ink);cursor:pointer;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:13px;letter-spacing:1.8px;font-weight:800}
.vh-chapter-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:2px solid var(--ink)}.vh-chapter{min-width:0;display:flex;flex-direction:column;gap:10px;padding:24px 20px 22px;border:0;border-right:2px solid var(--ink);background:transparent;color:var(--ink);text-align:left;cursor:pointer}.vh-chapter:last-child{border-right:0}.vh-chapter:hover{background:rgba(255,255,255,.5)}
.vh-chapter-top{display:flex;align-items:center;justify-content:space-between}.vh-chapter-top b{font-size:25px;font-weight:500;letter-spacing:1px}.vh-chapter-top i{color:var(--red);font-family:"Barlow Condensed",sans-serif;font-size:15px;font-style:normal;font-weight:800;letter-spacing:2px}
.vh-chapter>strong{font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:21px;letter-spacing:1px}.vh-chapter>small{min-height:38px;color:#625e58;font-size:12px;line-height:1.55}.vh-chapter>em{display:flex;align-items:center;gap:6px;margin-top:4px;color:var(--red);font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:11px;font-style:normal;letter-spacing:1.7px;font-weight:800}
.vh-ranks-section{padding:62px clamp(18px,4vw,64px) 70px;background:var(--ink);color:#fff}.vh-ranks-heading h2{color:#fff}.vh-ranks-heading h2 i{color:var(--gold)}.vh-ranks-heading .vh-eyebrow{color:#bcb7ad}.vh-ranks-heading>button{color:#fff;border-color:var(--gold)}
.vh-rank-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.vh-rank{min-height:188px;display:flex;flex-direction:column;align-items:center;gap:9px;padding:25px 12px;border:1px solid #434343;background:#111;text-align:center}.vh-rank>span{font-size:29px;line-height:1.1}.vh-rank>b{font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:17px;letter-spacing:1px}.vh-rank>strong{color:var(--gold);font:800 12px "Barlow Condensed","Arial Narrow",sans-serif;letter-spacing:1px}.vh-rank>small{color:#a6a6a6;font-size:11px;line-height:1.45}.rank-icon{border-color:var(--gold)}
.vh-marketplace{display:grid;grid-template-columns:1fr 1fr;border-top:2px solid var(--ink);border-bottom:2px solid var(--ink)}.vh-market-panel{min-width:0;display:flex;flex-direction:column;align-items:flex-start;padding:clamp(34px,5vw,70px)}.vh-investors{border-right:2px solid var(--ink);background:var(--ink);color:#fff}.vh-companies{background:var(--paper);color:var(--ink)}
.vh-investors .vh-eyebrow{color:var(--gold)}.vh-companies .vh-eyebrow{color:var(--green)}.vh-market-panel h2{margin:5px 0 18px;font-size:clamp(40px,5vw,68px)}.vh-market-panel h2 i{color:var(--gold);font-style:normal}.vh-companies h2 i{color:var(--green)}
.vh-market-panel>p{max-width:440px;margin:0 0 18px;color:inherit;font-size:14px;line-height:1.7;opacity:.76}.vh-market-panel ul{display:grid;gap:10px;margin:0 0 26px;padding:0;list-style:none}.vh-market-panel li{font-size:12px;line-height:1.45}.vh-market-panel li:before{content:"◆";margin-right:10px;color:var(--gold);font-size:8px}.vh-companies li:before{color:var(--green)}
.vh-market-button{min-height:48px;display:inline-flex;align-items:center;gap:10px;padding:0 20px;border:2px solid var(--ink);cursor:pointer;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:14px;letter-spacing:2px;font-weight:800}.vh-market-gold{background:var(--gold);color:var(--ink)}.vh-market-green{border-color:var(--ink);background:var(--green);color:#fff}.vh-market-button:hover{filter:brightness(1.08);transform:translateY(-1px)}
.vh-closing{position:relative;overflow:hidden;padding:78px 20px 82px;background:var(--red);color:#fff;text-align:center}.vh-closing:before{content:"VIBR";position:absolute;top:42%;left:50%;transform:translate(-50%,-50%);color:rgba(255,255,255,.055);font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:clamp(120px,24vw,310px);font-weight:900;letter-spacing:-12px;pointer-events:none}.vh-closing>*{position:relative}.vh-closing .vh-eyebrow{color:#ffe7b3}.vh-closing h2{margin-bottom:13px;font-size:clamp(44px,7vw,88px)}.vh-closing h2 i{color:var(--ink);font-style:normal}.vh-closing p{max-width:500px;margin:0 auto 25px;font-size:14px;line-height:1.65}.vh-closing>div{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}.vh-closing .vh-primary{border-color:var(--ink);background:var(--ink);color:var(--gold)}.vh-closing .vh-secondary{border-color:#fff;color:#fff}
.vh-footer{padding:0 clamp(18px,4vw,64px) 20px;border-top:2px solid #20231f;background:radial-gradient(90% 130% at 8% 0%,rgba(22,122,67,.13),transparent 48%),#080a09;color:#fff}.vh-footer-spectrum{height:5px;display:grid;grid-template-columns:1fr 1fr 1fr;margin:0 calc(clamp(18px,4vw,64px) * -1)}.vh-footer-spectrum i:nth-child(1){background:var(--red)}.vh-footer-spectrum i:nth-child(2){background:var(--gold)}.vh-footer-spectrum i:nth-child(3){background:var(--green)}
.vh-footer .vh-brand{font-size:36px}.vh-footer .vh-brand-v,.vh-footer .vh-brand-b{color:#fff}.vh-footer-main{display:grid;grid-template-columns:minmax(240px,1.55fr) repeat(3,minmax(125px,.8fr));gap:clamp(24px,4vw,58px);padding:48px 0 40px;border-bottom:1px solid #343832}.vh-footer-brand-col{max-width:380px}
.vh-footer-kicker{display:block;margin-top:16px;color:#77bd91;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:12px;letter-spacing:2.5px;font-weight:800}.vh-footer-brand-col p{max-width:340px;margin:12px 0 18px;color:#b3b7b0;font-size:13px;line-height:1.8}.vh-footer-motto{display:block;color:#fff;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:19px;letter-spacing:2.4px}.vh-footer-motto i{color:var(--gold);font-style:normal}.vh-footer-motto b{color:var(--red)}
.vh-footer-links{display:flex;flex-direction:column;align-items:flex-start;gap:13px;padding-top:5px}.vh-footer-links>b{margin-bottom:5px;color:var(--gold);font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:13px;letter-spacing:2.2px}.vh-footer-links button{padding:0;color:#c7c9c4;text-align:left;font-size:13px;line-height:1.4;transition:color .16s,transform .16s}.vh-footer-links button:hover{color:#fff;transform:translateX(3px)}
.vh-footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-top:18px;color:#888e86;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:12px;letter-spacing:1.8px}.vh-footer-unity{color:#d8d8d2}.vh-footer-unity i{margin:0 8px;color:var(--red);font-size:8px;font-style:normal}.vh-footer-bottom>button{padding:9px 12px;border:1px solid #4a5049;background:transparent;color:#d8d8d2;cursor:pointer;font-family:"Barlow Condensed","Arial Narrow",Impact,sans-serif;font-size:11px;letter-spacing:1.5px}.vh-footer-bottom>button:hover{border-color:var(--gold);color:var(--gold)}

@media (min-width:1101px) and (max-width:1400px){
  .vh-nav{grid-template-columns:19% minmax(0,1fr) 22%;padding:0 2.4%}.vh-nav:before{left:19%}.vh-nav:after{right:22%}
  .vh-nav-links{gap:clamp(12px,1.7vw,24px)}.vh-nav-links button{font-size:15px;letter-spacing:1.4px}.vh-login{min-width:92px;padding:0 13px}.vh-join{min-width:124px;padding:0 13px}
  .vh-hero{grid-template-columns:36% 64%}.vh-hero-copy{padding-left:34px;padding-right:34px}.vh-hero h1{font-size:clamp(88px,8.2vw,112px)}.vh-hero-lede{font-size:16px}.vh-hero-actions{gap:12px}
  .vh-primary,.vh-secondary{font-size:15px!important;letter-spacing:1.2px}.vh-stat{padding:0 12px}.vh-stat strong{font-size:34px}.vh-feed-panel{left:18px;right:52px}
}
@media (max-width:1100px){
  .vh-nav{grid-template-columns:19% minmax(0,1fr) 22%;padding:0 2%}.vh-nav:before{left:19%}.vh-nav:after{right:22%}.vh-nav-links{gap:clamp(9px,1.2vw,14px)}.vh-nav-links button{font-size:13px;letter-spacing:1px}
  .vh-login{min-width:80px;padding:0 9px;font-size:14px!important}.vh-join{min-width:105px;padding:0 9px;font-size:14px!important}.vh-brand{font-size:34px;letter-spacing:4px}
  .vh-hero{grid-template-columns:39% 61%;height:590px;min-height:590px}.vh-hero-copy{height:590px;padding:26px 26px 22px}.vh-hero h1{font-size:clamp(82px,8.4vw,96px);line-height:.83}.vh-kicker{font-size:11px;letter-spacing:1.5px}.vh-hero-lede{font-size:15px}.vh-hero-actions{gap:8px;margin-top:20px}
  .vh-primary,.vh-secondary{min-height:49px;padding:0 7px;font-size:13px!important;letter-spacing:.8px}.vh-stat{padding:0 8px}.vh-stat strong{font-size:29px}.vh-stat span{font-size:10px;letter-spacing:1.5px}
  .vh-hero-visual{height:590px}.vh-hero-photo{width:calc(100% - 28px)}.vh-flag-rail{width:28px}.vh-feed-panel{left:13px;right:42px;bottom:14px;height:164px;padding:8px}
  .vh-drop-card{padding-left:8px;padding-right:8px}.vh-drop-author b{font-size:11px}.vh-drop-title{font-size:10px}.vh-drop-card p{font-size:9px}.vh-drop-empty-card{padding:5px 8px}.vh-drop-empty-card>b{font-size:12px}.vh-drop-empty-card>small{font-size:9px}
  .vh-feature{gap:13px;padding:20px 16px}.vh-feature-icon{flex-basis:34px;font-size:31px}.vh-feature-copy b{font-size:21px}.vh-feature-copy small{font-size:11px}
}
@media (max-width:900px){
  .vh-nav{height:66px;grid-template-columns:minmax(0,1fr) auto;padding:0 18px}.vh-nav:before,.vh-nav:after{display:none}.vh-brand{font-size:34px;letter-spacing:4px}.vh-menu{display:flex}
  .vh-nav-links{display:none;position:absolute;top:66px;left:0;right:0;padding:12px 20px 18px;border-bottom:2px solid var(--ink);background:var(--paper);align-items:stretch;flex-direction:column;gap:0}
  .vh-nav-links-open{display:flex}.vh-nav-links button{padding:13px 0;border-bottom:1px solid #d2ccc1;text-align:left;font-size:15px}.vh-nav-links button:after{display:none}
  .vh-nav-actions{gap:7px}.vh-login,.vh-join{height:38px;min-width:0;padding:0 12px;font-size:13px!important}
  .vh-hero{height:auto;min-height:0;display:flex;flex-direction:column}.vh-hero-copy{width:100%;height:auto;min-height:0;padding:30px clamp(20px,5vw,46px) 23px}
  .vh-hero h1{font-size:clamp(76px,13vw,112px);line-height:.82;letter-spacing:-1.1px}.vh-hero-lede{margin-top:9px;font-size:16px}.vh-hero-actions{max-width:490px;gap:12px;margin-top:20px}
  .vh-primary,.vh-secondary{min-height:50px;font-size:15px!important}.vh-stats{margin-top:24px;padding-top:14px}.vh-stat strong{font-size:31px}
  .vh-hero-visual{height:auto;min-height:0;padding:0 0 14px;overflow:visible}.vh-hero-photo{position:relative;width:100%;height:auto;aspect-ratio:840 / 360;object-fit:contain}
  .vh-flag-rail{width:12px;top:0;bottom:0}.vh-feed-panel{position:relative;left:auto;right:auto;bottom:auto;width:calc(100% - 24px);height:auto;min-height:150px;margin:-1px 12px 0;padding:9px 10px}
  .vh-feed-head{min-height:24px}.vh-feed-head>span{font-size:13px}.vh-feed-grid{grid-template-columns:1fr}
  .vh-drop-card{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto auto;gap:5px 8px;padding:8px 3px;border-right:0;border-bottom:1px solid rgba(255,255,255,.24)}.vh-drop-card:last-child{border-bottom:0}
  .vh-drop-card-top{grid-column:1/3}.vh-drop-title{grid-column:1;margin:0;font-size:11px}.vh-drop-card p{display:none}.vh-drop-tags{grid-column:2;grid-row:2;justify-content:flex-end;align-items:start}
  .vh-drop-empty-card{min-height:90px;padding:9px 3px;border-right:0;border-bottom:1px solid rgba(255,255,255,.24)}.vh-drop-empty-card:last-child{border-bottom:0}.vh-drop-empty-card>small{max-width:none}
  .vh-ticker{min-height:46px;justify-content:flex-start;overflow:hidden;white-space:nowrap;gap:14px;padding:10px 17px;font-size:14px;letter-spacing:1.7px}.vh-ticker span,.vh-ticker b{flex-shrink:0}
  .vh-feature-row{grid-template-columns:1fr}.vh-feature{min-height:112px;padding:20px 22px;border-right:0;border-bottom:2px solid var(--ink);gap:18px}.vh-feature:last-child{border-bottom:0}
  .vh-feature-icon{flex-basis:42px;font-size:35px}.vh-feature-divider{height:58px}.vh-feature-copy b{font-size:23px}.vh-feature-copy small{font-size:12px}
  .vh-section{padding:42px 20px}.vh-section-heading{align-items:flex-start;flex-direction:column;gap:12px}.vh-section-heading h2{font-size:40px}
  .vh-chapter-grid{grid-template-columns:1fr 1fr}.vh-chapter{padding:18px 13px;border-bottom:2px solid var(--ink)}.vh-chapter:nth-child(2){border-right:0}.vh-chapter:nth-child(3),.vh-chapter:nth-child(4){border-bottom:0}.vh-chapter>strong{font-size:17px}.vh-chapter>small{font-size:11px;min-height:52px}
  .vh-ranks-section{padding:42px 20px}.vh-rank-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.vh-rank{min-height:160px;padding:18px 9px}.vh-rank:last-child{grid-column:1/-1}
  .vh-marketplace{grid-template-columns:1fr}.vh-market-panel{padding:38px 22px}.vh-investors{border-right:0;border-bottom:2px solid var(--ink)}.vh-market-panel h2{font-size:49px}
  .vh-closing{padding:58px 18px}.vh-closing h2{font-size:clamp(42px,12vw,68px)}
  .vh-footer{padding:0 18px 16px}.vh-footer-spectrum{margin:0 -18px}.vh-footer-main{grid-template-columns:1fr 1fr;gap:30px 18px;padding:34px 0 28px}
  .vh-footer-brand-col{grid-column:1/-1;max-width:100%}.vh-footer-brand-col p{max-width:460px}.vh-footer-links{gap:12px}.vh-footer-links>b{font-size:11px;letter-spacing:1.7px}.vh-footer-links button{font-size:12px}
  .vh-footer-bottom{font-size:10px;letter-spacing:1px;flex-wrap:wrap;justify-content:space-between}.vh-footer-unity{order:3;width:100%;text-align:center;padding-top:4px}.vh-footer-bottom>button{padding:8px 9px;font-size:10px}
}
@media (max-width:480px){
  .vh-login{display:none}.vh-hero-copy{padding:27px 18px 20px}.vh-kicker{font-size:10px;letter-spacing:1.1px;padding:6px 9px;gap:7px}
  .vh-hero h1{font-size:clamp(72px,18vw,90px);line-height:.84;letter-spacing:-.8px}.vh-hero-lede{font-size:14px}.vh-hero-actions{grid-template-columns:1fr;gap:8px}
  .vh-primary,.vh-secondary{width:100%;min-height:46px}.vh-stat{padding:0 8px}.vh-stat strong{font-size:27px}.vh-stat span{font-size:8px;letter-spacing:1.2px}
  .vh-ticker{font-size:12px;gap:10px}.vh-feature{padding:17px 16px;gap:14px}.vh-feature-copy b{font-size:20px}
  .vh-section-heading h2{font-size:34px}.vh-chapter-grid{grid-template-columns:1fr}.vh-chapter{border-right:0;border-bottom:2px solid var(--ink)!important}.vh-chapter:last-child{border-bottom:0!important}
  .vh-rank-grid{grid-template-columns:1fr 1fr}.vh-market-panel h2{font-size:43px}.vh-footer-main{gap:26px 14px}.vh-footer-bottom{justify-content:center;text-align:center}.vh-footer-unity{order:0;width:auto}
}
@media (prefers-reduced-motion:reduce){.vh *, .vh *:before, .vh *:after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
`;