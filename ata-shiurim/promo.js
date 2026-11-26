/* "הקול החמישי" promotions for the Kiryat Ata pages (/ata-shiurim/, /ata-tfilot/) – user request 24.11.2026.
   Source of truth: C:\Users\User\ata-shiurim\promo.js (copied to both site folders). Self-contained: injects its own CSS.
   Places: a ribbon at the very top, a rotating strip above the search, a wide card after every 2nd section, a tile grid before the signature. */
(function(){
var K = "https://www.kol-toda.co.il";
var ADS = [
  {ic:"🎮", c:"#E8337A", c2:"#F7795A", t:"חידונים ומשחקים תורניים לילדים",
   d:"מאות חידונים ומשחקים בפרשת השבוע, הלכה, מידות טובות ותנ״ך – עם תמונות, כוכבים ותעודות. הילדים פשוט לא רוצים להפסיק!",
   l:[["למשחקים ולחידונים", K+"/mischakim/"],["משחקי פרשת השבוע", K+"/parasha-games/"]]},
  {ic:"✨", c:"#E08A00", c2:"#F5C842", t:"פניני פרשת השבוע",
   d:"חידות ומבדקים על הפרשה בכל שבוע, לפי כיתות, עם טבלת אלופים לכיתה – שהילדים מחכים לה כל השבוע.",
   l:[["לפניני הפרשה", K+"/pninei/"],["חומרים לפרשת השבוע", K+"/t/parasha.html"]]},
  {ic:"📜", c:"#1A6FA8", c2:"#2EB5D8", t:"כל המשניות וכל הש״ס",
   d:"קטלוג משנה לכיתות א׳–ו׳, קטלוג גמרא, וש״ס במשחק – לימוד שהילדים נהנים ממנו באמת.",
   l:[["משנה", K+"/mishna/"],["גמרא", K+"/gemara/"],["ש״ס במשחק", K+"/shas-games/"]]},
  {ic:"⚖️", c:"#0E8F83", c2:"#3CC49C", t:"כל ההלכות – בחידונים ובקטלוג",
   d:"חידוני הלכה על שבת, תפילה, ברכות, חגים ועוד, וקטלוג הלכה מלא לבית הספר היסודי.",
   l:[["חידוני הלכה", K+"/halacha-quiz/"],["קטלוג הלכה", K+"/halacha/"]]},
  {ic:"🤖", c:"#6D4BC4", c2:"#A274F0", t:"הבוטים החדשים ביותר למורים",
   d:"בוטים חכמים בבינה מלאכותית: שואלים שאלה בתורה ומקבלים תשובה עם מקורות, כלים אוטומטיים למורה, ועוד.",
   l:[["הבוט של הקול החמישי", K+"/bot2/"],["כל הכלים האוטומטיים", K+"/t/auto.html"]]},
  {ic:"🧰", c:"#2B8F3A", c2:"#7CC242", t:"ארגז הכלים למורה ודפי הדרכה",
   d:"מערכי שיעור, דפי הדרכה, מצגות ואוסף למורה בהמון נושאים – מוכנים להדפסה ולכיתה.",
   l:[["ארגז הכלים למורה", K+"/teacher-tools/"],["אוסף למורה", K+"/osef-lamore/"]]}
];
var TILES = [
  ["🎮","משחקים וחידונים",K+"/mischakim/"],["✨","פניני הפרשה",K+"/pninei/"],["📖","פרשת השבוע",K+"/t/parasha.html"],
  ["📜","משנה",K+"/mishna/"],["📚","גמרא",K+"/gemara/"],["🎲","ש״ס במשחק",K+"/shas-games/"],
  ["⚖️","חידוני הלכה",K+"/halacha-quiz/"],["🏫","קטלוג הלכה",K+"/halacha/"],["🤖","בוטים למורים",K+"/t/auto.html"],
  ["🧰","ארגז כלים למורה",K+"/teacher-tools/"],["🌱","מידות טובות",K+"/midot/"],["🖼️","סדרו את התמונות",K+"/seder/"],
  ["👑","גדולי ישראל",K+"/gedolim/"],["🎉","חגים ומועדים",K+"/chagim/"],["🙏","תפילה",K+"/tefila/"],["📕","ספרים",
  "https://sfarim.kol-toda.co.il/"]
];
// top navigation between the Kiryat Ata pages (user request 25.11.2026): תורה · עבודה · גמילות חסדים + home.
// Hides while scrolling down, comes back on scroll up; the sticky search bar (.bar) moves below it.
var NAV = [
  ["", [["🏠 דף ראשי","/ata/"]]],
  ["תורה", [["📖 שיעורי תורה","/ata-shiurim/"]]],
  ["עבודה", [["🕍 זמני תפילות","/ata-tfilot/"],["🏛️ בתי כנסת","/ata-knesset/"]]],
  ["גמילות חסדים", [["🤝 גמ״חים","/ata-gmachim/"],["💼 עסקים","/ata-asakim/"]]],
  ["עוד", [["ℹ️ מידעאתא","/ata-meida/"],["🥾 טיולים","/ata-tiyulim/"],["📜 תולדות העיר","/ata-toldot/"],["📷 תמונות","/ata-tmunot/"]]]
];
var css = ""
+".kp-nav{position:sticky;top:0;z-index:60;background:#0D2A3E;box-shadow:0 2px 10px rgba(0,0,0,.18);transition:transform .25s;font-family:Heebo,Arial,sans-serif;direction:rtl}"
+".kp-nav.kp-hide{transform:translateY(-110%)}"
+".kp-nav .in{display:flex;align-items:center;gap:6px;overflow-x:auto;white-space:nowrap;padding:6px 10px;max-width:1100px;margin:0 auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}"
+".kp-nav .in::-webkit-scrollbar{display:none}"
+".kp-nav .gp{display:flex;align-items:center;gap:4px;flex:none;padding:0 4px}"
+".kp-nav .gp+.gp{border-right:1px solid rgba(255,255,255,.18);padding-right:9px}"
+".kp-nav .lb{color:#F5C842;font-size:12.5px;font-weight:800}"
+".kp-nav a{color:#fff;text-decoration:none;font-size:14.5px;font-weight:700;padding:5px 11px;border-radius:999px;background:rgba(255,255,255,.1)}"
+".kp-nav a:hover{background:rgba(255,255,255,.22)}"
+".kp-nav a.on{background:#F5C842;color:#0D2A3E}"
+".bar{top:var(--kpn,0px)!important;transition:top .25s}"
+".kp-rib{background:#0D2A3E;color:#fff;text-align:center;font:600 14px Heebo,Arial,sans-serif;padding:7px 12px}"
+".kp-rib a{color:#F5C842;font-weight:800;text-decoration:none}"
+".kp-strip{display:flex;align-items:center;gap:12px;margin:0 0 14px;padding:12px 16px;border-radius:16px;color:#fff;text-decoration:none;"
+"background:linear-gradient(110deg,var(--a),var(--b));box-shadow:0 6px 18px color-mix(in srgb,var(--a) 35%,transparent);transition:background .6s}"
+".kp-strip .e{font-size:30px;flex:none;animation:kpb 2.4s ease-in-out infinite}"
+".kp-strip .x{flex:1;min-width:0}.kp-strip b{display:block;font-size:17px}.kp-strip span{font-size:14px;opacity:.95}"
+".kp-strip .go{flex:none;background:#fff;color:var(--a);border-radius:999px;padding:6px 14px;font-weight:800;font-size:14px;white-space:nowrap}"
+"@keyframes kpb{0%,100%{transform:scale(1)}50%{transform:scale(1.15) rotate(-6deg)}}"
+".kp-mid{position:relative;overflow:hidden;margin:0 0 24px;border-radius:22px;padding:22px 22px 20px;color:#fff;"
+"background:radial-gradient(circle at 12% 120%,rgba(255,255,255,.22) 0 110px,transparent 111px),linear-gradient(125deg,var(--a),var(--b));box-shadow:0 10px 26px color-mix(in srgb,var(--a) 30%,transparent)}"
+".kp-mid .tag{display:inline-block;background:rgba(255,255,255,.22);border-radius:999px;padding:2px 11px;font-size:12.5px;font-weight:700;margin-bottom:6px}"
+".kp-mid .big{position:absolute;left:18px;top:50%;transform:translateY(-50%);font-size:76px;opacity:.9;filter:drop-shadow(0 4px 10px rgba(0,0,0,.2))}"
+".kp-mid h3{margin:0 0 6px;font:900 clamp(21px,3.6vw,27px) 'Frank Ruhl Libre',serif}"
+".kp-mid p{margin:0 0 12px;font-size:15.5px;line-height:1.55;max-width:640px;padding-left:96px}"
+".kp-mid .ls{display:flex;flex-wrap:wrap;gap:8px}"
+".kp-mid .ls a{background:#fff;color:var(--a);text-decoration:none;font-weight:800;border-radius:12px;padding:8px 15px;font-size:15px;box-shadow:0 3px 8px rgba(0,0,0,.12)}"
+".kp-mid .ls a:hover{transform:translateY(-1px)}"
+".kp-grid{margin:30px 0 8px;background:#fff;border-radius:24px;padding:22px 18px 20px;box-shadow:0 6px 22px rgba(30,30,60,.08);border:2px solid #F5C842;text-align:center}"
+".kp-grid h3{margin:0 0 4px;font:900 clamp(22px,4vw,30px) 'Frank Ruhl Libre',serif;color:#0D2A3E}"
+".kp-grid .s{margin:0 0 16px;color:#46586b;font-size:15.5px}"
+".kp-grid .g{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}"
+".kp-grid .g a{display:flex;flex-direction:column;align-items:center;gap:4px;text-decoration:none;color:#0D2A3E;font-weight:700;font-size:14.5px;"
+"background:linear-gradient(160deg,#FFF8E1,#EAF4FB);border-radius:16px;padding:14px 8px;border:1px solid #eee3c4;transition:.15s}"
+".kp-grid .g a i{font-style:normal;font-size:30px}"
+".kp-grid .g a:hover{transform:translateY(-3px);box-shadow:0 8px 18px rgba(0,0,0,.1)}"
+".kp-grid .home{display:inline-block;margin-top:16px;background:linear-gradient(110deg,#E8337A,#6D4BC4);color:#fff;text-decoration:none;font-weight:800;font-size:17px;border-radius:14px;padding:12px 26px}"
+".kp-sis{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:18px 0 0}.kp-sis a{background:#fff;border:1.5px solid #e6e2d8;border-radius:999px;padding:7px 15px;text-decoration:none;color:#152536;font-weight:700;font-size:15px}"
+"body.kp-search .kp-mid{display:none}"
+"@media (max-width:560px){.kp-mid{padding:18px 14px}.kp-mid .big{font-size:46px;top:18px;transform:none}.kp-mid p{padding-left:0}.kp-mid h3{padding-left:52px}.kp-strip .go{display:none}.kp-grid .g{grid-template-columns:repeat(3,1fr)}.kp-grid .g a{font-size:13px;padding:10px 4px}}";
function el(t,c,x){ var e=document.createElement(t); if(c) e.className=c; if(x!=null) e.textContent=x; return e; }

// ---- the Kiryat Ata app (PWA, user 25.11.2026: "older people asked for an app on the phone's home screen") ----
// manifest /ata/manifest.json + service worker /ata/sw.js; a gold "📲 התקנה" button in the top bar and on every
// [data-kp-install] element opens the browser's install prompt, or simple steps for iPhone / Android / computer.
var APPI="https://yudataub.github.io/kol-toda-img-4/ata/app/", deferred=null;
var STANDALONE=(window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true;
window.addEventListener("beforeinstallprompt",function(e){ e.preventDefault(); deferred=e; });
window.addEventListener("appinstalled",function(){ setTimeout(function(){ try{ clog("app_installed",{}); }catch(e){} },0); deferred=null; document.documentElement.classList.add("kp-app"); });
function appHead(){
  var h=document.head;
  function add(tag,at){ var x=document.createElement(tag); for(var k in at) x.setAttribute(k,at[k]); h.appendChild(x); }
  if(!h.querySelector('link[rel="manifest"]')) add("link",{rel:"manifest",href:"/ata/manifest.json"});
  if(!h.querySelector('link[rel="apple-touch-icon"]')) add("link",{rel:"apple-touch-icon",href:APPI+"apple-180.png"});
  if(!h.querySelector('meta[name="theme-color"]')) add("meta",{name:"theme-color",content:"#0D2A3E"});
  add("meta",{name:"apple-mobile-web-app-capable",content:"yes"});
  add("meta",{name:"mobile-web-app-capable",content:"yes"});
  add("meta",{name:"apple-mobile-web-app-title",content:"קרית אתא"});
  if(STANDALONE) document.documentElement.classList.add("kp-app");
  if("serviceWorker" in navigator) navigator.serviceWorker.register("/ata/sw.js",{scope:"/ata/"}).catch(function(){});
}
appHead();
if(/[?&]src=app/.test(location.search)) setTimeout(function(){ clog(STANDALONE?"app_open_standalone":"app_open_in_browser",{}); },0);
function howTo(){
  var ua=navigator.userAgent, ios=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&"ontouchend" in document),
      andr=/Android/.test(ua), sam=/SamsungBrowser/.test(ua);
  var st;
  if(ios) st=[["1","לפתוח את הדף בדפדפן <b>ספארי</b> (המצפן הכחול)."],["2","ללחוץ על כפתור <b>השיתוף</b> – ריבוע עם חץ למעלה ⬆️, בתחתית המסך."],["3","לגלול מעט ולבחור <b>\"הוספה למסך הבית\"</b> ➕."],["4","ללחוץ <b>\"הוסף\"</b> למעלה – והאייקון של קרית אתא מופיע במסך הבית."]];
  else if(sam) st=[["1","ללחוץ על <b>☰</b> (שלושה קווים) בתחתית המסך."],["2","לבחור <b>\"הוסף דף אל\"</b>."],["3","לבחור <b>\"מסך הבית\"</b> ואז <b>\"הוסף\"</b>."]];
  else if(andr) st=[["1","ללחוץ על <b>⋮</b> (שלוש נקודות) בפינה העליונה של כרום."],["2","לבחור <b>\"הוספה למסך הבית\"</b> (או <b>\"התקנת אפליקציה\"</b>)."],["3","אם שואלים \"התקנה\" או \"יצירת קיצור דרך\" – לבחור <b>\"התקנה\"</b>. קיצור דרך נפתח בדפדפן ולא כאפליקציה."],["4","ללחוץ שוב <b>\"התקנה\"</b> – והאייקון של קרית אתא מופיע במסך הבית."]];
  else st=[["1","בכרום או באדג': ללחוץ על סמל ההתקנה <b>⊕</b> בצד שורת הכתובת למעלה."],["2","או: <b>⋮</b> / <b>…</b> ← \"שמירה ושיתוף\" / \"אפליקציות\" ← <b>\"התקנת הדף כאפליקציה\"</b>."],["3","ללחוץ <b>\"התקנה\"</b> – ונוצר אייקון בשולחן העבודה ובתפריט התחל."]];
  var bg=el("div","kp-modal"), box=el("div","box");
  box.innerHTML='<img src="'+APPI+'icon-192.png" alt="" width="84" height="84"><h3>📲 התקנת האפליקציה של קרית אתא</h3>'
   +'<p class="s">אחרי ההתקנה יש אייקון במסך הבית – לחיצה אחת וכל המידע פתוח: תפילות, בתי כנסת, שיעורים, גמ"חים ועסקים.</p><ol></ol>'
   +'<button type="button" class="ok">הבנתי</button>';
  var ol=box.querySelector("ol"); st.forEach(function(x){ var li=document.createElement("li"); li.innerHTML=x[1]; ol.appendChild(li); });
  // Android/computer: when the browser offers a direct install, a big button does it in one tap (and the steps become a fallback)
  var go=el("button","go","📲 התקנה עכשיו – לחיצה אחת"); go.type="button"; go.style.display="none";
  go.onclick=function(){ if(deferred){ clog("install_click",{extra:"prompt (modal)"}); deferred.prompt(); deferred.userChoice.then(function(c){ clog("install_choice",{extra:c&&c.outcome}); deferred=null; bg.remove(); }); } };
  box.insertBefore(go, ol);
  // Chrome on Android offers the install only after the visitor spent a little time on the page – keep waiting while open
  var hint=el("p","s","⏳ עוד כמה שניות יופיע כאן כפתור התקנה ישיר. אפשר גם לפי השלבים:");
  if(andr && !deferred) box.insertBefore(hint, ol);
  (function wait(){ if(!document.body.contains(bg)) return; if(deferred){ go.style.display="block"; ol.style.display="none"; hint.remove(); return; } setTimeout(wait,300); })();
  bg.appendChild(box); document.body.appendChild(bg);
  bg.addEventListener("click",function(e){ if(e.target===bg||e.target.className==="ok") bg.remove(); });
}
if(/[?&]install=1/.test(location.search) && !STANDALONE){
  var openIt=function(){ setTimeout(function(){ howTo(); },600); };
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",openIt); else openIt();
}
function install(){
  clog("install_click",{extra:(deferred?"prompt":"steps")+" "+(window.matchMedia?matchMedia("(display-mode: browser)").matches:"")});
  if(deferred){ deferred.prompt(); deferred.userChoice.then(function(c){ clog("install_choice",{extra:c&&c.outcome}); deferred=null; }); return; }
  howTo();
}
css+=".kp-nav a.kp-inst{background:#F5C842;color:#0D2A3E;cursor:pointer}"
+".kp-nav a.kp-back{background:rgba(255,255,255,.22)}"
+".kp-app .kp-nav a.kp-inst,.kp-app [data-kp-install-box]{display:none!important}"
+".kp-modal{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;direction:rtl;font-family:Heebo,Arial,sans-serif}"
+".kp-modal .box{background:#fff;color:#0D2A3E;border-radius:22px;max-width:460px;width:100%;max-height:92vh;overflow:auto;padding:22px 20px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.4)}"
+".kp-modal img{border-radius:20px}.kp-modal h3{font-size:23px;margin:10px 0 6px}.kp-modal .s{font-size:17px;color:#355;margin:0 0 12px;line-height:1.5}"
+".kp-modal ol{text-align:right;font-size:19px;line-height:1.6;padding-right:24px;margin:0 0 16px}.kp-modal li{margin:0 0 8px}"
+".kp-modal .go{display:block;width:100%;font:800 21px Heebo,Arial,sans-serif;background:#F5C842;color:#0D2A3E;border:0;border-radius:16px;padding:16px;margin:0 0 14px;cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.18)}"
+".kp-modal .ok{font:800 20px Heebo,Arial,sans-serif;background:#1A6FA8;color:#fff;border:0;border-radius:14px;padding:12px 40px;cursor:pointer}";

// ---- the AI window: failure log + voice (user 25.11.2026: "people tried to add info and failed – keep every attempt,
// Enter = new line, and let them speak instead of typing") ----
var ATA_API="https://kol-ata.kol-bot.workers.dev/ata";
var BOARDS={"/ata-shiurim/":"shiurim","/ata-tfilot/":"tfilot","/ata-gmachim/":"gmachim","/ata-asakim/":"asakim","/ata-meida/":"meida"};
var MYBOARD=BOARDS[location.pathname.replace(/index\.html$/,"")]||"";
var LSID=(function(){ var x=""; for(var i=0;i<16;i++) x+="abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random()*36)]; return x; })(), lastSid=LSID;
function clog(stage, o){
  o=o||{}; var body=JSON.stringify({board:MYBOARD, sid:o.sid||lastSid, stage:stage, err:String(o.err||"").slice(0,300), status:o.status||0,
    text:String(o.text||"").slice(0,1500), page:location.pathname, ua:navigator.userAgent, online:navigator.onLine, extra:String(o.extra||"").slice(0,600)});
  try{ if(o.beacon && navigator.sendBeacon){ navigator.sendBeacon(ATA_API+"/clog", body); return; } }catch(e){}
  try{ _fetch(ATA_API+"/clog",{method:"POST",headers:{"Content-Type":"text/plain"},body:body,keepalive:true}).catch(function(){}); }catch(e){}
}
// every call of the page to /chat or /save that fails (no network, no answer, an error) is logged with what was written
var _fetch=window.fetch.bind(window);
if(MYBOARD) window.fetch=function(u, opt){
  var url=String(u&&u.url||u), m=url.indexOf(ATA_API)===0 && /\/(chat|save)$/.exec(url);
  if(!m) return _fetch(u, opt);
  // a fixed visitor id (this browser), so the bot remembers earlier conversations and additions (user 25.11.2026)
  var vid=""; try{ vid=localStorage.getItem("ata_vid")||""; if(!/^[a-z0-9]{8,40}$/.test(vid)){ vid="v"+LSID+Math.random().toString(36).slice(2,8); localStorage.setItem("ata_vid",vid); } }catch(e){ vid=""; }
  try{ var bb=JSON.parse(opt&&opt.body||"{}"); if(vid){ bb.vid=vid; opt=Object.assign({},opt,{body:JSON.stringify(bb)}); } }catch(e){}
  var info={}; try{ var b=JSON.parse(opt&&opt.body||"{}"); info.sid=b.sid; lastSid=b.sid||lastSid;
    var us=(b.msgs||[]).filter(function(x){return x.r==="u";}); info.text=us.length?us[us.length-1].t:""; info.extra=b.by||b.byc?"name/phone given":""; }catch(e){}
  var t0=Date.now();
  return _fetch(u, opt).then(function(r){
    if(!r.ok) r.clone().text().then(function(x){ info.status=r.status; info.err=x.slice(0,200); clog(m[1]+"_http",info); });
    else if(Date.now()-t0>20000){ info.err="slow "+Math.round((Date.now()-t0)/1000)+"s"; clog(m[1]+"_slow",info); }
    return r;
  },function(e){ info.err=String(e&&e.message||e); clog(m[1]+"_net",info); throw e; });
};
function chatBox(){
  var inp=document.getElementById("inp"), send=document.getElementById("send"), chat=document.getElementById("chat");
  if(!inp||!send||inp.tagName!=="TEXTAREA") return;
  // leaving the page with text that was never sent, or with an approval card not pressed → logged (sendBeacon)
  window.addEventListener("pagehide",function(){
    var c=chat&&chat.querySelector(".confirm");
    if(c) clog("left_unsaved",{beacon:1, text:c.textContent.slice(0,600)});
    else if(inp.value.trim()) clog("left_unsent",{beacon:1, text:inp.value});
  });
  // the voice button
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  var mic=el("button","btn kp-mic","🎤 דיבור"); mic.type="button"; mic.title="לחצו ודברו – הדיבור נכתב בתיבה";
  var tip=el("div","kp-mtip"); tip.style.display="none";
  send.parentNode.insertBefore(mic, send);
  send.parentNode.parentNode.insertBefore(tip, send.parentNode.nextSibling);
  function say(t,bad){ tip.textContent=t; tip.className="kp-mtip"+(bad?" bad":""); tip.style.display=t?"block":"none"; }
  var rec=null, on=false, base="", acc="", sess="", andr=/Android/i.test(navigator.userAgent), started=0;
  // (26.11.2026) Android repeats words: each result holds the whole phrase so far → keep the longest, never append twice;
  // and remove a word/phrase said twice in a row ("שלום שלום שלום" → "שלום")
  function dedup(t){ var w=t.split(/\s+/).filter(Boolean), ch=true;
    while(ch){ ch=false; for(var n=Math.min(8,Math.floor(w.length/2));n>=1;n--){ for(var i=0;i+2*n<=w.length;i++){
      if(w.slice(i,i+n).join(" ")===w.slice(i+n,i+2*n).join(" ")){ w.splice(i+n,n); ch=true; break; } } if(ch) break; } }
    return w.join(" "); }
  function merge(a,b){ a=a.trim(); b=b.trim(); if(!a) return b; if(!b) return a;
    if(b.indexOf(a)===0) return b; if(a.indexOf(b)>=0) return a; return a+" "+b; }
  var ios=/iPhone|iPad|iPod/i.test(navigator.userAgent), IOSMSG="באייפון ההקלטה הישירה לא זמינה כאן. לוחצים בתוך התיבה, ואז על סמל המיקרופון 🎤 במקלדת (למטה), ומדברים – הדיבור ייכתב בתיבה. (אם אין מיקרופון במקלדת: הגדרות ← כללי ← מקלדת ← הפעלת הכתבה.)";
  function paint(interim){ if(!on && interim) return; var said=dedup(merge(merge(acc,sess),interim||""));
    var a=(base&&said?base+" ":base)+said; inp.value=a.replace(/\s+/g," ").trimStart(); }
  function stop(msg){ if(rec){ rec.onresult=null; rec.onend=null; rec.onerror=null; } acc=merge(acc,sess); sess=""; paint(""); on=false;
    mic.classList.remove("on"); mic.textContent="🎤 דיבור"; try{ rec&&rec.abort(); }catch(e){}
    say(msg!=null?msg:(inp.value.trim()?"✔️ זה מה שנכתב. אפשר לתקן בתיבה, להמשיך לדבר, ואז ללחוץ \"שליחה\".":"")); }
  function start(){
    rec=new SR(); rec.lang="he-IL"; rec.interimResults=true; rec.continuous=!andr; rec.maxAlternatives=1;
    rec.onresult=function(e){ if(!on) return; var fin="", mid="";
      // read ALL results of this session every time (not from resultIndex), merging cumulative ones
      for(var i=0;i<e.results.length;i++){ var r=e.results[i], t=r[0].transcript; if(r.isFinal) fin=merge(fin,t); else mid=merge(mid,t); }
      sess=merge(sess,fin); paint(mid); };
    rec.onerror=function(e){ var er=e.error||"err";
      if(er==="no-speech"||er==="aborted") return;
      // iPhone: service-not-allowed = dictation (Siri) is off or the home-screen app may not record (log 25.11.2026) → point to the keyboard mic, and go straight there next time
      if(ios && er==="service-not-allowed"){ try{ localStorage.setItem("ata_nosr","1"); }catch(x){} clog("voice_error",{err:er}); stop(IOSMSG); inp.focus(); return; }
      var m=er==="not-allowed"||er==="service-not-allowed"?"הדפדפן לא קיבל רשות למיקרופון. לוחצים על המנעול 🔒 ליד הכתובת ומאשרים מיקרופון – או מקלידים, או לוחצים על המיקרופון 🎤 שבמקלדת של הטלפון.":
            er==="network"?"אין חיבור לשירות התמלול. נסו שוב, או לחצו על המיקרופון 🎤 שבמקלדת של הטלפון.":"ההקלטה נעצרה ("+er+"). נסו שוב.";
      clog("voice_error",{err:er}); stop(m); };
    rec.onend=function(){ acc=merge(acc,sess); sess=""; if(on && Date.now()-started<180000){ try{ rec.start(); return; }catch(e){} } if(on) stop(); };
    try{ rec.start(); }catch(e){ clog("voice_error",{err:"start: "+e.message}); stop("לא הצלחתי להתחיל להקליט. נסו שוב."); }
  }
  mic.onclick=function(){
    if(!SR){ clog("voice_unsupported",{}); say("בדפדפן הזה אין הקלטה ישירה. אפשר ללחוץ על סמל המיקרופון 🎤 במקלדת של הטלפון ולדבר – הדיבור ייכתב בתיבה.",true); inp.focus(); return; }
    var nosr=false; try{ nosr=ios && localStorage.getItem("ata_nosr")==="1"; }catch(x){}
    if(nosr && !on){ clog("voice_ios_keyboard",{}); say(IOSMSG,true); inp.focus(); return; }
    if(on){ stop(); return; }
    on=true; base=inp.value.trim(); acc=""; started=Date.now(); mic.classList.add("on"); mic.textContent="⏹️ סיום";
    say("🔴 מקליט… דברו בחופשיות – מה, איפה, מתי ומי. כשמסיימים לוחצים \"⏹️ סיום\".");
    start();
  };
  // "שליחה": stop recording first (the page reads the box), then forget what was said, so nothing is written back into the emptied box
  send.addEventListener("click",function(){ if(on) stop(""); setTimeout(function(){ base=""; acc=""; sess=""; },0); },true);
  // Enter = a new line; only the "שליחה" button sends
  var ph=el("div","kp-ent","↵ Enter יורד שורה. כדי לשלוח – לוחצים על \"שליחה\".");
  tip.parentNode.insertBefore(ph, tip.nextSibling);
}
css+=".kp-mic{background:#fff!important;color:#B4232A!important;border:2px solid #B4232A!important;white-space:nowrap}"
+".kp-mic.on{background:#B4232A!important;color:#fff!important;animation:kpPulse 1.2s infinite}"
+"@keyframes kpPulse{0%,100%{box-shadow:0 0 0 0 rgba(180,35,42,.5)}50%{box-shadow:0 0 0 8px rgba(180,35,42,0)}}"
+".kp-mtip{margin:8px 0 0;padding:9px 12px;border-radius:12px;background:#EAF6EC;color:#1d5a2a;font-size:15.5px;line-height:1.5}"
+".kp-mtip.bad{background:#FFF1E6;color:#8a3b00}"
+".kp-ent{margin:6px 2px 0;font-size:13px;color:#667}";
function A(t,h,c){ var a=el("a",c,t); a.href=h; a.target="_blank"; a.rel="noopener"; return a; }
function col(e,ad){ e.style.setProperty("--a",ad.c); e.style.setProperty("--b",ad.c2); }
function init(){
  var st=el("style"); st.textContent=css; document.head.appendChild(st);
  try{ chatBox(); }catch(e){ clog("chatbox_js",{err:e.message}); }
  // 1. ribbon
  var rib=el("div","kp-rib"); rib.appendChild(document.createTextNode("📚 מבית הקול החמישי – אלפי חומרי לימוד תורניים לילדים ולמורים, בחינם: "));
  rib.appendChild(A("חידונים, משחקים, משניות, הלכה ובוטים למורים ←",K+"/"));
  document.body.insertBefore(rib, document.body.firstChild);
  // 0. top navigation (above the ribbon)
  var nav=el("nav","kp-nav"), nin=el("div","in"), cur=null; nav.setAttribute("aria-label","דפי קרית אתא");
  var ig=el("span","gp");
  if(STANDALONE && history.length>1){ var bk=el("a","kp-back","→ חזרה"); bk.href="#"; bk.onclick=function(e){ e.preventDefault(); history.back(); }; ig.appendChild(bk); }
  var ib=el("a","kp-inst","📲 התקנת האפליקציה"); ib.href="#"; ib.onclick=function(e){ e.preventDefault(); install(); }; ig.appendChild(ib);
  nin.appendChild(ig);
  document.querySelectorAll("[data-kp-install]").forEach(function(b){ b.addEventListener("click",function(e){ e.preventDefault(); install(); }); });
  NAV.forEach(function(G){
    var gp=el("span","gp"); if(G[0]) gp.appendChild(el("span","lb",G[0]+":"));
    G[1].forEach(function(L){ var a=el("a",null,L[0]); a.href=L[1];
      if(location.pathname.replace(/index\.html$/,"")===L[1]){ a.className="on"; cur=a; }
      gp.appendChild(a); });
    nin.appendChild(gp); });
  nav.appendChild(nin); document.body.insertBefore(nav, document.body.firstChild);
  if(cur && nin.scrollWidth>nin.clientWidth){ var r=cur.getBoundingClientRect(), rn=nin.getBoundingClientRect(); nin.scrollLeft += (r.left+r.width/2)-(rn.left+rn.width/2); }
  var lastY=window.scrollY, hidden=false, root0=document.documentElement;
  function setNav(h){ hidden=h; nav.classList.toggle("kp-hide",h); root0.style.setProperty("--kpn",h?"0px":nav.offsetHeight+"px"); }
  setNav(false);
  window.addEventListener("scroll",function(){ var y=window.scrollY;
    if(y>lastY+6 && y>140 && !hidden) setNav(true); else if((y<lastY-6 || y<60) && hidden) setNav(false);
    if(Math.abs(y-lastY)>6) lastY=y; },{passive:true});
  window.addEventListener("resize",function(){ if(!hidden) setNav(false); });
  // 2. rotating strip above the search
  var anchor=document.querySelector(".bar")||document.querySelector(".tools");
  if(anchor){
    var s=el("a","kp-strip"); s.target="_blank"; s.rel="noopener";
    var e=el("span","e"), x=el("span","x"), b=el("b"), d=el("span"), go=el("span","go","לכניסה ←");
    x.appendChild(b); x.appendChild(d); s.appendChild(e); s.appendChild(x); s.appendChild(go);
    var i=Math.floor(Math.random()*ADS.length);
    var show=function(){ var ad=ADS[i%ADS.length]; col(s,ad); e.textContent=ad.ic; b.textContent="בהקול החמישי: "+ad.t; d.textContent=ad.d.split(" – ")[0].split("!")[0].slice(0,90); s.href=ad.l[0][1]; i++; };
    show(); setInterval(show,6000);
    anchor.parentNode.insertBefore(s,anchor);
  }
  // 3. a wide card after every 2nd section (re-placed whenever the list re-renders)
  var root=document.getElementById("cats"), busy=false, start=Math.floor(Math.random()*ADS.length);
  function place(){
    if(!root||busy) return; busy=true;
    root.querySelectorAll(".kp-mid").forEach(function(x){ x.remove(); });
    var secs=root.querySelectorAll(":scope > section"), k=0;
    for(var j=1;j<secs.length-1;j+=2){
      var ad=ADS[(start+k++)%ADS.length], m=el("div","kp-mid"); col(m,ad);
      m.appendChild(el("span","big",ad.ic)); m.appendChild(el("span","tag","📢 בהקול החמישי – בחינם"));
      m.appendChild(el("h3",null,ad.t)); m.appendChild(el("p",null,ad.d));
      var ls=el("div","ls"); ad.l.forEach(function(L){ ls.appendChild(A(L[0]+" ←",L[1])); }); m.appendChild(ls);
      secs[j].after(m);
    }
    setTimeout(function(){ busy=false; },0);
  }
  if(root){ new MutationObserver(function(){ if(!busy) place(); }).observe(root,{childList:true}); place(); }
  var q=document.getElementById("q");
  if(q) q.addEventListener("input",function(){ document.body.classList.toggle("kp-search",!!q.value.trim()); });
  // 4. tile grid before the signature (+ the four Kiryat Ata pages, if the page has no such row)
  var sig=document.querySelector(".sig");
  if(sig && !document.querySelector(".sister")){
    var sr=el("div","kp-sis"); [["🏙️ כל קרית אתא","/ata/"],["📖 שיעורי תורה","/ata-shiurim/"],["🕍 זמני תפילות","/ata-tfilot/"],["🏛️ בתי הכנסת","/ata-knesset/"],["🤝 גמ״חים","/ata-gmachim/"],["💼 עסקים ובעלי מקצוע","/ata-asakim/"],["ℹ️ מידעאתא","/ata-meida/"],["🥾 קום והתהלך בארץ","/ata-tiyulim/"],["📜 תולדות העיר","/ata-toldot/"],["📷 תמונות היסטוריות","/ata-tmunot/"]].forEach(function(x){
      if(location.pathname.indexOf(x[1])===0) return; var a=el("a",null,x[0]); a.href=x[1]; sr.appendChild(a); });
    sig.parentNode.insertBefore(sr,sig);
  }
  if(sig){
    var g=el("div","kp-grid"); g.appendChild(el("h3",null,"🌟 עוד מהקול החמישי – הכול בחינם"));
    g.appendChild(el("p","s","מאגר חומרי הלימוד התורני: חידונים ומשחקים לילדים, פניני הפרשה, משניות וש״ס, הלכה, בוטים למורים ודפי הדרכה"));
    var gr=el("div","g"); TILES.forEach(function(T){ var a=A("",T[2]); a.appendChild(el("i",null,T[0])); a.appendChild(document.createTextNode(T[1])); gr.appendChild(a); });
    g.appendChild(gr); g.appendChild(A("לכל המאגר – kol-toda.co.il ←",K+"/","home"));
    sig.parentNode.insertBefore(g,sig);
  }
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();
