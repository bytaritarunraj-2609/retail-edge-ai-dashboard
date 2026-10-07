let chart=null;
let floor=1;
let batchIndex=0;
let batchOn=true;
let selectedShelf=3;
let schedulerTimer=null;

const products=[
  ['Instant Noodles','Maggi'],['Soft Drinks','Coca-Cola'],['Soft Drinks','Sprite'],['Bakery','Bread'],['Dairy','Milk'],
  ['Biscuits','Biscuits'],['Personal Care','Shampoo'],['Personal Care','Soap'],['Personal Care','Toothpaste'],['Home Care','Detergent'],
  ['Staples','Rice'],['Staples','Atta'],['Cooking','Cooking Oil'],['Beverages','Coffee'],['Beverages','Tea'],
  ['Instant Food','Noodles'],['Snacks','Chips'],['Beverages','Juice'],['Confectionery','Chocolate'],['Baby Care','Baby Care']
];
const zones=[
  {name:'Zone A',level:'High',score:82,interval:2,color:'green'},
  {name:'Zone B',level:'Moderate',score:56,interval:5,color:'blue'},
  {name:'Zone C',level:'Low',score:24,interval:12,color:'low'},
  {name:'Zone D',level:'Moderate',score:51,interval:5,color:'blue'}
];
const demoFootfall={labels:['08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00'],values:[142,196,284,211,232,326,244,188]};
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const vibrate=ms=>{try{navigator.vibrate?.(ms)}catch{}};

// Five sequential camera batches. Each batch is exactly four cameras.
// Priority controls how quickly the scheduler returns to a zone: higher activity = shorter wait.
const batches=[
  [1,2,3,4], [5,6,7,8], [9,10,11,12], [13,14,15,16], [17,18,19,20]
];

function batchZone(batch){
  const first=batch[0]-1;
  return zones[Math.floor(first/5)];
}
function currentBatch(){return batches[batchIndex];}
function isOn(id){return batchOn && currentBatch().includes(id)}

function renderShelves(){
  const root=$('shelves'); root.innerHTML='';
  const base=[
    ['11%','9%'],['30%','9%'],['49%','9%'],['68%','9%'],['84%','9%'],
    ['11%','33%'],['30%','33%'],['49%','33%'],['68%','33%'],['84%','33%'],
    ['11%','57%'],['30%','57%'],['49%','57%'],['68%','57%'],['84%','57%'],
    ['11%','81%'],['30%','81%'],['49%','81%'],['68%','81%'],['84%','81%']
  ];
  base.forEach((pos,i)=>{
    const id=i+1, z=zones[Math.floor(i/5)], on=isOn(id);
    const b=document.createElement('button');
    b.className='shelf'+(id===selectedShelf?' selected':'');
    b.style.left=pos[0]; b.style.top=pos[1];
    b.setAttribute('aria-label',`Shelf ${pad(id)} ${products[i][0]}`);
    b.innerHTML=`<span class="shelf-number">${pad(id)}</span><span class="shelf-name">${products[i][1]}</span><div class="shelf-bottom"><span class="stock-indicator"><i class="${id%9===0?'warn':''}"></i>${id%9===0?'Low':'In stock'}</span><span class="camera-button ${on?'on':'off'}" title="Shelf-cam ${on?'ON':'OFF'}"><i data-lucide="video"></i></span></div>`;
    b.addEventListener('click',e=>{
      e.stopPropagation();
      if(e.target.closest('.camera-button')){selectedShelf=id; vibrate(16); renderAll(); return;}
      selectedShelf=id; vibrate(10); renderAll();
    });
    root.appendChild(b);
  });
  lucide.createIcons();
}

function renderPanel(){
  const i=selectedShelf-1, z=zones[Math.floor(i/5)], on=isOn(selectedShelf);
  const units=42-Math.floor(i*1.45);
  const conf=Math.min(98,91+(i%8));
  const last=on?'2 min ago':`${z.interval+6} min ago`;
  const next=on?`in ${Math.max(1,z.interval-1)} min`:'when batch wakes';
  $('panelShelf').textContent=`Shelf ${pad(selectedShelf)} - ${products[i][0]}`;
  $('reportProduct') && ($('reportProduct').textContent=products[i][1]);
  $('productThumb').textContent=pad(selectedShelf);
  $('productName').textContent=products[i][1];
  $('productCategory').textContent=products[i][0];
  $('stockPill').textContent=units>10?'● IN STOCK':'● LOW STOCK';
  $('stockPill').classList.toggle('off',units<=10);
  $('unitCount').textContent=units;
  $('unitBar').style.width=Math.max(18,Math.min(100,units/55*100))+'%';
  $('lastCaptured').textContent=last;
  $('nextCaptured').textContent=next;
  $('captureInterval').textContent=`${z.interval} min (dynamic)`;
  $('confidence').textContent=`${conf}%`;
  $('misplaced').textContent=i%7===0?'1':'0';
  $('condition').textContent=i%7===0?'Attention':'Normal shelf condition';
  $('cycleTitle').textContent=`Batch ${batchIndex+1} · Cameras ${pad(currentBatch()[0])}–${pad(currentBatch()[3])}`;
  $('cycleMeta').textContent=`${z.name} · ${z.level.toLowerCase()} activity · ${z.interval} min capture interval`;
  $('cycleProgress').textContent=`${batchIndex+1} / ${batches.length}`;
  $('cycleToggle').textContent=batchOn?'Turn OFF current 4':'Turn ON current 4';
  $('cycleToggle').classList.toggle('on',batchOn);
  $('activeCount').textContent=batchOn?'4 cameras':'0 cameras';
}

function renderZoneActivity(){
  $('zoneActivity').innerHTML=zones.map(z=>`<div class="zone-row ${z.color==='blue'?'blue':z.color==='low'?'low':''}"><span>${z.name}</span><div class="zone-track"><i style="width:${z.score}%"></i></div><b>${z.score}%</b></div>`).join('');
}

function renderEvents(){
  const events=[
    ['Shelf 01','OUT OF STOCK','3 min ago','red'],['Shelf 08','Misplaced object','11 min ago','warn'],['Shelf 14','Restocked','24 min ago','green'],['Shelf 03','Normal','28 min ago','green']
  ];
  $('recentEvents').innerHTML=events.map(e=>`<div class="event-row"><i class="event-dot ${e[3]==='red'?'red':e[3]==='warn'?'warn':''}"></i><div><b>${e[0]}</b><span>${e[1]}</span></div><small>${e[2]}</small></div>`).join('');
}

function drawChart(){
  const c=$('footfallChart'); if(!c)return;
  chart?.destroy();
  chart=new Chart(c,{type:'bar',data:{labels:demoFootfall.labels,datasets:[{data:demoFootfall.values,backgroundColor:'#b9dfd0',hoverBackgroundColor:'#55c28d',borderRadius:7,borderSkipped:false,barPercentage:.62,categoryPercentage:.76}]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:700,easing:'easeOutQuart'},interaction:{mode:'nearest',intersect:true},plugins:{legend:{display:false},tooltip:{displayColors:false,backgroundColor:'#26302d',padding:10,cornerRadius:10,callbacks:{label:x=>`${x.raw} people`}}},scales:{x:{grid:{display:false},border:{display:false},ticks:{color:'#8a9590',font:{size:9,weight:'600'}}},y:{beginAtZero:true,grid:{color:'rgba(50,65,59,.08)'},border:{display:false},ticks:{color:'#98a29e',font:{size:8},precision:0}}}}});
}

function setFloor(n){
  floor=n;
  document.querySelectorAll('.floor-btn').forEach(b=>b.classList.toggle('active',Number(b.dataset.floor)===n));
  $('floorTitle').innerHTML=`${n===1?'Ground Floor':'Upper Floor'} <i data-lucide="chevron-down"></i>`;
  $('floorMap').classList.toggle('floor-two',n===2);
  $('previewFloor').textContent=n===1?'Floor 2':'Floor 1';
  lucide.createIcons(); vibrate(15); renderShelves(); renderPanel();
}

function nextBatchByPriority(){
  // Sequential 4-camera coverage is guaranteed. Priority changes the dwell time before the next batch.
  batchIndex=(batchIndex+1)%batches.length;
  batchOn=true;
  renderShelves(); renderPanel();
  scheduleNext();
}
function scheduleNext(){
  clearTimeout(schedulerTimer);
  const z=batchZone(currentBatch());
  // Higher activity gets revisited sooner. This is a prototype scheduler, not a fixed production interval.
  const delay=Math.max(4500,13500-z.score*105);
  schedulerTimer=setTimeout(nextBatchByPriority,delay);
}

async function refreshBackend(){
  try{
    const r=await fetch('/api/dashboard',{cache:'no-store'}); if(!r.ok)return;
    const d=await r.json(); const k=d.kpis||d.metrics||d;
    if(k.footfall!=null)$('footfall').textContent=Number(k.footfall).toLocaleString();
    if(k.avg_wait!=null)$('avgWait').textContent=`${Number(k.avg_wait).toFixed(1)} min`;
    if(k.stockouts!=null)$('stockouts').textContent=Number(k.stockouts).toLocaleString();
    if(k.shelf_availability!=null)$('availability').textContent=`${Number(k.shelf_availability).toFixed(1)}%`;
  }catch(e){/* demo UI remains usable */}
}

function addHaptics(){
  document.querySelectorAll('button,.shelf,.panel,.kpi-card').forEach(el=>el.addEventListener('pointerdown',()=>vibrate(7)));
  document.querySelectorAll('.magnetic').forEach(card=>{
    card.addEventListener('pointermove',e=>{
      if(!matchMedia('(pointer:fine)').matches)return;
      const r=card.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
      card.style.setProperty('--mx',`${e.clientX-r.left}px`); card.style.setProperty('--my',`${e.clientY-r.top}px`);
      card.style.transform=`perspective(900px) rotateX(${(-y*1.7).toFixed(2)}deg) rotateY(${(x*1.7).toFixed(2)}deg) translateY(-2px)`;
    });
    card.addEventListener('pointerleave',()=>card.style.transform='');
  });
}

function updateClock(){
  const now=new Date();
  const date=now.toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'});
  const time=now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});
  if($('clockDate'))$('clockDate').textContent=date;
  if($('clockTime'))$('clockTime').textContent=time;
}
function moveLiquidPill(btn){
  const pill=$('liquidPill'), nav=btn?.parentElement; if(!pill||!nav||!btn)return;
  const nr=nav.getBoundingClientRect(), br=btn.getBoundingClientRect();
  pill.style.transform=`translateY(${br.top-nr.top}px)`; pill.style.height=`${br.height}px`;
}
function setupLiquidNav(){
  const items=[...document.querySelectorAll('.side-item[data-section]')];
  const active=items.find(b=>b.classList.contains('active'))||items[0];
  requestAnimationFrame(()=>moveLiquidPill(active));
  items.forEach(btn=>{
    btn.addEventListener('mouseenter',()=>moveLiquidPill(btn));
    btn.addEventListener('focus',()=>moveLiquidPill(btn));
    btn.addEventListener('click',()=>requestAnimationFrame(()=>moveLiquidPill(btn)));
  });
  document.querySelector('.side-nav')?.addEventListener('mouseleave',()=>moveLiquidPill(document.querySelector('.side-item.active')));
  window.addEventListener('resize',()=>moveLiquidPill(document.querySelector('.side-item.active')));
}
function setupNotifications(){
  const btn=$('notificationBtn'), pop=$('notificationPopover'); if(!btn||!pop)return;
  const notes=[['Out of stock','Maggi — Shelf 01 needs restock.'],['Misplaced item','Shelf 08 has an unidentified object.'],['Camera cycle','Batch 3 scheduled in 2 min.']];
  $('notificationItems').innerHTML=notes.map(n=>`<div class="notification-item"><i data-lucide="bell-ring"></i><div><b>${n[0]}</b><small>${n[1]}</small></div></div>`).join('');
  btn.addEventListener('click',e=>{e.stopPropagation();pop.classList.toggle('hidden');lucide.createIcons()});
  document.addEventListener('click',e=>{if(!pop.contains(e.target)&&e.target!==btn)pop.classList.add('hidden')});
}
function setupSearch(){
  const box=document.querySelector('.search-box'), overlay=$('searchOverlay'), input=$('globalSearch'); if(!box||!overlay)return;
  const open=()=>{overlay.classList.remove('hidden');setTimeout(()=>input?.focus(),40)}; const close=()=>overlay.classList.add('hidden');
  box.addEventListener('click',open); overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open()} if(e.key==='Escape')close()});
}
function init(){
  lucide.createIcons();
  updateClock(); setInterval(updateClock,1000);
  setupNotifications(); setupSearch(); setupLiquidNav();
  renderShelves(); renderPanel(); renderZoneActivity(); renderEvents(); drawChart(); addHaptics();
  $('cycleToggle').addEventListener('click',()=>{batchOn=!batchOn;renderShelves();renderPanel();vibrate(14);if(batchOn)scheduleNext();else clearTimeout(schedulerTimer)});
  document.querySelectorAll('.floor-btn').forEach(b=>b.addEventListener('click',()=>setFloor(Number(b.dataset.floor))));
  $('nextFloor').addEventListener('click',()=>setFloor(floor===1?2:1));
  $('previewFloor').addEventListener('click',()=>setFloor(floor===1?2:1));
  $('detailButton').addEventListener('click',()=>{
    const i=selectedShelf-1,z=zones[Math.floor(i/5)];
    $('modalTitle').textContent=`Shelf ${pad(selectedShelf)} — ${products[i][0]}`;
    $('modalCam').textContent=isOn(selectedShelf)?'ON':'OFF';
    $('modalZone').textContent=z.name;
    $('modalUnits').textContent=42-Math.floor(i*1.45);
    $('modalConf').textContent=`${Math.min(98,91+(i%8))}%`;
    $('modalText').textContent=`${z.name} is ${z.level.toLowerCase()} activity. Shelf-cam ${pad(selectedShelf)} is scheduled ${z.interval} minutes apart. When awake, it captures a JPEG and sends the image to the edge AI pipeline for shelf analysis.`;
    $('detailModal').classList.remove('hidden'); lucide.createIcons(); vibrate(9);
  });
  $('modalClose').addEventListener('click',()=>$('detailModal').classList.add('hidden'));
  $('detailModal').addEventListener('click',e=>{if(e.target.id==='detailModal')$('detailModal').classList.add('hidden')});
  document.querySelectorAll('.side-item').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.side-item').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); vibrate(7);
    if(btn.dataset.section==='store-map')$('storeMapSection').scrollIntoView({behavior:'smooth',block:'start'});
  }));
  $('mobileMenu').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
  scheduleNext(); refreshBackend(); setInterval(refreshBackend,5000);
}

document.addEventListener('DOMContentLoaded',init);


// ---------- Liquid Glass + Retail Intelligence UI ----------
const retailProducts = [
  "Maggi","Coca-Cola","Sprite","Bread","Milk","Biscuits","Shampoo","Soap",
  "Toothpaste","Detergent","Rice","Atta","Cooking Oil","Coffee","Tea",
  "Noodles","Chips","Juice","Chocolate","Baby Care"
];

const workers = ["TARUN","AKASH","YASWANTH","SNAJANA","AMATRA"];
const demoInventory = retailProducts.map((name,i)=>({
  name, shelf:`SHELF ${String(i+1).padStart(2,"0")}`,
  availability:[0,1,2].includes(i)?(i===0?0:18+i*3):72+(i*7)%28,
  units:[0,1,2].includes(i)?0:12+(i*4)%48,
  priority:i<3?"HIGH":i<9?"MEDIUM":"NORMAL"
}));

let activeAlerts = JSON.parse(localStorage.getItem("retailedge_alerts") || "null") || [
  {product:"Maggi", time:"03:12 PM", message:"OUT OF STOCK — Maggi"}
];
function saveAlerts(){localStorage.setItem("retailedge_alerts",JSON.stringify(activeAlerts));}

function renderAlertFeed(){
  const root=$("alertList"), count=$("alertCount");
  if(!root)return;
  count.textContent=activeAlerts.length;
  if(!activeAlerts.length){root.innerHTML='<div class="empty-alert">No active stockout alerts</div>';return;}
  root.innerHTML=activeAlerts.map((a,i)=>`
    <div class="alert-row">
      <i data-lucide="triangle-alert"></i>
      <div><b>${a.message}</b><small>${a.time}</small></div>
      <button onclick="ackAlert(${i})">Restocked</button>
    </div>`).join("");
  lucide.createIcons();
}
window.ackAlert=function(i){
  activeAlerts.splice(i,1); saveAlerts(); renderAlertFeed(); vibrate(12);
};

function renderInventory(){
  const root=$("inventoryGrid"); if(!root)return;
  root.innerHTML=demoInventory.map((p,i)=>{
    const state=p.availability===0?"TO BUY":p.availability<45?"TO REFILL":"AVAILABLE";
    return `<article class="inventory-card">
      <div class="row"><div><span class="eyebrow">${p.shelf}</span><h3>${p.name}</h3></div><b>${state}</b></div>
      <div class="progress"><i style="width:${Math.max(4,p.availability)}%"></i></div>
      <div class="row"><small>${p.units} estimated units</small><small>${p.availability}% available</small></div>
    </article>`;
  }).join("");
}

function renderTeam(){
  const root=$("teamGrid"); if(!root)return;
  root.innerHTML=workers.map((name,i)=>`
    <article class="team-card">
      <div class="row"><div style="display:flex;gap:12px;align-items:center"><div class="worker-avatar">${name[0]}</div><div><h3>${name}</h3><small>${i%2?"Inventory associate":"Store floor associate"}</small></div></div><span class="stock-pill">● ONLINE</span></div>
      <p>Zone ${String.fromCharCode(65+i%4)} · ${i===0?"Available for deployment":"On floor support"}</p>
      <div class="team-actions"><button onclick="deployWorker('${name}')">Deploy</button><button onclick="callWorker('${name}')">Call</button></div>
    </article>`).join("");
}
window.deployWorker=function(name){alert(`${name} deployed to the highest-priority active zone.`);vibrate(12)};
window.callWorker=function(name){alert(`Calling ${name}…`);vibrate(12)};

function renderZoneTable(){
  const root=$("zoneTable"); if(!root)return;
  root.innerHTML=`<div class="zone-row"><b>Zone</b><b>Footfall</b><b>Occupancy</b><b>Dwell</b><b>Camera interval</b></div>`+
    zones.map(z=>`<div class="zone-row"><span>${z.name}</span><span>${Math.round(z.score*8.7)}</span><span>${z.score}%</span><span>${Math.round(2.1+z.score/32)} min</span><span>${z.interval} min</span></div>`).join("");
}

function drawLargeFootfall(){
  const c=$("footfallChartLarge"); if(!c)return;
  new Chart(c,{type:"bar",data:{labels:demoFootfall.labels,datasets:[{data:demoFootfall.values,backgroundColor:"rgba(74,185,137,.34)",hoverBackgroundColor:"rgba(74,185,137,.92)",borderRadius:12,borderSkipped:false}]},
    options:{responsive:true,maintainAspectRatio:false,animation:{duration:800,easing:"easeOutQuart"},plugins:{legend:{display:false},tooltip:{displayColors:false,backgroundColor:"rgba(20,25,32,.88)",cornerRadius:14,padding:12,callbacks:{label:c=>`${c.raw} shoppers`}}},scales:{x:{grid:{display:false},ticks:{color:"#7b8490"}},y:{grid:{color:"rgba(80,95,115,.08)"},ticks:{color:"#7b8490"}}}}});
}

function setupViewNavigation(){
  const ids=["overviewView","storeMapSection","inventoryView","teamView","footfallView","heatmapView","zoneActivityView"];
  const show=section=>{
    ids.forEach(id=>$(id)?.classList.add("hidden-view"));
    const target=section==="overview"?$("overviewView"):
      section==="store-map"?$("storeMapSection"):
      section==="inventory"?$("inventoryView"):
      section==="team"?$("teamView"):
      section==="footfall"?$("footfallView"):
      section==="heatmap"?$("heatmapView"):
      $("zoneActivityView");
    target?.classList.remove("hidden-view");
    if(section==="footfall")setTimeout(drawLargeFootfall,30);
    window.scrollTo({top:0,behavior:"smooth"});
  };
  document.querySelectorAll(".side-item[data-section]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".side-item").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      show(btn.dataset.section);
    });
  });
  show("overview");
}

function setupTheme(){
  const saved=localStorage.getItem("retailedge_theme");
  if(saved==="dark")document.documentElement.classList.add("dark-mode");
  $("themeToggle")?.addEventListener("click",()=>{
    document.documentElement.classList.toggle("dark-mode");
    localStorage.setItem("retailedge_theme",document.documentElement.classList.contains("dark-mode")?"dark":"light");
    vibrate(8);
  });
}

function setupGlassPointer(){
  document.querySelectorAll(".magnetic,.kpi-card,.panel,.shelf-panel,.map-card,.glass-stat,.team-card,.inventory-card").forEach(card=>{
    card.addEventListener("pointermove",e=>{
      if(!matchMedia("(pointer:fine)").matches)return;
      const r=card.getBoundingClientRect();
      const x=e.clientX-r.left, y=e.clientY-r.top;
      const rx=((y/r.height)-.5)*-2.2, ry=((x/r.width)-.5)*2.2;
      card.style.setProperty("--mx",`${x}px`);
      card.style.setProperty("--my",`${y}px`);
      card.style.transform=`perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
    });
    card.addEventListener("pointerleave",()=>{card.style.transform="";});
  });
}

document.addEventListener("DOMContentLoaded",()=>{
  renderAlertFeed();
  renderInventory();
  renderTeam();
  renderZoneTable();
  setupViewNavigation();
  setupTheme();
  setupLiquidNav();
  setupGlassPointer();
});
