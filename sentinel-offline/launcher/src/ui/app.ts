const session=await fetch("/api/session",{method:"POST"}).then(r=>r.json());
const data=await fetch("/api/providers").then(r=>r.json());
const vaultData=await fetch("/api/vaults").then(r=>r.json());
const vaults=document.querySelector("#vaults")!;
for(const v of vaultData.candidates){const button=document.createElement("button");button.textContent=`${v.kind}: ${v.available?"Disponible; revisar":"Configuración requerida"}`;button.addEventListener("click",()=>alert(v.reason));vaults.append(button)}
const cards=document.querySelector("#cards")!;
for(const p of data.providers){const article=document.createElement("article");article.innerHTML=`<h2>${p.name}</h2><p>${p.status}</p><p>Estado: ${p.state}</p><p>Servicios: ${p.services.join(", ")}</p><button>Ver permisos</button>`;cards.append(article)}
document.querySelector("#lock")!.addEventListener("click",async()=>{if(confirm("Escribe ACEPTAR en la siguiente confirmación")&&prompt("Confirmación")==="ACEPTAR"){await fetch("/api/lock-all",{method:"POST",headers:{"X-CSRF-Token":session.csrf}});location.reload()}});
