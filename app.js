const DATA=window.BIENESTAR_INDICADORES||[];
const dims=[...new Set(DATA.map(x=>x.d))];
const labels={disponible:"Disponible",calculado:"Cálculo derivado",parcial:"Parcial / localizado",pendiente:"Fuente pendiente",no_documentado:"No documentado"};
const cls=d=>d.startsWith("1.")?"d1":d.startsWith("2.")?"d2":d.startsWith("3.")?"d3":d.startsWith("4.")?"d4":"d5";
const $=s=>document.querySelector(s);
function safe(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function fillSummary(){
  const counts={all:DATA.length,with:DATA.filter(x=>["disponible","calculado"].includes(x.status)).length,partial:DATA.filter(x=>x.status==="parcial").length,gap:DATA.filter(x=>["pendiente","no_documentado"].includes(x.status)).length};
  $("#total").textContent=counts.all;$("#with").textContent=counts.with;$("#partial").textContent=counts.partial;$("#gap").textContent=counts.gap;$("#dims").textContent=dims.length;
  $("#subcats").textContent=new Set(DATA.map(x=>x.d+"|"+x.c+"|"+x.s)).size;
}
function fillFilters(){
  dims.forEach(d=>{const o=document.createElement("option");o.value=d;o.textContent=d;$("#dimension").appendChild(o)});
  [...new Set(DATA.map(x=>x.status))].forEach(st=>{const o=document.createElement("option");o.value=st;o.textContent=labels[st];$("#status").appendChild(o)});
  const all=document.createElement("button");all.className="dim-btn active";all.dataset.dim="";all.textContent="Todas";$("#dimNav").appendChild(all);
  dims.forEach(d=>{const b=document.createElement("button");b.className="dim-btn";b.dataset.dim=d;b.textContent=d.replace(/^\d+\. /,"");$("#dimNav").appendChild(b)});
}
function filtered(){
  const q=$("#search").value.trim().toLowerCase(),d=$("#dimension").value,st=$("#status").value;
  return DATA.filter(x=>(!d||x.d===d)&&(!st||x.status===st)&&(!q||[x.id,x.d,x.c,x.s,x.n,x.v,x.source,x.locator,x.note,x.required,x.type].join(" ").toLowerCase().includes(q)));
}
function render(){
  const rows=filtered(),root=$("#cards");root.innerHTML="";
  if(!rows.length){root.innerHTML='<div class="empty">No hay indicadores que coincidan con los filtros seleccionados.</div>';$("#resultCount").textContent="0 indicadores";return;}
  const grouped=new Map(); rows.forEach(x=>{if(!grouped.has(x.d))grouped.set(x.d,[]);grouped.get(x.d).push(x)});
  for(const [d,items] of grouped){
    const sec=document.createElement("section");
    sec.innerHTML='<div class="section-head"><h2>'+safe(d)+'</h2><div class="count">'+items.length+' indicadores</div></div><div class="grid"></div>';
    const g=sec.querySelector(".grid");
    items.forEach(x=>{
      const el=document.createElement("article");el.className="card "+cls(x.d);
      el.innerHTML='<div class="card-top"><span class="code">'+safe(x.id)+'</span><span class="badge '+safe(x.status)+'">'+safe(labels[x.status])+'</span></div>'+
        '<div class="type">'+safe(x.type)+'</div><h3>'+safe(x.n)+'</h3><div class="value">'+safe(x.v)+'</div><div class="unit">'+safe(x.u)+'</div>'+
        '<div class="period">'+safe(x.p)+'</div><div class="tax"><strong>'+safe(x.c)+'</strong><br>'+safe(x.s)+'</div>'+
        '<div class="source"><strong>Fuente:</strong> '+safe(x.source)+'<br><strong>Localización:</strong> '+safe(x.locator)+'</div>'+
        (x.note?'<div class="note"><strong>Nota metodológica:</strong> '+safe(x.note)+'</div>':'')+
        (x.required?'<div class="required"><strong>Dato requerido:</strong> '+safe(x.required)+'</div>':'');
      g.appendChild(el);
    }); root.appendChild(sec);
  }
  $("#resultCount").textContent=rows.length+" indicadores visibles";
}
function exportCSV(){
  const cols=["id","dimension","categoria","subcategoria","indicador","valor","unidad","periodo","estado","tipo","fuente","localizacion","nota","dato_requerido"];
  const esc=v=>'"'+String(v??"").replaceAll('"','""')+'"';
  const lines=[cols.join(",")].concat(filtered().map(x=>[x.id,x.d,x.c,x.s,x.n,x.v,x.u,x.p,labels[x.status],x.type,x.source,x.locator,x.note||"",x.required||""].map(esc).join(",")));
  const blob=new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="sistema_indicadores_bienestar_policial.csv";a.click();URL.revokeObjectURL(a.href);
}
fillSummary();fillFilters();render();
["search","dimension","status"].forEach(id=>$("#"+id).addEventListener(id==="search"?"input":"change",render));
$("#reset").addEventListener("click",()=>{$("#search").value="";$("#dimension").value="";$("#status").value="";document.querySelectorAll(".dim-btn").forEach(b=>b.classList.toggle("active",!b.dataset.dim));render()});
$("#exportBtn").addEventListener("click",exportCSV);
$("#dimNav").addEventListener("click",e=>{if(!e.target.matches(".dim-btn"))return;const d=e.target.dataset.dim;$("#dimension").value=d;document.querySelectorAll(".dim-btn").forEach(b=>b.classList.toggle("active",b===e.target));render()});
$("#dimension").addEventListener("change",()=>{const d=$("#dimension").value;document.querySelectorAll(".dim-btn").forEach(b=>b.classList.toggle("active",b.dataset.dim===d))});
