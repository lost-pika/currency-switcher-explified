(function(){
"use strict";

const TTL = 1000 * 60 * 15;
const SEL = ["[data-price]", ".price", "span.money"];
const PICK = "__mlv_currency_picker_v2";
const KEY  = "mlv_currency_choice_v2";

/* ---------------- storage ---------------- */
function now(){ return Date.now(); }
function sset(k,v,ttl=TTL){
  try{ localStorage.setItem(k,JSON.stringify({v,x:now()+ttl})); }catch(e){}
}
function sget(k){
  try{
    const r=localStorage.getItem(k);
    if(!r) return null;
    const o=JSON.parse(r);
    if(!o||now()>o.x){ localStorage.removeItem(k); return null; }
    return o.v;
  }catch(e){ return null; }
}

/* ---------------- detect currency ---------------- */
function detect(){
  try{
    const n=(navigator.languages&&navigator.languages[0])||navigator.language||"en-US";
    const l=n.toLowerCase();
    if(l.includes("in")) return "INR";
    if(l.includes("gb")) return "GBP";
    if(l.includes("us")) return "USD";
    if(l.includes("jp")) return "JPY";
    if(l.includes("au")) return "AUD";
    if(l.includes("zh")) return "CNY";
    return "USD";
  }catch(e){ return "USD"; }
}

/* ---------------- price parse ---------------- */
function parseNum(s){
  if(!s) return null;
  const c=s.replace(/[^\d.,-]/g,"");
  if(c.includes(",")&&c.includes(".")) return parseFloat(c.replace(/,/g,""));
  if(c.includes(",")) return parseFloat(c.replace(",","."));
  const n=parseFloat(c);
  return isNaN(n)?null:n;
}
function fmt(v,cur){
  try{
    return new Intl.NumberFormat(undefined,{
      style:"currency",
      currency:cur,
      maximumFractionDigits:2
    }).format(v);
  }catch(e){
    return cur+" "+v.toFixed(2);
  }
}

/* ---------------- find prices ---------------- */
function findNodes(){
  const s=new Set();
  SEL.forEach(q=>document.querySelectorAll(q).forEach(e=>s.add(e)));
  return [...s];
}
function convertEl(el,rate,cur){
  if(!el.dataset.orig) el.dataset.orig=el.textContent.trim();
  const n=parseNum(el.dataset.orig);
  if(n==null) return;
  el.textContent=fmt(n*rate,cur);
}
function revertEl(el){
  if(el.dataset.orig) el.textContent=el.dataset.orig;
}

/* ---------------- API ---------------- */
async function fetchRates(base,targets){
  try{
    const k=`rates_${base}_${targets.join(",")}`;
    const c=sget(k);
    if(c) return c;

    const r=await fetch(
      `/apps/currency-switcher/api/rates?base=${base}&symbols=${targets.join(",")}`,
      { credentials:"omit" }
    );
    if(!r.ok) return null;
    const j=await r.json();
    sset(k,j.rates);
    return j.rates;
  }catch(e){ return null; }
}

async function loadSettings(){
  try{
    const shop=window.__MLV_SHOP__||location.hostname;
    const r=await fetch(
      `/apps/currency-switcher/api/merchant-settings?shop=${encodeURIComponent(shop)}`,
      { credentials:"omit" }
    );
    if(!r.ok) return null;
    return await r.json();
  }catch(e){ return null; }
}

/* ---------------- styles ---------------- */
function injectCSS(){
  if(document.getElementById("__mlv_css")) return;
  const s=document.createElement("style");
  s.id="__mlv_css";
  s.textContent=`
#${PICK}{position:fixed;z-index:2147483647;font-family:system-ui}
#${PICK} button{padding:8px 10px;border-radius:10px;border:1px solid rgba(0,0,0,.1);background:#fff;cursor:pointer;position:relative}
#${PICK} button:after{content:"▾";position:absolute;right:6px;top:50%;transform:translateY(-50%)}
[data-mlv-menu]{position:fixed;background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:8px;box-shadow:0 12px 30px rgba(0,0,0,.12);display:none;z-index:2147483647}
`;
  document.head.appendChild(s);
}

/* ---------------- placement (FIXED default) ---------------- */
function applyPlacement(w,st){
  const fc=st?.fixedCorner || "top-right";   // ✅ DEFAULT TOP-RIGHT
  const t=st?.distanceTop ?? 16;
  const r=st?.distanceRight ?? 16;
  const b=st?.distanceBottom ?? 16;
  const l=st?.distanceLeft ?? 16;

  w.style.top    = fc.includes("top")    ? t+"px" : "auto";
  w.style.bottom = fc.includes("bottom") ? b+"px" : "auto";
  w.style.left   = fc.includes("left")   ? l+"px" : "auto";
  w.style.right  = fc.includes("right")  ? r+"px" : "auto";
}

/* ---------------- picker ---------------- */
function createPicker(st,cur,onSel){
  document.getElementById(PICK)?.remove();

  const w=document.createElement("div"); w.id=PICK;
  const b=document.createElement("button"); b.textContent=cur;
  const m=document.createElement("div"); m.dataset.mlvMenu="";

  (st?.selectedCurrencies||[cur]).forEach(c=>{
    const d=document.createElement("div");
    d.textContent=c;
    d.style.padding="6px 8px";
    d.style.cursor="pointer";
    d.onclick=e=>{
      e.stopPropagation();
      b.textContent=c;
      m.style.display="none";
      onSel(c);
    };
    m.appendChild(d);
  });

  b.onclick=e=>{
    e.stopPropagation();
    const r=b.getBoundingClientRect();
    m.style.left=r.left+"px";
    m.style.top=(r.bottom+8)+"px";
    m.style.minWidth=r.width+"px";
    m.style.display="block";
  };

  document.addEventListener("click",()=>m.style.display="none");

  w.appendChild(b);
  document.body.append(w,m);
  applyPlacement(w,st);
}

/* ---------------- convert ---------------- */
async function runFor(c,st){
  const base=st?.baseCurrency||"USD";
  if(base===c){ findNodes().forEach(revertEl); return; }
  const r=await fetchRates(base,[c]);
  if(!r||!r[c]) return;
  findNodes().forEach(e=>convertEl(e,r[c],c));
}

/* ---------------- init ---------------- */
async function init(){
  injectCSS();
  const st=await loadSettings()||{};
  const d=st.defaultCurrency||detect();
  const i=localStorage.getItem(KEY)||d;

  createPicker(st,i,async c=>{
    localStorage.setItem(KEY,c);
    await runFor(c,st);
  });
  await runFor(i,st);
}

document.readyState==="loading"
  ? document.addEventListener("DOMContentLoaded",init)
  : init();

})();
