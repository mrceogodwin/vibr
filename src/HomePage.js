import { useRef, useState } from "react";

const ORANGE = "#FE6313";

const PROJECTS = [
  { name: "TalkAI", kind: "AI Tool", group: "AI Tools", blurb: "African voice AI for local languages.", by: "African Builders", likes: "1.2k", art: "/home/talkai.jpg" },
  { name: "FarmStack", kind: "SaaS", group: "SaaS", blurb: "Digital tools for modern African farmers.", by: "AgriTech Labs", likes: "856", art: "/home/farm.jpg" },
  { name: "StreamNaija", kind: "Platform", group: "Platforms", blurb: "A home for African creators and shows.", by: "Naija Creators", likes: "2.4k", art: "/home/stream.jpg" },
];
const FILTERS = ["Featured", "AI Tools", "Apps", "SaaS", "Platforms", "Games", "Open Source"];
const BUILDERS = [
  { name: "Tunde A.", role: "Product Builder", blurb: "Building tools for African creators.", projects: "2 Projects", people: "4.2k", photo: "/home/tunde.jpg" },
  { name: "Amaka O.", role: "AI Engineer", blurb: "Applying AI to real African problems.", projects: "3 Projects", people: "3.7k", photo: "/home/amaka.jpg" },
  { name: "Daniel K.", role: "Founder", blurb: "Building the next generation of fintech tools.", projects: "1 Project", people: "5.1k", photo: "/home/daniel.jpg" },
  { name: "Zainab M.", role: "Full-Stack Dev", blurb: "Creating simple solutions for everyday businesses.", projects: "4 Projects", people: "2.9k", photo: "/home/zainab.jpg" },
];

function Logo({ onClick }) {
  return (
    <button className="vh-logo" onClick={onClick} aria-label="VIBR home">
      <span className="vh-word"><span>V</span>IBR<i>.</i></span>
      <span className="vh-tag">CONNECT <b>•</b> DISCOVER <b>•</b> BUILD</span>
    </button>
  );
}

function Icon({ d, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Social({ name }) {
  const props = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (name === "X") return <svg {...props}><path d="M6 6l12 12M18 6L6 18" /></svg>;
  if (name === "YouTube") return <svg {...props}><rect x="3" y="6" width="18" height="12" rx="3" /><path d="M11 10.2l4.5 1.8-4.5 1.8v-3.6z" /></svg>;
  if (name === "Instagram") return <svg {...props}><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.5" /><circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" /></svg>;
  if (name === "LinkedIn") return <svg {...props}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 11v6M8 7.5v.5M12 17v-4a2 2 0 0 1 4 0v4" /></svg>;
  return <svg {...props}><path d="M9 8.5c1.2-2.2 3.2-3.4 5.2-2.6 1.2.5 2 1.6 2.2 2.8.6-.4 1.5-.5 2.2-.1.9.5 1.2 1.6.8 2.6-.3.8-1 1.3-1.4 1.8.4 2.2-.6 4.2-2.6 5.2-2.4 1.2-5 .4-6.2-1.6-.4 1.4-1.6 2.4-3.2 2.4" /></svg>;
}

const I = {
  search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4.3-4.3",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  arrow: "M5 12h14M13 6l6 6-6 6",
  chev: "M6 9l6 6 6-6",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  briefcase: "M10 6V4h4v2M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9zM3 13h18",
  layers: "M12 2l9 5-9 5L3 7l9-5zM3 12l9 5 9-5M3 17l9 5 9-5",
  bolt: "M13 2L3 14h8l-1 8 10-12h-8l1-8z",
  heart: "M20.8 8.6a5.2 5.2 0 0 0-8.8-3.1A5.2 5.2 0 0 0 3.2 8.6c0 6 8.8 11 8.8 11s8.8-5 8.8-11z",
  code: "M8 8l-4 4 4 4M16 8l4 4-4 4",
  check: "M20 6L9 17l-5-5",
};

export default function LandingPage({ navigate }) {
  const [filter, setFilter] = useState("Featured");
  const [menu, setMenu] = useState(false);
  const [vibe, setVibe] = useState(false);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const rail = useRef(null);
  const missing = (label) => setNote(label + " is not a page in the app yet.");
  const go = (page) => { setMenu(false); setVibe(false); navigate(page); };
  const scrollTo = (id) => {
    setMenu(false); setVibe(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const search = (event) => {
    event.preventDefault();
    const q = query.trim();
    if (q) {
      try { sessionStorage.setItem("vibr-search-q", q); } catch (e) {}
    }
    go("search");
  };
  const shown = PROJECTS.filter((p) => filter === "Featured" || p.group === filter);
  const nudge = (dir) => {
    const el = rail.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <div className="vh" id="main-content">
      <style>{CSS}</style>
      <header className="vh-nav">
        <Logo onClick={() => go("landing")} />
        <nav className={"vh-links" + (menu ? " open" : "")} aria-label="Homepage">
          <button onClick={() => scrollTo("discover")}>Discover</button>
          <button onClick={() => scrollTo("builders")}>Builders</button>
          <button onClick={() => go("feed")}>Projects</button>
          <button onClick={() => scrollTo("opportunities")}>Opportunities</button>
          <div className={"vh-drop" + (vibe ? " open" : "")}>
            <button aria-expanded={vibe} onClick={() => setVibe((v) => !v)}>For Vibe Coders <Icon d={I.chev} size={14} /></button>
            <div className="vh-drop-menu">
              <button onClick={() => go("drop")}>Submit a Project</button>
              <button onClick={() => go("collabs")}>Collaborate</button>
              <button onClick={() => go("hackathons")}>Hackathons</button>
              <button onClick={() => go("community")}>Community</button>
            </div>
          </div>
        </nav>
        <div className="vh-nav-actions">
          <button className="vh-ghost" onClick={() => go("account-login")}>Sign in</button>
          <button className="vh-solid" onClick={() => go("account-signup")}>Join VIBR <Icon d={I.arrow} size={16} /></button>
          <button className="vh-burger" aria-label="Menu" onClick={() => setMenu((m) => !m)}><span /><span /><span /></button>
        </div>
      </header>
      {note && <div className="vh-note" role="status">{note} <button onClick={() => setNote("")}>Close</button></div>}

      <section className="vh-hero" aria-label="Built for Africa's Vibe Coders">
        <div className="vh-hero-copy">
          <div className="vh-eye"><i>/</i> AFRICA'S VIBE-CODING MOVEMENT</div>
          <h1>Built for Africa’s<br /><span>Vibe Coders.</span></h1>
          <p>Where AI builders, developers and creative minds connect, discover projects and build the future together.</p>
          <div className="vh-row">
            <button className="vh-solid" onClick={() => go("feed")}>Explore Projects <Icon d={I.arrow} size={16} /></button>
            <button className="vh-ghost" onClick={() => go("account-signup")}><Icon d={I.users} size={16} /> Join the Community</button>
          </div>
          <form className="vh-search" onSubmit={search}>
            <Icon d={I.search} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search builders, projects and AI tools..." aria-label="Search builders, projects and AI tools" />
          </form>
        </div>
      </section>

      <section className="vh-section" id="discover">
        <div className="vh-discover">
          <div>
            <div className="vh-eye"><i>/</i> DISCOVER PROJECTS</div>
            <h2>Explore what<br />Africa’s builders<br /><span>are creating.</span></h2>
            <p>Real projects, AI tools and startups built by Africa's vibe-coding generation.</p>
            <button className="vh-ghost" onClick={() => go("feed")}>Browse All Projects <Icon d={I.arrow} size={16} /></button>
          </div>
          <div>
            <div className="vh-filters">
              <div className="vh-pills" role="tablist">
                {FILTERS.map((name) => (
                  <button key={name} role="tab" aria-selected={filter === name} className={filter === name ? "on" : ""} onClick={() => setFilter(name)}>{name}</button>
                ))}
              </div>
              <div className="vh-arrows">
                <button aria-label="Previous projects" onClick={() => nudge(-1)}>‹</button>
                <button aria-label="Next projects" onClick={() => nudge(1)}>›</button>
              </div>
            </div>
            <div className="vh-rail" ref={rail}>
              {shown.map((project) => (
                <article key={project.name} className="vh-card" onClick={() => go("feed")}>
                  <div className="vh-art" style={{ backgroundImage: "url(" + project.art + ")" }}>
                    <span>{project.kind}</span>
                  </div>
                  <div className="vh-card-body">
                    <h3>{project.name}</h3>
                    <p>{project.blurb}</p>
                    <div className="vh-meta"><span className="vh-by"><i /><i /><i /> By {project.by}</span><span className="vh-like"><Icon d={I.heart} size={14} /> {project.likes}</span></div>
                  </div>
                </article>
              ))}
              {shown.length === 0 && (
                <div className="vh-empty">Nothing in {filter} yet. Browse all projects to see what is live.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="vh-section" id="builders">
        <div className="vh-banner vh-builders-banner">
          <div className="vh-banner-copy">
            <div className="vh-eye"><i>/</i> MEET THE BUILDERS</div>
            <h2>The people building<br />Africa’s <span>next big things.</span></h2>
            <p>Developers, founders, AI builders and creators turning ideas into real products across Africa.</p>
            <button className="vh-solid" onClick={() => go("leaderboard")}>Explore Builders <Icon d={I.arrow} size={16} /></button>
          </div>
        </div>
        <div className="vh-split-head">
          <h3>Featured Builders</h3>
          <button onClick={() => go("leaderboard")}>View All Builders <Icon d={I.arrow} size={16} /></button>
        </div>
        <div className="vh-builder-grid">
          {BUILDERS.map((person) => (
            <article key={person.name} className="vh-person" onClick={() => go("leaderboard")}>
              <div className="vh-person-top">
                <img src={person.photo} alt={person.name} />
                <div>
                  <strong>{person.name} <em><Icon d={I.check} size={11} /></em></strong>
                  <span>{person.role}</span>
                </div>
              </div>
              <p>{person.blurb}</p>
              <div className="vh-pills-row">
                <span><Icon d={I.layers} size={14} /> {person.projects}</span>
                <span><Icon d={I.users} size={14} /> {person.people}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="vh-section" id="opportunities">
        <div className="vh-banner vh-opps-banner">
          <div className="vh-banner-copy">
            <div className="vh-eye"><i>/</i> OPPORTUNITIES & COLLABORATION</div>
            <h2>Build, collaborate<br />and <span>grow together.</span></h2>
            <p>Find hackathons, team up on ideas, get tech jobs, and access funding to take your projects further.</p>
            <button className="vh-solid" onClick={() => scrollTo("opp-cards")}>Explore Opportunities <Icon d={I.arrow} size={16} /></button>
          </div>
        </div>
        <div className="vh-opp-grid" id="opp-cards">
          <article className="vh-opp">
            <div>
              <span className="vh-ico"><Icon d={I.calendar} /></span>
              <h3>Hackathons</h3>
              <p>Join build challenges, ship ideas and win rewards.</p>
              <button onClick={() => go("hackathons")}>View Hackathons <Icon d={I.arrow} size={15} /></button>
            </div>
            <img src="/home/hack-obj.jpg" alt="" />
          </article>
          <article className="vh-opp">
            <div>
              <span className="vh-ico"><Icon d={I.users} /></span>
              <h3>Collaborate</h3>
              <p>Find co-founders, join teams or contribute to projects.</p>
              <button onClick={() => go("collabs")}>Find Teams <Icon d={I.arrow} size={15} /></button>
            </div>
            <img src="/home/collab-obj.jpg" alt="" />
          </article>
          <article className="vh-opp">
            <div>
              <span className="vh-ico"><Icon d={I.briefcase} /></span>
              <h3>Tech Jobs</h3>
              <p>Discover roles at startups and tech companies in Africa.</p>
              <button onClick={() => go("bounties")}>Browse Jobs <Icon d={I.arrow} size={15} /></button>
            </div>
            <img src="/home/jobs-obj.jpg" alt="" />
          </article>
          <article className="vh-opp">
            <div>
              <span className="vh-ico"><Icon d={I.layers} /></span>
              <h3>Funding</h3>
              <p>Access grants, investment opportunities and support for your project.</p>
              <button onClick={() => missing("A funding directory")}>Explore Funding <Icon d={I.arrow} size={15} /></button>
            </div>
            <img src="/home/fund-obj.jpg" alt="" />
          </article>
        </div>
        <div className="vh-share">
          <div>
            <h3><Icon d={I.bolt} /> Have an opportunity to share?</h3>
            <p>Post your hackathon, job, funding opportunity or collaboration call on VIBR.</p>
          </div>
          <button className="vh-ghost" onClick={() => go("bounties")}>Create an Opportunity <Icon d={I.arrow} size={16} /></button>
        </div>
      </section>

      <section className="vh-close" id="vibecoders">
        <h2>Your next build <span>starts here.</span></h2>
        <p>Meet your people. Find your next idea. Build something worth sharing.</p>
        <div className="vh-row center">
          <button className="vh-solid" onClick={() => go("account-signup")}>Join VIBR <Icon d={I.arrow} size={16} /></button>
          <button className="vh-ghost" onClick={() => go("community")}>Explore the community</button>
        </div>
        <div className="vh-jump">
          <button onClick={() => go("leaderboard")}><Icon d={I.code} /> Builders</button>
          <button onClick={() => go("feed")}><Icon d={I.layers} /> Projects</button>
          <button onClick={() => go("collabs")}><Icon d={I.users} /> Collaborations</button>
        </div>
        <footer>
          <div className="vh-foot">
            <div>
              <Logo onClick={() => scrollTo("main-content")} />
              <p>Africa's vibe-coding community for builders, creators and innovators turning ideas into real products.</p>
            </div>
            <div>
              <b>Explore</b>
              <button onClick={() => scrollTo("discover")}>Discover</button>
              <button onClick={() => go("leaderboard")}>Builders</button>
              <button onClick={() => go("feed")}>Projects</button>
            </div>
            <div>
              <b>Build</b>
              <button onClick={() => go("collabs")}>Collaborate</button>
              <button onClick={() => scrollTo("opportunities")}>Opportunities</button>
              <button onClick={() => go("drop")}>Submit a Project</button>
            </div>
            <div>
              <b>VIBR</b>
              <button onClick={() => missing("About")}>About</button>
              <button onClick={() => missing("Contact")}>Contact</button>
              <button onClick={() => missing("Community Guidelines")}>Community Guidelines</button>
            </div>
          </div>
          <div className="vh-legal">
            <div className="vh-social">
              {["X", "YouTube", "Instagram", "LinkedIn", "TikTok"].map((name) => (
                <button key={name} aria-label={name} onClick={() => missing(name)}><Social name={name} /></button>
              ))}
            </div>
            <span>© 2026 VIBR. All Rights Reserved.</span>
          </div>
        </footer>
        <div className="vh-crowd" role="img" aria-label="African builders walking together" />
      </section>
    </div>
  );
}

const CSS = `
.vh{background:#050505;color:#fff;min-height:100vh;font-family:"Plus Jakarta Sans",Inter,sans-serif;overflow-x:hidden;}
.vh-note{margin:0;padding:12px 40px;background:#1a100c;color:#ffd7c2;display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #3a2418;}
.vh-note button{background:none;border:0;color:#fff;cursor:pointer;font-weight:700;}
.vh button,.vh input{font-family:inherit;}
.vh-logo{background:none;border:0;color:#fff;text-align:left;cursor:pointer;padding:0;}
.vh-word{display:block;font-weight:800;font-size:34px;letter-spacing:-1.5px;line-height:.9;}
.vh-word span,.vh-word i{color:${ORANGE};font-style:normal;}
.vh-tag{display:block;margin-top:6px;font-size:9px;letter-spacing:1.6px;color:#ddd;font-weight:700;}
.vh-tag b{color:${ORANGE};font-weight:800;}
.vh-nav{height:84px;padding:0 40px;display:flex;align-items:center;justify-content:space-between;gap:22px;position:sticky;top:0;z-index:40;background:#050505;border-bottom:1px solid #1c1c1c;}
.vh-links{display:flex;align-items:center;gap:26px;}
.vh-links > button,.vh-drop > button{background:none;border:0;color:#f3f3f3;font-weight:600;font-size:15px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;}
.vh-links > button:hover,.vh-drop > button:hover{color:#fff;}
.vh-drop{position:relative;}
.vh-drop-menu{display:none;position:absolute;top:34px;left:0;min-width:190px;background:#111;border:1px solid #2c2c2c;border-radius:12px;padding:8px;z-index:5;}
.vh-drop.open .vh-drop-menu{display:flex;flex-direction:column;}
.vh-drop-menu button{background:none;border:0;color:#eee;text-align:left;padding:10px 12px;border-radius:8px;cursor:pointer;font-weight:600;}
.vh-drop-menu button:hover{background:#1c1c1c;}
.vh-nav-actions{display:flex;align-items:center;gap:10px;}
.vh-solid,.vh-ghost{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;padding:12px 18px;font-weight:700;font-size:15px;cursor:pointer;transition:transform .15s,background .15s,border-color .15s;}
.vh-solid{background:${ORANGE};color:#fff;border:1px solid ${ORANGE};}
.vh-solid:hover{transform:translateY(-1px);background:#ff7a33;}
.vh-ghost{background:transparent;color:#fff;border:1px solid #d7d7d7;}
.vh-ghost:hover{border-color:#fff;background:#161616;}
.vh-burger{display:none;width:42px;height:42px;border-radius:10px;border:1px solid #333;background:#111;flex-direction:column;justify-content:center;align-items:center;gap:5px;cursor:pointer;}
.vh-burger span{display:block;width:16px;height:1.5px;background:#fff;}
.vh-hero{min-height:680px;background:#050505 url("/home/hero.jpg") center center / cover no-repeat;display:flex;align-items:center;}
.vh-hero-copy{width:min(620px,46%);min-height:680px;display:flex;flex-direction:column;justify-content:center;padding:48px 16px 48px 64px;background:linear-gradient(90deg,#050505 0%,#050505 78%,rgba(5,5,5,.45) 92%,rgba(5,5,5,0) 100%);}
.vh-eye{color:${ORANGE};font-weight:800;letter-spacing:1.3px;font-size:13px;margin-bottom:16px;display:flex;align-items:center;gap:8px;}
.vh-eye i{font-style:normal;}
.vh h1,.vh h2{margin:0 0 16px;font-weight:800;letter-spacing:-1.8px;line-height:.98;}
.vh h1{font-size:clamp(48px,5.4vw,78px);}
.vh h2{font-size:clamp(34px,3.4vw,54px);}
.vh h1 span,.vh h2 span{color:${ORANGE};}
.vh-hero-copy p,.vh-banner-copy p,.vh-discover p{color:#cfcfcf;font-size:17px;line-height:1.55;max-width:520px;margin:0 0 22px;}
.vh-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:22px;}
.vh-row.center{justify-content:center;}
.vh-search{display:flex;align-items:center;gap:10px;max-width:520px;border:1px solid #8d8d8d;background:#141414;border-radius:14px;padding:0 16px;color:#9a9a9a;}
.vh-search input{flex:1;background:transparent;border:0;color:#fff;padding:15px 0;font-size:15px;outline:none;}
.vh-section{padding:54px 40px 28px;border-top:1px solid #171717;}
.vh-discover{display:grid;grid-template-columns:minmax(260px,.78fr) 1.7fr;gap:34px;align-items:start;}
.vh-filters{display:flex;justify-content:flex-end;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;}
.vh-pills{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;}
.vh-pills button{background:transparent;color:#eee;border:1px solid transparent;border-radius:999px;padding:8px 14px;cursor:pointer;font-weight:700;}
.vh-pills button.on{color:${ORANGE};border-color:${ORANGE};background:rgba(254,99,19,.08);}
.vh-arrows{display:flex;gap:8px;}
.vh-arrows button{width:36px;height:36px;border-radius:50%;border:0;cursor:pointer;font-size:20px;background:#2a2a2a;color:#fff;}
.vh-arrows button:last-child{background:${ORANGE};}
.vh-rail{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(250px,1fr);gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px;}
.vh-rail::-webkit-scrollbar{height:0;}
.vh-card{background:#121212;border:1px solid #2a2a2a;border-radius:18px;overflow:hidden;cursor:pointer;scroll-snap-align:start;min-width:0;transition:border-color .15s,transform .15s;}
.vh-card:hover{border-color:${ORANGE};transform:translateY(-3px);}
.vh-art{height:168px;background-size:cover;background-position:center top;position:relative;}
.vh-art span{position:absolute;top:12px;right:12px;background:rgba(20,20,20,.72);border:1px solid #444;color:#eee;border-radius:999px;padding:4px 10px;font-size:12px;}
.vh-card-body{padding:16px 16px 14px;}
.vh-card-body h3{margin:0 0 6px;font-size:18px;}
.vh-card-body p{margin:0 0 14px;color:#bdbdbd;font-size:14px;min-height:40px;}
.vh-meta{display:flex;justify-content:space-between;align-items:center;color:#ddd;font-size:13px;}
.vh-by{display:inline-flex;align-items:center;gap:6px;}
.vh-by i{width:16px;height:16px;border-radius:50%;background:#3a3a3a;display:inline-block;margin-right:-8px;border:1px solid #111;}
.vh-like{display:inline-flex;align-items:center;gap:5px;color:#ff8d8d;}
.vh-empty{grid-column:1/-1;border:1px dashed #333;border-radius:16px;padding:28px;color:#aaa;}
.vh-banner{min-height:380px;overflow:hidden;display:flex;align-items:center;background:#050505 center / cover no-repeat;margin:0 -40px 28px;padding:0 40px;}
.vh-builders-banner{background-image:url("/home/builders-banner.jpg");}
.vh-opps-banner{background-image:url("/home/opps-banner.jpg");}
.vh-banner-copy{width:min(520px,44%);padding:36px 12px 36px 24px;}
.vh-split-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:6px 0 16px;}
.vh-split-head h3{margin:0;font-size:28px;font-weight:800;}
.vh-split-head button,.vh-jump button,.vh-foot button,.vh-legal button{background:none;border:0;color:#fff;cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:8px;}
.vh-builder-grid,.vh-opp-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;}
.vh-person{background:#121212;border:1px solid #2c2c2c;border-radius:18px;padding:16px;cursor:pointer;transition:border-color .15s;}
.vh-person:hover{border-color:${ORANGE};}
.vh-person-top{display:flex;gap:12px;align-items:center;margin-bottom:12px;}
.vh-person img{width:74px;height:74px;object-fit:cover;object-position:center 18%;border-radius:14px;background:#222;}
.vh-person strong{display:flex;align-items:center;gap:6px;font-size:18px;}
.vh-person em{width:16px;height:16px;border-radius:50%;background:${ORANGE};color:#fff;display:inline-flex;align-items:center;justify-content:center;}
.vh-person span{display:block;color:#a7a7a7;font-size:13px;margin-top:2px;}
.vh-person p{color:#ddd;font-size:14px;line-height:1.45;min-height:42px;margin:0 0 14px;}
.vh-pills-row{display:flex;gap:8px;flex-wrap:wrap;}
.vh-pills-row span{display:inline-flex;align-items:center;gap:6px;border:1px solid #333;border-radius:999px;padding:6px 10px;color:#ddd;font-size:12px;}
.vh-opp{position:relative;overflow:hidden;min-height:230px;border:1px solid #2e2e2e;border-radius:18px;background:#101010;padding:20px;}
.vh-opp img{position:absolute;right:0;top:0;height:100%;width:48%;object-fit:cover;object-position:center right;}
.vh-opp div{position:relative;z-index:1;max-width:58%;}
.vh-ico{width:34px;height:34px;border-radius:10px;border:1px solid ${ORANGE};color:${ORANGE};display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px;}
.vh-opp h3{margin:0 0 8px;font-size:24px;}
.vh-opp p{margin:0 0 18px;color:#cfcfcf;font-size:14px;line-height:1.45;}
.vh-opp button{background:none;border:0;color:#fff;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;padding:0;}
.vh-share{margin-top:18px;border:1px solid #343434;border-radius:16px;padding:18px 20px;display:flex;justify-content:space-between;align-items:center;gap:16px;}
.vh-share h3{margin:0 0 4px;display:flex;align-items:center;gap:8px;font-size:22px;}
.vh-share h3 svg{color:${ORANGE};}
.vh-share p{margin:0;color:#bdbdbd;}
.vh-close{padding:72px 40px 0;text-align:center;background:radial-gradient(120% 80% at 50% 0%,#2a1206 0%,#050505 48%);}
.vh-close h2{font-size:clamp(40px,5vw,68px);}
.vh-close > p{color:#ddd;font-size:18px;margin:0 0 22px;}
.vh-jump{display:flex;justify-content:center;gap:28px;border-top:1px solid #2a2a2a;border-bottom:1px solid #2a2a2a;padding:16px;margin-top:28px;}
.vh-foot{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:28px;text-align:left;padding:34px 8px 10px;}
.vh-foot p{color:#b5b5b5;max-width:280px;line-height:1.55;}
.vh-foot b{color:${ORANGE};display:block;margin-bottom:10px;}
.vh-foot button{display:block;color:#eee;font-weight:600;padding:6px 0;}
.vh-legal{display:flex;justify-content:space-between;align-items:center;gap:16px;border-top:1px solid #2a2a2a;margin-top:18px;padding:16px 8px 18px;color:#9a9a9a;font-size:13px;}
.vh-social{display:flex;gap:8px;}
.vh-social button{width:34px;height:34px;border-radius:10px;border:1px solid #3a3a3a;background:#111;color:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;}
.vh-crowd{height:280px;margin:0 -40px;background:linear-gradient(#050505,rgba(5,5,5,.15) 28%,rgba(5,5,5,0) 50%),url("/home/crowd.jpg") center 30% / cover no-repeat;}
@media(max-width:980px){
  .vh-nav{padding:0 16px;height:70px;}
  .vh-burger{display:flex;}
  .vh-links{display:none;position:absolute;top:70px;left:0;right:0;background:#0b0b0b;border-bottom:1px solid #222;padding:10px 16px 16px;flex-direction:column;align-items:stretch;gap:4px;}
  .vh-links.open{display:flex;}
  .vh-links > button,.vh-drop > button{padding:12px 4px;font-size:16px;}
  .vh-drop-menu{position:static;display:none;border:0;background:transparent;padding:0 0 0 8px;}
  .vh-hero{background:none;min-height:0;display:block;}
  .vh-hero-copy{width:100%;min-height:0;padding:32px 18px 28px;background:#050505;}
  .vh-hero::after{content:"";display:block;height:280px;background:url("/home/hero.jpg") 78% center / cover no-repeat;}
  .vh-section{padding:32px 16px 12px;}
  .vh-discover,.vh-builder-grid,.vh-opp-grid,.vh-foot{grid-template-columns:1fr;}
  .vh-banner{margin:0 -16px 20px;padding:0;min-height:0;display:block;background-image:none;}
  .vh-banner-copy{width:100%;padding:8px 18px 18px;background:#050505;}
  .vh-builders-banner::after,.vh-opps-banner::after{content:"";display:block;height:230px;background-position:right center;background-size:cover;}
  .vh-builders-banner::after{background-image:url("/home/builders-banner.jpg");}
  .vh-opps-banner::after{background-image:url("/home/opps-banner.jpg");}
  .vh-filters{justify-content:flex-start;}
  .vh-pills{justify-content:flex-start;}
  .vh-rail{grid-auto-columns:86%;}
  .vh-opp div{max-width:70%;}
  .vh-share{flex-direction:column;align-items:flex-start;}
  .vh-close{padding:48px 16px 0;}
  .vh-jump{flex-direction:column;gap:12px;}
  .vh-legal{flex-direction:column;align-items:flex-start;}
  .vh-crowd{margin:0 -16px;height:210px;}
  .vh h1{font-size:44px;}
}
`;
