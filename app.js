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

function valuesHTML(x){
  const parts=String(x.v||"").split(" · ").map(parseChunk);
  const multi=parts.length>1;
  return '<div class="values '+(multi?"multi-values":"single-value")+'">'+parts.map(f=>
    '<div class="fact '+(multi?"mini-card":"")+'"><div class="fact-number '+(f.compact?"compact":"")+'">'+esc(f.value)+'</div>'+
    (f.label?'<div class="fact-label">'+esc(f.label)+'</div>':'')+'</div>'
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

function cardHTML(x){
  const isGap=gapStatuses.has(x.status);
  if(isGap){
    return '<article class="card gap-card '+dimClass(x.d)+'">'+
      '<div class="gap-word">'+(x.status==="no_documentado"?"No documentado":"Pendiente")+'</div>'+
      '<h3 class="card-title">'+esc(x.n)+'</h3>'+
      '<div class="meta">'+esc(x.u)+' · '+esc(x.p)+'</div>'+
      '<div class="source"><b>Fuente:</b> '+esc(x.source)+' · '+esc(x.locator)+'</div>'+
      (x.required?'<div class="required"><b>Dato necesario:</b> '+esc(x.required)+'</div>':'')+
      '</article>';
  }
  return '<article class="card '+dimClass(x.d)+'">'+
    valuesHTML(x)+
    '<h3 class="card-title">'+esc(x.n)+'</h3>'+
    '<div class="meta">'+esc(x.u)+' · '+esc(x.p)+'</div>'+
    '<div class="source"><b>Fuente:</b> '+esc(x.source)+' · '+esc(x.locator)+'</div>'+
    '</article>';
}

function render(){
  const rows=DATA.filter(keep);
  $("#resultCount").textContent=rows.length+" indicadores";
  const root=$("#cards");
  if(!rows.length){root.innerHTML='<div class="empty">Sin resultados.</div>';return}
  const groups=new Map();
  rows.forEach(x=>{if(!groups.has(x.d))groups.set(x.d,[]);groups.get(x.d).push(x)});
  root.innerHTML=[...groups.entries()].map(([d,items])=>
    '<section class="section"><div class="section-head"><h2>'+esc(d)+'</h2><span>'+items.length+' indicadores</span></div>'+
    '<div class="grid">'+items.map(cardHTML).join("")+'</div></section>'
  ).join("");
}

function exportCSV(){
  const rows=DATA.filter(keep);
  const cols=["id","dimension","categoria","subcategoria","indicador","valor","unidad","periodo","estado","tipo","fuente","localizacion","dato_requerido"];
  const q=v=>'"'+String(v??"").replaceAll('"','""')+'"';
  const lines=[cols.join(",")].concat(rows.map(x=>[x.id,x.d,x.c,x.s,x.n,x.v,x.u,x.p,x.status,x.type,x.source,x.locator,x.required||""].map(q).join(",")));
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
