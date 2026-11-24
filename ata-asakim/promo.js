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
var css = ""
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
function A(t,h,c){ var a=el("a",c,t); a.href=h; a.target="_blank"; a.rel="noopener"; return a; }
function col(e,ad){ e.style.setProperty("--a",ad.c); e.style.setProperty("--b",ad.c2); }
function init(){
  var st=el("style"); st.textContent=css; document.head.appendChild(st);
  // 1. ribbon
  var rib=el("div","kp-rib"); rib.appendChild(document.createTextNode("📚 מבית הקול החמישי – אלפי חומרי לימוד תורניים לילדים ולמורים, בחינם: "));
  rib.appendChild(A("חידונים, משחקים, משניות, הלכה ובוטים למורים ←",K+"/"));
  document.body.insertBefore(rib, document.body.firstChild);
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
    var sr=el("div","kp-sis"); [["📖 שיעורי תורה","/ata-shiurim/"],["🕍 זמני תפילות","/ata-tfilot/"],["🤝 גמ״חים","/ata-gmachim/"],["💼 עסקים ובעלי מקצוע","/ata-asakim/"]].forEach(function(x){
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
