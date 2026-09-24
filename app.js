const DATA=window.BIENESTAR_INDICADORES||[];
const $=s=>document.querySelector(s);
const dims=[...new Set(DATA.map(x=>x.d))];
const dataStatuses=new Set(["disponible","calculado","parcial"]);
const gapStatuses=new Set(["pendiente","no_documentado"]);
let view="data";
let dimension="";

const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const dimClass=d=>d.startsWith("1.")?"d1":d.startsWith("2.")?"d2":d.startsWith("3.")?"d3":d.startsWith("4.")?"d4":"d5";

function parseChunk(chunk){
  let s=chunk.trim().replace(/\s+/g," ");
  let m=s.match(/^(.+?)\s+((?:[+−-]|≈)?(?:USD\s*)?\d[\d.,]*(?:\s*\/\s*\d[\d.,]*)?(?:\s*=\s*\d[\d.,]*\s*%)?(?:\s*%|\s*millones|\s*aprox\.)?)$/i);
  if(m) return {label:m[1].trim(),value:m[2].trim(),compact:m[2].length>15};
  m=s.match(/^((?:[+−-]|≈)?(?:USD\s*)?\d[\d.,]*(?:\s*\/\s*\d[\d.,]*)?(?:\s*=\s*\d[\d.,]*\s*%)?(?:\s*%|\s*millones|\s*aprox\.)?)\s*(.*)$/i);
  if(m && m[1]) return {label:m[2].trim(),value:m[1].trim(),compact:m[1].length>15};
  return {label:"",value:s,compact:s.length>18};
}

function valueParts(x){
  return String(x.v||"").split(" · ").map(parseChunk);
}

function numberSizeClass(value){
  const n=String(value||"").replace(/\s+/g," ").trim().length;
  if(n<=8) return "num-short";
  if(n<=15) return "num-medium";
  return "num-long";
}

function singleValueHTML(parts){
  const f=parts[0];
  return '<div class="values single-value"><div class="fact">'+
    '<div class="fact-number '+numberSizeClass(f.value)+'">'+esc(f.value)+'</div>'+
    (f.label?'<div class="fact-label">'+esc(f.label)+'</div>':'')+
    '</div></div>';
}

function miniCardsHTML(parts){
  return '<div class="mini-grid count-'+parts.length+'">'+parts.map(f=>
    '<div class="mini-card">'+
      '<div class="mini-number '+numberSizeClass(f.value)+'">'+esc(f.value)+'</div>'+
      (f.label?'<div class="mini-label">'+esc(f.label)+'</div>':'<div class="mini-label">Dato</div>')+
    '</div>'
  ).join("")+'</div>';
}

function keep(x){
  if(dimension && x.d!==dimension) return false;
  const q=$("#search").value.trim().toLowerCase();
  if(q && ![x.n,x.v,x.source,x.locator,x.c,x.s,x.p,x.u].join(" ").toLowerCase().includes(q)) return false;
  if(view==="data") return dataStatuses.has(x.status);
  if(view==="gaps") return gapStatuses.has(x.status);
  return true;
}

function renderNav(){
  const nav=$("#dimNav");
  nav.innerHTML='<button class="dim-btn active" data-dim="">Todas</button>'+
    dims.map(d=>'<button class="dim-btn" data-dim="'+esc(d)+'">'+esc(d.replace(/^\d+\.\s*/,""))+'</button>').join("");
}

function sourceHTML(x){
  const link=x.url?'<a class="source-link" href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">Abrir fuente</a>':'';
  const note=x.note?'<details class="method-note"><summary>Nota metodológica</summary><div>'+esc(x.note)+'</div></details>':'';
  return '<div class="source"><div><b>Fuente:</b> '+esc(x.source)+'</div><div class="locator">'+esc(x.locator)+'</div>'+link+note+'</div>';
}

function cardHTML(x){
  const isGap=gapStatuses.has(x.status);
  if(isGap){
    return '<article class="card gap-card '+dimClass(x.d)+'">'+
      '<div class="gap-word">'+(x.status==="no_documentado"?"No documentado":"Pendiente")+'</div>'+
      '<h3 class="card-title">'+esc(x.n)+'</h3>'+
      '<div class="meta">'+esc(x.u)+' · '+esc(x.p)+'</div>'+
      sourceHTML(x)+
      (x.required?'<div class="required"><b>Dato necesario:</b> '+esc(x.required)+'</div>':'')+
      '</article>';
  }
  const parts=valueParts(x);
  if(parts.length>1){
    return '<article class="card multi-parent '+dimClass(x.d)+'">'+
      '<div class="parent-head"><h3 class="card-title">'+esc(x.n)+'</h3>'+
      '<div class="meta">'+esc(x.u)+' · '+esc(x.p)+'</div></div>'+
      miniCardsHTML(parts)+
      sourceHTML(x)+
      '</article>';
  }
  return '<article class="card '+dimClass(x.d)+'">'+
    singleValueHTML(parts)+
    '<h3 class="card-title">'+esc(x.n)+'</h3>'+
    '<div class="meta">'+esc(x.u)+' · '+esc(x.p)+'</div>'+
    sourceHTML(x)+
    '</article>';
}

function render(){
  const rows=DATA.filter(keep);
  $("#resultCount").textContent=rows.length+" indicadores";
  const root=$("#cards");
  if(!rows.length){root.innerHTML='<div class="empty">Sin resultados.</div>';return}
  const groups=new Map();
  rows.forEach(x=>{if(!groups.has(x.d))groups.set(x.d,[]);groups.get(x.d).push(x)});
  root.innerHTML=[...groups.entries()].map(([d,items])=>{
    const categories=new Map();
    items.forEach(x=>{if(!categories.has(x.c))categories.set(x.c,[]);categories.get(x.c).push(x)});
    const body=[...categories.entries()].map(([c,catItems])=>
      '<div class="category-block">'+
        '<div class="category-head"><h3>'+esc(c)+'</h3><span>'+catItems.length+' indicadores</span></div>'+
        '<div class="grid">'+catItems.map(cardHTML).join("")+'</div>'+
      '</div>'
    ).join("");
    return '<section class="section"><div class="section-head"><h2>'+esc(d)+'</h2><span>'+items.length+' indicadores</span></div>'+body+'</section>';
  }).join("");
}

function exportCSV(){
  const rows=DATA.filter(keep);
  const cols=["id","dimension","categoria","subcategoria","indicador","valor","unidad","periodo","estado","tipo","fuente","localizacion","url_fuente","dato_requerido","nota"];
  const q=v=>'"'+String(v??"").replaceAll('"','""')+'"';
  const lines=[cols.join(",")].concat(rows.map(x=>[x.id,x.d,x.c,x.s,x.n,x.v,x.u,x.p,x.status,x.type,x.source,x.locator,x.url||"",x.required||"",x.note||""].map(q).join(",")));
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8"}));
  a.download="indicadores_bienestar_policial.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

renderNav();
render();

$("#dimNav").addEventListener("click",e=>{
  if(!e.target.matches(".dim-btn"))return;
  dimension=e.target.dataset.dim||"";
  document.querySelectorAll(".dim-btn").forEach(b=>b.classList.toggle("active",b===e.target));
  render();
});
document.querySelector(".view-switch").addEventListener("click",e=>{
  if(!e.target.matches(".view-btn"))return;
  view=e.target.dataset.view;
  document.querySelectorAll(".view-btn").forEach(b=>b.classList.toggle("active",b===e.target));
  render();
});
$("#search").addEventListener("input",render);
$("#exportBtn").addEventListener("click",exportCSV);
