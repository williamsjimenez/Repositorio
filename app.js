const DATA=window.BIENESTAR_INDICADORES||[];
const dims=[...new Set(DATA.map(x=>x.d))];
const labels={disponible:"Dato",calculado:"Cálculo",parcial:"Parcial",pendiente:"Pendiente",no_documentado:"No documentado"};
const statusRank={disponible:1,calculado:2,parcial:3,pendiente:4,no_documentado:5};
const $=s=>document.querySelector(s);
const cls=d=>d.startsWith("1.")?"d1":d.startsWith("2.")?"d2":d.startsWith("3.")?"d3":d.startsWith("4.")?"d4":"d5";
function safe(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function isMissing(x){return x.status==="pendiente"||x.status==="no_documentado";}
function metricParts(x){
  if(isMissing(x)) return [{value:x.status==="no_documentado"?"NO DOCUMENTADO":"PENDIENTE",label:x.v||"" ,missing:true}];
  const chunks=String(x.v||"").split(" · ").map(s=>s.trim()).filter(Boolean);
  return chunks.map(chunk=>{
    const m=chunk.match(/^(.*?)([-+≈]?(?:USD\s*)?[0-9][0-9.,/%–—xXa-zA-Z\s]*)$/);
    if(m && m[1].trim()){
      return {value:m[2].trim(),label:m[1].trim().replace(/[:=]$/,"")};
    }
    const starts=chunk.match(/^([-+≈]?(?:USD\s*)?[0-9][^A-Za-z]*)(.*)$/);
    if(starts && starts[1].trim()) return {value:starts[1].trim(),label:starts[2].trim()};
    return {value:chunk,label:"",raw:true};
  });
}
function renderMetrics(x){
  return metricParts(x).map(m=>'<div class="metric '+(m.raw?"raw ":"")+(m.missing?"missing":"")+'"><div class="metric-value">'+safe(m.value)+'</div>'+(m.label?'<div class="metric-label">'+safe(m.label)+'</div>':'')+'</div>').join("");
}
function fillFilters(){
  $("#heroTotal").textContent=DATA.length;
  dims.forEach(d=>{const o=document.createElement("option");o.value=d;o.textContent=d;$("#dimension").appendChild(o)});
  [...new Set(DATA.map(x=>x.status))].forEach(st=>{const o=document.createElement("option");o.value=st;o.textContent=labels[st];$("#status").appendChild(o)});
  const all=document.createElement("button");all.className="dim-btn active";all.dataset.dim="";all.textContent="Todas";$("#dimNav").appendChild(all);
  dims.forEach(d=>{const b=document.createElement("button");b.className="dim-btn";b.dataset.dim=d;b.textContent=d.replace(/^\d+\. /,"");$("#dimNav").appendChild(b)});
}
function filtered(){
  const q=$("#search").value.trim().toLowerCase(),d=$("#dimension").value,st=$("#status").value;
  return DATA.filter(x=>(!d||x.d===d)&&(!st||x.status===st)&&(!q||[x.id,x.d,x.c,x.s,x.n,x.v,x.u,x.p,x.source,x.locator,x.type].join(" ").toLowerCase().includes(q)));
}
function render(){
  const rows=filtered(),root=$("#cards");root.innerHTML="";
  $("#resultCount").textContent=rows.length+" indicadores visibles";
  if(!rows.length){root.innerHTML='<div class="empty">Sin resultados.</div>';return;}
  const grouped=new Map();
  rows.forEach(x=>{if(!grouped.has(x.d))grouped.set(x.d,[]);grouped.get(x.d).push(x)});
  for(const [d,items0] of grouped){
    const items=[...items0].sort((a,b)=>(statusRank[a.status]-statusRank[b.status])||a.id.localeCompare(b.id,undefined,{numeric:true}));
    const sec=document.createElement("section");sec.className="section";
    sec.innerHTML='<div class="section-head"><h2>'+safe(d)+'</h2><div class="count">'+items.length+' indicadores</div></div><div class="grid"></div>';
    const g=sec.querySelector(".grid");
    items.forEach(x=>{
      const el=document.createElement("article");
      el.className="card "+cls(x.d)+(isMissing(x)?" pending-card":"");
      el.innerHTML='<div class="card-head"><span class="code">'+safe(x.id)+'</span><span class="badge '+safe(x.status)+'">'+safe(labels[x.status])+'</span></div>'+
        '<div class="metric-stack">'+renderMetrics(x)+'</div>'+
        '<h3>'+safe(x.n)+'</h3>'+
        '<div class="unit">'+safe(x.u)+' · '+safe(x.p)+'</div>'+
        '<div class="tax">'+safe(x.c)+'<br>'+safe(x.s)+'</div>'+
        '<div class="source"><strong>Fuente</strong> · '+safe(x.source)+'<br><strong>Ubicación</strong> · '+safe(x.locator)+'</div>'+
        (isMissing(x)&&x.required?'<div class="gapbox"><strong>Dato necesario</strong> · '+safe(x.required)+'</div>':'');
      g.appendChild(el);
    });
    root.appendChild(sec);
  }
}
function exportCSV(){
  const cols=["id","dimension","categoria","subcategoria","indicador","valor","unidad","periodo","estado","tipo","fuente","localizacion","dato_requerido"];
  const esc=v=>'"'+String(v??"").replaceAll('"','""')+'"';
  const lines=[cols.join(",")].concat(filtered().map(x=>[x.id,x.d,x.c,x.s,x.n,x.v,x.u,x.p,labels[x.status],x.type,x.source,x.locator,x.required||""].map(esc).join(",")));
  const blob=new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="indicadores_bienestar_policial.csv";a.click();URL.revokeObjectURL(a.href);
}
fillFilters();render();
["search","dimension","status"].forEach(id=>$("#"+id).addEventListener(id==="search"?"input":"change",render));
$("#reset").addEventListener("click",()=>{$("#search").value="";$("#dimension").value="";$("#status").value="";document.querySelectorAll(".dim-btn").forEach(b=>b.classList.toggle("active",!b.dataset.dim));render()});
$("#exportBtn").addEventListener("click",exportCSV);
$("#dimNav").addEventListener("click",e=>{if(!e.target.matches(".dim-btn"))return;const d=e.target.dataset.dim;$("#dimension").value=d;document.querySelectorAll(".dim-btn").forEach(b=>b.classList.toggle("active",b===e.target));render()});
$("#dimension").addEventListener("change",()=>{const d=$("#dimension").value;document.querySelectorAll(".dim-btn").forEach(b=>b.classList.toggle("active",b.dataset.dim===d))});
