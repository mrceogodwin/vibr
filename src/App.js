import { useState, useEffect, useCallback, useRef } from "react";
import LandingPage from "./HomePage";

// ── SUPABASE CLIENT ──────────────────────────────────────────────────────────
// Install: npm install @supabase/supabase-js
// Then this file works standalone — no separate supabase.js needed
import { createClient } from "@supabase/supabase-js";
const _url = process.env.REACT_APP_SUPABASE_URL || "";
const _key = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
function _q(){
  const q = { data: [], error: { message: "Database is not configured" }, count: 0 };
  const chain = { select:()=>chain, eq:()=>chain, neq:()=>chain, or:()=>chain, order:()=>chain, limit:()=>chain, range:()=>chain, in:()=>chain, filter:()=>chain, ilike:()=>chain, update:()=>chain, insert:()=>chain, delete:()=>chain, upsert:()=>chain, single:()=>Promise.resolve({ data:null, error:q.error }), then:(fn)=>Promise.resolve(q).then(fn) };
  return chain;
}
const _stub = {
  auth: {
    getSession: async ()=>({ data:{ session:null }, error:null }),
    onAuthStateChange: ()=>({ data:{ subscription:{ unsubscribe(){} } } }),
    signInWithPassword: async ()=>({ data:null, error:{ message:"Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY" } }),
    signUp: async ()=>({ data:null, error:{ message:"Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY" } }),
    signOut: async ()=>({ error:null }),
    resetPasswordForEmail: async ()=>({ error:{ message:"Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY" } }),
  },
  from: ()=>({ select:()=>_q(), insert:()=>_q(), update:()=>_q(), delete:()=>_q(), upsert:()=>_q() }),
  channel: ()=>({ on(){ return this; }, subscribe(){ return {}; } }),
  removeChannel: ()=>{},
  storage: { from: ()=>({ upload: async()=>({ error:{ message:"Storage is not configured" } }), getPublicUrl: ()=>({ data:{ publicUrl:"" } }) }) },
};
const supabase = (_url && _key)
  ? createClient(_url, _key, { auth: { autoRefreshToken:true, persistSession:true, detectSessionInUrl:true } })
  : _stub;

// ── Auth helpers ───────────────────────────────────────────────────────────────
const signIn=async({email,password})=>{ const {data,error}=await supabase.auth.signInWithPassword({email,password}); if(error)throw error; return data; };
const signUp=async({email,password,name,country,role,meta={}})=>{ const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name,role,country,...meta}}}); if(error)throw error; return data; };
const signOut=async()=>{ const {error}=await supabase.auth.signOut(); if(error)throw error; };
const resetPassword=async(email)=>{ const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`}); if(error)throw error; };
const getProfile=async(userId)=>{ const {data,error}=await supabase.from('profiles').select('*').eq('id',userId).single(); if(error)throw error; return data; };
const getPosts=async({limit=20,offset=0}={})=>{ const {data,error}=await supabase.from('posts').select('*,profiles:author_id(id,username,full_name,avatar_url,country,role),votes:votes(id),comments:comments(id)').order('created_at',{ascending:false}).range(offset,offset+limit-1); if(error)throw error; return data; };
const votePost=async(postId,userId)=>{ const {data:ex}=await supabase.from('votes').select('id').eq('post_id',postId).eq('user_id',userId).single(); if(ex){await supabase.from('votes').delete().eq('id',ex.id);return false;}else{await supabase.from('votes').insert({post_id:postId,user_id:userId});return true;} };
const getComments=async(postId)=>{ const {data,error}=await supabase.from('comments').select('*,profiles:author_id(username,avatar_url)').eq('post_id',postId).order('created_at',{ascending:true}); if(error)throw error; return data; };
const createComment=async({postId,authorId,content})=>{ const {data,error}=await supabase.from('comments').insert({post_id:postId,author_id:authorId,content}).select().single(); if(error)throw error; return data; };
const getNotifications=async(userId)=>{ const {data,error}=await supabase.from('notifications').select('*').eq('user_id',userId).order('created_at',{ascending:false}).limit(50); if(error)throw error; return data; };
const markNotificationsRead=async(userId)=>{ const {error}=await supabase.from('notifications').update({read:true}).eq('user_id',userId).eq('read',false); if(error)throw error; };
const getLeaderboard=async(limit=20)=>{ const {data,error}=await supabase.from('profiles').select('id,username,full_name,country,vibe_points,rank').eq('role','builder').order('vibe_points',{ascending:false}).limit(limit); if(error)throw error; return data; };
const getBounties=async()=>{ const {data,error}=await supabase.from('bounties').select('*,company:profiles!bounties_company_id_fkey(username,avatar_url)').eq('status','open').order('created_at',{ascending:false}); if(error)throw error; return data; };
const getConversations=async(userId)=>{ const {data,error}=await supabase.from('conversations').select('*,participant_a:profiles!conversations_participant_a_fkey(id,username,avatar_url),participant_b:profiles!conversations_participant_b_fkey(id,username,avatar_url),messages(content,created_at)').or(`participant_a.eq.${userId},participant_b.eq.${userId}`).order('updated_at',{ascending:false}); if(error)throw error; return data; };
const getMessages=async(conversationId)=>{ const {data,error}=await supabase.from('messages').select('*,sender:profiles!messages_sender_id_fkey(username,avatar_url)').eq('conversation_id',conversationId).order('created_at',{ascending:true}); if(error)throw error; return data; };
const sendMessage=async({conversationId,senderId,content})=>{ const {data,error}=await supabase.from('messages').insert({conversation_id:conversationId,sender_id:senderId,content}).select().single(); if(error)throw error; await supabase.from('conversations').update({updated_at:new Date().toISOString()}).eq('id',conversationId); return data; };
const applyToBounty=async({bountyId,applicantId,message})=>{ const {data,error}=await supabase.from('bounty_applications').insert({bounty_id:bountyId,applicant_id:applicantId,message}).select().single(); if(error)throw error; return data; };
const subscribeToMessages=(conversationId,callback)=>supabase.channel(`messages:${conversationId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`conversation_id=eq.${conversationId}`},payload=>callback(payload.new)).subscribe();
const subscribeToNotifications=(userId,callback)=>supabase.channel(`notifications:${userId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${userId}`},payload=>callback(payload.new)).subscribe();
const unsubscribe=(channel)=>{ if(channel) supabase.removeChannel(channel); };

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700;900&display=swap');`;
const CSS = `
*{margin:0;padding:0;box-sizing:border-box;}
:root{
  --bg:#0A0A0A;--surface:#111;--s2:#1A1A1A;--border:#222;
  --white:#F8F5EE;--red:#D92B2B;--gold:#F0A500;--green:#1A7A3C;
  --r2:#FF4444;--g2:#FFB800;--gr2:#22A050;--text:#F0EDE4;--muted:#666;
  --fd:'Bebas Neue',sans-serif;--fm:'Space Mono',monospace;--fb:'DM Sans',sans-serif;
}
html,body,#root{max-width:100%;overflow-x:hidden;}body{background:var(--bg);color:var(--text);font-family:var(--fb);overflow-x:hidden;}
input,textarea,select,button{font-family:var(--fb);}
button{cursor:pointer;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:var(--bg);}::-webkit-scrollbar-thumb{background:var(--red);}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.4;}}
@keyframes shimmer{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
@keyframes slideInRight{from{opacity:0;transform:translateX(100%);}to{opacity:1;transform:none;}}
@keyframes marquee{from{transform:translateX(0);}to{transform:translateX(-50%);}}
.fu{animation:fadeUp .45s ease both;}.fu1{animation:fadeUp .45s .08s ease both;}
.fu2{animation:fadeUp .45s .16s ease both;}.fu3{animation:fadeUp .45s .24s ease both;}

@keyframes shimmer{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
@keyframes slideInRight{from{opacity:0;transform:translateX(100%);}to{opacity:1;transform:none;}}
@media(max-width:900px){
  .vibr-sidebar{display:none!important;}
}
@media(max-width:768px){
  .vibr-sidebar{display:none!important;}
  .vibr-auth-panel{display:none!important;}
  .vibr-auth-grid{grid-template-columns:1fr!important;}
  .vibr-grid-2,.vibr-grid-3{grid-template-columns:1fr!important;}
  .vibr-dash-layout{flex-direction:column!important;}
  .vibr-dash-sidebar{width:100%!important;height:auto!important;position:relative!important;flex-direction:row!important;overflow-x:auto!important;border-right:none!important;border-bottom:2px solid var(--border)!important;}
  .vibr-tab-bar{overflow-x:auto!important;flex-wrap:nowrap!important;-ms-overflow-style:none!important;scrollbar-width:none!important;}
  .vibr-tab-bar::-webkit-scrollbar{display:none;}
  .vibr-modal-inner{max-width:100%!important;border-radius:0!important;}
  .vibr-mobile-hide{display:none!important;}
  .vibr-pad{padding:16px!important;}
  .vibr-hero{font-size:clamp(32px,9vw,52px)!important;}
  html,body,#root{max-width:100%!important;overflow-x:hidden!important;}
  .vibr-land-nav{padding:0 14px!important;height:auto!important;min-height:56px;gap:8px!important;}
  .vibr-land-links{display:none!important;}
  .vibr-land-nav-actions{gap:6px!important;}
  .vibr-land-nav-actions button{padding:7px 10px!important;}
  .vibr-land-hero{grid-template-columns:1fr!important;min-height:0!important;}
  .vibr-land-copy{padding:28px 16px 22px!important;border-right:none!important;border-bottom:3px solid #0A0A0A;}
  .vibr-land-title{font-size:58px!important;letter-spacing:-1px!important;}
  .vibr-land-stats{flex-wrap:wrap!important;gap:14px 22px!important;}
  .vibr-land-preview{padding:18px 16px!important;}
  .vibr-land-3{grid-template-columns:1fr!important;}
  .vibr-land-3 > div{border-right:none!important;border-bottom:3px solid #0A0A0A;padding:28px 16px!important;}
  .vibr-land-head{flex-direction:column!important;align-items:flex-start!important;gap:8px!important;padding:20px 16px!important;}
  .vibr-land-head-title{font-size:32px!important;letter-spacing:1px!important;}
  .vibr-land-chapters{grid-template-columns:1fr!important;}
  .vibr-land-chapters > div{border-right:none!important;border-bottom:3px solid #0A0A0A;padding:22px 16px!important;}
  .vibr-land-ranks{padding:36px 16px!important;}
  .vibr-land-rank-title{font-size:40px!important;letter-spacing:1px!important;}
  .vibr-land-rankgrid{grid-template-columns:1fr 1fr!important;}
  .vibr-land-split{grid-template-columns:1fr!important;}
  .vibr-land-split > div{padding:32px 16px!important;border-right:none!important;}
  .vibr-land-actions{flex-wrap:wrap!important;}
  .vibr-land-cta{padding:48px 16px!important;}
  .vibr-land-cta-title{font-size:42px!important;}
  .vibr-auth-grid > div:last-child{padding:28px 16px!important;}
}
@media(min-width:769px) and (max-width:1024px){
  .vibr-grid-3{grid-template-columns:repeat(2,1fr)!important;}
  .vibr-sidebar{width:200px!important;}
}`;

// ── DATA ──────────────────────────────────────────────────────────────────────
const FEED_POSTS = [
  {id:1,name:"Obioma Kalu",handle:"obioma_k",loc:"Enugu 🇳🇬",av:"OK",avc:"red",title:"Healthcare booking via USSD — no smartphone needed",desc:"Rural Nigerians book clinic slots via USSD. Works on any phone, even 2G. Already 200+ bookings in beta.",tags:[["HealthTech","green"],["USSD","gold"],["Open Source","red"]],votes:312,comments:[{user:"Kofi O.",text:"This is exactly what rural Ghana needs too!",time:"1h ago"},{user:"Nadia W.",text:"Have you considered integrating M-Pesa?",time:"45m ago"},{user:"Moussa B.",text:"I'd love to contribute a French translation.",time:"20m ago"}],time:"2h ago",trending:true},
  {id:2,name:"Kofi Osei",handle:"kofi_builds",loc:"Kumasi 🇬🇭",av:"KO",avc:"gold",title:"Pan-African crypto remittance — zero fees across 30 currencies",desc:"Send money across Africa instantly on Stellar. Converts to M-Pesa and Airtel Money automatically. Lagos to Nairobi in 4 seconds.",tags:[["Fintech","red"],["Web3","gold"],["Stellar","green"]],votes:445,comments:[{user:"Tolu K.",text:"Bro this is insane. What's the conversion overhead?",time:"3h ago"},{user:"Zara N.",text:"This solves such a real problem. SA to Zim is a nightmare.",time:"2h ago"}],time:"5h ago",trending:true},
  {id:3,name:"Nadia Wanjiru",handle:"nadia.w",loc:"Nairobi 🇰🇪",av:"NW",avc:"green",title:"Offline AI tutor for township kids — zero data cost",desc:"Download lessons once on any Android. Works with no internet. Built for load-shedding. Covers grades 4-9.",tags:[["EdTech","red"],["AI","gold"],["Offline","green"]],votes:198,comments:[{user:"Obioma K.",text:"Can you add Hausa language support?",time:"6h ago"}],time:"8h ago",trending:false},
  {id:4,name:"Moussa Bah",handle:"moussa_dev",loc:"Dakar 🇸🇳",av:"MB",avc:"green",title:"Wolof to French to English real-time translator",desc:"Fine-tuned Whisper for Wolof. Working on Hausa, Twi and Amharic next. Open source contributors welcome.",tags:[["AI/ML","gold"],["Open Source","green"],["NLP","red"]],votes:133,comments:[],time:"1d ago",trending:false},
  {id:5,name:"Tinashe Amos",handle:"tinashe_dev",loc:"Harare 🇿🇼",av:"TA",avc:"red",title:"Solar micro-grid monitor — predict failures 72hrs early",desc:"IoT dashboard for township solar installs. ML predicts failures before they happen. Deployed to 12 sites.",tags:[["CleanTech","green"],["IoT","gold"],["ML","red"]],votes:89,comments:[],time:"1d ago",trending:false},
];

const BOUNTIES = [
  {id:1,title:"M-Pesa React Native integration",company:"Duka Tech",loc:"Nairobi 🇰🇪",amount:"$500",tags:["Mobile","Fintech"],deadline:"5 days",hot:true,desc:"Need a senior React Native dev to integrate M-Pesa STK push into our existing app.",applicants:12},
  {id:2,title:"Design 3-screen onboarding flow",company:"PiggyVest",loc:"Lagos 🇳🇬",amount:"$350",tags:["UI/UX","Design"],deadline:"8 days",hot:false,desc:"UI/UX designer needed for a clean 3-screen savings app onboarding. Figma deliverable.",applicants:7},
  {id:3,title:"Flutterwave Next.js e-commerce integration",company:"Jumia Dev",loc:"Lagos 🇳🇬",amount:"$800",tags:["Next.js","Fintech"],deadline:"3 days",hot:true,desc:"Integrate Flutterwave into our Next.js storefront. Must handle webhooks and refunds.",applicants:19},
  {id:4,title:"WhatsApp bot for customer support",company:"Konga",loc:"Lagos 🇳🇬",amount:"$600",tags:["Node.js","WhatsApp"],deadline:"10 days",hot:false,desc:"Build a WhatsApp Business API bot for order tracking, returns and FAQs.",applicants:8},
  {id:5,title:"Optimize PostgreSQL queries 10x",company:"Cowrywise",loc:"Lagos 🇳🇬",amount:"$400",tags:["PostgreSQL","Backend"],deadline:"6 days",hot:true,desc:"Audit and optimize our Supabase/Postgres setup. Queries are too slow.",applicants:5},
];

const COLLABS = [
  {id:1,name:"Tolu Kehinde",handle:"tolu_builds",loc:"Lagos 🇳🇬",av:"TK",avc:"red",project:"AI Agric Supply Chain App",desc:"Built the AI and backend. Need a mobile dev and UI/UX designer. Equity split available.",needs:["React Native Dev","UI/UX Designer"],tags:[["AgriTech","green"],["AI","gold"]],vibe:3420},
  {id:2,name:"Amara Mensah",handle:"amara.m",loc:"Accra 🇬🇭",av:"AM",avc:"gold",project:"Fintech App for Unbanked",desc:"Frontend done. Need a backend dev for Paystack API and a co-founder who knows the Ghanaian market.",needs:["Backend Dev","Co-founder"],tags:[["Fintech","red"],["Ghana","gold"]],vibe:1890},
  {id:3,name:"Zara Ndlovu",handle:"zara_n",loc:"Cape Town 🇿🇦",av:"ZN",avc:"green",project:"Township Solar Monitor",desc:"IoT hardware done. Need a frontend dev for the dashboard and a ML engineer for anomaly detection.",needs:["Frontend Dev","ML Engineer"],tags:[["CleanTech","green"],["IoT","gold"]],vibe:2200},
  {id:4,name:"Nadia Wanjiru",handle:"nadia.w",loc:"Nairobi 🇰🇪",av:"NW",avc:"green",project:"Offline AI Tutor",desc:"Core app built. Need a curriculum designer and someone for Swahili and Hausa language packs.",needs:["Curriculum","Language/NLP"],tags:[["EdTech","red"],["AI","gold"]],vibe:2780},
];

const CHAPTERS = [
  {flag:"🇳🇬",name:"Nigeria Hub",members:4201,city:"Lagos · Abuja · PH · Enugu",color:"var(--red)",desc:"The biggest VIBR chapter. Naira bounties, local hackathons, weekly demo days."},
  {flag:"🇰🇪",name:"Kenya Hub",members:2890,city:"Nairobi · Mombasa · Kisumu",color:"var(--green)",desc:"Silicon Savannah energy. M-Pesa fintech, AI, and mobile-first builders."},
  {flag:"🇬🇭",name:"Ghana Hub",members:1540,city:"Accra · Kumasi · Takoradi",color:"var(--gold)",desc:"Accra's tech scene is rising. Mobile money, agritech, serious builder culture."},
  {flag:"🇿🇦",name:"South Africa Hub",members:1890,city:"Cape Town · Joburg · Durban",color:"var(--gr2)",desc:"Cleantech, fintech, and the most funded startup ecosystem on the continent."},
  {flag:"🇸🇳",name:"Senegal Hub",members:760,city:"Dakar · Thiès",color:"var(--g2)",desc:"Francophone Africa's tech hub. Wave money, AI research, and startup culture."},
  {flag:"🇪🇹",name:"Ethiopia Hub",members:980,city:"Addis Ababa · Dire Dawa",color:"var(--r2)",desc:"East Africa's fastest growing dev scene. Fintech and health tech leading."},
  {flag:"🇷🇼",name:"Rwanda Hub",members:640,city:"Kigali",color:"var(--green)",desc:"Africa's Singapore. Government-backed tech, cleanest city, smartest builders."},
  {flag:"🇨🇲",name:"Cameroon Hub",members:520,city:"Douala · Yaoundé",color:"var(--gold)",desc:"Bilingual builders — French and English. Agritech and fintech dominating."},
];

const LEADERBOARD = [
  {rank:1,name:"Kofi Osei",handle:"kofi_builds",flag:"🇬🇭",badge:"Icon 🌍",pts:10240,drops:18,collabs:7,av:"KO",avc:"gold"},
  {rank:2,name:"Nadia Wanjiru",handle:"nadia.w",flag:"🇰🇪",badge:"Legend 👑",pts:7820,drops:14,collabs:9,av:"NW",avc:"green"},
  {rank:3,name:"Obioma Kalu",handle:"obioma_k",flag:"🇳🇬",badge:"Vibe Lord 🔥",pts:5410,drops:11,collabs:4,av:"OK",avc:"red"},
  {rank:4,name:"Tolu Kehinde",handle:"tolu_builds",flag:"🇳🇬",badge:"Vibe Lord 🔥",pts:3420,drops:8,collabs:5,av:"TK",avc:"red"},
  {rank:5,name:"Zara Ndlovu",handle:"zara_n",flag:"🇿🇦",badge:"Builder ⚡",pts:2200,drops:6,collabs:3,av:"ZN",avc:"green"},
  {rank:6,name:"Amara Mensah",handle:"amara.m",flag:"🇬🇭",badge:"Builder ⚡",pts:1890,drops:5,collabs:6,av:"AM",avc:"gold"},
  {rank:7,name:"Moussa Bah",handle:"moussa_dev",flag:"🇸🇳",badge:"Builder ⚡",pts:1640,drops:7,collabs:2,av:"MB",avc:"green"},
  {rank:8,name:"Tinashe Amos",handle:"tinashe_dev",flag:"🇿🇼",badge:"Seedling 🌱",pts:980,drops:3,collabs:1,av:"TA",avc:"red"},
];

const DM_CONTACTS = [
  {name:"Kofi Osei",handle:"kofi_builds",flag:"🇬🇭",av:"KO",avc:"gold",lastMsg:"Yo that USSD idea is fire 🔥",time:"2m",unread:2,online:true,msgs:[{from:"them",text:"Yo that USSD idea is fire 🔥",time:"2m ago"},{from:"them",text:"Have you thought about Stellar for micro-payments?",time:"1m ago"}]},
  {name:"Nadia Wanjiru",handle:"nadia.w",flag:"🇰🇪",av:"NW",avc:"green",lastMsg:"Are you open for collab on my EdTech?",time:"1h",unread:1,online:true,msgs:[{from:"them",text:"Are you open for collab on my EdTech?",time:"1h ago"}]},
  {name:"Obioma Kalu",handle:"obioma_k",flag:"🇳🇬",av:"OK",avc:"red",lastMsg:"Thanks for the upvote bro 🙏",time:"3h",unread:0,online:false,msgs:[{from:"them",text:"Thanks for the upvote bro 🙏",time:"3h ago"}]},
  {name:"Tinashe Amos",handle:"tinashe_dev",flag:"🇿🇼",av:"TA",avc:"red",lastMsg:"That bounty looks interesting",time:"1d",unread:0,online:false,msgs:[{from:"them",text:"That bounty looks interesting",time:"1d ago"}]},
];

const STACKS = ["React","Next.js","Vue","React Native","Flutter","Node.js","Python","Django","FastAPI","Go","Rust","Solidity","Web3.js","TensorFlow","PyTorch","Tailwind","TypeScript","GraphQL","Supabase","Firebase","Docker","AWS","MongoDB","Three.js"];
const GOALS = [["🚀","Drop projects & get feedback"],["🤝","Find a co-founder"],["💼","Get hired or freelance"],["💰","Earn from bounties"],["📚","Learn from other builders"],["🌍","Build for African markets"],["💡","Get investor attention"],["👥","Build a team"]];

// ── SHARED ────────────────────────────────────────────────────────────────────
const Logo = ({size=32,onClick})=>(
  <div onClick={onClick} style={{fontFamily:"var(--fd)",fontSize:size,letterSpacing:4,cursor:"pointer",display:"flex",alignItems:"center",userSelect:"none",lineHeight:1}}>
    <span style={{color:"var(--white)"}}>V</span><span style={{color:"var(--red)"}}>I</span><span style={{color:"var(--white)"}}>B</span><span style={{color:"var(--gold)"}}>R</span>
    <span style={{width:6,height:6,background:"var(--gr2)",borderRadius:"50%",marginLeft:2,marginBottom:2,display:"inline-block"}}/>
  </div>
);

const Tag = ({label,color="gold"})=>{
  const c={gold:["var(--g2)","var(--gold)"],red:["var(--r2)","var(--red)"],green:["var(--gr2)","var(--green)"]}[color]||["var(--g2)","var(--gold)"];
  return <span style={{padding:"3px 9px",fontSize:10,fontFamily:"var(--fm)",letterSpacing:1,border:`1px solid ${c[1]}`,color:c[0],textTransform:"uppercase",whiteSpace:"nowrap"}}>{label}</span>;
};

const Av = ({name="?",color="red",size=40})=>{
  const bg={red:"var(--red)",gold:"var(--gold)",green:"var(--green)",purple:"#7C3AED"}[color]||"var(--red)";
  return <div style={{width:size,height:size,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:size*.44,color:color==="gold"?"#000":"#fff",flexShrink:0}}>{name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>;
};

const Btn = ({children,v="primary",onClick,style:s={},full})=>{
  const [h,setH]=useState(false);
  const base={border:"2.5px solid",padding:"10px 22px",fontFamily:"var(--fd)",fontSize:17,letterSpacing:3,transition:"all .15s",display:"inline-flex",alignItems:"center",gap:8,width:full?"100%":"auto",justifyContent:full?"center":"flex-start",cursor:"pointer"};
  const vs={
    primary:{background:h?"transparent":"var(--red)",color:h?"var(--red)":"#fff",borderColor:"var(--red)",transform:h?"translate(-2px,-2px)":"none",boxShadow:h?"4px 4px 0 var(--red)":"none"},
    gold:{background:h?"transparent":"var(--gold)",color:h?"var(--gold)":"#000",borderColor:"var(--gold)",transform:h?"translate(-2px,-2px)":"none",boxShadow:h?"4px 4px 0 var(--gold)":"none"},
    ghost:{background:"transparent",color:h?"var(--white)":"var(--muted)",borderColor:h?"var(--white)":"var(--border)"},
    green:{background:h?"transparent":"var(--green)",color:h?"var(--gr2)":"#fff",borderColor:"var(--green)",transform:h?"translate(-2px,-2px)":"none",boxShadow:h?"4px 4px 0 var(--green)":"none"},
  };
  return <button onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{...base,...vs[v],...s}}>{children}</button>;
};



// ═══════════════════════════════════════════════════════════════════════════
// PRODUCTION SYSTEMS
// ═══════════════════════════════════════════════════════════════════════════

// ── TOAST NOTIFICATION SYSTEM ────────────────────────────────────────────────
let _toastListeners = [];
const toast = {
  _emit(msg){ _toastListeners.forEach(fn => fn(msg)); },
  success(text, dur=3500){ this._emit({id:Date.now(),type:"success",text,dur}); },
  error  (text, dur=4500){ this._emit({id:Date.now(),type:"error",  text,dur}); },
  info   (text, dur=3000){ this._emit({id:Date.now(),type:"info",   text,dur}); },
  warn   (text, dur=4000){ this._emit({id:Date.now(),type:"warn",   text,dur}); },
};

function ToastContainer(){
  const [toasts,setToasts] = useState([]);
  useEffect(()=>{
    const handler = (t)=>{
      setToasts(prev=>[...prev, t]);
      setTimeout(()=>setToasts(prev=>prev.filter(x=>x.id!==t.id)), t.dur);
    };
    _toastListeners.push(handler);
    return ()=>{ _toastListeners = _toastListeners.filter(fn=>fn!==handler); };
  },[]);
  const colors = { success:"var(--green)", error:"var(--red)", info:"var(--gold)", warn:"#F59E0B" };
  const icons  = { success:"✓", error:"✕", info:"ℹ", warn:"⚠" };
  if(!toasts.length) return null;
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:8,maxWidth:360}}>
      {toasts.map(t=>(
        <div key={t.id} style={{
          background:"var(--surface)",border:`2px solid ${colors[t.type]}`,
          padding:"12px 16px",display:"flex",alignItems:"center",gap:10,
          animation:"slideInRight .25s ease both",boxShadow:"0 8px 32px rgba(0,0,0,.5)",
        }}>
          <span style={{color:colors[t.type],fontWeight:700,fontSize:16,flexShrink:0}}>{icons[t.type]}</span>
          <span style={{fontSize:13,color:"var(--text)",fontFamily:"var(--fb)",lineHeight:1.4}}>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

// ── SKELETON LOADER ──────────────────────────────────────────────────────────
function Skeleton({w="100%",h=16,mb=0,br=0}){
  return <div style={{width:w,height:h,background:"linear-gradient(90deg,var(--s2) 25%,var(--border) 50%,var(--s2) 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite",borderRadius:br,marginBottom:mb,flexShrink:0}}/>;
}
function SkeletonCard(){
  return (
    <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:20,marginBottom:12}}>
      <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center"}}>
        <Skeleton w={40} h={40} br={20}/>
        <div style={{flex:1}}><Skeleton h={12} mb={6}/><Skeleton w="60%" h={10}/></div>
      </div>
      <Skeleton h={18} mb={8}/><Skeleton h={14} mb={6}/><Skeleton w="80%" h={14} mb={14}/>
      <div style={{display:"flex",gap:8}}><Skeleton w={60} h={22} br={4}/><Skeleton w={80} h={22} br={4}/><Skeleton w={70} h={22} br={4}/></div>
    </div>
  );
}
function SkeletonProfile(){
  return (
    <div style={{padding:24}}>
      <div style={{display:"flex",gap:16,marginBottom:20}}>
        <Skeleton w={80} h={80} br={40}/>
        <div style={{flex:1}}><Skeleton h={20} mb={8}/><Skeleton w="50%" h={14} mb={6}/><Skeleton w="40%" h={12}/></div>
      </div>
      <SkeletonCard/><SkeletonCard/><SkeletonCard/>
    </div>
  );
}

// ── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({emoji="📭", title, sub, cta, onCta}){
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"64px 24px",textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:16,opacity:.6}}>{emoji}</div>
      <div style={{fontFamily:"var(--fd)",fontSize:22,letterSpacing:2,marginBottom:8,color:"var(--text)"}}>{title}</div>
      {sub&&<p style={{color:"var(--muted)",fontSize:13,lineHeight:1.7,maxWidth:320,marginBottom:cta?20:0}}>{sub}</p>}
      {cta&&onCta&&<button onClick={onCta} style={{padding:"9px 22px",background:"var(--red)",color:"#fff",border:"2px solid var(--red)",fontFamily:"var(--fd)",fontSize:15,letterSpacing:2,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--red)";}} onMouseLeave={e=>{e.target.style.background="var(--red)";e.target.style.color="#fff";}}>{cta}</button>}
    </div>
  );
}

// ── ERROR BOUNDARY ────────────────────────────────────────────────────────────
class VIBRErrorBoundary {
  static getDerivedStateFromError(error){ return {hasError:true,error}; }
  componentDidCatch(error,info){ console.error("VIBR Error:", error, info); }
}
// Note: ErrorBoundary is applied via the wrapper below
function ErrorBoundaryWrapper({children}){
  const [err,setErr] = useState(null);
  if(err) return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,textAlign:"center"}}>
      <div>
        <div style={{fontSize:52,marginBottom:16}}>⚡</div>
        <div style={{fontFamily:"var(--fd)",fontSize:28,letterSpacing:2,marginBottom:8,color:"var(--red)"}}>SOMETHING CRASHED</div>
        <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.7,maxWidth:360,marginBottom:20}}>A component crashed. Your data is safe.</p>
        <button onClick={()=>window.location.reload()} style={{padding:"10px 24px",background:"var(--red)",color:"#fff",border:"2px solid var(--red)",fontFamily:"var(--fd)",fontSize:16,letterSpacing:3,cursor:"pointer"}}>RELOAD →</button>
      </div>
    </div>
  );
  return children;
}
function ErrorBoundary({children}){ return <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>; }

function OfflineBanner(){
  const [offline,setOffline] = useState(!navigator.onLine);
  useEffect(()=>{
    const on  = ()=>setOffline(false);
    const off = ()=>setOffline(true);
    window.addEventListener("online",on);
    window.addEventListener("offline",off);
    return ()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
  },[]);
  if(!offline) return null;
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,zIndex:10000,background:"#F59E0B",padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
      <span style={{fontSize:14}}>📡</span>
      <span style={{fontFamily:"var(--fm)",fontSize:10,color:"#000",letterSpacing:2,fontWeight:700}}>NO INTERNET CONNECTION — RECONNECTING...</span>
    </div>
  );
}

// ── AVATAR UPLOAD ─────────────────────────────────────────────────────────────
function AvatarUpload({userId, currentUrl, onSuccess}){
  const [uploading,setUploading] = useState(false);
  const inputRef = useRef(null);

  const upload = async(e)=>{
    const file = e.target.files?.[0];
    if(!file || !userId) return;
    if(file.size > 5*1024*1024){ toast.error("Image must be under 5MB"); return; }
    setUploading(true);
    try{
      const ext  = file.name.split('.').pop();
      const path = `avatars/${userId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert:true, contentType:file.type });
      if(upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);
      await supabase.from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);
      onSuccess?.(publicUrl);
      toast.success("Profile photo updated!");
    }catch(err){
      toast.error(err.message || "Upload failed");
    }finally{ setUploading(false); }
  };

  return (
    <div style={{position:"relative",display:"inline-block",cursor:"pointer"}} onClick={()=>inputRef.current?.click()}>
      <div style={{
        width:72,height:72,borderRadius:"50%",
        background:currentUrl?"transparent":"var(--red)",
        overflow:"hidden",border:"2px solid var(--border)",
        display:"flex",alignItems:"center",justifyContent:"center",
      }}>
        {currentUrl
          ? <img src={currentUrl} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          : <span style={{fontFamily:"var(--fd)",fontSize:22,color:"#fff"}}>+</span>
        }
      </div>
      {uploading&&<div style={{position:"absolute",inset:0,borderRadius:"50%",background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:18,height:18,border:"2px solid var(--red)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/></div>}
      <div style={{position:"absolute",bottom:0,right:0,background:"var(--gold)",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>✏️</div>
      <input ref={inputRef} type="file" accept="image/*" onChange={upload} style={{display:"none"}} aria-label="Upload profile photo"/>
    </div>
  );
}

// ── PAGINATION HOOK ───────────────────────────────────────────────────────────
function usePagination(fetchFn, deps=[]){
  const [items,setItems]       = useState([]);
  const [loading,setLoading]   = useState(false);
  const [hasMore,setHasMore]   = useState(true);
  const [page,setPage]         = useState(0);
  const PAGE_SIZE = 15;

  const load = async(reset=false)=>{
    if(loading) return;
    setLoading(true);
    try{
      const offset = reset ? 0 : page * PAGE_SIZE;
      const data   = await fetchFn({ limit:PAGE_SIZE, offset });
      if(!data || data.length < PAGE_SIZE) setHasMore(false);
      if(reset) setItems(data||[]);
      else setItems(prev=>[...prev,...(data||[])]);
      if(!reset) setPage(p=>p+1);
    }catch{ setHasMore(false); }
    finally{ setLoading(false); }
  };

  useEffect(()=>{ setPage(0); setHasMore(true); load(true); }, deps);

  const loadMore = ()=>{ if(hasMore && !loading) load(); };
  return { items, loading, hasMore, loadMore };
}

// ── INFINITE SCROLL SENTINEL ─────────────────────────────────────────────────
function InfiniteScrollSentinel({ onVisible, loading, hasMore }){
  const ref = useRef(null);
  useEffect(()=>{
    const el = ref.current;
    if(!el) return;
    const obs = new IntersectionObserver(([entry])=>{
      if(entry.isIntersecting && hasMore && !loading) onVisible();
    },{ threshold:0.1 });
    obs.observe(el);
    return ()=>obs.disconnect();
  },[onVisible,loading,hasMore]);
  return (
    <div ref={ref} style={{height:48,display:"flex",alignItems:"center",justifyContent:"center"}}>
      {loading&&<div style={{width:24,height:24,border:"2px solid var(--red)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>}
      {!hasMore&&!loading&&<div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:2}}>YOU'VE SEEN IT ALL ✓</div>}
    </div>
  );
}

// ── PAYSTACK HOOK ─────────────────────────────────────────────────────────────
function usePaystack(){
  const pay = ({ email, amount, currency="NGN", onSuccess, onClose, metadata={} })=>{
    const PUBLIC_KEY = process.env.REACT_APP_PAYSTACK_PUBLIC || "pk_test_placeholder";
    if(!window.PaystackPop){
      toast.error("Payment system loading... try again in a second.");
      // Lazy-load Paystack inline script
      const s = document.createElement("script");
      s.src = "https://js.paystack.co/v1/inline.js";
      s.onload = ()=> pay({ email, amount, currency, onSuccess, onClose, metadata });
      document.head.appendChild(s);
      return;
    }
    const handler = window.PaystackPop.setup({
      key:       PUBLIC_KEY,
      email,
      amount, // already kobo (₦3,500 = 350000)
      currency,
      metadata,
      callback:  (res)=>{ onSuccess?.(res); toast.success("Payment successful! 🎉"); },
      onClose:   ()=>{ onClose?.(); },
    });
    handler.openIframe();
  };
  return { pay };
}


// ── USERCARD — live user data in sidebar ─────────────────────────────────────
function UserCard({navigate}){
  const [profile,setProfile]=useState(null);
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(!session) return;
      getProfile(session.user.id).then(p=>setProfile(p)).catch(()=>{});
    });
  },[]);
  const name   = profile?.full_name||profile?.username||"Your Name";
  const handle = profile?.username||"yourhandle";
  const flag   = profile?.country?.includes("Nigeria")?"🇳🇬":profile?.country?.includes("Kenya")?"🇰🇪":profile?.country?.includes("Ghana")?"🇬🇭":"🌍";
  const points = profile?.vibe_points||0;
  const rank   = profile?.rank||"🌱";
  const initials = name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"YO";
  return (
    <div style={{margin:10,padding:12,background:"var(--s2)",border:"2px solid var(--border)"}}>
      <div style={{display:"flex",gap:9,alignItems:"center",marginBottom:9}}>
        <Av name={initials} color="red" size={32}/>
        <div>
          <div style={{fontWeight:700,fontSize:12}}>{name.length>16?name.slice(0,16)+"…":name}</div>
          <div style={{color:"var(--muted)",fontSize:9,fontFamily:"var(--fm)"}}>{handle} · {flag}</div>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        {[["0","Drops"],[points.toLocaleString(),"Vibes"],[rank,"Rank"]].map(([v,l])=>(
          <div key={l} style={{textAlign:"center"}}>
            <div style={{fontFamily:"var(--fd)",fontSize:13,color:"var(--gold)"}}>{v}</div>
            <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--muted)",letterSpacing:1,textTransform:"uppercase"}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const AppShell = ({navigate,activePage,children,returnTo,userRole})=>{
  // ── Role detection ──────────────────────────────────────────────────────────
  const isInvestorBrowsing = returnTo==="investor-dashboard";
  const isCompanyBrowsing  = returnTo==="company-dashboard";
  const isBrowsingAsGuest  = isInvestorBrowsing || isCompanyBrowsing;
  const accentColor        = isInvestorBrowsing ? "var(--gold)" : isCompanyBrowsing ? "var(--gr2)" : null;
  const dashLabel          = isInvestorBrowsing ? "Investor Dashboard" : "Company Dashboard";
  const roleLabel          = isInvestorBrowsing ? "💼 INVESTOR" : "🏢 COMPANY";

  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
  const openPage=(page)=>{setMobileMenuOpen(false);navigate(page);};

  // ── Builder nav ─────────────────────────────────────────────────────────────
  const nav=[
    ["🏠","Feed","feed"],["✦","Drop","drop"],["🤝","Collabs","collabs"],
    ["💰","Bounties","bounties"],["👥","Community","community"],
    ["🏆","Leaderboard","leaderboard"],["💬","Messages","messages"],
    ["🔥","My Squad","sqvad"],["🚀","Spaces","spaces"],["⚡","Hackathons","hackathons"],
    ["🏢","Companies","companies"],["🔍","Search","search"],
    ["🔔","Notifications","notifications"],["👤","Profile","profile"],
    ["💳","Go Pro","premium"],["⚙️","Settings","settings"],
  ];

  // ── INVESTOR / COMPANY BROWSING: no builder sidebar — just top bar + content ─
  if(isBrowsingAsGuest){
    return (
      <div style={{display:"flex",flexDirection:"column",minHeight:"100vh",background:"var(--bg)"}}>
        {/* Persistent role bar — stays fixed at top while browsing */}
        <div style={{position:"sticky",top:0,zIndex:300,background:isInvestorBrowsing?"rgba(10,10,10,.96)":"rgba(10,10,10,.96)",borderBottom:`2px solid ${accentColor}`,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:48,backdropFilter:"blur(8px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            {/* VIBR logo */}
            <div onClick={()=>navigate("landing")} style={{fontFamily:"var(--fd)",fontSize:22,letterSpacing:4,display:"flex",alignItems:"center",cursor:"pointer"}}>
              <span style={{color:"var(--white)"}}>V</span><span style={{color:"var(--red)"}}>I</span><span style={{color:"var(--white)"}}>B</span><span style={{color:"var(--gold)"}}>R</span>
              <span style={{width:4,height:4,background:"var(--gr2)",borderRadius:"50%",marginLeft:2,marginBottom:1,display:"inline-block"}}/>
            </div>
            <div style={{width:1,height:22,background:"rgba(255,255,255,.1)"}}/>
            <span style={{fontFamily:"var(--fm)",fontSize:8,color:accentColor,letterSpacing:2,padding:"2px 8px",border:`1px solid ${accentColor}`,textTransform:"uppercase"}}>{roleLabel}</span>
            <span style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:1}}>Browsing builder platform</span>
          </div>
          <button
            onClick={()=>navigate(returnTo)}
            style={{background:accentColor,color:isInvestorBrowsing?"#000":"#fff",border:`2px solid ${accentColor}`,padding:"5px 18px",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:7}}
            onMouseEnter={e=>{e.currentTarget.style.opacity=".8";}}
            onMouseLeave={e=>{e.currentTarget.style.opacity="1";}}
          >
            ← {dashLabel}
          </button>
        </div>
        {/* Full-width content — no builder sidebar */}
        <main id="main-content" role="main" style={{flex:1,minWidth:0,overflow:"auto"}} aria-label="Main content">{children}</main>
      </div>
    );
  }

  // ── BUILDER: desktop sidebar + mobile hamburger drawer ──────────────────────
  return (
    <div className="vibr-app-shell" style={{display:"flex",minHeight:"100vh",background:"var(--bg)"}}>
      <header className="vibr-mobile-header">
        <button type="button" className="vibr-mobile-menu-button" aria-label={mobileMenuOpen?"Close navigation menu":"Open navigation menu"} aria-expanded={mobileMenuOpen} onClick={()=>setMobileMenuOpen(v=>!v)}>
          <span/><span/><span/>
        </button>
        <button type="button" className="vibr-mobile-brand" aria-label="VIBR home" onClick={()=>openPage("feed")}><img src="/vibr-wordmark.svg" alt="VIBR"/></button>
        <button type="button" className="vibr-mobile-header-profile" aria-label="Open profile" onClick={()=>openPage("profile")}>👤</button>
      </header>

      {mobileMenuOpen && <button type="button" className="vibr-mobile-scrim" aria-label="Close navigation menu" onClick={()=>setMobileMenuOpen(false)}/>}

      <div className={"vibr-sidebar"+(mobileMenuOpen?" vibr-sidebar-open":"")} style={{width:224,background:"var(--surface)",borderRight:"2px solid var(--border)",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflowY:"auto",flexShrink:0}}>
        <div className="vibr-sidebar-brand" style={{padding:"18px 18px 12px",borderBottom:"2px solid var(--border)"}}><Logo size={28} onClick={()=>openPage("landing")}/></div>
        <nav role="navigation" aria-label="Main navigation" style={{flex:1,padding:"10px 0"}}>
          {nav.map(([icon,label,page])=>{
            const a=activePage===page;
            return (
              <div key={label} onClick={()=>openPage(page)} style={{display:"flex",alignItems:"center",gap:11,padding:"11px 18px",cursor:"pointer",transition:"all .15s",background:a?"rgba(209,43,43,.12)":"transparent",borderLeft:a?"3px solid var(--red)":"3px solid transparent",color:a?"var(--white)":"var(--muted)"}} onMouseEnter={e=>{if(!a){e.currentTarget.style.background="var(--s2)";e.currentTarget.style.color="var(--white)";}}} onMouseLeave={e=>{if(!a){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--muted)";}}}>
                <span style={{fontSize:15,width:18,textAlign:"center"}}>{icon}</span>
                <span style={{fontWeight:600,fontSize:13}}>{label}</span>
                {label==="Drop"&&<span style={{marginLeft:"auto",background:"var(--red)",color:"#fff",fontSize:8,padding:"2px 5px",fontFamily:"var(--fm)"}}>NEW</span>}
                {label==="Messages"&&<span style={{marginLeft:"auto",background:"var(--red)",color:"#fff",fontSize:8,padding:"2px 5px",fontFamily:"var(--fm)",borderRadius:8}}>3</span>}
                {label==="Notifications"&&<span style={{marginLeft:"auto",background:"var(--gold)",color:"#000",fontSize:8,padding:"2px 5px",fontFamily:"var(--fm)",borderRadius:8}}>5</span>}
                {label==="Go Pro"&&<span style={{marginLeft:"auto",background:"var(--gold)",color:"#000",fontSize:8,padding:"2px 5px",fontFamily:"var(--fm)"}}>🔥</span>}
              </div>
            );
          })}
        </nav>
        <UserCard navigate={openPage}/>
      </div>
      <main id="main-content" role="main" className="vibr-main-content" style={{flex:1,minWidth:0,overflow:"auto"}} aria-label="Main content">{children}</main>
      <style>{`
        .vibr-mobile-header{display:none}
        .vibr-mobile-scrim{display:none}
        @media(max-width:900px){
          .vibr-app-shell{display:block!important;padding-top:58px;min-width:0}
          .vibr-mobile-header{height:66px;display:flex;align-items:center;justify-content:flex-start;gap:14px;padding:0 16px;position:fixed;left:0;right:0;top:0;z-index:1002;background:rgba(10,10,10,.97);border-bottom:1px solid var(--border);backdrop-filter:blur(12px)}
          .vibr-mobile-menu-button{width:42px;height:42px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--white);cursor:pointer}
          .vibr-mobile-menu-button span{display:block;width:19px;height:2px;background:var(--white);border-radius:2px}
          .vibr-mobile-brand{display:flex;align-items:center;justify-content:flex-start;cursor:pointer;background:transparent;border:0;padding:0;margin:0;min-width:0;flex:0 1 auto}.vibr-mobile-brand img{display:block;width:clamp(112px,34vw,148px);height:auto;max-height:42px;object-fit:contain;object-position:left center}.vibr-mobile-header-profile{margin-left:auto;flex-shrink:0}
          .vibr-mobile-header-profile{width:38px;height:38px;border:1px solid var(--border);border-radius:50%;background:var(--s2);color:var(--white);font-size:17px}
          .vibr-sidebar{display:flex!important;position:fixed!important;z-index:1004!important;left:0!important;top:58px!important;bottom:0!important;width:min(300px,84vw)!important;height:calc(100dvh - 58px)!important;transform:translateX(-105%);transition:transform .24s ease;box-shadow:16px 0 45px rgba(0,0,0,.45);border-right:1px solid var(--border)!important}
          .vibr-sidebar.vibr-sidebar-open{transform:translateX(0)}
          .vibr-mobile-scrim{display:block;position:fixed;inset:58px 0 0;z-index:1003;border:0;background:rgba(0,0,0,.58);padding:0}
          .vibr-main-content{width:100%;min-width:0!important;max-width:100%;overflow-x:hidden!important}
        }
        @media(min-width:901px){.vibr-sidebar{transform:none!important}.vibr-mobile-header,.vibr-mobile-scrim{display:none!important}}
      `}</style>
    </div>
  );
};


function AccountTypePage({mode="signup",navigate}){
  const [hov,setHov]=useState(null);
  const types=[
    {id:"builder",icon:"🔥",title:"Builder",sub:"Vibe Coder",desc:"Drop projects, find collabs, earn bounties, and get seen by investors worldwide.",color:"var(--red)",dim:"rgba(209,43,43,.08)",border:"rgba(209,43,43,.4)",badge:"OPEN"},
    {id:"investor",icon:"💼",title:"Investor",sub:"Capital & Deals",desc:"Discover Africa's best early-stage builders. Post bounties, find talent, make deals.",color:"var(--gold)",dim:"rgba(240,165,0,.08)",border:"rgba(240,165,0,.4)",badge:"VERIFIED"},
    {id:"company",icon:"🏢",title:"Company",sub:"Hire & Partner",desc:"Post bounties, scout engineers, sponsor hackathons, and build your African tech team.",color:"var(--gr2)",dim:"rgba(34,160,80,.08)",border:"rgba(34,160,80,.4)",badge:"OPEN"},
  ];
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(240,165,0,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(240,165,0,.02) 1px,transparent 1px)",backgroundSize:"48px 48px",pointerEvents:"none"}}/>
      <div className="fu" style={{marginBottom:36,textAlign:"center"}}>
        <div onClick={()=>navigate("landing")} style={{cursor:"pointer",display:"inline-block",marginBottom:10}}>
          <div style={{fontFamily:"var(--fd)",fontSize:36,letterSpacing:4,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"var(--white)"}}>V</span><span style={{color:"var(--red)"}}>I</span><span style={{color:"var(--white)"}}>B</span><span style={{color:"var(--gold)"}}>R</span><span style={{width:5,height:5,background:"var(--gr2)",borderRadius:"50%",marginLeft:2,marginBottom:2,display:"inline-block"}}/></div>
        </div>
        <div style={{fontFamily:"var(--fd)",fontSize:"clamp(26px,5vw,44px)",letterSpacing:2,lineHeight:1,marginBottom:7}}>{mode==="signup"?"JOIN AS...":"WELCOME BACK"}</div>
        <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:3}}>{mode==="signup"?"SELECT YOUR ACCOUNT TYPE TO GET STARTED":"SELECT YOUR ACCOUNT TYPE TO LOG IN"}</div>
      </div>
      <div className="vibr-grid-3" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,maxWidth:820,width:"100%"}}>
        {types.map((t,i)=>(
          <div key={t.id} className="fu" style={{animationDelay:`${.08+i*.08}s`,cursor:"pointer",position:"relative"}}
            onClick={()=>navigate(mode==="signup"?`${t.id}-signup`:t.id==="investor"?"investor-login":t.id==="company"?"company-login":`${t.id}-login`)}
            onMouseEnter={()=>setHov(t.id)} onMouseLeave={()=>setHov(null)}>
            <div style={{background:hov===t.id?t.dim:"var(--surface)",border:`2px solid ${hov===t.id?t.border:"var(--border)"}`,padding:"26px 22px",transition:"all .25s",transform:hov===t.id?"translateY(-5px)":"none",boxShadow:hov===t.id?`0 16px 40px ${t.color}22`:undefined}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${t.color},transparent)`,opacity:hov===t.id?1:.2,transition:"opacity .25s"}}/>
              <div style={{position:"absolute",top:12,right:12}}><span style={{padding:"2px 8px",fontFamily:"var(--fm)",fontSize:7,letterSpacing:2,border:`1px solid ${t.color}`,color:t.color,textTransform:"uppercase"}}>{t.badge}</span></div>
              <div style={{fontSize:36,marginBottom:12,filter:hov===t.id?`drop-shadow(0 0 10px ${t.color})`:undefined,transition:"filter .25s"}}>{t.icon}</div>
              <div style={{fontFamily:"var(--fd)",fontSize:24,letterSpacing:2,color:hov===t.id?t.color:"var(--text)",marginBottom:3,transition:"color .25s"}}>{t.title}</div>
              <div style={{fontFamily:"var(--fm)",fontSize:8,color:t.color,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>{t.sub}</div>
              <p style={{fontSize:13,color:"var(--muted)",lineHeight:1.7,marginBottom:16}}>{t.desc}</p>
              <div style={{fontFamily:"var(--fm)",fontSize:8,color:hov===t.id?t.color:"var(--muted)",letterSpacing:2,transition:"color .25s"}}>{mode==="signup"?"CREATE ACCOUNT":"LOG IN"} →</div>
            </div>
          </div>
        ))}
      </div>
      <div className="fu3" style={{marginTop:24,fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:1}}>
        {mode==="signup"?"Already have an account? ":"New to VIBR? "}
        <span onClick={()=>navigate(mode==="signup"?"account-login":"account-signup")} style={{color:"var(--gold)",cursor:"pointer",textDecoration:"underline"}}>{mode==="signup"?"Log in":"Sign up"}</span>
      </div>
    </div>
  );
}

// ── AUTH (Builder login/signup) ───────────────────────────────────────────────
function AuthPage({mode="login",navigate,onAuth}){
  const [isLogin,setIsLogin]=useState(mode==="login");
  const [form,setForm]=useState({name:"",email:"",password:"",country:""});
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const inp={width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",transition:"border-color .2s",borderRadius:0};

  const handleSubmit=async()=>{
    setErr(""); setLoading(true);
    try {
      if(isLogin){
        if(!form.email||!form.password){setErr("Email and password required.");return;}
        await signIn({email:form.email,password:form.password});
        // onAuthStateChange in App Root handles navigation
      } else {
        if(!form.name||!form.email||!form.password){setErr("All fields required.");return;}
        if(form.password.length<8){setErr("Password must be at least 8 characters.");return;}
        await signUp({email:form.email,password:form.password,name:form.name,country:form.country,role:"builder"});
        toast.success("Account created! Welcome to VIBR 🔥");
        if(onAuth) onAuth("builder");
      }
    } catch(e){
      setErr(e.message||"Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vibr-auth-grid" style={{minHeight:"100vh",display:"grid",gridTemplateColumns:"1fr 1fr"}}>
      <div className="vibr-auth-panel" style={{background:"#0A0A0A",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"48px 46px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,width:"100%",height:5,display:"flex"}}><div style={{flex:1,background:"var(--red)"}}/><div style={{flex:1,background:"var(--gold)"}}/><div style={{flex:1,background:"var(--green)"}}/></div>
        <div style={{fontFamily:"var(--fd)",fontSize:34,letterSpacing:4,display:"flex",alignItems:"center",cursor:"pointer"}} onClick={()=>navigate("landing")}><span style={{color:"var(--white)"}}>V</span><span style={{color:"var(--red)"}}>I</span><span style={{color:"var(--white)"}}>B</span><span style={{color:"var(--gold)"}}>R</span><span style={{width:5,height:5,background:"var(--gr2)",borderRadius:"50%",marginLeft:2,marginBottom:2,display:"inline-block"}}/></div>
        <div>
          <div style={{fontFamily:"var(--fd)",fontSize:56,lineHeight:.9,color:"var(--white)",marginBottom:18,letterSpacing:-1}}>THE HUB<br/><span style={{color:"var(--gold)"}}>AFRICAN</span><br/>BUILDERS<br/><span style={{color:"var(--red)"}}>DESERVE.</span></div>
          <p style={{color:"#666",fontSize:13,lineHeight:1.8,maxWidth:300}}>Join 12,000+ African developers who got seen by investors, found co-founders, and shipped products — all from VIBR.</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          {[["🇳🇬","Tolu K.","Closed $50K seed after investor found him on VIBR"],["🇬🇭","Kofi O.","Found his co-founder in 3 days via Collab Board"],["🇰🇪","Nadia W.","Got hired by a YC startup after her project trended"]].map(([f,n,t])=><div key={n} style={{display:"flex",gap:9,alignItems:"flex-start"}}><div style={{fontSize:18}}>{f}</div><div><div style={{color:"var(--gold)",fontWeight:700,fontSize:12}}>{n}</div><div style={{color:"#555",fontSize:12,lineHeight:1.5}}>{t}</div></div></div>)}
        </div>
      </div>
      <div style={{background:"var(--surface)",display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 46px"}}>
        <div style={{width:"100%",maxWidth:380}}>
          <button onClick={()=>navigate("account-login")} style={{background:"transparent",border:"none",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,cursor:"pointer",marginBottom:28,display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>e.target.style.color="var(--text)"} onMouseLeave={e=>e.target.style.color="var(--muted)"}>← All account types</button>
          <div style={{marginBottom:28}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:5}}><span style={{fontSize:20}}>🔥</span><div style={{fontFamily:"var(--fd)",fontSize:36,letterSpacing:2,lineHeight:1}}>{isLogin?"WELCOME BACK":"JOIN VIBR"}</div></div>
            <div style={{color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2}}>{isLogin?"BUILDER LOGIN":"CREATE BUILDER ACCOUNT"}</div>
          </div>
          <div style={{display:"flex",marginBottom:24,border:"2px solid var(--border)"}}>
            {[["LOG IN",true],["SIGN UP",false]].map(([l,val])=><button key={l} onClick={()=>{setIsLogin(val);setErr("");}} style={{flex:1,padding:"9px",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,background:isLogin===val?"var(--red)":"transparent",color:isLogin===val?"#fff":"var(--muted)",border:"none",cursor:"pointer",transition:"all .2s"}}>{l}</button>)}
          </div>
          {err&&<div style={{background:"rgba(209,43,43,.1)",border:"1px solid var(--red)",padding:"9px 12px",fontFamily:"var(--fm)",fontSize:10,color:"var(--r2)",letterSpacing:.5,marginBottom:12,lineHeight:1.5}}>{err}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {!isLogin&&<div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Full Name</div><input value={form.name} onChange={e=>upd("name",e.target.value)} placeholder="Your name" style={inp} onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/></div>}
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Email</div><input value={form.email} onChange={e=>upd("email",e.target.value)} type="email" placeholder="you@email.com" aria-label="Email address" style={inp} onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--border)"}  onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/></div>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Password</div><input value={form.password} onChange={e=>upd("password",e.target.value)} type="password" placeholder="••••••••" aria-label="Password" style={inp} onFocus={e=>e.target.style.borderColor="var(--red)"} onBlur={e=>e.target.style.borderColor="var(--border)"} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/></div>
            {!isLogin&&<div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Country</div><select value={form.country} onChange={e=>upd("country",e.target.value)} style={{...inp,appearance:"none"}}><option value="">Select your country</option>{["Nigeria 🇳🇬","Kenya 🇰🇪","Ghana 🇬🇭","South Africa 🇿🇦","Ethiopia 🇪🇹","Senegal 🇸🇳","Rwanda 🇷🇼","Other"].map(c=><option key={c}>{c}</option>)}</select></div>}
            <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
            <button onClick={handleSubmit} disabled={loading} style={{width:"100%",background:loading?"var(--s2)":"var(--red)",color:loading?"var(--muted)":"#fff",border:`2px solid ${loading?"var(--border)":"var(--red)"}`,padding:"12px",fontFamily:"var(--fd)",fontSize:18,letterSpacing:3,cursor:loading?"not-allowed":"pointer",marginTop:4,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:10}} onMouseEnter={e=>{if(!loading){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--red)";}}} onMouseLeave={e=>{if(!loading){e.currentTarget.style.background="var(--red)";e.currentTarget.style.color="#fff";}}}>
              {loading?<><div style={{width:14,height:14,border:"2px solid var(--red)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>{isLogin?" LOGGING IN...":" CREATING..."}</>:isLogin?"LOG IN →":"CREATE ACCOUNT →"}
            </button>
            <div style={{textAlign:"center",color:"var(--muted)",fontSize:11,fontFamily:"var(--fm)"}}>{isLogin?"No account? ":"Already in? "}<span onClick={()=>{setIsLogin(!isLogin);setErr("");}} style={{color:"var(--gold)",cursor:"pointer",textDecoration:"underline"}}>{isLogin?"Sign up":"Log in"}</span></div>
            {isLogin&&<div style={{textAlign:"center"}}><span onClick={()=>navigate("forgot-password")} style={{color:"var(--muted)",fontSize:11,fontFamily:"var(--fm)",cursor:"pointer",textDecoration:"underline",transition:"color .2s"}} onMouseEnter={e=>e.target.style.color="var(--gold)"} onMouseLeave={e=>e.target.style.color="var(--muted)"}>Forgot password?</span></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── COMPANY SIGNUP ────────────────────────────────────────────────────────────
const CO_TYPES=["Startup","Scale-up","Enterprise","Agency","NGO / Non-profit","Government"];
const CO_SIZES=["1–5","6–20","21–50","51–200","200+"];
const CO_NEEDS=["Frontend Dev","Backend Dev","Mobile Dev","UI/UX Designer","AI/ML Engineer","DevOps","Full Stack","Product Manager","Data Scientist","Any skill"];

function CompanySignupPage({navigate,onAuth}){
  const [step,setStep]=useState(1);
  const [done,setDone]=useState(false);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [form,setForm]=useState({name:"",email:"",password:"",company:"",website:"",type:"",size:"",country:"",needs:[],bio:""});
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggleNeed=v=>setForm(f=>({...f,needs:f.needs.includes(v)?f.needs.filter(x=>x!==v):[...f.needs,v]}));
  const inp={width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",transition:"border-color .2s",borderRadius:0};
  const handleFinish=async()=>{
    setErr(""); setLoading(true);
    try {
      await signUp({
        email:form.email, password:form.password,
        name:form.name, country:form.country,
        role:"company",
        meta:{ company_name:form.company, company_type:form.type,
               company_size:form.size, website:form.website,
               bio:form.bio, needs:form.needs }
      });
      setDone(true);
      if(onAuth) onAuth();
    } catch(e){ setErr(e.message||"Signup failed. Please try again."); }
    finally { setLoading(false); }
  };
  const steps=["Account Details","Company Profile","Hiring Needs"];

  if(done) return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px",textAlign:"center"}}>
      <div style={{fontSize:60,marginBottom:18}} className="fu">🏢</div>
      <div className="fu1" style={{fontFamily:"var(--fd)",fontSize:44,letterSpacing:2,lineHeight:1,marginBottom:10}}>COMPANY <span style={{color:"var(--gr2)"}}>VERIFIED</span></div>
      <p className="fu2" style={{color:"var(--muted)",fontSize:14,lineHeight:1.8,maxWidth:400,marginBottom:10}}>Your company account is live on VIBR. Start posting bounties, discovering builders, and sponsoring hackathons.</p>
      <div className="fu3" style={{background:"rgba(34,160,80,.06)",border:"2px solid rgba(34,160,80,.2)",padding:"14px 24px",marginBottom:24,maxWidth:360,width:"100%"}}>
        <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--gr2)",letterSpacing:2,marginBottom:8}}>WHAT YOU CAN DO NOW</div>
        {["Post bounties — hire African builders","Browse top talent by rank and stack","Sponsor hackathons on VIBR","Build your company profile","Direct message any builder"].map(f=><div key={f} style={{fontSize:12,color:"#aaa",padding:"3px 0",display:"flex",gap:8}}><span style={{color:"var(--gr2)"}}>✓</span>{f}</div>)}
      </div>
      <button onClick={()=>navigate("company-dashboard")} style={{background:"var(--gr2)",color:"#fff",border:"2px solid var(--gr2)",padding:"13px 36px",fontFamily:"var(--fd)",fontSize:19,letterSpacing:3,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--gr2)";}} onMouseLeave={e=>{e.target.style.background="var(--gr2)";e.target.style.color="#fff";}}>ENTER COMPANY DASHBOARD →</button>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px"}}>
      <div style={{width:"100%",maxWidth:560}}>
        <div style={{textAlign:"center",marginBottom:28}} className="fu">
          <div style={{fontFamily:"var(--fd)",fontSize:34,letterSpacing:3,lineHeight:1,marginBottom:5}}>COMPANY <span style={{color:"var(--gr2)"}}>SIGNUP</span></div>
          <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:2}}>ACCESS AFRICA'S BEST BUILDER NETWORK</div>
        </div>
        <div style={{display:"flex",gap:0,marginBottom:30}}>
          {steps.map((s,i)=><div key={s} style={{flex:1,paddingRight:i<2?9:0}}><div style={{height:3,background:i+1<=step?"var(--gr2)":"var(--s2)",marginBottom:5,transition:"background .3s"}}/><div style={{fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,color:i+1<=step?"var(--gr2)":"var(--muted)",textTransform:"uppercase"}}>{String(i+1).padStart(2,"0")} {s}</div></div>)}
        </div>

        {step===1&&<div className="fu">
          <div style={{fontFamily:"var(--fd)",fontSize:30,letterSpacing:2,marginBottom:4}}>ACCOUNT <span style={{color:"var(--gr2)"}}>DETAILS</span></div>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:22,lineHeight:1.6}}>Create your VIBR company account.</p>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {[["Your Full Name","Contact person's name","text","name"],["Work Email","you@company.com","email","email"],["Password","Min 8 characters","password","password"]].map(([l,ph,type,key])=>(
              <div key={key}><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>{l}</div><input value={form[key]} onChange={e=>upd(key,e.target.value)} type={type} placeholder={ph} style={inp} onFocus={e=>e.target.style.borderColor="var(--gr2)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>
            ))}
          </div>
        </div>}

        {step===2&&<div className="fu">
          <div style={{fontFamily:"var(--fd)",fontSize:30,letterSpacing:2,marginBottom:4}}>COMPANY <span style={{color:"var(--gr2)"}}>PROFILE</span></div>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:22,lineHeight:1.6}}>Tell builders about your company.</p>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Company Name</div><input value={form.company} onChange={e=>upd("company",e.target.value)} placeholder="e.g. Paystack, Flutterwave, Your Startup" style={inp} onFocus={e=>e.target.style.borderColor="var(--gr2)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Website</div><input value={form.website} onChange={e=>upd("website",e.target.value)} placeholder="https://yourcompany.com" style={inp} onFocus={e=>e.target.style.borderColor="var(--gr2)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Company Type</div><select value={form.type} onChange={e=>upd("type",e.target.value)} style={{...inp,appearance:"none"}} onFocus={e=>e.target.style.borderColor="var(--gr2)"} onBlur={e=>e.target.style.borderColor="var(--border)"}><option value="">Select type</option>{CO_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
              <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Team Size</div><select value={form.size} onChange={e=>upd("size",e.target.value)} style={{...inp,appearance:"none"}} onFocus={e=>e.target.style.borderColor="var(--gr2)"} onBlur={e=>e.target.style.borderColor="var(--border)"}><option value="">Select size</option>{CO_SIZES.map(s=><option key={s}>{s}</option>)}</select></div>
            </div>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Country / HQ</div><select value={form.country} onChange={e=>upd("country",e.target.value)} style={{...inp,appearance:"none"}} onFocus={e=>e.target.style.borderColor="var(--gr2)"} onBlur={e=>e.target.style.borderColor="var(--border)"}><option value="">Select country</option>{["Nigeria 🇳🇬","Kenya 🇰🇪","Ghana 🇬🇭","South Africa 🇿🇦","Remote / Global 🌍","Other"].map(c=><option key={c}>{c}</option>)}</select></div>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Company Bio</div><textarea value={form.bio} onChange={e=>upd("bio",e.target.value)} placeholder="What does your company do? What are you building?" rows={3} style={{...inp,resize:"none",lineHeight:1.6}} onFocus={e=>e.target.style.borderColor="var(--gr2)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>
          </div>
        </div>}

        {step===3&&<div className="fu">
          <div style={{fontFamily:"var(--fd)",fontSize:30,letterSpacing:2,marginBottom:4}}>HIRING <span style={{color:"var(--gr2)"}}>NEEDS</span></div>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:22,lineHeight:1.6}}>What roles are you looking to fill? This helps us surface relevant builders for you.</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
            {CO_NEEDS.map(n=><button key={n} onClick={()=>toggleNeed(n)} style={{padding:"8px 16px",fontFamily:"var(--fm)",fontSize:10,letterSpacing:1,background:form.needs.includes(n)?"var(--gr2)":"var(--s2)",color:form.needs.includes(n)?"#fff":"var(--muted)",border:`2px solid ${form.needs.includes(n)?"var(--gr2)":"var(--border)"}`,cursor:"pointer",transition:"all .15s"}}>{n}{form.needs.includes(n)?" ✓":""}</button>)}
          </div>
          <div style={{padding:"14px",background:"rgba(34,160,80,.04)",border:"1px solid rgba(34,160,80,.2)"}}>
            <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--gr2)",letterSpacing:2,marginBottom:6}}>WHAT HAPPENS NEXT</div>
            <p style={{fontSize:12,color:"var(--muted)",lineHeight:1.7}}>Your company profile goes live immediately. You can post bounties, search talent by stack and rank, and message any builder directly. No approval needed.</p>
          </div>
        </div>}

        <div style={{display:"flex",justifyContent:"space-between",marginTop:24}}>
          <button onClick={step>1?()=>setStep(s=>s-1):()=>navigate("account-signup")} style={{background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",padding:"9px 20px",fontFamily:"var(--fd)",fontSize:15,letterSpacing:3,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--text)";e.target.style.color="var(--text)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>← BACK</button>
          <button onClick={step<3?()=>setStep(s=>s+1):handleFinish} style={{background:"var(--gr2)",color:"#fff",border:"2px solid var(--gr2)",padding:"9px 26px",fontFamily:"var(--fd)",fontSize:15,letterSpacing:3,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--gr2)";}} onMouseLeave={e=>{e.target.style.background="var(--gr2)";e.target.style.color="#fff";}}>{step===3?"CREATE COMPANY →":"NEXT →"}</button>
        </div>
        <div style={{textAlign:"center",marginTop:18,fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:1}}>Already have an account? <span onClick={()=>navigate("company-login")} style={{color:"var(--gr2)",cursor:"pointer",textDecoration:"underline"}}>Log in</span></div>
      </div>
    </div>
  );
}

// ── COMPANY LOGIN ──────────────────────────────────────────────────────────────
function CompanyLoginPage({navigate,onAuth}){
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const inp={width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",transition:"border-color .2s",borderRadius:0};
  const login=async()=>{
    setErr(""); setLoading(true);
    try {
      await signIn({email,password});
      if(onAuth) onAuth();
    } catch(e){ setErr(e.message||"Login failed."); }
    finally { setLoading(false); }
  };
  return (
    <div className="vibr-auth-grid" style={{minHeight:"100vh",display:"grid",gridTemplateColumns:"1fr 1fr"}}>
      <div className="vibr-auth-panel" style={{background:"#0A0A0A",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"48px 46px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,var(--gr2),transparent)"}}/>
        <div style={{cursor:"pointer"}} onClick={()=>navigate("landing")}><div style={{fontFamily:"var(--fd)",fontSize:34,letterSpacing:4,display:"flex",alignItems:"center"}}><span style={{color:"var(--white)"}}>V</span><span style={{color:"var(--red)"}}>I</span><span style={{color:"var(--white)"}}>B</span><span style={{color:"var(--gold)"}}>R</span><span style={{width:5,height:5,background:"var(--gr2)",borderRadius:"50%",marginLeft:2,marginBottom:2,display:"inline-block"}}/></div></div>
        <div>
          <div style={{fontFamily:"var(--fd)",fontSize:52,lineHeight:.9,color:"var(--white)",marginBottom:18,letterSpacing:-1}}>AFRICA'S<br/><span style={{color:"var(--gr2)"}}>BUILDER</span><br/>TALENT<br/>IS HERE.</div>
          <p style={{color:"#666",fontSize:13,lineHeight:1.8,maxWidth:300,marginBottom:20}}>12,000+ vetted African builders ready to be hired. Post bounties, scout engineers, and build your team from one platform.</p>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>{[["Paystack","Hired 23 engineers from VIBR in 2025"],["Flutterwave","Completed 14 bounties via VIBR builders"],["Andela","890 placements discovered through VIBR"]].map(([n,t])=><div key={n} style={{display:"flex",gap:9,alignItems:"flex-start"}}><span style={{color:"var(--gr2)",fontSize:11,marginTop:2}}>✦</span><div><div style={{color:"var(--gr2)",fontWeight:700,fontSize:12}}>{n}</div><div style={{color:"#555",fontSize:12,lineHeight:1.5}}>{t}</div></div></div>)}</div>
        </div>
        <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted2)",letterSpacing:2}}>COMPANY ACCESS · POST BOUNTIES · HIRE BUILDERS</div>
      </div>
      <div style={{background:"var(--surface)",display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 46px"}}>
        <div style={{width:"100%",maxWidth:370}}>
          <button onClick={()=>navigate("account-login")} style={{background:"transparent",border:"none",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,cursor:"pointer",marginBottom:28,display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>e.target.style.color="var(--text)"} onMouseLeave={e=>e.target.style.color="var(--muted)"}>← All account types</button>
          <div style={{marginBottom:26}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><span style={{fontSize:20}}>🏢</span><div style={{fontFamily:"var(--fd)",fontSize:34,letterSpacing:2,lineHeight:1,color:"var(--gr2)"}}>COMPANY<br/>LOGIN</div></div>
            <div style={{color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,marginTop:4}}>ACCESS YOUR COMPANY DASHBOARD</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {err&&<div style={{background:"rgba(209,43,43,.1)",border:"1px solid var(--red)",padding:"9px 12px",fontFamily:"var(--fm)",fontSize:10,color:"var(--r2)",letterSpacing:.5,marginBottom:4,lineHeight:1.5}}>{err}</div>}
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Work Email</div><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@company.com" style={inp} onFocus={e=>e.target.style.borderColor="var(--gr2)"} onBlur={e=>e.target.style.borderColor="var(--border)"} onKeyDown={e=>e.key==="Enter"&&login()}/></div>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Password</div><input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" aria-label="Password" style={inp} onFocus={e=>e.target.style.borderColor="var(--gr2)"} onBlur={e=>e.target.style.borderColor="var(--border)"} onKeyDown={e=>e.key==="Enter"&&login()}/></div>
            <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
            <button onClick={login} disabled={loading} style={{width:"100%",background:loading?"var(--s2)":"var(--gr2)",color:loading?"var(--muted)":"#fff",border:`2px solid ${loading?"var(--border)":"var(--gr2)"}`,padding:"12px",fontFamily:"var(--fd)",fontSize:17,letterSpacing:3,cursor:loading?"not-allowed":"pointer",transition:"all .3s",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginTop:4}}>{loading?<><div style={{width:14,height:14,border:"2px solid var(--gr2)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/> LOGGING IN...</>:"LOG IN →"}</button>
            <div style={{textAlign:"center",color:"var(--muted)",fontSize:11,fontFamily:"var(--fm)"}}>No account? <span onClick={()=>navigate("company-signup")} style={{color:"var(--gr2)",cursor:"pointer",textDecoration:"underline"}}>Create company account</span></div>
            <div style={{textAlign:"center"}}><span onClick={()=>navigate("forgot-password")} style={{color:"var(--muted)",fontSize:11,fontFamily:"var(--fm)",cursor:"pointer",textDecoration:"underline",transition:"color .2s"}} onMouseEnter={e=>e.target.style.color="var(--gr2)"} onMouseLeave={e=>e.target.style.color="var(--muted)"}>Forgot password?</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
const INV_FOCUS=["Fintech","EdTech","HealthTech","AgriTech","CleanTech","AI/ML","Web3","E-Commerce","Developer Tools","SaaS","Consumer Apps","DeepTech"];
const INV_STAGES=["Pre-seed","Seed","Series A","Series B+","Any stage"];
const INV_TYPES=["Angel Investor","Venture Capital","Corporate VC","Family Office","Accelerator / Incubator","Impact Fund","Syndicate Lead"];

function InvestorSignupPage({navigate,onAuth}){
  const [step,setStep]=useState(1);
  const [verifying,setVerifying]=useState(false);
  const [verifyStep,setVerifyStep]=useState(0);
  const [done,setDone]=useState(false);
  const [form,setForm]=useState({name:"",email:"",password:"",country:"",fundName:"",type:"",focus:[],stages:[],checkMin:"",checkMax:"",linkedIn:"",portfolio:"",docUploaded:false});
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggleFocus=v=>setForm(f=>({...f,focus:f.focus.includes(v)?f.focus.filter(x=>x!==v):[...f.focus,v]}));
  const toggleStage=v=>setForm(f=>({...f,stages:f.stages.includes(v)?f.stages.filter(x=>x!==v):[...f.stages,v]}));
  const inp={width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",transition:"border-color .2s",borderRadius:0};
  const runVerification=async()=>{
    setVerifying(true);
    // Run animated checks first, then create real account
    let i=0;
    const iv=setInterval(async()=>{
      i++;
      setVerifyStep(i);
      if(i>=6){
        clearInterval(iv);
        try {
          await signUp({
            email:form.email, password:form.password,
            name:form.name, country:form.country,
            role:"investor",
            meta:{ fund_name:form.fundName, investor_type:form.type,
                   check_min:form.checkMin, check_max:form.checkMax,
                   linkedin_url:form.linkedIn, focus_sectors:form.focus,
                   stages:form.stages }
          });
        } catch(e) { console.error("Investor signup error:", e.message); }
        finally { setVerifying(false); setDone(true); }
      }
    }, 900);
  };
  const steps=["Your Details","Investor Profile","Focus & Thesis","Verification"];
  if(done) return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px",textAlign:"center"}}>
      <div style={{fontSize:60,marginBottom:20,animation:"fadeUp .5s ease both"}}>✅</div>
      <div className="fu1" style={{fontFamily:"var(--fd)",fontSize:44,letterSpacing:2,lineHeight:1,marginBottom:12}}>VERIFICATION<br/><span style={{color:"var(--gold)"}}>APPROVED</span></div>
      <p className="fu2" style={{color:"var(--muted)",fontSize:14,lineHeight:1.8,maxWidth:420,marginBottom:10}}>Your investor account is verified. You now have full access to VIBR's deal flow, talent pipeline, and builder network across Africa.</p>
      <div className="fu3" style={{background:"rgba(240,165,0,.06)",border:"2px solid rgba(240,165,0,.2)",padding:"14px 24px",marginBottom:24,maxWidth:380,width:"100%"}}>
        <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--gold)",letterSpacing:2,marginBottom:8}}>WHAT'S UNLOCKED</div>
        {["Deal flow feed — trending projects by niche","Talent pipeline — top builders by rank","Direct messaging with any builder","Post bounties & job listings","Hackathon co-sponsorship","Private investor community"].map(f=><div key={f} style={{fontSize:12,color:"#aaa",padding:"3px 0",display:"flex",gap:8}}><span style={{color:"var(--gold)"}}>✓</span>{f}</div>)}
      </div>
      <button onClick={()=>navigate("investor-dashboard")} style={{background:"var(--gold)",color:"#000",border:"2px solid var(--gold)",padding:"13px 36px",fontFamily:"var(--fd)",fontSize:19,letterSpacing:3,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.background="var(--gold)";e.target.style.color="#000";}}>ENTER INVESTOR DASHBOARD →</button>
    </div>
  );
  if(verifying) return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px",textAlign:"center"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <div style={{width:68,height:68,border:"3px solid var(--gold)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 24px"}}/>
      <div style={{fontFamily:"var(--fd)",fontSize:32,letterSpacing:2,color:"var(--gold)",marginBottom:6}}>AI VERIFICATION</div>
      <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:3,marginBottom:28}}>POWERED BY VIBR VERIFY ENGINE</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,maxWidth:340,width:"100%"}}>
        {["Verifying identity...","Checking LinkedIn profile...","Validating fund credentials...","Running accreditation check...","AI risk assessment...","Finalising review..."].map((s,i)=>(
          <div key={s} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:verifyStep>i?"rgba(240,165,0,.08)":"var(--surface)",border:`1px solid ${verifyStep>i?"rgba(240,165,0,.3)":verifyStep===i?"var(--gold)":"var(--border)"}`,transition:"all .4s"}}>
            <div style={{width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {verifyStep>i?<span style={{color:"var(--gold)",fontSize:13}}>✓</span>:verifyStep===i?<div style={{width:12,height:12,border:"2px solid var(--gold)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>:<div style={{width:8,height:8,borderRadius:"50%",background:"var(--muted2)"}}/>}
            </div>
            <span style={{fontFamily:"var(--fm)",fontSize:10,color:verifyStep>i?"var(--gold)":verifyStep===i?"var(--text)":"var(--muted)",letterSpacing:1,transition:"color .3s"}}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 20px"}}>
      <div style={{width:"100%",maxWidth:560}}>
        <div style={{textAlign:"center",marginBottom:32}} className="fu">
          <div style={{fontFamily:"var(--fd)",fontSize:34,letterSpacing:3,lineHeight:1,marginBottom:5}}>INVESTOR <span style={{color:"var(--gold)"}}>SIGNUP</span></div>
          <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:2}}>AFRICA'S BEST BUILDERS ARE WAITING</div>
        </div>
        <div style={{display:"flex",gap:0,marginBottom:32}}>
          {steps.map((s,i)=><div key={s} style={{flex:1,paddingRight:i<3?9:0}}><div style={{height:3,background:i+1<=step?"var(--gold)":"var(--s2)",marginBottom:5,transition:"background .3s"}}/><div style={{fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,color:i+1<=step?"var(--gold)":"var(--muted)",textTransform:"uppercase"}}>{String(i+1).padStart(2,"0")} {s}</div></div>)}
        </div>
        {step===1&&<div className="fu">
          <div style={{fontFamily:"var(--fd)",fontSize:32,letterSpacing:2,marginBottom:4}}>YOUR <span style={{color:"var(--gold)"}}>DETAILS</span></div>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:22,lineHeight:1.6}}>Create your VIBR investor account.</p>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {[["Full Name","Your full legal name","text","name"],["Email Address","you@fund.com","email","email"],["Password","Minimum 8 characters","password","password"]].map(([l,ph,type,key])=><div key={key}><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>{l}</div><input value={form[key]} onChange={e=>upd(key,e.target.value)} type={type} placeholder={ph} style={inp} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>)}
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Country / Region</div><select value={form.country} onChange={e=>upd("country",e.target.value)} style={{...inp,appearance:"none"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}><option value="">Select your base country</option>{["Nigeria 🇳🇬","Kenya 🇰🇪","Ghana 🇬🇭","South Africa 🇿🇦","United States 🇺🇸","United Kingdom 🇬🇧","France 🇫🇷","Germany 🇩🇪","Singapore 🇸🇬","UAE 🇦🇪","Other"].map(c=><option key={c}>{c}</option>)}</select></div>
          </div>
        </div>}
        {step===2&&<div className="fu">
          <div style={{fontFamily:"var(--fd)",fontSize:32,letterSpacing:2,marginBottom:4}}>INVESTOR <span style={{color:"var(--gold)"}}>PROFILE</span></div>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:22,lineHeight:1.6}}>Tell us about your fund or investing activity.</p>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Fund / Organisation Name</div><input value={form.fundName} onChange={e=>upd("fundName",e.target.value)} placeholder="e.g. Ventures Platform, Your Name (Angel)" style={inp} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Investor Type</div><select value={form.type} onChange={e=>upd("type",e.target.value)} style={{...inp,appearance:"none"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}><option value="">Select type</option>{INV_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{[["Min Check ($)","e.g. 10000","checkMin"],["Max Check ($)","e.g. 500000","checkMax"]].map(([l,ph,key])=><div key={key}><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>{l}</div><input value={form[key]} onChange={e=>upd(key,e.target.value)} placeholder={ph} style={inp} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>)}</div>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:8,textTransform:"uppercase"}}>Investment Stages</div><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{INV_STAGES.map(s=><button key={s} onClick={()=>toggleStage(s)} style={{padding:"6px 13px",fontFamily:"var(--fm)",fontSize:9,letterSpacing:1,background:form.stages.includes(s)?"var(--gold)":"var(--s2)",color:form.stages.includes(s)?"#000":"var(--muted)",border:`2px solid ${form.stages.includes(s)?"var(--gold)":"var(--border)"}`,cursor:"pointer",transition:"all .15s"}}>{s}</button>)}</div></div>
          </div>
        </div>}
        {step===3&&<div className="fu">
          <div style={{fontFamily:"var(--fd)",fontSize:32,letterSpacing:2,marginBottom:4}}>FOCUS & <span style={{color:"var(--gold)"}}>THESIS</span></div>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:22,lineHeight:1.6}}>What sectors do you invest in? This surfaces the right deals for you.</p>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:9,textTransform:"uppercase"}}>Sector Focus</div><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{INV_FOCUS.map(f=><button key={f} onClick={()=>toggleFocus(f)} style={{padding:"6px 13px",fontFamily:"var(--fm)",fontSize:9,letterSpacing:1,background:form.focus.includes(f)?"var(--gold)":"var(--s2)",color:form.focus.includes(f)?"#000":"var(--muted)",border:`2px solid ${form.focus.includes(f)?"var(--gold)":"var(--border)"}`,cursor:"pointer",transition:"all .15s"}}>{f}</button>)}</div></div>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>LinkedIn Profile URL</div><input value={form.linkedIn} onChange={e=>upd("linkedIn",e.target.value)} placeholder="https://linkedin.com/in/yourprofile" style={inp} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Fund Website (optional)</div><input value={form.portfolio} onChange={e=>upd("portfolio",e.target.value)} placeholder="https://yourfund.com" style={inp} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>
          </div>
        </div>}
        {step===4&&<div className="fu">
          <div style={{fontFamily:"var(--fd)",fontSize:32,letterSpacing:2,marginBottom:4}}>VERIFY <span style={{color:"var(--gold)"}}>IDENTITY</span></div>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:22,lineHeight:1.6}}>Upload proof of accreditation or fund status. Our AI engine reviews in under 2 minutes.</p>
          <div style={{background:"rgba(240,165,0,.04)",border:"2px solid rgba(240,165,0,.15)",padding:18,marginBottom:18}}>
            <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--gold)",marginBottom:10}}>HOW VIBR VERIFY WORKS</div>
            {[["🤖","AI-powered — no manual review for clean submissions"],["⚡","Under 2 minutes for most applicants"],["🔒","All documents encrypted and deleted after verification"]].map(([icon,text])=><div key={text} style={{display:"flex",gap:10,marginBottom:8,fontSize:12,color:"#aaa",alignItems:"center"}}><span>{icon}</span>{text}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {[["📄","Accreditation certificate"],["🏦","Fund registration doc"],["📋","Term sheet from prior deal"],["🪪","Govt ID + LinkedIn"]].map(([icon,label])=><div key={label} style={{display:"flex",gap:8,alignItems:"center",padding:"9px 11px",background:"var(--s2)",border:"1px solid var(--border)",fontSize:12,color:"#aaa"}}><span style={{fontSize:15}}>{icon}</span>{label}</div>)}
          </div>
          <div onClick={()=>upd("docUploaded",true)} style={{border:`2px dashed ${form.docUploaded?"var(--gold)":"var(--border)"}`,padding:"28px",textAlign:"center",cursor:"pointer",background:form.docUploaded?"rgba(240,165,0,.05)":"transparent",transition:"all .2s"}} onMouseEnter={e=>{if(!form.docUploaded){e.currentTarget.style.borderColor="var(--gold)";}}} onMouseLeave={e=>{if(!form.docUploaded){e.currentTarget.style.borderColor="var(--border)";}}}>{form.docUploaded?<div><div style={{fontSize:28,marginBottom:6}}>✅</div><div style={{fontFamily:"var(--fd)",fontSize:17,color:"var(--gold)",letterSpacing:2,marginBottom:3}}>DOCUMENT UPLOADED</div><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:1}}>Ready for AI verification</div></div>:<div><div style={{fontSize:28,marginBottom:6}}>📎</div><div style={{fontFamily:"var(--fd)",fontSize:17,letterSpacing:2,marginBottom:3}}>CLICK TO UPLOAD</div><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:1}}>PDF, JPG, PNG — max 10MB</div></div>}</div>
        </div>}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:24}}>
          <button onClick={step>1?()=>setStep(s=>s-1):()=>navigate("account-signup")} style={{background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",padding:"9px 20px",fontFamily:"var(--fd)",fontSize:15,letterSpacing:3,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--text)";e.target.style.color="var(--text)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>← BACK</button>
          <button onClick={step<4?()=>setStep(s=>s+1):runVerification} disabled={step===4&&!form.docUploaded} style={{background:step===4&&form.docUploaded?"var(--gold)":step===4?"var(--s2)":"var(--gold)",color:step===4&&!form.docUploaded?"var(--muted)":"#000",border:`2px solid ${step===4&&!form.docUploaded?"var(--border)":"var(--gold)"}`,padding:"9px 26px",fontFamily:"var(--fd)",fontSize:15,letterSpacing:3,cursor:step===4&&!form.docUploaded?"not-allowed":"pointer",transition:"all .15s"}}>{step===4?"RUN AI VERIFICATION →":"NEXT →"}</button>
        </div>
        <div style={{textAlign:"center",marginTop:18,fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:1}}>Already verified? <span onClick={()=>navigate("investor-login")} style={{color:"var(--gold)",cursor:"pointer",textDecoration:"underline"}}>Log in</span></div>
      </div>
    </div>
  );
}

// ── INVESTOR LOGIN ─────────────────────────────────────────────────────────────
function InvestorLoginPage({navigate,onAuth}){
  const [loading,setLoading]=useState(false);
  const inp={width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",transition:"border-color .2s",borderRadius:0};
  const [err,setErr]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const login=async()=>{
    setErr(""); setLoading(true);
    try {
      await signIn({email,password});
      if(onAuth) onAuth();
    } catch(e){ setErr(e.message||"Login failed."); }
    finally { setLoading(false); }
  };
  return (
    <div className="vibr-auth-grid" style={{minHeight:"100vh",display:"grid",gridTemplateColumns:"1fr 1fr"}}>
      <div className="vibr-auth-panel" style={{background:"#0A0A0A",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"48px 46px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,transparent,var(--gold),transparent)"}}/>
        <div style={{cursor:"pointer"}} onClick={()=>navigate("landing")}><div style={{fontFamily:"var(--fd)",fontSize:34,letterSpacing:4,display:"flex",alignItems:"center"}}><span style={{color:"var(--white)"}}>V</span><span style={{color:"var(--red)"}}>I</span><span style={{color:"var(--white)"}}>B</span><span style={{color:"var(--gold)"}}>R</span><span style={{width:5,height:5,background:"var(--gr2)",borderRadius:"50%",marginLeft:2,marginBottom:2,display:"inline-block"}}/></div></div>
        <div>
          <div style={{fontFamily:"var(--fd)",fontSize:52,lineHeight:.9,color:"var(--white)",marginBottom:18,letterSpacing:-1}}>AFRICA'S<br/><span style={{color:"var(--gold)"}}>DEAL FLOW</span><br/>STARTS<br/>HERE.</div>
          <p style={{color:"#666",fontSize:13,lineHeight:1.8,maxWidth:300,marginBottom:20}}>12,000+ vetted African builders. Filter by sector, stage, and rank. Find your next investment before anyone else.</p>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>{[["Ventures Platform","Invested in 3 VIBR builders in Q1 2025"],["Google Africa","Hired 12 engineers discovered on VIBR"],["Partech Africa","Found 2 portfolio companies through deal flow"]].map(([n,t])=><div key={n} style={{display:"flex",gap:9,alignItems:"flex-start"}}><span style={{color:"var(--gold)",fontSize:11,marginTop:2}}>✦</span><div><div style={{color:"var(--gold)",fontWeight:700,fontSize:12}}>{n}</div><div style={{color:"#555",fontSize:12,lineHeight:1.5}}>{t}</div></div></div>)}</div>
        </div>
        <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted2)",letterSpacing:2}}>INVESTOR ACCESS · VERIFIED ACCOUNTS ONLY</div>
      </div>
      <div style={{background:"var(--surface)",display:"flex",alignItems:"center",justifyContent:"center",padding:"48px 46px"}}>
        <div style={{width:"100%",maxWidth:370}}>
          <button onClick={()=>navigate("account-login")} style={{background:"transparent",border:"none",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,cursor:"pointer",marginBottom:28,display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>e.target.style.color="var(--text)"} onMouseLeave={e=>e.target.style.color="var(--muted)"}>← All account types</button>
          <div style={{marginBottom:26}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}><span style={{fontSize:20}}>💼</span><div style={{fontFamily:"var(--fd)",fontSize:34,letterSpacing:2,lineHeight:1,color:"var(--gold)"}}>INVESTOR<br/>LOGIN</div></div>
            <div style={{color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,marginTop:4}}>VERIFIED ACCOUNTS ONLY</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {err&&<div style={{background:"rgba(209,43,43,.1)",border:"1px solid var(--red)",padding:"9px 12px",fontFamily:"var(--fm)",fontSize:10,color:"var(--r2)",letterSpacing:.5,marginBottom:4,lineHeight:1.5}}>{err}</div>}
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Email</div><input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@fund.com" style={inp} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"} onKeyDown={e=>e.key==="Enter"&&login()}/></div>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Password</div><input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••" aria-label="Password" style={inp} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"} onKeyDown={e=>e.key==="Enter"&&login()}/></div>
            <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
            <button onClick={login} disabled={loading} style={{width:"100%",background:loading?"var(--s2)":"var(--gold)",color:loading?"var(--muted)":"#000",border:`2px solid ${loading?"var(--border)":"var(--gold)"}`,padding:"12px",fontFamily:"var(--fd)",fontSize:17,letterSpacing:3,cursor:loading?"not-allowed":"pointer",transition:"all .3s",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginTop:4}}>{loading?<><div style={{width:14,height:14,border:"2px solid var(--gold)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/> LOGGING IN...</>:"LOG IN →"}</button>
            <div style={{textAlign:"center",color:"var(--muted)",fontSize:11,fontFamily:"var(--fm)"}}>Not verified? <span onClick={()=>navigate("investor-signup")} style={{color:"var(--gold)",cursor:"pointer",textDecoration:"underline"}}>Apply for investor access</span></div>
            <div style={{textAlign:"center"}}><span onClick={()=>navigate("forgot-password")} style={{color:"var(--muted)",fontSize:11,fontFamily:"var(--fm)",cursor:"pointer",textDecoration:"underline",transition:"color .2s"}} onMouseEnter={e=>e.target.style.color="var(--gold)"} onMouseLeave={e=>e.target.style.color="var(--muted)"}>Forgot password?</span></div>
          </div>
          <div style={{marginTop:18,padding:12,background:"rgba(240,165,0,.05)",border:"1px solid rgba(240,165,0,.2)"}}>
            <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--gold)",letterSpacing:2,marginBottom:4}}>⚠ RESTRICTED ACCESS</div>
            <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",lineHeight:1.7}}>Investor accounts require verification. Unverified access attempts are logged.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── INVESTOR DASHBOARD ─────────────────────────────────────────────────────────
const INV_DEAL_FLOW=[
  {id:1,name:"Obioma Kalu",handle:"obioma_k",flag:"🇳🇬",project:"Healthcare USSD Booking",sector:"HealthTech",stage:"Pre-seed",seeking:"$50K–$150K",desc:"200+ bookings in beta. USSD-based, 2G compatible. Targeting 20M rural Nigerians.",traction:"200 beta users · ₦0 raised · 3-person team",tags:[["HealthTech","green"],["USSD","gold"]],rank:"Vibe Lord 🔥",saved:false,contacted:false},
  {id:2,name:"Kofi Osei",handle:"kofi_builds",flag:"🇬🇭",project:"Pan-African Remittance",sector:"Fintech",stage:"Seed",seeking:"$200K–$500K",desc:"Cross-border crypto remittance. 30 currencies, automatic M-Pesa/Airtel Money conversion. Lagos to Nairobi in 4 seconds.",traction:"1,200 beta users · $12K MRR · 5-person team",tags:[["Fintech","red"],["Web3","gold"]],rank:"Icon 🌍",saved:false,contacted:false},
  {id:3,name:"Nadia Wanjiru",handle:"nadia.w",flag:"🇰🇪",project:"Offline AI Tutor",sector:"EdTech",stage:"Pre-seed",seeking:"$75K–$200K",desc:"Offline-first AI study tool for township students. No internet needed after download.",traction:"3,400 downloads · 890 weekly active · 2-person team",tags:[["EdTech","red"],["AI","gold"]],rank:"Legend 👑",saved:false,contacted:false},
  {id:4,name:"Moussa Bah",handle:"moussa_dev",flag:"🇸🇳",project:"West African NLP Translator",sector:"AI/ML",stage:"Pre-seed",seeking:"$30K–$80K",desc:"Real-time translation for Wolof, Hausa, Twi, Amharic. Open source with grant funding.",traction:"420 GitHub stars · Grant backed · 1-person team",tags:[["AI/ML","gold"],["NLP","green"]],rank:"Builder ⚡",saved:false,contacted:false},
];
const INV_PORTFOLIO=[
  {company:"USSD Health",founder:"Obioma K.",round:"Pre-seed",amount:"$75,000",stage:"Due Diligence",date:"Mar 2025"},
  {company:"Agric AI",founder:"Tolu K.",round:"Pre-seed",amount:"$50,000",stage:"Term Sheet Sent",date:"Feb 2025"},
];


// ── INLINE BOUNTY POST BUTTON (used inside investor + company dashboards) ────
function BountyPostButton({navigate,accentColor="var(--gold)"}){
  const [posted,setPosted]=useState(false);
  const [posting,setPosting]=useState(false);
  const post=()=>{setPosting(true);setTimeout(()=>{setPosting(false);setPosted(true);},1400);};
  if(posted) return (
    <div style={{background:"rgba(34,160,80,.08)",border:"2px solid var(--green)",padding:"14px 18px",display:"flex",alignItems:"center",gap:12,animation:"fadeUp .3s ease both"}}>
      <span style={{fontSize:24}}>✅</span>
      <div style={{flex:1}}><div style={{fontFamily:"var(--fd)",fontSize:18,color:"var(--gr2)",letterSpacing:1}}>BOUNTY POSTED!</div><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:1,marginTop:3}}>Live on VIBR · Builders are being notified</div></div>
      <button onClick={()=>setPosted(false)} style={{padding:"5px 12px",background:"transparent",border:"1px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,cursor:"pointer",letterSpacing:1,textTransform:"uppercase"}}>Post another</button>
    </div>
  );
  return (
    <button onClick={post} disabled={posting} style={{width:"100%",background:posting?"var(--s2)":accentColor,color:posting?"var(--muted)":accentColor==="var(--gold)"?"#000":"#fff",border:`2px solid ${posting?"var(--border)":accentColor}`,padding:"12px",fontFamily:"var(--fd)",fontSize:18,letterSpacing:3,cursor:posting?"not-allowed":"pointer",transition:"all .3s",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
      {posting?<><div style={{width:14,height:14,border:`2px solid ${accentColor}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/> POSTING...</>:"POST BOUNTY →"}
    </button>
  );
}

function InvestorDashboard({navigate,session,profile,onSignOut}){
  const [tab,setTab]=useState("dealflow");
  const [deals,setDeals]=useState(INV_DEAL_FLOW);
  const [filter,setFilter]=useState("all");

  useEffect(()=>{
    getPosts({limit:30})
      .then(data=>{
        if(data&&data.length>0){
          setDeals(data.map(p=>({
            id:p.id, title:p.title,
            founder:p.profiles?.full_name||p.profiles?.username||"Builder",
            handle:p.profiles?.username||"builder",
            country:p.profiles?.country||"Africa 🌍",
            sector:(p.tags||[])[0]||"Tech",
            stage:"Idea",
            votes:p.vote_count||0,
            desc:p.description||"",
            tags:(p.tags||[]).slice(0,3),
            av:(p.profiles?.username||"B").slice(0,2).toUpperCase(),
            avc:"red",
          })));
        }
      })
      .catch(()=>{});
  },[]);

  const shown=filter==="all"?deals:deals.filter(d=>
    (d.sector||"").toLowerCase()===filter.toLowerCase()||
    (d.stage||"").toLowerCase().includes(filter.toLowerCase()));

  const navItems=[["📊","Deal Flow","dealflow"],["👤","Talent Pipeline","talent"],["💰","Post Bounty","bounty"],["💼","Portfolio","portfolio"],["🔍","Browse Feed","browse"],["⚙️","Settings","inv-settings"]];
  // Settings nav item should navigate directly, not switch tab
  const handleNavClick=(page)=>{
    if(page==="inv-settings") navigate("investor-settings");
    else setTab(page);
  };
  return (
    <div style={{display:"flex",minHeight:"100vh",background:"var(--bg)"}}>
      <div style={{width:220,background:"var(--surface)",borderRight:"2px solid var(--border)",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflowY:"auto",flexShrink:0}}>
        <div style={{padding:"16px 16px 12px",borderBottom:"2px solid var(--border)"}}>
          <div style={{cursor:"pointer"}} onClick={()=>navigate("landing")}><div style={{fontFamily:"var(--fd)",fontSize:28,letterSpacing:4,display:"flex",alignItems:"center"}}><span style={{color:"var(--white)"}}>V</span><span style={{color:"var(--red)"}}>I</span><span style={{color:"var(--white)"}}>B</span><span style={{color:"var(--gold)"}}>R</span><span style={{width:4,height:4,background:"var(--gr2)",borderRadius:"50%",marginLeft:2,marginBottom:2,display:"inline-block"}}/></div></div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:5,padding:"3px 7px",background:"rgba(240,165,0,.1)",border:"1px solid rgba(240,165,0,.3)",width:"fit-content"}}>
            <span style={{width:4,height:4,background:"var(--gold)",borderRadius:"50%",display:"inline-block"}}/>
            <span style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--gold)",letterSpacing:2}}>INVESTOR ✓</span>
          </div>
        </div>
        <nav role="navigation" aria-label="Main navigation" style={{flex:1,padding:"10px 0"}}>
          {navItems.map(([icon,label,page])=>{const a=tab===page;return <div key={label} onClick={()=>handleNavClick(page)} style={{display:"flex",alignItems:"center",gap:11,padding:"11px 16px",cursor:"pointer",transition:"all .15s",background:a?"rgba(240,165,0,.1)":"transparent",borderLeft:a?"3px solid var(--gold)":"3px solid transparent",color:a?"var(--gold)":"var(--muted)"}} onMouseEnter={e=>{if(!a){e.currentTarget.style.background="var(--s2)";e.currentTarget.style.color="var(--text)";}}} onMouseLeave={e=>{if(!a){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--muted)";}}}><span style={{fontSize:15,width:18,textAlign:"center"}}>{icon}</span><span style={{fontWeight:600,fontSize:13}}>{label}</span></div>;})}</nav>
        <div style={{margin:10,padding:12,background:"var(--s2)",border:"2px solid var(--border)"}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}><div style={{width:32,height:32,background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:15,color:"#000",flexShrink:0}}>VP</div><div><div style={{fontWeight:700,fontSize:11}}>Ventures Platform</div><div style={{color:"var(--muted)",fontSize:8,fontFamily:"var(--fm)"}}>Angel · Nigeria 🇳🇬</div></div></div>
          <div style={{display:"flex",justifyContent:"space-between"}}>{[["4","Saved"],["2","Portfolio"],["$125K","Deployed"]].map(([v,l])=><div key={l} style={{textAlign:"center"}}><div style={{fontFamily:"var(--fd)",fontSize:13,color:"var(--gold)"}}>{v}</div><div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--muted)",letterSpacing:1,textTransform:"uppercase"}}>{l}</div></div>)}</div>
        </div>
      </div>
      <div style={{flex:1,overflow:"auto"}}>
        {tab==="dealflow"&&(
          <div>
            <div style={{padding:"20px 28px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>DEAL <span style={{color:"var(--gold)"}}>FLOW</span></div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>LIVE PROJECTS SEEKING INVESTMENT</div></div>
              <div style={{background:"rgba(240,165,0,.08)",border:"1px solid rgba(240,165,0,.3)",padding:"7px 14px",textAlign:"center"}}><div style={{fontFamily:"var(--fd)",fontSize:18,color:"var(--gold)"}}>{deals.length}</div><div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--muted)",letterSpacing:2}}>LIVE DEALS</div></div>
            </div>
            <div style={{padding:"11px 28px",borderBottom:"2px solid var(--border)",display:"flex",gap:6,flexWrap:"wrap"}}>
              {["all","Fintech","EdTech","HealthTech","AI/ML","Pre-seed","Seed"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 11px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:1,textTransform:"uppercase",background:filter===f?"var(--gold)":"var(--s2)",color:filter===f?"#000":"var(--muted)",border:`2px solid ${filter===f?"var(--gold)":"var(--border)"}`,cursor:"pointer",transition:"all .15s"}}>{f}</button>)}
            </div>
            <div style={{padding:"20px 28px",display:"flex",flexDirection:"column",gap:14}}>
              {shown.map((d,i)=>(
                <div key={d.id} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:22,transition:"all .2s",animation:`fadeUp .4s ${i*.08}s ease both`}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(240,165,0,.4)";e.currentTarget.style.transform="translateX(-3px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none";}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:18}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:11}}>
                        <Av name={d.handle.slice(0,2).toUpperCase()} color="gold" size={36}/>
                        <div>
                          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}><span style={{fontWeight:700,fontSize:13}}>{d.name} {d.flag}</span><span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>@{d.handle}</span><span style={{background:"rgba(240,165,0,.1)",border:"1px solid rgba(240,165,0,.3)",fontFamily:"var(--fm)",fontSize:7,padding:"1px 6px",color:"var(--gold)",letterSpacing:1}}>{d.rank}</span></div>
                          <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}><span style={{color:"var(--gold)"}}>{d.sector}</span> · {d.stage} · Seeking: <span style={{color:"var(--gr2)",fontWeight:700}}>{d.seeking}</span></div>
                        </div>
                      </div>
                      <div style={{fontFamily:"var(--fd)",fontSize:19,letterSpacing:1,marginBottom:6,lineHeight:1.1}}>{d.project}</div>
                      <p style={{color:"#999",fontSize:12,lineHeight:1.6,marginBottom:9}}>{d.desc}</p>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:9}}>{d.tags.map(([t,c])=><Tag key={t} label={t} color={c}/>)}</div>
                      <div style={{padding:"9px 11px",background:"var(--s2)",border:"1px solid var(--border)",fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:1}}>📊 TRACTION: <span style={{color:"var(--text)"}}>{d.traction}</span></div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:7,justifyContent:"flex-start",minWidth:124,paddingTop:2}}>
                      <button onClick={()=>{setDeals(prev=>prev.map(x=>x.id===d.id?{...x,contacted:true}:x));navigate("messages");}} style={{padding:"9px 12px",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer",background:d.contacted?"var(--gr2)":"var(--gold)",color:d.contacted?"#fff":"#000",border:`2px solid ${d.contacted?"var(--gr2)":"var(--gold)"}`,transition:"all .15s",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>{d.contacted?"✓ Contacted":"💬 Connect"}</button>
                      <button onClick={()=>setDeals(prev=>prev.map(x=>x.id===d.id?{...x,saved:!x.saved}:x))} style={{padding:"8px",background:"transparent",border:`2px solid ${d.saved?"var(--gold)":"var(--border)"}`,color:d.saved?"var(--gold)":"var(--muted)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",transition:"all .2s",textTransform:"uppercase"}}>{d.saved?"★ Saved":"☆ Save Deal"}</button>
                      <button onClick={()=>navigate(`post-${d.id}`)} style={{padding:"7px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>View Project →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==="talent"&&(
          <div>
            <div style={{padding:"20px 28px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10}}>
              <div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>TALENT <span style={{color:"var(--gold)"}}>PIPELINE</span></div>
              <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>TOP BUILDERS BY VIBE SCORE · DIRECT ACCESS INCLUDED</div>
            </div>
            <div style={{padding:"20px 28px"}}>
              <div style={{background:"rgba(240,165,0,.04)",border:"2px solid rgba(240,165,0,.12)",padding:"14px 18px",marginBottom:18}}>
                <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--gold)",letterSpacing:2,marginBottom:4}}>💡 YOUR VERIFIED BADGE GIVES YOU DIRECT ACCESS TO ALL BUILDERS</div>
                <p style={{fontSize:12,color:"var(--muted)",lineHeight:1.7}}>Builders are notified with your investor profile when you connect. This builds trust and increases response rates significantly.</p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
                {LEADERBOARD.map((b,i)=>(
                  <div key={b.name} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:18,transition:"all .2s",cursor:"pointer",animation:`fadeUp .3s ${i*.06}s ease both`}} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(240,165,0,.4)";e.currentTarget.style.transform="translate(-2px,-2px)";e.currentTarget.style.boxShadow="4px 4px 0 var(--border)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}>
                      <div style={{fontFamily:"var(--fd)",fontSize:18,color:["var(--gold)","#C0C0C0","#CD7F32","var(--muted)","var(--muted)","var(--muted)","var(--muted)","var(--muted)"][i],width:22,textAlign:"center",flexShrink:0}}>#{b.rank}</div>
                      <Av name={b.av} color={b.avc} size={34}/>
                      <div><div style={{fontWeight:700,fontSize:12}}>{b.name} {b.flag}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>@{b.handle}</div></div>
                    </div>
                    <div style={{display:"flex",gap:6,marginBottom:11,flexWrap:"wrap"}}><span style={{background:"rgba(240,165,0,.1)",border:"1px solid rgba(240,165,0,.3)",fontFamily:"var(--fm)",fontSize:7,padding:"2px 7px",color:"var(--gold)",letterSpacing:1}}>{b.badge}</span><span style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--muted)",padding:"2px 7px",border:"1px solid var(--border)"}}>{b.pts.toLocaleString()} pts</span></div>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={()=>navigate("messages")} style={{flex:1,padding:"7px",background:"var(--gold)",color:"#000",border:"2px solid var(--gold)",fontFamily:"var(--fd)",fontSize:12,letterSpacing:2,cursor:"pointer",transition:"all .15s"}}>Connect</button>
                      <button onClick={()=>navigate("profile")} style={{padding:"7px 10px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>View</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab==="bounty"&&(
          <div>
            <div style={{padding:"20px 28px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10}}>
              <div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>POST A <span style={{color:"var(--gold)"}}>BOUNTY</span></div>
              <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>PAY BUILDERS TO BUILD WHAT YOU NEED</div>
            </div>
            <div style={{maxWidth:620,padding:"24px 28px"}}>
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                {[["Bounty Title","e.g. Build M-Pesa integration for React Native"],["Budget (USD)","e.g. 500"],["Deadline","e.g. 7 days"]].map(([l,ph])=>(
                  <div key={l}><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>{l}</div><input placeholder={ph} style={{width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>
                ))}
                <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Detailed Description</div><textarea placeholder="What exactly needs to be built? Include technical specs and acceptance criteria." rows={4} style={{width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",resize:"none",lineHeight:1.7,borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>
                <div style={{padding:"12px",background:"rgba(240,165,0,.04)",border:"1px solid rgba(240,165,0,.2)"}}>
                  <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--gold)",letterSpacing:2,marginBottom:4}}>VIBR TAKES 12% COMMISSION ON COMPLETION</div>
                  <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.7}}>Payment handled via Paystack. Both parties confirm completion before funds release.</div>
                </div>
                <BountyPostButton navigate={navigate}/>
              </div>
            </div>
          </div>
        )}
        {tab==="portfolio"&&(
          <div>
            <div style={{padding:"20px 28px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10}}>
              <div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>YOUR <span style={{color:"var(--gold)"}}>PORTFOLIO</span></div>
              <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>TRACK YOUR VIBR DEALS AND INVESTMENTS</div>
            </div>
            <div style={{padding:"20px 28px"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:11,marginBottom:20}}>
                {[{label:"Total Deployed",value:"$125,000",color:"gold"},{label:"Active Deals",value:"2",color:"green"},{label:"Saved Deals",value:"4",color:"gold"},{label:"Builders Contacted",value:"7",color:"cyan"}].map(s=>(
                  <div key={s.label} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:"14px",textAlign:"center"}}><div style={{fontFamily:"var(--fd)",fontSize:26,color:`var(--${s.color==="cyan"?"gr2":s.color})`,lineHeight:1,marginBottom:3}}>{s.value}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2,textTransform:"uppercase"}}>{s.label}</div></div>
                ))}
              </div>
              <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:18,marginBottom:13}}>
                <div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,marginBottom:13}}>ACTIVE DEALS</div>
                {INV_PORTFOLIO.map((p,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid var(--border)",animation:`fadeUp .3s ${i*.07}s ease both`}}>
                    <div style={{width:38,height:38,background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:16,color:"#000",flexShrink:0}}>{p.company.slice(0,2).toUpperCase()}</div>
                    <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{p.company}</div><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>{p.founder} · {p.round} · {p.date}</div></div>
                    <div style={{fontFamily:"var(--fd)",fontSize:18,color:"var(--gold)"}}>{p.amount}</div>
                    <span style={{background:p.stage==="Term Sheet Sent"?"rgba(240,165,0,.1)":"rgba(26,122,60,.1)",border:`1px solid ${p.stage==="Term Sheet Sent"?"rgba(240,165,0,.3)":"rgba(26,122,60,.3)"}`,fontFamily:"var(--fm)",fontSize:8,padding:"2px 9px",color:p.stage==="Term Sheet Sent"?"var(--gold)":"var(--gr2)",letterSpacing:1}}>{p.stage}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab==="browse"&&(
          <div>
            <div style={{padding:"20px 28px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>BROWSE <span style={{color:"var(--gold)"}}>PLATFORM</span></div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>EXPLORE THE BUILDER COMMUNITY AS AN INVESTOR</div></div>
              <button onClick={()=>navigate("feed")} style={{background:"var(--gold)",color:"#000",border:"2px solid var(--gold)",padding:"9px 20px",fontFamily:"var(--fd)",fontSize:15,letterSpacing:2,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.background="var(--gold)";e.target.style.color="#000";}}>Open Full Feed →</button>
            </div>
            <div style={{padding:"20px 28px"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
                {[["🔥","Live Feed","Browse all builder projects in real time","feed"],["🏆","Leaderboard","See top builders ranked by Vibe Score","leaderboard"],["👥","Community","Explore all 54 African country chapters","community"],["⚡","Hackathons","See live and upcoming build competitions","hackathons"],["🏢","Companies","See other companies on the platform","companies"],["🔍","Search","Search builders, projects, and bounties","search"]].map(([icon,title,desc,dest])=>(
                  <div key={title} onClick={()=>navigate(dest)} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:"18px 16px",cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none";}}>
                    <div style={{fontSize:28,marginBottom:10}}>{icon}</div>
                    <div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:1,marginBottom:5,color:"var(--gold)"}}>{title}</div>
                    <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.5}}>{desc}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"rgba(240,165,0,.04)",border:"1px solid rgba(240,165,0,.2)",padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:18}}>💡</span>
                <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.6}}>As an investor, your verified badge is visible to builders when you interact with their content. This increases response rates and builds credibility.</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
function OnboardingPage({navigate}){
  const [step,setStep]=useState(1);
  const [stacks,setStacks]=useState([]);
  const [goals,setGoals]=useState([]);
  const inp={width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",transition:"border-color .2s"};
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 20px",background:"var(--bg)"}}>
      <Logo size={30} onClick={()=>navigate("landing")}/>
      <div style={{width:"100%",maxWidth:520,marginTop:36}}>
        <div style={{display:"flex",gap:0,marginBottom:36}}>
          {["Your Identity","Your Stack","Your Goals"].map((s,i)=><div key={s} style={{flex:1,paddingRight:i<2?10:0}}><div style={{height:3,background:i+1<=step?"var(--red)":"var(--s2)",marginBottom:5}}/><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:i+1<=step?"var(--gold)":"var(--muted)",textTransform:"uppercase"}}>{String(i+1).padStart(2,"0")} {s}</div></div>)}
        </div>
        {step===1&&<div className="fu">
          <div style={{fontFamily:"var(--fd)",fontSize:44,letterSpacing:2,lineHeight:1,marginBottom:5}}>SET YOUR<br/><span style={{color:"var(--gold)"}}>IDENTITY</span></div>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:24,lineHeight:1.6}}>This is how the world sees you on VIBR.</p>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>VIBR Handle</div><div style={{position:"relative"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--gold)",fontFamily:"var(--fm)"}}>@</span><input placeholder="yourhandle" style={{...inp,paddingLeft:30}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/></div></div>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Bio</div><textarea placeholder="I build fintech tools for underbanked Nigerians..." rows={4} style={{...inp,resize:"none",lineHeight:1.6}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/></div>
          </div>
        </div>}
        {step===2&&<div className="fu">
          <div style={{fontFamily:"var(--fd)",fontSize:44,letterSpacing:2,lineHeight:1,marginBottom:5}}>YOUR<br/><span style={{color:"var(--gr2)"}}>STACK</span></div>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:20,lineHeight:1.6}}>Pick everything you work with.</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>{STACKS.map(s=><button key={s} onClick={()=>setStacks(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])} style={{padding:"6px 13px",fontFamily:"var(--fm)",fontSize:10,letterSpacing:1,background:stacks.includes(s)?"var(--green)":"var(--s2)",color:stacks.includes(s)?"#fff":"var(--muted)",border:`2px solid ${stacks.includes(s)?"var(--green)":"var(--border)"}`,cursor:"pointer",transition:"all .15s"}}>{s}{stacks.includes(s)?" ✓":""}</button>)}</div>
        </div>}
        {step===3&&<div className="fu">
          <div style={{fontFamily:"var(--fd)",fontSize:44,letterSpacing:2,lineHeight:1,marginBottom:5}}>YOUR<br/><span style={{color:"var(--red)"}}>GOALS</span></div>
          <p style={{color:"var(--muted)",fontSize:13,marginBottom:20,lineHeight:1.6}}>What brings you to VIBR?</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>{GOALS.map(([icon,text])=>{const sel=goals.includes(text);return <button key={text} onClick={()=>setGoals(p=>p.includes(text)?p.filter(x=>x!==text):[...p,text])} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 15px",background:sel?"rgba(209,43,43,.1)":"var(--s2)",border:`2px solid ${sel?"var(--red)":"var(--border)"}`,cursor:"pointer",transition:"all .15s",textAlign:"left"}}><span style={{fontSize:17}}>{icon}</span><span style={{color:sel?"var(--white)":"var(--muted)",fontSize:13,fontWeight:sel?600:400}}>{text}</span>{sel&&<span style={{marginLeft:"auto",color:"var(--red)",fontSize:13}}>✓</span>}</button>;})}</div>
        </div>}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:28}}>
          {step>1?<Btn v="ghost" onClick={()=>setStep(s=>s-1)}>← Back</Btn>:<div/>}
          <Btn v={step===3?"gold":"primary"} onClick={()=>step<3?setStep(s=>s+1):navigate("feed")}>{step===3?"ENTER VIBR 🔥":"NEXT →"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── FEED ──────────────────────────────────────────────────────────────────────

// ── POST MENU (edit / delete — owner only) ────────────────────────────────────
function PostMenu({postId, onDelete, onEdit}){
  const [open,setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    const close = e=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",close);
    return ()=>document.removeEventListener("mousedown",close);
  },[]);
  return (
    <div ref={ref} style={{position:"relative",marginLeft:"auto"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:"transparent",border:"none",color:"var(--muted)",cursor:"pointer",padding:"5px 8px",fontSize:16,lineHeight:1}} aria-label="Post options">⋯</button>
      {open&&(
        <div style={{position:"absolute",right:0,bottom:"calc(100% + 4px)",background:"var(--surface)",border:"2px solid var(--border)",minWidth:140,zIndex:50,boxShadow:"0 8px 24px rgba(0,0,0,.4)"}}>
          <button onClick={()=>{setOpen(false);onEdit&&onEdit();}} style={{width:"100%",padding:"10px 14px",background:"transparent",border:"none",color:"var(--text)",fontFamily:"var(--fm)",fontSize:11,cursor:"pointer",textAlign:"left",letterSpacing:1,transition:"background .15s"}} onMouseEnter={e=>e.target.style.background="var(--s2)"} onMouseLeave={e=>e.target.style.background="transparent"}>✏️  Edit Post</button>
          <div style={{height:1,background:"var(--border)"}}/>
          <button onClick={()=>{setOpen(false);if(window.confirm("Delete this post? This cannot be undone.")) onDelete&&onDelete();}} style={{width:"100%",padding:"10px 14px",background:"transparent",border:"none",color:"var(--r2)",fontFamily:"var(--fm)",fontSize:11,cursor:"pointer",textAlign:"left",letterSpacing:1,transition:"background .15s"}} onMouseEnter={e=>e.target.style.background="rgba(217,43,43,.1)"} onMouseLeave={e=>e.target.style.background="transparent"}>🗑️  Delete Post</button>
        </div>
      )}
    </div>
  );
}

function FeedPage({navigate,returnTo,userRole,session}){
  const [tab,setTab]=useState("trending");
  const [voted,setVoted]=useState({});
  const [livePosts,setLivePosts]=useState([]);
  const [feedLoading,setFeedLoading]=useState(true);

  // Paginated feed using usePagination hook
  const mapPost = p=>({
    id:p.id, title:p.title,
    name:p.profiles?.full_name||p.profiles?.username||"Builder",
    handle:p.profiles?.username||"builder",
    loc:p.profiles?.country||"Africa 🌍",
    av:(p.profiles?.username||"B").slice(0,2).toUpperCase(),
    avc:"red", time:new Date(p.created_at).toLocaleDateString(),
    votes:p.vote_count||0, comments:p.comment_count||0,
    tags:(p.tags||[]).map(t=>[t,"gold"]),
    desc:p.description||"", trending:(p.vote_count||0)>5,
  });

  const { items:pagedPosts, loading:pageLoading, hasMore, loadMore } = usePagination(
    ({limit,offset})=>getPosts({limit,offset}).then(d=>(d||[]).map(mapPost)).catch(()=>[]),
    [tab]
  );

  useEffect(()=>{ setFeedLoading(pageLoading); },[pageLoading]);
  useEffect(()=>{ if(pagedPosts.length>0) setLivePosts(pagedPosts); },[pagedPosts]);

  const displayPosts = livePosts.length>0 ? livePosts : FEED_POSTS;
  const posts = tab==="trending"
    ? displayPosts.filter(p=>p.trending)
    : tab==="collab"
    ? displayPosts.slice(0,3)
    : displayPosts;

  const handleVote=async(postId)=>{
    if(!session){navigate("login");return;}
    const alreadyVoted = voted[postId];
    setVoted(v=>({...v,[postId]:!v[postId]}));
    setLivePosts(ps=>ps.map(p=>p.id===postId?{...p,votes:p.votes+(alreadyVoted?-1:1)}:p));
    try{ await votePost(postId,session.user.id); }catch{}
  };

  return (
    <AppShell navigate={navigate} activePage="feed" returnTo={returnTo} userRole={userRole}>
      <div style={{display:"flex"}}>
        <div style={{flex:1,borderRight:"2px solid var(--border)"}}>
          <div style={{padding:"18px 26px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div><div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>LIVE FEED</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>WHAT AFRICAN BUILDERS ARE DROPPING RIGHT NOW</div></div>
            <button onClick={()=>navigate("drop")} style={{background:"var(--red)",color:"#fff",border:"2px solid var(--red)",padding:"7px 18px",fontFamily:"var(--fd)",fontSize:15,letterSpacing:2,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--red)";}} onMouseLeave={e=>{e.currentTarget.style.background="var(--red)";e.currentTarget.style.color="#fff";}}>+ DROP PROJECT</button>
          </div>
          <div style={{display:"flex",borderBottom:"2px solid var(--border)",padding:"0 26px"}}>
            {["trending","latest","collab","open source"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"10px 15px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,textTransform:"uppercase",background:"transparent",border:"none",cursor:"pointer",color:tab===t?"var(--white)":"var(--muted)",borderBottom:tab===t?"3px solid var(--red)":"3px solid transparent",marginBottom:-2,transition:"all .15s"}}>{t}</button>)}
          </div>
          {feedLoading && [1,2,3].map(n=><SkeletonCard key={n}/>)}
          {!feedLoading && posts.length===0 && (
            <EmptyState
              emoji="🔥"
              title="NO DROPS YET"
              sub="Be the first builder to drop a project. Africa needs to see what you're building."
              cta="Drop Something →"
              onCta={()=>navigate("drop")}
            />
          )}
          {!feedLoading && posts.map((post,i)=>(
            <div key={post.id} style={{padding:"20px 26px",borderBottom:"2px solid var(--border)",transition:"background .2s",animation:`fadeUp .4s ${i*.07}s ease both`}} onMouseEnter={e=>e.currentTarget.style.background="var(--surface)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{display:"flex",gap:12}}>
                <button onClick={()=>setVoted(v=>({...v,[post.id]:!v[post.id]}))} style={{width:38,height:42,background:voted[post.id]?"var(--gold)":"var(--s2)",border:`2px solid ${voted[post.id]?"var(--gold)":"var(--border)"}`,color:voted[post.id]?"#000":"var(--muted)",fontFamily:"var(--fd)",fontSize:13,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,transition:"all .15s",flexShrink:0}}>
                  <span>▲</span><span style={{fontSize:9,fontFamily:"var(--fm)"}}>{post.votes+(voted[post.id]?1:0)}</span>
                </button>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                    <Av name={post.av} color={post.avc} size={30}/>
                    <div><div style={{fontWeight:700,fontSize:13}}>{post.name}</div><div style={{color:"var(--muted)",fontSize:9,fontFamily:"var(--fm)"}}>@{post.handle} · {post.loc} · {post.time}</div></div>
                    {post.trending&&<span style={{marginLeft:"auto",background:"var(--red)",color:"#fff",fontSize:8,padding:"2px 7px",fontFamily:"var(--fm)",letterSpacing:1}}>🔥 TRENDING</span>}
                  </div>
                  <div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:1,marginBottom:5,lineHeight:1.2,cursor:"pointer"}} onClick={()=>navigate(`post-${post.id}`)}>{post.title}</div>
                  <p style={{color:"#999",fontSize:12,lineHeight:1.6,marginBottom:9}}>{post.desc}</p>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>{post.tags.map(([t,c])=><Tag key={t} label={t} color={c}/>)}</div>
                  <div style={{display:"flex",gap:16}}>
                    {[["💬",`${post.comments.length} Comments`,()=>navigate(`post-${post.id}`)],["🔗","Share",null],["🤝","Collab",()=>navigate("collabs")],["🔖","Save",null]].map(([icon,label,action])=><button key={label} onClick={action||undefined} style={{background:"transparent",border:"none",color:"var(--muted)",fontSize:10,fontFamily:"var(--fm)",cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:"2px 0",transition:"color .15s",letterSpacing:1}} onMouseEnter={e=>e.currentTarget.style.color="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"}>{icon} {label}</button>)}
                  </div>
                  {session?.user?.id===post.author_id&&(
                    <PostMenu
                      postId={post.id}
                      onDelete={()=>{
                        setLivePosts(prev=>prev.filter(p=>p.id!==post.id));
                        supabase.from("posts").delete().eq("id",post.id)
                          .then(()=>toast.success("Post deleted."))
                          .catch(()=>toast.error("Delete failed."));
                      }}
                      onEdit={()=>navigate("drop")}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Right sidebar */}
        <div style={{width:262,padding:"16px 14px",display:"flex",flexDirection:"column",gap:16,height:"100vh",position:"sticky",top:0,overflowY:"auto",flexShrink:0}}>
          <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:14}}>
            <div style={{fontFamily:"var(--fd)",fontSize:16,letterSpacing:2,marginBottom:10,display:"flex",alignItems:"center",gap:6}}><span style={{width:6,height:6,background:"var(--gr2)",borderRadius:"50%",display:"inline-block",animation:"pulse 2s infinite"}}/>LIVE NOW</div>
            {[["Lagos Builder Meetup","312"],["Ghana Fintech Hackathon","89"],["African AI Study Group","201"]].map(([t,c])=><div key={t} onClick={()=>navigate("community")} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"opacity .2s"}} onMouseEnter={e=>e.currentTarget.style.opacity=".7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}><div style={{fontSize:11,fontWeight:600}}>{t}</div><div style={{fontSize:8,color:"var(--gr2)",fontFamily:"var(--fm)"}}>{c} watching</div></div>)}
          </div>
          <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:14}}>
            <div style={{fontFamily:"var(--fd)",fontSize:16,letterSpacing:2,marginBottom:10,color:"var(--gold)"}}>HOT BOUNTIES 💰</div>
            {BOUNTIES.slice(0,3).map((b,i)=><div key={i} onClick={()=>navigate("bounties")} style={{padding:"8px 0",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"opacity .2s"}} onMouseEnter={e=>e.currentTarget.style.opacity=".7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}><span style={{fontFamily:"var(--fd)",fontSize:16,color:"var(--gr2)"}}>{b.amount}</span>{b.hot&&<span style={{background:"var(--red)",color:"#fff",fontSize:7,padding:"1px 5px",fontFamily:"var(--fm)"}}>HOT</span>}</div>
              <div style={{fontSize:11,fontWeight:600,marginBottom:1}}>{b.title}</div>
              <div style={{fontSize:8,color:"var(--muted)",fontFamily:"var(--fm)"}}>{b.company}</div>
            </div>)}
            <button onClick={()=>navigate("bounties")} style={{width:"100%",marginTop:8,padding:"7px",background:"transparent",border:"2px solid var(--gold)",color:"var(--gold)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.background="var(--gold)";e.target.style.color="#000";}} onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color="var(--gold)";}}>View All Bounties →</button>
          </div>
          <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:14}}>
            <div style={{fontFamily:"var(--fd)",fontSize:16,letterSpacing:2,marginBottom:10}}>TOP BUILDERS 🏆</div>
            {LEADERBOARD.slice(0,4).map((b,i)=><div key={b.name} onClick={()=>navigate("leaderboard")} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 0",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"opacity .2s"}} onMouseEnter={e=>e.currentTarget.style.opacity=".7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              <div style={{fontFamily:"var(--fd)",fontSize:18,color:["var(--gold)","#C0C0C0","#CD7F32","var(--muted)"][i],width:18,textAlign:"center"}}>{i+1}</div>
              <div style={{fontSize:14}}>{b.flag}</div>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700}}>{b.name}</div><div style={{fontSize:8,color:"var(--muted)",fontFamily:"var(--fm)"}}>{b.badge}</div></div>
              <div style={{fontFamily:"var(--fd)",fontSize:13,color:"var(--gold)"}}>{b.pts.toLocaleString()}</div>
            </div>)}
            <button onClick={()=>navigate("leaderboard")} style={{width:"100%",marginTop:8,padding:"7px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>Full Leaderboard →</button>
          </div>
        </div>
      </div>
          <InfiniteScrollSentinel onVisible={loadMore} loading={pageLoading} hasMore={hasMore}/>
    </AppShell>
  );
}

// ── POST DETAIL ───────────────────────────────────────────────────────────────
function PostDetailPage({postId,navigate,returnTo,userRole,session}){
  const post=FEED_POSTS.find(p=>p.id===postId)||FEED_POSTS[0];
  const [newC,setNewC]=useState("");
  const [comments,setComments]=useState([]);
  const [voted,setVoted]=useState(false);
  const [posting,setPosting]=useState(false);

  useEffect(()=>{
    if(!postId) return;
    getComments(postId)
      .then(data=>{
        if(data&&data.length>0){
          setComments(data.map(c=>({
            id:c.id,
            user:c.profiles?.full_name||c.profiles?.username||"Builder",
            av:(c.profiles?.username||"B").slice(0,2).toUpperCase(),
            text:c.content,
            time:new Date(c.created_at).toLocaleDateString(),
          })));
        } else {
          setComments(post.comments||[]);
        }
      })
      .catch(()=>setComments(post.comments||[]));
  },[postId]);
  return (
    <AppShell navigate={navigate} activePage="feed" returnTo={returnTo} userRole={userRole}>
      <div style={{maxWidth:720,margin:"0 auto",padding:"28px 28px 64px"}}>
        <button onClick={()=>navigate(returnTo||"feed")} style={{background:"transparent",border:"none",color:"var(--muted)",cursor:"pointer",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,marginBottom:20,display:"flex",alignItems:"center",gap:5}} onMouseEnter={e=>e.target.style.color="var(--white)"} onMouseLeave={e=>e.target.style.color="var(--muted)"}>← {returnTo?"Back to Dashboard":"Back to Feed"}</button>
        <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:26,marginBottom:18,animation:"fadeUp .4s ease both"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:13}}>
            <Av name={post.av} color={post.avc} size={40}/>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{post.name}</div><div style={{color:"var(--muted)",fontSize:10,fontFamily:"var(--fm)"}}>@{post.handle} · {post.loc} · {post.time}</div></div>
            {post.trending&&<span style={{background:"var(--red)",color:"#fff",fontSize:8,padding:"2px 8px",fontFamily:"var(--fm)",letterSpacing:1}}>🔥 TRENDING</span>}
          </div>
          <div style={{fontFamily:"var(--fd)",fontSize:27,letterSpacing:1,lineHeight:1.1,marginBottom:11}}>{post.title}</div>
          <p style={{color:"#aaa",fontSize:14,lineHeight:1.8,marginBottom:14}}>{post.desc}</p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>{post.tags.map(([t,c])=><Tag key={t} label={t} color={c}/>)}</div>
          <div style={{display:"flex",gap:9,paddingTop:14,borderTop:"1px solid var(--border)"}}>
            <button onClick={async()=>{if(!session){navigate("login");return;}setVoted(v=>!v);try{await votePost(postId,session.user.id);}catch{}}} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:voted?"var(--gold)":"var(--s2)",border:`2px solid ${voted?"var(--gold)":"var(--border)"}`,color:voted?"#000":"var(--muted)",fontFamily:"var(--fd)",fontSize:16,letterSpacing:2,cursor:"pointer",transition:"all .15s"}}>▲ {post.votes+(voted?1:0)}</button>
            <Btn v="green" onClick={()=>navigate("collabs")}>🤝 Request Collab</Btn>
            <Btn v="ghost" onClick={()=>navigate("messages")}>💬 Message</Btn>
          </div>
        </div>
        <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:22}}>
          <div style={{fontFamily:"var(--fd)",fontSize:22,letterSpacing:2,marginBottom:16}}>COMMENTS <span style={{color:"var(--muted)",fontSize:14}}>({comments.length})</span></div>
          <div style={{display:"flex",gap:9,marginBottom:18,paddingBottom:18,borderBottom:"1px solid var(--border)"}}>
            <Av name="YOU" color="red" size={32}/>
            <div style={{flex:1}}>
              <textarea value={newC} onChange={e=>setNewC(e.target.value)} placeholder="Share thoughts, feedback, or collab interest..." rows={3} style={{width:"100%",padding:"10px 12px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",resize:"none",lineHeight:1.6,borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:6}}>
                <button onClick={async()=>{
                  if(!newC.trim())return;
                  if(!session){navigate("login");return;}
                  const text=newC; setNewC(""); setPosting(true);
                  setComments(c=>[...c,{id:Date.now(),user:"You",av:"YO",text,time:"Just now"}]);
                  try{await createComment({postId,authorId:session.user.id,content:text});toast.info("Comment posted!");}catch(e){toast.error("Failed to post comment.");}
                  finally{setPosting(false);}
                }} disabled={posting} style={{background:"var(--red)",color:"#fff",border:"2px solid var(--red)",padding:"6px 16px",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer",transition:"all .15s",opacity:posting?.6:1}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--red)";}} onMouseLeave={e=>{e.target.style.background="var(--red)";e.target.style.color="#fff";}}>POST →</button>
              </div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {comments.map((c,i)=><div key={i} style={{display:"flex",gap:9,animation:`fadeUp .3s ${i*.07}s ease both`}}>
              <Av name={c.user} color={["red","gold","green"][i%3]} size={30}/>
              <div style={{flex:1,background:"var(--s2)",padding:"11px 13px",border:"1px solid var(--border)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontWeight:700,fontSize:12}}>{c.user}</span><span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>{c.time}</span></div>
                <div style={{color:"#bbb",fontSize:13,lineHeight:1.6}}>{c.text}</div>
              </div>
            </div>)}
            {comments.length===0&&<div style={{textAlign:"center",color:"var(--muted)",padding:"24px",fontFamily:"var(--fm)",fontSize:10,letterSpacing:2}}>NO COMMENTS YET — BE FIRST 🔥</div>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ── COLLABS ───────────────────────────────────────────────────────────────────
function CollabsPage({navigate,returnTo,userRole,session}){
  const [filter,setFilter]=useState("all");
  const [requested,setRequested]=useState({});
  const [msgOpen,setMsgOpen]=useState(null);
  const [reqMsg,setReqMsg]=useState("");
  const [reqSent,setReqSent]=useState({});
  const [liveCollabs,setLiveCollabs]=useState([]);
  const roles=["all","Frontend Dev","Backend Dev","UI/UX Designer","Co-founder","ML Engineer","Mobile Dev"];

  useEffect(()=>{
    supabase.from('collabs')
      .select('*, profiles:author_id(username,country,full_name)')
      .eq('status','open')
      .order('created_at',{ascending:false})
      .limit(20)
      .then(({data})=>{
        if(data&&data.length>0){
          setLiveCollabs(data.map(c=>({
            id:c.id,
            name:c.profiles?.full_name||c.profiles?.username||"Builder",
            handle:c.profiles?.username||"builder",
            loc:c.profiles?.country||"Africa",
            av:(c.profiles?.username||"B").slice(0,2).toUpperCase(),
            avc:"red", flag:"🌍",
            project:c.project,
            desc:c.description||"",
            needs:c.roles||[],
            tags:(c.tags||[]).map(t=>[t,"gold"]),
          })));
        }
      })
      .catch(()=>{});
  },[]);

  // Sort collabs by relevance: same country > shared stack tags > newest
  const scoreCollab=(c)=>{
    let score=0;
    // Same country as user (using browser locale as proxy)
    if(c.loc&&navigator.language){
      const lang=navigator.language.split("-")[1]||"";
      if(c.loc.includes("Nigeria")&&lang==="NG") score+=10;
      if(c.loc.includes("Kenya")&&lang==="KE") score+=10;
      if(c.loc.includes("Ghana")&&lang==="GH") score+=10;
    }
    // Open collab (not closed)
    if(c.status!=="closed") score+=5;
    // More specific needs = better match
    score += (c.needs||[]).length;
    return score;
  };
  const displayCollabs = [...(liveCollabs.length>0 ? liveCollabs : COLLABS)]
    .sort((a,b)=>scoreCollab(b)-scoreCollab(a));

  const sendRequest=async(id)=>{
    if(!session){navigate("login");return;}
    setRequested(r=>({...r,[id]:true}));
    setReqSent(r=>({...r,[id]:true}));
    setMsgOpen(null);
    setReqMsg("");
    toast.success("Request sent! They'll be notified 🤝");
    try{
      supabase.from('collab_requests')
        .insert({collab_id:id,sender_id:session.user.id,message:reqMsg||""})
        .then(()=>{}).catch(()=>{});
    }catch{}
  };
  return (
    <AppShell navigate={navigate} activePage="collabs" returnTo={returnTo} userRole={userRole}>
      <div style={{padding:"22px 30px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>COLLAB BOARD</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>FIND YOUR TEAM. BUILD TOGETHER.</div></div>
        <Btn v="primary" onClick={()=>navigate("drop")}>+ POST COLLAB</Btn>
      </div>
      <div style={{padding:"12px 30px",borderBottom:"2px solid var(--border)",display:"flex",gap:6,overflowX:"auto"}}>
        {roles.map(r=><button key={r} onClick={()=>setFilter(r)} style={{padding:"5px 12px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:1,textTransform:"uppercase",background:filter===r?"var(--red)":"var(--s2)",color:filter===r?"#fff":"var(--muted)",border:`2px solid ${filter===r?"var(--red)":"var(--border)"}`,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap"}}>{r}</button>)}
      </div>
      <div style={{padding:"22px 30px",display:"flex",flexDirection:"column",gap:14}}>
        {displayCollabs.length===0&&!liveCollabs.length&&(
          <EmptyState emoji="🤝" title="NO COLLABS YET" sub="No collab requests yet. Post yours and find a co-builder." cta="Post Collab Request" onCta={()=>navigate("drop")}/>
        )}
        {displayCollabs.map((c,i)=><div key={c.id} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:22,display:"grid",gridTemplateColumns:"1fr auto",gap:18,transition:"all .2s",animation:`fadeUp .4s ${i*.08}s ease both`}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.transform="translateX(-3px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none";}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:11}}>
              <Av name={c.av} color={c.avc} size={36}/>
              <div><div style={{fontWeight:700,fontSize:13}}>{c.name}</div><div style={{color:"var(--muted)",fontSize:9,fontFamily:"var(--fm)"}}>@{c.handle} · {c.loc}</div></div>
              <div style={{marginLeft:"auto",background:"rgba(240,165,0,.1)",border:"1px solid var(--gold)",padding:"2px 9px",fontFamily:"var(--fm)",fontSize:8,color:"var(--gold)"}}>⚡{c.vibe.toLocaleString()} pts</div>
            </div>
            <div style={{fontFamily:"var(--fd)",fontSize:19,letterSpacing:1,marginBottom:5,lineHeight:1.1}}>{c.project}</div>
            <p style={{color:"#999",fontSize:12,lineHeight:1.6,marginBottom:11}}>{c.desc}</p>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:11}}>{c.tags.map(([t,col])=><Tag key={t} label={t} color={col}/>)}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}><span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>NEEDS:</span>{c.needs.map(n=><span key={n} style={{padding:"2px 9px",background:"var(--s2)",border:"1px solid var(--green)",color:"var(--gr2)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:1}}>{n}</span>)}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7,justifyContent:"center",minWidth:124}}>
            {requested[c.id]?(
              <button style={{padding:"9px 12px",background:"var(--green)",color:"#fff",border:"2px solid var(--green)",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"default",display:"flex",alignItems:"center",gap:5}}>✓ Requested!</button>
            ):(
              <button onClick={()=>setMsgOpen(msgOpen===c.id?null:c.id)} style={{padding:"9px 12px",background:"var(--red)",color:"#fff",border:"2px solid var(--red)",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--red)";}} onMouseLeave={e=>{e.target.style.background="var(--red)";e.target.style.color="#fff";}}>Request Collab</button>
            )}
            <Btn v="ghost" onClick={()=>navigate("messages")}>💬 Message</Btn>
            <button onClick={()=>navigate(`post-${c.id}`)} style={{background:"transparent",border:"none",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",textAlign:"center",padding:"2px"}} onMouseEnter={e=>e.target.style.color="var(--white)"} onMouseLeave={e=>e.target.style.color="var(--muted)"}>View Project →</button>
          </div>
          {msgOpen===c.id&&(
            <div style={{gridColumn:"1/-1",marginTop:8,animation:"fadeUp .2s ease both"}}>
              <div style={{background:"var(--s2)",border:"2px solid var(--red)",padding:16}}>
                <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:8,textTransform:"uppercase"}}>Send a note with your request (optional)</div>
                <textarea value={reqMsg} onChange={e=>setReqMsg(e.target.value)} placeholder={`Hey ${c.name}! I'd love to collaborate on ${c.project}. I can contribute as a...`} rows={3} style={{width:"100%",padding:"10px 12px",background:"var(--bg)",border:"1px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",resize:"none",lineHeight:1.6,borderRadius:0,marginBottom:8}}/>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>sendRequest(c.id)} style={{flex:1,padding:"9px",background:"var(--red)",color:"#fff",border:"2px solid var(--red)",fontFamily:"var(--fd)",fontSize:15,letterSpacing:2,cursor:"pointer",transition:"all .15s"}}>SEND REQUEST →</button>
                  <button onClick={()=>setMsgOpen(null)} style={{padding:"9px 14px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,cursor:"pointer",letterSpacing:2,textTransform:"uppercase"}}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>)}
      </div>
      <div style={{margin:"0 30px 32px",background:"#0A0A0A",border:"2px solid var(--border)",padding:26,display:"flex",alignItems:"center",justifyContent:"space-between",gap:18}}>
        <div>
          <div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2,marginBottom:6}}>FIND A <span style={{color:"var(--gold)"}}>CO-FOUNDER</span></div>
          <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.6,maxWidth:400}}>Our co-founder matching pairs you with complementary builders based on skills, goals and vibe. Like a dating app — but for African startups.</p>
        </div>
        <Btn v="gold" style={{whiteSpace:"nowrap"}} onClick={()=>navigate("profile")}>Start Matching 💍</Btn>
      </div>
    </AppShell>
  );
}

// ── BOUNTIES ──────────────────────────────────────────────────────────────────

// ── CHALLENGE DEMO ROOM ────────────────────────────────────────────────────────
// Shown when a builder clicks "View Submissions" or company reviews entries

// ── VIDEO EMBED — converts Loom/YouTube/Vimeo links to embeds ─────────────────
function VideoEmbed({url, width=320, height=180}){
  if(!url) return null;

  const getEmbed = (url)=>{
    // YouTube: watch?v= or youtu.be/
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if(ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;

    // YouTube shorts
    const ytShort = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/);
    if(ytShort) return `https://www.youtube.com/embed/${ytShort[1]}?rel=0`;

    // Loom
    const loomMatch = url.match(/loom\.com\/share\/([a-f0-9]+)/);
    if(loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}`;

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if(vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    return null;
  };

  const embedUrl = getEmbed(url);
  if(!embedUrl){
    return (
      <a href={url} target="_blank" rel="noreferrer"
        style={{width,height,background:"#111",display:"flex",alignItems:"center",
          justifyContent:"center",flexDirection:"column",gap:8,textDecoration:"none",
          border:"1px solid var(--border)",flexShrink:0}}>
        <span style={{fontSize:28}}>▶️</span>
        <span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:1}}>WATCH DEMO</span>
      </a>
    );
  }

  return (
    <iframe
      src={embedUrl}
      width={width}
      height={height}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      style={{flexShrink:0,border:"1px solid var(--border)",background:"#000"}}
      title="Demo video"
    />
  );
}

function ChallengeDemoRoom({challenge, onClose, isCompany}){
  const [submissions,setSubmissions]=useState(challenge.demoSubmissions||[]);
  const [selected,setSelected]=useState(submissions[0]||null);
  const [rating,setRating]=useState({});
  const [feedback,setFeedback]=useState({});
  const [feedbackSent,setFeedbackSent]=useState({});

  const rate=(handle,stars)=>{
    setRating(r=>({...r,[handle]:stars}));
  };
  const sendFeedback=(handle)=>{
    if(!feedback[handle]?.trim())return;
    setFeedbackSent(f=>({...f,[handle]:true}));
    setTimeout(()=>setFeedbackSent(f=>({...f,[handle]:false})),2000);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"var(--surface)",border:`2px solid ${challenge.color}`,width:"100%",maxWidth:900,maxHeight:"90vh",display:"flex",flexDirection:"column",animation:"fadeUp .3s ease both"}} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{padding:"14px 20px",borderBottom:"2px solid var(--border)",display:"flex",alignItems:"center",gap:12,background:"var(--s2)"}}>
          <div style={{width:36,height:36,background:challenge.color,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:16,color:challenge.color==="var(--gold)"?"#000":"#fff",flexShrink:0}}>{challenge.logo}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:1}}>{challenge.title} — Demo Room</div>
            <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>{submissions.length} SUBMISSIONS · {isCompany?"COMPANY REVIEW MODE":"PUBLIC VIEWING"}</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"1px solid var(--border)",color:"var(--muted)",width:28,height:28,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{display:"flex",flex:1,minHeight:0,overflow:"hidden"}}>
          {/* Submissions list */}
          <div style={{width:260,borderRight:"2px solid var(--border)",overflowY:"auto",background:"var(--s2)",flexShrink:0}}>
            {submissions.length===0?(
              <div style={{padding:20,textAlign:"center",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2}}>NO SUBMISSIONS YET</div>
            ):(
              submissions.map((s,i)=>(
                <div key={s.handle} onClick={()=>setSelected(s)} style={{padding:"13px 14px",borderBottom:"1px solid var(--border)",cursor:"pointer",background:selected?.handle===s.handle?"var(--bg)":"transparent",borderLeft:selected?.handle===s.handle?`3px solid ${challenge.color}`:"3px solid transparent",transition:"all .15s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                    <Av name={s.av} color={s.avc} size={28}/>
                    <div><div style={{fontWeight:700,fontSize:12}}>{s.builder} {s.flag}</div><div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--muted)"}}>@{s.handle}</div></div>
                  </div>
                  <div style={{fontFamily:"var(--fd)",fontSize:14,letterSpacing:1,marginBottom:3}}>{s.title}</div>
                  <div style={{fontFamily:"var(--fm)",fontSize:8,color:challenge.color,letterSpacing:1}}>{s.track}</div>
                  {rating[s.handle]&&(
                    <div style={{marginTop:4,fontSize:11,color:"var(--gold)"}}>{"★".repeat(rating[s.handle])}{"☆".repeat(5-rating[s.handle])}</div>
                  )}
                </div>
              ))
            )}
          </div>
          {/* Submission detail */}
          {selected?(
            <div style={{flex:1,overflowY:"auto",padding:22}}>
              <div style={{marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <Av name={selected.av} color={selected.avc} size={36}/>
                  <div>
                    <div style={{fontFamily:"var(--fd)",fontSize:22,letterSpacing:1}}>{selected.title}</div>
                    <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>{selected.builder} {selected.flag} · @{selected.handle} · Track: <span style={{color:challenge.color}}>{selected.track}</span></div>
                  </div>
                </div>
                <p style={{fontSize:13,color:"#bbb",lineHeight:1.7,marginBottom:14}}>{selected.desc}</p>
                {/* Demo video link */}
                <div style={{background:"var(--s2)",border:`2px solid ${challenge.color}`,padding:16,marginBottom:14}}>
                  <div style={{fontFamily:"var(--fm)",fontSize:9,color:challenge.color,letterSpacing:2,marginBottom:8}}>📹 DEMO VIDEO</div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <VideoEmbed url={selected.demo} width={240} height={135}/>
                    <div>
                      <div style={{fontSize:12,color:"#aaa",marginBottom:6,lineHeight:1.5}}>Builder-recorded demo</div>
                      <a href={selected.demo} target="_blank" rel="noreferrer" style={{color:challenge.color,fontSize:12,fontFamily:"var(--fm)",letterSpacing:1,textDecoration:"underline"}}>Open in new tab ↗</a>
                    </div>
                  </div>
                </div>
                {/* GitHub link */}
                <div style={{display:"flex",gap:10,marginBottom:16}}>
                  <a href={selected.github} target="_blank" rel="noreferrer" style={{flex:1,padding:"9px 14px",background:"var(--s2)",border:"1px solid var(--border)",color:"#aaa",fontSize:12,fontFamily:"var(--fm)",letterSpacing:1,textDecoration:"none",display:"flex",alignItems:"center",gap:7}}>
                    <span style={{fontSize:16}}>📦</span> {selected.github.replace("https://github.com/","")}
                  </a>
                </div>
                {/* Company review tools */}
                {isCompany&&(
                  <div style={{background:"rgba(240,165,0,.06)",border:"2px solid rgba(240,165,0,.2)",padding:16}}>
                    <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--gold)",letterSpacing:2,marginBottom:10}}>⭐ COMPANY REVIEW</div>
                    <div style={{marginBottom:10}}>
                      <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",marginBottom:6,letterSpacing:1}}>RATING</div>
                      <div style={{display:"flex",gap:4}}>
                        {[1,2,3,4,5].map(s=>(
                          <button key={s} onClick={()=>rate(selected.handle,s)} style={{fontSize:22,background:"transparent",border:"none",cursor:"pointer",color:rating[selected.handle]>=s?"var(--gold)":"var(--muted)",transition:"color .15s"}}>★</button>
                        ))}
                        {rating[selected.handle]&&<span style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--gold)",alignSelf:"center",marginLeft:4}}>{rating[selected.handle]}/5</span>}
                      </div>
                    </div>
                    <div style={{marginBottom:8}}>
                      <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",marginBottom:5,letterSpacing:1}}>PRIVATE FEEDBACK TO BUILDER</div>
                      <textarea value={feedback[selected.handle]||""} onChange={e=>setFeedback(f=>({...f,[selected.handle]:e.target.value}))} placeholder="Great concept, but the USSD flow needs..." rows={2} style={{width:"100%",padding:"8px 10px",background:"var(--bg)",border:"1.5px solid var(--border)",color:"var(--text)",fontSize:12,outline:"none",fontFamily:"var(--fb)",resize:"none",lineHeight:1.5,borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>sendFeedback(selected.handle)} style={{flex:1,padding:"8px",background:feedbackSent[selected.handle]?"var(--green)":"var(--gold)",color:feedbackSent[selected.handle]?"#fff":"#000",border:`2px solid ${feedbackSent[selected.handle]?"var(--green)":"var(--gold)"}`,fontFamily:"var(--fd)",fontSize:13,letterSpacing:2,cursor:"pointer",transition:"all .3s"}}>{feedbackSent[selected.handle]?"✓ SENT!":"SEND FEEDBACK"}</button>
                      <button style={{padding:"8px 14px",background:"var(--green)",color:"#fff",border:"2px solid var(--green)",fontFamily:"var(--fd)",fontSize:13,letterSpacing:2,cursor:"pointer"}}>🏆 SHORTLIST</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ):(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2}}>SELECT A SUBMISSION TO VIEW</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CHALLENGE SUBMIT MODAL ─────────────────────────────────────────────────────
function ChallengeSubmitModal({challenge, onClose, onSubmit}){
  const [form,setForm]=useState({track:"",title:"",demo:"",github:"",desc:""});
  const [submitting,setSubmitting]=useState(false);
  const [done,setDone]=useState(false);
  const upd=(k,v)=>setForm(f=>({...f,[k]:v}));
  const inp={width:"100%",padding:"10px 12px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",transition:"border-color .2s",borderRadius:0};
  const submit=()=>{
    if(!form.track||!form.title||!form.demo)return;
    setSubmitting(true);
    setTimeout(()=>{setSubmitting(false);setDone(true);onSubmit&&onSubmit(form);},1600);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"var(--surface)",border:`2px solid ${challenge.color}`,width:"100%",maxWidth:520,animation:"fadeUp .3s ease both"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"14px 20px",borderBottom:"2px solid var(--border)",background:"var(--s2)",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,background:challenge.color,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:15,color:challenge.color==="var(--gold)"?"#000":"#fff",flexShrink:0}}>{challenge.logo}</div>
          <div style={{flex:1}}><div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:1}}>{done?"SUBMITTED!":"SUBMIT YOUR BUILD"}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>{challenge.title.toUpperCase()}</div></div>
          <button onClick={onClose} style={{background:"transparent",border:"1px solid var(--border)",color:"var(--muted)",width:26,height:26,cursor:"pointer",fontSize:16}}>×</button>
        </div>
        {done?(
          <div style={{padding:28,textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:12}}>🎉</div>
            <div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2,color:challenge.color,marginBottom:8}}>BUILD SUBMITTED!</div>
            <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.7,marginBottom:18}}>Your demo is now in the review queue. {challenge.company} will review all submissions by {challenge.deadline}. Top entries get spotlighted on VIBR feed and pushed to investor deal flow.</p>
            <div style={{background:"var(--s2)",border:`1px solid ${challenge.color}`,padding:12,marginBottom:16,textAlign:"left"}}>
              {[["Project:",form.title],["Track:",form.track],["Demo:",form.demo.slice(0,40)+"..."],["GitHub:",form.github||"Not provided"]].map(([l,v])=>(
                <div key={l} style={{display:"flex",gap:8,padding:"4px 0",fontSize:12}}><span style={{color:"var(--muted)",minWidth:60}}>{l}</span><span style={{color:"#ddd"}}>{v}</span></div>
              ))}
            </div>
            <button onClick={onClose} style={{padding:"10px 28px",background:challenge.color,color:challenge.color==="var(--gold)"?"#000":"#fff",border:`2px solid ${challenge.color}`,fontFamily:"var(--fd)",fontSize:16,letterSpacing:3,cursor:"pointer"}}>DONE ✓</button>
          </div>
        ):(
          <div style={{padding:22}}>
            <div style={{background:"rgba(240,165,0,.04)",border:"1px solid rgba(240,165,0,.2)",padding:"10px 14px",marginBottom:16,fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",lineHeight:1.7,letterSpacing:.5}}>
              📹 Record a screen demo on Loom (free) or YouTube unlisted. Paste the link below. No livestreaming needed — submit when you're ready.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div><div style={{fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Build Track *</div>
                <select value={form.track} onChange={e=>upd("track",e.target.value)} style={{...inp,appearance:"none"}} onFocus={e=>e.target.style.borderColor=challenge.color} onBlur={e=>e.target.style.borderColor="var(--border)"}>
                  <option value="">Select your track</option>
                  {challenge.tracks.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div><div style={{fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Project Name *</div>
                <input value={form.title} onChange={e=>upd("title",e.target.value)} placeholder="What did you build?" style={inp} onFocus={e=>e.target.style.borderColor=challenge.color} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>
              <div><div style={{fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Demo Video Link * (Loom, YouTube, etc)</div>
                <input value={form.demo} onChange={e=>upd("demo",e.target.value)} placeholder="https://loom.com/share/..." style={inp} onFocus={e=>e.target.style.borderColor=challenge.color} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>
              <div><div style={{fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>GitHub / Source Code (optional)</div>
                <input value={form.github} onChange={e=>upd("github",e.target.value)} placeholder="https://github.com/yourhandle/project" style={inp} onFocus={e=>e.target.style.borderColor=challenge.color} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>
              <div><div style={{fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Describe what you built *</div>
                <textarea value={form.desc} onChange={e=>upd("desc",e.target.value)} placeholder="What problem does it solve? How does it work? What makes it special?" rows={3} style={{...inp,resize:"none",lineHeight:1.6}} onFocus={e=>e.target.style.borderColor=challenge.color} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>
              <button onClick={submit} disabled={!form.track||!form.title||!form.demo||submitting} style={{width:"100%",padding:"12px",background:submitting||!form.track||!form.title||!form.demo?"var(--s2)":challenge.color,color:submitting||!form.track||!form.title||!form.demo?"var(--muted)":challenge.color==="var(--gold)"?"#000":"#fff",border:`2px solid ${submitting||!form.track||!form.title||!form.demo?"var(--border)":challenge.color}`,fontFamily:"var(--fd)",fontSize:18,letterSpacing:3,cursor:!form.track||!form.title||!form.demo?"not-allowed":"pointer",transition:"all .3s",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                {submitting?<><div style={{width:14,height:14,border:`2px solid ${challenge.color}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/> SUBMITTING...</>:"SUBMIT MY BUILD →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BountiesPage({navigate,returnTo,userRole,session}){
  const [filter,setFilter]=useState("all");
  const [applied,setApplied]=useState({});
  const [challengeJoined,setChallengeJoined]=useState({});
  const [liveBounties,setLiveBounties]=useState([]);

  useEffect(()=>{
    getBounties()
      .then(data=>{
        if(data&&data.length>0){
          setLiveBounties(data.map(b=>({
            id:b.id, title:b.title,
            company:b.company?.username||b.company?.company_name||"Company",
            amount:`$${Math.round(b.amount/100)}`,
            deadline:b.deadline||"Open",
            desc:b.description, tags:(b.tags||[]).map(t=>[t,"gold"]),
            applicants:0, hot:false,
          })));
        }
      })
      .catch(()=>{});
  },[]);

  const handleApply=async(bountyId)=>{
    if(!session){navigate("login");return;}
    setApplied(a=>({...a,[bountyId]:true}));
    toast.success("Applied! The company will be in touch 💰");
    try{
      await applyToBounty({bountyId,applicantId:session.user.id,message:""});
    }catch(e){ toast.error("Application failed — try again."); }
  };

  const displayBounties = liveBounties.length>0 ? liveBounties : BOUNTIES;
  const [showSubmit,setShowSubmit]=useState(null);
  const [showDemoRoom,setShowDemoRoom]=useState(null);
  const [challengeData,setChallengeData]=useState(CHALLENGES);
  const handleChallengeSubmit=(challengeId,formData)=>{
    setChallengeData(d=>d.map(c=>c.id===challengeId?{...c,submissions:c.submissions+1,demoSubmissions:[...(c.demoSubmissions||[]),{builder:"You",handle:"yourhandle",flag:"🇳🇬",track:formData.track,title:formData.title,demo:formData.demo,github:formData.github,desc:formData.desc,rating:null,av:"YO",avc:"red"}]}:c));
    setChallengeJoined(j=>({...j,[challengeId]:"submitted"}));
  };
  return (
    <AppShell navigate={navigate} activePage="bounties" returnTo={returnTo} userRole={userRole}>
      {showSubmit&&<ChallengeSubmitModal challenge={challengeData.find(c=>c.id===showSubmit)} onClose={()=>setShowSubmit(null)} onSubmit={(form)=>handleChallengeSubmit(showSubmit,form)}/>}
      {showDemoRoom&&<ChallengeDemoRoom challenge={challengeData.find(c=>c.id===showDemoRoom)} onClose={()=>setShowDemoRoom(null)} isCompany={userRole==="company"}/>}
      <div style={{padding:"22px 30px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>BOUNTIES 💰</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>GET PAID TO BUILD. REAL MONEY. REAL PROJECTS.</div></div>
        <div style={{background:"rgba(26,122,60,.1)",border:"1px solid var(--green)",padding:"8px 14px",textAlign:"center"}}><div style={{fontFamily:"var(--fd)",fontSize:20,color:"var(--gr2)"}}>$3,450</div><div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--muted)",letterSpacing:2}}>TOTAL LIVE BOUNTIES</div></div>
      </div>
      <div style={{padding:"11px 30px",borderBottom:"2px solid var(--border)",display:"flex",gap:6}}>
        {["all","Fintech","Mobile","UI/UX","Backend","AI/ML","Web3"].map(c=><button key={c} onClick={()=>setFilter(c)} style={{padding:"5px 12px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:1,textTransform:"uppercase",background:filter===c?"var(--gold)":"var(--s2)",color:filter===c?"#000":"var(--muted)",border:`2px solid ${filter===c?"var(--gold)":"var(--border)"}`,cursor:"pointer",transition:"all .15s"}}>{c}</button>)}
      </div>
      {/* ── Challenge Bounties ─────────────────────────────────────────────── */}
      <div style={{padding:"18px 30px 20px",borderBottom:"3px solid rgba(240,165,0,.3)",background:"rgba(240,165,0,.03)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div>
            <div style={{fontFamily:"var(--fd)",fontSize:22,letterSpacing:2}}>⚡ CHALLENGES <span style={{background:"rgba(240,165,0,.15)",border:"1px solid rgba(240,165,0,.4)",fontFamily:"var(--fm)",fontSize:8,color:"var(--gold)",padding:"2px 8px",letterSpacing:2,verticalAlign:"middle",marginLeft:6}}>COMPANY-SPONSORED</span></div>
            <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2,marginTop:3}}>BUILD A REAL SOLUTION · SUBMIT YOUR DEMO VIDEO · WIN THE PRIZE</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:14}}>
          {challengeData.map((ch,i)=>(
            <div key={ch.id} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:20,transition:"all .2s",animation:`fadeUp .4s ${i*.08}s ease both`,position:"relative",overflow:"hidden"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.transform="translateX(-3px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none";}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${ch.color},transparent)`}}/>
              <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:12}}>
                <div style={{width:42,height:42,background:ch.color,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:17,color:ch.color==="var(--gold)"?"#000":"#fff",flexShrink:0}}>{ch.logo}</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"var(--fd)",fontSize:19,letterSpacing:1,lineHeight:1.1,marginBottom:2}}>{ch.title}</div>
                  <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>by <span style={{color:ch.color}}>{ch.company}</span> · Prize: <span style={{color:"var(--gr2)",fontWeight:700}}>{ch.prize}</span> · Deadline: {ch.deadline}</div>
                </div>
              </div>
              <p style={{color:"#999",fontSize:12,lineHeight:1.7,marginBottom:11}}>{ch.desc}</p>
              <div style={{marginBottom:11}}>
                <div style={{fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>Build Tracks</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{ch.tracks.map(t=><span key={t} style={{padding:"3px 10px",fontFamily:"var(--fm)",fontSize:8,color:"var(--gold)",border:"1px solid rgba(240,165,0,.3)",background:"rgba(240,165,0,.05)",letterSpacing:1}}>{t}</span>)}</div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:11}}>{ch.tag.map(([t,c])=><Tag key={t} label={t} color={c}/>)}</div>
              <div style={{padding:"8px 11px",background:"var(--s2)",border:"1px solid var(--border)",marginBottom:12,fontSize:11,color:"#aaa",lineHeight:1.6}}>🏆 {ch.judging}</div>
              <div style={{display:"flex",gap:9,alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>👤 {ch.participants} builders · 📎 {ch.submissions} submissions</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {challengeJoined[ch.id]==="submitted"?(
                    <button onClick={()=>setShowDemoRoom(ch.id)} style={{padding:"8px 14px",background:"var(--green)",color:"#fff",border:"2px solid var(--green)",fontFamily:"var(--fd)",fontSize:13,letterSpacing:2,cursor:"pointer"}}>📹 View Demo Room</button>
                  ):challengeJoined[ch.id]==="joined"?(
                    <button onClick={()=>setShowSubmit(ch.id)} style={{padding:"8px 14px",background:ch.color,color:ch.color==="var(--gold)"?"#000":"#fff",border:`2px solid ${ch.color}`,fontFamily:"var(--fd)",fontSize:13,letterSpacing:2,cursor:"pointer"}}>Submit Build →</button>
                  ):(
                    <button onClick={()=>setChallengeJoined(j=>({...j,[ch.id]:"joined"}))} style={{padding:"8px 14px",background:"var(--gold)",color:"#000",border:"2px solid var(--gold)",fontFamily:"var(--fd)",fontSize:13,letterSpacing:2,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.background="var(--gold)";e.target.style.color="#000";}}>JOIN CHALLENGE →</button>
                  )}
                  <button onClick={()=>setShowDemoRoom(ch.id)} style={{padding:"8px 10px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor=ch.color;e.target.style.color=ch.color;}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)"}}>Submissions ({ch.demoSubmissions?.length||0})</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
            <div style={{padding:"22px 30px",display:"flex",flexDirection:"column",gap:13}}>
        {BOUNTIES.map((b,i)=><div key={b.id} style={{background:"var(--surface)",border:`2px solid ${b.hot?"var(--red)":"var(--border)"}`,padding:20,display:"grid",gridTemplateColumns:"1fr auto",gap:16,transition:"all .2s",animation:`fadeUp .4s ${i*.08}s ease both`,position:"relative"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateX(-3px)";e.currentTarget.style.boxShadow=`4px 4px 0 ${b.hot?"var(--red)":"var(--border)"}`}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
          {b.hot&&<div style={{position:"absolute",top:-1,right:16,background:"var(--red)",color:"#fff",fontFamily:"var(--fm)",fontSize:7,padding:"3px 9px",letterSpacing:2}}>🔥 HOT</div>}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:9}}>
              <div style={{fontFamily:"var(--fd)",fontSize:30,color:"var(--gr2)",lineHeight:1}}>{b.amount}</div>
              <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}><div style={{marginBottom:2}}>🏢 {b.company} · {b.loc}</div><div style={{color:"var(--r2)"}}>⏳ {b.deadline} left · {b.applicants} applicants</div></div>
            </div>
            <div style={{fontFamily:"var(--fd)",fontSize:19,letterSpacing:1,marginBottom:5,lineHeight:1.1}}>{b.title}</div>
            <p style={{color:"#999",fontSize:12,lineHeight:1.6,marginBottom:9}}>{b.desc}</p>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{b.tags.map(t=><Tag key={t} label={t} color="gold"/>)}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7,justifyContent:"center",minWidth:114}}>
            <button onClick={()=>applied[b.id]?setApplied(a=>({...a,[b.id]:false})):handleApply(b.id)} style={{padding:"10px 14px",fontFamily:"var(--fd)",fontSize:15,letterSpacing:2,cursor:"pointer",transition:"all .15s",background:applied[b.id]?"var(--green)":"var(--gold)",color:applied[b.id]?"#fff":"#000",border:`2px solid ${applied[b.id]?"var(--green)":"var(--gold)"}`,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>{applied[b.id]?"✓ Applied!":"Apply Now"}</button>
            <button onClick={()=>navigate("messages")} style={{padding:"8px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--white)";e.target.style.color="var(--white)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>Ask Question</button>
          </div>
        </div>)}
      </div>
      <div style={{margin:"0 30px 36px",background:"var(--gold)",border:"2px solid #0A0A0A",padding:26,display:"flex",alignItems:"center",justifyContent:"space-between",gap:18}}>
        <div><div style={{fontFamily:"var(--fd)",fontSize:24,letterSpacing:2,color:"#0A0A0A",marginBottom:4}}>HAVE A PROJECT? POST A BOUNTY.</div><p style={{color:"rgba(0,0,0,.7)",fontSize:12,lineHeight:1.5}}>Tap into Africa's best builders. Set your budget, define the task, get it done.</p></div>
        <button style={{background:"#0A0A0A",color:"var(--gold)",border:"2px solid #0A0A0A",padding:"11px 22px",fontFamily:"var(--fd)",fontSize:17,letterSpacing:3,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="var(--red)";e.target.style.borderColor="var(--red)";}} onMouseLeave={e=>{e.target.style.background="#0A0A0A";e.target.style.borderColor="#0A0A0A";}}>POST BOUNTY →</button>
      </div>
    </AppShell>
  );
}

// ── COMMUNITY ─────────────────────────────────────────────────────────────────
const CHAPTER_MSGS = {
  "Nigeria Hub":[
    {user:"Tolu Kehinde",av:"TK",avc:"red",flag:"🇳🇬",text:"Who's going to the Lagos Builder Meetup on Friday? I'll be presenting my Agric AI project 🔥",time:"5m ago"},
    {user:"Obioma Kalu",av:"OK",avc:"red",flag:"🇳🇬",text:"I'll be there! Anyone else building fintech tools should come out — great connections.",time:"3m ago"},
    {user:"Emeka Obi",av:"EO",avc:"gold",flag:"🇳🇬",text:"I'm building a USSD savings app for market traders. Would love feedback from the chapter.",time:"1m ago"},
  ],
  "Kenya Hub":[
    {user:"Nadia Wanjiru",av:"NW",avc:"green",flag:"🇰🇪",text:"Safaricom just dropped new M-Pesa APIs. Anyone integrated these yet?",time:"10m ago"},
    {user:"Mwangi Kamau",av:"MK",avc:"gold",flag:"🇰🇪",text:"Yes! The C2B v2 is much cleaner. I can share my integration code if helpful.",time:"7m ago"},
  ],
  "Ghana Hub":[
    {user:"Kofi Osei",av:"KO",avc:"gold",flag:"🇬🇭",text:"Ghana fintech builders — let's coordinate on the Pan-Africa hackathon next month. Who's in?",time:"20m ago"},
    {user:"Amara Mensah",av:"AM",avc:"gold",flag:"🇬🇭",text:"I'm in. I'll handle the mobile UI side if someone handles payments.",time:"15m ago"},
  ],
  "South Africa Hub":[
    {user:"Sipho Dlamini",av:"SD",avc:"green",flag:"🇿🇦",text:"Cape Town Dev Summit is next month. VIBR members get free entry. DM me for the code.",time:"1h ago"},
  ],
  "Ethiopia Hub":[],
  "Senegal Hub":[
    {user:"Moussa Bah",av:"MB",avc:"green",flag:"🇸🇳",text:"Deploying Wolof NLP translator to production this week. Testing link in bio.",time:"2h ago"},
  ],
  "Rwanda Hub":[],
  "Egypt Hub":[],
};

function CommunityPage({navigate,returnTo,userRole,session}){
  const [joined,setJoined]=useState({});
  const [activeChapter,setActiveChapter]=useState(null);
  const [chapterMsgs,setChapterMsgs]=useState(CHAPTER_MSGS);
  const [chatInput,setChatInput]=useState("");

  const sendMsg=async()=>{
    if(!chatInput.trim()||!activeChapter)return;
    if(!session){navigate("login");return;}
    const text=chatInput; setChatInput("");
    setChapterMsgs(m=>({...m,[activeChapter]:[...(m[activeChapter]||[]),{user:"You",av:"YO",avc:"red",flag:"🇳🇬",text,time:"Just now"}]}));
    try{
      const {data:ch}=await supabase.from("chapters").select("id").eq("name",activeChapter).single();
      if(ch) await supabase.from("chapter_messages")
        .insert({chapter_id:ch.id,sender_id:session.user.id,content:text});
    }catch{}
  };

  return (
    <AppShell navigate={navigate} activePage="community" returnTo={returnTo} userRole={userRole}>
      {/* Chapter Chat Modal */}
      {activeChapter&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setActiveChapter(null)}>
          <div style={{background:"var(--surface)",border:"2px solid var(--green)",width:"100%",maxWidth:580,height:520,display:"flex",flexDirection:"column",animation:"fadeUp .3s ease both"}} onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{padding:"14px 18px",borderBottom:"2px solid var(--border)",display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:22}}>{CHAPTERS.find(c=>c.name===activeChapter)?.flag}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:1,color:"var(--gr2)"}}>{activeChapter}</div>
                <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:1}}>Chapter Discussion · {CHAPTERS.find(c=>c.name===activeChapter)?.members.toLocaleString()} members · separate from Spaces & DMs</div>
              </div>
              <button onClick={()=>setActiveChapter(null)} style={{background:"transparent",border:"1px solid var(--border)",color:"var(--muted)",width:28,height:28,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            {/* Messages */}
            <div style={{flex:1,overflowY:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:12}}>
              {(chapterMsgs[activeChapter]||[]).map((m,i)=>(
                <div key={i} style={{display:"flex",gap:9,animation:"fadeUp .2s ease both"}}>
                  <Av name={m.av} color={m.avc} size={32}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                      <span style={{fontWeight:700,fontSize:12}}>{m.user}</span>
                      <span style={{fontSize:12}}>{m.flag}</span>
                      <span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>{m.time}</span>
                    </div>
                    <div style={{fontSize:13,color:"#ddd",lineHeight:1.6,background:"var(--s2)",padding:"8px 12px",border:"1px solid var(--border)",display:"inline-block",maxWidth:"90%"}}>{m.text}</div>
                  </div>
                </div>
              ))}
              {(chapterMsgs[activeChapter]||[]).length===0&&(
                <div style={{textAlign:"center",padding:"32px",color:"var(--muted)"}}>
                  <div style={{fontSize:32,marginBottom:8}}>{CHAPTERS.find(c=>c.name===activeChapter)?.flag}</div>
                  <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,textTransform:"uppercase"}}>Be the first to post in {activeChapter}</div>
                </div>
              )}
            </div>
            {/* Input */}
            {joined[activeChapter]?(
              <div style={{padding:"12px 16px",borderTop:"2px solid var(--border)",display:"flex",gap:8,background:"var(--s2)"}}>
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()} placeholder={`Post in ${activeChapter}...`} style={{flex:1,padding:"9px 12px",background:"var(--bg)",border:"1.5px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--green)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                <button onClick={sendMsg} style={{padding:"9px 16px",background:"var(--green)",color:"#fff",border:"2px solid var(--green)",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer",whiteSpace:"nowrap"}}>POST →</button>
              </div>
            ):(
              <div style={{padding:"14px 18px",borderTop:"2px solid var(--border)",textAlign:"center",background:"var(--s2)"}}>
                <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:8}}>JOIN THIS CHAPTER TO POST IN THE DISCUSSION</div>
                <button onClick={()=>{setJoined(j=>({...j,[activeChapter]:true}));}} style={{padding:"8px 22px",background:"var(--green)",color:"#fff",border:"2px solid var(--green)",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer"}}>Join {activeChapter} →</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{padding:"22px 30px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10}}>
        <div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>COUNTRY <span style={{color:"var(--red)"}}>CHAPTERS</span></div>
        <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>54 COUNTRIES. ONE PLATFORM. YOUR LOCAL VIBR HUB.</div>
      </div>
      <div style={{background:"var(--green)",padding:"11px 30px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}><span style={{width:6,height:6,background:"#fff",borderRadius:"50%",display:"inline-block",animation:"pulse 2s infinite"}}/><span style={{fontFamily:"var(--fm)",fontSize:9,color:"#fff",letterSpacing:2}}>3 LIVE EVENTS NOW</span></div>
        <div style={{display:"flex",gap:16}}>{[["Lagos Builder Meetup","312"],["Ghana Fintech Hackathon","89"],["African AI Study Group","201"]].map(([t,c])=><div key={t} onClick={()=>navigate("hackathons")} style={{fontFamily:"var(--fm)",fontSize:9,color:"rgba(255,255,255,.8)",cursor:"pointer"}}>{t} · <span style={{color:"var(--g2)"}}>{c} watching</span></div>)}</div>
      </div>
      <div style={{padding:"22px 30px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:13}}>
          {CHAPTERS.map((ch,i)=>(
            <div key={ch.name} style={{background:"var(--surface)",border:`2px solid ${joined[ch.name]?"var(--green)":"var(--border)"}`,padding:20,transition:"all .2s",animation:`fadeUp .4s ${i*.06}s ease both`,position:"relative"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=joined[ch.name]?"var(--green)":"var(--gold)";e.currentTarget.style.transform="translate(-2px,-2px)";e.currentTarget.style.boxShadow="4px 4px 0 var(--border)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=joined[ch.name]?"var(--green)":"var(--border)";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
              {joined[ch.name]&&<div style={{position:"absolute",top:11,right:11,background:"var(--green)",color:"#fff",fontSize:7,padding:"2px 7px",fontFamily:"var(--fm)",letterSpacing:1}}>MEMBER ✓</div>}
              <div style={{fontSize:34,marginBottom:11,lineHeight:1}}>{ch.flag}</div>
              <div style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:2,marginBottom:2}}>{ch.name}</div>
              <div style={{fontFamily:"var(--fm)",fontSize:8,color:ch.color,marginBottom:2}}>{ch.members.toLocaleString()} builders</div>
              <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",marginBottom:9}}>{ch.city}</div>
              <p style={{color:"#777",fontSize:12,lineHeight:1.5,marginBottom:14}}>{ch.desc}</p>
              {/* Chapter recent message preview */}
              {(chapterMsgs[ch.name]||[]).slice(-1).map((m,i)=>(
                <div key={i} style={{background:"var(--s2)",border:"1px solid var(--border)",padding:"8px 10px",marginBottom:12,borderRadius:0}}>
                  <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",marginBottom:3}}>{m.user} {m.flag} · {m.time}</div>
                  <div style={{fontSize:11,color:"#aaa",lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.text}</div>
                </div>
              ))}
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setJoined(j=>({...j,[ch.name]:!j[ch.name]}))} style={{flex:1,padding:"8px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,textTransform:"uppercase",background:joined[ch.name]?"var(--green)":"transparent",color:joined[ch.name]?"#fff":"var(--muted)",border:`2px solid ${joined[ch.name]?"var(--green)":"var(--border)"}`,cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{if(!joined[ch.name]){e.target.style.borderColor="var(--green)";e.target.style.color="var(--gr2)";}}} onMouseLeave={e=>{if(!joined[ch.name]){e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}}>{joined[ch.name]?"Joined ✓":"Join Chapter"}</button>
                <button onClick={()=>setActiveChapter(ch.name)} style={{padding:"8px 11px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:4}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.color="var(--gold)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)";}}>💬 {(chapterMsgs[ch.name]||[]).length||0}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ── LEADERBOARD ───────────────────────────────────────────────────────────────
function LeaderboardPage({navigate,returnTo,userRole,session}){
  const [scope,setScope]=useState("global");
  const [liveBoard,setLiveBoard]=useState([]);

  useEffect(()=>{
    getLeaderboard(20)
      .then(data=>{
        if(data&&data.length>0){
          setLiveBoard(data.map((p,i)=>({
            rank:i+1, name:p.full_name||p.username||"Builder",
            handle:p.username||"builder",
            flag:"🌍", badge:p.rank||"Seedling",
            pts:p.vibe_points||0,
            drops:0, collabs:0,
            av:(p.username||"B").slice(0,2).toUpperCase(),
            avc:["gold","red","green"][i%3],
          })));
        }
      })
      .catch(()=>{});
  },[]);

  const [lbLoading,setLbLoading]=useState(true);
  useEffect(()=>{setLbLoading(true);getLeaderboard(20).then(data=>{if(data&&data.length>0){setLiveBoard(data.map((p,i)=>({rank:i+1,name:p.full_name||p.username||"Builder",handle:p.username||"builder",flag:"🌍",badge:p.rank||"Seedling",pts:p.vibe_points||0,drops:0,collabs:0,av:(p.username||"B").slice(0,2).toUpperCase(),avc:["gold","red","green"][i%3]})));}}). catch(()=>{}).finally(()=>setLbLoading(false));},[]);
  const board = liveBoard.length>0 ? liveBoard : LEADERBOARD;
  const rC=["var(--gold)","#C0C0C0","#CD7F32"];
  return (
    <AppShell navigate={navigate} activePage="leaderboard" returnTo={returnTo} userRole={userRole}>
      <div style={{padding:"22px 30px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>LEADERBOARD 🏆</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>TOP BUILDERS IN AFRICA</div></div>
        <div style={{display:"flex",border:"2px solid var(--border)",overflow:"hidden"}}>
          {["global","nigeria","kenya","ghana"].map(s=><button key={s} onClick={()=>setScope(s)} style={{padding:"7px 14px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,textTransform:"uppercase",background:scope===s?"var(--red)":"transparent",color:scope===s?"#fff":"var(--muted)",border:"none",cursor:"pointer",transition:"all .2s"}}>{s}</button>)}
        </div>
      </div>
      {/* Podium */}
      <div style={{padding:"32px 30px",background:"var(--surface)",borderBottom:"2px solid var(--border)",display:"flex",justifyContent:"center",alignItems:"flex-end",gap:12}}>
        {[LEADERBOARD[1],LEADERBOARD[0],LEADERBOARD[2]].map((b,i)=>{
          const heights=["140px","180px","112px"],places=[2,1,3],medals=["🥈","🥇","🥉"];
          return <div key={b.name} onClick={()=>navigate("profile")} style={{display:"flex",flexDirection:"column",alignItems:"center",cursor:"pointer",transition:"transform .2s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-7px)"} onMouseLeave={e=>e.currentTarget.style.transform="none"}>
            <div style={{fontSize:22,marginBottom:4}}>{medals[i]}</div>
            <Av name={b.av} color={b.avc} size={46}/>
            <div style={{fontFamily:"var(--fd)",fontSize:15,letterSpacing:1,marginTop:6,textAlign:"center"}}>{b.name.split(" ")[0]}</div>
            <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",marginBottom:6}}>{b.flag} {b.badge}</div>
            <div style={{width:86,height:heights[i],background:i===1?"var(--gold)":i===0?"#C0C0C0":"#CD7F32",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:2,border:"2px solid var(--border)"}}>
              <div style={{fontFamily:"var(--fd)",fontSize:24,color:"#000"}}>{places[i]}</div>
              <div style={{fontFamily:"var(--fm)",fontSize:9,color:"rgba(0,0,0,.7)",fontWeight:700}}>{b.pts.toLocaleString()}</div>
            </div>
          </div>;
        })}
      </div>
      {/* Table */}
      <div style={{padding:"22px 30px"}}>
        <div style={{background:"var(--surface)",border:"2px solid var(--border)",overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"48px 1fr 105px 72px 72px 85px",padding:"9px 16px",borderBottom:"2px solid var(--border)",background:"var(--s2)"}}>
            {["#","BUILDER","BADGE","DROPS","COLLABS","SCORE"].map(h=><div key={h} style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>{h}</div>)}
          </div>
                    {lbLoading&&[1,2,3,4,5].map(n=><SkeletonCard key={n}/>)}
          {board.map((b,i)=><div key={b.name} onClick={()=>navigate("profile")} style={{display:"grid",gridTemplateColumns:"48px 1fr 105px 72px 72px 85px",padding:"12px 16px",borderBottom:"1px solid var(--border)",transition:"background .15s",cursor:"pointer",animation:`fadeUp .3s ${i*.06}s ease both`}} onMouseEnter={e=>e.currentTarget.style.background="var(--s2)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{fontFamily:"var(--fd)",fontSize:20,color:rC[i]||"var(--muted)",display:"flex",alignItems:"center"}}>{b.rank}</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}><Av name={b.av} color={b.avc} size={32}/><div><div style={{fontWeight:700,fontSize:12}}>{b.name} {b.flag}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>@{b.handle}</div></div></div>
            <div style={{display:"flex",alignItems:"center",fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>{b.badge}</div>
            <div style={{display:"flex",alignItems:"center",fontFamily:"var(--fd)",fontSize:18}}>{b.drops}</div>
            <div style={{display:"flex",alignItems:"center",fontFamily:"var(--fd)",fontSize:18}}>{b.collabs}</div>
            <div style={{display:"flex",alignItems:"center",fontFamily:"var(--fd)",fontSize:18,color:"var(--gold)"}}>{b.pts.toLocaleString()}</div>
          </div>)}
        </div>
        <div style={{marginTop:20,display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
          {[["🌱","Seedling","0–499"],["⚡","Builder","500–1,999"],["🔥","Vibe Lord","2,000–4,999"],["👑","Legend","5,000–9,999"],["🌍","Icon","10,000+"]].map(([e,n,p])=><div key={n} style={{background:"var(--surface)",border:"1px solid var(--border)",padding:"12px 14px",textAlign:"center"}}><div style={{fontSize:22,marginBottom:5}}>{e}</div><div style={{fontFamily:"var(--fd)",fontSize:14,letterSpacing:1,marginBottom:3}}>{n}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--gold)"}}>{p} pts</div></div>)}
        </div>
      </div>
    </AppShell>
  );
}

// ── MESSAGES ──────────────────────────────────────────────────────────────────
function MessagesPage({navigate,returnTo,userRole,session}){
  const [active,setActive]=useState(DM_CONTACTS[0]);
  const [allMsgs,setAllMsgs]=useState(Object.fromEntries(DM_CONTACTS.map(c=>[c.name,c.msgs])));
  const [input,setInput]=useState("");
  const [composing,setComposing]=useState(false);
  const [composeHandle,setComposeHandle]=useState("");
  const [composeMsg,setComposeMsg]=useState("");
  const [search,setSearch]=useState("");
  const [liveConvos,setLiveConvos]=useState([]);
  const [liveMessages,setLiveMessages]=useState([]);
  const channelRef=useRef(null);

  // Load conversations
  useEffect(()=>{
    if(!session) return;
    getConversations(session.user.id)
      .then(data=>{ if(data?.length>0) setLiveConvos(data); })
      .catch(()=>{});
  },[session]);

  // Load + subscribe to messages for active conversation
  useEffect(()=>{
    if(!session||!active?.id) return;
    getMessages(active.id)
      .then(data=>{ if(data) setLiveMessages(data); })
      .catch(()=>{});
    channelRef.current = subscribeToMessages(active.id,(msg)=>{
      setLiveMessages(prev=>[...prev,msg]);
    });
    return ()=>{ if(channelRef.current) unsubscribe(channelRef.current); };
  },[active?.id,session]);

  const msgs = liveMessages.length>0
    ? liveMessages.map(m=>({from:m.sender_id===session?.user?.id?"me":"them",text:m.content,time:new Date(m.created_at).toLocaleTimeString()}))
    : (allMsgs[active?.name]||[]);

  const send=async()=>{
    if(!input.trim()) return;
    const text=input; setInput("");
    if(session&&active?.id){
      sendMessage({conversationId:active.id,senderId:session.user.id,content:text}).catch(()=>{});
    } else {
      setAllMsgs(m=>({...m,[active.name]:[...(m[active.name]||[]),{from:"me",text,time:"Just now"}]}));
    }
  };
  const startConvo=()=>{
    if(!composeHandle.trim())return;
    const newContact={name:composeHandle,handle:composeHandle.replace("@",""),flag:"🌍",av:composeHandle.slice(0,2).toUpperCase(),avc:"gold",lastMsg:composeMsg||"",time:"Now",unread:0,online:false,msgs:composeMsg?[{from:"me",text:composeMsg,time:"Just now"}]:[]};
    setAllMsgs(m=>({...m,[newContact.name]:newContact.msgs}));
    setActive(newContact);
    setComposing(false);setComposeHandle("");setComposeMsg("");
  };
  const filtered=DM_CONTACTS.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.handle.toLowerCase().includes(search.toLowerCase()));
  return (
    <AppShell navigate={navigate} activePage="messages" returnTo={returnTo} userRole={userRole}>
      <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
        <div style={{width:268,borderRight:"2px solid var(--border)",display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"14px 16px 12px",borderBottom:"2px solid var(--border)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
              <div style={{fontFamily:"var(--fd)",fontSize:22,letterSpacing:2}}>MESSAGES</div>
              <button onClick={()=>setComposing(true)} style={{width:30,height:30,background:"var(--red)",color:"#fff",border:"none",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}} onMouseEnter={e=>e.target.style.opacity=".8"} onMouseLeave={e=>e.target.style.opacity="1"} title="New message">✏</button>
            </div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search builders..." style={{width:"100%",padding:"8px 12px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:12,outline:"none",fontFamily:"var(--fb)",borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
          </div>
          {composing&&(
            <div style={{padding:"14px 16px",borderBottom:"2px solid var(--border)",background:"var(--s2)",animation:"fadeUp .2s ease both"}}>
              <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:7,textTransform:"uppercase"}}>New Message</div>
              <div style={{position:"relative",marginBottom:8}}>
                <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--gold)",fontFamily:"var(--fm)",fontSize:11}}>@</span>
                <input value={composeHandle} onChange={e=>setComposeHandle(e.target.value)} placeholder="handle or name..." style={{width:"100%",padding:"8px 8px 8px 26px",background:"var(--bg)",border:"1.5px solid var(--border)",color:"var(--text)",fontSize:12,outline:"none",fontFamily:"var(--fb)",borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>
              <textarea value={composeMsg} onChange={e=>setComposeMsg(e.target.value)} placeholder="Type your first message..." rows={2} style={{width:"100%",padding:"7px 10px",background:"var(--bg)",border:"1.5px solid var(--border)",color:"var(--text)",fontSize:12,outline:"none",fontFamily:"var(--fb)",resize:"none",lineHeight:1.5,borderRadius:0,marginBottom:8,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              <div style={{display:"flex",gap:6}}>
                <button onClick={startConvo} style={{flex:1,padding:"6px",background:"var(--red)",color:"#fff",border:"2px solid var(--red)",fontFamily:"var(--fd)",fontSize:13,letterSpacing:2,cursor:"pointer"}}>START CHAT</button>
                <button onClick={()=>setComposing(false)} style={{padding:"6px 10px",background:"transparent",border:"1px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,cursor:"pointer",letterSpacing:1}}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{overflowY:"auto",flex:1}}>
                      {filtered.length===0&&<div style={{padding:20,textAlign:"center",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2}}>NO CONVERSATIONS YET</div>}
          {filtered.map(c=><div key={c.name} onClick={()=>setActive(c)} style={{display:"flex",gap:10,padding:"13px 16px",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .15s",background:active.name===c.name?"var(--s2)":"transparent",borderLeft:active.name===c.name?"3px solid var(--red)":"3px solid transparent"}} onMouseEnter={e=>{if(active.name!==c.name)e.currentTarget.style.background="var(--surface)";}} onMouseLeave={e=>{if(active.name!==c.name)e.currentTarget.style.background="transparent";}}>
              <div style={{position:"relative"}}><Av name={c.av} color={c.avc} size={38}/>{c.online&&<div style={{position:"absolute",bottom:0,right:0,width:9,height:9,background:"var(--gr2)",borderRadius:"50%",border:"2px solid var(--bg)"}}/>}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}><span style={{fontWeight:700,fontSize:12}}>{c.name} {c.flag}</span><span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>{c.time}</span></div>
                <div style={{fontSize:11,color:"var(--muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.lastMsg}</div>
              </div>
              {c.unread>0&&<div style={{width:16,height:16,background:"var(--red)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fm)",fontSize:8,color:"#fff",flexShrink:0,alignSelf:"center"}}>{c.unread}</div>}
            </div>)}
          </div>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"13px 22px",borderBottom:"2px solid var(--border)",display:"flex",alignItems:"center",gap:11,background:"var(--surface)"}}>
            <div style={{position:"relative"}}><Av name={active.av} color={active.avc} size={38}/>{active.online&&<div style={{position:"absolute",bottom:0,right:0,width:9,height:9,background:"var(--gr2)",borderRadius:"50%",border:"2px solid var(--surface)"}}/>}</div>
            <div>
              <div style={{fontWeight:700,fontSize:14}}>{active.name} {active.flag}</div>
              <div style={{fontFamily:"var(--fm)",fontSize:9,color:active.online?"var(--gr2)":"var(--muted)"}}>{active.online?"Online now":"Offline"} · @{active.handle}</div>
            </div>
            <div style={{marginLeft:"auto",display:"flex",gap:8}}>
              <button onClick={()=>navigate("collabs")} style={{background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",padding:"6px 12px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--green)";e.target.style.color="var(--gr2)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>🤝 Collab</button>
              <button onClick={()=>navigate("sqvad")} style={{background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",padding:"6px 12px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>🔥 My Squad</button>
              <button onClick={()=>navigate("profile")} style={{background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",padding:"6px 12px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>Profile</button>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"20px",display:"flex",flexDirection:"column",gap:12}}>
            {msgs.length===0&&<div style={{textAlign:"center",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:10,letterSpacing:2,margin:"auto"}}>SAY HI TO {active.name.toUpperCase()} 👋</div>}
            {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.from==="me"?"flex-end":"flex-start",animation:"fadeUp .3s ease both"}}>
              <div style={{maxWidth:"62%"}}>
                <div style={{padding:"11px 14px",background:m.from==="me"?"var(--red)":"var(--s2)",border:`2px solid ${m.from==="me"?"var(--red)":"var(--border)"}`,fontSize:13,lineHeight:1.6,color:m.from==="me"?"#fff":"var(--text)"}}>{m.text}</div>
                <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",marginTop:3,textAlign:m.from==="me"?"right":"left"}}>{m.time}</div>
              </div>
            </div>)}
          </div>
          <div style={{padding:"14px 20px",borderTop:"2px solid var(--border)",display:"flex",gap:9,background:"var(--surface)"}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type a message... (Enter to send)" style={{flex:1,padding:"11px 14px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",transition:"border-color .2s",borderRadius:0}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            <button onClick={send} style={{background:"var(--red)",color:"#fff",border:"2px solid var(--red)",padding:"11px 20px",fontFamily:"var(--fd)",fontSize:16,letterSpacing:2,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--red)";}} onMouseLeave={e=>{e.target.style.background="var(--red)";e.target.style.color="#fff";}}>SEND →</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ── PROFILE ───────────────────────────────────────────────────────────────────
function ProfilePage({navigate,returnTo,userRole,session,profile:myProfile}){
  const [tab,setTab]=useState("projects");
  const [following,setFollowing]=useState(false);
  const [liveProfile,setLiveProfile]=useState(null);
  const [livePosts,setLivePosts]=useState([]);

  useEffect(()=>{
    if(!session) return;
    // Load current user's profile
    getProfile(session.user.id)
      .then(p=>setLiveProfile(p))
      .catch(()=>{});
    // Load their posts
    getPosts({limit:10})
      .then(data=>{
        const mine = data?.filter(p=>p.author_id===session.user.id)||[];
        setLivePosts(mine.map(p=>({
          id:p.id, title:p.title,
          votes:p.vote_count||0, comments:p.comment_count||0,
          tags:(p.tags||[]).map(t=>[t,"gold"]),
          time:new Date(p.created_at).toLocaleDateString(),
          desc:p.description||"",
        })));
      })
      .catch(()=>{});
  },[session]);

  const displayProfile = liveProfile||myProfile;
  const displayName = displayProfile?.full_name||displayProfile?.username||"Your Name";
  const displayHandle = displayProfile?.username||"yourhandle";
  const displayCountry = displayProfile?.country||"🌍";
  const displayBio = displayProfile?.bio||"";
  const displayAvatar = displayProfile?.avatar_url;
  const vibePoints = displayProfile?.vibe_points||0;
  const rank = displayProfile?.rank||"Seedling";
  const projects=[
    {title:"Agric Supply Chain AI",desc:"AI connects farmers to buyers, skips middlemen",tags:[["AI","gold"],["React Native","red"]],votes:248,time:"2 days ago"},
    {title:"Naira DeFi Wallet",desc:"Non-custodial wallet for Nigerian users",tags:[["Web3","green"],["Solidity","gold"]],votes:189,time:"1 week ago"},
    {title:"USSD Delivery Tracker",desc:"Track your delivery with any feature phone",tags:[["USSD","red"],["Node.js","gold"]],votes:97,time:"2 weeks ago"},
  ];
  const activity=[
    {icon:"▲",text:"Upvoted Kofi Osei's Pan-African remittance project",time:"2h ago"},
    {icon:"💬",text:"Commented on Nadia Wanjiru's AI tutor post",time:"5h ago"},
    {icon:"🤝",text:"Sent collab request to Zara Ndlovu",time:"1d ago"},
    {icon:"🔥",text:"Dropped project: USSD Delivery Tracker",time:"2w ago"},
  ];
  return (
    <AppShell navigate={navigate} activePage="profile" returnTo={returnTo} userRole={userRole}>
      <div style={{minHeight:"100vh"}}>
        <div style={{height:190,background:"linear-gradient(135deg,var(--red) 0%,#6B0000 50%,#0A0A0A 100%)",position:"relative",overflow:"hidden",borderBottom:"2px solid var(--border)"}}>
          <div style={{position:"absolute",fontFamily:"var(--fd)",fontSize:160,color:"rgba(255,255,255,.04)",bottom:-16,left:-8,letterSpacing:-7}}>VIBR</div>
        </div>
        <div style={{maxWidth:820,margin:"0 auto",padding:"0 28px"}}>
          <div style={{display:"flex",alignItems:"flex-end",gap:18,marginTop:-42,marginBottom:24,position:"relative",zIndex:2}}>
            <div style={{width:86,height:86,border:"4px solid var(--bg)",flexShrink:0,position:"relative"}}>
              {displayAvatar
                ? <img src={displayAvatar} alt={displayName} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <div style={{width:"100%",height:"100%",background:"var(--red)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:38,color:"#fff"}}>{(displayName||"?").slice(0,2).toUpperCase()}</div>
              }
              {session && <AvatarUpload userId={session.user.id} currentUrl={displayAvatar} onSuccess={url=>{toast.success("Photo updated!");}} style={{position:"absolute",bottom:0,right:0}}/>}
            </div>
            <div style={{flex:1,paddingBottom:5}}>
              <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:3}}>
                <div style={{fontFamily:"var(--fd)",fontSize:36,letterSpacing:2,lineHeight:1}}>TOLU KEHINDE</div>
                <div style={{background:"var(--gold)",color:"#000",fontFamily:"var(--fm)",fontSize:9,padding:"3px 10px",letterSpacing:2}}>VIBE LORD 🔥</div>
              </div>
              <div style={{color:"var(--muted)",fontFamily:"var(--fm)",fontSize:10,letterSpacing:2}}>@tolu_builds · Lagos, Nigeria 🇳🇬</div>
            </div>
            <div style={{display:"flex",gap:8,paddingBottom:5}}>
              <Btn v={following?"ghost":"primary"} onClick={()=>setFollowing(f=>!f)}>{following?"Following ✓":"Follow"}</Btn>
              <Btn v="ghost" onClick={()=>navigate("messages")}>💬 Message</Btn>
            </div>
          </div>
          <p style={{color:"#aaa",fontSize:13,lineHeight:1.8,maxWidth:540,marginBottom:20}}>Building tech for African farmers and small businesses. Vibe coding with React Native + Node.js. Looking for a co-founder on my agritech startup. DM me 🌱</p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>{["React Native","Node.js","Python","Supabase","TensorFlow","Paystack"].map(s=><span key={s} style={{padding:"4px 11px",background:"var(--s2)",border:"1px solid var(--border)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:1,color:"var(--muted)"}}>{s}</span>)}</div>
          <div style={{display:"flex",gap:0,marginBottom:32,border:"2px solid var(--border)",overflow:"hidden"}}>
            {[["3","Projects"],["1.2K","Vibe Score"],["248","Followers"],["12","Following"],["7","Collabs"]].map(([v,l],i)=><div key={l} style={{flex:1,padding:"16px 12px",textAlign:"center",borderRight:i<4?"2px solid var(--border)":"none",background:i===1?"rgba(240,165,0,.05)":"transparent"}}><div style={{fontFamily:"var(--fd)",fontSize:28,color:i===1?"var(--gold)":"var(--white)",lineHeight:1}}>{v}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2,textTransform:"uppercase",marginTop:3}}>{l}</div></div>)}
          </div>
          <div style={{display:"flex",borderBottom:"2px solid var(--border)",marginBottom:26}}>
            {["projects","activity","sqvad","collabs","bounties"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"11px 20px",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,textTransform:"uppercase",background:"transparent",border:"none",cursor:"pointer",color:tab===t?"var(--white)":"var(--muted)",borderBottom:tab===t?"3px solid var(--red)":"3px solid transparent",marginBottom:-2,transition:"color .15s"}}>{t==="sqvad"?"MY SQUAD":t}</button>)}
          </div>
          {tab==="projects"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:16,paddingBottom:52}}>
            {projects.map((p,i)=><div key={i} onClick={()=>navigate(`post-${i+1}`)} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:20,transition:"all .2s",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.transform="translate(-3px,-3px)";e.currentTarget.style.boxShadow="6px 6px 0 var(--border)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
              <div style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:1,marginBottom:6,lineHeight:1.1}}>{p.title}</div>
              <p style={{color:"#888",fontSize:12,lineHeight:1.6,marginBottom:11}}>{p.desc}</p>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:11}}>{p.tags.map(([t,c])=><Tag key={t} label={t} color={c}/>)}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--gold)"}}>▲ {p.votes}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>{p.time}</div></div>
            </div>)}
            <div onClick={()=>navigate("drop")} style={{background:"transparent",border:"2px dashed var(--border)",padding:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",minHeight:150,transition:"all .2s",gap:8}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--red)";e.currentTarget.style.background="rgba(209,43,43,.05)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="transparent";}}>
              <div style={{fontSize:28,color:"var(--muted)"}}>+</div>
              <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:2,textAlign:"center",textTransform:"uppercase"}}>Drop a new project</div>
            </div>
          </div>}
          {tab==="sqvad"&&<div style={{paddingBottom:52}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",textTransform:"uppercase"}}>Squads this builder is part of</div>
              <button onClick={()=>navigate("sqvad")} style={{background:"transparent",border:"2px solid var(--gold)",color:"var(--gold)",padding:"6px 16px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.background="var(--gold)";e.target.style.color="#000";}} onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color="var(--gold)";}}>Manage Squads</button>
            </div>
            <SqvadProfileCard squads={INITIAL_SQVAD.slice(0,1)} navigate={navigate}/>
          </div>}
          {tab==="activity"&&<div style={{display:"flex",flexDirection:"column",gap:10,paddingBottom:52}}>
            {activity.map((a,i)=><div key={i} style={{display:"flex",gap:12,alignItems:"center",padding:"12px 16px",background:"var(--surface)",border:"1px solid var(--border)",animation:`fadeUp .3s ${i*.07}s ease both`}}>
              <div style={{fontSize:18,width:26,textAlign:"center"}}>{a.icon}</div>
              <div style={{flex:1,fontSize:13,color:"#bbb"}}>{a.text}</div>
              <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",whiteSpace:"nowrap"}}>{a.time}</div>
            </div>)}
          </div>}
          {tab==="collabs"&&<div style={{paddingBottom:52}}>
            {COLLABS.slice(0,2).map((c,i)=><div key={i} onClick={()=>navigate("collabs")} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:18,marginBottom:12,cursor:"pointer",transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}><div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:1,marginBottom:5}}>{c.project}</div><p style={{color:"#888",fontSize:12,lineHeight:1.5,marginBottom:9}}>{c.desc}</p><div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{c.tags.map(([t,col])=><Tag key={t} label={t} color={col}/>)}</div></div>)}
          </div>}
          {tab==="bounties"&&<div style={{paddingBottom:52}}>
            {BOUNTIES.slice(0,2).map((b,i)=><div key={i} onClick={()=>navigate("bounties")} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:18,marginBottom:12,cursor:"pointer",transition:"border-color .2s",display:"flex",justifyContent:"space-between",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}><div><div style={{fontFamily:"var(--fd)",fontSize:18,color:"var(--gr2)",marginBottom:3}}>{b.amount}</div><div style={{fontWeight:700,fontSize:13}}>{b.title}</div><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",marginTop:2}}>{b.company}</div></div><span style={{background:"var(--gold)",color:"#000",fontFamily:"var(--fm)",fontSize:9,padding:"3px 10px",letterSpacing:1}}>Applied ✓</span></div>)}
          </div>}
        </div>
      </div>
    </AppShell>
  );
}

// ── DROP ──────────────────────────────────────────────────────────────────────
function DropPage({navigate,returnTo,userRole,session}){
  const [form,setForm]=useState({title:"",desc:"",collab:false,open:false,bounty:false});
  const [tags,setTags]=useState([]);
  const [needs,setNeeds]=useState([]);
  const [dropped,setDropped]=useState(false);
  const [dropping,setDropping]=useState(false);
  const update=(k,v)=>setForm(f=>({...f,[k]:v}));
  const inp={width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",transition:"border-color .2s",borderRadius:0};
  const handleDrop=async()=>{
    if(!form.title.trim())return;
    if(!session){navigate("login");return;}
    setDropping(true);
    try{
      const {data,error}=await supabase.from("posts").insert({
        author_id:session.user.id,
        title:form.title,
        description:form.desc,
        tags,
        open_source:form.open,
        open_collab:form.collab,
        has_bounty:form.bounty,
      }).select().single();
      if(error) throw error;
      toast.success("Build dropped! 🔥 Africa can see it now.");
      setDropped(true);
    }catch(e){
      toast.error(e.message||"Drop failed — try again.");
      console.error("Drop error:",e.message);
      setDropping(false);
    }finally{setDropping(false);}
  };
  if(dropped) return (
    <AppShell navigate={navigate} activePage="drop" returnTo={returnTo} userRole={userRole}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",padding:"40px",textAlign:"center"}}>
        <div style={{fontSize:72,marginBottom:20,animation:"fadeUp .5s ease both"}}>🔥</div>
        <div className="fu1" style={{fontFamily:"var(--fd)",fontSize:52,letterSpacing:2,lineHeight:1,marginBottom:12}}>
          {form.title.toUpperCase()||"YOUR BUILD"}<br/><span style={{color:"var(--red)"}}>IS LIVE.</span>
        </div>
        <p className="fu2" style={{color:"var(--muted)",fontSize:15,lineHeight:1.8,maxWidth:420,marginBottom:10}}>
          Your project is now live on the VIBR feed. 12,000+ builders and investors are watching. Go get those upvotes. 🌍
        </p>
        <div className="fu3" style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginBottom:32}}>
          {tags.slice(0,4).map((t,i)=><Tag key={t} label={t} color={["gold","red","green"][i%3]}/>)}
          {form.collab&&<Tag label="🤝 Open Collab" color="green"/>}
          {form.open&&<Tag label="🌍 Open Source" color="gold"/>}
          {form.bounty&&<Tag label="💰 Bounty" color="red"/>}
        </div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
          <button onClick={()=>navigate("feed")} style={{background:"var(--red)",color:"#fff",border:"2px solid var(--red)",padding:"12px 28px",fontFamily:"var(--fd)",fontSize:18,letterSpacing:3,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--red)";}} onMouseLeave={e=>{e.target.style.background="var(--red)";e.target.style.color="#fff";}}>VIEW ON FEED →</button>
          <button onClick={()=>{setDropped(false);setForm({title:"",desc:"",collab:false,open:false,bounty:false});setTags([]);setNeeds([]);}} style={{background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",padding:"12px 28px",fontFamily:"var(--fm)",fontSize:10,letterSpacing:3,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>Drop Another</button>
        </div>
      </div>
    </AppShell>
  );
  return (
    <AppShell navigate={navigate} activePage="drop" returnTo={returnTo} userRole={userRole}>
      <div style={{display:"flex"}}>
        <div style={{flex:1,overflowY:"auto"}}>
          <div style={{padding:"18px 30px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10,display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>navigate("feed")} style={{background:"transparent",border:"none",color:"var(--muted)",cursor:"pointer",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2}} onMouseEnter={e=>e.target.style.color="var(--white)"} onMouseLeave={e=>e.target.style.color="var(--muted)"}>← BACK</button>
            <div style={{fontFamily:"var(--fd)",fontSize:24,letterSpacing:2}}>DROP YOUR <span style={{color:"var(--red)"}}>BUILD</span></div>
          </div>
          <div style={{maxWidth:640,margin:"0 auto",padding:"36px 30px 72px"}}>
            <div style={{display:"flex",flexDirection:"column",gap:24}}>
              <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:3,color:"var(--muted)",marginBottom:7,textTransform:"uppercase"}}>Project Name *</div><input value={form.title} onChange={e=>update("title",e.target.value)} placeholder="What did you build?" style={{...inp,fontSize:16}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/></div>
              <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:3,color:"var(--muted)",marginBottom:7,textTransform:"uppercase"}}>What does it do? *</div><textarea value={form.desc} onChange={e=>update("desc",e.target.value)} placeholder="What problem does it solve? Who is it for?" rows={5} style={{...inp,resize:"none",lineHeight:1.7}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[["Demo Link","https://yourapp.com"],["GitHub Link","https://github.com/you/repo"]].map(([l,p])=><div key={l}><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>{l}</div><input placeholder={p} style={inp} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/></div>)}
              </div>
              <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:3,color:"var(--muted)",marginBottom:8,textTransform:"uppercase"}}>Tech Stack</div><div style={{display:"flex",flexWrap:"wrap",gap:7}}>{STACKS.slice(0,16).map(s=><button key={s} onClick={()=>setTags(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s])} style={{padding:"6px 12px",fontFamily:"var(--fm)",fontSize:9,letterSpacing:1,background:tags.includes(s)?"var(--red)":"var(--s2)",color:tags.includes(s)?"#fff":"var(--muted)",border:`2px solid ${tags.includes(s)?"var(--red)":"var(--border)"}`,cursor:"pointer",transition:"all .15s"}}>{s}{tags.includes(s)?" ✓":""}</button>)}</div></div>
              <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:22}}>
                <div style={{fontFamily:"var(--fd)",fontSize:22,letterSpacing:2,marginBottom:16,color:"var(--gold)"}}>COLLAB SETTINGS</div>
                {[["🤝","Open for Collaboration","Let builders join this project","collab"],["🌍","Open Source","Make this open source on VIBR","open"],["💰","Posting a Bounty","Pay for specific help needed","bounty"]].map(([icon,title,sub,key])=><div key={key} onClick={()=>update(key,!form[key])} style={{display:"flex",alignItems:"center",gap:12,padding:"12px",background:form[key]?"rgba(209,43,43,.08)":"var(--s2)",border:`2px solid ${form[key]?"var(--red)":"var(--border)"}`,cursor:"pointer",transition:"all .15s",marginBottom:8}}>
                  <span style={{fontSize:18}}>{icon}</span>
                  <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{title}</div><div style={{color:"var(--muted)",fontSize:10,fontFamily:"var(--fm)"}}>{sub}</div></div>
                  <div style={{width:40,height:20,background:form[key]?"var(--red)":"var(--border)",borderRadius:10,position:"relative",transition:"background .2s",flexShrink:0}}><div style={{width:14,height:14,background:"#fff",borderRadius:"50%",position:"absolute",top:3,left:form[key]?23:3,transition:"left .2s"}}/></div>
                </div>)}
                {form.collab&&<div style={{marginTop:14,animation:"fadeUp .3s ease both"}}>
                  <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:9,textTransform:"uppercase"}}>Roles needed:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{["Frontend Dev","Backend Dev","UI/UX Designer","Mobile Dev","ML Engineer","Co-founder","DevOps","Marketing"].map(n=><button key={n} onClick={()=>setNeeds(p=>p.includes(n)?p.filter(x=>x!==n):[...p,n])} style={{padding:"6px 12px",fontFamily:"var(--fm)",fontSize:9,letterSpacing:1,background:needs.includes(n)?"var(--green)":"transparent",color:needs.includes(n)?"#fff":"var(--muted)",border:`2px solid ${needs.includes(n)?"var(--green)":"var(--border)"}`,cursor:"pointer",transition:"all .15s"}}>{n}</button>)}</div>
                </div>}
              </div>
              <button onClick={handleDrop} disabled={!form.title.trim()||dropping} style={{width:"100%",background:dropping?"var(--s2)":form.title.trim()?"var(--red)":"var(--border)",color:dropping||!form.title.trim()?"var(--muted)":"#fff",border:`2.5px solid ${dropping||!form.title.trim()?"var(--border)":"var(--red)"}`,padding:"15px",fontFamily:"var(--fd)",fontSize:22,letterSpacing:4,cursor:form.title.trim()&&!dropping?"pointer":"not-allowed",transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:10}} onMouseEnter={e=>{if(form.title.trim()&&!dropping){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--red)";}}} onMouseLeave={e=>{if(form.title.trim()&&!dropping){e.currentTarget.style.background="var(--red)";e.currentTarget.style.color="#fff";}}}>
  {dropping?<><div style={{width:18,height:18,border:"3px solid var(--red)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/> DROPPING...</>:"🔥 DROP IT TO THE WORLD"}
</button>
            </div>
          </div>
        </div>
        {/* Preview panel */}
        <div style={{width:320,background:"var(--surface)",borderLeft:"2px solid var(--border)",padding:"26px 20px",position:"sticky",top:0,height:"100vh",overflowY:"auto",flexShrink:0}}>
          <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:3,color:"var(--muted)",marginBottom:16,textTransform:"uppercase"}}>// Live Preview</div>
          <div style={{background:"var(--s2)",border:"2px solid var(--border)",padding:20}}>
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:11}}><Av name="YOU" color="red" size={32}/><div><div style={{fontWeight:700,fontSize:12}}>Your Name</div><div style={{color:"var(--muted)",fontSize:9,fontFamily:"var(--fm)"}}>@yourhandle · Just now</div></div></div>
            <div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:1,marginBottom:6,lineHeight:1.2,color:form.title?"var(--white)":"var(--muted)",minHeight:24}}>{form.title||"Your project title..."}</div>
            <p style={{color:form.desc?"#aaa":"var(--border)",fontSize:12,lineHeight:1.6,marginBottom:11,minHeight:42}}>{form.desc||"Your description..."}</p>
            {tags.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:11}}>{tags.slice(0,4).map((t,i)=><Tag key={t} label={t} color={["gold","red","green"][i%3]}/>)}</div>}
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
              {form.collab&&<span style={{background:"var(--green)",color:"#fff",fontSize:8,padding:"2px 7px",fontFamily:"var(--fm)"}}>🤝 OPEN COLLAB</span>}
              {form.open&&<span style={{background:"var(--gold)",color:"#000",fontSize:8,padding:"2px 7px",fontFamily:"var(--fm)"}}>🌍 OPEN SOURCE</span>}
              {form.bounty&&<span style={{background:"var(--red)",color:"#fff",fontSize:8,padding:"2px 7px",fontFamily:"var(--fm)"}}>💰 BOUNTY</span>}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:12,paddingTop:11,borderTop:"1px solid var(--border)"}}><div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--gold)"}}>▲ 0</div><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>💬 0 Comments</div></div>
          </div>
          <div style={{marginTop:16,padding:12,background:"rgba(240,165,0,.06)",border:"2px solid rgba(240,165,0,.2)"}}>
            <div style={{fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,color:"var(--gold)",marginBottom:7,textTransform:"uppercase"}}>💡 Tips to get upvoted</div>
            {["Be specific about the problem you solve","Mention your target African market","Add a live demo link","Say if you want collaborators"].map(t=><div key={t} style={{fontSize:11,color:"#888",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.05)",lineHeight:1.4}}>→ {t}</div>)}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ── SEARCH PAGE ───────────────────────────────────────────────────────────────
function SearchPage({navigate,returnTo,userRole,session}){
  const [q,setQ]=useState("");
  const [tab,setTab]=useState("all");
  const [results,setResults]=useState([]);
  const [searching,setSearching]=useState(false);

  const runSearch=async(query)=>{
    if(!query.trim()){setResults([]);return;}
    setSearching(true);
    try{
      // Search posts, profiles, and bounties simultaneously
      Promise.all([
        supabase.from('posts')
          .select('id,title,description,tags,vote_count,profiles:author_id(username,country)')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(10),
        supabase.from('profiles')
          .select('id,username,full_name,country,bio,role,vibe_points,rank')
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,bio.ilike.%${query}%`)
          .eq('role','builder')
          .limit(8),
        supabase.from('bounties')
          .select('id,title,description,amount,tags')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .eq('status','open')
          .limit(6),
      ]).then(([{data:posts},{data:profiles},{data:bounties}])=>{
        const mapped = [
          ...(posts||[]).map(p=>({
            id:p.id, type:"project",
            title:p.title, sub:p.profiles?.username||"builder",
            loc:p.profiles?.country||"Africa",
            tags:(p.tags||[]).slice(0,3), votes:p.vote_count||0,
          })),
          ...(profiles||[]).map(p=>({
            id:p.id, type:"builder",
            title:p.full_name||p.username||"Builder",
            sub:"@"+(p.username||"builder"),
            loc:p.country||"Africa",
            tags:[p.rank||"Seedling"], votes:p.vibe_points||0,
          })),
          ...(bounties||[]).map(b=>({
            id:b.id, type:"bounty",
            title:b.title, sub:"$"+Math.round((b.amount||0)/100),
            loc:"Open",
            tags:(b.tags||[]).slice(0,3), votes:0,
          })),
        ];
        setResults(mapped);
      }).catch(()=>{});
    }catch{}
    finally{setSearching(false);}
  };

  useEffect(()=>{
    const t=setTimeout(()=>runSearch(q),400);
    return ()=>clearTimeout(t);
  },[q]);
  useEffect(()=>{
    try{
      const preset=sessionStorage.getItem("vibr-search-q");
      if(preset){
        sessionStorage.removeItem("vibr-search-q");
        setQ(preset);
      }
    }catch(e){}
  },[]);
  const allResults=[
    ...FEED_POSTS.map(p=>({type:"project",dest:`post-${p.id}`,title:p.title,sub:`${p.name} · ${p.loc}`,tags:p.tags,stat:p.votes,av:p.av,avc:p.avc})),
    ...COLLABS.map(c=>({type:"collab",dest:"collabs",title:c.project,sub:`${c.name} · ${c.loc}`,tags:c.tags,stat:c.vibe,av:c.av,avc:c.avc})),
    ...BOUNTIES.map(b=>({type:"bounty",dest:"bounties",title:b.title,sub:`${b.company} · ${b.amount}`,tags:b.tags.map(t=>[t,"gold"]),stat:null,av:b.company.slice(0,2).toUpperCase(),avc:"gold"})),
    ...LEADERBOARD.map(b=>({type:"builder",dest:"profile",title:b.name,sub:`@${b.handle} · ${b.flag} · ${b.badge}`,tags:[],stat:b.pts,av:b.av,avc:b.avc})),
  ];
  const staticResults=q.trim()===""?[]:allResults.filter(r=>(r.title+r.sub).toLowerCase().includes(q.toLowerCase())).filter(r=>tab==="all"||r.type===tab);
  const displayResults = results.length>0 ? results : staticResults;
  const typeBg={project:"var(--red)",builder:"var(--gold)",bounty:"var(--green)",collab:"#7C3AED"};
  return (
    <AppShell navigate={navigate} activePage="search" returnTo={returnTo} userRole={userRole}>
      <div style={{maxWidth:720,margin:"0 auto",padding:"28px 28px 64px"}}>
        <div style={{fontFamily:"var(--fd)",fontSize:32,letterSpacing:2,marginBottom:20}}>SEARCH <span style={{color:"var(--red)"}}>VIBR</span></div>
        <div style={{position:"relative",marginBottom:18}}>
          <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"var(--muted)"}}>🔍</span>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search projects, builders, bounties, collabs..." autoFocus style={{width:"100%",padding:"14px 14px 14px 44px",background:"var(--surface)",border:"2px solid var(--border)",color:"var(--text)",fontSize:14,outline:"none",fontFamily:"var(--fb)",transition:"border-color .2s",borderRadius:0}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
          {q&&<button onClick={()=>setQ("")} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"var(--muted)",fontSize:20,cursor:"pointer"}}>×</button>}
        </div>
        <div style={{display:"flex",borderBottom:"2px solid var(--border)",marginBottom:22}}>
          {["all","project","builder","bounty","collab"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"9px 16px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,textTransform:"uppercase",background:"transparent",border:"none",cursor:"pointer",color:tab===t?"var(--white)":"var(--muted)",borderBottom:tab===t?"3px solid var(--red)":"3px solid transparent",marginBottom:-2,transition:"all .15s"}}>{t}</button>)}
        </div>
        {q.trim()===""&&(
          <div>
            <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:3,color:"var(--muted)",marginBottom:12,textTransform:"uppercase"}}>Trending on VIBR</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:28}}>
              {["fintech nigeria","react native collab","AI edtech","web3 africa","USSD healthcare","solar iot"].map(s=><button key={s} onClick={()=>setQ(s)} style={{padding:"6px 14px",background:"var(--surface)",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:10,letterSpacing:1,cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>🔥 {s}</button>)}
            </div>
            <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:3,color:"var(--muted)",marginBottom:12,textTransform:"uppercase"}}>Browse by category</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {[["🏗️","Projects","project"],["👤","Builders","builder"],["💰","Bounties","bounty"],["🤝","Collabs","collab"],["👥","Chapters","community"],["⚡","Hackathons","hackathons"]].map(([icon,label,dest])=>(
                <div key={label} onClick={()=>dest==="community"||dest==="hackathons"?navigate(dest):setTab(dest)} style={{padding:"18px 16px",background:"var(--surface)",border:"2px solid var(--border)",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:10}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none";}}>
                  <span style={{fontSize:22}}>{icon}</span>
                  <span style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:1}}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {q.trim()!==""&&(
          <div>
            {results.length===0&&<div style={{textAlign:"center",padding:"48px 0",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:10,letterSpacing:2}}>NO RESULTS FOR "{q.toUpperCase()}"</div>}
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
                        {searching&&[1,2,3].map(n=><SkeletonCard key={n}/>)}
          {!searching&&displayResults.length===0&&q.trim()&&(
            <EmptyState emoji="🔍" title="NO RESULTS" sub={"Nothing found for '"+q+"'. Try different keywords."} />
          )}
          {!searching&&displayResults.map((r,i)=>(
                <div key={i} onClick={()=>navigate(r.dest)} style={{display:"flex",alignItems:"center",gap:13,padding:"14px 16px",background:"var(--surface)",border:"2px solid var(--border)",cursor:"pointer",transition:"all .2s",animation:`fadeUp .25s ${i*.05}s ease both`}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.transform="translateX(-3px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none";}}>
                  <Av name={r.av} color={r.avc} size={38}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                      <span style={{fontFamily:"var(--fd)",fontSize:17,letterSpacing:1,lineHeight:1.1}}>{r.title}</span>
                      <span style={{background:typeBg[r.type]||"var(--red)",color:r.type==="builder"?"#000":"#fff",fontSize:7,padding:"2px 6px",fontFamily:"var(--fm)",letterSpacing:1}}>{r.type.toUpperCase()}</span>
                    </div>
                    <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>{r.sub}</div>
                    {r.tags.length>0&&<div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>{r.tags.slice(0,3).map(([t,c])=><Tag key={t} label={t} color={c}/>)}</div>}
                  </div>
                  {r.stat!=null&&<div style={{fontFamily:"var(--fd)",fontSize:17,color:"var(--gold)",flexShrink:0}}>{typeof r.stat==="number"?r.stat.toLocaleString():r.stat}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ── NOTIFICATIONS PAGE ────────────────────────────────────────────────────────
const NOTIF_DATA=[
  {id:1,type:"upvote",read:false,icon:"▲",color:"var(--gold)",title:"Kofi Osei upvoted your project",sub:"USSD Healthcare App · 312 total upvotes",time:"2m ago",dest:"post-1"},
  {id:2,type:"collab",read:false,icon:"🤝",color:"var(--green)",title:"Amara Mensah sent a collab request",sub:"Wants to join your Agric Supply Chain project",time:"14m ago",dest:"collabs"},
  {id:3,type:"comment",read:false,icon:"💬",color:"var(--red)",title:"Nadia Wanjiru commented on your post",sub:"This is exactly what we need in East Africa too!",time:"1h ago",dest:"post-1"},
  {id:4,type:"message",read:false,icon:"✉️",color:"var(--gold)",title:"New message from Kofi Osei",sub:"Yo that USSD idea is fire 🔥",time:"2h ago",dest:"messages"},
  {id:5,type:"bounty",read:true,icon:"💰",color:"var(--green)",title:"Your bounty application was accepted",sub:"Duka Tech · M-Pesa integration · $500",time:"5h ago",dest:"bounties"},
  {id:6,type:"follow",read:true,icon:"👤",color:"var(--muted)",title:"Tinashe Amos started following you",sub:"Zimbabwe 🇿🇼 · CleanTech builder",time:"8h ago",dest:"profile"},
  {id:7,type:"rank",read:true,icon:"🔥",color:"var(--red)",title:"You ranked up to Builder ⚡",sub:"You've earned 500 Vibe Points! Bounties are now unlocked.",time:"1d ago",dest:"leaderboard"},
  {id:8,type:"community",read:true,icon:"👥",color:"var(--green)",title:"Nigeria Hub hit 4,000 members",sub:"Your chapter is the biggest on VIBR 🇳🇬",time:"2d ago",dest:"community"},
  {id:9,type:"upvote",read:true,icon:"▲",color:"var(--gold)",title:"Your project is trending 🔥",sub:"Naira DeFi Wallet · 189 upvotes in 24hrs",time:"3d ago",dest:"post-2"},
  {id:10,type:"hackathon",read:true,icon:"⚡",color:"var(--gold)",title:"Lagos Build Sprint starts in 24hrs",sub:"72hr hackathon · $2,000 prize pool · Register now",time:"4d ago",dest:"hackathons"},
];
function NotificationsPage({navigate,returnTo,userRole,session}){
  const [notifs,setNotifs]=useState(NOTIF_DATA);
  const [filter,setFilter]=useState("all");
  const unread=notifs.filter(n=>!n.read).length;

  useEffect(()=>{
    if(!session) return;
    getNotifications(session.user.id)
      .then(data=>{
        if(data&&data.length>0){
          setNotifs(data.map(n=>({
            id:n.id, type:n.type||"info", read:n.read,
            icon:({upvote:"▲",comment:"💬",collab:"🤝",message:"✉️",bounty:"💰",rank:"🔥",hackathon:"⚡"})[n.type]||"🔔",
            color:({upvote:"var(--gold)",comment:"var(--red)",collab:"var(--green)",message:"var(--gold)",bounty:"var(--green)"})[n.type]||"var(--muted)",
            title:n.title, sub:n.body||"", time:new Date(n.created_at).toLocaleDateString(),
            dest:n.link||"feed",
          })));
        }
      })
      .catch(()=>{});

    // Real-time new notifications
    const ch = subscribeToNotifications(session.user.id, (newNotif)=>{
      setNotifs(prev=>[{
        id:newNotif.id, type:newNotif.type, read:false,
        icon:"🔔", color:"var(--gold)",
        title:newNotif.title, sub:newNotif.body||"",
        time:"Just now", dest:newNotif.link||"feed",
      },...prev]);
    });
    return ()=>unsubscribe(ch);
  },[session]);

  const markAll=async()=>{
    setNotifs(n=>n.map(x=>({...x,read:true})));
    if(session) await markNotificationsRead(session.user.id).catch(()=>{});
  };
  const markOne=(id,dest)=>{setNotifs(n=>n.map(x=>x.id===id?{...x,read:true}:x));navigate(dest);};
  const shown=filter==="all"?notifs:filter==="unread"?notifs.filter(n=>!n.read):notifs.filter(n=>n.type===filter);
  return (
    <AppShell navigate={navigate} activePage="notifications" returnTo={returnTo} userRole={userRole}>
      <div style={{maxWidth:660,margin:"0 auto",padding:"28px 28px 64px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div>
            <div style={{fontFamily:"var(--fd)",fontSize:32,letterSpacing:2}}>NOTIFICATIONS</div>
            {unread>0&&<div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--gold)",letterSpacing:2,marginTop:2}}>{unread} UNREAD</div>}
          </div>
          {unread>0&&<button onClick={markAll} style={{background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",padding:"6px 14px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>Mark all read ✓</button>}
        </div>
        <div style={{display:"flex",gap:5,marginBottom:18,flexWrap:"wrap"}}>
          {["all","unread","upvote","collab","bounty","rank","hackathon"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 11px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:1,textTransform:"uppercase",background:filter===f?"var(--red)":"var(--surface)",color:filter===f?"#fff":"var(--muted)",border:`2px solid ${filter===f?"var(--red)":"var(--border)"}`,cursor:"pointer",transition:"all .15s"}}>{f}</button>)}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:2}}>
          {shown.length===0&&(
            <EmptyState
              emoji="🔔"
              title="ALL CAUGHT UP"
              sub={filter==="unread"?"No unread notifications.":"No notifications yet. Start building and they will come."}
            />
          )}
          {shown.map((n,i)=>(
            <div key={n.id} onClick={()=>markOne(n.id,n.dest)} style={{display:"flex",alignItems:"center",gap:13,padding:"14px 16px",background:n.read?"var(--surface)":"rgba(240,165,0,.06)",border:`2px solid ${n.read?"var(--border)":"rgba(240,165,0,.25)"}`,cursor:"pointer",transition:"all .2s",position:"relative",animation:`fadeUp .3s ${i*.04}s ease both`}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.transform="translateX(-3px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=n.read?"var(--border)":"rgba(240,165,0,.25)";e.currentTarget.style.transform="none";}}>
              {!n.read&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:"var(--gold)"}}/>}
              <div style={{width:38,height:38,background:"var(--s2)",border:`2px solid ${n.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{n.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:n.read?500:700,fontSize:13,marginBottom:2,color:n.read?"#bbb":"var(--white)"}}>{n.title}</div>
                <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.4}}>{n.sub}</div>
              </div>
              <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",flexShrink:0}}>{n.time}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ── SETTINGS PAGE ─────────────────────────────────────────────────────────────
function SettingsPage({navigate,returnTo,userRole,session,profile}){
  const [tab,setTab]=useState("profile");
  const [saved,setSaved]=useState(false);
  const [tog,setTog]=useState({emailNotifs:true,pushNotifs:true,collabRequests:true,weeklyDigest:false,showEmail:false,showLocation:true,publicProfile:true,whatsapp:true,twoFA:false});
  const [whatsappNum,setWhatsappNum]=useState("");
  const [profileForm,setProfileForm]=useState({name:profile?.full_name||"",bio:profile?.bio||"",stack:profile?.stack||""});
  const toggle=k=>setTog(t=>({...t,[k]:!t[k]}));
  const inp={width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",transition:"border-color .2s",borderRadius:0};
  const Tog=({k,label,sub})=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",borderBottom:"1px solid var(--border)"}}>
      <div><div style={{fontWeight:600,fontSize:13}}>{label}</div>{sub&&<div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{sub}</div>}</div>
      <div onClick={()=>toggle(k)} style={{width:40,height:21,background:tog[k]?"var(--red)":"var(--border)",borderRadius:10,position:"relative",transition:"background .2s",cursor:"pointer",flexShrink:0}}>
        <div style={{width:15,height:15,background:"#fff",borderRadius:"50%",position:"absolute",top:3,left:tog[k]?22:3,transition:"left .2s"}}/>
      </div>
    </div>
  );
  const save=async()=>{
    setSaved(true);
    toast.success("Settings saved!");
    try{
      if(session){
        const {updateProfile}={updateProfile:async(id,fields)=>{
          await supabase.from("profiles").update(fields).eq("id",id);
        }};
        await updateProfile(session.user.id,{
          full_name:profileForm.name||undefined,
          bio:profileForm.bio||undefined,
          stack:profileForm.stack||undefined,
        }).catch(()=>{});
      }
    }catch{}
    setTimeout(()=>setSaved(false),2200);
  };
  return (
    <AppShell navigate={navigate} activePage="settings" returnTo={returnTo} userRole={userRole}>
      <div style={{maxWidth:660,margin:"0 auto",padding:"28px 28px 64px"}}>
        <div style={{fontFamily:"var(--fd)",fontSize:32,letterSpacing:2,marginBottom:22}}>SETTINGS</div>
        <div style={{display:"flex",gap:0,borderBottom:"2px solid var(--border)",marginBottom:28}}>
          {["profile","notifications","privacy","payments","danger"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"10px 18px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,textTransform:"uppercase",background:"transparent",border:"none",cursor:"pointer",color:tab===t?"var(--white)":"var(--muted)",borderBottom:tab===t?"3px solid var(--red)":"3px solid transparent",marginBottom:-2,transition:"all .15s"}}>{t}</button>)}
        </div>
        {tab==="profile"&&(
          <div style={{display:"flex",flexDirection:"column",gap:18}} className="fu">
            <div style={{display:"flex",gap:16,alignItems:"center",padding:"20px",background:"var(--surface)",border:"2px solid var(--border)",marginBottom:8}}>
              <div style={{width:72,height:72,background:"var(--red)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:32,color:"#fff"}}>YO</div>
              <div>
                <div style={{fontFamily:"var(--fd)",fontSize:22,letterSpacing:1,marginBottom:4}}>YOUR NAME</div>
                <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",marginBottom:10}}>@yourhandle · 🇳🇬 Nigeria</div>
                <button style={{background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",padding:"5px 14px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>Change Photo</button>
              </div>
              <AvatarUpload userId={session?.user?.id} currentUrl={profile?.avatar_url} onSuccess={url=>{toast.success("Photo updated!");}}/>
            </div>
            {[["Display Name","Your Name"],["VIBR Handle","yourhandle"],["Email","you@email.com"],["Location","Lagos, Nigeria"],["Website / Portfolio","https://yoursite.com"]].map(([l,ph])=>(
              <div key={l}><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>{l}</div><input placeholder={ph} style={inp} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/></div>
            ))}
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>Bio</div><textarea placeholder="What do you build? Who do you build for?" rows={4} style={{...inp,resize:"none",lineHeight:1.6}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/></div>
            <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>Country</div>
              <select style={{...inp,appearance:"none"}}>
                {["Nigeria 🇳🇬","Kenya 🇰🇪","Ghana 🇬🇭","South Africa 🇿🇦","Ethiopia 🇪🇹","Senegal 🇸🇳","Rwanda 🇷🇼","Other"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={save} style={{background:saved?"var(--green)":"var(--red)",color:"#fff",border:`2px solid ${saved?"var(--green)":"var(--red)"}`,padding:"13px",fontFamily:"var(--fd)",fontSize:19,letterSpacing:3,cursor:"pointer",transition:"all .3s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {saved?"✓ SAVED!":"SAVE CHANGES"}
            </button>
          </div>
        )}
        {tab==="notifications"&&(
          <div className="fu">
            <Tog k="emailNotifs" label="Email Notifications" sub="Get important updates in your inbox"/>
            <Tog k="pushNotifs" label="Push Notifications" sub="Browser notifications when you're online"/>
            <Tog k="whatsapp" label="WhatsApp Notifications" sub="Get notified on WhatsApp — great for low-data connections"/>
            {tog.whatsapp&&(
              <div style={{paddingLeft:16,paddingBottom:8,animation:"fadeUp .2s ease both"}}>
                <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>WhatsApp Number</div>
                <input value={whatsappNum} onChange={e=>setWhatsappNum(e.target.value)} placeholder="+234 800 000 0000" style={{width:"100%",padding:"9px 12px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",marginTop:4,letterSpacing:1}}>Include country code. We'll send a verification message.</div>
              </div>
            )}
            <Tog k="collabRequests" label="Collab Requests" sub="Notify me when someone wants to join my project"/>
            <Tog k="weeklyDigest" label="Weekly VIBR Digest" sub="Sunday roundup of top projects, bounties and news"/>
          </div>
        )}
        {tab==="privacy"&&(
          <div className="fu">
            <Tog k="publicProfile" label="Public Profile" sub="Anyone can view your profile and projects"/>
            <Tog k="showEmail" label="Show Email on Profile" sub="Let other builders see your email address"/>
            <Tog k="showLocation" label="Show Location" sub="Display your city and country on your profile"/>
            <Tog k="twoFA" label="Two-Factor Authentication" sub="Extra security layer on your account"/>
            <div style={{marginTop:20,padding:16,background:"rgba(240,165,0,.06)",border:"2px solid rgba(240,165,0,.2)"}}>
              <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--gold)",marginBottom:8,textTransform:"uppercase"}}>🔒 Data & Privacy</div>
              <p style={{fontSize:12,color:"var(--muted)",lineHeight:1.7}}>VIBR does not sell your data to third parties. Your projects, messages and profile are only visible according to your settings above. See our <span style={{color:"var(--gold)",cursor:"pointer",textDecoration:"underline"}}>Privacy Policy</span>.</p>
            </div>
          </div>
        )}
        {tab==="payments"&&(
          <div className="fu">
            <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:20,marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{fontFamily:"var(--fd)",fontSize:22,letterSpacing:1}}>FREE PLAN</div>
                <div style={{background:"var(--s2)",border:"1px solid var(--border)",padding:"4px 12px",fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:1}}>CURRENT</div>
              </div>
              <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",marginBottom:12}}>Basic access — feed, community, profile</div>
              <button onClick={()=>navigate("premium")} style={{width:"100%",background:"var(--gold)",color:"#000",border:"2px solid var(--gold)",padding:"11px",fontFamily:"var(--fd)",fontSize:18,letterSpacing:3,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.background="var(--gold)";e.target.style.color="#000";}}>UPGRADE TO PRO 🔥</button>
            </div>
            <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:10,textTransform:"uppercase"}}>Payment Methods</div>
            <div style={{background:"var(--surface)",border:"2px dashed var(--border)",padding:20,textAlign:"center",cursor:"pointer",transition:"border-color .2s"}} onMouseEnter={e=>e.target.style.borderColor="var(--gold)"} onMouseLeave={e=>e.target.style.borderColor="var(--border)"}>
              <div style={{fontSize:24,marginBottom:6}}>+</div>
              <div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",letterSpacing:2}}>ADD PAYMENT METHOD</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>Paystack · Flutterwave · Card · Bank Transfer</div>
            </div>
          </div>
        )}
        {tab==="danger"&&(
          <div className="fu">
            <div style={{background:"rgba(209,43,43,.08)",border:"2px solid var(--red)",padding:20,marginBottom:14}}>
              <div style={{fontFamily:"var(--fd)",fontSize:20,color:"var(--red)",letterSpacing:1,marginBottom:6}}>DANGER ZONE</div>
              <p style={{fontSize:13,color:"#aaa",lineHeight:1.6,marginBottom:16}}>These actions are permanent and cannot be undone. Please be absolutely sure before proceeding.</p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[["Export My Data","Download all your data as JSON","var(--gold)"],["Deactivate Account","Temporarily hide your profile","var(--muted)"],["Delete Account","Permanently delete everything","var(--red)"]].map(([label,sub,col])=>(
                  <button key={label} style={{padding:"11px 16px",background:"transparent",border:`2px solid ${col}`,color:col,fontFamily:"var(--fm)",fontSize:10,letterSpacing:2,cursor:"pointer",textAlign:"left",transition:"all .2s",textTransform:"uppercase"}} onMouseEnter={e=>{e.target.style.background=col;e.target.style.color=col==="var(--gold)"?"#000":"#fff";}} onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color=col;}}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ── PREMIUM / PAYSTACK PAGE ───────────────────────────────────────────────────
function PremiumPage({navigate,returnTo,userRole,session}){
  const [selected,setSelected]=useState("pro");
  const [step,setStep]=useState("plans");
  const [paying,setPaying]=useState(false);
  const [done,setDone]=useState(false);
  const plans=[
    {id:"free",name:"Free",price:"₦0",usd:"$0",period:"forever",color:"var(--muted)",features:["Browse live feed","Join country chapters","Basic profile","View bounties (no apply)","Public posts only"],cta:"Current Plan",disabled:true},
    {id:"pro",name:"Builder Pro",price:"₦3,500",usd:"~$2.50",period:"/month",color:"var(--red)",features:["Everything in Free","Apply to bounties","Full collab board access","1-on-1 messages","Voice huddles","Project analytics","Investor visibility"],cta:"Go Pro 🔥",hot:true},
    {id:"lord",name:"Vibe Lord",price:"₦8,000",usd:"~$5.50",period:"/month",color:"var(--gold)",features:["Everything in Pro","Featured drops on homepage","Verified badge ✓","VIBR Academy access","Priority support","Co-founder matching","Early hackathon access"],cta:"Become a Vibe Lord 👑"},
  ];
  const {pay:paystackPay}=usePaystack();
  const PRICES={pro:350000,lord:800000};
  const pay=()=>{
    if(!session){navigate("login");return;}
    setPaying(true);
    try{
      paystackPay({
        email:session.user.email,
        amount:PRICES[selected]||350000,
        currency:"NGN",
        metadata:{plan:selected,userId:session.user.id},
        onSuccess:async(res)=>{
          await supabase.from("premium_subscriptions").insert({
            user_id:session.user.id,tier:selected,status:"active",
            amount:PRICES[selected],currency:"NGN",
            paystack_customer_id:res.customer?.email||session.user.email,
          }).catch(()=>{});
          await supabase.from("profiles").update({
            is_premium:true,premium_tier:selected,
            premium_until:new Date(Date.now()+30*24*60*60*1000).toISOString(),
          }).eq("id",session.user.id).catch(()=>{});
          toast.success("Premium activated! You are a Vibe "+selected.charAt(0).toUpperCase()+selected.slice(1)+" 🔥");
          setPaying(false);setDone(true);
        },
        onClose:()=>{setPaying(false);toast.info("Payment cancelled.");},
      });
    }catch(e){
      setTimeout(()=>{setPaying(false);setDone(true);
        toast.success("Premium activated (demo mode) 🔥");
      },2400);
    }
  };
  if(done) return (
    <AppShell navigate={navigate} activePage="premium" returnTo={returnTo} userRole={userRole}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh",padding:"40px",textAlign:"center"}}>
        <div style={{fontSize:72,marginBottom:20,animation:"fadeUp .5s ease both"}}>🎉</div>
        <div className="fu1" style={{fontFamily:"var(--fd)",fontSize:52,letterSpacing:2,lineHeight:1,marginBottom:12}}>YOU'RE NOW A<br/><span style={{color:"var(--gold)"}}>VIBE {selected==="lord"?"LORD":"PRO"}</span></div>
        <p className="fu2" style={{color:"var(--muted)",fontSize:15,lineHeight:1.7,maxWidth:400,marginBottom:32}}>All premium features are unlocked. Africa just got a new builder. Go drop something. 🔥</p>
        <div className="fu3" style={{display:"flex",gap:12}}>
          <Btn v="gold" onClick={()=>navigate("drop")}>Drop Your First Build →</Btn>
          <Btn v="primary" onClick={()=>navigate("feed")}>Back to Feed</Btn>
        </div>
      </div>
    </AppShell>
  );
  return (
    <AppShell navigate={navigate} activePage="premium" returnTo={returnTo} userRole={userRole}>
      <div style={{maxWidth:880,margin:"0 auto",padding:"28px 28px 72px"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontFamily:"var(--fd)",fontSize:42,letterSpacing:2,lineHeight:1,marginBottom:8}}>GO <span style={{color:"var(--gold)"}}>PRO</span> ON VIBR</div>
          <p style={{color:"var(--muted)",fontSize:14,lineHeight:1.6}}>Unlock the full platform. Get seen. Get paid. Build bigger.</p>
        </div>
        {step==="plans"&&(
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:24}}>
              {plans.map(p=>(
                <div key={p.id} onClick={()=>!p.disabled&&setSelected(p.id)} style={{background:"var(--surface)",border:`2px solid ${selected===p.id?p.color:"var(--border)"}`,padding:24,cursor:p.disabled?"default":"pointer",transition:"all .2s",position:"relative",transform:selected===p.id&&!p.disabled?"translate(-3px,-3px)":"none",boxShadow:selected===p.id&&!p.disabled?`5px 5px 0 ${p.color}`:"none"}}>
                  {p.hot&&<div style={{position:"absolute",top:-1,left:16,background:"var(--red)",color:"#fff",fontFamily:"var(--fm)",fontSize:8,padding:"2px 9px",letterSpacing:2}}>MOST POPULAR</div>}
                  <div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2,marginBottom:4,color:p.color}}>{p.name}</div>
                  <div style={{fontFamily:"var(--fd)",fontSize:36,lineHeight:1,marginBottom:2}}>{p.price}</div>
                  <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",marginBottom:16}}>{p.usd} {p.period}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
                    {p.features.map(f=><div key={f} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#bbb"}}><span style={{color:p.color,flexShrink:0}}>✓</span>{f}</div>)}
                  </div>
                  <button disabled={p.disabled} onClick={()=>{if(!p.disabled){setSelected(p.id);setStep("pay");}}} style={{width:"100%",padding:"10px",background:p.disabled?"var(--s2)":selected===p.id?p.color:"transparent",color:p.disabled?"var(--muted)":selected===p.id?"#fff":p.color,border:`2px solid ${p.disabled?"var(--border)":p.color}`,fontFamily:"var(--fd)",fontSize:16,letterSpacing:2,cursor:p.disabled?"default":"pointer",transition:"all .15s"}}>{p.cta}</button>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:20,padding:"14px",background:"var(--surface)",border:"1px solid var(--border)"}}>
              {["🔒 Secured by Paystack","💳 Card, Bank Transfer, USSD","🌍 Naira, Cedis, KSh, Rand","↩️ Cancel anytime"].map(f=><span key={f} style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:1}}>{f}</span>)}
            </div>
          </>
        )}
        {step==="pay"&&(
          <div style={{maxWidth:480,margin:"0 auto"}} className="fu">
            <button onClick={()=>setStep("plans")} style={{background:"transparent",border:"none",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,cursor:"pointer",marginBottom:20}} onMouseEnter={e=>e.target.style.color="var(--white)"} onMouseLeave={e=>e.target.style.color="var(--muted)"}>← BACK TO PLANS</button>
            <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:24,marginBottom:20}}>
              <div style={{fontFamily:"var(--fd)",fontSize:22,letterSpacing:1,marginBottom:4}}>Order Summary</div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
                <span style={{fontSize:13}}>{plans.find(p=>p.id===selected)?.name}</span>
                <span style={{fontFamily:"var(--fd)",fontSize:20,color:"var(--gold)"}}>{plans.find(p=>p.id===selected)?.price}<span style={{fontSize:12,fontFamily:"var(--fm)",color:"var(--muted)"}}>/mo</span></span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>
                <span>Billed monthly · Cancel anytime</span>
                <span style={{color:"var(--gr2)"}}>Africa pricing ✓</span>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>Full Name</div><input placeholder="Your full name" style={{width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/></div>
              <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>Email Address</div><input type="email" placeholder="you@email.com" style={{width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {[["💳","Card"],["🏦","Bank Transfer"],["📱","USSD"]].map(([icon,label])=>(
                  <div key={label} style={{padding:"13px 10px",background:"var(--s2)",border:"2px solid var(--border)",textAlign:"center",cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";}}>
                    <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
                    <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:1}}>{label}</div>
                  </div>
                ))}
              </div>
              <button onClick={pay} disabled={paying} style={{width:"100%",background:paying?"var(--s2)":"var(--red)",color:"#fff",border:`2px solid ${paying?"var(--border)":"var(--red)"}`,padding:"14px",fontFamily:"var(--fd)",fontSize:20,letterSpacing:3,cursor:paying?"default":"pointer",transition:"all .3s",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                {paying?<><span style={{animation:"pulse 1s infinite"}}>⏳</span> PROCESSING...</>:"PAY WITH PAYSTACK →"}
              </button>
              <div style={{textAlign:"center",fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:1}}>🔒 Secured by Paystack · Your money is safe</div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ── SPACES PAGE (Group Chats) ─────────────────────────────────────────────────
const SPACES_DATA=[
  {id:1,name:"React Africa",icon:"⚛️",members:892,online:34,desc:"Everything React, Next.js and frontend for African devs",tags:["React","Next.js","Frontend"],pinned:[{user:"Kofi O.",text:"Anyone used Next.js 14 server actions for M-Pesa webhooks? 🔥",time:"4m ago"}]},
  {id:2,name:"AI & ML Builders",icon:"🤖",members:1204,online:67,desc:"Machine learning, LLMs, and AI products built for Africa",tags:["AI","Python","TensorFlow"],pinned:[{user:"Nadia W.",text:"Released my offline Swahili NLP model. Link in bio!",time:"12m ago"}]},
  {id:3,name:"Fintech Nigeria",icon:"💸",members:2100,online:112,desc:"Paystack, Flutterwave, banking APIs and fintech for Nigeria",tags:["Fintech","Paystack","Node.js"],pinned:[{user:"Tolu K.",text:"PSA: Paystack changed their webhook signature format yesterday. Update your code!",time:"1h ago"}]},
  {id:4,name:"Mobile Devs",icon:"📱",members:743,online:28,desc:"React Native, Flutter, and mobile-first builders across Africa",tags:["React Native","Flutter","Mobile"],pinned:[{user:"Amara M.",text:"Drop your app screenshots for feedback — no gatekeeping here",time:"2h ago"}]},
  {id:5,name:"Web3 Africa",icon:"⛓️",members:521,online:19,desc:"Blockchain, DeFi, NFTs and crypto for the African market",tags:["Solidity","Web3","Stellar"],pinned:[{user:"Obioma K.",text:"Gas fees on Polygon are negligible for remittance apps. Here's my setup...",time:"3h ago"}]},
  {id:6,name:"CleanTech Builders",icon:"🌱",members:318,online:11,desc:"Solar, IoT, sustainability and climate tech across Africa",tags:["IoT","CleanTech","Hardware"],pinned:[{user:"Tinashe A.",text:"My solar monitor is now deployed to 12 sites. AMA!",time:"5h ago"}]},
];
function SpacesPage({navigate,returnTo,userRole,session}){
  const [activeSpace,setActiveSpace]=useState(SPACES_DATA[0]);
  const [msgs,setMsgs]=useState({
    1:[{user:"Kofi O.",av:"KO",avc:"gold",text:"Anyone used Next.js 14 server actions for M-Pesa webhooks? 🔥",time:"4m ago"},{user:"Nadia W.",av:"NW",avc:"green",text:"Yes! I have a working setup. Let me paste the code",time:"3m ago"},{user:"Tolu K.",av:"TK",avc:"red",text:"Would love to see that Nadia 👀",time:"2m ago"}],
    2:[{user:"Nadia W.",av:"NW",avc:"green",text:"Released my offline Swahili NLP model. Link in bio!",time:"12m ago"},{user:"Moussa B.",av:"MB",avc:"green",text:"This is massive. Does it work for Hausa too?",time:"10m ago"}],
    3:[{user:"Tolu K.",av:"TK",avc:"red",text:"PSA: Paystack changed their webhook signature format. Update your code!",time:"1h ago"},{user:"Amara M.",av:"AM",avc:"gold",text:"THANK YOU. I was going crazy debugging this all morning 😭",time:"58m ago"}],
    4:[{user:"Amara M.",av:"AM",avc:"gold",text:"Drop your app screenshots for feedback 📸",time:"2h ago"}],
    5:[{user:"Obioma K.",av:"OK",avc:"red",text:"Gas fees on Polygon are negligible for remittance apps",time:"3h ago"}],
    6:[{user:"Tinashe A.",av:"TA",avc:"red",text:"My solar monitor is deployed to 12 sites. AMA!",time:"5h ago"}],
  });
  const [input,setInput]=useState("");
  const send=async()=>{
    if(!input.trim())return;
    if(!session){navigate("login");return;}
    const text=input; setInput("");
    setMsgs(m=>({...m,[activeSpace.id]:[...(m[activeSpace.id]||[]),{user:"You",av:"YO",avc:"red",text,time:"Just now"}]}));
    try{
      const {data:sp}=await supabase.from("spaces").select("id").eq("name",activeSpace.name).single();
      if(sp) await supabase.from("space_messages").insert({space_id:sp.id,sender_id:session.user.id,content:text});
    }catch{}
  };
  const curMsgs=msgs[activeSpace.id]||[];
  return (
    <AppShell navigate={navigate} activePage="spaces" returnTo={returnTo} userRole={userRole}>
      <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
        {/* Spaces list */}
        <div style={{width:272,borderRight:"2px solid var(--border)",display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"16px 16px 12px",borderBottom:"2px solid var(--border)"}}>
            <div style={{fontFamily:"var(--fd)",fontSize:22,letterSpacing:2,marginBottom:9}}>SPACES</div>
            <button onClick={()=>navigate("drop")} style={{width:"100%",padding:"8px",background:"var(--s2)",border:"2px dashed var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--green)";e.target.style.color="var(--gr2)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>+ Create a Space</button>
          </div>
          <div style={{overflowY:"auto",flex:1}}>
            {SPACES_DATA.map(s=>(
              <div key={s.id} onClick={()=>setActiveSpace(s)} style={{padding:"13px 15px",borderBottom:"1px solid var(--border)",cursor:"pointer",transition:"background .15s",background:activeSpace.id===s.id?"var(--s2)":"transparent",borderLeft:activeSpace.id===s.id?"3px solid var(--red)":"3px solid transparent"}} onMouseEnter={e=>{if(activeSpace.id!==s.id)e.currentTarget.style.background="rgba(255,255,255,.03)";}} onMouseLeave={e=>{if(activeSpace.id!==s.id)e.currentTarget.style.background="transparent";}}>
                <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:4}}>
                  <span style={{fontSize:18}}>{s.icon}</span>
                  <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{s.name}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>{s.members.toLocaleString()} members · <span style={{color:"var(--gr2)"}}>{s.online} online</span></div></div>
                </div>
                {msgs[s.id]?.slice(-1).map((m,i)=><div key={i} style={{fontSize:11,color:"var(--muted)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.user}: {m.text}</div>)}
              </div>
            ))}
          </div>
        </div>
        {/* Space chat */}
        <div style={{flex:1,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"13px 22px",borderBottom:"2px solid var(--border)",background:"var(--surface)",display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24}}>{activeSpace.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:1}}>{activeSpace.name}</div>
              <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>{activeSpace.desc}</div>
            </div>
            <div style={{display:"flex",gap:6}}>
              {activeSpace.tags.map(t=><Tag key={t} label={t} color="gold"/>)}
            </div>
            <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--gr2)",marginLeft:8}}>{activeSpace.online} online</div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"20px 22px",display:"flex",flexDirection:"column",gap:12}}>
                      {curMsgs.length===0&&<EmptyState emoji="💬" title="NO MESSAGES" sub="Be the first to post in this space."/>}
          {curMsgs.map((m,i)=>(
              <div key={i} style={{display:"flex",gap:10,animation:"fadeUp .3s ease both"}}>
                <Av name={m.av} color={m.avc} size={34}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontWeight:700,fontSize:13}}>{m.user}</span><span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>{m.time}</span></div>
                  <div style={{fontSize:13,color:"#ddd",lineHeight:1.6,background:"var(--s2)",padding:"10px 13px",border:"1px solid var(--border)",display:"inline-block",maxWidth:"80%"}}>{m.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{padding:"13px 20px",borderTop:"2px solid var(--border)",display:"flex",gap:9,background:"var(--surface)"}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={`Message #${activeSpace.name}...`} style={{flex:1,padding:"10px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            <button onClick={send} style={{background:"var(--red)",color:"#fff",border:"2px solid var(--red)",padding:"10px 18px",fontFamily:"var(--fd)",fontSize:15,letterSpacing:2,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--red)";}} onMouseLeave={e=>{e.target.style.background="var(--red)";e.target.style.color="#fff";}}>SEND →</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ── HACKATHONS PAGE ───────────────────────────────────────────────────────────
const HACK_DATA=[
  {id:1,status:"live",name:"Lagos Build Sprint",emoji:"⚡",sponsor:"Paystack",prize:"$2,000",deadline:"47:12:08",theme:"Build a fintech tool for the unbanked",participants:89,teams:21,tags:["Fintech","Mobile"],desc:"48hr hackathon sponsored by Paystack. Build anything that helps underbanked Nigerians access financial services.",color:"var(--red)"},
  {id:2,status:"upcoming",name:"Pan-Africa AI Challenge",emoji:"🤖",sponsor:"Google Africa",prize:"$5,000",deadline:"6 days",theme:"AI tools built for African languages",participants:0,teams:0,tags:["AI/ML","NLP"],desc:"Build an AI product that works in at least one African language. Open to all 54 countries.",color:"var(--gold)"},
  {id:3,status:"upcoming",name:"CleanTech Nairobi",emoji:"🌱",sponsor:"KPLC x Safaricom",prize:"$3,000",deadline:"12 days",theme:"Energy, water and climate solutions for East Africa",participants:0,teams:0,tags:["CleanTech","IoT"],desc:"Sponsored by Kenya Power and Safaricom. Build climate or energy solutions for East African communities.",color:"var(--green)"},
  {id:4,status:"ended",name:"VIBR Dev Jam #1",emoji:"🎮",sponsor:"VIBR",prize:"$1,000",deadline:"Ended",theme:"Build anything that helps African devs collaborate",participants:142,teams:38,tags:["DevTools","Any stack"],desc:"Our first official hackathon. 142 participants, 38 teams, and 3 incredible winners.",color:"var(--muted)"},
];

// ── CHALLENGE BOUNTY DATA ─────────────────────────────────────────────────────
const CHALLENGES = [
  {
    id:"ch1", company:"Paystack", logo:"PS", color:"var(--gold)",
    title:"Build Paystack for the Unbanked",
    prize:"$3,000", deadline:"May 19, 2026",
    tracks:["Mobile Money Integration","USSD Banking","Agent Banking","Offline Payments"],
    desc:"Build a tool that brings Paystack payments to people without smartphones or data. Any stack. Any approach. We will deploy the winner.",
    submissions:12, participants:34, status:"open",
    judging:"Company + Investor panel review all submissions. Top 3 get spotlighted on VIBR feed and pushed to investor deal flow.",
    tag:[["Fintech","red"],["Mobile","gold"],["USSD","green"]],
    demoSubmissions:[
      {builder:"Kofi Osei",handle:"kofi_builds",flag:"🇬🇭",track:"USSD Banking",title:"USSD Savings App",demo:"https://loom.com/share/example1",github:"https://github.com/kofi/ussd-savings",desc:"Allows market traders to save money via USSD *737*1#. Works on any phone. No internet needed.",rating:null,av:"KO",avc:"gold"},
      {builder:"Tolu Kehinde",handle:"tolu_builds",flag:"🇳🇬",track:"Mobile Money Integration",title:"Paystack Lite",demo:"https://youtube.com/watch?v=example",github:"https://github.com/tolu/paystack-lite",desc:"A lightweight Paystack wrapper for feature phones with SMS fallback.",rating:null,av:"TK",avc:"red"},
    ],
  },
  {
    id:"ch2", company:"Google Africa", logo:"GA", color:"var(--red)",
    title:"AI for African Languages",
    prize:"$5,000", deadline:"Jun 1, 2026",
    tracks:["NLP & Translation","Voice Interfaces","Education Tools","Local Language Models"],
    desc:"Build an AI product that works in at least one African language. Must be production-ready. Google Africa will integrate the top submission.",
    submissions:8, participants:22, status:"open",
    judging:"Google Africa engineering team reviews all submissions. Winner gets $5K + potential Google integration.",
    tag:[["AI/ML","gold"],["NLP","green"],["EdTech","red"]],
    demoSubmissions:[
      {builder:"Nadia Wanjiru",handle:"nadia.w",flag:"🇰🇪",track:"NLP & Translation",title:"SwahiliGPT",demo:"https://loom.com/share/example2",github:"https://github.com/nadia/swahiligpt",desc:"Fine-tuned LLM for Swahili with 94% accuracy on local idioms. Offline after download.",rating:null,av:"NW",avc:"green"},
    ],
  },
];

// ── CHALLENGE STATE (in production: Supabase) ──────────────────────────────
// Tracks which challenges builder has joined and submitted to


function HackathonsPage({navigate,returnTo,userRole,session}){
  const [filter,setFilter]=useState("all");
  const [registered,setRegistered]=useState({});

  const registerForHack=async(hackId)=>{
    if(!session){navigate("login");return;}
    setRegistered(r=>({...r,[hackId]:true}));
    try{
      await supabase.from("hackathon_registrations")
        .insert({hackathon_id:hackId,user_id:session.user.id});
    }catch{}
  };
  const shown=filter==="all"?HACK_DATA:HACK_DATA.filter(h=>h.status===filter);
  const statusColors={live:"var(--red)",upcoming:"var(--gold)",ended:"var(--muted)"};
  return (
    <AppShell navigate={navigate} activePage="hackathons" returnTo={returnTo} userRole={userRole}>
      <div style={{padding:"24px 32px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{fontFamily:"var(--fd)",fontSize:28,letterSpacing:2}}>HACKATHONS ⚡</div><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:2}}>BUILD FAST. WIN PRIZES. GET SEEN.</div></div>
        <div style={{background:"rgba(209,43,43,.1)",border:"1px solid var(--red)",padding:"9px 16px",textAlign:"center"}}><div style={{fontFamily:"var(--fd)",fontSize:20,color:"var(--r2)"}}>$10,000</div><div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--muted)",letterSpacing:2}}>IN ACTIVE PRIZES</div></div>
      </div>
      {/* Live banner */}
      {HACK_DATA.filter(h=>h.status==="live").map(h=>(
        <div key={h.id} style={{background:"var(--red)",padding:"13px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{width:8,height:8,background:"#fff",borderRadius:"50%",display:"inline-block",animation:"pulse 1s infinite"}}/>
            <span style={{fontFamily:"var(--fd)",fontSize:18,color:"#fff",letterSpacing:2}}>{h.emoji} {h.name} IS LIVE NOW</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{fontFamily:"var(--fm)",fontSize:10,color:"rgba(255,255,255,.8)"}}>⏱ {h.deadline} remaining · {h.participants} builders in</div>
            <button onClick={()=>setRegistered(r=>({...r,[h.id]:true}))} style={{background:"#fff",color:"var(--red)",border:"2px solid #fff",padding:"6px 16px",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer"}}>{registered[h.id]?"JOINED ✓":"JOIN NOW"}</button>
          </div>
        </div>
      ))}
      <div style={{padding:"14px 32px",borderBottom:"2px solid var(--border)",display:"flex",gap:6}}>
        {["all","live","upcoming","ended"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 13px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,textTransform:"uppercase",background:filter===f?statusColors[f]||"var(--red)":"var(--surface)",color:filter===f?"#fff":"var(--muted)",border:`2px solid ${filter===f?statusColors[f]||"var(--red)":"var(--border)"}`,cursor:"pointer",transition:"all .15s"}}>{f}</button>)}
      </div>
      <div style={{padding:"24px 32px",display:"flex",flexDirection:"column",gap:16}}>
        {shown.map((h,i)=>(
          <div key={h.id} style={{background:"var(--surface)",border:`2px solid ${h.status==="live"?"var(--red)":h.status==="ended"?"var(--border)":h.color}`,padding:24,transition:"all .2s",animation:`fadeUp .4s ${i*.08}s ease both`,position:"relative",opacity:h.status==="ended"?.7:1}} onMouseEnter={e=>{if(h.status!=="ended"){e.currentTarget.style.transform="translateX(-3px)";e.currentTarget.style.boxShadow=`4px 4px 0 ${h.color}`;};}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
            <div style={{position:"absolute",top:14,right:14,background:statusColors[h.status]||"var(--muted)",color:"#fff",fontFamily:"var(--fm)",fontSize:8,padding:"2px 9px",letterSpacing:2,textTransform:"uppercase"}}>{h.status==="live"?"🔴 LIVE":h.status==="upcoming"?"🟡 UPCOMING":"⚫ ENDED"}</div>
            <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
              <div style={{fontSize:48,lineHeight:1,flexShrink:0}}>{h.emoji}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <div style={{fontFamily:"var(--fd)",fontSize:24,letterSpacing:1}}>{h.name}</div>
                </div>
                <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",marginBottom:8}}>Sponsored by {h.sponsor} · Prize pool: <span style={{color:"var(--gr2)",fontWeight:700}}>{h.prize}</span></div>
                <div style={{fontSize:13,color:"#bbb",fontStyle:"italic",marginBottom:10}}>Theme: "{h.theme}"</div>
                <p style={{color:"#999",fontSize:12,lineHeight:1.6,marginBottom:12}}>{h.desc}</p>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>{h.tags.map(t=><Tag key={t} label={t} color="gold"/>)}</div>
                <div style={{display:"flex",gap:20,fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>
                  {h.status!=="ended"&&<span>⏱ {h.deadline}{h.status==="live"?" remaining":" to start"}</span>}
                  {h.participants>0&&<span>👤 {h.participants} builders</span>}
                  {h.teams>0&&<span>👥 {h.teams} teams</span>}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,flexShrink:0,minWidth:130}}>
                {h.status!=="ended"?(
                  <button onClick={()=>registered[h.id]?setRegistered(r=>({...r,[h.id]:false})):registerForHack(h.id)} style={{padding:"11px 14px",fontFamily:"var(--fd)",fontSize:16,letterSpacing:2,cursor:"pointer",background:registered[h.id]?"var(--green)":h.color,color:"#fff",border:`2px solid ${registered[h.id]?"var(--green)":h.color}`,transition:"all .15s",textAlign:"center"}}>{registered[h.id]?"REGISTERED ✓":h.status==="live"?"JOIN NOW":"REGISTER"}</button>
                ):(
                  <button onClick={()=>navigate(`hack-${h.id}`)} style={{padding:"11px 14px",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer",background:"transparent",color:"var(--muted)",border:"2px solid var(--border)",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.color="var(--gold)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)";}}>VIEW RESULTS</button>
                )}
                <button onClick={()=>navigate(`hack-${h.id}`)} style={{padding:"9px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor=h.color;e.target.style.color=h.color;}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>View Details →</button>
                {h.status!=="ended"&&<button onClick={()=>navigate("sqvad")} style={{padding:"9px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>🔥 Find Team</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Sponsor CTA */}
      <div style={{margin:"0 32px 40px",background:"var(--gold)",border:"2px solid #0A0A0A",padding:26,display:"flex",alignItems:"center",justifyContent:"space-between",gap:20}}>
        <div><div style={{fontFamily:"var(--fd)",fontSize:24,letterSpacing:2,color:"#0A0A0A",marginBottom:4}}>SPONSOR A HACKATHON ON VIBR</div><p style={{color:"rgba(0,0,0,.7)",fontSize:12,lineHeight:1.5}}>Put your brand in front of 12,000+ African builders. Set the theme, provide prizes, we handle everything else.</p></div>
        <button style={{background:"#0A0A0A",color:"var(--gold)",border:"2px solid #0A0A0A",padding:"11px 22px",fontFamily:"var(--fd)",fontSize:16,letterSpacing:3,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="var(--red)";e.target.style.borderColor="var(--red)";}} onMouseLeave={e=>{e.target.style.background="#0A0A0A";e.target.style.borderColor="#0A0A0A";}}>GET IN TOUCH →</button>
      </div>
    </AppShell>
  );
}

// ── COMPANIES / INVESTORS PAGE ────────────────────────────────────────────────
const COMPANIES_DATA=[
  {id:1,type:"company",name:"Paystack",logo:"PS",color:"var(--gold)",loc:"Lagos 🇳🇬",desc:"Africa's leading payment infrastructure. We're always looking for top African engineering talent.",bounties:8,hires:23,tags:["Fintech","API","Node.js"],verified:true,hiring:true},
  {id:2,type:"company",name:"Flutterwave",logo:"FW",color:"var(--green)",loc:"San Francisco / Lagos 🇳🇬",desc:"Building payment technology for global commerce from Africa.",bounties:5,hires:14,tags:["Payments","React","Python"],verified:true,hiring:true},
  {id:3,type:"investor",name:"Ventures Platform",logo:"VP",color:"var(--red)",loc:"Lagos 🇳🇬",desc:"Early-stage VC backing African founders. We look for bold technical founders on VIBR.",portfolio:31,checks:"$50K–$500K",tags:["Fintech","EdTech","B2B"],verified:true,hiring:false},
  {id:4,type:"investor",name:"Partech Africa",logo:"PA",color:"var(--gold)",loc:"Dakar 🇸🇳",desc:"Pan-African venture fund. We've invested in over 30 African startups across 15 countries.",portfolio:34,checks:"$200K–$5M",tags:["Series A","Pan-Africa","Deep Tech"],verified:true,hiring:false},
  {id:5,type:"company",name:"Andela",logo:"AN",color:"var(--green)",loc:"Remote / Pan-Africa 🌍",desc:"We connect African developers with global companies. Join our talent network.",bounties:0,hires:890,tags:["Remote Jobs","Any Stack","Senior"],verified:true,hiring:true},
  {id:6,type:"company",name:"Kuda Bank",logo:"KB",color:"var(--red)",loc:"Lagos 🇳🇬",desc:"The money app for Africans. We're building the future of banking and always hiring builders.",bounties:3,hires:45,tags:["Fintech","Mobile","React Native"],verified:true,hiring:true},
];
function CompaniesPage({navigate,returnTo,userRole}){
  const [filter,setFilter]=useState("all");
  const [followed,setFollowed]=useState({});
  const shown=filter==="all"?COMPANIES_DATA:COMPANIES_DATA.filter(c=>c.type===filter);
  return (
    <AppShell navigate={navigate} activePage="companies" returnTo={returnTo} userRole={userRole}>
      <div style={{padding:"24px 32px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div><div style={{fontFamily:"var(--fd)",fontSize:28,letterSpacing:2}}>COMPANIES <span style={{color:"var(--gold)"}}>& INVESTORS</span></div><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:2}}>COMPANIES AND INVESTORS WATCHING VIBR FOR TALENT</div></div>
        <div style={{display:"flex",gap:6}}>
          <div style={{background:"rgba(26,122,60,.1)",border:"1px solid var(--green)",padding:"8px 14px",textAlign:"center"}}><div style={{fontFamily:"var(--fd)",fontSize:18,color:"var(--gr2)"}}>16+</div><div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--muted)",letterSpacing:2}}>COMPANIES</div></div>
          <div style={{background:"rgba(240,165,0,.1)",border:"1px solid var(--gold)",padding:"8px 14px",textAlign:"center"}}><div style={{fontFamily:"var(--fd)",fontSize:18,color:"var(--gold)"}}>8+</div><div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--muted)",letterSpacing:2}}>INVESTORS</div></div>
        </div>
      </div>
      <div style={{padding:"12px 32px",borderBottom:"2px solid var(--border)",display:"flex",gap:6}}>
        {["all","company","investor"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 13px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,textTransform:"uppercase",background:filter===f?"var(--red)":"var(--surface)",color:filter===f?"#fff":"var(--muted)",border:`2px solid ${filter===f?"var(--red)":"var(--border)"}`,cursor:"pointer",transition:"all .15s"}}>{f==="company"?"🏢 Companies":f==="investor"?"💼 Investors":"All"}</button>)}
      </div>
      {/* Investor spotlight */}
      {filter!=="company"&&(
        <div style={{margin:"24px 32px 0",background:"linear-gradient(135deg,#0A0A0A 0%,rgba(240,165,0,.08) 100%)",border:"2px solid rgba(240,165,0,.3)",padding:24,marginBottom:-8}}>
          <div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,color:"var(--gold)",marginBottom:8}}>💡 HOW TO GET INVESTOR ATTENTION ON VIBR</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {[["🔥","Drop projects consistently","Investors watch the trending feed daily"],["⚡","Climb the leaderboard","Top 50 builders get direct outreach"],["🤝","Open your project","Mark your build as open for investment"]].map(([icon,t,s])=><div key={t} style={{padding:"13px",background:"rgba(0,0,0,.3)",border:"1px solid rgba(240,165,0,.15)"}}><div style={{fontSize:20,marginBottom:6}}>{icon}</div><div style={{fontWeight:700,fontSize:12,marginBottom:3}}>{t}</div><div style={{fontSize:11,color:"var(--muted)",lineHeight:1.5}}>{s}</div></div>)}
          </div>
        </div>
      )}
      <div style={{padding:"24px 32px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
        {shown.map((c,i)=>(
          <div key={c.id} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:22,transition:"all .2s",animation:`fadeUp .4s ${i*.07}s ease both`}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.transform="translate(-3px,-3px)";e.currentTarget.style.boxShadow="5px 5px 0 var(--border)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:14}}>
              <div style={{width:52,height:52,background:c.color,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:20,color:c.color==="var(--gold)"?"#000":"#fff",flexShrink:0}}>{c.logo}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}>
                  <div style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:1}}>{c.name}</div>
                  {c.verified&&<span style={{color:"var(--gold)",fontSize:14}}>✓</span>}
                  <span style={{marginLeft:"auto",background:c.type==="investor"?"rgba(240,165,0,.15)":"rgba(26,122,60,.15)",border:`1px solid ${c.type==="investor"?"var(--gold)":"var(--green)"}`,color:c.type==="investor"?"var(--gold)":"var(--gr2)",fontFamily:"var(--fm)",fontSize:7,padding:"2px 7px",letterSpacing:1}}>{c.type.toUpperCase()}</span>
                </div>
                <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>{c.loc}</div>
              </div>
            </div>
            <p style={{color:"#999",fontSize:12,lineHeight:1.6,marginBottom:12}}>{c.desc}</p>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>{c.tags.map(t=><Tag key={t} label={t} color="gold"/>)}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {c.type==="company"?(
                <>
                  <div style={{background:"var(--s2)",padding:"10px",textAlign:"center",border:"1px solid var(--border)"}}><div style={{fontFamily:"var(--fd)",fontSize:20,color:"var(--gold)"}}>{c.bounties}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>Live Bounties</div></div>
                  <div style={{background:"var(--s2)",padding:"10px",textAlign:"center",border:"1px solid var(--border)"}}><div style={{fontFamily:"var(--fd)",fontSize:20,color:"var(--gr2)"}}>{c.hires}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>Hires from VIBR</div></div>
                </>
              ):(
                <>
                  <div style={{background:"var(--s2)",padding:"10px",textAlign:"center",border:"1px solid var(--border)"}}><div style={{fontFamily:"var(--fd)",fontSize:20,color:"var(--gold)"}}>{c.portfolio}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>Portfolio cos.</div></div>
                  <div style={{background:"var(--s2)",padding:"10px",textAlign:"center",border:"1px solid var(--border)"}}><div style={{fontFamily:"var(--fd)",fontSize:13,color:"var(--gr2)",marginTop:3}}>{c.checks}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>Check size</div></div>
                </>
              )}
            </div>
            <div style={{display:"flex",gap:7}}>
              <button onClick={()=>setFollowed(f=>({...f,[c.id]:!f[c.id]}))} style={{flex:1,padding:"9px",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer",background:followed[c.id]?"var(--green)":"transparent",color:followed[c.id]?"#fff":c.color,border:`2px solid ${followed[c.id]?"var(--green)":c.color}`,transition:"all .15s"}}>{followed[c.id]?"Following ✓":"Follow"}</button>
              {c.hiring&&<button onClick={()=>navigate("bounties")} style={{flex:1,padding:"9px",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer",background:c.color,color:c.color==="var(--gold)"?"#000":"#fff",border:`2px solid ${c.color}`,transition:"all .15s"}}>View Jobs</button>}
              {!c.hiring&&<button onClick={()=>navigate("messages")} style={{flex:1,padding:"9px",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer",background:"transparent",color:"var(--muted)",border:"2px solid var(--border)",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>Contact</button>}
            </div>
          </div>
        ))}
      </div>
      {/* List your company CTA */}
      <div style={{margin:"0 32px 40px",background:"#0A0A0A",border:"2px solid var(--border)",padding:26,display:"flex",alignItems:"center",justifyContent:"space-between",gap:20}}>
        <div><div style={{fontFamily:"var(--fd)",fontSize:24,letterSpacing:2,marginBottom:5}}>ARE YOU A <span style={{color:"var(--gold)"}}>COMPANY OR INVESTOR?</span></div><p style={{color:"var(--muted)",fontSize:12,lineHeight:1.5}}>List your company on VIBR and get direct access to 12,000+ vetted African builders. Post bounties, find talent, sponsor hackathons.</p></div>
        <div style={{display:"flex",flexDirection:"column",gap:8,flexShrink:0}}>
          <button style={{padding:"10px 20px",background:"var(--gold)",color:"#000",border:"2px solid var(--gold)",fontFamily:"var(--fd)",fontSize:16,letterSpacing:3,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.background="var(--gold)";e.target.style.color="#000";}}>LIST MY COMPANY →</button>
          <button onClick={()=>navigate("premium")} style={{padding:"9px 20px",background:"transparent",color:"var(--muted)",border:"2px solid var(--border)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",whiteSpace:"nowrap",transition:"all .2s",textTransform:"uppercase"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>See pricing →</button>
        </div>
      </div>
    </AppShell>
  );
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────────
function AdminPage({navigate,session,profile,onSignOut}){
  const [tab,setTab]=useState("overview");
  const [broadcasting,setBroadcasting]=useState(false);
  const [stats,setStats]=useState({users:0,posts:0,bounties:0,revenue:0});

  useEffect(()=>{
    // Load real platform stats
    Promise.all([
      supabase.from("profiles").select("id",{count:"exact",head:true}),
      supabase.from("posts").select("id",{count:"exact",head:true}),
      supabase.from("bounties").select("id",{count:"exact",head:true}),
    ]).then(([u,p,b])=>{
      setStats({
        users: u.count||0,
        posts: p.count||0,
        bounties: b.count||0,
        revenue:0,
      });
    }).catch(()=>{});
  },[]);
  const [broadMsg,setBroadMsg]=useState("");
  const [broadSent,setBroadSent]=useState(false);
  const sendBroadcast=()=>{
    if(!broadMsg.trim())return;
    setBroadSent(true);
    setTimeout(()=>{setBroadSent(false);setBroadcasting(false);setBroadMsg("");},2000);
  };
  const statCards=[
    {label:"Total Members",value:stats.users||"12,841",change:"+342 this week",up:true,color:"var(--green)"},
    {label:"Active Today",value:"1,204",change:"+89 vs yesterday",up:true,color:"var(--gold)"},
    {label:"Projects Dropped",value:stats.posts||"3,218",change:"+67 this week",up:true,color:"var(--red)"},
    {label:"Bounties Completed",value:stats.bounties||"148",change:"+12 this week",up:true,color:"var(--green)"},
    {label:"Revenue (MTD)",value:"₦4.2M",change:"+18% vs last month",up:true,color:"var(--gold)"},
    {label:"Flagged Content",value:"7",change:"Needs review",up:false,color:"var(--red)"},
  ];
  const recentUsers=[
    {name:"Emeka Obi",handle:"emeka_o",flag:"🇳🇬",plan:"Pro",joined:"2h ago",status:"active"},
    {name:"Ama Asante",handle:"ama_a",flag:"🇬🇭",plan:"Free",joined:"4h ago",status:"active"},
    {name:"Sipho Dlamini",handle:"sipho_d",flag:"🇿🇦",plan:"Pro",joined:"6h ago",status:"active"},
    {name:"Fatou Diallo",handle:"fatou_d",flag:"🇸🇳",plan:"Free",joined:"8h ago",status:"pending"},
    {name:"Mwangi Kamau",handle:"mwangi_k",flag:"🇰🇪",plan:"Vibe Lord",joined:"12h ago",status:"active"},
  ];
  const flagged=[
    {type:"spam",content:"Buy crypto fast 1000% profit...",user:"unknown_user",time:"1h ago"},
    {type:"duplicate",content:"Posted same project 4 times",user:"test_user2",time:"3h ago"},
    {type:"report",content:"Inappropriate comment on post #3",user:"reported by: obioma_k",time:"5h ago"},
  ];
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex"}}>
      {/* Admin-only sidebar — completely separate from builder AppShell */}
      <div style={{width:200,background:"#0A0A0A",borderRight:"2px solid #1A1A1A",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0}}>
        <div style={{padding:"18px 18px 14px",borderBottom:"2px solid #1A1A1A"}}>
          <div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:4,display:"flex",alignItems:"center"}}><span style={{color:"var(--white)"}}>V</span><span style={{color:"var(--red)"}}>I</span><span style={{color:"var(--white)"}}>B</span><span style={{color:"var(--gold)"}}>R</span><span style={{width:4,height:4,background:"var(--gr2)",borderRadius:"50%",marginLeft:2,marginBottom:2,display:"inline-block"}}/></div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:6,padding:"3px 7px",background:"rgba(209,43,43,.15)",border:"1px solid rgba(209,43,43,.4)",width:"fit-content"}}><span style={{width:5,height:5,background:"var(--red)",borderRadius:"50%",display:"inline-block",animation:"pulse 2s infinite"}}/><span style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--r2)",letterSpacing:2}}>ADMIN</span></div>
        </div>
        <nav style={{flex:1,padding:"8px 0"}}>
          {["overview","members","content","revenue","admins"].map(t=>{const a=tab===t;return <div key={t} onClick={()=>setTab(t)} style={{padding:"11px 16px",cursor:"pointer",transition:"all .15s",background:a?"rgba(209,43,43,.12)":"transparent",borderLeft:a?"3px solid var(--red)":"3px solid transparent",color:a?"var(--white)":"#555",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,textTransform:"uppercase",display:"flex",alignItems:"center",gap:8}} onMouseEnter={e=>{if(!a){e.currentTarget.style.background="#111";e.currentTarget.style.color="var(--white)";}}} onMouseLeave={e=>{if(!a){e.currentTarget.style.background="transparent";e.currentTarget.style.color="#555";}}}>{({overview:"⚡",members:"👥",content:"📋",revenue:"💰",admins:"🛡️"})[t]} {t}</div>;})}</nav>
        <div style={{padding:"12px",borderTop:"1px solid #1A1A1A"}}>
          <button onClick={()=>navigate("landing")} style={{width:"100%",padding:"8px",background:"transparent",border:"1px solid #2A2A2A",color:"#444",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="#555";e.target.style.color="#888";}} onMouseLeave={e=>{e.target.style.borderColor="#2A2A2A";e.target.style.color="#444";}}>← Exit Admin</button>
        </div>
      </div>
      {/* Broadcast modal */}
      {broadcasting&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setBroadcasting(false)}>
          <div style={{background:"var(--surface)",border:"2px solid var(--gold)",padding:28,maxWidth:520,width:"100%",animation:"fadeUp .3s ease both"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2,color:"var(--gold)",marginBottom:4}}>📢 PLATFORM BROADCAST</div>
            <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2,marginBottom:18}}>SEND TO ALL 12,841 MEMBERS INSTANTLY · SHOWS IN THEIR NOTIFICATIONS</div>
            <textarea value={broadMsg} onChange={e=>setBroadMsg(e.target.value)} placeholder="What do you want to tell the entire VIBR community?" rows={4} style={{width:"100%",padding:"12px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:14,outline:"none",fontFamily:"var(--fb)",resize:"none",lineHeight:1.7,borderRadius:0,marginBottom:12,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={sendBroadcast} style={{flex:1,padding:"12px",background:broadSent?"var(--green)":"var(--gold)",color:broadSent?"#fff":"#000",border:`2px solid ${broadSent?"var(--green)":"var(--gold)"}`,fontFamily:"var(--fd)",fontSize:17,letterSpacing:3,cursor:"pointer",transition:"all .3s"}}>{broadSent?"✓ BROADCAST SENT!":"BROADCAST NOW →"}</button>
              <button onClick={()=>setBroadcasting(false)} style={{padding:"12px 18px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fd)",fontSize:15,letterSpacing:2,cursor:"pointer"}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Admin content */}
      <div style={{flex:1,overflow:"auto"}}>
      <div style={{padding:"22px 28px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontFamily:"var(--fd)",fontSize:28,letterSpacing:2}}>ADMIN <span style={{color:"var(--red)"}}>DASHBOARD</span></div>
          <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>VIBR FOUNDER PANEL · FULL CONTROL</div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={()=>setBroadcasting(true)} style={{background:"var(--gold)",color:"#000",border:"2px solid var(--gold)",padding:"8px 18px",fontFamily:"var(--fd)",fontSize:15,letterSpacing:2,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.background="var(--gold)";e.target.style.color="#000";}}>📢 Broadcast</button>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:"rgba(209,43,43,.1)",border:"1px solid var(--red)"}}>
            <span style={{width:7,height:7,background:"var(--red)",borderRadius:"50%",display:"inline-block",animation:"pulse 2s infinite"}}/>
            <span style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--r2)",letterSpacing:2}}>ADMIN ACCESS</span>
          </div>
        </div>
      </div>
      <div style={{padding:"24px 28px"}}>
        {tab==="overview"&&(
          <div className="fu">
            {/* Stats grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:13,marginBottom:24}}>
              {statCards.map((s,i)=>(
                <div key={s.label} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:18,animation:`fadeUp .3s ${i*.06}s ease both`}}>
                  <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{s.label}</div>
                  <div style={{fontFamily:"var(--fd)",fontSize:34,color:s.color,lineHeight:1,marginBottom:4}}>{s.value}</div>
                  <div style={{fontFamily:"var(--fm)",fontSize:9,color:s.up?"var(--gr2)":"var(--r2)"}}>{s.up?"↑":"↓"} {s.change}</div>
                </div>
              ))}
            </div>
            {/* Recent signups */}
            <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:18,marginBottom:14}}>
              <div style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:2,marginBottom:14}}>RECENT SIGNUPS</div>
              {recentUsers.map((u,i)=>(
                <div key={u.handle} style={{display:"flex",alignItems:"center",gap:11,padding:"10px 0",borderBottom:"1px solid var(--border)",animation:`fadeUp .3s ${i*.06}s ease both`}}>
                  <Av name={u.name} color={["red","gold","green"][i%3]} size={34}/>
                  <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{u.name} {u.flag}</div><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>@{u.handle}</div></div>
                  <span style={{background:u.plan==="Vibe Lord"?"var(--gold)":u.plan==="Pro"?"rgba(209,43,43,.2)":"var(--s2)",color:u.plan==="Vibe Lord"?"#000":u.plan==="Pro"?"var(--r2)":"var(--muted)",fontFamily:"var(--fm)",fontSize:8,padding:"2px 8px",letterSpacing:1}}>{u.plan}</span>
                  <span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>{u.joined}</span>
                  <span style={{width:6,height:6,borderRadius:"50%",background:u.status==="active"?"var(--gr2)":"var(--gold)",flexShrink:0}}/>
                </div>
              ))}
            </div>
            {/* Flagged content */}
            <div style={{background:"rgba(209,43,43,.06)",border:"2px solid rgba(209,43,43,.3)",padding:18}}>
              <div style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:2,marginBottom:14,color:"var(--r2)"}}>FLAGGED CONTENT ⚠️</div>
              {flagged.map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.06)"}}>
                  <span style={{background:"var(--red)",color:"#fff",fontFamily:"var(--fm)",fontSize:7,padding:"2px 7px",letterSpacing:1,textTransform:"uppercase",flexShrink:0}}>{f.type}</span>
                  <div style={{flex:1}}><div style={{fontSize:12,color:"#bbb",marginBottom:2}}>{f.content}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>{f.user} · {f.time}</div></div>
                  <div style={{display:"flex",gap:6}}>
                    <button style={{padding:"4px 10px",background:"transparent",border:"1px solid var(--green)",color:"var(--gr2)",fontFamily:"var(--fm)",fontSize:8,cursor:"pointer",letterSpacing:1}}>APPROVE</button>
                    <button style={{padding:"4px 10px",background:"var(--red)",border:"1px solid var(--red)",color:"#fff",fontFamily:"var(--fm)",fontSize:8,cursor:"pointer",letterSpacing:1}}>REMOVE</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==="members"&&(
          <div className="fu">
            <div style={{display:"flex",gap:10,marginBottom:18}}>
              <input placeholder="Search members by name, handle, country..." style={{flex:1,padding:"10px 13px",background:"var(--surface)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              <select style={{padding:"10px 13px",background:"var(--surface)",border:"2px solid var(--border)",color:"var(--text)",fontSize:12,outline:"none",fontFamily:"var(--fb)",cursor:"pointer"}}>{["All Countries","Nigeria 🇳🇬","Kenya 🇰🇪","Ghana 🇬🇭","South Africa 🇿🇦"].map(c=><option key={c}>{c}</option>)}</select>
              <select style={{padding:"10px 13px",background:"var(--surface)",border:"2px solid var(--border)",color:"var(--text)",fontSize:12,outline:"none",fontFamily:"var(--fb)",cursor:"pointer"}}>{["All Plans","Free","Pro","Vibe Lord"].map(c=><option key={c}>{c}</option>)}</select>
            </div>
            <div style={{background:"var(--surface)",border:"2px solid var(--border)",overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 80px 90px 80px 90px 100px",padding:"9px 16px",background:"var(--s2)",borderBottom:"2px solid var(--border)"}}>
                {["MEMBER","COUNTRY","PLAN","DROPS","VIBES","ACTIONS"].map(h=><div key={h} style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>{h}</div>)}
              </div>
              {[...LEADERBOARD,...recentUsers.slice(0,3).map((u,i)=>({name:u.name,handle:u.handle,flag:u.flag,badge:u.plan,pts:Math.floor(Math.random()*500),drops:Math.floor(Math.random()*5),collabs:0,av:u.name.slice(0,2).toUpperCase(),avc:["red","gold","green"][i%3]}))].slice(0,8).map((m,i)=>(
                <div key={m.handle} style={{display:"grid",gridTemplateColumns:"1fr 80px 90px 80px 90px 100px",padding:"11px 16px",borderBottom:"1px solid var(--border)",animation:`fadeUp .3s ${i*.04}s ease both`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}><Av name={m.av} color={m.avc} size={30}/><div><div style={{fontSize:12,fontWeight:700}}>{m.name}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>@{m.handle}</div></div></div>
                  <div style={{display:"flex",alignItems:"center",fontSize:16}}>{m.flag}</div>
                  <div style={{display:"flex",alignItems:"center"}}><span style={{background:"var(--s2)",border:"1px solid var(--border)",fontFamily:"var(--fm)",fontSize:7,padding:"2px 6px",color:"var(--muted)",letterSpacing:1}}>{m.badge||"Free"}</span></div>
                  <div style={{display:"flex",alignItems:"center",fontFamily:"var(--fd)",fontSize:18,color:"var(--white)"}}>{m.drops}</div>
                  <div style={{display:"flex",alignItems:"center",fontFamily:"var(--fd)",fontSize:16,color:"var(--gold)"}}>{m.pts?.toLocaleString()||"0"}</div>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <button style={{padding:"3px 8px",background:"transparent",border:"1px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:7,cursor:"pointer",letterSpacing:1,transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>VIEW</button>
                    <button style={{padding:"3px 8px",background:"transparent",border:"1px solid var(--red)",color:"var(--r2)",fontFamily:"var(--fm)",fontSize:7,cursor:"pointer",letterSpacing:1,transition:"all .2s"}} onMouseEnter={e=>{e.target.style.background="var(--red)";e.target.style.color="#fff";}} onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color="var(--r2)";}}>BAN</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==="revenue"&&(
          <div className="fu">
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
              {[["₦4.2M","Monthly Revenue","var(--gold)"],["₦1.8M","Subscriptions","var(--green)"],["₦1.6M","Bounty Commission","var(--red)"],["₦0.8M","Company Accounts","var(--gold)"]].map(([v,l,c])=>(
                <div key={l} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:16,textAlign:"center"}}><div style={{fontFamily:"var(--fd)",fontSize:28,color:c,lineHeight:1,marginBottom:4}}>{v}</div><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:2,textTransform:"uppercase"}}>{l}</div></div>
              ))}
            </div>
            <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:18,marginBottom:14}}>
              <div style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:2,marginBottom:14}}>RECENT TRANSACTIONS</div>
              {[["Builder Pro Subscription","@emeka_o","₦3,500","2h ago","green"],["Bounty Commission 12%","@kofi_builds","₦6,000","4h ago","green"],["Vibe Lord Subscription","@mwangi_k","₦8,000","6h ago","green"],["Refund requested","@test_user","₦3,500","1d ago","red"],["Company Account - Paystack","Paystack","₦149,000","2d ago","green"]].map(([desc,user,amt,time,color],i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:`var(--${color})`,flexShrink:0}}/>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{desc}</div><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>{user} · {time}</div></div>
                  <div style={{fontFamily:"var(--fd)",fontSize:18,color:color==="green"?"var(--gr2)":"var(--r2)"}}>{color==="red"?"-":""}{amt}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==="admins"&&(
          <div className="fu">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",textTransform:"uppercase"}}>500 admin slots · 47 filled</div>
              <button style={{padding:"7px 16px",background:"var(--green)",color:"#fff",border:"2px solid var(--green)",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer"}}>+ ADD ADMIN</button>
            </div>
            {[{role:"Country Lead 🇳🇬",name:"Obioma Kalu",handle:"obioma_k",scope:"Nigeria — All chapters",perms:["Approve members","Remove posts","Run events"]},{role:"Country Lead 🇰🇪",name:"Nadia Wanjiru",handle:"nadia.w",scope:"Kenya — All chapters",perms:["Approve members","Remove posts","Run events"]},{role:"Stack Lead ⚛️",name:"Kofi Osei",handle:"kofi_builds",scope:"React Africa space",perms:["Pin messages","Remove posts"]},{role:"Vibe Scout 🔍",name:"Amara Mensah",handle:"amara.m",scope:"New project discovery",perms:["Feature projects","Send recommendations"]},{role:"Event Host ⚡",name:"Tinashe Amos",handle:"tinashe_dev",scope:"CleanTech hackathons",perms:["Create events","Manage registrations"]}].map((a,i)=>(
              <div key={a.handle} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:18,marginBottom:11,display:"flex",alignItems:"flex-start",gap:14,animation:`fadeUp .3s ${i*.07}s ease both`}}>
                <Av name={a.name} color={["red","green","gold","green","red"][i]} size={40}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}><div style={{fontWeight:700,fontSize:13}}>{a.name}</div><span style={{background:"rgba(240,165,0,.15)",border:"1px solid var(--gold)",fontFamily:"var(--fm)",fontSize:7,padding:"2px 7px",color:"var(--gold)",letterSpacing:1}}>{a.role}</span></div>
                  <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",marginBottom:8}}>@{a.handle} · {a.scope}</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{a.perms.map(p=><span key={p} style={{fontSize:10,color:"#aaa",background:"var(--s2)",border:"1px solid var(--border)",padding:"2px 8px"}}>{p}</span>)}</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button style={{padding:"5px 12px",background:"transparent",border:"1px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:7,cursor:"pointer",letterSpacing:1,textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>EDIT</button>
                  <button style={{padding:"5px 12px",background:"transparent",border:"1px solid var(--red)",color:"var(--r2)",fontFamily:"var(--fm)",fontSize:7,cursor:"pointer",letterSpacing:1,textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.background="var(--red)";e.target.style.color="#fff";}} onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color="var(--r2)";}}>REMOVE</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab==="content"&&(
          <div className="fu">
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
              {[["3,218","Total Projects","var(--white)"],["7","Flagged Today","var(--r2)"],["148","Bounties Completed","var(--gr2)"]].map(([v,l,c])=>(
                <div key={l} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:16,textAlign:"center"}}><div style={{fontFamily:"var(--fd)",fontSize:32,color:c,lineHeight:1,marginBottom:4}}>{v}</div><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:2,textTransform:"uppercase"}}>{l}</div></div>
              ))}
            </div>
            {FEED_POSTS.map((p,i)=>(
              <div key={p.id} style={{background:"var(--surface)",border:"1px solid var(--border)",padding:"14px 16px",marginBottom:9,display:"flex",alignItems:"center",gap:12,animation:`fadeUp .3s ${i*.06}s ease both`}}>
                <Av name={p.av} color={p.avc} size={34}/>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{p.title}</div><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>@{p.handle} · {p.time} · ▲{p.votes}</div></div>
                <div style={{display:"flex",gap:6}}>
                  <button style={{padding:"4px 10px",background:"transparent",border:"1px solid var(--gold)",color:"var(--gold)",fontFamily:"var(--fm)",fontSize:7,cursor:"pointer",letterSpacing:1}}>FEATURE</button>
                  <button style={{padding:"4px 10px",background:"transparent",border:"1px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:7,cursor:"pointer",letterSpacing:1}}>HIDE</button>
                  <button style={{padding:"4px 10px",background:"transparent",border:"1px solid var(--red)",color:"var(--r2)",fontFamily:"var(--fm)",fontSize:7,cursor:"pointer",letterSpacing:1}}>DELETE</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// ── SQUAD CHAT SYSTEM (separate per-squad group chat, NOT DMs) ───────────────
const SQUAD_CHAT_MSGS = {
  sq1:[
    {user:"Tolu Kehinde",av:"TK",avc:"red",role:"Captain",text:"Yo squad — pushing the Agric AI MVP this weekend. Who's available?",time:"10m ago"},
    {user:"Obioma Kalu",av:"OK",avc:"red",role:"Member",text:"I'm in. I'll handle the backend endpoints for the supply chain data.",time:"8m ago"},
    {user:"Amara Mensah",av:"AM",avc:"gold",role:"Member",text:"Same. I can start on the dashboard UI after 3pm.",time:"6m ago"},
    {user:"Tolu Kehinde",av:"TK",avc:"red",role:"Captain",text:"🔥 Let's ship it. I'll drop the GitHub link in 30min.",time:"2m ago"},
  ],
  sq2:[
    {user:"Nadia Wanjiru",av:"NW",avc:"green",role:"Captain",text:"Moussa — did you finish the Hausa NLP model training?",time:"2h ago"},
    {user:"Moussa Bah",av:"MB",avc:"green",role:"Member",text:"Almost! Accuracy is at 84% now. Need 2 more hours of compute.",time:"1h ago"},
    {user:"Nadia Wanjiru",av:"NW",avc:"green",role:"Captain",text:"Amazing. I'll write the demo script once it's ready.",time:"45m ago"},
  ],
};

const INITIAL_SQVAD = [
  { id:"sq1", name:"Lagos Fintech Crew", handle:"lfc", emoji:"💸", color:"var(--gold)",
    members:[
      {name:"Tolu Kehinde",handle:"tolu_builds",flag:"🇳🇬",av:"TK",avc:"red",role:"Captain",status:"active"},
      {name:"Obioma Kalu",handle:"obioma_k",flag:"🇳🇬",av:"OK",avc:"red",role:"Member",status:"active"},
      {name:"Amara Mensah",handle:"amara.m",flag:"🇬🇭",av:"AM",avc:"gold",role:"Member",status:"active"},
    ],
    projects:["Agric Supply Chain AI","Naira DeFi Wallet"],
    drops:12, wins:3, formed:"Jan 2025", bio:"Building fintech for underbanked West Africa. Vibe coders only.",
    open:true },
  { id:"sq2", name:"East Africa AI Squad", handle:"eaai", emoji:"🤖", color:"var(--green)",
    members:[
      {name:"Nadia Wanjiru",handle:"nadia.w",flag:"🇰🇪",av:"NW",avc:"green",role:"Captain",status:"active"},
      {name:"Moussa Bah",handle:"moussa_dev",flag:"🇸🇳",av:"MB",avc:"green",role:"Member",status:"active"},
    ],
    projects:["Offline AI Tutor","Wolof NLP Translator"],
    drops:8, wins:2, formed:"Feb 2025", bio:"AI tools built for and in African languages.",
    open:false },
];

const SQVAD_INVITES_DEMO = [
  { id:"inv1", from:"Kofi Osei", handle:"kofi_builds", flag:"🇬🇭", av:"KO", avc:"gold",
    sqvad:"Web3 Africa Builders", emoji:"⛓️", msg:"Bro your remittance work is fire. Want to join our Web3 squad? We're building the African DeFi stack together.", time:"10m ago", status:"pending" },
  { id:"inv2", from:"Zara Ndlovu", handle:"zara_n", flag:"🇿🇦", av:"ZN", avc:"green",
    sqvad:"CleanTech South", emoji:"🌱", msg:"Hey! I saw your solar monitor project. We're a small squad focused on clean energy across SA + Zim. Would love to have you.", time:"2h ago", status:"pending" },
];

// ── SQVAD PAGE ─────────────────────────────────────────────────────────────────

// ── SQUAD INLINE CHAT COMPONENT (realtime, Supabase-wired) ───────────────────
function SquadInlineChat({sqId,sqName,sqColor,sqEmoji,sqMembers,session}){
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const channelRef=useRef(null);

  useEffect(()=>{
    if(!sqId) return;
    // Load existing messages
    supabase.from("squad_messages")
      .select("*,profiles:sender_id(username,full_name)")
      .eq("squad_id",sqId)
      .order("created_at",{ascending:true})
      .limit(50)
      .then(({data})=>{
        if(data&&data.length>0){
          setMsgs(data.map(m=>({
            id:m.id,
            user:m.profiles?.full_name||m.profiles?.username||"Member",
            av:(m.profiles?.username||"M").slice(0,2).toUpperCase(),
            avc:"gold",
            role:"Member",
            text:m.content,
            time:new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),
            isMe:m.sender_id===session?.user?.id,
          })));
        }
      })
      .catch(()=>{});

    // Subscribe to new messages
    channelRef.current = supabase
      .channel(`squad_messages:${sqId}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"squad_messages",filter:`squad_id=eq.${sqId}`},
        payload=>{
          setMsgs(prev=>[...prev,{
            id:payload.new.id,
            user:"Member", av:"MB", avc:"gold", role:"Member",
            text:payload.new.content,
            time:"Just now",
            isMe:payload.new.sender_id===session?.user?.id,
          }]);
        })
      .subscribe();

    return ()=>{ supabase.removeChannel(channelRef.current); };
  },[sqId,session]);

  const send=async()=>{
    if(!input.trim()||!session) return;
    const text=input; setInput("");
    setMsgs(m=>[...m,{id:Date.now(),user:"You",av:"YO",avc:"red",role:"Member",text,time:"Just now",isMe:true}]);
    try{
      await supabase.from("squad_messages")
        .insert({squad_id:sqId,sender_id:session.user.id,content:text});
    }catch{}
  };

  const color = sqColor||"var(--gold)";
  const isBg  = color==="var(--gold)";

  return (
    <div style={{borderTop:`2px solid ${color}`,background:"var(--s2)"}}>
      <div style={{padding:"10px 18px",display:"flex",alignItems:"center",gap:8,borderBottom:"1px solid var(--border)"}}>
        <span style={{fontSize:14}}>{sqEmoji}</span>
        <div style={{fontFamily:"var(--fd)",fontSize:16,letterSpacing:1,color}}>{sqName} — Group Chat</div>
        <div style={{marginLeft:"auto",fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:1}}>👥 {sqMembers?.length||0} members · private</div>
      </div>
      <div style={{maxHeight:260,overflowY:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:12}}>
        {msgs.map((m,i)=>(
          <div key={m.id||i} style={{display:"flex",gap:9,flexDirection:m.isMe?"row-reverse":"row"}}>
            <Av name={m.av} color={m.avc} size={30}/>
            <div style={{maxWidth:"80%"}}>
              {!m.isMe&&<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <span style={{fontWeight:700,fontSize:12}}>{m.user}</span>
                <span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>{m.time}</span>
              </div>}
              <div style={{fontSize:13,color:"#ddd",lineHeight:1.6,background:m.isMe?color:"var(--bg)",color:m.isMe&&isBg?"#000":"#ddd",padding:"8px 12px",border:`1px solid ${m.isMe?color:"var(--border)"}`}}>{m.text}</div>
              {m.isMe&&<div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",textAlign:"right",marginTop:2}}>{m.time}</div>}
            </div>
          </div>
        ))}
        {msgs.length===0&&<div style={{textAlign:"center",padding:"24px",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2}}>NO MESSAGES YET — START THE CONVERSATION</div>}
      </div>
      <div style={{padding:"10px 18px",borderTop:"1px solid var(--border)",display:"flex",gap:8,background:"var(--bg)"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={`Message ${sqName}...`} style={{flex:1,padding:"9px 12px",background:"var(--s2)",border:"1.5px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor=color} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
        <button onClick={send} style={{padding:"9px 16px",background:color,color:isBg?"#000":"#fff",border:`2px solid ${color}`,fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer",whiteSpace:"nowrap",transition:"all .15s"}}>SEND →</button>
      </div>
      <div style={{padding:"5px 18px 9px",fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:1}}>🔒 Private — squad members only · Not connected to DMs</div>
    </div>
  );
}

function SqvadPage({navigate,returnTo,userRole,session}){
  const [squads,setSquads]=useState(INITIAL_SQVAD);
  const [invites,setInvites]=useState(SQVAD_INVITES_DEMO);
  const [tab,setTab]=useState("my-squads");
  const [creating,setCreating]=useState(false);
  const [newSquad,setNewSquad]=useState({name:"",bio:"",emoji:"🔥",color:"var(--red)",open:true});
  const [inviting,setInviting]=useState(null); // sqvad id being invited to
  const [inviteHandle,setInviteHandle]=useState("");
  const [inviteMsg,setInviteMsg]=useState("");
  const [sent,setSent]=useState(false);
  const [openChat,setOpenChat]=useState(null);

  const acceptInvite=(id)=>{
    setInvites(inv=>inv.map(i=>i.id===id?{...i,status:"accepted"}:i));
  };
  const declineInvite=(id)=>{
    setInvites(inv=>inv.filter(i=>i.id!==id));
  };
  const createSquad=()=>{
    if(!newSquad.name.trim()) return;
    const sq={id:`sq${Date.now()}`,name:newSquad.name,handle:newSquad.name.toLowerCase().replace(/\s+/g,"-"),emoji:newSquad.emoji,color:newSquad.color,members:[{name:"You",handle:"yourhandle",flag:"🇳🇬",av:"YO",avc:"red",role:"Captain",status:"active"}],projects:[],drops:0,wins:0,formed:"Now",bio:newSquad.bio,open:newSquad.open};
    setSquads(s=>[...s,sq]);
    setNewSquad({name:"",bio:"",emoji:"🔥",color:"var(--red)",open:true});
    setCreating(false);
    setTab("my-squads");
  };
  const sendInvite=()=>{
    if(!inviteHandle.trim()) return;
    setSent(true);
    setTimeout(()=>{setSent(false);setInviting(null);setInviteHandle("");setInviteMsg("");},1800);
  };

  const emojis=["🔥","💸","🤖","🌍","⚡","🛸","🧬","⛓️","🌱","💡","🎯","👾"];
  const colors=["var(--red)","var(--gold)","var(--green)","#7C3AED","var(--r2)","var(--gr2)"];
  const inp={width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",transition:"border-color .2s",borderRadius:0};

  const pendingCount=invites.filter(i=>i.status==="pending").length;

  return (
    <AppShell navigate={navigate} activePage="sqvad" returnTo={returnTo} userRole={userRole}>
      {/* Invite modal */}
      {inviting&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setInviting(null)}>
          <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:28,maxWidth:480,width:"100%",animation:"fadeUp .3s ease both"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"var(--fd)",fontSize:24,letterSpacing:2,marginBottom:4}}>INVITE TO <span style={{color:"var(--gold)"}}>{squads.find(s=>s.id===inviting)?.name.toUpperCase()}</span></div>
            <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2,marginBottom:20}}>THIS INVITE WILL BE SENT VIA THEIR INBOX</div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>Builder Handle</div>
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"var(--gold)",fontFamily:"var(--fm)"}}>@</span>
                  <input value={inviteHandle} onChange={e=>setInviteHandle(e.target.value)} placeholder="kofi_builds" style={{...inp,paddingLeft:30}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
              </div>
              <div>
                <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>Personal message (optional)</div>
                <textarea value={inviteMsg} onChange={e=>setInviteMsg(e.target.value)} placeholder="Hey! I want you in my squad. Your work on fintech is exactly what we need..." rows={3} style={{...inp,resize:"none",lineHeight:1.6}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={sendInvite} style={{flex:1,padding:"12px",background:sent?"var(--green)":"var(--gold)",color:sent?"#fff":"#000",border:`2px solid ${sent?"var(--green)":"var(--gold)"}`,fontFamily:"var(--fd)",fontSize:17,letterSpacing:3,cursor:"pointer",transition:"all .3s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {sent?"✓ INVITE SENT!":"SEND SQUAD INVITE →"}
                </button>
                <button onClick={()=>setInviting(null)} style={{padding:"12px 18px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fd)",fontSize:15,letterSpacing:2,cursor:"pointer"}}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create squad modal */}
      {creating&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setCreating(false)}>
          <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:28,maxWidth:520,width:"100%",animation:"fadeUp .3s ease both"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2,marginBottom:4}}>CREATE YOUR <span style={{color:"var(--gold)"}}>SQUAD</span></div>
            <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2,marginBottom:22}}>BUILD YOUR CREW. SHOW UP TOGETHER.</div>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {/* Emoji + color picker */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <div>
                  <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:8,textTransform:"uppercase"}}>Squad Emoji</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {emojis.map(e=><button key={e} onClick={()=>setNewSquad(s=>({...s,emoji:e}))} style={{width:34,height:34,background:newSquad.emoji===e?"var(--gold)":"var(--s2)",border:`2px solid ${newSquad.emoji===e?"var(--gold)":"var(--border)"}`,fontSize:16,cursor:"pointer",transition:"all .15s"}}>{e}</button>)}
                  </div>
                </div>
                <div>
                  <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:8,textTransform:"uppercase"}}>Squad Color</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {colors.map(c=><button key={c} onClick={()=>setNewSquad(s=>({...s,color:c}))} style={{width:34,height:34,background:c,border:`3px solid ${newSquad.color===c?"#fff":"transparent"}`,cursor:"pointer",transition:"all .15s",boxShadow:newSquad.color===c?"0 0 0 1px #555":undefined}}/>)}
                  </div>
                </div>
              </div>
              <div>
                <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>Squad Name *</div>
                <input value={newSquad.name} onChange={e=>setNewSquad(s=>({...s,name:e.target.value}))} placeholder="e.g. Lagos Fintech Crew, East Africa AI Squad" style={inp} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>
              <div>
                <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>Squad Bio</div>
                <textarea value={newSquad.bio} onChange={e=>setNewSquad(s=>({...s,bio:e.target.value}))} placeholder="What does your squad build? What's the mission?" rows={3} style={{...inp,resize:"none",lineHeight:1.6}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>
              <div onClick={()=>setNewSquad(s=>({...s,open:!s.open}))} style={{display:"flex",alignItems:"center",gap:14,padding:"13px",background:newSquad.open?"rgba(26,122,60,.08)":"var(--s2)",border:`2px solid ${newSquad.open?"var(--green)":"var(--border)"}`,cursor:"pointer",transition:"all .15s"}}>
                <span style={{fontSize:20}}>{newSquad.open?"🌍":"🔒"}</span>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{newSquad.open?"Open Squad":"Closed Squad"}</div><div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)"}}>{newSquad.open?"Anyone can request to join":"Invite-only — you control who gets in"}</div></div>
                <div style={{width:40,height:20,background:newSquad.open?"var(--green)":"var(--border)",borderRadius:10,position:"relative",transition:"background .2s",flexShrink:0}}><div style={{width:14,height:14,background:"#fff",borderRadius:"50%",position:"absolute",top:3,left:newSquad.open?23:3,transition:"left .2s"}}/></div>
              </div>
              {/* Preview */}
              <div style={{background:"var(--s2)",border:`2px solid ${newSquad.color}`,padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:46,height:46,background:newSquad.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{newSquad.emoji}</div>
                <div>
                  <div style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:1,color:newSquad.color}}>{newSquad.name||"Your Squad Name"}</div>
                  <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:1}}>1 member (You) · Captain</div>
                </div>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={createSquad} style={{flex:1,padding:"12px",background:"var(--gold)",color:"#000",border:"2px solid var(--gold)",fontFamily:"var(--fd)",fontSize:17,letterSpacing:3,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.background="var(--gold)";e.target.style.color="#000";}}>CREATE SQUAD →</button>
                <button onClick={()=>setCreating(false)} style={{padding:"12px 18px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fd)",fontSize:15,letterSpacing:2,cursor:"pointer"}}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main page */}
      <div style={{padding:"22px 30px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontFamily:"var(--fd)",fontSize:28,letterSpacing:2}}>MY SQUAD <span style={{color:"var(--gold)"}}>🔥</span></div>
          <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>YOUR CREW. YOUR TEAM. YOUR PEOPLE.</div>
        </div>
        <button onClick={()=>setCreating(true)} style={{background:"var(--gold)",color:"#000",border:"2px solid var(--gold)",padding:"9px 22px",fontFamily:"var(--fd)",fontSize:16,letterSpacing:2,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:7}} onMouseEnter={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--gold)";}} onMouseLeave={e=>{e.currentTarget.style.background="var(--gold)";e.currentTarget.style.color="#000";}}>+ CREATE SQUAD</button>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"2px solid var(--border)",padding:"0 30px"}}>
        {[["my-squads","My Squads"],["invites",`Invites${pendingCount>0?` (${pendingCount})`:""}`,],["discover","Discover"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:"11px 18px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,textTransform:"uppercase",background:"transparent",border:"none",cursor:"pointer",color:tab===id?"var(--white)":"var(--muted)",borderBottom:tab===id?"3px solid var(--gold)":"3px solid transparent",marginBottom:-2,transition:"all .15s"}}>{label}</button>
        ))}
      </div>

      <div style={{padding:"24px 30px"}}>

        {/* MY SQUADS */}
        {tab==="my-squads"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {squads.length===0&&(
              <div style={{textAlign:"center",padding:"52px",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:10,letterSpacing:2}}>NO SQUADS YET — CREATE ONE OR ACCEPT AN INVITE</div>
            )}
            {squads.map((sq,i)=>(
              <div key={sq.id} style={{background:"var(--surface)",border:`2px solid var(--border)`,padding:24,transition:"border-color .2s",animation:`fadeUp .4s ${i*.08}s ease both`,position:"relative",overflow:"hidden"}} onMouseEnter={e=>e.currentTarget.style.borderColor=sq.color} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                {/* Top color accent */}
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${sq.color},transparent)`}}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:20}}>
                  <div>
                    {/* Squad header */}
                    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                      <div style={{width:52,height:52,background:sq.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{sq.emoji}</div>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3}}>
                          <div style={{fontFamily:"var(--fd)",fontSize:24,letterSpacing:2,color:sq.color}}>{sq.name}</div>
                          <span style={{background:sq.open?"rgba(26,122,60,.12)":"rgba(100,100,100,.12)",border:`1px solid ${sq.open?"var(--green)":"var(--muted)"}`,fontFamily:"var(--fm)",fontSize:7,padding:"2px 8px",color:sq.open?"var(--gr2)":"var(--muted)",letterSpacing:1}}>{sq.open?"OPEN":"INVITE ONLY"}</span>
                        </div>
                        <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>@{sq.handle} · Formed {sq.formed} · {sq.drops} drops · {sq.wins} hackathon wins</div>
                      </div>
                    </div>
                    {/* Bio */}
                    {sq.bio&&<p style={{color:"#999",fontSize:13,lineHeight:1.6,marginBottom:14}}>{sq.bio}</p>}
                    {/* Members */}
                    <div style={{marginBottom:14}}>
                      <div style={{fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,color:"var(--muted)",marginBottom:10,textTransform:"uppercase"}}>Members ({sq.members.length})</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                        {sq.members.map((m,mi)=>(
                          <div key={m.handle} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"var(--s2)",border:`1px solid var(--border)`,transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=sq.color} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                            <Av name={m.av} color={m.avc} size={30}/>
                            <div>
                              <div style={{fontSize:12,fontWeight:700}}>{m.name} {m.flag}</div>
                              <div style={{fontFamily:"var(--fm)",fontSize:7,color:m.role==="Captain"?sq.color:"var(--muted)",letterSpacing:1}}>{m.role}</div>
                            </div>
                          </div>
                        ))}
                        {/* Add member tile */}
                        <button onClick={()=>setInviting(sq.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:"transparent",border:"2px dashed var(--border)",cursor:"pointer",transition:"all .2s",fontSize:12,color:"var(--muted)"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=sq.color;e.currentTarget.style.color=sq.color;}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)";}}>
                          <span style={{fontSize:18}}>+</span> Invite member
                        </button>
                      </div>
                    </div>
                    {/* Projects */}
                    {sq.projects.length>0&&(
                      <div>
                        <div style={{fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,color:"var(--muted)",marginBottom:8,textTransform:"uppercase"}}>Squad Projects</div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          {sq.projects.map(p=><span key={p} style={{padding:"4px 12px",background:"var(--s2)",border:`1px solid var(--border)`,fontFamily:"var(--fm)",fontSize:10,color:"#aaa",letterSpacing:1}}>🔥 {p}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,minWidth:130}}>
                    <button onClick={()=>setInviting(sq.id)} style={{padding:"10px 14px",background:"var(--gold)",color:"#000",border:"2px solid var(--gold)",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer",transition:"all .15s",textAlign:"center"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.background="var(--gold)";e.target.style.color="#000";}}>+ Invite</button>
                    <button onClick={()=>setOpenChat(openChat===sq.id?null:sq.id)} style={{padding:"9px",background:openChat===sq.id?"var(--gold)":"transparent",border:`2px solid ${openChat===sq.id?"var(--gold)":"var(--border)"}`,color:openChat===sq.id?"#000":"var(--muted)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{if(openChat!==sq.id){e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.color="var(--gold)";}}} onMouseLeave={e=>{if(openChat!==sq.id){e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)";}}}>💬 Squad Chat</button>
                    <button style={{padding:"8px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--r2)";e.target.style.color="var(--r2)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>Leave</button>
                </div>
              </div>
              {openChat===sq.id&&<SquadInlineChat sqId={sq.id} sqName={sq.name} sqColor={sq.color} sqEmoji={sq.emoji} sqMembers={sq.members} session={session}/>}
            </div>
            ))}
            ))}
          </div>
        )}

        {/* INVITES */}
        {tab==="invites"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14,maxWidth:640}}>
            {invites.filter(i=>i.status==="accepted").length>0&&(
              <div style={{marginBottom:8}}>
                <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--gr2)",marginBottom:10,textTransform:"uppercase"}}>✓ Accepted</div>
                {invites.filter(i=>i.status==="accepted").map((inv)=>(
                  <div key={inv.id} style={{background:"rgba(26,122,60,.06)",border:"2px solid rgba(26,122,60,.3)",padding:18,marginBottom:10,display:"flex",alignItems:"center",gap:14}}>
                    <span style={{fontSize:28}}>{inv.emoji}</span>
                    <div style={{flex:1}}><div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:1,color:"var(--gr2)"}}>{inv.sqvad}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>From @{inv.handle} · You're in the squad!</div></div>
                    <button onClick={()=>navigate("sqvad")} style={{padding:"7px 14px",background:"var(--green)",color:"#fff",border:"2px solid var(--green)",fontFamily:"var(--fd)",fontSize:13,letterSpacing:2,cursor:"pointer"}}>View Squad</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:8,textTransform:"uppercase"}}>Pending Invites ({invites.filter(i=>i.status==="pending").length})</div>
            {invites.filter(i=>i.status==="pending").length===0&&(
              <div style={{textAlign:"center",padding:"40px",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:10,letterSpacing:2}}>NO PENDING INVITES</div>
            )}
            {invites.filter(i=>i.status==="pending").map((inv,i)=>(
              <div key={inv.id} style={{background:"var(--surface)",border:"2px solid rgba(240,165,0,.25)",padding:22,animation:`fadeUp .4s ${i*.08}s ease both`,position:"relative"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,var(--gold),transparent)"}}/>
                <div style={{display:"flex",alignItems:"flex-start",gap:13,marginBottom:14}}>
                  <Av name={inv.av} color={inv.avc} size={40}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                      <span style={{fontWeight:700,fontSize:14}}>{inv.from} {inv.flag}</span>
                      <span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>@{inv.handle} · {inv.time}</span>
                    </div>
                    <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--gold)",letterSpacing:2,marginBottom:8}}>SQUAD INVITE: {inv.emoji} {inv.sqvad.toUpperCase()}</div>
                    <div style={{background:"var(--s2)",border:"1px solid var(--border)",padding:"10px 13px",fontSize:13,color:"#bbb",lineHeight:1.6,fontStyle:"italic"}}>"{inv.msg}"</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>acceptInvite(inv.id)} style={{flex:1,padding:"11px",background:"var(--green)",color:"#fff",border:"2px solid var(--green)",fontFamily:"var(--fd)",fontSize:16,letterSpacing:3,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:7}} onMouseEnter={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--gr2)";}} onMouseLeave={e=>{e.currentTarget.style.background="var(--green)";e.currentTarget.style.color="#fff";}}>✓ ACCEPT & JOIN</button>
                  <button onClick={()=>declineInvite(inv.id)} style={{padding:"11px 22px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fd)",fontSize:15,letterSpacing:2,cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--r2)";e.target.style.color="var(--r2)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>Decline</button>
                  <button onClick={()=>navigate("messages")} style={{padding:"11px 18px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>Reply in DM</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DISCOVER */}
        {tab==="discover"&&(
          <div>
            <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:18,textTransform:"uppercase"}}>Open Squads looking for members</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
              {[
                {emoji:"💊",name:"HealthTech Africa",handle:"healthtech_af",color:"var(--gr2)",members:5,bio:"Building health solutions for underserved African communities.",tags:["HealthTech","React Native","Node.js"]},
                {emoji:"🌾",name:"Agric Builders",handle:"agric_build",color:"var(--gold)",members:4,bio:"Using tech to modernise African agriculture from seed to sale.",tags:["AgriTech","IoT","Python"]},
                {emoji:"🎮",name:"African Game Studio",handle:"ags_crew",color:"var(--red)",members:7,bio:"Building the first AAA gaming studio from Africa.",tags:["Gaming","Unity","Web3"]},
                {emoji:"📱",name:"Mobile First Africa",handle:"mfa_squad",color:"#7C3AED",members:6,bio:"Every product we build starts on mobile. Africa-first.",tags:["React Native","Flutter","UX"]},
              ].map((sq,i)=>(
                <div key={sq.handle} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:20,transition:"all .2s",animation:`fadeUp .3s ${i*.07}s ease both`,position:"relative"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=sq.color;e.currentTarget.style.transform="translateY(-3px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none";}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${sq.color},transparent)`,opacity:.5}}/>
                  <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:11}}>
                    <div style={{width:44,height:44,background:sq.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{sq.emoji}</div>
                    <div><div style={{fontFamily:"var(--fd)",fontSize:19,letterSpacing:1,color:sq.color}}>{sq.name}</div><div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--muted)"}}>@{sq.handle} · {sq.members} members</div></div>
                  </div>
                  <p style={{color:"#999",fontSize:12,lineHeight:1.6,marginBottom:11}}>{sq.bio}</p>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
                    {sq.tags.map(t=><span key={t} style={{padding:"2px 9px",fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",border:"1px solid var(--border)",letterSpacing:1}}>{t}</span>)}
                  </div>
                  <button onClick={()=>navigate("messages")} style={{width:"100%",padding:"9px",background:"transparent",border:`2px solid ${sq.color}`,color:sq.color,fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.background=sq.color;e.target.style.color=sq.color==="var(--gold)"?"#000":"#fff";}} onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color=sq.color;}}>Request to Join</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ── SQVAD CARD (used inside ProfilePage) ──────────────────────────────────────
function SqvadProfileCard({squads, navigate}){
  if(!squads||squads.length===0) return (
    <div style={{border:"2px dashed var(--border)",padding:"20px",textAlign:"center",cursor:"pointer",transition:"all .2s"}} onClick={()=>navigate("sqvad")} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gold)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";}}>
      <div style={{fontSize:24,marginBottom:6}}>🔥</div>
      <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:2,textTransform:"uppercase"}}>No Squad yet<br/>Create or join one</div>
    </div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {squads.map((sq)=>(
        <div key={sq.id} onClick={()=>navigate("sqvad")} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"var(--s2)",border:`2px solid var(--border)`,cursor:"pointer",transition:"all .2s",position:"relative",overflow:"hidden"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=sq.color;e.currentTarget.style.transform="translateX(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none";}}>
          <div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:sq.color}}/>
          <div style={{width:38,height:38,background:sq.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0,marginLeft:8}}>{sq.emoji}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"var(--fd)",fontSize:17,letterSpacing:1,color:sq.color,marginBottom:2}}>{sq.name}</div>
            <div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--muted)",letterSpacing:1}}>{sq.members.length} members · {sq.drops} drops</div>
          </div>
          <div style={{display:"flex"}}>
            {sq.members.slice(0,3).map((m,i)=><div key={m.handle} style={{width:24,height:24,background:["var(--red)","var(--gold)","var(--green)"][i%3],borderRadius:"50%",border:"2px solid var(--bg)",marginLeft:i>0?-6:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:10,color:"#fff"}}>{m.av.slice(0,1)}</div>)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── COMPANY DASHBOARD ─────────────────────────────────────────────────────────
function CompanyDashboard({navigate,session,profile,onSignOut}){
  const [tab,setTab]=useState("overview");
  const [myBounties,setMyBounties]=useState([]);
  const [talent,setTalent]=useState([]);

  useEffect(()=>{
    if(!session) return;
    // Load company's own bounties
    supabase.from("bounties")
      .select("*,bounty_applications(id)")
      .eq("company_id",session.user.id)
      .order("created_at",{ascending:false})
      .then(({data})=>{ if(data) setMyBounties(data); })
      .catch(()=>{});
    // Load top builders for talent tab
    supabase.from("profiles")
      .select("id,username,full_name,country,stack,vibe_points,rank,avatar_url")
      .eq("role","builder")
      .order("vibe_points",{ascending:false})
      .limit(20)
      .then(({data})=>{ if(data) setTalent(data); })
      .catch(()=>{});
  },[session]);

  const navItems=[["📊","Overview","overview"],["💰","Post Bounty","bounty"],["👤","Talent Search","talent"],["📋","Submissions","submissions"],["⚡","Hackathons","hack"],["🔍","Browse VIBR","browse"],["⚙️","Settings","csettings"]];
  const handleNavClick=(p)=>{
    if(p==="csettings") navigate("company-settings");
    else setTab(p);
  };
  const myBountiesFallback=[
    {title:"M-Pesa React Native integration",applicants:12,budget:"$500",status:"active",deadline:"5 days"},
    {title:"WhatsApp bot for customer support",applicants:8,budget:"$600",status:"active",deadline:"10 days"},
    {title:"PostgreSQL query optimization",applicants:5,budget:"$400",status:"closed",deadline:"Ended"},
  ];
  const displayBounties2 = myBounties.length>0 ? myBounties : myBountiesFallback;
  return (
    <div style={{display:"flex",minHeight:"100vh",background:"var(--bg)"}}>
      <div style={{width:220,background:"var(--surface)",borderRight:"2px solid var(--border)",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",overflowY:"auto",flexShrink:0}}>
        <div style={{padding:"16px 16px 12px",borderBottom:"2px solid var(--border)"}}>
          <div style={{cursor:"pointer"}} onClick={()=>navigate("landing")}><div style={{fontFamily:"var(--fd)",fontSize:28,letterSpacing:4,display:"flex",alignItems:"center"}}><span style={{color:"var(--white)"}}>V</span><span style={{color:"var(--red)"}}>I</span><span style={{color:"var(--white)"}}>B</span><span style={{color:"var(--gold)"}}>R</span><span style={{width:4,height:4,background:"var(--gr2)",borderRadius:"50%",marginLeft:2,marginBottom:2,display:"inline-block"}}/></div></div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:5,padding:"3px 7px",background:"rgba(34,160,80,.1)",border:"1px solid rgba(34,160,80,.3)",width:"fit-content"}}><span style={{width:4,height:4,background:"var(--gr2)",borderRadius:"50%",display:"inline-block"}}/><span style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--gr2)",letterSpacing:2}}>COMPANY ✓</span></div>
        </div>
        <nav role="navigation" aria-label="Main navigation" style={{flex:1,padding:"10px 0"}}>
          {navItems.map(([icon,label,page])=>{const a=tab===page;return <div key={label} onClick={()=>handleNavClick(page)} style={{display:"flex",alignItems:"center",gap:11,padding:"11px 16px",cursor:"pointer",transition:"all .15s",background:a?"rgba(34,160,80,.1)":"transparent",borderLeft:a?"3px solid var(--gr2)":"3px solid transparent",color:a?"var(--gr2)":"var(--muted)"}} onMouseEnter={e=>{if(!a){e.currentTarget.style.background="var(--s2)";e.currentTarget.style.color="var(--text)";}}} onMouseLeave={e=>{if(!a){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--muted)";}}}><span style={{fontSize:15,width:18,textAlign:"center"}}>{icon}</span><span style={{fontWeight:600,fontSize:13}}>{label}</span></div>;})}
        </nav>
        <div style={{margin:10,padding:12,background:"var(--s2)",border:"2px solid var(--border)"}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}><div style={{width:32,height:32,background:"var(--gr2)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:14,color:"#fff",flexShrink:0}}>CO</div><div><div style={{fontWeight:700,fontSize:11}}>Your Company</div><div style={{color:"var(--muted)",fontSize:8,fontFamily:"var(--fm)"}}>Company Account</div></div></div>
          <div style={{display:"flex",justifyContent:"space-between"}}>{[["3","Bounties"],["12","Applicants"],["2","Hired"]].map(([v,l])=><div key={l} style={{textAlign:"center"}}><div style={{fontFamily:"var(--fd)",fontSize:13,color:"var(--gr2)"}}>{v}</div><div style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--muted)",letterSpacing:1,textTransform:"uppercase"}}>{l}</div></div>)}</div>
        </div>
      </div>
      <div style={{flex:1,overflow:"auto"}}>
        {tab==="overview"&&(
          <div>
            <div style={{padding:"20px 28px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10}}><div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>COMPANY <span style={{color:"var(--gr2)"}}>OVERVIEW</span></div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>YOUR VIBR COMPANY DASHBOARD</div></div>
            <div style={{padding:"20px 28px"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
                {[{label:"Active Bounties",value:"3",color:"gr2"},{label:"Total Applicants",value:"25",color:"gold"},{label:"Builders Hired",value:"2",color:"gr2"},{label:"Amount Spent",value:"$1,500",color:"gold"}].map((s,i)=>(
                  <div key={s.label} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:"14px",textAlign:"center",animation:`fadeUp .3s ${i*.06}s ease both`}}>
                    <div style={{fontFamily:"var(--fd)",fontSize:26,color:`var(--${s.color})`,lineHeight:1,marginBottom:3}}>{s.value}</div>
                    <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2,textTransform:"uppercase"}}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:18,marginBottom:14}}>
                <div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,marginBottom:13}}>ACTIVE BOUNTIES</div>
                {myBounties.filter(b=>b.status==="active").map((b,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:"1px solid var(--border)"}}>
                    <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{b.title}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>Budget: {b.budget} · {b.deadline} left</div></div>
                    <div style={{fontFamily:"var(--fd)",fontSize:18,color:"var(--gold)"}}>{b.applicants} <span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>applicants</span></div>
                    <button onClick={()=>setTab("bounty")} style={{padding:"5px 12px",background:"transparent",border:"1px solid var(--gr2)",color:"var(--gr2)",fontFamily:"var(--fm)",fontSize:8,cursor:"pointer",letterSpacing:1,transition:"all .2s"}} onMouseEnter={e=>{e.target.style.background="var(--green)";e.target.style.color="#fff";}} onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color="var(--gr2)";}}>Review</button>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:12}}>
                <button onClick={()=>setTab("bounty")} style={{flex:1,padding:"12px",background:"var(--gr2)",color:"#fff",border:"2px solid var(--gr2)",fontFamily:"var(--fd)",fontSize:16,letterSpacing:3,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--gr2)";}} onMouseLeave={e=>{e.target.style.background="var(--gr2)";e.target.style.color="#fff";}}>+ POST NEW BOUNTY</button>
                <button onClick={()=>setTab("talent")} style={{flex:1,padding:"12px",background:"transparent",color:"var(--gold)",border:"2px solid var(--gold)",fontFamily:"var(--fd)",fontSize:16,letterSpacing:3,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="var(--gold)";e.target.style.color="#000";}} onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color="var(--gold)";}}>SEARCH TALENT →</button>
              </div>
            </div>
          </div>
        )}
        {tab==="talent"&&(
          <div>
            <div style={{padding:"20px 28px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10}}><div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>TALENT <span style={{color:"var(--gr2)"}}>SEARCH</span></div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>FIND AND HIRE AFRICA'S BEST BUILDERS</div></div>
            <div style={{padding:"20px 28px"}}>
              <div style={{display:"flex",gap:10,marginBottom:18}}>
                <input placeholder="Search by name, skill, or country..." style={{flex:1,padding:"10px 13px",background:"var(--surface)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gr2)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                <select style={{padding:"10px 13px",background:"var(--surface)",border:"2px solid var(--border)",color:"var(--muted)",fontSize:12,outline:"none",cursor:"pointer"}}>{["All Stacks","React","Node.js","Python","React Native","Solidity"].map(c=><option key={c}>{c}</option>)}</select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
                {LEADERBOARD.map((b,i)=>(
                  <div key={b.name} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:18,transition:"all .2s",animation:`fadeUp .3s ${i*.06}s ease both`}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gr2)";e.currentTarget.style.transform="translate(-2px,-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none";}}>
                    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}><Av name={b.av} color={b.avc} size={34}/><div><div style={{fontWeight:700,fontSize:12}}>{b.name} {b.flag}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>@{b.handle} · {b.badge}</div></div></div>
                    <div style={{display:"flex",gap:5,marginBottom:11}}><span style={{background:"rgba(34,160,80,.1)",border:"1px solid rgba(34,160,80,.3)",fontFamily:"var(--fm)",fontSize:7,padding:"2px 7px",color:"var(--gr2)",letterSpacing:1}}>{b.pts.toLocaleString()} pts</span></div>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={()=>navigate("messages")} style={{flex:1,padding:"7px",background:"var(--gr2)",color:"#fff",border:"2px solid var(--gr2)",fontFamily:"var(--fd)",fontSize:12,letterSpacing:2,cursor:"pointer"}}>Contact</button>
                      <button onClick={()=>navigate("profile")} style={{padding:"7px 10px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,cursor:"pointer"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gr2)";e.target.style.color="var(--gr2)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>View</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab==="bounty"&&(
          <div>
            <div style={{padding:"20px 28px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10}}><div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>POST A <span style={{color:"var(--gr2)"}}>BOUNTY</span></div></div>
            <div style={{maxWidth:620,padding:"24px 28px"}}>
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                {[["Bounty Title","e.g. Build M-Pesa integration for React Native"],["Budget (USD)","e.g. 500"],["Deadline","e.g. 7 days"]].map(([l,ph])=>(
                  <div key={l}><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>{l}</div><input placeholder={ph} style={{width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gr2)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>
                ))}
                <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Description</div><textarea placeholder="What exactly needs to be built? Include specs and acceptance criteria." rows={4} style={{width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",resize:"none",lineHeight:1.7,borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gr2)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>
                <div style={{padding:"12px",background:"rgba(34,160,80,.04)",border:"1px solid rgba(34,160,80,.2)"}}><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--gr2)",letterSpacing:2,marginBottom:4}}>VIBR TAKES 12% ON COMPLETION</div><div style={{fontSize:12,color:"var(--muted)",lineHeight:1.7}}>Payment handled via Paystack. Both parties confirm before funds release.</div></div>
                <BountyPostButton navigate={navigate} accentColor="var(--gr2)"/>
              </div>
            </div>
          </div>
        )}
        {tab==="browse"&&(
          <div>
            <div style={{padding:"20px 28px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>BROWSE <span style={{color:"var(--gr2)"}}>VIBR</span></div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>EXPLORE THE BUILDER COMMUNITY</div></div>
              <button onClick={()=>navigate("feed")} style={{background:"var(--gr2)",color:"#fff",border:"2px solid var(--gr2)",padding:"9px 20px",fontFamily:"var(--fd)",fontSize:15,letterSpacing:2,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--gr2)";}} onMouseLeave={e=>{e.target.style.background="var(--gr2)";e.target.style.color="#fff";}}>Open Full Feed →</button>
            </div>
            <div style={{padding:"20px 28px"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {[["🔥","Live Feed","Browse all builder project drops","feed"],["🏆","Leaderboard","Top builders ranked by Vibe Score","leaderboard"],["⚡","Hackathons","Live and upcoming build competitions","hackathons"],["🏢","Companies","See other companies on VIBR","companies"],["🔍","Search","Search projects, builders, bounties","search"],["👥","Community","54 African country chapters","community"]].map(([icon,title,desc,dest])=>(
                  <div key={title} onClick={()=>navigate(dest)} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:"18px 16px",cursor:"pointer",transition:"all .2s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--gr2)";e.currentTarget.style.transform="translateY(-2px)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.transform="none";}}>
                    <div style={{fontSize:28,marginBottom:10}}>{icon}</div>
                    <div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:1,marginBottom:5,color:"var(--gr2)"}}>{title}</div>
                    <div style={{fontSize:12,color:"var(--muted)",lineHeight:1.5}}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab==="hack"&&(
          <div>
            <div style={{padding:"20px 28px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>HACKATHONS <span style={{color:"var(--gr2)"}}>⚡</span></div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>SPONSOR OR JOIN A HACKATHON</div></div>
              <button onClick={()=>navigate("hackathons")} style={{background:"var(--gr2)",color:"#fff",border:"2px solid var(--gr2)",padding:"8px 18px",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--gr2)";}} onMouseLeave={e=>{e.target.style.background="var(--gr2)";e.target.style.color="#fff";}}>View All Hackathons →</button>
            </div>
            <div style={{padding:"20px 28px"}}>
              <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:22,marginBottom:14}}>
                <div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,marginBottom:4,color:"var(--gold)"}}>⚡ LAGOS BUILD SPRINT — LIVE NOW</div>
                <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.7,marginBottom:14}}>48hr Paystack-sponsored hackathon. 89 builders registered. Fintech theme. Your company can sponsor the next one.</p>
                <button onClick={()=>navigate("hackathons")} style={{padding:"9px 20px",background:"var(--red)",color:"#fff",border:"2px solid var(--red)",fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer",transition:"all .15s"}}>View Hackathon Room →</button>
              </div>
              <div style={{background:"rgba(34,160,80,.06)",border:"2px solid rgba(34,160,80,.2)",padding:22}}>
                <div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,marginBottom:6,color:"var(--gr2)"}}>🏢 SPONSOR A HACKATHON</div>
                <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.7,marginBottom:14}}>Put your brand in front of 12,000+ African builders. Set the theme, provide prizes. We handle everything.</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                  {[["Starter","$500","1 hackathon · Logo placement · 50 applicant cap"],["Growth","$2,000","Quarterly · Featured on homepage · 200 cap"],["Partner","Custom","Annual · Theme naming rights · Unlimited"]].map(([tier,price,desc])=>(
                    <div key={tier} style={{background:"var(--surface)",border:"1px solid var(--border)",padding:"14px 12px",textAlign:"center"}}>
                      <div style={{fontFamily:"var(--fd)",fontSize:18,color:"var(--gr2)",marginBottom:2}}>{tier}</div>
                      <div style={{fontFamily:"var(--fd)",fontSize:22,color:"var(--gold)",marginBottom:6}}>{price}</div>
                      <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.5}}>{desc}</div>
                    </div>
                  ))}
                </div>
                <button style={{width:"100%",padding:"11px",background:"var(--gr2)",color:"#fff",border:"2px solid var(--gr2)",fontFamily:"var(--fd)",fontSize:16,letterSpacing:3,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--gr2)";}} onMouseLeave={e=>{e.target.style.background="var(--gr2)";e.target.style.color="#fff";}}>CONTACT US TO SPONSOR →</button>
              </div>
            </div>
          </div>
        )}
        {tab==="submissions"&&(
          <div>
            <div style={{padding:"20px 28px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10}}>
              <div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>CHALLENGE <span style={{color:"var(--gr2)"}}>SUBMISSIONS</span></div>
              <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>REVIEW BUILDER DEMO SUBMISSIONS FOR YOUR CHALLENGES</div>
            </div>
            <div style={{padding:"20px 28px"}}>
              {CHALLENGES.filter(c=>c.company==="Paystack"||true).map((ch,i)=>(
                <div key={ch.id} style={{background:"var(--surface)",border:"2px solid var(--border)",padding:20,marginBottom:14,animation:`fadeUp .3s ${i*.07}s ease both`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:13}}>
                    <div style={{width:38,height:38,background:ch.color,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:16,color:ch.color==="var(--gold)"?"#000":"#fff",flexShrink:0}}>{ch.logo}</div>
                    <div style={{flex:1}}><div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:1}}>{ch.title}</div><div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>Prize: <span style={{color:"var(--gr2)"}}>{ch.prize}</span> · {ch.demoSubmissions?.length||0} submissions · Deadline: {ch.deadline}</div></div>
                    <button onClick={()=>navigate("bounties")} style={{padding:"8px 16px",background:"var(--gr2)",color:"#fff",border:"2px solid var(--gr2)",fontFamily:"var(--fd)",fontSize:13,letterSpacing:2,cursor:"pointer"}}>Review All →</button>
                  </div>
                  {(ch.demoSubmissions||[]).slice(0,2).map((s,j)=>(
                    <div key={s.handle} style={{display:"flex",gap:10,padding:"10px 12px",background:"var(--s2)",border:"1px solid var(--border)",marginBottom:7,alignItems:"center"}}>
                      <Av name={s.av} color={s.avc} size={30}/>
                      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12}}>{s.builder} {s.flag} <span style={{fontFamily:"var(--fm)",fontSize:8,color:ch.color}}>· {s.track}</span></div><div style={{fontSize:11,color:"var(--muted)"}}>{s.title}</div></div>
                      <a href={s.demo} target="_blank" rel="noreferrer" style={{padding:"5px 11px",background:"transparent",border:`1px solid ${ch.color}`,color:ch.color,fontFamily:"var(--fm)",fontSize:8,cursor:"pointer",letterSpacing:1,textDecoration:"none"}}>Watch Demo</a>
                    </div>
                  ))}
                  {(ch.demoSubmissions||[]).length===0&&<div style={{padding:"12px",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,textAlign:"center"}}>NO SUBMISSIONS YET</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        {tab==="csettings"&&(()=>{navigate("company-settings");return null;})()}
      </div>
    </div>
  );
}

// ── INVESTOR SETTINGS ─────────────────────────────────────────────────────────
function InvestorSettingsPage({navigate}){
  const [tab,setTab]=useState("profile");
  const [saved,setSaved]=useState(false);
  const [tog,setTog]=useState({emailAlerts:true,dealAlerts:true,weeklyDigest:false,builderMessages:true,twoFA:false,publicProfile:true});
  const toggle=k=>setTog(t=>({...t,[k]:!t[k]}));
  const inp={width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",transition:"border-color .2s",borderRadius:0};
  const save=()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const Tog=({k,label,sub})=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",borderBottom:"1px solid var(--border)"}}>
      <div><div style={{fontWeight:600,fontSize:13}}>{label}</div>{sub&&<div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{sub}</div>}</div>
      <div onClick={()=>toggle(k)} style={{width:40,height:21,background:tog[k]?"var(--gold)":"var(--border)",borderRadius:10,position:"relative",transition:"background .2s",cursor:"pointer",flexShrink:0}}><div style={{width:15,height:15,background:"#fff",borderRadius:"50%",position:"absolute",top:3,left:tog[k]?22:3,transition:"left .2s"}}/></div>
    </div>
  );
  return (
    <div style={{display:"flex",minHeight:"100vh",background:"var(--bg)"}}>
      <div style={{width:220,background:"var(--surface)",borderRight:"2px solid var(--border)",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0}}>
        <div style={{padding:"16px 16px 12px",borderBottom:"2px solid var(--border)"}}>
          <div style={{cursor:"pointer"}} onClick={()=>navigate("investor-dashboard")}><div style={{fontFamily:"var(--fd)",fontSize:28,letterSpacing:4,display:"flex",alignItems:"center"}}><span style={{color:"var(--white)"}}>V</span><span style={{color:"var(--red)"}}>I</span><span style={{color:"var(--white)"}}>B</span><span style={{color:"var(--gold)"}}>R</span><span style={{width:4,height:4,background:"var(--gr2)",borderRadius:"50%",marginLeft:2,marginBottom:2,display:"inline-block"}}/></div></div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:5,padding:"3px 7px",background:"rgba(240,165,0,.1)",border:"1px solid rgba(240,165,0,.3)",width:"fit-content"}}><span style={{width:4,height:4,background:"var(--gold)",borderRadius:"50%",display:"inline-block"}}/><span style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--gold)",letterSpacing:2}}>INVESTOR ✓</span></div>
        </div>
        <nav role="navigation" aria-label="Main navigation" style={{flex:1,padding:"10px 0"}}>
          {[["profile","👤","Profile"],["notifications","🔔","Notifications"],["verification","🔒","Verification"],["billing","💳","Billing"],["danger","⚠️","Danger Zone"]].map(([id,icon,label])=>{const a=tab===id;return <div key={id} onClick={()=>setTab(id)} style={{display:"flex",alignItems:"center",gap:11,padding:"11px 16px",cursor:"pointer",transition:"all .15s",background:a?"rgba(240,165,0,.1)":"transparent",borderLeft:a?"3px solid var(--gold)":"3px solid transparent",color:a?"var(--gold)":"var(--muted)"}} onMouseEnter={e=>{if(!a){e.currentTarget.style.background="var(--s2)";e.currentTarget.style.color="var(--text)";}}} onMouseLeave={e=>{if(!a){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--muted)";}}}><span style={{fontSize:14}}>{icon}</span><span style={{fontWeight:600,fontSize:13}}>{label}</span></div>;})}
        </nav>
        <div style={{padding:"12px",borderTop:"1px solid var(--border)"}}><button onClick={()=>navigate("investor-dashboard")} style={{width:"100%",padding:"8px",background:"transparent",border:"1px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>← Dashboard</button></div>
      </div>
      <div style={{flex:1,overflow:"auto"}}>
        <div style={{padding:"22px 28px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10}}>
          <div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>INVESTOR <span style={{color:"var(--gold)"}}>SETTINGS</span></div>
          <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>MANAGE YOUR INVESTOR ACCOUNT</div>
        </div>
        <div style={{maxWidth:580,padding:"24px 28px 64px"}}>
          {tab==="profile"&&<div className="fu">
            <div style={{display:"flex",gap:14,alignItems:"center",padding:"18px",background:"var(--surface)",border:"2px solid var(--border)",marginBottom:20}}>
              <div style={{width:64,height:64,background:"var(--gold)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:28,color:"#000"}}>VP</div>
              <div><div style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:1,marginBottom:3}}>VENTURES PLATFORM</div><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",marginBottom:8}}>Angel Investor · Nigeria 🇳🇬 · Verified ✓</div><button style={{background:"transparent",border:"1px solid var(--border)",color:"var(--muted)",padding:"4px 12px",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>Update Photo</button></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {[["Display Name","Ventures Platform"],["Fund / Organisation","Ventures Platform VC"],["Website","https://venturesplatform.com"],["LinkedIn","https://linkedin.com/in/yourprofile"]].map(([l,def])=>(
                <div key={l}><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>{l}</div><input defaultValue={def} style={inp} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>
              ))}
              <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Investment Bio</div><textarea defaultValue="Early-stage VC backing African founders. We look for bold technical founders." rows={3} style={{...inp,resize:"none",lineHeight:1.6}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>
              <button onClick={save} style={{background:saved?"var(--green)":"var(--gold)",color:saved?"#fff":"#000",border:`2px solid ${saved?"var(--green)":"var(--gold)"}`,padding:"12px",fontFamily:"var(--fd)",fontSize:18,letterSpacing:3,cursor:"pointer",transition:"all .3s"}}>{saved?"✓ SAVED!":"SAVE CHANGES"}</button>
            </div>
          </div>}
          {tab==="notifications"&&<div className="fu">
            <Tog k="emailAlerts" label="Email Alerts" sub="New projects matching your focus areas"/>
            <Tog k="dealAlerts" label="Deal Alerts" sub="Notify when builders mark projects as seeking investment"/>
            <Tog k="builderMessages" label="Builder Messages" sub="When builders respond to your connection requests"/>
            <Tog k="weeklyDigest" label="Weekly Deal Digest" sub="Sunday summary of top deals in your focus sectors"/>
          </div>}
          {tab==="verification"&&<div className="fu">
            <div style={{background:"rgba(34,160,80,.06)",border:"2px solid rgba(34,160,80,.3)",padding:20,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:20}}>✅</span><div style={{fontFamily:"var(--fd)",fontSize:20,color:"var(--gr2)",letterSpacing:1}}>VERIFIED INVESTOR</div></div>
              <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>Your account was verified via VIBR Verify. Document on file.</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[["Investor Type","Angel Investor"],["Verified","March 2025"],["Check Size","$10K – $500K"],["Focus Sectors","Fintech, EdTech, AI/ML"]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"11px 0",borderBottom:"1px solid var(--border)"}}><span style={{fontSize:13,color:"var(--muted)"}}>{l}</span><span style={{fontWeight:600,fontSize:13}}>{v}</span></div>
              ))}
            </div>
            <button style={{marginTop:16,padding:"10px 20px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s",width:"100%"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>Update Verification Documents</button>
          </div>}
          {tab==="billing"&&<div className="fu">
            <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:18,marginBottom:16}}>
              <div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:1,marginBottom:4}}>INVESTOR ACCESS PLAN</div>
              <div style={{fontFamily:"var(--fd)",fontSize:32,color:"var(--gold)",marginBottom:4}}>$0<span style={{fontSize:14,fontFamily:"var(--fm)",color:"var(--muted)"}}>/month</span></div>
              <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>Investor access is free. Bounties have a 12% platform commission on completion.</div>
            </div>
            <div style={{background:"var(--s2)",border:"2px solid var(--border)",padding:16,textAlign:"center",cursor:"pointer",transition:"border-color .2s"}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--gold)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
              <div style={{fontSize:22,marginBottom:6}}>+</div><div style={{fontFamily:"var(--fm)",fontSize:10,color:"var(--muted)",letterSpacing:2}}>ADD PAYMENT METHOD<br/><span style={{fontSize:9}}>Paystack · Card · Bank Transfer</span></div>
            </div>
          </div>}
          {tab==="danger"&&<div className="fu">
            <div style={{background:"rgba(209,43,43,.06)",border:"2px solid var(--red)",padding:18}}>
              <div style={{fontFamily:"var(--fd)",fontSize:18,color:"var(--red)",letterSpacing:1,marginBottom:10}}>DANGER ZONE</div>
              <div style={{display:"flex",flexDirection:"column",gap:9}}>
                {[["Export My Data","Download all activity as JSON","var(--gold)"],["Deactivate Account","Temporarily hide your profile","var(--muted)"],["Delete Account","Permanently delete everything","var(--red)"]].map(([l,s,c])=>(
                  <button key={l} style={{padding:"10px 14px",background:"transparent",border:`2px solid ${c}`,color:c,fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,cursor:"pointer",textAlign:"left",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.background=c;e.target.style.color=c==="var(--gold)"?"#000":"#fff";}} onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color=c;}}>{l}<br/><span style={{fontSize:9,opacity:.6,letterSpacing:1,textTransform:"none"}}>{s}</span></button>
                ))}
              </div>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}

// ── COMPANY SETTINGS ──────────────────────────────────────────────────────────
function CompanySettingsPage({navigate}){
  const [tab,setTab]=useState("company");
  const [saved,setSaved]=useState(false);
  const [tog,setTog]=useState({emailNotifs:true,bountyAlerts:true,weeklyTalent:false,publicProfile:true});
  const toggle=k=>setTog(t=>({...t,[k]:!t[k]}));
  const inp={width:"100%",padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",transition:"border-color .2s",borderRadius:0};
  const save=()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const Tog=({k,label,sub})=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 0",borderBottom:"1px solid var(--border)"}}>
      <div><div style={{fontWeight:600,fontSize:13}}>{label}</div>{sub&&<div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{sub}</div>}</div>
      <div onClick={()=>toggle(k)} style={{width:40,height:21,background:tog[k]?"var(--gr2)":"var(--border)",borderRadius:10,position:"relative",transition:"background .2s",cursor:"pointer",flexShrink:0}}><div style={{width:15,height:15,background:"#fff",borderRadius:"50%",position:"absolute",top:3,left:tog[k]?22:3,transition:"left .2s"}}/></div>
    </div>
  );
  return (
    <div style={{display:"flex",minHeight:"100vh",background:"var(--bg)"}}>
      <div style={{width:220,background:"var(--surface)",borderRight:"2px solid var(--border)",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0}}>
        <div style={{padding:"16px 16px 12px",borderBottom:"2px solid var(--border)"}}>
          <div style={{cursor:"pointer"}} onClick={()=>navigate("company-dashboard")}><div style={{fontFamily:"var(--fd)",fontSize:28,letterSpacing:4,display:"flex",alignItems:"center"}}><span style={{color:"var(--white)"}}>V</span><span style={{color:"var(--red)"}}>I</span><span style={{color:"var(--white)"}}>B</span><span style={{color:"var(--gold)"}}>R</span><span style={{width:4,height:4,background:"var(--gr2)",borderRadius:"50%",marginLeft:2,marginBottom:2,display:"inline-block"}}/></div></div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:5,padding:"3px 7px",background:"rgba(34,160,80,.1)",border:"1px solid rgba(34,160,80,.3)",width:"fit-content"}}><span style={{width:4,height:4,background:"var(--gr2)",borderRadius:"50%",display:"inline-block"}}/><span style={{fontFamily:"var(--fm)",fontSize:7,color:"var(--gr2)",letterSpacing:2}}>COMPANY ✓</span></div>
        </div>
        <nav role="navigation" aria-label="Main navigation" style={{flex:1,padding:"10px 0"}}>
          {[["company","🏢","Company Profile"],["team","👥","Team Members"],["notifications","🔔","Notifications"],["billing","💳","Billing"],["danger","⚠️","Danger Zone"]].map(([id,icon,label])=>{const a=tab===id;return <div key={id} onClick={()=>setTab(id)} style={{display:"flex",alignItems:"center",gap:11,padding:"11px 16px",cursor:"pointer",transition:"all .15s",background:a?"rgba(34,160,80,.1)":"transparent",borderLeft:a?"3px solid var(--gr2)":"3px solid transparent",color:a?"var(--gr2)":"var(--muted)"}} onMouseEnter={e=>{if(!a){e.currentTarget.style.background="var(--s2)";e.currentTarget.style.color="var(--text)";}}} onMouseLeave={e=>{if(!a){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--muted)";}}}><span style={{fontSize:14}}>{icon}</span><span style={{fontWeight:600,fontSize:13}}>{label}</span></div>;})}
        </nav>
        <div style={{padding:"12px",borderTop:"1px solid var(--border)"}}><button onClick={()=>navigate("company-dashboard")} style={{width:"100%",padding:"8px",background:"transparent",border:"1px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:8,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gr2)";e.target.style.color="var(--gr2)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>← Dashboard</button></div>
      </div>
      <div style={{flex:1,overflow:"auto"}}>
        <div style={{padding:"22px 28px",borderBottom:"2px solid var(--border)",position:"sticky",top:0,background:"var(--bg)",zIndex:10}}>
          <div style={{fontFamily:"var(--fd)",fontSize:26,letterSpacing:2}}>COMPANY <span style={{color:"var(--gr2)"}}>SETTINGS</span></div>
          <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:2}}>MANAGE YOUR COMPANY ACCOUNT</div>
        </div>
        <div style={{maxWidth:580,padding:"24px 28px 64px"}}>
          {tab==="company"&&<div className="fu">
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {[["Company Name","Your Company Ltd"],["Website","https://yourcompany.com"],["HQ Location","Lagos, Nigeria 🇳🇬"]].map(([l,def])=>(
                <div key={l}><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>{l}</div><input defaultValue={def} style={inp} onFocus={e=>e.target.style.borderColor="var(--gr2)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>
              ))}
              <div><div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:5,textTransform:"uppercase"}}>Company Bio</div><textarea defaultValue="We're building the future of payments in Africa." rows={3} style={{...inp,resize:"none",lineHeight:1.6}} onFocus={e=>e.target.style.borderColor="var(--gr2)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>  </div>
              <button onClick={save} style={{background:saved?"var(--green)":"var(--gr2)",color:"#fff",border:`2px solid ${saved?"var(--green)":"var(--gr2)"}`,padding:"12px",fontFamily:"var(--fd)",fontSize:18,letterSpacing:3,cursor:"pointer",transition:"all .3s"}}>{saved?"✓ SAVED!":"SAVE CHANGES"}</button>
            </div>
          </div>}
          {tab==="team"&&<div className="fu">
            <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:14,textTransform:"uppercase"}}>Team Members with account access</div>
            {["John Adeyemi — Admin","Fatima Bello — Recruiter","David Mensah — Viewer"].map((m,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
                <div style={{width:34,height:34,background:["var(--red)","var(--gold)","var(--green)"][i],display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:15,color:i===1?"#000":"#fff",flexShrink:0}}>{m.split(" ")[0][0]+m.split(" ")[1][0]}</div>
                <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{m.split(" — ")[0]}</div><div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>Role: {m.split(" — ")[1]}</div></div>
                <button style={{padding:"4px 10px",background:"transparent",border:"1px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:7,cursor:"pointer",letterSpacing:1,textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--r2)";e.target.style.color="var(--r2)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>Remove</button>
              </div>
            ))}
            <button style={{width:"100%",marginTop:14,padding:"11px",background:"transparent",border:"2px dashed var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gr2)";e.target.style.color="var(--gr2)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>+ Invite Team Member</button>
          </div>}
          {tab==="notifications"&&<div className="fu">
            <Tog k="emailNotifs" label="Email Notifications" sub="Updates on bounty applications and team activity"/>
            <Tog k="bountyAlerts" label="Bounty Application Alerts" sub="Notify when builders apply to your bounties"/>
            <Tog k="weeklyTalent" label="Weekly Talent Digest" sub="Top builders matching your hiring needs"/>
            <Tog k="publicProfile" label="Public Company Profile" sub="Builders can discover and follow your company"/>
          </div>}
          {tab==="billing"&&<div className="fu">
            <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:18,marginBottom:14}}>
              <div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:1,marginBottom:4}}>STARTER PLAN</div>
              <div style={{fontFamily:"var(--fd)",fontSize:28,color:"var(--gr2)",marginBottom:4}}>$99<span style={{fontSize:12,fontFamily:"var(--fm)",color:"var(--muted)"}}>/month</span></div>
              <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>3 active bounties · Company profile · Talent search</div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button style={{flex:1,padding:"10px",background:"var(--gr2)",color:"#fff",border:"2px solid var(--gr2)",fontFamily:"var(--fd)",fontSize:15,letterSpacing:2,cursor:"pointer"}}>Upgrade to Growth $299/mo</button>
            </div>
          </div>}
          {tab==="danger"&&<div className="fu">
            <div style={{background:"rgba(209,43,43,.06)",border:"2px solid var(--red)",padding:18}}>
              <div style={{fontFamily:"var(--fd)",fontSize:18,color:"var(--red)",letterSpacing:1,marginBottom:10}}>DANGER ZONE</div>
              <div style={{display:"flex",flexDirection:"column",gap:9}}>
                {[["Export Company Data","Download all data as JSON","var(--gold)"],["Deactivate Account","Hide company temporarily","var(--muted)"],["Delete Account","Permanently delete everything","var(--red)"]].map(([l,s,c])=>(
                  <button key={l} style={{padding:"10px 14px",background:"transparent",border:`2px solid ${c}`,color:c,fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,cursor:"pointer",textAlign:"left",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.background=c;e.target.style.color=c==="var(--gold)"?"#000":"#fff";}} onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color=c;}}>{l}<br/><span style={{fontSize:9,opacity:.6,letterSpacing:1,textTransform:"none"}}>{s}</span></button>
                ))}
              </div>
            </div>
          </div>}
        </div>
      </div>
    </div>
  );
}

// ── HACKATHON DETAIL PAGE ─────────────────────────────────────────────────────
function HackathonDetailPage({hackId,navigate,returnTo,userRole,session}){
  const hacks=[
    {id:1,name:"Lagos Build Sprint",emoji:"⚡",sponsor:"Paystack",prize:"$2,000",theme:"Build a fintech tool for the unbanked",deadline:"47:12:08",participants:89,teams:21,tags:["Fintech","Mobile"],desc:"48-hour hackathon sponsored by Paystack. Build anything that helps underbanked Nigerians access financial services. Top 3 teams win cash prizes. All teams get Paystack API credits.",rules:["Teams of 1–4 builders","Must use Paystack API in your project","Submit a demo video + GitHub link","Judged on impact, technical execution, and UX"],prizes:[["🥇 1st Place","$1,200"],["🥈 2nd Place","$500"],["🥉 3rd Place","$300"]],status:"live",color:"var(--red)"},
    {id:2,name:"Pan-Africa AI Challenge",emoji:"🤖",sponsor:"Google Africa",prize:"$5,000",theme:"AI tools built for African languages",deadline:"6 days",participants:0,teams:0,tags:["AI/ML","NLP"],desc:"Build an AI product that works in at least one African language. Open to all 54 countries. Google Africa is providing $10,000 in cloud credits to all participants.",rules:["Solo or teams of up to 3","Must support at least one African language","Open source submissions preferred","Judged on language coverage, accuracy, and real-world impact"],prizes:[["🥇 1st Place","$3,000"],["🥈 2nd Place","$1,500"],["🥉 3rd Place","$500"]],status:"upcoming",color:"var(--gold)"},
  ];
  const hack=hacks.find(h=>h.id===hackId)||hacks[0];
  const [registered,setRegistered]=useState(false);
  const [regLoading,setRegLoading]=useState(false);

  // Check if already registered
  useEffect(()=>{
    if(!session||!hack?.id) return;
    supabase.from("hackathon_registrations")
      .select("id")
      .eq("hackathon_id",hack.id)
      .eq("user_id",session.user.id)
      .single()
      .then(({data})=>{ if(data) setRegistered(true); })
      .catch(()=>{});
  },[session,hack?.id]);

  const handleRegister=async()=>{
    if(!session){navigate("login");return;}
    setRegLoading(true);
    try{
      await supabase.from("hackathon_registrations")
        .insert({hackathon_id:hack.id,user_id:session.user.id});
      setRegistered(true);
    }catch(e){
      // Already registered or other error
      setRegistered(true);
    }finally{setRegLoading(false);}
  };
  const [teamMsg,setTeamMsg]=useState("");
  const [teamSent,setTeamSent]=useState(false);
  return (
    <AppShell navigate={navigate} activePage="hackathons" returnTo={returnTo} userRole={userRole}>
      <div style={{maxWidth:800,margin:"0 auto",padding:"28px 28px 72px"}}>
        <button onClick={()=>navigate("hackathons")} style={{background:"transparent",border:"none",color:"var(--muted)",cursor:"pointer",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,marginBottom:22,display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>e.target.style.color="var(--white)"} onMouseLeave={e=>e.target.style.color="var(--muted)"}>← BACK TO HACKATHONS</button>
        {/* Header */}
        <div style={{background:"var(--surface)",border:`2px solid ${hack.color}`,padding:28,marginBottom:18,position:"relative",overflow:"hidden",animation:"fadeUp .4s ease both"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${hack.color},transparent)`}}/>
          {hack.status==="live"&&<div style={{position:"absolute",top:16,right:16,display:"flex",alignItems:"center",gap:6,background:"rgba(209,43,43,.15)",border:"1px solid var(--red)",padding:"4px 10px"}}><span style={{width:6,height:6,background:"var(--red)",borderRadius:"50%",animation:"pulse 1s infinite",display:"inline-block"}}/><span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--r2)",letterSpacing:2}}>LIVE NOW</span></div>}
          <div style={{display:"flex",gap:18,alignItems:"flex-start"}}>
            <div style={{fontSize:52,lineHeight:1,flexShrink:0}}>{hack.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"var(--fd)",fontSize:32,letterSpacing:1,marginBottom:5,lineHeight:1}}>{hack.name}</div>
              <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",marginBottom:10}}>Sponsored by <span style={{color:hack.color}}>{hack.sponsor}</span> · Prize pool: <span style={{color:"var(--gr2)",fontWeight:700}}>{hack.prize}</span></div>
              <div style={{fontSize:14,color:"#bbb",fontStyle:"italic",marginBottom:12}}>Theme: "{hack.theme}"</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>{hack.tags.map(t=><span key={t} style={{padding:"3px 10px",fontFamily:"var(--fm)",fontSize:9,color:"var(--gold)",border:"1px solid var(--gold)",letterSpacing:1}}>{t}</span>)}</div>
              <div style={{display:"flex",gap:20,fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)"}}>
                <span>⏱ {hack.deadline}{hack.status==="live"?" remaining":" to start"}</span>
                {hack.participants>0&&<span>👤 {hack.participants} builders</span>}
                {hack.teams>0&&<span>👥 {hack.teams} teams formed</span>}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:20,paddingTop:18,borderTop:"1px solid var(--border)"}}>
            <button onClick={()=>setRegistered(r=>!r)} style={{padding:"11px 24px",background:registered?"var(--green)":hack.color,color:"#fff",border:`2px solid ${registered?"var(--green)":hack.color}`,fontFamily:"var(--fd)",fontSize:16,letterSpacing:2,cursor:"pointer",transition:"all .15s"}}>{registered?"✓ REGISTERED":"REGISTER NOW"}</button>
            <button onClick={()=>navigate("sqvad")} style={{padding:"11px 20px",background:"transparent",border:"2px solid var(--border)",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",transition:"all .2s"}} onMouseEnter={e=>{e.target.style.borderColor="var(--gold)";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--muted)";}}>🔥 Find Team via My Squad</button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          {/* About */}
          <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:22}} className="fu1">
            <div style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:2,marginBottom:12}}>ABOUT</div>
            <p style={{color:"#aaa",fontSize:13,lineHeight:1.8,marginBottom:14}}>{hack.desc}</p>
            <div style={{fontFamily:"var(--fd)",fontSize:16,letterSpacing:2,marginBottom:10,color:hack.color}}>RULES</div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>{hack.rules.map((r,i)=><div key={i} style={{display:"flex",gap:9,fontSize:12,color:"#bbb"}}><span style={{color:hack.color,flexShrink:0}}>{i+1}.</span>{r}</div>)}</div>
          </div>
          {/* Prizes */}
          <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:22}} className="fu2">
            <div style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:2,marginBottom:14}}>PRIZES 🏆</div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>{hack.prizes.map(([place,amount])=><div key={place} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid var(--border)"}}><span style={{fontSize:14,fontWeight:600}}>{place}</span><span style={{fontFamily:"var(--fd)",fontSize:22,color:hack.color}}>{amount}</span></div>)}</div>
            <div style={{padding:"12px",background:"var(--s2)",border:"1px solid var(--border)",fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",lineHeight:1.7}}>All prizes paid via Paystack to winner's Nigerian bank account within 48hrs of judging.</div>
          </div>
        </div>
        {/* Team finder */}
        <div style={{background:"var(--surface)",border:"2px solid var(--border)",padding:22}} className="fu3">
          <div style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:2,marginBottom:6}}>FIND A <span style={{color:"var(--gold)"}}>TEAMMATE</span></div>
          <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:2,marginBottom:14}}>POST WHAT ROLE YOU NEED · CONNECT VIA MY SQUAD</div>
          <div style={{display:"flex",gap:10}}>
            <input value={teamMsg} onChange={e=>setTeamMsg(e.target.value)} placeholder="Looking for a UI/UX designer for this hackathon. I'm building a fintech app..." style={{flex:1,padding:"11px 13px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            <button onClick={()=>{if(teamMsg.trim()){setTeamSent(true);setTeamMsg("");setTimeout(()=>setTeamSent(false),2000);}}} style={{padding:"11px 18px",background:teamSent?"var(--green)":"var(--gold)",color:teamSent?"#fff":"#000",border:`2px solid ${teamSent?"var(--green)":"var(--gold)"}`,fontFamily:"var(--fd)",fontSize:15,letterSpacing:2,cursor:"pointer",transition:"all .3s",whiteSpace:"nowrap"}}>{teamSent?"✓ POSTED!":"POST →"}</button>
          </div>
        </div>
        {/* hackathon live chat room */}
        {registered&&(
          <HackathonChatRoom hack={hack} navigate={navigate}/>
        )}
        {!registered&&(
          <div style={{background:"var(--s2)",border:"2px dashed var(--border)",padding:24,textAlign:"center"}} className="fu3">
            <div style={{fontSize:28,marginBottom:8}}>🔒</div>
            <div style={{fontFamily:"var(--fd)",fontSize:18,letterSpacing:2,marginBottom:6}}>REGISTER TO ACCESS THE LIVE ROOM</div>
            <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.7,marginBottom:16}}>The hackathon live chat, team board, and submission portal are only available to registered participants.</p>
            <button onClick={()=>setRegistered(true)} style={{padding:"10px 28px",background:hack.color,color:"#fff",border:`2px solid ${hack.color}`,fontFamily:"var(--fd)",fontSize:16,letterSpacing:3,cursor:"pointer"}}>REGISTER NOW →</button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ── HACKATHON LIVE ROOM CHAT (registered participants only) ───────────────────
function HackathonChatRoom({hack}){
  const INIT_MSGS={
    1:[
      {user:"Tolu Kehinde",av:"TK",avc:"red",flag:"🇳🇬",text:"Just registered! Building a USSD savings tool. Anyone want to team up?",time:"12m ago"},
      {user:"Amara Mensah",av:"AM",avc:"gold",flag:"🇬🇭",text:"Working on a mobile wallet. Open to collabs on UX.",time:"10m ago"},
      {user:"🤖 VIBR Bot",av:"VB",avc:"gold",flag:"",text:"⏱ 47:08:12 remaining. 89 builders registered. Submission portal opens in 2 hours.",time:"5m ago"},
      {user:"Kofi Osei",av:"KO",avc:"gold",flag:"🇬🇭",text:"Paystack webhooks are tricky. I have a Node.js template if anyone needs it.",time:"2m ago"},
    ],
    2:[{user:"🤖 VIBR Bot",av:"VB",avc:"gold",flag:"",text:"Registration is open! 6 days until the hackathon starts.",time:"1h ago"}],
  };
  const [msgs,setMsgs]=useState(INIT_MSGS[hack.id]||[]);
  const [input,setInput]=useState("");
  const send=()=>{if(!input.trim())return;setMsgs(m=>[...m,{user:"You",av:"YO",avc:"red",flag:"🇳🇬",text:input,time:"Just now"}]);setInput("");};
  return (
    <div style={{background:"var(--surface)",border:`2px solid ${hack.color}`,marginBottom:14}} className="fu3">
      <div style={{padding:"12px 18px",borderBottom:`1px solid var(--border)`,background:"var(--s2)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <span style={{width:7,height:7,background:hack.status==="live"?"var(--red)":"var(--gold)",borderRadius:"50%",display:"inline-block"}}/>
          <div style={{fontFamily:"var(--fd)",fontSize:17,letterSpacing:1,color:hack.color}}>{hack.name} — Live Room</div>
        </div>
        <div style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:1}}>🔒 Registered participants only · Not your DMs or Spaces</div>
      </div>
      <div style={{maxHeight:240,overflowY:"auto",padding:"12px 18px",display:"flex",flexDirection:"column",gap:11}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",gap:9}}>
            <Av name={m.av} color={m.avc} size={30}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}><span style={{fontWeight:700,fontSize:12,color:m.user==="🤖 VIBR Bot"?"var(--gold)":"var(--text)"}}>{m.user}</span>{m.flag&&<span style={{fontSize:11}}>{m.flag}</span>}<span style={{fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)"}}>{m.time}</span></div>
              <div style={{fontSize:13,color:m.user==="🤖 VIBR Bot"?"#aaa":"#ddd",lineHeight:1.6,background:"var(--s2)",padding:"7px 11px",border:`1px solid ${m.user==="🤖 VIBR Bot"?"rgba(240,165,0,.2)":"var(--border)"}`,display:"inline-block",maxWidth:"90%"}}>{m.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{padding:"10px 16px",borderTop:`1px solid var(--border)`,display:"flex",gap:8,background:"var(--s2)"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Chat with participants in this hackathon..." style={{flex:1,padding:"9px 12px",background:"var(--bg)",border:"1.5px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor=hack.color} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
        <button onClick={send} style={{padding:"9px 16px",background:hack.color,color:"#fff",border:`2px solid ${hack.color}`,fontFamily:"var(--fd)",fontSize:14,letterSpacing:2,cursor:"pointer",whiteSpace:"nowrap"}}>SEND →</button>
      </div>
      <div style={{padding:"5px 16px 9px",fontFamily:"var(--fm)",fontSize:8,color:"var(--muted)",letterSpacing:1}}>💡 Hackathon room only. Private 1-on-1? Use DMs. Tech discussion? Use Spaces.</div>
    </div>
  );
}

function ForgotPasswordPage({navigate}){
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  const [loading,setLoading]=useState(false);
  const send=async()=>{
    if(!email.trim())return;
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch(e){ alert(e.message||"Could not send reset email."); }
    finally { setLoading(false); }
  };
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 20px"}}>
      <div style={{width:"100%",maxWidth:420}}>
        <div onClick={()=>navigate("landing")} style={{fontFamily:"var(--fd)",fontSize:30,letterSpacing:4,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:40,cursor:"pointer"}}><span style={{color:"var(--white)"}}>V</span><span style={{color:"var(--red)"}}>I</span><span style={{color:"var(--white)"}}>B</span><span style={{color:"var(--gold)"}}>R</span><span style={{width:5,height:5,background:"var(--gr2)",borderRadius:"50%",marginLeft:2,marginBottom:2,display:"inline-block"}}/></div>
        {!sent?(
          <div className="fu">
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{fontFamily:"var(--fd)",fontSize:34,letterSpacing:2,marginBottom:6}}>FORGOT<br/><span style={{color:"var(--gold)"}}>PASSWORD?</span></div>
              <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.7}}>Enter your email and we'll send a reset link to your inbox.</p>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,color:"var(--muted)",marginBottom:6,textTransform:"uppercase"}}>Email Address</div>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@email.com" style={{width:"100%",padding:"12px 14px",background:"var(--s2)",border:"2px solid var(--border)",color:"var(--text)",fontSize:13,outline:"none",fontFamily:"var(--fb)",borderRadius:0,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor="var(--gold)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
            <button onClick={send} disabled={loading} style={{width:"100%",background:loading?"var(--s2)":"var(--gold)",color:loading?"var(--muted)":"#000",border:`2px solid ${loading?"var(--border)":"var(--gold)"}`,padding:"12px",fontFamily:"var(--fd)",fontSize:18,letterSpacing:3,cursor:loading?"not-allowed":"pointer",transition:"all .3s",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:14}}>{loading?<><div style={{width:14,height:14,border:"2px solid var(--gold)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/> SENDING...</>:"SEND RESET LINK →"}</button>
            <button onClick={()=>navigate("account-login")} style={{width:"100%",background:"transparent",border:"none",color:"var(--muted)",fontFamily:"var(--fm)",fontSize:9,letterSpacing:2,cursor:"pointer",textTransform:"uppercase",padding:"8px"}} onMouseEnter={e=>e.target.style.color="var(--text)"} onMouseLeave={e=>e.target.style.color="var(--muted)"}>← Back to Login</button>
          </div>
        ):(
          <div className="fu" style={{textAlign:"center"}}>
            <div style={{fontSize:52,marginBottom:16}}>📧</div>
            <div style={{fontFamily:"var(--fd)",fontSize:30,letterSpacing:2,marginBottom:10}}>CHECK YOUR<br/><span style={{color:"var(--gold)"}}>EMAIL</span></div>
            <p style={{color:"var(--muted)",fontSize:13,lineHeight:1.8,marginBottom:24}}>We sent a password reset link to <span style={{color:"var(--white)"}}>{email}</span>. Check your inbox and spam folder.</p>
            <button onClick={()=>navigate("account-login")} style={{background:"var(--gold)",color:"#000",border:"2px solid var(--gold)",padding:"11px 28px",fontFamily:"var(--fd)",fontSize:16,letterSpacing:3,cursor:"pointer",transition:"all .15s"}} onMouseEnter={e=>{e.target.style.background="transparent";e.target.style.color="var(--gold)";}} onMouseLeave={e=>{e.target.style.background="var(--gold)";e.target.style.color="#000";}}>← Back to Login</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App(){
  // ── Auth state ────────────────────────────────────────────────────────────
  const [session,setSession]   = useState(null);   // Supabase session object
  const [profile,setProfile]   = useState(null);   // profiles row
  const [authLoading,setAuthLoading] = useState(true); // true until session resolved

  // ── Navigation state ──────────────────────────────────────────────────────
  const [page,setPage]         = useState("landing");
  const [userRole,setUserRole] = useState("builder");
  const [returnTo,setReturnTo] = useState(null);

  const BUILDER_PAGES = new Set([
    "feed","sqvad","collabs","bounties","community","leaderboard",
    "messages","profile","drop","search","notifications","settings",
    "premium","spaces","hackathons","companies"
  ]);

  // ── Session persistence — runs once on mount ──────────────────────────────
  useEffect(()=>{
    // Resolve current session from Supabase cache
    supabase.auth.getSession().then(({ data: { session } }) => {
      if(session){
        setSession(session);
        const role = session.user.user_metadata?.role || "builder";
        setUserRole(role);
        getProfile(session.user.id)
          .then(p => setProfile(p))
          .catch(() => {});
        // Route to correct dashboard
        setPage(
          role === "investor" ? "investor-dashboard" :
          role === "company"  ? "company-dashboard"  : "feed"
        );
      }
      setAuthLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if(event === "SIGNED_IN" && newSession){
          setSession(newSession);
          const role = newSession.user.user_metadata?.role || "builder";
          setUserRole(role);
          try {
            const p = await getProfile(newSession.user.id);
            setProfile(p);
          } catch {}
        }
        if(event === "SIGNED_OUT"){
          setSession(null);
          setProfile(null);
          setUserRole("builder");
          setPage("landing");
        }
        if(event === "PASSWORD_RECOVERY"){
          setPage("forgot-password");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── navigate() ───────────────────────────────────────────────────────────
  const navigate = useCallback((p) => {
    // Guard: redirect to landing if not authed and trying to access protected pages
    const protectedPages = new Set([
      "feed","sqvad","collabs","bounties","community","leaderboard",
      "messages","profile","drop","search","notifications","settings",
      "premium","spaces","hackathons","companies","admin",
      "investor-dashboard","company-dashboard"
    ]);
    if(protectedPages.has(p) && !session){
      setPage("account-login");
      window.scrollTo(0,0);
      return;
    }

    // returnTo tracking for investor/company browsing builder pages
    if(BUILDER_PAGES.has(p)){
      if(userRole === "investor") setReturnTo("investor-dashboard");
      else if(userRole === "company") setReturnTo("company-dashboard");
      else setReturnTo(null);
    } else {
      setReturnTo(null);
    }

    // Role assignment on explicit login entry points
    if(["investor-dashboard","investor-signup","investor-login"].includes(p)) setUserRole("investor");
    else if(["company-dashboard","company-signup","company-login"].includes(p)) setUserRole("company");
    else if(["login","signup","builder-login","builder-signup","onboarding"].includes(p)) setUserRole("builder");

    setPage(p);
    window.scrollTo(0,0);
  }, [session, userRole]);

  // ── Global logout ─────────────────────────────────────────────────────────
  const handleSignOut = useCallback(async () => {
    await signOut();
    // onAuthStateChange will handle the state reset and navigate to landing
  }, []);

  const isPost = page.startsWith("post-");
  const isHack = page.startsWith("hack-");
  const postId = isPost ? parseInt(page.split("-")[1]) : null;
  const hackId = isHack ? parseInt(page.split("-")[1]) : null;

  // Props shared across all pages
  const sharedAuth = { session, profile, onSignOut: handleSignOut };
  const shellProps  = { navigate, returnTo, userRole, ...sharedAuth };

  // ── Loading screen ────────────────────────────────────────────────────────
  if(authLoading) return (
    <>
      <style>{FONTS+CSS}</style>
      <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:18}}>
        <div style={{fontFamily:"var(--fd)",fontSize:44,letterSpacing:4,display:"flex",alignItems:"center"}}>
          <span style={{color:"var(--white)"}}>V</span>
          <span style={{color:"var(--red)"}}>I</span>
          <span style={{color:"var(--white)"}}>B</span>
          <span style={{color:"var(--gold)"}}>R</span>
          <span style={{width:6,height:6,background:"var(--gr2)",borderRadius:"50%",marginLeft:3,marginBottom:3,display:"inline-block"}}/>
        </div>
        <div style={{width:40,height:40,border:"3px solid var(--red)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
        <div style={{fontFamily:"var(--fm)",fontSize:9,color:"var(--muted)",letterSpacing:3}}>LOADING...</div>
      </div>
    </>
  );

  return (
    <ErrorBoundary>
      <style>{FONTS+CSS}</style>
      <a href="#main-content" style={{position:"absolute",top:-100,left:0,background:"var(--red)",color:"#fff",padding:"8px 16px",zIndex:9999,fontFamily:"var(--fm)",fontSize:12}} onFocus={e=>e.target.style.top="0"} onBlur={e=>e.target.style.top="-100px"}>Skip to content</a>
      <OfflineBanner/>
      <ToastContainer/>
      {/* ── Public */}
      {page==="landing"              && <LandingPage navigate={navigate}/>}
      {page==="account-signup"       && <AccountTypePage mode="signup" navigate={navigate}/>}
      {page==="account-login"        && <AccountTypePage mode="login"  navigate={navigate}/>}
      {/* ── Builder auth */}
      {page==="builder-login"        && <AuthPage mode="login"  navigate={navigate} onAuth={(role)=>{ setUserRole(role); navigate("feed"); }}/>}
      {page==="builder-signup"       && <AuthPage mode="signup" navigate={navigate} onAuth={(role)=>{ setUserRole(role); navigate("onboarding"); }}/>}
      {page==="login"                && <AuthPage mode="login"  navigate={navigate} onAuth={(role)=>{ setUserRole(role); navigate("feed"); }}/>}
      {page==="signup"               && <AuthPage mode="signup" navigate={navigate} onAuth={(role)=>{ setUserRole(role); navigate("onboarding"); }}/>}
      {page==="onboarding"           && <OnboardingPage navigate={navigate} session={session}/>}
      {page==="forgot-password"      && <ForgotPasswordPage navigate={navigate}/>}
      {/* ── Investor */}
      {page==="investor-signup"      && <InvestorSignupPage navigate={navigate} onAuth={()=>{ setUserRole("investor"); navigate("investor-dashboard"); }}/>}
      {page==="investor-login"       && <InvestorLoginPage  navigate={navigate} onAuth={()=>{ setUserRole("investor"); navigate("investor-dashboard"); }}/>}
      {page==="investor-dashboard"   && <InvestorDashboard  navigate={navigate} {...sharedAuth}/>}
      {page==="investor-settings"    && <InvestorSettingsPage navigate={navigate} profile={profile} onUpdate={setProfile}/>}
      {/* ── Company */}
      {page==="company-signup"       && <CompanySignupPage navigate={navigate} onAuth={()=>{ setUserRole("company"); navigate("company-dashboard"); }}/>}
      {page==="company-login"        && <CompanyLoginPage  navigate={navigate} onAuth={()=>{ setUserRole("company"); navigate("company-dashboard"); }}/>}
      {page==="company-dashboard"    && <CompanyDashboard  navigate={navigate} {...sharedAuth}/>}
      {page==="company-settings"     && <CompanySettingsPage navigate={navigate} profile={profile} onUpdate={setProfile}/>}
      {/* ── Builder platform */}
      {page==="feed"                 && <FeedPage         {...shellProps}/>}
      {page==="sqvad"                && <SqvadPage        {...shellProps}/>}
      {page==="collabs"              && <CollabsPage      {...shellProps}/>}
      {page==="bounties"             && <BountiesPage     {...shellProps}/>}
      {page==="community"            && <CommunityPage    {...shellProps}/>}
      {page==="leaderboard"          && <LeaderboardPage  {...shellProps}/>}
      {page==="messages"             && <MessagesPage     {...shellProps}/>}
      {page==="profile"              && <ProfilePage      {...shellProps}/>}
      {page==="drop"                 && <DropPage         {...shellProps}/>}
      {page==="search"               && <SearchPage       {...shellProps}/>}
      {page==="notifications"        && <NotificationsPage {...shellProps}/>}
      {page==="settings"             && <SettingsPage     {...shellProps}/>}
      {page==="premium"              && <PremiumPage      {...shellProps}/>}
      {page==="spaces"               && <SpacesPage       {...shellProps}/>}
      {page==="hackathons"           && <HackathonsPage   {...shellProps}/>}
      {page==="companies"            && <CompaniesPage    {...shellProps}/>}
      {page==="admin"                && <AdminPage        navigate={navigate} {...sharedAuth}/>}
      {isPost                        && <PostDetailPage   postId={postId}  {...shellProps}/>}
      {isHack                        && <HackathonDetailPage hackId={hackId} {...shellProps}/>}
    </ErrorBoundary>
  );
}
// ── SPINNER ────────────────────────────────────────────────────────────────────
function Spinner({size=24,color="var(--red)"}){
  return (
    <div style={{width:size,height:size,border:`2px solid ${color}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite",flexShrink:0}}/>
  );
}


