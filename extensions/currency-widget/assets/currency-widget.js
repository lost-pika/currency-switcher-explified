(function(){
"use strict";

/* ================= CONFIG ================= */
const TTL = 1000 * 60 * 15;
const SEL = ["[data-price]", ".price", "span.money"];
const PICK = "__mlv_currency_picker_v2";
const KEY  = "mlv_currency_choice_v2";

/* ================= UTILS ================= */
function now(){ return Date.now(); }

function sset(k,v,ttl=TTL){
  try{ localStorage.setItem(k, JSON.stringify({v, x: now()+ttl})); }catch(e){}
}
function sget(k){
  try{
    const r = localStorage.getItem(k);
    if(!r) return null;
    const o = JSON.parse(r);
    if(!o || !o.x || now() > o.x){
      localStorage.removeItem(k);
      return null;
    }
    return o.v;
  }catch(e){ return null; }
}

function detect(){
  try{
    const n=(navigator.languages&&navigator.languages[0])||navigator.language||"en-US";
    const lc=n.toLowerCase();
    if(lc.includes("gb")) return "GBP";
    if(lc.includes("in")) return "INR";
    if(lc.includes("us")) return "USD";
    if(lc.includes("jp")) return "JPY";
    if(lc.includes("zh")) return "CNY";
    if(lc.includes("au")) return "AUD";
    return "USD";
  }catch(e){ return "USD"; }
}

function parseNum(s){
  if(!s || typeof s!=="string") return null;
  const c=s.replace(/[^\d.,-]/g,"").trim();
  if(!c) return null;
  if(c.includes(".") && c.includes(",")) return parseFloat(c.replace(/,/g,""));
  if(c.includes(",") && !c.includes(".")) return parseFloat(c.replace(",","."));
  return parseFloat(c.replace(/,/g,""));
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

/* ================= FETCH RATES (FIXED) ================= */
async function fetchRates(base, targets){
  try{
    const k=`rates_${base}_${targets.join(",")}`;
    const c=sget(k);
    if(c) return c;

    const r = await fetch(
      `/apps/currency-switcher/api/rates?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(targets.join(","))}`
    );
    if(!r.ok) return null;

    const j = await r.json();
    if(!j || !j.rates) return null;

    sset(k, j.rates);
    return j.rates;
  }catch(e){ return null; }
}

/* ================= LOAD SETTINGS ================= */
async function loadSettings(){
  try{
    const shop = window.__MLV_SHOP__ || location.hostname;
    const r = await fetch(
      `/apps/currency-switcher/api/merchant-settings?shop=${encodeURIComponent(shop)}`
    );
    if(!r.ok) return null;
    return await r.json();
  }catch(e){ return null; }
}

/* ================= DOM ================= */
function findNodes(){
  const s=new Set();
  SEL.forEach(q=>document.querySelectorAll(q).forEach(e=>s.add(e)));
  return Array.from(s);
}

function convertEl(el,rate,cur){
  if(!el) return;
  if(!el.dataset.orig) el.dataset.orig = el.textContent.trim();
  const n=parseNum(el.dataset.orig);
  if(n===null) return;
  el.textContent = fmt(n*rate,cur);
}

function revertEl(el){
  if(el?.dataset?.orig) el.textContent = el.dataset.orig;
}

/* ================= CSS (GAP FIXED) ================= */
function injectCSS(){
  if(document.getElementById("__mlv_curr_css")) return;
  const css = `
#${PICK}{
  position:fixed;
  z-index:2147483647;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;
}
#${PICK} button{
  padding:8px 22px 8px 10px; /* ✅ more gap for arrow */
  border-radius:10px;
  border:1px solid rgba(0,0,0,.15);
  background:#fff;
  cursor:pointer;
  min-width:64px;
  position:relative;
}
#${PICK} button::after{
  content:"▾";
  position:absolute;
  right:8px;                /* ✅ moved arrow right */
  top:50%;
  transform:translateY(-50%);
}
[data-mlv-menu]{
  position:fixed;
  min-width:120px;
  background:#fff;
  border:1px solid rgba(0,0,0,.12);
  border-radius:8px;
  padding:6px;
  box-shadow:0 12px 30px rgba(0,0,0,.12);
  display:none;
  z-index:2147483647;
}`;
  const s=document.createElement("style");
  s.id="__mlv_curr_css";
  s.textContent=css;
  document.head.appendChild(s);
}

/* ================= PLACEMENT ================= */
function applyPlacement(w,st){
  const fc = st?.fixedCorner || "top-right"; // ✅ default TOP-RIGHT
  const t=st?.distanceTop??16,
        r=st?.distanceRight??16,
        b=st?.distanceBottom??16,
        l=st?.distanceLeft??16;

  w.style.top    = fc.includes("top")    ? t+"px" : "auto";
  w.style.bottom = fc.includes("bottom") ? b+"px" : "auto";
  w.style.left   = fc.includes("left")   ? l+"px" : "auto";
  w.style.right  = fc.includes("right")  ? r+"px" : "auto";
}

/* ================= PICKER ================= */
function createPicker(st,cur,onSel){
  document.getElementById(PICK)?.remove();

  const w=document.createElement("div");
  w.id=PICK;

  const b=document.createElement("button");
  b.textContent=cur;

  const m=document.createElement("div");
  m.setAttribute("data-mlv-menu","");

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
    m.style.display="block";
    m.style.left=r.left+"px";
    m.style.top=(r.bottom+8)+"px";
    m.style.width=r.width+"px";
  };

  document.addEventListener("click",()=>m.style.display="none");

  w.appendChild(b);
  document.body.appendChild(w);
  document.body.appendChild(m);

  applyPlacement(w,st);
}

/* ================= RUN ================= */
async function runFor(c,st){
  const base = st?.baseCurrency || "USD";
  if(base===c){ findNodes().forEach(revertEl); return; }

  const r = await fetchRates(base,[c]);
  if(!r||!r[c]) return;

  findNodes().forEach(e=>convertEl(e,r[c],c));
}

async function init(){
  injectCSS();
  const st = await loadSettings() || {};
  const def = st.defaultCurrency || detect();
  const cur = localStorage.getItem(KEY) || def;

  createPicker(st,cur,async c=>{
    localStorage.setItem(KEY,c);
    await runFor(c,st);
  });

  await runFor(cur,st);
}

document.readyState==="loading"
  ? document.addEventListener("DOMContentLoaded",init)
  : init();

})();
