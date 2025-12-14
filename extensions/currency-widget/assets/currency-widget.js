(function(){
"use strict";
const TTL=1000*60*15,SEL=["[data-price]",".price","span.money"],PICK="__mlv_currency_picker_v2",KEY="mlv_currency_choice_v2";
function now(){return Date.now();}
function sset(k,v,ttl=TTL){try{localStorage.setItem(k,JSON.stringify({v:v,x:now()+ttl}));}catch(e){}}
function sget(k){try{const r=localStorage.getItem(k);if(!r)return null;const o=JSON.parse(r);if(!o||!o.x||now()>o.x){localStorage.removeItem(k);return null}return o.v}catch(e){return null}}
function detect(){try{const n=(navigator.languages&&navigator.languages[0])||navigator.language||"en-US";const lc=n.toLowerCase();if(lc.indexOf("en-gb")===0||lc.indexOf("-gb")>-1)return"GBP";if(lc.indexOf("en-in")===0||lc.indexOf("-in")>-1)return"INR";if(lc.indexOf("en-us")===0||lc.indexOf("-us")>-1)return"USD";if(lc.indexOf("jp")>-1)return"JPY";if(lc.indexOf("zh")>-1)return"CNY";if(lc.indexOf("au")>-1)return"AUD";return"USD"}catch(e){return"USD"}}
function parseNum(s){if(!s||typeof s!=="string")return null;const c=s.replace(/[^\d.,-]/g,"").trim();if(!c)return null;if(c.indexOf(".")>=0&&c.indexOf(",")>=0){const n=c.replace(/,/g,"");const v=parseFloat(n);return isNaN(v)?null:v;}if(c.indexOf(",")>=0&&c.indexOf(".")===-1){const n=c.replace(/\./g,"").replace(/,/g,".");const v=parseFloat(n);return isNaN(v)?null:v;}const n=c.replace(/,/g,"");const v=parseFloat(n);return isNaN(v)?null:v}
function fmt(v,cur){try{return new Intl.NumberFormat(undefined,{style:"currency",currency:cur,maximumFractionDigits:2}).format(v);}catch(e){return cur+" "+(Math.round(v*100)/100).toFixed(2)}}
function appOrigin(){try{if(window.__MLV_APP_ORIGIN__)return window.__MLV_APP_ORIGIN__;}catch(e){}return window.location.origin}
async function fetchRates(base,targets){try{const k=`rates_${base}_${(targets||[]).join(",")}`,c=sget(k);if(c)return c;const app=appOrigin();const qs=(targets&&targets.length)?`&symbols=${targets.join(",")}`:"";const r=await fetch(`${app}/apps/currency-switcher/api/rates?base=${encodeURIComponent(base)}${qs}`,{credentials:"omit"});if(!r.ok)return null;const j=await r.json();if(!j||!j.rates)return null;sset(k,j.rates);return j.rates}catch(e){return null}}
async function loadSettings(){try{const shop=(window.__MLV_SHOP__&&typeof window.__MLV_SHOP__==="string")?window.__MLV_SHOP__:window.location.hostname;const app=appOrigin();const r=await fetch(`${app}/apps/currency-switcher/api/merchant-settings?shop=${encodeURIComponent(shop)}`,{credentials:"omit"});if(!r.ok)return null;return await r.json()}catch(e){return null}}
function findNodes(){const s=new Set();for(const q of SEL){document.querySelectorAll(q).forEach(e=>s.add(e))}return Array.from(s)}
function convertEl(el,rate,cur){if(!el)return;if(!el.dataset.orig)el.dataset.orig=el.textContent.trim();const n=parseNum(el.dataset.orig);if(n===null)return;el.textContent=fmt(n*rate,cur)}
function revertEl(el){if(el&&el.dataset&&el.dataset.orig)el.textContent=el.dataset.orig}
function injectCSS(){if(document.getElementById("__mlv_curr_css"))return;const css=`#${PICK}{position:fixed;z-index:2147483647;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial}#${PICK} button{padding:8px 10px;border-radius:10px;border:1px solid rgba(0,0,0,.1);background:#fff;cursor:pointer;min-width:60px;position:relative}#${PICK} button::after{content:"▾";position:absolute;right:6px;top:50%;transform:translateY(-50%)}[data-mlv-menu]{position:fixed;min-width:120px;background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:8px;padding:6px;box-shadow:0 12px 30px rgba(0,0,0,.12);display:none;z-index:2147483647}`;const s=document.createElement("style");s.id="__mlv_curr_css";s.textContent=css;document.head.appendChild(s)}
function applyPlacement(w,st){const fc=(st&&st.fixedCorner)||"bottom-left";const t=st?.distanceTop??16,r=st?.distanceRight??16,b=st?.distanceBottom??16,l=st?.distanceLeft??16;w.style.position="fixed";w.style.top=fc.includes("top")?t+"px":"auto";w.style.bottom=fc.includes("bottom")?b+"px":"auto";w.style.left=fc.includes("left")?l+"px":"auto";w.style.right=fc.includes("right")?r+"px":"auto"}
function createPicker(st,cur,onSel){
const prev=document.getElementById(PICK);if(prev)prev.remove();
const w=document.createElement("div");w.id=PICK;
const b=document.createElement("button");b.textContent=cur||"Currency";
const m=document.createElement("div");m.setAttribute("data-mlv-menu","");
(st?.selectedCurrencies||[cur]).forEach(c=>{const d=document.createElement("div");d.textContent=c;d.style.padding="6px 8px";d.style.cursor="pointer";d.onclick=e=>{e.stopPropagation();b.textContent=c;m.style.display="none";onSel(c)};m.appendChild(d)});
b.onclick=e=>{
e.stopPropagation();
const r=b.getBoundingClientRect(),up=r.top>window.innerHeight/2;
m.style.display="block";
m.style.left=r.left+"px";
m.style.width=r.width+"px";
m.style.top=up?"auto":(r.bottom+8)+"px";
m.style.bottom=up?(window.innerHeight-r.top+8)+"px":"auto";
};
document.addEventListener("click",()=>m.style.display="none");
w.appendChild(b);document.body.appendChild(w);document.body.appendChild(m);
applyPlacement(w,st);return w}
async function runFor(c,st){if(!c)return;const base=st?.baseCurrency||"USD";if(base===c){findNodes().forEach(revertEl);return}const r=await fetchRates(base,[c]);if(!r||!r[c])return;findNodes().forEach(e=>convertEl(e,r[c],c))}
async function init(){injectCSS();const st=await loadSettings();const v=detect();const d=st?.defaultCurrency||v;const i=localStorage.getItem(KEY)||d;createPicker(st||{},i,async c=>{localStorage.setItem(KEY,c);await runFor(c,st)});await runFor(i,st)}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
