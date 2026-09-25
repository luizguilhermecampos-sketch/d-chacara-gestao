(async()=>{
const sb=window.dchacaraSupabase;
if(!sb){document.body.innerHTML='<p style="padding:30px;font-family:sans-serif">Falha ao carregar o Supabase.</p>';return}
const {data:{session},error:sessionError}=await sb.auth.getSession();
if(sessionError||!session){sessionStorage.clear();location.href='index.html';return}
sessionStorage.setItem('dchacara_logged_in','true')
const page=document.body.dataset.page||'dashboard';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='dchacara_cloud_cache_v1';
const PROFILE_PHOTO_KEY='dchacara_profile_photo_cloud_v1';
const profilePhoto=()=>localStorage.getItem(PROFILE_PHOTO_KEY)||'';
const setProfilePhoto=v=>localStorage.setItem(PROFILE_PHOTO_KEY,v);
const blank={products:[],sales:[],entries:[],expenses:[],clients:[],debts:[],payments:[],categories:['Rações','Medicamentos','Utensílios','Ferramentas','Jardinagem'],stockAdjustments:[],expenseCategories:['Fornecedores','Folha','Impostos','Energia','Frete','Manutenção','Outros'],settings:{store:'D Chácara Empório',cnpj:'',phone:'',email:'',address:'',city:'Cristalina',state:'GO',open:'07:00',close:'18:00',alerts:true,alertStock:true,alertDebts:true,backup:true,currency:'BRL',defaultMinStock:5,defaultFiadoDays:30,defaultSeller:'Luiz Silva',payPix:true,payCard:true,payCash:true,payBoleto:true,payFiado:true,lastBackup:''}};
let data=(()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return {...structuredClone(blank),...x}}catch{return structuredClone(blank)}})();
let cloudReady=false, cloudTimer=null, cloudSaving=false, cloudPending=false, cloudStatus='loading';
const updateCloudBadge=()=>{const el=document.querySelector('#cloudStatus');if(!el)return;el.className='cloud-status '+cloudStatus;el.innerHTML=cloudStatus==='online'?'● Online':cloudStatus==='syncing'?'● Sincronizando':'● Offline'};
async function loadCloudState(){
  cloudStatus='loading';
  try{
    const {data:row,error}=await sb.from('app_state').select('payload,updated_at').eq('id','main').maybeSingle();
    if(error)throw error;
    if(row?.payload&&typeof row.payload==='object')data={...structuredClone(blank),...row.payload};
    else {
      data=structuredClone(blank);
      const {error:insertError}=await sb.from('app_state').upsert({id:'main',payload:data,updated_at:new Date().toISOString()});
      if(insertError)throw insertError;
    }
    localStorage.setItem(KEY,JSON.stringify(data));
    cloudReady=true;cloudStatus='online';
  }catch(err){console.error('Supabase load:',err);cloudReady=false;cloudStatus='offline';}
}
async function pushCloudState(force=false){
  if(!cloudReady&&!force)return;
  if(cloudSaving){cloudPending=true;return;}
  cloudSaving=true;cloudStatus='syncing';updateCloudBadge();
  try{
    const {error}=await sb.from('app_state').upsert({id:'main',payload:data,updated_at:new Date().toISOString()});
    if(error)throw error;
    cloudReady=true;cloudStatus='online';
  }catch(err){console.error('Supabase save:',err);cloudStatus='offline';}
  finally{cloudSaving=false;updateCloudBadge();if(cloudPending){cloudPending=false;pushCloudState();}}
}
function queueCloudSave(){clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>pushCloudState(),180);}
const save=()=>{localStorage.setItem(KEY,JSON.stringify(data));queueCloudSave()};
await loadCloudState();
if(!Array.isArray(data.expenseCategories)||!data.expenseCategories.length){data.expenseCategories=[...blank.expenseCategories]}
data.expenseCategories=[...new Set([...(data.expenseCategories||[]), ...(data.expenses||[]).map(e=>e.category).filter(Boolean)])];
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const today=()=>new Date().toISOString().slice(0,10);
const now=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`};
const uid=p=>`${p}-${Date.now()}-${Math.floor(Math.random()*999)}`;
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const icons={home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/>',cart:'<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.5 11h10.7l2.2-8H6.2"/>',box:'<path d="m12 2 8 4.5v11L12 22 4 17.5v-11L12 2Z"/><path d="M12 22V11"/><path d="m20 6.5-8 4.5-8-4.5"/>',tray:'<path d="M4 4h16v5H4z"/><path d="M3 9h18l-2 11H5L3 9Z"/>',wallet:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M16 12h5"/>',users:'<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20V9"/>',report:'<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5M9 13h6M9 17h6"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8A1.6 1.6 0 0 0 3.2 14H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3A1.6 1.6 0 0 0 10 3.2V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8A1.6 1.6 0 0 0 20.8 10H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z"/>',bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',plus:'<path d="M12 5v14M5 12h14"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/>',credit:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>',camera:'<path d="M4 7h4l2-2h4l2 2h4v12H4z"/><circle cx="12" cy="13" r="3"/>',check:'<path d="m5 12 4 4L19 6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',trash:'<path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',bolt:'<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',truck:'<path d="M3 7h11v8H3z"/><path d="M14 10h4l3 3v2h-7z"/><circle cx="7.5" cy="18.5" r="1.5"/><circle cx="17.5" cy="18.5" r="1.5"/>',wrench:'<path d="M14.7 6.3a4 4 0 0 0 4.8 5L11 19.8l-4.8-4.8 8.5-8.7Z"/><path d="m6.5 10.5-3-3 2-2 3 3"/>',receipt:'<path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1-2 1V3z"/><path d="M9 8h6M9 12h6M9 16h4"/>',filter:'<path d="M4 5h16l-6 7v6l-4 2v-8z"/>',paperclip:'<path d="M9 13.5 15.5 7a3 3 0 1 1 4.2 4.2L11 20a5 5 0 0 1-7.1-7.1L13 3.8a2 2 0 1 1 2.8 2.8L7 15.5a1 1 0 1 1-1.4-1.4l7.8-7.8"/>',layers:'<path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/>',bank:'<path d="M3 10h18"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8"/><path d="m2 10 10-6 10 6"/><path d="M3 18h18"/>',ellipsis:'<circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/>'};
const ic=n=>`<svg class="icon" viewBox="0 0 24 24">${icons[n]||icons.box}</svg>`;
const nav=[['dashboard','home','Início'],['vendas','cart','Vendas'],['estoque','box','Estoque'],['entradas','tray','Entradas'],['despesas','wallet','Despesas'],['fiados','credit','Fiados'],['clientes','users','Clientes'],['indicadores','chart','Indicadores e Relatórios'],['configuracoes','settings','Configurações']];
const meta={dashboard:['Início','Acompanhe vendas, estoque, despesas e recebimentos em um só lugar.','TRADIÇÃO<br>PRODUTIVIDADE<br>RESULTADOS'],vendas:['Vendas','Agilize o atendimento com um PDV completo e integrado ao estoque.','DA TERRA<br>PARA GRANDES<br>RESULTADOS'],estoque:['Estoque','Controle seus produtos, evite perdas e mantenha a loja sempre abastecida.','PRODUTOS<br>PARA UM CAMPO<br>MAIS FORTE'],entradas:['Entradas','Registre compras e recebimento de mercadorias dos seus fornecedores.','QUALIDADE<br>NO CAMPO<br>COMEÇA COM<br>BONS INSUMOS'],despesas:['Despesas','Controle seus gastos e acompanhe a saúde financeira do negócio.','PLANEJAMENTO<br>DISCIPLINA<br>RESULTADOS'],fiados:['Fiados','Gerencie contas a receber, vencimentos e pagamentos dos clientes.','CONFIANÇA<br>QUE FAZ O CAMPO<br>CRESCER'],clientes:['Clientes','Cadastre e acompanhe seus clientes de forma simples e organizada.','RELACIONAMENTO<br>QUE GERA<br>RESULTADOS'],indicadores:['Indicadores e Relatórios','Acompanhe vendas, estoque, despesas, fiados e resultados em um único painel.','DADOS<br>VISÃO<br>DECISÃO'],relatorios:['Indicadores e Relatórios','Acompanhe vendas, estoque, despesas, fiados e resultados em um único painel.','DADOS<br>VISÃO<br>DECISÃO'],configuracoes:['Configurações','Personalize o sistema e ajuste o funcionamento da sua operação.','MAIS CONTROLE<br>MAIS SEGURANÇA<br>MAIS PERFORMANCE']};
const clientName=id=>data.clients.find(c=>c.id===id)?.name||'Cliente';
function notifications(){const n=[];const s=data.settings||{};if(s.alerts===false)return n;if(s.alertStock!==false)data.products.filter(p=>+p.stock<=+p.min).forEach(p=>n.push(`Estoque baixo: ${p.name}`));if(s.alertDebts!==false)data.debts.filter(d=>d.status!=='Pago'&&d.due&&new Date(d.due+'T23:59:59')<new Date()).forEach(d=>n.push(`Fiado vencido: ${clientName(d.clientId)} • ${money(d.balance)}`));return n}
function shell(){const m=meta[page];const photo=profilePhoto();document.body.innerHTML=`<div class="app"><aside class="sidebar"><div class="side-brand"><div class="side-logo">D</div><div><strong>D Chácara</strong><small>EMPÓRIO</small></div></div><div class="side-sub">AgroGestão D Chácara</div><nav class="nav">${nav.map(([k,i,l])=>`<a href="${k}.html" class="${page===k?'active':''}"><i>${ic(i)}</i><span>${l}</span></a>`).join('')}</nav></aside><main class="main"><header class="topbar topbar-clean"><span id="cloudStatus" class="cloud-status loading">● Conectando</span><button class="bell" id="bell" aria-label="Notificações">${ic('bell')}<span class="count">${notifications().length}</span></button><div class="notification-menu" id="notif"><div class="notif-head"><h4>Notificações</h4><button class="icon-btn" data-close-notif>${ic('x')}</button></div>${notifications().length?notifications().map(x=>`<div class="notif">${esc(x)}</div>`).join(''):'<div class="notif empty">Nenhuma notificação no momento.</div>'}</div><div class="top-user photo-user"><label class="avatar avatar-photo" title="Clique para alterar sua foto"><input type="file" id="profilePhotoInput" accept="image/*" hidden>${photo?`<img src="${photo}" alt="Foto do usuário">`:'<span>LS</span>'}<em class="avatar-edit">+</em></label><div><strong>${esc(sessionStorage.getItem('dchacara_user_name')||'Luiz Silva')}</strong><small>${esc(sessionStorage.getItem('dchacara_user_role')||'Administrador')}</small></div><button class="logout" id="logout">Sair</button></div></header><div class="content ${page==='dashboard'?'dashboard-content':''}"><section class="hero ${page==='dashboard'?'hero-home':(page==='vendas'?'hero-sales':(page==='despesas'?'hero-expenses':''))}"><div class="hero-copy">${page==='dashboard'?`<div class="hero-home-copy"><h1>Bom dia, Luiz! <span class="sun-icon" aria-hidden="true"><i></i></span></h1><p class="hero-quote">“Trabalho no campo hoje, resultados maiores amanhã.”</p><div class="hero-underline"></div></div>`:`<div><h1>${m[0]}</h1><p>${m[1]}</p>${page==='vendas'?'<div class="hero-underline"></div>':''}</div>`}</div><div class="hero-side ${page==='dashboard'?'hero-home-side':(page==='vendas'?'hero-vendas-side':'')}">${page==='dashboard'?`<div class="hero-tag">TRADIÇÃO<br>PRODUTIVIDADE<br>RESULTADOS</div>`:page==='vendas'?`<div class="hero-tag">${m[2]}</div>`:`<div class="hero-tag">${m[2]}</div>`}</div></section><section class="page" id="page"></section></div></main></div><div class="toast" id="toast"></div><div class="modal" id="modal"><div class="modal-card"><button class="modal-close" id="modalClose" aria-label="Fechar">${ic('x')}</button><div id="modalCard"></div></div></div>`;
$('#logout').onclick=async()=>{await sb.auth.signOut();sessionStorage.clear();location.href='index.html'};
updateCloudBadge();
$('#bell').onclick=()=>$('#notif').classList.toggle('show');
$('[data-close-notif]').onclick=()=>$('#notif').classList.remove('show');
$('#modalClose').onclick=closeModal;
$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
const photoInput=$('#profilePhotoInput');
$('.avatar-photo').onclick=(e)=>{if(e.target.tagName!=='INPUT')photoInput.click()};
photoInput.onchange=(e)=>{const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{setProfilePhoto(r.result);location.reload()};r.readAsDataURL(file)};
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()},{once:false});}
function closeModal(){$('#modal')?.classList.remove('show');}
const toast=t=>{const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2200)};
const modal=h=>{$('#modalCard').innerHTML=h;$('#modal').classList.add('show')};
const badge=s=>`<span class="badge ${/venc|atras|baixo|pend/i.test(s)?'danger':/parcial|a vencer/i.test(s)?'warn':''}">${esc(s)}</span>`;
const actions=(type,id,view=false)=>`<div class="actions">${view?`<button class="icon-btn" data-view-${type}="${id}" title="Ver">${ic('report')}</button>`:''}<button class="icon-btn" data-edit-${type}="${id}" title="Editar">${ic('edit')}</button><button class="icon-btn danger" data-del-${type}="${id}" title="Excluir">${ic('trash')}</button></div>`;
const table=(heads,rows)=>rows.length?`<div class="table-wrap"><table class="table"><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`:`<div class="empty">Nenhum registro ainda.</div>`;
const kpi=(i,l,v,t='',c='')=>`<article class="card hover kpi ${c}"><div class="kpi-icon">${ic(i)}</div><div><small>${l}</small><strong>${v}</strong>${t?`<div class="trend ${c==='danger'?'bad':''}">${t}</div>`:''}</div></article>`;
function chart(values,labels=[],legend='Faturamento'){if(!values.length)return '<div class="empty">Sem dados suficientes para o gráfico.</div>';const max=Math.max(...values,1);return `<div class="chart"><div class="chart-legend"><span><i style="background:#1e9155"></i>${legend}</span></div><div class="bar-chart"><div class="ylabels"><span>${Math.round(max).toLocaleString('pt-BR')}</span><span>${Math.round(max*.75).toLocaleString('pt-BR')}</span><span>${Math.round(max*.5).toLocaleString('pt-BR')}</span><span>${Math.round(max*.25).toLocaleString('pt-BR')}</span><span>0</span></div>${values.map((v,i)=>`<div class="bar-item" style="--h:${Math.max(8,v/max*100)}%" data-tip="${esc(labels[i]||i+1)}: ${money(v)}"><span></span></div>`).join('')}</div></div>`}
const donut=()=>{
  const colors=['#0b6f46','#4da66b','#9cc971','#eda936','#b87540','#7c65c1','#c7ceca'];
  const map={};
  data.sales.forEach(s=>(s.lines||[]).forEach(l=>{const p=data.products.find(x=>x.id===l.productId);const cat=p?.category||'Sem categoria';map[cat]=(map[cat]||0)+((Number(l.price||0)*Number(l.qty||0))-Number(l.discount||0))}));
  const items=Object.entries(map).sort((a,b)=>b[1]-a[1]);
  const total=items.reduce((s,x)=>s+x[1],0);
  if(!items.length||!total)return '<div class=\"dashboard-empty-chart compact\"><div class=\"empty-chart-icon\">'+ic('chart')+'</div><strong>Sem vendas por categoria</strong><span>As categorias aparecerão após registrar vendas.</span></div>';
  let acc=0;const grad=items.map((x,i)=>{const st=acc;acc+=x[1]/total*100;return `${colors[i%colors.length]} ${st}% ${acc}%`}).join(',');
  return `<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${grad})" data-label="${money(total)} faturamento"></div><div class="legend">${items.map((x,i)=>`<div class="legend-row"><span><i class="dot" style="background:${colors[i%colors.length]}"></i>${esc(x[0])}</span><b>${((x[1]/total)*100).toFixed(1).replace('.',',')}%</b></div>`).join('')}</div></div>`
};
const dailySales=()=>{const m={};data.sales.forEach(s=>{const d=(s.date||'').slice(0,10);m[d]=(m[d]||0)+Number(s.total||0)});return Object.entries(m).sort().slice(-30)};
const INVENTORY_DEFAULT_CATEGORIES=['Rações','Medicamentos','Utensílios','Ferramentas','Jardinagem'];
const inventoryNumber=v=>{let s=String(v??'').trim();if(!s)return 0;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else if(s.includes(','))s=s.replace(',','.');return Number(s)||0};
const inventorySlug=s=>String(s||'sem-categoria').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')||'sem-categoria';
function inventoryTone(name){const s=inventorySlug(name);if(s.includes('raco'))return'green';if(s.includes('medic'))return'blue';if(s.includes('utens'))return'gray';if(s.includes('ferr'))return'purple';if(s.includes('jardin'))return'olive';if(s.includes('pet'))return'orange';return'teal'}
function normalizeInventoryData(){
  data.products=(data.products||[]).map((p,i)=>({
    ...p,
    id:p.id||uid('PRD'),
    code:p.code||p.id||`PRD-${String(i+1).padStart(4,'0')}`,
    brand:p.brand||'',
    category:(p.category||'Sem categoria').trim(),
    supplier:p.supplier||'',
    stock:Number(p.stock||0),
    min:Number(p.min||0),
    cost:Number(p.cost||0),
    price:Number(p.price||0),
    photo:p.photo||'',
    description:p.description||''
  }));
  const fromProducts=data.products.map(p=>p.category).filter(Boolean);
  const base=Array.isArray(data.categories)&&data.categories.length?data.categories:INVENTORY_DEFAULT_CATEGORIES;
  data.categories=[...new Set([...INVENTORY_DEFAULT_CATEGORIES,...base,...fromProducts])].map(x=>String(x).trim()).filter(Boolean);
  data.stockAdjustments=Array.isArray(data.stockAdjustments)?data.stockAdjustments:[];
  save();
}
normalizeInventoryData();
const inventoryCategories=()=>[...new Set((data.categories||[]).map(x=>String(x).trim()).filter(Boolean))];
const inventorySuppliers=()=>[...new Set((data.products||[]).map(p=>String(p.supplier||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
const inventoryStatus=p=>Number(p.stock||0)<=Number(p.min||0)?'Baixo Estoque':'Normal';
const inventoryMovesToday=()=>{
  const day=today();
  const entries=(data.entries||[]).filter(e=>String(e.date||'').slice(0,10)===day).length;
  const sales=(data.sales||[]).filter(s=>String(s.date||'').slice(0,10)===day).length;
  const adjustments=(data.stockAdjustments||[]).filter(a=>String(a.date||'').slice(0,10)===day).length;
  return entries+sales+adjustments;
};
function exportInventoryCSV(rows){downloadCSV('estoque.csv',['Código','Produto','Categoria','Marca','Estoque Atual','Estoque Mínimo','Fornecedor','Custo Unit.','Preço Venda','Status'],rows.map(p=>[p.code||p.id,p.name,p.category||'',p.brand||'',p.stock||0,p.min||0,p.supplier||'',p.cost||0,p.price||0,inventoryStatus(p)]))}
function parseSimpleCSV(text){
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  if(!lines.length)return[];
  const delim=(lines[0].match(/;/g)||[]).length>=(lines[0].match(/,/g)||[]).length?';':',';
  return lines.map(line=>line.split(delim).map(cell=>cell.trim().replace(/^"|"$/g,'')));
}
function manageCategoriesModal(){
  const draw=()=>{
    const categories=inventoryCategories();
    modal(`<h3>Gerenciar categorias</h3><p class="modal-subtitle">Adicione novas categorias ou remova as que não usa mais.</p><div class="stock-category-manager"><div class="stock-category-add"><input id="newCategoryName" placeholder="Ex.: Agropecuária, Pet, Sementes"><button class="btn primary" id="addCategoryBtn">${ic('plus')}Adicionar</button></div><div class="stock-category-list">${categories.map(cat=>`<div class="stock-category-row"><span class="stock-cat-badge ${inventoryTone(cat)}">${esc(cat)}</span><small>${data.products.filter(p=>String(p.category||'').trim()===cat).length} produto(s)</small><button class="icon-btn danger" data-remove-category="${esc(cat)}" title="Remover">${ic('trash')}</button></div>`).join('')||'<div class="small-empty">Nenhuma categoria cadastrada.</div>'}</div></div>`);
    $('#addCategoryBtn').onclick=()=>{
      const name=$('#newCategoryName').value.trim();
      if(!name)return toast('Digite o nome da categoria.');
      if(inventoryCategories().some(c=>c.toLowerCase()===name.toLowerCase()))return toast('Essa categoria já existe.');
      data.categories.push(name);
      data.categories=[...new Set(data.categories)];
      save();
      draw();
      if(page==='estoque')renderEstoque();
    };
    $$('[data-remove-category]').forEach(btn=>btn.onclick=()=>{
      const cat=btn.dataset.removeCategory;
      const used=data.products.some(p=>String(p.category||'').trim()===cat);
      if(used&&!confirm(`A categoria "${cat}" está em uso. Ao remover, os produtos ficarão como "Sem categoria". Deseja continuar?`))return;
      if(used){
        data.products.forEach(p=>{if(String(p.category||'').trim()===cat)p.category='Sem categoria'});
        if(!data.categories.includes('Sem categoria'))data.categories.push('Sem categoria');
      }
      data.categories=data.categories.filter(c=>c!==cat);
      save();
      draw();
      if(page==='estoque')renderEstoque();
    });
  };
  draw();
}
function productForm(product=null){
  normalizeInventoryData();
  let photo=product?.photo||'';
  const categories=inventoryCategories();
  modal(`<h3>${product?'Editar':'Novo'} produto</h3><p class="modal-subtitle">Cadastre o item com foto, categoria, fornecedor, custo e preço de venda.</p><div class="form-grid stock-form-grid"><label class="full"><span>Foto do produto</span><div id="photoBox" class="photo-box"></div></label><label>Código<input id="pCode" value="${esc(product?.code||'')}" placeholder="Ex.: PRD-0012"></label><label>Produto<input id="pName" value="${esc(product?.name||'')}" placeholder="Nome do produto"></label><label>Marca<input id="pBrand" value="${esc(product?.brand||'')}" placeholder="Marca"></label><label>Categoria<div class="stock-inline-field"><input id="pCategory" list="categoryList" value="${esc(product?.category||'')}" placeholder="Selecione ou digite"><datalist id="categoryList">${categories.map(cat=>`<option value="${esc(cat)}"></option>`).join('')}</datalist><button type="button" class="btn soft" id="manageCategoryFromProduct">Categorias</button></div></label><label>Fornecedor<input id="pSupplier" value="${esc(product?.supplier||'')}" placeholder="Fornecedor"></label><label>Estoque atual<input id="pStock" type="number" min="0" step="1" value="${Number(product?.stock||0)}"></label><label>Estoque mínimo<input id="pMin" type="number" min="0" step="1" value="${Number(product?.min ?? data.settings?.defaultMinStock ?? 0)}"></label><label>Custo unitário<input id="pCost" type="number" min="0" step="0.01" value="${Number(product?.cost||0)}"></label><label>Preço de venda<input id="pPrice" type="number" min="0" step="0.01" value="${Number(product?.price||0)}"></label><label class="full">Descrição<input id="pDescription" value="${esc(product?.description||'')}" placeholder="Descrição curta do item"></label></div><div class="stock-modal-actions"><button class="btn outline" id="cancelProduct">Cancelar</button><button class="btn primary" id="saveProduct">Salvar produto</button></div>`);
  photoPicker(photo,v=>photo=v);
  $('#cancelProduct').onclick=closeModal;
  $('#manageCategoryFromProduct').onclick=(e)=>{e.preventDefault(); manageCategoriesModal()};
  $('#saveProduct').onclick=()=>{
    const name=$('#pName').value.trim();
    const category=($('#pCategory').value.trim()||'Sem categoria');
    if(!name)return toast('Informe o nome do produto.');
    if(!inventoryCategories().includes(category))data.categories.push(category);
    data.categories=[...new Set(data.categories)];
    const obj=product||{id:uid('PRD')};
    Object.assign(obj,{code:$('#pCode').value.trim()||obj.code||obj.id,name,brand:$('#pBrand').value.trim(),category,supplier:$('#pSupplier').value.trim(),stock:Math.max(0,Number($('#pStock').value||0)),min:Math.max(0,Number($('#pMin').value||0)),cost:Math.max(0,Number($('#pCost').value||0)),price:Math.max(0,Number($('#pPrice').value||0)),photo,description:$('#pDescription').value.trim()});
    if(!product)data.products.push(obj);
    save();
    closeModal();
    if(page==='estoque')renderEstoque();
    if(page==='vendas')renderVendas();
  };
}
function openInventoryAdjustment(productId=''){
  if(!data.products.length)return toast('Cadastre um produto primeiro.');
  modal(`<h3>Ajuste de estoque</h3><p class="modal-subtitle">Atualize a quantidade do item sem precisar abrir uma nova entrada.</p><div class="form-grid"><label class="full">Produto<select id="adjProduct">${data.products.map(p=>`<option value="${p.id}" ${p.id===productId?'selected':''}>${esc(p.name)} • ${esc(p.code||p.id)}</option>`).join('')}</select></label><label>Tipo<select id="adjType"><option value="entrada">Entrada</option><option value="saida">Saída</option><option value="definir">Definir saldo</option></select></label><label>Quantidade<input id="adjQty" type="number" min="0" step="1" value="1"></label><label class="full">Motivo<input id="adjReason" placeholder="Ex.: conferência, quebra, acerto de saldo"></label></div><div class="stock-modal-actions"><button class="btn outline" id="cancelAdj">Cancelar</button><button class="btn primary" id="saveAdj">Aplicar ajuste</button></div>`);
  $('#cancelAdj').onclick=closeModal;
  $('#saveAdj').onclick=()=>{
    const p=data.products.find(x=>x.id===$('#adjProduct').value);
    const type=$('#adjType').value;
    const qty=Math.max(0,Number($('#adjQty').value||0));
    if(!p)return toast('Selecione um produto válido.');
    if(type!=='definir'&&qty<=0)return toast('Informe a quantidade do ajuste.');
    if(type==='entrada')p.stock+=qty;
    else if(type==='saida')p.stock=Math.max(0,p.stock-qty);
    else p.stock=qty;
    data.stockAdjustments.push({id:uid('AJE'),date:now(),productId:p.id,product:p.name,type,qty,reason:$('#adjReason').value.trim()});
    save();
    closeModal();
    renderEstoque();
  };
}
function openInventoryImport(){
  modal(`<h3>Importar produtos</h3><p class="modal-subtitle">Envie um arquivo CSV com colunas como: código, produto, categoria, marca, fornecedor, estoque, mínimo, custo e preço.</p><div class="stock-import-box"><input id="importProductsFile" type="file" accept=".csv,text/csv"><p class="muted">Use ponto e vírgula (;) de preferência. As categorias novas serão criadas automaticamente.</p></div><div class="stock-modal-actions"><button class="btn outline" id="cancelImportProducts">Cancelar</button><button class="btn primary" id="confirmImportProducts">Importar arquivo</button></div>`);
  $('#cancelImportProducts').onclick=closeModal;
  $('#confirmImportProducts').onclick=()=>{
    const file=$('#importProductsFile').files?.[0];
    if(!file)return toast('Selecione um arquivo CSV.');
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const rows=parseSimpleCSV(String(reader.result||''));
        if(rows.length<2)return toast('Arquivo sem dados para importar.');
        const headers=rows.shift().map(h=>inventorySlug(h));
        const idx=name=>headers.findIndex(h=>h===name||h.includes(name));
        const map={code:idx('codigo'),name:idx('produto'),category:idx('categoria'),brand:idx('marca'),supplier:idx('fornecedor'),stock:idx('estoque'),min:idx('minimo'),cost:idx('custo'),price:idx('preco')};
        let count=0;
        rows.forEach(cols=>{
          const name=(cols[map.name]||'').trim();
          if(!name)return;
          const code=(cols[map.code]||'').trim()||uid('PRD');
          const existing=data.products.find(p=>String(p.code||'').trim()===code||String(p.id||'').trim()===code);
          const category=(cols[map.category]||'Sem categoria').trim()||'Sem categoria';
          const obj=existing||{id:uid('PRD'),photo:'',description:''};
          Object.assign(obj,{code,name,category,brand:(cols[map.brand]||'').trim(),supplier:(cols[map.supplier]||'').trim(),stock:inventoryNumber(cols[map.stock]),min:inventoryNumber(cols[map.min]),cost:inventoryNumber(cols[map.cost]),price:inventoryNumber(cols[map.price])});
          if(!existing)data.products.push(obj);
          if(!data.categories.includes(category))data.categories.push(category);
          count++;
        });
        save();
        closeModal();
        renderEstoque();
        toast(`${count} produto(s) importado(s).`);
      }catch(e){toast('Não foi possível importar o arquivo.');}
    };
    reader.readAsText(file,'utf-8');
  };
}

function bindDelete(selector,arr,onBefore){$$(selector).forEach(b=>b.onclick=()=>{const id=b.getAttribute(selector.match(/data-del-([a-z]+)/)?.[0]||'data-id');if(!confirm('Deseja realmente excluir este registro?'))return;const i=arr.findIndex(x=>String(x.id)===String(id));if(i<0)return;if(onBefore)onBefore(arr[i]);arr.splice(i,1);save();location.reload()})}
function photoPicker(initial='',done){let photo=initial;const box=$('#photoBox'),inp=$('#photoInput');const render=()=>{box.innerHTML=photo?`<img src="${photo}"><span>Trocar foto</span><input id="photoInput" type="file" accept="image/*" hidden>`:`<div class="photo-placeholder">${ic('camera')}</div><span>Clique para adicionar uma foto</span><input id="photoInput" type="file" accept="image/*" hidden>`;const ni=$('#photoInput');box.onclick=()=>ni.click();ni.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{photo=ev.target.result;render();done(photo)};r.readAsDataURL(f)}};render();done(photo)}
function renderDashboard(){
  const todaySales = data.sales.filter(s=>(s.date||'').slice(0,10)===today()).reduce((a,b)=>a+Number(b.total||0),0);
  const monthKey=today().slice(0,7);
  const totalSales = data.sales.filter(s=>(s.date||'').slice(0,7)===monthKey).reduce((a,b)=>a+Number(b.total||0),0);
  const totalExpenses = data.expenses.filter(e=>(e.date||'').slice(0,7)===monthKey).reduce((a,b)=>a+Number(b.value||0),0);
  const lowProducts = data.products.filter(p=>+p.stock<=+p.min);
  const pendingDebts = data.debts.filter(d=>d.status!=='Pago');
  const d = dailySales().slice(-30);
  const latestSalesRows = data.sales.slice().reverse().slice(0,5).map((s,i)=>`<tr><td>${esc(String(s.id).slice(-4))}</td><td>${esc((s.date||'').replace('T',' ').slice(0,16))}</td><td>${esc(s.client||'-')}</td><td>${s.items||0}</td><td>${money(s.total)}</td><td>${esc(s.payment||'-')}</td><td>${badge('Concluída')}</td></tr>`);
  const lowStockRows = lowProducts.slice(0,5).map(p=>`<tr><td>${p.photo?`<div class="product-cell"><img class="thumb" src="${p.photo}"><span>${esc(p.name)}</span></div>`:esc(p.name)}</td><td class="txt-warn">${p.stock} un</td><td>${p.min}</td></tr>`);
  const debtRows = pendingDebts.slice(0,5).map(d=>`<tr><td>${esc(clientName(d.clientId))}</td><td>${money(d.balance)}</td><td>${esc(d.due||'-')}</td><td><span class="days-pill">${d.due?Math.max(0,Math.ceil((new Date(d.due+'T23:59:59')-new Date())/86400000))+' dias':'-'}</span></td></tr>`);
  $('#page').innerHTML=`
  <div class="grid kpis kpis-home">
    <article class="card hover stat-home"><div class="stat-icon green">${ic('cart')}</div><div class="stat-copy"><small>Vendas do Dia</small><strong>${money(todaySales)}</strong><div class="trend neutral">Atualizado automaticamente</div></div><div class="stat-spark"></div></article>
    <article class="card hover stat-home"><div class="stat-icon deep">${ic('chart')}</div><div class="stat-copy"><small>Faturamento do Mês</small><strong>${money(totalSales)}</strong><div class="trend neutral">Acumulado das vendas</div></div><div class="stat-spark"></div></article>
    <article class="card hover stat-home"><div class="stat-icon gold">${ic('box')}</div><div class="stat-copy"><small>Produtos em Baixo Estoque</small><strong>${lowProducts.length}</strong><div class="trend ${lowProducts.length?'warn':'neutral'}">${lowProducts.length?'Itens que exigem reposição':'Estoque sem alertas'}</div></div><div class="stat-alert">${lowProducts.length?'!':''}</div></article>
    <article class="card hover stat-home danger-card"><div class="stat-icon rose">${ic('wallet')}</div><div class="stat-copy"><small>Despesas do Mês</small><strong>${money(totalExpenses)}</strong><div class="trend neutral">Total lançado no período</div></div><div class="stat-line"></div></article>
  </div>
  <div class="grid home-main-grid">
    <div class="card sales-chart-card">
      <div class="section-head home-head"><div><h2>Vendas nos Últimos 30 Dias</h2></div><button class="period-chip">Últimos 30 dias</button></div>
      ${d.length?chart(d.map(x=>x[1]),d.map(x=>x[0]),'Vendas'):'<div class="dashboard-empty-chart"><div class="empty-chart-icon">'+ic('chart')+'</div><strong>Nenhuma venda registrada</strong><span>O gráfico será preenchido automaticamente após as primeiras vendas.</span></div>'}
    </div>
    <div class="card mix-card">
      <div class="section-head home-head"><div><h2>Mix de Categorias (Vendas)</h2></div><button class="period-chip">Este mês</button></div>
      ${data.sales.length?donut():'<div class="dashboard-empty-chart compact"><div class="empty-chart-icon">'+ic('chart')+'</div><strong>Sem vendas por categoria</strong><span>As categorias aparecerão após registrar vendas.</span></div>'}
    </div>
    <aside class="card quick-home-card">
      <div class="section-head"><div><h2>Ações Rápidas</h2></div></div>
      <a class="quick-home-btn featured" href="vendas.html"><span class="qicon">${ic('cart')}</span><span>Nova Venda</span><b>›</b></a>
      <a class="quick-home-btn" href="estoque.html"><span class="qicon">${ic('box')}</span><span>Cadastrar Produto</span><b>›</b></a>
      <a class="quick-home-btn" href="despesas.html"><span class="qicon">${ic('wallet')}</span><span>Lançar Despesa</span><b>›</b></a>
      <a class="quick-home-btn" href="clientes.html"><span class="qicon">${ic('users')}</span><span>Consultar Cliente</span><b>›</b></a>
    </aside>
  </div>
  <div class="grid three home-tables-grid">
    <div class="card data-card"><div class="section-head data-head"><div><h2>Últimas Vendas</h2></div><a href="vendas.html">Ver todas →</a></div>${latestSalesRows.length?table(['#','Data','Cliente','Itens','Total','Pagamento','Status'],latestSalesRows):'<div class="small-empty">Nenhuma venda registrada.</div>'}</div>
    <div class="card data-card"><div class="section-head data-head"><div><h2>Produtos em Baixo Estoque</h2></div><a href="estoque.html">Ver todos →</a></div>${lowStockRows.length?table(['Produto','Estoque','Mínimo'],lowStockRows):'<div class="small-empty">Nenhum produto em baixo estoque.</div>'}</div>
    <div class="card data-card"><div class="section-head data-head"><div><h2>Fiados Pendentes</h2></div><a href="fiados.html">Ver todos →</a></div>${debtRows.length?table(['Cliente','Valor','Vencimento','Prazo'],debtRows):'<div class="small-empty">Nenhum fiado pendente.</div>'}</div>
  </div>`
}
function salePaymentLabel(s){return s?.payment||'-'}
function saleFinancialStatus(s){if(!s)return'-';if(s.payment!=='Fiado')return 'Recebida';return s.financialStatus||'Em aberto'}
function saleDebt(saleId){return data.debts.find(d=>d.saleId===saleId)||null}
function syncSaleFromDebt(d){if(!d?.saleId)return;const s=data.sales.find(x=>x.id===d.saleId);if(!s)return;const paid=Math.max(0,Number(d.value||0)-Number(d.balance||0));s.receivedAmount=paid;s.financialStatus=Number(d.balance||0)<=0?'Recebida':paid>0?'Parcial':'Em aberto';}

function restoreSaleStock(sale){
  (sale?.lines||[]).forEach(line=>{
    const p=data.products.find(x=>x.id===line.productId);
    if(p)p.stock=Number(p.stock||0)+Number(line.qty||0);
  });
}
function applySaleStock(lines){
  for(const line of (lines||[])){
    const p=data.products.find(x=>x.id===line.productId);
    if(!p)continue;
    if(Number(line.qty||0)>Number(p.stock||0))return {ok:false,name:p.name,available:Number(p.stock||0)};
  }
  (lines||[]).forEach(line=>{
    const p=data.products.find(x=>x.id===line.productId);
    if(p)p.stock=Number(p.stock||0)-Number(line.qty||0);
  });
  return {ok:true};
}
function saleDebt(saleId){return data.debts.find(d=>d.saleId===saleId)}
function saleHasPayments(saleId){
  const d=saleDebt(saleId);
  return !!(d && data.payments.some(p=>p.debtId===d.id));
}
function deleteSaleRecord(saleId){
  const sale=data.sales.find(s=>s.id===saleId);
  if(!sale)return;
  if(saleHasPayments(saleId))return toast('Essa venda possui pagamento registrado no fiado. Estorne o pagamento antes de excluir a venda.');
  if(!confirm('Excluir esta venda? O estoque dos produtos será devolvido.'))return;
  restoreSaleStock(sale);
  const d=saleDebt(saleId);
  if(d){
    data.payments=data.payments.filter(p=>p.debtId!==d.id);
    data.debts=data.debts.filter(x=>x.id!==d.id);
  }
  data.sales=data.sales.filter(x=>x.id!==saleId);
  save();
  toast('Venda excluída e estoque restaurado.');
  if(page==='vendas')renderVendas(); else location.reload();
}
function editSaleModal(saleId){
  const sale=data.sales.find(s=>s.id===saleId);
  if(!sale)return;
  if(saleHasPayments(saleId))return toast('Essa venda possui pagamento no fiado. Para manter o histórico correto, ela não pode ser editada.');
  const originalLines=(sale.lines||[]).map(x=>({...x}));
  const lineRows=(sale.lines||[]).map((line,i)=>`<tr><td>${esc(line.name||'-')}</td><td><input class="mini-input" data-edit-sale-qty="${i}" type="number" min="1" value="${Number(line.qty||1)}"></td><td><input class="mini-input" data-edit-sale-price="${i}" type="number" min="0" step="0.01" value="${Number(line.price||0)}"></td><td><input class="mini-input" data-edit-sale-discount="${i}" type="number" min="0" step="0.01" value="${Number(line.discount||0)}"></td></tr>`).join('');
  const currentType=sale.paymentType||(String(sale.payment||'').startsWith('Cartão')?'Cartão':sale.payment||'PIX');
  const currentCard=sale.cardType||(/Débito/i.test(sale.payment||'')?'Débito':'Crédito');
  modal(`<h3>Editar venda</h3><p class="modal-subtitle">Ajuste cliente, pagamento e quantidades. O estoque será recalculado automaticamente.</p><div class="form-grid"><label>Cliente<select id="editSaleClient"><option value="">Venda sem cliente</option>${data.clients.map(c=>`<option value="${c.id}" ${c.id===sale.clientId?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><label>Forma de pagamento<select id="editSalePayment">${['PIX','Cartão','Dinheiro','Boleto','Fiado'].map(x=>`<option ${x===currentType?'selected':''}>${x}</option>`).join('')}</select></label><label id="editSaleCardBox">Tipo do cartão<select id="editSaleCard"><option ${currentCard==='Crédito'?'selected':''}>Crédito</option><option ${currentCard==='Débito'?'selected':''}>Débito</option></select></label><label id="editSaleDueBox">Vencimento<input id="editSaleDue" type="date" value="${saleDebt(sale.id)?.due||new Date(Date.now()+30*86400000).toISOString().slice(0,10)}"></label><label class="full">Observações<input id="editSaleObs" value="${esc(sale.obs||'')}"></label></div><div class="table-wrap"><table class="table"><thead><tr><th>Produto</th><th>Qtd.</th><th>Valor unit.</th><th>Desconto</th></tr></thead><tbody>${lineRows}</tbody></table></div><div class="stock-modal-actions"><button class="btn outline" id="cancelEditSale">Cancelar</button><button class="btn primary" id="saveEditSale">Salvar alterações</button></div>`);
  const toggleExtras=()=>{
    const pay=$('#editSalePayment').value;
    $('#editSaleCardBox').hidden=pay!=='Cartão';
    $('#editSaleDueBox').hidden=pay!=='Fiado';
  };
  $('#editSalePayment').onchange=toggleExtras;
  toggleExtras();
  $('#cancelEditSale').onclick=closeModal;
  $('#saveEditSale').onclick=()=>{
    const paymentType=$('#editSalePayment').value;
    const clientId=$('#editSaleClient').value;
    if(paymentType==='Fiado'&&!clientId)return toast('Venda fiada precisa de cliente cadastrado.');
    const newLines=(sale.lines||[]).map((line,i)=>({
      ...line,
      qty:Math.max(1,Number($(`[data-edit-sale-qty="${i}"]`).value||1)),
      price:Math.max(0,Number($(`[data-edit-sale-price="${i}"]`).value||0)),
      discount:Math.max(0,Number($(`[data-edit-sale-discount="${i}"]`).value||0))
    }));
    restoreSaleStock(sale);
    const applied=applySaleStock(newLines);
    if(!applied.ok){
      applySaleStock(originalLines);
      return toast(`Estoque insuficiente para ${applied.name}. Disponível: ${applied.available}.`);
    }
    const newTotal=newLines.reduce((s,l)=>s+(l.qty*l.price)-Number(l.discount||0),0);
    const cardType=$('#editSaleCard').value;
    sale.lines=newLines;
    sale.items=newLines.reduce((s,l)=>s+Number(l.qty||0),0);
    sale.total=newTotal;
    sale.clientId=clientId;
    sale.client=clientId?clientName(clientId):'';
    sale.paymentType=paymentType;
    sale.cardType=paymentType==='Cartão'?cardType:'';
    sale.payment=paymentType==='Cartão'?`Cartão - ${cardType}`:paymentType;
    sale.obs=$('#editSaleObs').value.trim();
    let debt=saleDebt(sale.id);
    if(paymentType==='Fiado'){
      if(!debt){
        debt={id:uid('FIA'),clientId,saleId:sale.id,description:`Venda fiada • ${newLines.map(x=>`${x.qty}x ${x.name}`).join(', ')}`,value:newTotal,balance:newTotal,due:$('#editSaleDue').value,status:'Em aberto',createdAt:now()};
        data.debts.push(debt);
      }else{
        debt.clientId=clientId;
        debt.description=`Venda fiada • ${newLines.map(x=>`${x.qty}x ${x.name}`).join(', ')}`;
        debt.value=newTotal;
        debt.balance=newTotal;
        debt.due=$('#editSaleDue').value;
        debt.status='Em aberto';
      }
      sale.financialStatus='Em aberto';
      sale.receivedAmount=0;
    }else{
      if(debt)data.debts=data.debts.filter(d=>d.id!==debt.id);
      sale.financialStatus='Recebida';
      sale.receivedAmount=newTotal;
    }
    save();
    closeModal();
    toast('Venda atualizada com sucesso.');
    renderVendas();
  };
}


function pdfLatin1(text){
  return String(text??'')
    .replace(/[–—]/g,'-')
    .replace(/[“”]/g,'"')
    .replace(/[‘’]/g,"'")
    .replace(/•/g,'-')
    .replace(/[^\x00-\xFF]/g,'?');
}
function pdfEsc(text){
  return pdfLatin1(text).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
}
function pdfBytes(str){
  const out=new Uint8Array(str.length);
  for(let i=0;i<str.length;i++)out[i]=str.charCodeAt(i)&255;
  return out;
}
function pdfMoney(v){
  return `R$ ${Number(v||0).toFixed(2).replace('.',',')}`;
}
function pdfDateTime(value){
  const raw=String(value||now());
  const [d,t=''] = raw.split(' ');
  const parts=d.split('-');
  return parts.length===3?`${parts[2]}/${parts[1]}/${parts[0]}${t?' '+t:''}`:raw;
}
function pdfTruncate(text,max=34){
  const s=pdfLatin1(text);
  return s.length>max?s.slice(0,max-3)+'...':s;
}
function makeSimplePdf(pages){
  const objects=[];
  objects[1]='<< /Type /Catalog /Pages 2 0 R >>';
  objects[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[4]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

  const pageRefs=[];
  let obj=5;
  pages.forEach(content=>{
    const pageObj=obj++;
    const contentObj=obj++;
    pageRefs.push(`${pageObj} 0 R`);
    objects[pageObj]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObj} 0 R >>`;
    objects[contentObj]=`<< /Length ${pdfBytes(content).length} >>\nstream\n${content}\nendstream`;
  });
  objects[2]=`<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pages.length} >>`;

  let output='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets=[0];
  for(let i=1;i<objects.length;i++){
    offsets[i]=pdfBytes(output).length;
    output+=`${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset=pdfBytes(output).length;
  output+=`xref\n0 ${objects.length}\n`;
  output+='0000000000 65535 f \n';
  for(let i=1;i<objects.length;i++)output+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
  output+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdfBytes(output)],{type:'application/pdf'});
}
function downloadBudgetPdf(cart,clientId,obs=''){
  if(!cart?.length)return toast('Adicione produtos antes de gerar o orçamento.');
  const s={...blank.settings,...(data.settings||{})};
  const client=data.clients.find(c=>c.id===clientId);
  const subtotal=cart.reduce((a,x)=>a+Number(x.qty||0)*Number(x.price||0),0);
  const discount=cart.reduce((a,x)=>a+Number(x.discount||0),0);
  const total=Math.max(0,subtotal-discount);
  const budgetId=`ORC-${Date.now().toString().slice(-8)}`;
  const lines=cart.map(x=>({
    name:x.name||'Produto',
    qty:Number(x.qty||0),
    price:Number(x.price||0),
    discount:Number(x.discount||0),
    total:(Number(x.qty||0)*Number(x.price||0))-Number(x.discount||0)
  }));

  const pages=[];
  const perPage=18;
  const chunks=[];
  for(let i=0;i<lines.length;i+=perPage)chunks.push(lines.slice(i,i+perPage));
  if(!chunks.length)chunks.push([]);

  chunks.forEach((chunk,pageIndex)=>{
    let c='';
    c+='0.04 0.43 0.27 rg 0 792 595 50 re f\n';
    c+=`BT /F2 19 Tf 1 1 1 rg 42 815 Td (${pdfEsc(s.store||'D Chácara Empório')}) Tj ET\n`;
    c+=`BT /F1 9 Tf 1 1 1 rg 42 799 Td (ORCAMENTO ${pdfEsc(budgetId)}) Tj ET\n`;
    c+='0 0 0 rg\n';

    if(pageIndex===0){
      let y=770;
      const info=[
        `CNPJ: ${s.cnpj||'-'}   Telefone: ${s.phone||'-'}`,
        `E-mail: ${s.email||'-'}`,
        `Endereco: ${s.address||'-'} - ${s.city||'-'}/${s.state||'-'}`,
        `Data: ${pdfDateTime(now())}`
      ];
      info.forEach(t=>{c+=`BT /F1 9 Tf 0.15 0.2 0.17 rg 42 ${y} Td (${pdfEsc(t)}) Tj ET\n`;y-=14});
      y-=3;
      c+=`0.84 0.9 0.86 RG 42 ${y} m 553 ${y} l S\n`;
      y-=19;
      c+=`BT /F2 11 Tf 0.04 0.43 0.27 rg 42 ${y} Td (DADOS DO CLIENTE) Tj ET\n`;
      y-=16;
      const clientLines=[
        `Cliente: ${client?.name||'Nao informado'}`,
        `CPF/CNPJ: ${client?.document||'-'}   Telefone: ${client?.phone||'-'}`,
        `E-mail: ${client?.email||'-'}   Cidade: ${client?.city||'-'}`
      ];
      clientLines.forEach(t=>{c+=`BT /F1 9 Tf 0.15 0.2 0.17 rg 42 ${y} Td (${pdfEsc(t)}) Tj ET\n`;y-=14});
      y-=5;
      c+=`0.84 0.9 0.86 RG 42 ${y} m 553 ${y} l S\n`;
      y-=22;

      c+=`0.94 0.97 0.95 rg 42 ${y-5} 511 22 re f\n`;
      c+=`BT /F2 8 Tf 0.1 0.28 0.19 rg 48 ${y+2} Td (PRODUTO) Tj ET\n`;
      c+=`BT /F2 8 Tf 0.1 0.28 0.19 rg 310 ${y+2} Td (QTD) Tj ET\n`;
      c+=`BT /F2 8 Tf 0.1 0.28 0.19 rg 355 ${y+2} Td (UNIT.) Tj ET\n`;
      c+=`BT /F2 8 Tf 0.1 0.28 0.19 rg 425 ${y+2} Td (DESC.) Tj ET\n`;
      c+=`BT /F2 8 Tf 0.1 0.28 0.19 rg 490 ${y+2} Td (TOTAL) Tj ET\n`;
      y-=25;

      chunk.forEach(item=>{
        c+=`BT /F1 8.5 Tf 0.12 0.18 0.15 rg 48 ${y} Td (${pdfEsc(pdfTruncate(item.name,38))}) Tj ET\n`;
        c+=`BT /F1 8.5 Tf 0.12 0.18 0.15 rg 315 ${y} Td (${item.qty}) Tj ET\n`;
        c+=`BT /F1 8.5 Tf 0.12 0.18 0.15 rg 355 ${y} Td (${pdfEsc(pdfMoney(item.price))}) Tj ET\n`;
        c+=`BT /F1 8.5 Tf 0.12 0.18 0.15 rg 425 ${y} Td (${pdfEsc(pdfMoney(item.discount))}) Tj ET\n`;
        c+=`BT /F1 8.5 Tf 0.12 0.18 0.15 rg 490 ${y} Td (${pdfEsc(pdfMoney(item.total))}) Tj ET\n`;
        c+=`0.9 0.93 0.91 RG 42 ${y-6} m 553 ${y-6} l S\n`;
        y-=24;
      });

      if(pageIndex===chunks.length-1){
        y-=8;
        c+=`BT /F1 9 Tf 0.2 0.25 0.22 rg 385 ${y} Td (Subtotal:) Tj ET\n`;
        c+=`BT /F2 9 Tf 0.1 0.2 0.15 rg 485 ${y} Td (${pdfEsc(pdfMoney(subtotal))}) Tj ET\n`;
        y-=16;
        c+=`BT /F1 9 Tf 0.2 0.25 0.22 rg 385 ${y} Td (Descontos:) Tj ET\n`;
        c+=`BT /F2 9 Tf 0.7 0.15 0.15 rg 485 ${y} Td (${pdfEsc(pdfMoney(discount))}) Tj ET\n`;
        y-=22;
        c+=`0.04 0.43 0.27 rg 365 ${y-8} 188 28 re f\n`;
        c+=`BT /F2 12 Tf 1 1 1 rg 380 ${y+1} Td (TOTAL: ${pdfEsc(pdfMoney(total))}) Tj ET\n`;
        y-=42;
        if(obs){
          c+=`BT /F2 9 Tf 0.04 0.43 0.27 rg 42 ${y} Td (OBSERVACOES) Tj ET\n`;
          y-=15;
          const text=pdfTruncate(obs,95);
          c+=`BT /F1 8.5 Tf 0.2 0.25 0.22 rg 42 ${y} Td (${pdfEsc(text)}) Tj ET\n`;
        }
      }
    }else{
      let y=755;
      c+=`BT /F2 11 Tf 0.04 0.43 0.27 rg 42 ${y} Td (CONTINUACAO DOS PRODUTOS) Tj ET\n`;
      y-=24;
      chunk.forEach(item=>{
        c+=`BT /F1 8.5 Tf 0.12 0.18 0.15 rg 48 ${y} Td (${pdfEsc(pdfTruncate(item.name,38))}) Tj ET\n`;
        c+=`BT /F1 8.5 Tf 0.12 0.18 0.15 rg 315 ${y} Td (${item.qty}) Tj ET\n`;
        c+=`BT /F1 8.5 Tf 0.12 0.18 0.15 rg 355 ${y} Td (${pdfEsc(pdfMoney(item.price))}) Tj ET\n`;
        c+=`BT /F1 8.5 Tf 0.12 0.18 0.15 rg 490 ${y} Td (${pdfEsc(pdfMoney(item.total))}) Tj ET\n`;
        c+=`0.9 0.93 0.91 RG 42 ${y-6} m 553 ${y-6} l S\n`;
        y-=24;
      });
      if(pageIndex===chunks.length-1){
        y-=15;
        c+=`0.04 0.43 0.27 rg 365 ${y-8} 188 28 re f\n`;
        c+=`BT /F2 12 Tf 1 1 1 rg 380 ${y+1} Td (TOTAL: ${pdfEsc(pdfMoney(total))}) Tj ET\n`;
      }
    }

    c+=`BT /F1 7.5 Tf 0.4 0.5 0.44 rg 42 24 Td (Documento gerado pelo AgroGestao D Chacara - Pagina ${pageIndex+1}/${chunks.length}) Tj ET\n`;
    pages.push(c);
  });

  const blob=makeSimplePdf(pages);
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`orcamento_${budgetId}_${today()}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  toast('Orçamento em PDF gerado com sucesso.');
}
function printSaleReceipt(sale){
  if(!sale)return toast('Nenhuma venda disponível para imprimir.');
  const s={...blank.settings,...(data.settings||{})};
  const client=data.clients.find(c=>c.id===sale.clientId);
  const lines=(sale.lines||[]);
  const subtotal=lines.reduce((a,x)=>a+Number(x.qty||0)*Number(x.price||0),0);
  const discount=lines.reduce((a,x)=>a+Number(x.discount||0),0);
  const total=Number(sale.total||Math.max(0,subtotal-discount));
  const win=window.open('','_blank','width=820,height=900');
  if(!win)return toast('O navegador bloqueou a janela de impressão.');
  const itemRows=lines.map(x=>`<tr><td><strong>${esc(x.name||'Produto')}</strong><small>${esc(x.productId||'')}</small></td><td>${Number(x.qty||0)}</td><td>${money(x.price||0)}</td><td>${Number(x.discount||0)>0?money(x.discount):'-'}</td><td>${money((Number(x.qty||0)*Number(x.price||0))-Number(x.discount||0))}</td></tr>`).join('');
  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Comprovante de venda</title><style>
  *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#17251e;margin:0;background:#f2f4f1}.paper{width:760px;margin:24px auto;background:#fff;padding:28px 34px;border:1px solid #d8e1da;border-radius:16px}.head{display:flex;justify-content:space-between;gap:20px;border-bottom:3px solid #087649;padding-bottom:16px}.brand h1{margin:0;color:#075f3c;font-size:25px}.brand p,.meta p{margin:4px 0;font-size:12px;color:#58695f}.meta{text-align:right}.title{margin:22px 0 8px;font-size:20px}.client{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;padding:12px;background:#f4f8f5;border-radius:10px;font-size:12px}.client strong{display:block;font-size:10px;text-transform:uppercase;color:#718078;margin-bottom:3px}table{width:100%;border-collapse:collapse;margin-top:18px}th{background:#eaf4ed;color:#1b4b34;text-align:left;font-size:10px;padding:9px}td{font-size:11px;padding:10px 9px;border-bottom:1px solid #e5e9e6}td small{display:block;color:#849087;margin-top:3px}.totals{width:320px;margin:18px 0 0 auto}.totals div{display:flex;justify-content:space-between;padding:6px 0;font-size:12px}.totals .final{font-size:18px;font-weight:800;color:#087649;border-top:2px solid #dbe8df;margin-top:4px;padding-top:10px}.foot{margin-top:24px;padding-top:14px;border-top:1px dashed #cfd8d2;text-align:center;font-size:10px;color:#6f7d75}.print{display:block;margin:16px auto 0;border:0;background:#087649;color:#fff;padding:11px 18px;border-radius:9px;font-weight:700}@media print{body{background:#fff}.paper{margin:0;width:100%;border:0;border-radius:0}.print{display:none}}</style></head><body><div class="paper">
  <div class="head"><div class="brand"><h1>${esc(s.store||'D Chácara Empório')}</h1><p>CNPJ: ${esc(s.cnpj||'-')}</p><p>${esc(s.email||'')} ${s.phone?' • '+esc(s.phone):''}</p><p>${esc(s.address||'')} ${s.city?' - '+esc(s.city):''}${s.state?'/'+esc(s.state):''}</p></div><div class="meta"><strong>COMPROVANTE DE VENDA</strong><p>Venda: ${esc(sale.id||'-')}</p><p>${esc(pdfDateTime(sale.date))}</p><p>Vendedor: ${esc(sale.seller||'-')}</p></div></div>
  <h2 class="title">Dados da venda</h2>
  <div class="client"><div><strong>Cliente</strong>${esc(client?.name||sale.client||'Venda sem cliente')}</div><div><strong>CPF/CNPJ</strong>${esc(client?.document||'-')}</div><div><strong>Telefone</strong>${esc(client?.phone||'-')}</div><div><strong>Pagamento</strong>${esc(salePaymentLabel(sale))}</div></div>
  <table><thead><tr><th>Produto</th><th>Qtd.</th><th>Unit.</th><th>Desc.</th><th>Total</th></tr></thead><tbody>${itemRows||'<tr><td colspan="5">Itens não disponíveis.</td></tr>'}</tbody></table>
  <div class="totals"><div><span>Subtotal</span><b>${money(subtotal)}</b></div><div><span>Descontos</span><b>${money(discount)}</b></div><div class="final"><span>Total</span><span>${money(total)}</span></div></div>
  ${sale.obs?`<p style="font-size:11px;margin-top:18px"><strong>Observações:</strong> ${esc(sale.obs)}</p>`:''}
  <div class="foot">Obrigado pela preferência. Este comprovante foi gerado pelo AgroGestão D Chácara.</div>
  <button class="print" onclick="window.print()">Imprimir comprovante</button>
  </div><script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);
  win.document.close();
}

function renderVendas(){
  const saleSettings={...blank.settings,...(data.settings||{})};
  const paymentDefs=[
    saleSettings.payPix!==false&&{name:'PIX',icon:'check',desc:'Aprovação imediata'},
    saleSettings.payCard!==false&&{name:'Cartão',icon:'credit',desc:'Crédito ou débito'},
    saleSettings.payCash!==false&&{name:'Dinheiro',icon:'wallet',desc:'Registro manual'},
    saleSettings.payBoleto!==false&&{name:'Boleto',icon:'report',desc:'Compensação bancária'},
    saleSettings.payFiado!==false&&{name:'Fiado',icon:'users',desc:'Cria conta a receber'}
  ].filter(Boolean);
  let cart=[];
  let selectedClient='';
  let payment=paymentDefs[0]?.name||'';
  let cardType='Crédito';
  const productsAvailable=()=>data.products.filter(p=>Number(p.stock||0)>0);
  const findProduct=(term)=>{term=String(term||'').trim().toLowerCase();if(!term)return null;return productsAvailable().find(p=>String(p.name||'').toLowerCase()===term)||productsAvailable().find(p=>String(p.code||'').toLowerCase()===term)||productsAvailable().find(p=>String(p.name||'').toLowerCase().includes(term))||null};
  const productOptions=()=>productsAvailable().map(p=>`<option value="${esc(p.name)}"></option>`).join('');
  const subtotal=()=>cart.reduce((s,x)=>s+Number(x.qty||0)*Number(x.price||0),0);
  const discounts=()=>cart.reduce((s,x)=>s+Number(x.discount||0),0);
  const grandTotal=()=>Math.max(0,subtotal()-discounts());
  const salesToday=()=>data.sales.filter(s=>(s.date||'').slice(0,10)===today());
  const draw=()=>{
    const rows=cart.map((x,i)=>`<tr><td><div class="product-sale-cell">${x.photo?`<img class="thumb sale-photo" src="${x.photo}">`:`<span class="sale-thumb-fallback">${ic('box')}</span>`}<div><strong>${esc(x.name)}</strong><small>${esc(x.code||x.id)}</small></div></div></td><td class="${Number(x.stock)<=10?'txt-warn':'txt-ok'}">${x.stock} un</td><td><div class="qty"><button data-dec="${i}">−</button><span>${x.qty}</span><button data-inc="${i}">+</button></div></td><td><input class="mini-input" data-price="${i}" type="number" min="0" step="0.01" value="${x.price}"></td><td><input class="mini-input" data-discount="${i}" type="number" min="0" step="0.01" value="${x.discount||0}"></td><td><strong>${money((x.qty*x.price)-Number(x.discount||0))}</strong></td><td><button class="icon-btn danger" data-rm="${i}">${ic('trash')}</button></td></tr>`).join('');
    $('#pdvCart').innerHTML=cart.length?`<div class="table-wrap sales-table-wrap"><table class="table sales-table"><thead><tr><th>Produto</th><th>Estoque</th><th>Quantidade</th><th>Valor unit.</th><th>Desconto</th><th>Total</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table></div>`:`<div class="pdv-empty-cart">${ic('cart')}<strong>Carrinho vazio</strong><small>Pesquise um produto acima e clique em <b>Lançar produto</b>.</small></div>`;
    const itemCount=cart.reduce((s,x)=>s+Number(x.qty||0),0);
    $('#pdvItemCount').textContent=`${cart.length} produto${cart.length===1?'':'s'}`;
    $('#summaryItemCount').textContent=`Subtotal (${itemCount} itens)`;
    $('#pdvSubtotal').textContent=money(subtotal());
    $('#pdvDiscount').textContent='- '+money(discounts());
    $('#pdvTotal').textContent=money(grandTotal());
    const received=Number($('#received')?.value||0);
    if($('#pdvChange'))$('#pdvChange').textContent=money(Math.max(0,received-grandTotal()));
    if($('#clientSelected'))$('#clientSelected').innerHTML=selectedClient?`<div class="selected-client compact"><div class="selected-client-icon">${ic('users')}</div><div><strong>${esc(clientName(selectedClient))}</strong><small>Cliente selecionado para esta venda</small></div><button class="icon-btn" id="clearSaleClient">${ic('x')}</button></div>`:'';
    if($('#clearSaleClient'))$('#clearSaleClient').onclick=()=>{selectedClient='';$('#clientSelect').value='';draw()};
    $$('#pdvCart [data-rm]').forEach(b=>b.onclick=()=>{cart.splice(Number(b.dataset.rm),1);draw()});
    $$('#pdvCart [data-inc]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.inc);if(cart[i].qty<cart[i].stock)cart[i].qty++;draw()});
    $$('#pdvCart [data-dec]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.dec);if(cart[i].qty>1)cart[i].qty--;draw()});
    $$('#pdvCart [data-price]').forEach(el=>el.oninput=()=>{cart[Number(el.dataset.price)].price=Math.max(0,Number(el.value||0));draw()});
    $$('#pdvCart [data-discount]').forEach(el=>el.oninput=()=>{cart[Number(el.dataset.discount)].discount=Math.max(0,Number(el.value||0));draw()});
    $$('.pdv-pay').forEach(b=>{b.classList.toggle('active',b.dataset.pay===payment);b.onclick=()=>{payment=b.dataset.pay;draw()}});
    const cardBox=$('#cardTypeBox'),fiadoBox=$('#fiadoBox'),receivedRow=$('#receivedRow');
    if(cardBox)cardBox.hidden=payment!=='Cartão';
    if(fiadoBox)fiadoBox.hidden=payment!=='Fiado';
    if(receivedRow)receivedRow.hidden=payment==='Fiado';
    if($('#cardType'))$('#cardType').value=cardType;
  };
  const addProduct=()=>{
    const p=findProduct($('#productSearch').value);
    const qty=Math.max(1,Number($('#quickQty').value||1));
    if(!p)return toast('Selecione um produto cadastrado.');
    const current=cart.find(x=>x.id===p.id),already=current?current.qty:0;
    if(already+qty>Number(p.stock||0))return toast('Quantidade maior que o estoque disponível.');
    if(current)current.qty+=qty;else cart.push({...p,qty,discount:0});
    $('#productSearch').value='';$('#quickQty').value=1;draw();
  };
  const recentRows=data.sales.slice().reverse().slice(0,6).map((s,i)=>`<tr><td>${esc(String(s.id).slice(-4))}</td><td>${esc(s.client||'Sem cliente')}</td><td>${s.items||0}</td><td>${money(s.total)}</td><td>${esc(salePaymentLabel(s))}</td><td><div class="sale-row-actions"><button class="icon-btn" data-print-sale="${s.id}" title="Imprimir comprovante">${ic('report')}</button><button class="icon-btn" data-edit-sale="${s.id}" title="Editar">${ic('edit')}</button><button class="icon-btn danger" data-delete-sale="${s.id}" title="Excluir">${ic('trash')}</button></div></td></tr>`).join('');
  $('#page').innerHTML=`<div class="pdv-layout"><section class="pdv-main">
  <div class="card pdv-toolbar-card">
    <div class="pdv-toolbar-title"><div class="pdv-icon-title">${ic('cart')}</div><div><h2>Nova venda</h2><p>Selecione os produtos, confira os valores e finalize o atendimento.</p></div></div>
    <div class="pdv-product-line">
      <label class="pdv-product-field"><span>Produto</span><div class="pdv-search"><i>${ic('report')}</i><input id="productSearch" list="productList" placeholder="Buscar produto por nome ou código..."><datalist id="productList">${productOptions()}</datalist></div></label>
      <label class="pdv-quick-qty"><span>Quantidade</span><input id="quickQty" type="number" min="1" value="1"></label>
      <button id="addProductBtn" class="pdv-launch-product">${ic('plus')}Lançar produto</button>
    </div>
    <div class="pdv-customer-row">
      <label><span>${ic('users')} Cliente</span><select id="clientSelect"><option value="">Venda sem cliente</option>${data.clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label>
      <a href="clientes.html" class="pdv-new-client">${ic('plus')} Novo cliente</a>
      <label class="pdv-seller"><span>${ic('users')} Vendedor</span><input id="seller" value="${esc(saleSettings.defaultSeller||'Luiz Silva')}"></label>
    </div><div id="clientSelected"></div>
  </div>

  <div class="card pdv-items"><div class="pdv-section-head"><div><h2>${ic('tray')} Itens da venda</h2><span id="pdvItemCount">0 produtos</span></div><div><button id="clearCart" class="pdv-btn subtle danger">${ic('trash')} Limpar carrinho</button></div></div><div id="pdvCart"></div><div class="pdv-note-row"><label><span>${ic('report')} Observações</span><input id="saleObs" placeholder="Informações adicionais sobre a venda..."></label><div class="pdv-photo-note">${ic('camera')} <span>A foto cadastrada no estoque aparece automaticamente no item da venda.</span></div></div></div>

  <div class="card pdv-payment"><div class="pdv-section-head"><div><h2>${ic('wallet')} Forma de pagamento</h2></div></div>
    <div class="pdv-pay-grid ${paymentDefs.length>=5?'pdv-pay-grid-five':''}">
      ${paymentDefs.map((p,i)=>`<button class="pdv-pay ${i===0?'active':''} ${p.name==='Fiado'?'fiado':''}" data-pay="${p.name}"><span>${ic(p.icon)}</span><b>${p.name}</b><small>${p.desc}</small></button>`).join('')||'<div class="small-empty">Nenhuma forma de pagamento habilitada. Ative uma opção em Configurações.</div>'}
    </div>
    <div class="pdv-payment-options">
      <label id="cardTypeBox" class="pdv-card-type" hidden><span>Tipo do cartão</span><select id="cardType"><option>Crédito</option><option>Débito</option></select></label>
      <div id="fiadoBox" class="pdv-fiado-box" hidden><div>${ic('users')}<div><strong>Venda fiada</strong><small>É obrigatório selecionar um cliente cadastrado.</small></div></div><label><span>Vencimento</span><input id="fiadoDue" type="date" value="${new Date(Date.now()+Math.max(1,Number(saleSettings.defaultFiadoDays||30))*86400000).toISOString().slice(0,10)}"></label></div>
    </div>
    <div class="pdv-received-row" id="receivedRow"><label><span>Valor recebido</span><input id="received" type="number" min="0" step="0.01" value="0"></label><div class="pdv-change"><span>Troco</span><strong id="pdvChange">R$ 0,00</strong></div></div>
  </div>
  </section>
  <aside class="pdv-side">
    <div class="card pdv-summary"><div class="pdv-side-title">${ic('chart')} <h2>Resumo da venda</h2></div><div class="pdv-summary-row"><span id="summaryItemCount">Subtotal (0 itens)</span><b id="pdvSubtotal">R$ 0,00</b></div><div class="pdv-summary-row red"><span>Descontos</span><b id="pdvDiscount">- R$ 0,00</b></div><div class="pdv-summary-total"><span>Total final</span><strong id="pdvTotal">R$ 0,00</strong></div><button id="finishSale" class="pdv-finish">${ic('check')} Finalizar venda <b>›</b></button><button id="saveBudget" class="pdv-side-action">${ic('report')} Salvar orçamento</button><button id="printReceipt" class="pdv-side-action">${ic('report')} Imprimir comprovante</button></div>
    <div class="card pdv-today"><div class="pdv-side-title small">${ic('chart')} <h2>Vendas de hoje</h2></div><div class="pdv-today-grid"><div><strong id="todayRevenue">${money(salesToday().reduce((s,x)=>s+Number(x.total||0),0))}</strong><small>Faturamento</small></div><div><strong id="todayCount">${salesToday().length}</strong><small>Vendas realizadas</small></div></div></div>
    <div class="card pdv-recent"><div class="pdv-side-title small">${ic('report')} <h2>Últimas vendas</h2></div><div class="pdv-recent-wrap"><table><thead><tr><th>#</th><th>Cliente</th><th>Itens</th><th>Total</th><th>Pgto.</th><th>Ações</th></tr></thead><tbody>${recentRows||`<tr><td colspan="6">Nenhuma venda ainda.</td></tr>`}</tbody></table></div></div>
  </aside></div>`;
  $('#addProductBtn').onclick=addProduct;
  $('#productSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addProduct()}});
  $('#clientSelect').onchange=e=>{selectedClient=e.target.value;draw()};
  $('#received').oninput=draw;
  $('#cardType').onchange=e=>{cardType=e.target.value};
  $('#clearCart').onclick=()=>{if(cart.length&&confirm('Limpar todos os itens do carrinho?')){cart=[];draw()}};
  $('#saveBudget').onclick=()=>downloadBudgetPdf(cart,selectedClient,$('#saleObs').value.trim());
  $('#printReceipt').onclick=()=>{const preferred=sessionStorage.getItem('dchacara_last_sale_id');const sale=(preferred&&data.sales.find(s=>s.id===preferred))||data.sales[data.sales.length-1];if(!sale)return toast('Finalize uma venda antes de imprimir o comprovante.');printSaleReceipt(sale);};
  $('#finishSale').onclick=()=>{
    if(!cart.length)return toast('Adicione pelo menos um produto.');
    if(!paymentDefs.length||!payment)return toast('Ative uma forma de pagamento em Configurações antes de finalizar a venda.');
    if(payment==='Fiado'&&!selectedClient)return toast('Para vender fiado, selecione um cliente cadastrado.');
    if(payment==='Fiado'&&!$('#fiadoDue').value)return toast('Informe o vencimento do fiado.');
    cart.forEach(x=>{const p=data.products.find(p=>p.id===x.id);if(p)p.stock-=x.qty});
    const payLabel=payment==='Cartão'?`Cartão - ${cardType}`:payment;
    const sale={id:uid('VEN'),date:now(),client:selectedClient?clientName(selectedClient):'',clientId:selectedClient,items:cart.reduce((s,x)=>s+x.qty,0),total:grandTotal(),payment:payLabel,paymentType:payment,cardType:payment==='Cartão'?cardType:'',obs:$('#saleObs').value,seller:$('#seller').value,financialStatus:payment==='Fiado'?'Em aberto':'Recebida',receivedAmount:payment==='Fiado'?0:grandTotal(),lines:cart.map(x=>({productId:x.id,name:x.name,qty:x.qty,price:x.price,discount:x.discount||0,photo:x.photo||''}))};
    data.sales.push(sale);
    sessionStorage.setItem('dchacara_last_sale_id',sale.id);
    if(payment==='Fiado'){
      const itemDesc=cart.map(x=>`${x.qty}x ${x.name}`).join(', ');
      data.debts.push({id:uid('FIA'),clientId:selectedClient,saleId:sale.id,description:`Venda fiada • ${itemDesc}`,value:sale.total,balance:sale.total,due:$('#fiadoDue').value,status:'Em aberto',createdAt:now()});
    }
    save();toast(payment==='Fiado'?'Venda fiada finalizada e conta criada em Fiados.':'Venda finalizada com sucesso.');setTimeout(()=>location.reload(),600);
  };
  $$('[data-print-sale]').forEach(b=>b.onclick=()=>printSaleReceipt(data.sales.find(s=>s.id===b.dataset.printSale)));
  $$('[data-edit-sale]').forEach(b=>b.onclick=()=>editSaleModal(b.dataset.editSale));
  $$('[data-delete-sale]').forEach(b=>b.onclick=()=>deleteSaleRecord(b.dataset.deleteSale));
  draw();
}

function renderEstoque(){
  normalizeInventoryData();
  const state=renderEstoque.state||{search:'',status:'Todos',supplier:'Todos',category:'Todos',page:1};
  renderEstoque.state=state;
  const value=data.products.reduce((a,b)=>a+Number(b.stock||0)*Number(b.cost||0),0);
  const low=data.products.filter(p=>Number(p.stock||0)<=Number(p.min||0)).length;
  const categories=['Todos',...inventoryCategories()];
  const suppliers=['Todos',...inventorySuppliers()];
  const perPage=10;
  let filtered=data.products.filter(p=>{
    const term=state.search.trim().toLowerCase();
    const hit=!term||[p.name,p.code,p.brand,p.supplier,p.category].some(v=>String(v||'').toLowerCase().includes(term));
    const statusHit=state.status==='Todos'||inventoryStatus(p)===state.status;
    const supplierHit=state.supplier==='Todos'||String(p.supplier||'')===state.supplier;
    const categoryHit=state.category==='Todos'||String(p.category||'')===state.category;
    return hit&&statusHit&&supplierHit&&categoryHit;
  });
  filtered=filtered.sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'pt-BR'));
  const pages=Math.max(1,Math.ceil(filtered.length/perPage));
  if(state.page>pages)state.page=pages;
  const start=(state.page-1)*perPage;
  const view=filtered.slice(start,start+perPage);
  const pageButtons=Array.from({length:pages},(_,i)=>i+1).map(n=>`<button class="${n===state.page?'active':''}" data-stock-page="${n}">${n}</button>`).join('');
  const rows=view.map((p,idx)=>`<tr><td><div class="stock-check"></div></td><td>${esc(p.code||p.id)}</td><td><div class="stock-product-cell">${p.photo?`<img class="stock-thumb" src="${p.photo}" alt="${esc(p.name)}">`:`<div class="stock-thumb empty">${ic('camera')}</div>`}<div><strong>${esc(p.name)}</strong><small>${esc(p.description||p.brand||'Produto cadastrado')}</small></div></div></td><td><span class="stock-cat-badge ${inventoryTone(p.category)}">${esc(p.category||'Sem categoria')}</span></td><td>${esc(p.brand||'-')}</td><td><span class="${Number(p.stock||0)<=Number(p.min||0)?'stock-low':'stock-ok'}">${Number(p.stock||0)} un</span></td><td class="txt-danger">${Number(p.min||0)}</td><td>${esc(p.supplier||'-')}</td><td>${money(p.cost)}</td><td>${money(p.price)}</td><td><span class="stock-status ${inventoryStatus(p)==='Baixo Estoque'?'low':'normal'}">${inventoryStatus(p)}</span></td><td><div class="stock-actions"><button class="icon-btn" data-adjust-product="${p.id}" title="Ajuste de estoque">${ic('tray')}</button><button class="icon-btn" data-edit-product="${p.id}" title="Editar">${ic('edit')}</button><button class="icon-btn danger" data-del-product="${p.id}" title="Excluir">${ic('trash')}</button></div></td></tr>`).join('')||`<tr><td colspan="12"><div class="empty stock-empty-inline">Nenhum produto encontrado para os filtros selecionados.</div></td></tr>`;
  $('#page').innerHTML=`
  <div class="grid stock-kpis">
    <article class="card hover stock-stat-card"><div class="stock-stat-icon green">${ic('box')}</div><div class="stock-stat-copy"><small>Itens Cadastrados</small><strong>${data.products.length}</strong><div class="trend">${data.products.length?'+ cadastro(s) disponíveis':'Sem produtos cadastrados'}</div></div><div class="stock-stat-bars"></div></article>
    <article class="card hover stock-stat-card"><div class="stock-stat-icon amber">${ic('bell')}</div><div class="stock-stat-copy"><small>Produtos em Baixo Estoque</small><strong>${low}</strong><div class="trend ${low?'warn':'neutral'}">${low?'+ itens exigem reposição':'Sem alertas no estoque'}</div></div><div class="stock-stat-bars amber"></div></article>
    <article class="card hover stock-stat-card"><div class="stock-stat-icon emerald">${ic('wallet')}</div><div class="stock-stat-copy"><small>Valor do Estoque</small><strong>${money(value)}</strong><div class="trend">Baseado no custo dos itens</div></div><div class="stock-stat-bars green"></div></article>
    <article class="card hover stock-stat-card"><div class="stock-stat-icon rose">${ic('tray')}</div><div class="stock-stat-copy"><small>Movimentações Hoje</small><strong>${inventoryMovesToday()}</strong><div class="trend">Entradas, vendas e ajustes</div></div><div class="stock-stat-bars rose"></div></article>
  </div>
  <div class="card stock-category-card"><div class="stock-category-head"><strong>Filtrar por categoria</strong><button class="btn soft" id="manageCategoriesBtn">${ic('settings')}Gerenciar categorias</button></div><div class="stock-category-row">${categories.map(cat=>`<button class="stock-chip ${state.category===cat?'active':''}" data-stock-category="${esc(cat)}"><span>${esc(cat==='Todos'?`Todos (${data.products.length})`:`${cat} (${data.products.filter(p=>String(p.category||'')===cat).length})`)}</span></button>`).join('')}</div></div>
  <div class="card stock-toolbar-card">
    <div class="stock-toolbar-grid">
      <label class="stock-search"><span>${ic('report')}</span><input id="stockSearch" value="${esc(state.search)}" placeholder="Pesquisar por nome, código, marca ou fornecedor..."></label>
      <label class="stock-select"><small>Status</small><select id="stockStatus"><option ${state.status==='Todos'?'selected':''}>Todos</option><option ${state.status==='Normal'?'selected':''}>Normal</option><option ${state.status==='Baixo Estoque'?'selected':''}>Baixo Estoque</option></select></label>
      <label class="stock-select"><small>Fornecedor</small><select id="stockSupplier"><option ${state.supplier==='Todos'?'selected':''}>Todos</option>${suppliers.filter(s=>s!=='Todos').map(s=>`<option ${state.supplier===s?'selected':''}>${esc(s)}</option>`).join('')}</select></label>
      <div class="stock-toolbar-actions"><button class="btn primary" id="newProduct">${ic('plus')}Novo Produto</button><button class="btn outline" id="adjustStockBtn">${ic('tray')}Ajuste de Estoque</button><button class="btn outline" id="importStockBtn">${ic('download')}Importar</button></div>
    </div>
  </div>
  <div class="card stock-table-card">
    <div class="stock-table-head"><div><h2>Produtos (${filtered.length})</h2><p>Controle detalhado do estoque com busca, filtros e paginação.</p></div><button class="btn soft" id="exportStockBtn">${ic('download')}Exportar</button></div>
    <div class="table-wrap stock-table-wrap"><table class="table stock-table"><thead><tr><th></th><th>Código</th><th>Produto</th><th>Categoria</th><th>Marca</th><th>Estoque Atual</th><th>Estoque Mínimo</th><th>Fornecedor</th><th>Custo Unit.</th><th>Preço Venda</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="stock-pagination"><span>Exibindo ${filtered.length?start+1:0} a ${Math.min(start+perPage,filtered.length)} de ${filtered.length} produto(s)</span><div class="stock-page-buttons">${pageButtons}</div></div>
  </div>`;

  $('#stockSearch').oninput=e=>{state.search=e.target.value;state.page=1;renderEstoque()};
  $('#stockStatus').onchange=e=>{state.status=e.target.value;state.page=1;renderEstoque()};
  $('#stockSupplier').onchange=e=>{state.supplier=e.target.value;state.page=1;renderEstoque()};
  $('#newProduct').onclick=()=>productForm();
  $('#adjustStockBtn').onclick=()=>openInventoryAdjustment();
  $('#manageCategoriesBtn').onclick=()=>manageCategoriesModal();
  $('#importStockBtn').onclick=()=>openInventoryImport();
  $('#exportStockBtn').onclick=()=>exportInventoryCSV(filtered);
  $$('[data-stock-category]').forEach(btn=>btn.onclick=()=>{state.category=btn.dataset.stockCategory;state.page=1;renderEstoque()});
  $$('[data-stock-page]').forEach(btn=>btn.onclick=()=>{state.page=Number(btn.dataset.stockPage);renderEstoque()});
  $$('[data-edit-product]').forEach(btn=>btn.onclick=()=>productForm(data.products.find(p=>p.id===btn.dataset.editProduct)));
  $$('[data-adjust-product]').forEach(btn=>btn.onclick=()=>openInventoryAdjustment(btn.dataset.adjustProduct));
  $$('[data-del-product]').forEach(btn=>btn.onclick=()=>{
    const p=data.products.find(x=>x.id===btn.dataset.delProduct);
    if(!p||!confirm(`Excluir ${p.name}?`))return;
    if(data.sales.some(s=>(s.lines||[]).some(l=>l.productId===p.id))||data.entries.some(e=>e.productId===p.id))return toast('Produto possui movimentações e não pode ser excluído.');
    data.products=data.products.filter(x=>x.id!==p.id);
    save();
    renderEstoque();
  });
}


function entrySuppliers(){return [...new Set([...(data.products||[]).map(p=>String(p.supplier||'').trim()).filter(Boolean),...(data.entries||[]).map(e=>String(e.supplier||'').trim()).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
const entryTotal=e=>Number(e.qty||0)*Number(e.cost||0);
const entryStatusCount=s=>(data.entries||[]).filter(e=>String(e.status||'')===s).length;
const entryPendingCount=()=> (data.entries||[]).filter(e=>String(e.status||'')!=='Recebida').length;
function entryCategory(entry){return data.products.find(p=>p.id===entry.productId)?.category||'Outros'}
function entryForm(e=null){
  if(!data.products.length)return toast('Cadastre um produto primeiro.');
  modal(`<h3>${e?'Editar':'Nova'} entrada</h3><p class="modal-subtitle">Atualize fornecedor, nota, produto, quantidade e custo da mercadoria.</p><div class="form-grid"><label class="full">Fornecedor<input id="eSup" list="entrySupplierList" value="${esc(e?.supplier||'')}" placeholder="Nome do fornecedor"><datalist id="entrySupplierList">${entrySuppliers().map(s=>`<option value="${esc(s)}"></option>`).join('')}</datalist></label><label>Número da nota<input id="eNf" value="${esc(e?.nf||'')}" placeholder="Ex.: 0001257"></label><label>Data<input id="eDate" type="date" value="${e?.date||today()}"></label><label>Status<select id="eStatus"><option ${e?.status==='Recebida'?'selected':''}>Recebida</option><option ${e?.status==='Pendente'?'selected':''}>Pendente</option><option ${e?.status==='Parcial'?'selected':''}>Parcial</option></select></label><label class="full">Produto<select id="eProd">${data.products.map(p=>`<option value="${p.id}" ${p.id===e?.productId?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label>Quantidade<input id="eQty" type="number" min="1" value="${e?.qty??1}"></label><label>Custo unitário<input id="eCost" type="number" step="0.01" min="0" value="${e?.cost??0}"></label><label class="full">Observações<input id="eObs" value="${esc(e?.obs||'')}" placeholder="Condição de pagamento, observações internas..."></label></div><div class="stock-modal-actions"><button class="btn outline" id="cancelEntry">Cancelar</button><button class="btn primary" id="saveEntry">Salvar entrada</button></div>`);
  $('#cancelEntry').onclick=closeModal;
  $('#saveEntry').onclick=()=>{
    const p=data.products.find(x=>x.id===$('#eProd').value),q=Math.max(0,Number($('#eQty').value||0)),cost=Math.max(0,Number($('#eCost').value||0));
    const supplier=$('#eSup').value.trim()||'-';
    const status=$('#eStatus').value;
    if(!p||q<=0)return toast('Preencha produto e quantidade.');
    if(e){
      const oldProduct=data.products.find(x=>x.id===e.productId);
      if(e.status==='Recebida'&&oldProduct)oldProduct.stock=Math.max(0,Number(oldProduct.stock||0)-Number(e.qty||0));
      if(status==='Recebida')p.stock=Number(p.stock||0)+q;
      Object.assign(e,{nf:$('#eNf').value.trim()||'-',date:$('#eDate').value,supplier,product:p.name,productId:p.id,qty:q,cost,status,obs:$('#eObs').value.trim()});
    }else{
      if(status==='Recebida')p.stock=Number(p.stock||0)+q;
      data.entries.push({id:uid('ENT'),nf:$('#eNf').value.trim()||'-',date:$('#eDate').value,supplier,product:p.name,productId:p.id,qty:q,cost,status,obs:$('#eObs').value.trim()});
    }
    save();closeModal();renderEntradas();
  }
}
function receiveEntry(entry){
  if(!entry||entry.status==='Recebida')return;
  const p=data.products.find(x=>x.id===entry.productId);
  if(p)p.stock=Number(p.stock||0)+Number(entry.qty||0);
  entry.status='Recebida';
  save();renderEntradas();toast('Mercadoria recebida e estoque atualizado.');
}


function expenseForm(e=null){
  const categories=(data.expenseCategories&&data.expenseCategories.length?data.expenseCategories:[...blank.expenseCategories]).slice().sort((a,b)=>a.localeCompare(b,'pt-BR'));
  modal(`<h3>${e?'Editar':'Nova'} despesa</h3><div class="form-grid"><label>Data<input id="xDate" type="date" value="${e?.date||today()}"></label><label>Tipo<select id="xType"><option ${e?.type==='Fixa'?'selected':''}>Fixa</option><option ${e?.type!=='Fixa'?'selected':''}>Variável</option></select></label><label>Categoria<select id="xCat">${categories.map(x=>`<option ${x===e?.category?'selected':''}>${x}</option>`).join('')}</select></label><label>Status<select id="xStatus"><option ${e?.status==='Paga'?'selected':''}>Paga</option><option ${e?.status==='Pendente'?'selected':''}>Pendente</option><option ${e?.status==='Vencida'?'selected':''}>Vencida</option></select></label><label class="full">Descrição<input id="xDesc" value="${esc(e?.description||'')}" placeholder="Ex.: Conta de energia elétrica - Maio/2025"></label><label>Fornecedor<input id="xSup" value="${esc(e?.supplier||'')}" placeholder="Fornecedor ou favorecido"></label><label>Pagamento<select id="xPay">${['PIX','Transferência','Cartão de Crédito','Dinheiro','Boleto'].map(x=>`<option ${x===e?.payment?'selected':''}>${x}</option>`).join('')}</select></label><label class="full">Valor<input id="xValue" type="number" step="0.01" value="${e?.value??0}"></label></div><button class="btn primary" id="saveExpense">Salvar despesa</button>`);
  $('#saveExpense').onclick=()=>{
    const v=+$('#xValue').value||0;
    if(v<=0)return toast('Informe o valor.');
    const obj=e||{id:uid('DES')};
    Object.assign(obj,{date:$('#xDate').value,type:$('#xType').value,category:$('#xCat').value,description:$('#xDesc').value.trim(),supplier:$('#xSup').value.trim(),payment:$('#xPay').value,value:v,status:$('#xStatus').value});
    if(!e)data.expenses.push(obj);
    if(obj.category&&!data.expenseCategories.includes(obj.category))data.expenseCategories.push(obj.category);
    save();closeModal();
    if(page==='despesas')renderDespesas(); else location.reload();
  }
}
function renderEntradas(){
  const state=renderEntradas.state||{supplier:'',nf:'',date:today(),obs:'',items:[]};
  renderEntradas.state=state;
  const totalValue=(data.entries||[]).reduce((a,b)=>a+entryTotal(b),0);
  const activeSuppliers=new Set((data.entries||[]).map(e=>e.supplier).filter(Boolean)).size;
  const replacementCost=(data.entries||[]).reduce((a,b)=>a+entryTotal(b),0);
  const pendingNotes=entryPendingCount();
  const recent=(data.entries||[]).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.id).localeCompare(String(a.id))).slice(0,8);
  const supplierTotals={};
  const cutoff=new Date(Date.now()-29*86400000);
  (data.entries||[]).forEach(e=>{const dt=e.date?new Date(e.date+'T00:00:00'):null;if(dt&&dt>=cutoff)supplierTotals[e.supplier||'Sem fornecedor']=(supplierTotals[e.supplier||'Sem fornecedor']||0)+entryTotal(e)});
  const topSuppliers=Object.entries(supplierTotals).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const supplierMax=Math.max(1,...topSuppliers.map(x=>x[1]),1);
  const categoryTotals={};
  (data.entries||[]).forEach(e=>{const c=entryCategory(e);categoryTotals[c]=(categoryTotals[c]||0)+entryTotal(e)});
  let categoryEntries=Object.entries(categoryTotals).sort((a,b)=>b[1]-a[1]);
  if(categoryEntries.length>6){const head=categoryEntries.slice(0,5);const rest=categoryEntries.slice(5).reduce((s,x)=>s+x[1],0);categoryEntries=[...head,['Outros',rest]]}
  const catTotal=Math.max(0,categoryEntries.reduce((s,x)=>s+x[1],0));
  const catColors=['#0b7b49','#4ea969','#a1cc6c','#efae35','#b97a44','#c7ceca'];
  let acc=0;
  const conic=categoryEntries.length?categoryEntries.map((x,i)=>{const start=acc;acc+=x[1]/catTotal*100;return `${catColors[i%catColors.length]} ${start}% ${acc}%`}).join(', '):'#e9efeb 0 100%';
  const draftRows=state.items.map((item,i)=>`<tr><td><div class="entry-draft-product">${item.photo?`<img src="${item.photo}" class="stock-thumb" alt="${esc(item.name)}">`:`<div class="stock-thumb empty">${ic('camera')}</div>`}<div><strong>${esc(item.name)}</strong><small>${esc(item.code||item.id)}</small></div></div></td><td>${item.qty}</td><td>${money(item.cost)}</td><td><strong>${money(item.qty*item.cost)}</strong></td><td><button class="icon-btn danger" data-draft-remove="${i}">${ic('trash')}</button></td></tr>`).join('')||`<tr><td colspan="5"><div class="small-empty">Nenhum produto adicionado à entrada.</div></td></tr>`;
  $('#page').innerHTML=`
  <div class="grid entry-kpis">
    <article class="card hover stock-stat-card"><div class="stock-stat-icon green">${ic('tray')}</div><div class="stock-stat-copy"><small>Entradas do Mês</small><strong>${money(totalValue)}</strong><div class="trend">Mercadorias registradas no período</div></div><div class="stock-stat-bars"></div></article>
    <article class="card hover stock-stat-card"><div class="stock-stat-icon emerald">${ic('users')}</div><div class="stock-stat-copy"><small>Fornecedores Ativos</small><strong>${activeSuppliers}</strong><div class="trend neutral">Baseado nas entradas lançadas</div></div><div class="stock-stat-bars green"></div></article>
    <article class="card hover stock-stat-card"><div class="stock-stat-icon amber">${ic('wallet')}</div><div class="stock-stat-copy"><small>Custo de Reposição</small><strong>${money(replacementCost)}</strong><div class="trend">Soma dos custos unitários lançados</div></div><div class="stock-stat-bars amber"></div></article>
    <article class="card hover stock-stat-card"><div class="stock-stat-icon rose">${ic('report')}</div><div class="stock-stat-copy"><small>Notas Pendentes</small><strong>${pendingNotes}</strong><div class="trend ${pendingNotes?'warn':'neutral'}">${pendingNotes?'+ notas aguardando recebimento':'Nenhuma nota pendente'}</div></div><div class="stock-stat-bars rose"></div></article>
  </div>
  <div class="entry-layout">
    <div class="card entry-table-card">
      <div class="entry-section-head"><div><h2>Últimas Entradas</h2><p>Compras, notas fiscais e recebimento de mercadorias cadastradas.</p></div><a href="#" id="viewAllEntries">Ver todas →</a></div>
      <div class="table-wrap entry-table-wrap"><table class="table entry-table"><thead><tr><th>Nota Fiscal</th><th>Data</th><th>Fornecedor</th><th>Produto</th><th>Qtd</th><th>Custo Unit.</th><th>Custo Total</th><th>Status</th><th>Ações</th></tr></thead><tbody>${recent.map(e=>`<tr><td>${esc(e.nf||'-')}</td><td>${esc(e.date||'-')}</td><td>${esc(e.supplier||'-')}</td><td>${esc(e.product||'-')}</td><td>${e.qty}</td><td>${money(e.cost)}</td><td>${money(entryTotal(e))}</td><td>${badge(e.status||'Recebida')}</td><td><div class="stock-actions">${e.status!=='Recebida'?`<button class="icon-btn" data-receive-entry="${e.id}" title="Receber mercadoria">${ic('check')}</button>`:''}<button class="icon-btn" data-edit-entry="${e.id}" title="Editar">${ic('edit')}</button><button class="icon-btn danger" data-del-entry="${e.id}" title="Excluir">${ic('trash')}</button></div></td></tr>`).join('')||`<tr><td colspan="9"><div class="empty stock-empty-inline">Nenhuma entrada registrada ainda.</div></td></tr>`}</tbody></table></div>
    </div>
    <aside class="card entry-form-card">
      <div class="entry-form-head"><div class="entry-form-title"><span class="entry-form-icon">${ic('plus')}</span><div><h2>Nova Entrada</h2><p>Lance a nota ou registre o recebimento da mercadoria.</p></div></div></div>
      <div class="entry-form-grid">
        <label class="full"><span>Fornecedor *</span><div class="entry-inline-input"><input id="entrySupplier" list="entrySuppliersList" value="${esc(state.supplier)}" placeholder="Selecione ou digite o fornecedor"><datalist id="entrySuppliersList">${entrySuppliers().map(s=>`<option value="${esc(s)}"></option>`).join('')}</datalist><button class="btn soft" id="addSupplierBtn">${ic('plus')}Novo</button></div></label>
        <label><span>Número da Nota *</span><input id="entryNf" value="${esc(state.nf)}" placeholder="Ex.: 0001257"></label>
        <label><span>Data da Emissão *</span><input id="entryDate" type="date" value="${esc(state.date)}"></label>
        <label class="full"><span>Observações (opcional)</span><textarea id="entryObs" rows="3" placeholder="Condição de pagamento, observações internas, informações adicionais...">${esc(state.obs)}</textarea></label>
      </div>
      <div class="entry-draft-box">
        <div class="entry-draft-head"><h3>Itens da Entrada</h3></div>
        <div class="entry-items-grid">
          <label class="full"><span>Produto *</span><select id="entryProduct"><option value="">Selecione o produto</option>${data.products.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label>
          <label><span>Quantidade *</span><input id="entryQty" type="number" min="1" value="1"></label>
          <label><span>Custo Unitário (R$) *</span><input id="entryCost" type="number" min="0" step="0.01" value="0"></label>
          <div class="entry-add-btn-wrap"><button class="btn soft entry-add-btn" id="addEntryItemBtn">${ic('plus')}Adicionar Produto</button></div>
        </div>
        <div class="table-wrap entry-draft-table-wrap"><table class="table entry-draft-table"><thead><tr><th>Produto</th><th>Quantidade</th><th>Custo Unit.</th><th>Total</th><th>Ações</th></tr></thead><tbody>${draftRows}</tbody></table></div>
      </div>
      <div class="entry-form-actions"><button class="btn primary" id="launchEntryBtn">${ic('report')}Lançar Nota</button><button class="btn primary alt" id="receiveEntryBtn">${ic('check')}Receber Mercadoria</button><button class="btn outline" id="clearEntryDraftBtn">${ic('trash')}Limpar</button></div>
    </aside>
  </div>
  <div class="entry-bottom-grid">
    <div class="card entry-supplier-card"><div class="entry-section-head"><div><h2>Entradas por Fornecedor (Últimos 30 dias)</h2></div></div><div class="entry-supplier-list">${topSuppliers.map(([name,val])=>`<div class="entry-supplier-row"><div class="entry-supplier-label">${esc(name)}</div><div class="entry-supplier-bar"><span style="width:${Math.max(10,val/supplierMax*100)}%"></span></div><strong>${money(val)}</strong></div>`).join('')||'<div class="small-empty">Sem dados suficientes para o gráfico.</div>'}</div></div>
    <div class="card entry-category-card"><div class="entry-section-head"><div><h2>Entradas por Categoria (Valor)</h2></div></div>${categoryEntries.length?`<div class="entry-donut-wrap"><div class="entry-donut" style="background:conic-gradient(${conic})"><div class="entry-donut-center"><strong>${money(catTotal)}</strong><small>em entradas</small></div></div><div class="entry-donut-legend">${categoryEntries.map((x,i)=>`<div class="legend-row"><span><i class="dot" style="background:${catColors[i%catColors.length]}"></i>${esc(x[0])}</span><b>${catTotal?((x[1]/catTotal)*100).toFixed(1).replace('.',',')+'%':'0%'}</b></div>`).join('')}</div></div>`:'<div class="small-empty">Sem dados suficientes para o gráfico.</div>'}</div>
  </div>`;

  $('#viewAllEntries').onclick=(e)=>{e.preventDefault();toast('A tabela já mostra as entradas mais recentes.');};
  $('#addSupplierBtn').onclick=(e)=>{e.preventDefault();const name=prompt('Digite o nome do novo fornecedor:');if(name){$('#entrySupplier').value=name.trim()}};
  $('#addEntryItemBtn').onclick=()=>{
    const p=data.products.find(x=>x.id===$('#entryProduct').value);
    const qty=Math.max(0,Number($('#entryQty').value||0));
    const cost=Math.max(0,Number($('#entryCost').value||0));
    state.supplier=$('#entrySupplier').value.trim();state.nf=$('#entryNf').value.trim();state.date=$('#entryDate').value;state.obs=$('#entryObs').value.trim();
    if(!p||qty<=0)return toast('Selecione o produto e informe a quantidade.');
    const found=state.items.find(x=>x.id===p.id&&x.cost===cost);
    if(found)found.qty+=qty; else state.items.push({id:p.id,code:p.code,name:p.name,photo:p.photo||'',qty,cost});
    renderEntradas();
  };
  $$('[data-draft-remove]').forEach(btn=>btn.onclick=()=>{state.items.splice(Number(btn.dataset.draftRemove),1);renderEntradas()});
  const saveDraft=(status)=>{
    state.supplier=$('#entrySupplier').value.trim();state.nf=$('#entryNf').value.trim();state.date=$('#entryDate').value;state.obs=$('#entryObs').value.trim();
    if(!state.supplier||!state.nf||!state.date)return toast('Preencha fornecedor, número da nota e data.');
    if(!state.items.length)return toast('Adicione ao menos um produto à entrada.');
    state.items.forEach(item=>{
      const p=data.products.find(x=>x.id===item.id);
      if(status==='Recebida'&&p)p.stock=Number(p.stock||0)+Number(item.qty||0);
      data.entries.push({id:uid('ENT'),nf:state.nf,date:state.date,supplier:state.supplier,product:item.name,productId:item.id,qty:Number(item.qty||0),cost:Number(item.cost||0),status,obs:state.obs});
    });
    save();
    renderEntradas.state={supplier:'',nf:'',date:today(),obs:'',items:[]};
    renderEntradas();
    toast(status==='Recebida'?'Mercadorias recebidas e estoque atualizado.':'Nota lançada com sucesso.');
  };
  $('#launchEntryBtn').onclick=()=>saveDraft('Pendente');
  $('#receiveEntryBtn').onclick=()=>saveDraft('Recebida');
  $('#clearEntryDraftBtn').onclick=()=>{renderEntradas.state={supplier:'',nf:'',date:today(),obs:'',items:[]};renderEntradas()};
  $$('[data-edit-entry]').forEach(b=>b.onclick=()=>entryForm(data.entries.find(e=>e.id===b.dataset.editEntry)));
  $$('[data-receive-entry]').forEach(b=>b.onclick=()=>receiveEntry(data.entries.find(e=>e.id===b.dataset.receiveEntry)));
  $$('[data-del-entry]').forEach(b=>b.onclick=()=>{
    const e=data.entries.find(x=>x.id===b.dataset.delEntry);
    if(!e||!confirm('Excluir esta entrada?'))return;
    const p=data.products.find(x=>x.id===e.productId);
    if(e.status==='Recebida'&&p)p.stock=Math.max(0,Number(p.stock||0)-Number(e.qty||0));
    data.entries=data.entries.filter(x=>x.id!==e.id);
    save();renderEntradas();
  });
}


function expenseCategoryMeta(category='Outros'){
  const map={
    'Fornecedores':{icon:'layers',className:'blue'},
    'Folha':{icon:'users',className:'green'},
    'Impostos':{icon:'receipt',className:'rose'},
    'Energia':{icon:'bolt',className:'amber'},
    'Frete':{icon:'truck',className:'purple'},
    'Manutenção':{icon:'wrench',className:'orange'},
    'Outros':{icon:'wallet',className:'gray'}
  };
  return map[category]||{icon:'wallet',className:'gray'};
}
function expensePaymentMeta(payment=''){
  if(/pix/i.test(payment))return {icon:'credit',label:'PIX'};
  if(/transfer/i.test(payment))return {icon:'bank',label:'Transferência'};
  if(/cart/i.test(payment))return {icon:'credit',label:'Cartão'};
  if(/boleto/i.test(payment))return {icon:'report',label:'Boleto'};
  return {icon:'wallet',label:payment||'Dinheiro'};
}
function expenseStatusClass(status=''){
  if(/venc/i.test(status))return 'danger';
  if(/pend/i.test(status))return 'warn';
  return 'success';
}
function formatDateBR(value=''){
  if(!value)return '-';
  const [y,m,d]=String(value).slice(0,10).split('-');
  return y&&m&&d?`${d}/${m}/${y}`:value;
}
function openExpenseCategoriesManager(){
  if(!Array.isArray(data.expenseCategories)||!data.expenseCategories.length)data.expenseCategories=[...blank.expenseCategories];
  modal(`<h3>Categorias de despesa</h3><p class="modal-subtitle">Adicione novas categorias ou remova as que ainda não possuem lançamentos.</p><div class="stock-category-manager"><div class="stock-category-add"><input id="newExpenseCategory" placeholder="Ex.: Combustível"><button class="btn primary" id="addExpenseCategory">${ic('plus')}Adicionar</button></div><div class="stock-category-list">${data.expenseCategories.slice().sort((a,b)=>a.localeCompare(b,'pt-BR')).map(cat=>{const meta=expenseCategoryMeta(cat);return `<div class="stock-category-row"><span class="expense-cat-badge ${meta.className}"><i>${ic(meta.icon)}</i>${esc(cat)}</span><small>${data.expenses.filter(e=>e.category===cat).length} lançamento(s)</small><button class="icon-btn danger" data-remove-expense-category="${esc(cat)}" title="Remover">${ic('trash')}</button></div>`}).join('')}</div></div>`);
  $('#addExpenseCategory').onclick=()=>{
    const name=$('#newExpenseCategory').value.trim();
    if(!name)return toast('Informe o nome da categoria.');
    if(data.expenseCategories.some(c=>c.toLowerCase()===name.toLowerCase()))return toast('Essa categoria já existe.');
    data.expenseCategories.push(name);save();openExpenseCategoriesManager();
  };
  $$('[data-remove-expense-category]').forEach(btn=>btn.onclick=()=>{
    const name=btn.dataset.removeExpenseCategory;
    if(data.expenses.some(e=>e.category===name))return toast('Existem despesas usando essa categoria.');
    data.expenseCategories=data.expenseCategories.filter(c=>c!==name);save();openExpenseCategoriesManager();
  });
}
function openExpenseAttachmentModal(expense=null){
  const list=expense?[expense]:(data.expenses||[]).slice().reverse();
  if(!list.length)return toast('Cadastre uma despesa antes de anexar comprovantes.');
  modal(`<h3>Anexar comprovante</h3><p class="modal-subtitle">Associe uma imagem ou PDF ao lançamento selecionado.</p><div class="form-grid"><label class="full">Despesa<select id="expenseReceiptTarget">${list.map(e=>`<option value="${e.id}">${formatDateBR(e.date)} • ${esc(e.description||e.category||'Despesa')} • ${money(e.value||0)}</option>`).join('')}</select></label><label class="full">Arquivo<input id="expenseReceiptFile" type="file" accept="image/*,.pdf"></label></div><div class="stock-modal-actions"><button class="btn outline" id="cancelExpenseReceipt">Cancelar</button><button class="btn primary" id="saveExpenseReceipt">Salvar anexo</button></div>`);
  $('#cancelExpenseReceipt').onclick=closeModal;
  $('#saveExpenseReceipt').onclick=()=>{
    const exp=data.expenses.find(x=>x.id===$('#expenseReceiptTarget').value);
    const file=$('#expenseReceiptFile').files?.[0];
    if(!exp||!file)return toast('Selecione o arquivo do comprovante.');
    const reader=new FileReader();
    reader.onload=()=>{exp.receiptName=file.name;exp.receiptData=String(reader.result||'');save();closeModal();toast('Comprovante anexado com sucesso.');if(page==='despesas')renderDespesas();};
    reader.readAsDataURL(file);
  };
}

function renderDespesas(){
  const now=new Date();
  const defaults={start:new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10),end:today(),category:'Todas',status:'Todos',search:''};
  const state=renderDespesas.state={...defaults,...(renderDespesas.state||{})};
  const categories=(data.expenseCategories&&data.expenseCategories.length?data.expenseCategories:[...blank.expenseCategories]).slice().sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const all=(data.expenses||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.id||'').localeCompare(String(a.id||'')));
  const filtered=all.filter(e=>{
    if(state.start&&String(e.date||'')<state.start)return false;
    if(state.end&&String(e.date||'')>state.end)return false;
    if(state.category!=='Todas'&&e.category!==state.category)return false;
    if(state.status!=='Todos'&&e.status!==state.status)return false;
    const q=state.search.trim().toLowerCase();
    if(q&&!`${e.description||''} ${e.supplier||''} ${e.category||''} ${e.payment||''}`.toLowerCase().includes(q))return false;
    return true;
  });
  const fixed=filtered.filter(e=>e.type==='Fixa').reduce((s,e)=>s+Number(e.value||0),0);
  const variable=filtered.filter(e=>e.type!=='Fixa').reduce((s,e)=>s+Number(e.value||0),0);
  const total=fixed+variable;
  const revenue=(data.sales||[]).filter(s=>{const d=String(s.date||'').slice(0,10);return (!state.start||d>=state.start)&&(!state.end||d<=state.end)}).reduce((s,e)=>s+Number(e.total||0),0);
  const cash=revenue-total;
  const months=[];
  const monthNames=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,label:`${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`,fixed:0,variable:0,total:0})}
  filtered.forEach(e=>{const b=months.find(m=>m.key===String(e.date||'').slice(0,7));if(!b)return;const v=Number(e.value||0);if(e.type==='Fixa')b.fixed+=v;else b.variable+=v;b.total+=v});
  const maxMonth=Math.max(1,...months.map(m=>m.total));
  const categoryTotals={};filtered.forEach(e=>categoryTotals[e.category||'Outros']=(categoryTotals[e.category||'Outros']||0)+Number(e.value||0));
  let cats=Object.entries(categoryTotals).sort((a,b)=>b[1]-a[1]);if(cats.length>6){cats=[...cats.slice(0,5),['Outros',cats.slice(5).reduce((s,x)=>s+x[1],0)]]}
  const catTotal=Math.max(0,cats.reduce((s,x)=>s+x[1],0));
  const palette=['#2e8e59','#58bc72','#5e93d9','#f0a934','#c9793b','#835fc5','#bbc6be'];
  let acc=0;const conic=cats.length?cats.map((x,i)=>{const a=acc;acc+=x[1]/catTotal*100;return `${palette[i%palette.length]} ${a}% ${acc}%`}).join(', '):'#e8efea 0 100%';
  const rows=filtered.map(e=>{const meta=expenseCategoryMeta(e.category);const pay=expensePaymentMeta(e.payment);return `<tr><td>${formatDateBR(e.date)}</td><td><span class="expense-cat-badge ${meta.className}"><i>${ic(meta.icon)}</i>${esc(e.category||'Outros')}</span></td><td><div class="expense-description"><strong>${esc(e.description||'-')}</strong>${e.receiptName?`<small>${ic('paperclip')} ${esc(e.receiptName)}</small>`:''}</div></td><td>${esc(e.supplier||'-')}</td><td><span class="expense-pay-badge"><i>${ic(pay.icon)}</i>${esc(pay.label)}</span></td><td><strong>${money(e.value||0)}</strong></td><td><span class="expense-status ${expenseStatusClass(e.status)}">${esc(e.status||'-')}</span></td><td><div class="stock-actions"><button class="icon-btn" data-edit-expense="${e.id}" title="Editar">${ic('edit')}</button><button class="icon-btn" data-receipt-expense="${e.id}" title="Comprovante">${ic('paperclip')}</button><button class="icon-btn danger" data-del-expense="${e.id}" title="Excluir">${ic('trash')}</button></div></td></tr>`}).join('');
  $('#page').innerHTML=`
  <section class="card expense-filter-card v2"><div class="expense-filters-grid v2"><label><span>Período</span><div class="expense-period-group"><input id="expenseStart" type="date" value="${state.start}"><b>→</b><input id="expenseEnd" type="date" value="${state.end}"></div></label><label><span>Categoria</span><select id="expenseCategoryFilter"><option ${state.category==='Todas'?'selected':''}>Todas</option>${categories.map(c=>`<option ${state.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label><label><span>Status</span><select id="expenseStatusFilter"><option ${state.status==='Todos'?'selected':''}>Todos</option>${['Paga','Pendente','Vencida'].map(s=>`<option ${state.status===s?'selected':''}>${s}</option>`).join('')}</select></label><div class="expense-filter-actions"><button class="btn outline" id="expenseClearFilters">${ic('filter')}Limpar filtros</button><button class="btn primary" id="expenseApplyFilters">Aplicar filtros</button></div></div></section>
  <div class="grid expense-kpis v2">
    <article class="card hover expense-stat v2 rose"><div class="expense-stat-icon">${ic('wallet')}</div><div><small>Despesas Fixas</small><strong>${money(fixed)}</strong><p>Custo fixo do período</p></div><div class="expense-mini-bars"><i></i><i></i><i></i></div></article>
    <article class="card hover expense-stat v2 amber"><div class="expense-stat-icon">${ic('chart')}</div><div><small>Despesas Variáveis</small><strong>${money(variable)}</strong><p>Custos operacionais variáveis</p></div><div class="expense-mini-bars"><i></i><i></i><i></i></div></article>
    <article class="card hover expense-stat v2 green"><div class="expense-stat-icon">${ic('layers')}</div><div><small>Total do Período</small><strong>${money(total)}</strong><p>${filtered.length} lançamento(s)</p></div><div class="expense-mini-bars"><i></i><i></i><i></i></div></article>
    <article class="card hover expense-stat v2 blue"><div class="expense-stat-icon">${ic('bank')}</div><div><small>Fluxo de Caixa</small><strong>${money(cash)}</strong><p>Receitas ${money(revenue)}</p></div><div class="expense-mini-bars"><i></i><i></i><i></i></div></article>
  </div>
  <div class="expense-main-grid v2">
    <section class="card expense-chart-card v2"><div class="expense-section-head"><div><h2>${ic('chart')} Despesas Mensais</h2><p>Fixas e variáveis nos últimos 6 meses</p></div><span class="period-chip">Últimos 6 meses</span></div><div class="expense-chart-shell"><div class="expense-y-axis"><span>${money(maxMonth)}</span><span>${money(maxMonth*.75)}</span><span>${money(maxMonth*.5)}</span><span>${money(maxMonth*.25)}</span><span>R$ 0</span></div><div class="expense-bars-grid v2">${months.map(m=>`<div class="expense-bar-col"><div class="expense-bar-value">${money(m.total)}</div><div class="expense-bar-track" data-tip="${m.label}: ${money(m.total)}"><div class="expense-bar-stack" style="height:${m.total?Math.max(18,m.total/maxMonth*100):3}%"><span class="expense-bar fixed" style="height:${m.total?m.fixed/m.total*100:0}%"></span><span class="expense-bar variable" style="height:${m.total?m.variable/m.total*100:0}%"></span></div></div><small>${m.label}</small></div>`).join('')}</div></div><div class="expense-chart-legend"><span><i class="dot fixed"></i>Fixas</span><span><i class="dot variable"></i>Variáveis</span></div></section>
    <section class="card expense-donut-card v2"><div class="expense-section-head"><div><h2>${ic('layers')} Despesas por Categoria</h2><p>Participação no período</p></div><span class="period-chip">Período</span></div>${cats.length?`<div class="expense-donut-wrap v2"><div class="expense-donut" style="background:conic-gradient(${conic})"><div class="expense-donut-center"><div class="expense-donut-center-inner"><strong>${money(catTotal)}</strong><small>Total do período</small></div></div></div><div class="expense-donut-legend">${cats.map((x,i)=>`<div class="legend-row"><span><i class="dot" style="background:${palette[i%palette.length]}"></i>${esc(x[0])}</span><b>${catTotal?((x[1]/catTotal)*100).toFixed(1).replace('.',',')+'%':'0%'}</b></div>`).join('')}</div></div>`:'<div class="expense-empty-chart">Sem despesas no período.</div>'}</section>
    <aside class="card expense-quick-card v2"><div class="expense-section-head"><div><h2>${ic('bolt')} Ações Rápidas</h2><p>Atalhos do financeiro</p></div></div><button class="expense-action primary" id="expenseNewQuick"><span>${ic('plus')}</span><b>Nova Despesa</b><em>›</em></button><button class="expense-action" id="expenseAttachQuick"><span>${ic('paperclip')}</span><b>Anexar Comprovante</b><em>›</em></button><button class="expense-action" id="expenseExportQuick"><span>${ic('download')}</span><b>Exportar Despesas</b><em>›</em></button><button class="expense-action" id="expenseCategoriesQuick"><span>${ic('layers')}</span><b>Categorias</b><em>›</em></button></aside>
  </div>
  <section class="card expense-table-card v2"><div class="expense-table-head"><div><h2>${ic('report')} Lista de Despesas</h2><p>Edite, exclua e acompanhe cada lançamento</p></div><div class="expense-inline-search"><i>${ic('report')}</i><input id="expenseSearch" value="${esc(state.search)}" placeholder="Buscar descrição, fornecedor ou categoria..."></div></div>${rows?`<div class="table-wrap stock-table-wrap"><table class="table stock-table expense-table v2"><thead><tr><th>Data</th><th>Categoria</th><th>Descrição</th><th>Fornecedor</th><th>Pagamento</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<div class="empty">Nenhuma despesa encontrada.</div>'}</section>`;
  const applyExpenseFilters=()=>{renderDespesas.state={...state,start:$('#expenseStart').value,end:$('#expenseEnd').value,category:$('#expenseCategoryFilter').value,status:$('#expenseStatusFilter').value,search:$('#expenseSearch').value};renderDespesas()};
  $('#expenseApplyFilters').onclick=applyExpenseFilters;
  $('#expenseClearFilters').onclick=()=>{renderDespesas.state={...defaults};renderDespesas()};
  $('#expenseStart').onchange=applyExpenseFilters;
  $('#expenseEnd').onchange=applyExpenseFilters;
  $('#expenseCategoryFilter').onchange=applyExpenseFilters;
  $('#expenseStatusFilter').onchange=applyExpenseFilters;
  let expenseSearchTimer;
  $('#expenseSearch').oninput=e=>{clearTimeout(expenseSearchTimer);expenseSearchTimer=setTimeout(()=>{renderDespesas.state={...state,search:e.target.value};renderDespesas()},250)};
  $('#expenseNewQuick').onclick=()=>expenseForm();
  $('#expenseAttachQuick').onclick=()=>openExpenseAttachmentModal();
  $('#expenseExportQuick').onclick=()=>downloadCSV('despesas.csv',['Data','Categoria','Descrição','Fornecedor','Pagamento','Valor','Status'],filtered.map(e=>[e.date,e.category,e.description,e.supplier,e.payment,e.value,e.status]));
  $('#expenseCategoriesQuick').onclick=()=>openExpenseCategoriesManager();
  $$('[data-edit-expense]').forEach(b=>b.onclick=()=>expenseForm(data.expenses.find(e=>e.id===b.dataset.editExpense)));
  $$('[data-receipt-expense]').forEach(b=>b.onclick=()=>openExpenseAttachmentModal(data.expenses.find(e=>e.id===b.dataset.receiptExpense)));
  $$('[data-del-expense]').forEach(b=>b.onclick=()=>{const e=data.expenses.find(x=>x.id===b.dataset.delExpense);if(!e||!confirm('Excluir esta despesa?'))return;data.expenses=data.expenses.filter(x=>x!==e);save();renderDespesas()});
}


function formatPhoneBR(v=''){return String(v||'').trim()||'-'}
function debtIsLate(d){return d.status!=='Pago'&&d.due&&new Date(d.due+'T23:59:59')<new Date()}
function debtIsSoon(d){if(d.status==='Pago'||!d.due||debtIsLate(d))return false;const diff=Math.ceil((new Date(d.due+'T23:59:59')-new Date())/86400000);return diff<=7}
function debtStatusLabel(d){if(d.status==='Pago'||Number(d.balance||0)<=0)return 'Pago';if(debtIsLate(d))return 'Em atraso';if(debtIsSoon(d))return 'A vencer';return 'Em dia'}
function debtStatusClass(d){const s=debtStatusLabel(d);return s==='Em atraso'?'danger':s==='A vencer'?'warn':s==='Pago'?'success':'normal'}
function clientInitials(name=''){return String(name).trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'CL'}
function clientOpenDebts(clientId){return data.debts.filter(d=>d.clientId===clientId&&d.status!=='Pago'&&Number(d.balance||0)>0)}
function clientPayments(clientId){const debtIds=new Set(data.debts.filter(d=>d.clientId===clientId).map(d=>d.id));return data.payments.filter(p=>debtIds.has(p.debtId)).slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)))}
function clientForm(c=null){
  modal(`<h3>${c?'Editar':'Novo'} cliente</h3><p class="modal-subtitle">Cadastre apenas os dados necessários para identificar e acompanhar o cliente.</p><div class="form-grid client-form-grid"><label class="full">Nome / Razão social<input id="cName" value="${esc(c?.name||'')}" placeholder="Nome do cliente"></label><label>Telefone<input id="cPhone" value="${esc(c?.phone||'')}" placeholder="(64) 99999-9999"></label><label>E-mail<input id="cEmail" value="${esc(c?.email||'')}" placeholder="cliente@email.com"></label><label>CPF / CNPJ<input id="cDoc" value="${esc(c?.document||'')}" placeholder="CPF ou CNPJ"></label><label>Cidade<input id="cCity" value="${esc(c?.city||'')}" placeholder="Cidade"></label><label class="full">Observações<input id="cObs" value="${esc(c?.obs||'')}" placeholder="Informações adicionais"></label></div><div class="stock-modal-actions"><button class="btn outline" id="cancelClient">Cancelar</button><button class="btn primary" id="saveClient">Salvar cliente</button></div>`);
  $('#cancelClient').onclick=closeModal;
  $('#saveClient').onclick=()=>{
    const name=$('#cName').value.trim();
    if(!name)return toast('Informe o nome do cliente.');
    const obj=c||{id:uid('CLI'),createdAt:now()};
    Object.assign(obj,{name,phone:$('#cPhone').value.trim(),email:$('#cEmail').value.trim(),document:$('#cDoc').value.trim(),city:$('#cCity').value.trim(),obs:$('#cObs').value.trim()});
    if(!c)data.clients.push(obj);
    save();closeModal();
    if(page==='clientes')renderClientes(); else if(page==='fiados')renderFiados();
  }
}
function debtForm(d=null,clientId=''){
  if(!data.clients.length)return toast('Cadastre um cliente primeiro.');
  modal(`<h3>${d?'Editar':'Novo'} fiado</h3><p class="modal-subtitle">Escolha o cliente, informe o valor e defina o vencimento.</p><div class="form-grid"><label class="full">Cliente<select id="dClient">${data.clients.slice().sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(c=>`<option value="${c.id}" ${(c.id===(d?.clientId||clientId))?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><label class="full">Descrição<input id="dDesc" value="${esc(d?.description||'')}" placeholder="Ex.: Compra de ração, sementes, medicamento..."></label><label>Valor<input id="dValue" type="number" step="0.01" min="0.01" value="${d?.value??0}"></label><label>Vencimento<input id="dDue" type="date" value="${d?.due||today()}"></label></div><div class="stock-modal-actions"><button class="btn outline" id="cancelDebt">Cancelar</button><button class="btn primary" id="saveDebt">Salvar fiado</button></div>`);
  $('#cancelDebt').onclick=closeModal;
  $('#saveDebt').onclick=()=>{
    const v=+$('#dValue').value||0;
    if(v<=0)return toast('Informe o valor do fiado.');
    const obj=d||{id:uid('FIA'),balance:v,status:'Em aberto',createdAt:now()};
    const oldValue=Number(d?.value||v), oldBalance=Number(d?.balance||v);
    Object.assign(obj,{clientId:$('#dClient').value,description:$('#dDesc').value.trim()||'Venda fiada',value:v,due:$('#dDue').value});
    if(d){
      const paid=Math.max(0,oldValue-oldBalance);
      obj.balance=Math.max(0,v-paid);
      obj.status=obj.balance<=0?'Pago':'Em aberto';
    }else data.debts.push(obj);
    save();closeModal();
    if(page==='fiados')renderFiados(); else if(page==='clientes')renderClientes();
  }
}
function paymentForm(d){
  if(!d)return;
  const client=data.clients.find(c=>c.id===d.clientId);
  modal(`<h3>Registrar pagamento</h3><p class="modal-subtitle">Baixe total ou parcialmente o saldo do fiado.</p><div class="mini-grid"><div class="mini"><small>Cliente</small><strong>${esc(client?.name||'Cliente')}</strong></div><div class="mini"><small>Saldo atual</small><strong>${money(d.balance)}</strong></div></div><div class="form-grid"><label>Valor recebido<input id="payValue" type="number" step="0.01" min="0.01" max="${d.balance}" value="${d.balance}"></label><label>Forma de pagamento<select id="payMethod"><option>PIX</option><option>Dinheiro</option><option>Cartão - Crédito</option><option>Cartão - Débito</option><option>Transferência</option></select></label><label>Data<input id="payDate" type="date" value="${today()}"></label><label class="full">Observação<input id="payObs" placeholder="Opcional"></label></div><div class="stock-modal-actions"><button class="btn outline" id="cancelPay">Cancelar</button><button class="btn primary" id="savePay">Registrar pagamento</button></div>`);
  $('#cancelPay').onclick=closeModal;
  $('#savePay').onclick=()=>{
    const v=+$('#payValue').value||0;
    if(v<=0||v>Number(d.balance||0))return toast('Informe um valor válido.');
    d.balance=Math.max(0,Number(d.balance||0)-v);
    d.status=d.balance===0?'Pago':'Em aberto';
    data.payments.push({id:uid('PAG'),debtId:d.id,saleId:d.saleId||'',date:$('#payDate').value,value:v,method:$('#payMethod').value,obs:$('#payObs').value.trim()});
    syncSaleFromDebt(d);
    save();closeModal();renderFiados();
  }
}
function renderClientes(){
  const state=renderClientes.state||{search:'',page:1};
  renderClientes.state=state;
  const term=state.search.trim().toLowerCase();
  const filtered=data.clients.slice().filter(c=>!term||`${c.name} ${c.phone||''} ${c.email||''} ${c.document||''} ${c.city||''}`.toLowerCase().includes(term)).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  const perPage=10,pages=Math.max(1,Math.ceil(filtered.length/perPage));
  if(state.page>pages)state.page=pages;
  const start=(state.page-1)*perPage, view=filtered.slice(start,start+perPage);
  const withOpen=new Set(data.debts.filter(d=>d.status!=='Pago'&&Number(d.balance||0)>0).map(d=>d.clientId)).size;
  const totalOpen=data.debts.filter(d=>d.status!=='Pago').reduce((a,b)=>a+Number(b.balance||0),0);
  const received=data.payments.reduce((a,b)=>a+Number(b.value||0),0);
  $('#page').innerHTML=`
  <div class="grid client-kpis">
    <article class="card hover stock-stat-card"><div class="stock-stat-icon green">${ic('users')}</div><div class="stock-stat-copy"><small>Clientes Cadastrados</small><strong>${data.clients.length}</strong><div class="trend neutral">Base atual de clientes</div></div><div class="stock-stat-bars"></div></article>
    <article class="card hover stock-stat-card"><div class="stock-stat-icon amber">${ic('credit')}</div><div class="stock-stat-copy"><small>Com Fiados em Aberto</small><strong>${withOpen}</strong><div class="trend ${withOpen?'warn':'neutral'}">Clientes com saldo pendente</div></div><div class="stock-stat-bars amber"></div></article>
    <article class="card hover stock-stat-card"><div class="stock-stat-icon emerald">${ic('wallet')}</div><div class="stock-stat-copy"><small>Total a Receber</small><strong>${money(totalOpen)}</strong><div class="trend neutral">Saldo dos fiados em aberto</div></div><div class="stock-stat-bars green"></div></article>
    <article class="card hover stock-stat-card"><div class="stock-stat-icon blue">${ic('chart')}</div><div class="stock-stat-copy"><small>Pagamentos Recebidos</small><strong>${money(received)}</strong><div class="trend neutral">Histórico de recebimentos</div></div><div class="stock-stat-bars blue"></div></article>
  </div>
  <div class="card clients-main-card">
    <div class="client-page-head"><div><h2>Clientes</h2><p>Cadastre os clientes que compram fiado e acompanhe quem possui saldo em aberto.</p></div><button class="btn primary" id="newClient">${ic('plus')}Novo Cliente</button></div>
    <div class="client-toolbar"><label class="client-search"><i>${ic('report')}</i><input id="clientSearch" value="${esc(state.search)}" placeholder="Buscar por nome, telefone, CPF/CNPJ ou cidade..."></label><a class="btn outline" href="fiados.html">${ic('credit')}Ir para Fiados</a></div>
    <div class="table-wrap stock-table-wrap"><table class="table stock-table clients-table"><thead><tr><th>Cliente</th><th>Telefone</th><th>E-mail</th><th>CPF/CNPJ</th><th>Cidade</th><th>Fiados em Aberto</th><th>Ações</th></tr></thead><tbody>${view.map(c=>{const open=clientOpenDebts(c.id).reduce((a,b)=>a+Number(b.balance||0),0);return `<tr><td><div class="client-name-cell"><span class="client-avatar-sm">${clientInitials(c.name)}</span><div><strong>${esc(c.name)}</strong><small>${open>0?'Possui fiado':'Sem pendências'}</small></div></div></td><td>${esc(formatPhoneBR(c.phone))}</td><td>${esc(c.email||'-')}</td><td>${esc(c.document||'-')}</td><td>${esc(c.city||'-')}</td><td><strong class="${open>0?'client-debt-value':''}">${money(open)}</strong></td><td><div class="stock-actions"><button class="icon-btn" data-new-debt-client="${c.id}" title="Nova venda fiada">${ic('cart')}</button><button class="icon-btn" data-edit-client="${c.id}" title="Editar">${ic('edit')}</button><button class="icon-btn danger" data-del-client="${c.id}" title="Excluir">${ic('trash')}</button></div></td></tr>`}).join('')||`<tr><td colspan="7"><div class="empty stock-empty-inline">Nenhum cliente encontrado.</div></td></tr>`}</tbody></table></div>
    <div class="stock-pagination"><span>Exibindo ${filtered.length?start+1:0} a ${Math.min(start+perPage,filtered.length)} de ${filtered.length} cliente(s)</span><div class="stock-page-buttons">${Array.from({length:pages},(_,i)=>i+1).map(n=>`<button class="${n===state.page?'active':''}" data-client-page="${n}">${n}</button>`).join('')}</div></div>
  </div>`;
  $('#newClient').onclick=()=>clientForm();
  $('#clientSearch').oninput=e=>{state.search=e.target.value;state.page=1;renderClientes()};
  $$('[data-client-page]').forEach(b=>b.onclick=()=>{state.page=+b.dataset.clientPage;renderClientes()});
  $$('[data-new-debt-client]').forEach(b=>b.onclick=()=>{sessionStorage.setItem('pdv_prefill_client',b.dataset.newDebtClient);location.href='vendas.html'});
  $$('[data-edit-client]').forEach(b=>b.onclick=()=>clientForm(data.clients.find(c=>c.id===b.dataset.editClient)));
  $$('[data-del-client]').forEach(b=>b.onclick=()=>{const c=data.clients.find(x=>x.id===b.dataset.delClient);if(!c||!confirm(`Excluir ${c.name}?`))return;if(data.debts.some(d=>d.clientId===c.id))return toast('Cliente possui histórico de fiados e não pode ser excluído.');data.clients=data.clients.filter(x=>x!==c);save();renderClientes()});
}
function renderFiados(){
  const state=renderFiados.state||{search:'',status:'Todos',due:'Todos',selectedClientId:'',page:1};
  renderFiados.state=state;
  const open=data.debts.filter(d=>d.status!=='Pago'&&Number(d.balance||0)>0);
  const late=open.filter(debtIsLate);
  const now=new Date(),weekAgo=new Date(now.getTime()-7*86400000);
  const weeklyReceived=data.payments.filter(p=>new Date((p.date||today())+'T00:00:00')>=weekAgo).reduce((a,b)=>a+Number(b.value||0),0);
  const dueSoon=open.filter(debtIsSoon).reduce((a,b)=>a+Number(b.balance||0),0);
  const term=state.search.trim().toLowerCase();
  let filtered=data.debts.slice().filter(d=>{
    const c=data.clients.find(x=>x.id===d.clientId);
    const hit=!term||`${c?.name||''} ${c?.phone||''} ${c?.document||''} ${d.description||''}`.toLowerCase().includes(term);
    const statusLabel=debtStatusLabel(d);
    const statusHit=state.status==='Todos'||statusLabel===state.status;
    let dueHit=true;
    if(state.due==='Vencidos')dueHit=debtIsLate(d);
    if(state.due==='Próximos 7 dias')dueHit=debtIsSoon(d);
    if(state.due==='Pagos')dueHit=d.status==='Pago';
    return hit&&statusHit&&dueHit;
  }).sort((a,b)=>String(a.due||'9999').localeCompare(String(b.due||'9999')));
  const perPage=8,pages=Math.max(1,Math.ceil(filtered.length/perPage));if(state.page>pages)state.page=pages;
  const start=(state.page-1)*perPage, view=filtered.slice(start,start+perPage);
  if(!state.selectedClientId){const first=view[0]||open[0]||data.debts[0];state.selectedClientId=first?.clientId||data.clients[0]?.id||''}
  const selectedClient=data.clients.find(c=>c.id===state.selectedClientId)||null;
  const selectedDebts=selectedClient?data.debts.filter(d=>d.clientId===selectedClient.id):[];
  const selectedOpen=selectedDebts.filter(d=>d.status!=='Pago'&&Number(d.balance||0)>0);
  const selectedLate=selectedOpen.filter(debtIsLate).reduce((a,b)=>a+Number(b.balance||0),0);
  const selectedSoon=selectedOpen.filter(d=>!debtIsLate(d)).reduce((a,b)=>a+Number(b.balance||0),0);
  const selectedTotal=selectedOpen.reduce((a,b)=>a+Number(b.balance||0),0);
  const payments=selectedClient?clientPayments(selectedClient.id):[];
  $('#page').innerHTML=`
  <div class="grid debt-kpis">
    <article class="card hover stock-stat-card"><div class="stock-stat-icon green">${ic('wallet')}</div><div class="stock-stat-copy"><small>Total em Aberto</small><strong>${money(open.reduce((a,b)=>a+Number(b.balance||0),0))}</strong><div class="trend neutral">Saldo atual dos fiados</div></div><div class="stock-stat-bars"></div></article>
    <article class="card hover stock-stat-card"><div class="stock-stat-icon rose">${ic('users')}</div><div class="stock-stat-copy"><small>Clientes com Atraso</small><strong>${new Set(late.map(x=>x.clientId)).size}</strong><div class="trend ${late.length?'bad':'neutral'}">${late.length?`${late.length} conta(s) vencida(s)`:'Nenhum atraso'}</div></div><div class="stock-stat-bars rose"></div></article>
    <article class="card hover stock-stat-card"><div class="stock-stat-icon emerald">${ic('chart')}</div><div class="stock-stat-copy"><small>Recebimentos da Semana</small><strong>${money(weeklyReceived)}</strong><div class="trend neutral">Últimos 7 dias</div></div><div class="stock-stat-bars green"></div></article>
    <article class="card hover stock-stat-card"><div class="stock-stat-icon amber">${ic('clock')}</div><div class="stock-stat-copy"><small>A Vencer em 7 Dias</small><strong>${money(dueSoon)}</strong><div class="trend ${dueSoon?'warn':'neutral'}">Próximos vencimentos</div></div><div class="stock-stat-bars amber"></div></article>
  </div>
  <div class="debt-workspace">
    <div class="card debt-list-card">
      <div class="debt-tabs"><a class="active" href="fiados.html">${ic('credit')}Contas a Receber (Fiados)</a><a href="clientes.html">${ic('users')}Clientes</a><button class="btn primary" id="newDebt">${ic('cart')}Nova Venda Fiada</button></div>
      <div class="debt-toolbar"><label class="debt-search"><i>${ic('report')}</i><input id="debtSearch" value="${esc(state.search)}" placeholder="Buscar cliente, telefone, CPF/CNPJ ou descrição..."></label><select id="debtStatus"><option ${state.status==='Todos'?'selected':''}>Todos</option><option ${state.status==='Em atraso'?'selected':''}>Em atraso</option><option ${state.status==='A vencer'?'selected':''}>A vencer</option><option ${state.status==='Em dia'?'selected':''}>Em dia</option><option ${state.status==='Pago'?'selected':''}>Pago</option></select><select id="debtDue"><option ${state.due==='Todos'?'selected':''}>Todos</option><option ${state.due==='Vencidos'?'selected':''}>Vencidos</option><option ${state.due==='Próximos 7 dias'?'selected':''}>Próximos 7 dias</option><option ${state.due==='Pagos'?'selected':''}>Pagos</option></select></div>
      <div class="table-wrap debt-table-wrap"><table class="table debt-table"><thead><tr><th>Cliente</th><th>Telefone</th><th>Vencimento</th><th>Valor</th><th>Saldo</th><th>Status</th><th>Ações</th></tr></thead><tbody>${view.map(d=>{const c=data.clients.find(x=>x.id===d.clientId);const status=debtStatusLabel(d);const days=d.due?Math.ceil((new Date(d.due+'T23:59:59')-new Date())/86400000):null;return `<tr class="${state.selectedClientId===d.clientId?'selected-row':''}" data-select-client="${d.clientId}"><td><div class="client-name-cell"><span class="client-avatar-sm">${clientInitials(c?.name||'CL')}</span><strong>${esc(c?.name||'Cliente')}</strong></div></td><td>${esc(formatPhoneBR(c?.phone))}</td><td>${esc(d.due||'-')}${days!==null&&d.status!=='Pago'?`<small class="due-note ${days<0?'late':''}">${days<0?`${Math.abs(days)} dia(s) de atraso`:`${days} dia(s)`}</small>`:''}</td><td>${money(d.value)}</td><td><strong>${money(d.balance)}</strong></td><td><span class="debt-status ${debtStatusClass(d)}">${status}</span></td><td><div class="stock-actions">${d.status!=='Pago'?`<button class="icon-btn" data-pay-debt="${d.id}" title="Registrar pagamento">${ic('wallet')}</button>`:''}<button class="icon-btn" data-edit-debt="${d.id}" title="Editar">${ic('edit')}</button><button class="icon-btn danger" data-del-debt="${d.id}" title="Excluir">${ic('trash')}</button></div></td></tr>`}).join('')||`<tr><td colspan="7"><div class="empty stock-empty-inline">Nenhum fiado encontrado.</div></td></tr>`}</tbody></table></div>
      <div class="stock-pagination"><span>Exibindo ${filtered.length?start+1:0} a ${Math.min(start+perPage,filtered.length)} de ${filtered.length} registro(s)</span><div class="stock-page-buttons">${Array.from({length:pages},(_,i)=>i+1).map(n=>`<button class="${n===state.page?'active':''}" data-debt-page="${n}">${n}</button>`).join('')}</div></div>
    </div>
    <aside class="card debt-client-card">${selectedClient?`<div class="debt-client-head"><div class="client-avatar-lg">${clientInitials(selectedClient.name)}</div><div><h2>${esc(selectedClient.name)}</h2><span class="client-active-badge">Cliente ativo</span></div></div><div class="client-contact-list"><div>${ic('users')}<span>${esc(formatPhoneBR(selectedClient.phone))}</span></div><div>${ic('report')}<span>${esc(selectedClient.email||'-')}</span></div><div>${ic('report')}<span>${esc(selectedClient.document||'-')}</span></div><div>${ic('report')}<span>${esc(selectedClient.city||'-')}</span></div></div><div class="client-debt-summary"><div class="danger"><small>Total em Aberto</small><strong>${money(selectedTotal)}</strong></div><div class="danger"><small>Em Atraso</small><strong>${money(selectedLate)}</strong></div><div class="success"><small>A Vencer</small><strong>${money(selectedSoon)}</strong></div></div><div class="client-debt-actions"><button class="btn primary" id="paySelectedClient">${ic('wallet')}Registrar Pagamento</button><button class="btn outline" id="newSelectedDebt">${ic('cart')}Nova Venda Fiada</button><button class="btn outline" id="editSelectedClient">${ic('edit')}Editar Cliente</button><a class="btn outline" href="clientes.html">${ic('users')}Ver Cadastro</a></div><div class="client-history-tabs"><button class="active">Compras Fiadas em Aberto</button></div><div class="client-sale-lines">${selectedOpen.slice(0,4).map(d=>{const s=data.sales.find(x=>x.id===d.saleId);return `<div class="client-sale-line"><div><strong>${esc(s?String(s.id).slice(-6):'Fiado')}</strong><small>${esc((s?.lines||[]).map(l=>`${l.qty}x ${l.name}`).join(', ')||d.description||'Venda fiada')}</small></div><span>${money(d.balance)}</span></div>`}).join('')||'<div class="small-empty">Nenhuma compra fiada em aberto.</div>'}</div><div class="client-history-tabs"><button class="active">Histórico de Pagamentos</button></div><div class="client-payment-history">${payments.slice(0,6).map(p=>`<div class="payment-history-row"><span>${esc(p.date||'-')}</span><span>${esc(p.method||'Pagamento')}</span><strong>${money(p.value)}</strong></div>`).join('')||'<div class="small-empty">Nenhum pagamento registrado.</div>'}</div>`:`<div class="empty client-detail-empty">Cadastre um cliente para começar a controlar os fiados.</div>`}</aside>
  </div>`;
  $('#newDebt').onclick=()=>location.href='vendas.html';
  $('#debtSearch').oninput=e=>{state.search=e.target.value;state.page=1;renderFiados()};
  $('#debtStatus').onchange=e=>{state.status=e.target.value;state.page=1;renderFiados()};
  $('#debtDue').onchange=e=>{state.due=e.target.value;state.page=1;renderFiados()};
  $$('[data-debt-page]').forEach(b=>b.onclick=()=>{state.page=+b.dataset.debtPage;renderFiados()});
  $$('[data-select-client]').forEach(row=>row.onclick=e=>{if(e.target.closest('button'))return;state.selectedClientId=row.dataset.selectClient;renderFiados()});
  $$('[data-edit-debt]').forEach(b=>b.onclick=()=>debtForm(data.debts.find(d=>d.id===b.dataset.editDebt)));
  $$('[data-pay-debt]').forEach(b=>b.onclick=()=>paymentForm(data.debts.find(d=>d.id===b.dataset.payDebt)));
  $$('[data-del-debt]').forEach(b=>b.onclick=()=>{const d=data.debts.find(x=>x.id===b.dataset.delDebt);if(!d)return;if(d.saleId)return toast('Este fiado foi criado por uma venda e deve ser preservado no histórico.');if(!confirm('Excluir este fiado?'))return;data.payments=data.payments.filter(p=>p.debtId!==d.id);data.debts=data.debts.filter(x=>x!==d);save();renderFiados()});
  if(selectedClient){
    $('#newSelectedDebt').onclick=()=>{sessionStorage.setItem('pdv_prefill_client',selectedClient.id);location.href='vendas.html'};
    $('#editSelectedClient').onclick=()=>clientForm(selectedClient);
    $('#paySelectedClient').onclick=()=>{const d=selectedOpen.sort((a,b)=>String(a.due).localeCompare(String(b.due)))[0];if(!d)return toast('Este cliente não possui fiados em aberto.');paymentForm(d)};
  }
}

function analyticsDate(v){return String(v||'').slice(0,10)}
function analyticsInRange(v,start,end){const d=analyticsDate(v);return (!start||d>=start)&&(!end||d<=end)}
function analyticsMonthKey(v){return analyticsDate(v).slice(0,7)}
function analyticsMonthLabel(key){if(!key)return'-';const [y,m]=key.split('-');const names=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];return `${names[Number(m)-1]}/${String(y).slice(-2)}`}
function analyticsProduct(productId){return data.products.find(p=>p.id===productId)}
function analyticsSaleCategory(line){return analyticsProduct(line?.productId)?.category||'Sem categoria'}
function analyticsSaleCost(line){const p=analyticsProduct(line?.productId);return Number(p?.cost||0)*Number(line?.qty||0)}
function analyticsSaleRevenue(line){return (Number(line?.price||0)*Number(line?.qty||0))-Number(line?.discount||0)}
function analyticsFmt(v){return Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:0})}
function analyticsPct(v){return `${Number(v||0).toFixed(1).replace('.',',')}%`}
function analyticsHorizontalBars(items,valueFormatter=money){
  if(!items.length)return '<div class="analytics-empty">Sem dados para o período selecionado.</div>';
  const max=Math.max(1,...items.map(x=>Number(x.value||0)));
  return `<div class="analytics-hbars">${items.map((x,i)=>`<div class="analytics-hrow"><div class="analytics-hlabel"><span>${esc(x.label)}</span><b>${valueFormatter(x.value)}</b></div><div class="analytics-track"><span style="width:${Math.max(3,Number(x.value||0)/max*100)}%"></span></div>${x.sub?`<small>${esc(x.sub)}</small>`:''}</div>`).join('')}</div>`;
}
function analyticsDonut(items,total,centerLabel='Total'){
  if(!items.length||!total)return '<div class="analytics-empty">Sem dados suficientes para composição.</div>';
  const colors=['#0d7a4b','#42a765','#93c86f','#f0ad36','#d57b3d','#6b84d9','#b067c8','#9daaa3'];
  let acc=0;
  const gradient=items.map((x,i)=>{const s=acc;acc+=Number(x.value||0)/total*100;return `${colors[i%colors.length]} ${s}% ${acc}%`}).join(', ');
  return `<div class="analytics-donut-wrap"><div class="analytics-donut" style="background:conic-gradient(${gradient})"><div class="analytics-donut-center"><strong>${money(total)}</strong><small>${esc(centerLabel)}</small></div></div><div class="analytics-donut-legend">${items.map((x,i)=>`<div><span><i style="background:${colors[i%colors.length]}"></i>${esc(x.label)}</span><b>${analyticsPct(Number(x.value||0)/total*100)}</b></div>`).join('')}</div></div>`;
}
function analyticsGroupedBars(items){
  if(!items.length)return '<div class="analytics-empty">Sem dados suficientes.</div>';
  const max=Math.max(1,...items.flatMap(x=>[Number(x.revenue||0),Number(x.expenses||0)]));
  return `<div class="analytics-grouped-chart"><div class="analytics-yaxis"><span>${money(max)}</span><span>${money(max*.75)}</span><span>${money(max*.5)}</span><span>${money(max*.25)}</span><span>R$ 0</span></div><div class="analytics-grouped-bars">${items.map(x=>`<div class="analytics-month-col"><div class="analytics-bar-pair"><div class="analytics-vbar revenue" style="height:${Math.max(2,Number(x.revenue||0)/max*100)}%" data-tip="${x.label} • Receitas: ${money(x.revenue)}"></div><div class="analytics-vbar expense" style="height:${Math.max(2,Number(x.expenses||0)/max*100)}%" data-tip="${x.label} • Despesas: ${money(x.expenses)}"></div></div><small>${esc(x.label)}</small></div>`).join('')}</div></div><div class="analytics-chart-legend"><span><i class="revenue"></i>Receitas</span><span><i class="expense"></i>Despesas</span></div>`;
}
function analyticsDailyBars(items){
  if(!items.length)return '<div class="analytics-empty">Sem vendas no período.</div>';
  const max=Math.max(1,...items.map(x=>Number(x.value||0)));
  return `<div class="analytics-daily-chart">${items.map(x=>`<div class="analytics-day-col"><div class="analytics-day-value">${money(x.value)}</div><div class="analytics-day-bar" style="height:${Math.max(4,x.value/max*100)}%" data-tip="${esc(x.label)} • ${money(x.value)}"></div><small>${esc(x.short)}</small></div>`).join('')}</div>`;
}
function exportAnalyticsCSV(rows,name='painel_geral.csv'){
  downloadCSV(name,['Data','Tipo','Descrição','Categoria','Cliente/Fornecedor','Pagamento/Status','Valor'],rows)
}

function renderIndicadores(){
  const nowDate=new Date();
  const firstMonth=new Date(nowDate.getFullYear(),nowDate.getMonth(),1).toISOString().slice(0,10);
  const state=renderIndicadores.state||{start:firstMonth,end:today(),category:'Todas',payment:'Todos',supplier:'Todos'};
  renderIndicadores.state=state;

  const categories=['Todas',...inventoryCategories()];
  const paymentOptions=['Todos',...new Set(data.sales.map(s=>s.paymentType||(/^Cartão/.test(s.payment||'')?'Cartão':s.payment)).filter(Boolean))];
  const suppliers=['Todos',...inventorySuppliers()];

  const salesPeriod=data.sales.filter(s=>analyticsInRange(s.date,state.start,state.end));
  const filteredSales=salesPeriod.filter(s=>{
    const pay=s.paymentType||(/^Cartão/.test(s.payment||'')?'Cartão':s.payment);
    if(state.payment!=='Todos'&&pay!==state.payment)return false;
    if(state.category!=='Todas'){
      return (s.lines||[]).some(line=>analyticsSaleCategory(line)===state.category);
    }
    return true;
  });

  const expenses=data.expenses.filter(e=>analyticsInRange(e.date,state.start,state.end));
  const entries=data.entries.filter(e=>analyticsInRange(e.date,state.start,state.end)).filter(e=>{
    if(state.supplier!=='Todos'&&e.supplier!==state.supplier)return false;
    if(state.category!=='Todas'){
      const p=analyticsProduct(e.productId);
      if((p?.category||'Sem categoria')!==state.category)return false;
    }
    return true;
  });
  const debts=data.debts.filter(d=>analyticsInRange(d.createdAt||d.due,state.start,state.end));
  const payments=data.payments.filter(p=>analyticsInRange(p.date,state.start,state.end));

  const salesRevenue=filteredSales.reduce((s,x)=>s+Number(x.total||0),0);
  const salesCost=filteredSales.reduce((s,sale)=>s+(sale.lines||[]).reduce((a,l)=>a+analyticsSaleCost(l),0),0);
  const grossProfit=salesRevenue-salesCost;
  const totalExpenses=expenses.reduce((s,x)=>s+Number(x.value||0),0);
  const netResult=grossProfit-totalExpenses;
  const ticket=filteredSales.length?salesRevenue/filteredSales.length:0;
  const openDebt=data.debts.filter(d=>Number(d.balance||0)>0).reduce((s,d)=>s+Number(d.balance||0),0);
  const stockValue=data.products.reduce((s,p)=>s+Number(p.stock||0)*Number(p.cost||0),0);
  const lowStock=data.products.filter(p=>Number(p.stock||0)<=Number(p.min||0)).length;

  const monthKeys=[];
  for(let i=5;i>=0;i--){
    const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  const monthly=monthKeys.map(key=>{
    const monthSales=filteredSales.filter(s=>analyticsMonthKey(s.date)===key).reduce((a,b)=>a+Number(b.total||0),0);
    const monthExpenses=expenses.filter(e=>analyticsMonthKey(e.date)===key).reduce((a,b)=>a+Number(b.value||0),0);
    return {key,label:analyticsMonthLabel(key),revenue:monthSales,expenses:monthExpenses};
  });

  const dailyMap={};
  filteredSales.forEach(s=>{const d=analyticsDate(s.date);dailyMap[d]=(dailyMap[d]||0)+Number(s.total||0)});
  const daily=Object.entries(dailyMap).sort().slice(-30).map(([date,value])=>({label:date.split('-').reverse().join('/'),short:date.slice(8,10),value}));

  const categoryMap={};
  filteredSales.forEach(s=>(s.lines||[]).forEach(l=>{const c=analyticsSaleCategory(l);categoryMap[c]=(categoryMap[c]||0)+analyticsSaleRevenue(l)}));
  const categoryItems=Object.entries(categoryMap).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value).slice(0,7);

  const payMap={};
  filteredSales.forEach(s=>{const p=salePaymentLabel(s);payMap[p]=(payMap[p]||0)+Number(s.total||0)});
  const payItems=Object.entries(payMap).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value).slice(0,7);

  const productMap={};
  filteredSales.forEach(s=>(s.lines||[]).forEach(l=>{
    const key=l.productId||l.name;
    if(!productMap[key])productMap[key]={label:l.name||'Produto',qty:0,value:0};
    productMap[key].qty+=Number(l.qty||0);productMap[key].value+=analyticsSaleRevenue(l);
  }));
  const topProducts=Object.values(productMap).sort((a,b)=>b.qty-a.qty).slice(0,6).map(x=>({label:x.label,value:x.qty,sub:`${money(x.value)} em vendas`}));

  const expenseMap={};
  expenses.forEach(e=>expenseMap[e.category||'Outros']=(expenseMap[e.category||'Outros']||0)+Number(e.value||0));
  const topExpenses=Object.entries(expenseMap).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value).slice(0,6);

  const stockCat={};
  data.products.forEach(p=>{
    if(state.category!=='Todas'&&p.category!==state.category)return;
    if(state.supplier!=='Todos'&&p.supplier!==state.supplier)return;
    const c=p.category||'Sem categoria';
    stockCat[c]=(stockCat[c]||0)+Number(p.stock||0);
  });
  const stockItems=Object.entries(stockCat).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value).slice(0,7);

  const supplierMap={};
  entries.forEach(e=>supplierMap[e.supplier||'Sem fornecedor']=(supplierMap[e.supplier||'Sem fornecedor']||0)+Number(e.qty||0)*Number(e.cost||0));
  const supplierItems=Object.entries(supplierMap).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value).slice(0,6);

  const fiadoMap={Em_aberto:0,Parcial:0,Recebido:0};
  data.sales.filter(s=>analyticsInRange(s.date,state.start,state.end)&&s.paymentType==='Fiado').forEach(s=>{
    const st=s.financialStatus||'Em aberto';
    if(st==='Recebida')fiadoMap.Recebido+=Number(s.total||0);
    else if(st==='Parcial')fiadoMap.Parcial+=Number(s.total||0);
    else fiadoMap.Em_aberto+=Number(s.total||0);
  });
  const fiadoItems=[
    {label:'Em aberto',value:fiadoMap.Em_aberto},
    {label:'Parcial',value:fiadoMap.Parcial},
    {label:'Recebido',value:fiadoMap.Recebido}
  ].filter(x=>x.value>0);

  const combinedRows=[
    ...filteredSales.map(s=>[analyticsDate(s.date),'Venda',`Venda ${String(s.id).slice(-5)}`,'Vendas',s.client||'Sem cliente',salePaymentLabel(s),s.total]),
    ...expenses.map(e=>[analyticsDate(e.date),'Despesa',e.description||'-',e.category||'-',e.supplier||'-',e.status||'-',-Number(e.value||0)]),
    ...entries.map(e=>[analyticsDate(e.date),'Entrada',e.product||'-',analyticsProduct(e.productId)?.category||'-',e.supplier||'-',e.status||'-',Number(e.qty||0)*Number(e.cost||0)])
  ].sort((a,b)=>String(b[0]).localeCompare(String(a[0])));

  $('#page').innerHTML=`
  <div class="card analytics-filter-card">
    <div class="analytics-filter-grid">
      <label><span>Período</span><div class="analytics-date-range"><input id="anStart" type="date" value="${state.start}"><b>→</b><input id="anEnd" type="date" value="${state.end}"></div></label>
      <label><span>Categoria</span><select id="anCategory">${categories.map(x=>`<option ${x===state.category?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
      <label><span>Pagamento</span><select id="anPayment">${paymentOptions.map(x=>`<option ${x===state.payment?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
      <label><span>Fornecedor</span><select id="anSupplier">${suppliers.map(x=>`<option ${x===state.supplier?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
      <div class="analytics-filter-actions"><button class="btn outline" id="anClear">${ic('filter')}Limpar</button><button class="btn primary" id="anExport">${ic('download')}Exportar geral</button></div>
    </div>
  </div>

  <div class="analytics-kpi-grid">
    <article class="card analytics-kpi"><div class="analytics-kpi-icon green">${ic('cart')}</div><div><small>Faturamento</small><strong>${money(salesRevenue)}</strong><span>${filteredSales.length} venda(s)</span></div></article>
    <article class="card analytics-kpi"><div class="analytics-kpi-icon blue">${ic('credit')}</div><div><small>Ticket Médio</small><strong>${money(ticket)}</strong><span>Valor médio por venda</span></div></article>
    <article class="card analytics-kpi"><div class="analytics-kpi-icon emerald">${ic('chart')}</div><div><small>Lucro Bruto Est.</small><strong>${money(grossProfit)}</strong><span>Vendas menos custo dos produtos</span></div></article>
    <article class="card analytics-kpi"><div class="analytics-kpi-icon rose">${ic('wallet')}</div><div><small>Despesas</small><strong>${money(totalExpenses)}</strong><span>${expenses.length} lançamento(s)</span></div></article>
    <article class="card analytics-kpi"><div class="analytics-kpi-icon ${netResult>=0?'green':'rose'}">${ic('bank')}</div><div><small>Resultado Est.</small><strong>${money(netResult)}</strong><span>Lucro bruto menos despesas</span></div></article>
    <article class="card analytics-kpi"><div class="analytics-kpi-icon amber">${ic('users')}</div><div><small>Fiados em Aberto</small><strong>${money(openDebt)}</strong><span>A receber atualmente</span></div></article>
    <article class="card analytics-kpi"><div class="analytics-kpi-icon purple">${ic('box')}</div><div><small>Valor do Estoque</small><strong>${money(stockValue)}</strong><span>${lowStock} item(ns) em baixo estoque</span></div></article>
    <article class="card analytics-kpi"><div class="analytics-kpi-icon teal">${ic('tray')}</div><div><small>Entradas</small><strong>${money(entries.reduce((s,e)=>s+Number(e.qty||0)*Number(e.cost||0),0))}</strong><span>${entries.length} lançamento(s)</span></div></article>
  </div>

  <div class="analytics-row analytics-row-main">
    <div class="card analytics-chart-card large">
      <div class="analytics-title"><div><h2>Receitas x Despesas</h2><p>Comparativo dos últimos 6 meses.</p></div><span class="analytics-pill">6 meses</span></div>
      ${analyticsGroupedBars(monthly)}
    </div>
    <div class="card analytics-chart-card">
      <div class="analytics-title"><div><h2>Vendas por Categoria</h2><p>Participação no faturamento filtrado.</p></div></div>
      ${analyticsDonut(categoryItems,categoryItems.reduce((s,x)=>s+x.value,0),'Faturamento')}
    </div>
  </div>

  <div class="analytics-row analytics-row-main">
    <div class="card analytics-chart-card large">
      <div class="analytics-title"><div><h2>Faturamento Diário</h2><p>Últimos registros dentro do período selecionado.</p></div><span class="analytics-pill">${daily.length} dia(s)</span></div>
      ${analyticsDailyBars(daily)}
    </div>
    <div class="card analytics-chart-card">
      <div class="analytics-title"><div><h2>Formas de Pagamento</h2><p>Distribuição das vendas por meio de pagamento.</p></div></div>
      ${analyticsDonut(payItems,payItems.reduce((s,x)=>s+x.value,0),'Vendas')}
    </div>
  </div>

  <div class="analytics-grid-3">
    <div class="card analytics-mini-card"><div class="analytics-title"><div><h2>Produtos Mais Vendidos</h2><p>Ranking por quantidade.</p></div></div>${analyticsHorizontalBars(topProducts,v=>`${analyticsFmt(v)} un`)}</div>
    <div class="card analytics-mini-card"><div class="analytics-title"><div><h2>Principais Despesas</h2><p>Valor por categoria.</p></div></div>${analyticsHorizontalBars(topExpenses,money)}</div>
    <div class="card analytics-mini-card"><div class="analytics-title"><div><h2>Estoque por Categoria</h2><p>Quantidade disponível.</p></div></div>${analyticsHorizontalBars(stockItems,v=>`${analyticsFmt(v)} un`)}</div>
  </div>

  <div class="analytics-grid-3">
    <div class="card analytics-mini-card"><div class="analytics-title"><div><h2>Entradas por Fornecedor</h2><p>Compras no período.</p></div></div>${analyticsHorizontalBars(supplierItems,money)}</div>
    <div class="card analytics-mini-card"><div class="analytics-title"><div><h2>Situação dos Fiados</h2><p>Visão financeira das vendas fiadas.</p></div></div>${analyticsDonut(fiadoItems,fiadoItems.reduce((s,x)=>s+x.value,0),'Fiados')}</div>
    <div class="card analytics-mini-card">
      <div class="analytics-title"><div><h2>Resumo Operacional</h2><p>Visão rápida do cadastro e movimentação.</p></div></div>
      <div class="analytics-summary-list">
        <div><span>${ic('box')} Produtos cadastrados</span><b>${data.products.length}</b></div>
        <div><span>${ic('users')} Clientes cadastrados</span><b>${data.clients.length}</b></div>
        <div><span>${ic('tray')} Entradas no período</span><b>${entries.length}</b></div>
        <div><span>${ic('wallet')} Despesas no período</span><b>${expenses.length}</b></div>
        <div><span>${ic('credit')} Pagamentos de fiados</span><b>${payments.length}</b></div>
        <div><span>${ic('bell')} Baixo estoque</span><b>${lowStock}</b></div>
      </div>
    </div>
  </div>

  <div class="card analytics-report-card">
    <div class="analytics-report-head">
      <div><h2>${ic('report')} Relatórios e Exportações</h2><p>Exporte dados completos ou use o resumo abaixo para conferência.</p></div>
      <div class="analytics-report-actions">
        <button class="btn outline" id="exportSales">${ic('download')}Vendas</button>
        <button class="btn outline" id="exportStock">${ic('download')}Estoque</button>
        <button class="btn outline" id="exportExpenses">${ic('download')}Despesas</button>
        <button class="btn outline" id="exportDebts">${ic('download')}Fiados</button>
        <button class="btn primary" id="printAnalytics">${ic('report')}Imprimir painel</button>
      </div>
    </div>
    <div class="analytics-table-wrap"><table class="table analytics-table"><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Cliente / Fornecedor</th><th>Pagamento / Status</th><th>Valor</th></tr></thead><tbody>${combinedRows.slice(0,12).map(r=>`<tr><td>${esc(r[0])}</td><td><span class="analytics-type ${r[1].toLowerCase()}">${esc(r[1])}</span></td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td><td>${esc(r[5])}</td><td class="${Number(r[6])<0?'analytics-negative':''}"><strong>${money(Math.abs(Number(r[6]||0)))}</strong></td></tr>`).join('')||`<tr><td colspan="7"><div class="analytics-empty">Sem movimentações para o período.</div></td></tr>`}</tbody></table></div>
  </div>`;

  const apply=()=>{renderIndicadores.state={start:$('#anStart').value,end:$('#anEnd').value,category:$('#anCategory').value,payment:$('#anPayment').value,supplier:$('#anSupplier').value};renderIndicadores()};
  $('#anStart').onchange=apply;$('#anEnd').onchange=apply;$('#anCategory').onchange=apply;$('#anPayment').onchange=apply;$('#anSupplier').onchange=apply;
  $('#anClear').onclick=()=>{renderIndicadores.state={start:firstMonth,end:today(),category:'Todas',payment:'Todos',supplier:'Todos'};renderIndicadores()};
  $('#anExport').onclick=()=>exportAnalyticsCSV(combinedRows);
  $('#exportSales').onclick=()=>downloadCSV('relatorio_vendas.csv',['Data','Cliente','Itens','Total','Pagamento','Status Financeiro'],filteredSales.map(s=>[s.date,s.client,s.items,s.total,salePaymentLabel(s),s.financialStatus||'Recebida']));
  $('#exportStock').onclick=()=>downloadCSV('relatorio_estoque.csv',['Código','Produto','Categoria','Estoque','Mínimo','Custo','Preço','Fornecedor'],data.products.map(p=>[p.code||p.id,p.name,p.category,p.stock,p.min,p.cost,p.price,p.supplier]));
  $('#exportExpenses').onclick=()=>downloadCSV('relatorio_despesas.csv',['Data','Categoria','Descrição','Fornecedor','Pagamento','Valor','Status'],expenses.map(e=>[e.date,e.category,e.description,e.supplier,e.payment,e.value,e.status]));
  $('#exportDebts').onclick=()=>downloadCSV('relatorio_fiados.csv',['Cliente','Descrição','Valor','Saldo','Vencimento','Status'],data.debts.map(d=>[clientName(d.clientId),d.description,d.value,d.balance,d.due,debtStatus(d)]));
  $('#printAnalytics').onclick=()=>window.print();
}
function renderRelatorios(){renderIndicadores()}

function ensureSettings(){
  data.settings={...blank.settings,...(data.settings||{})};
  save();
  return data.settings;
}
function downloadFullBackup(){
  const backup={version:1,createdAt:new Date().toISOString(),app:'AgroGestão D Chácara',data};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`dchacara_backup_${today()}.json`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  data.settings.lastBackup=now();
  save();
  if(page==='configuracoes')renderConfiguracoes();
  toast('Backup exportado com sucesso.');
}
function restoreFullBackup(file){
  if(!file)return toast('Selecione um arquivo de backup.');
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const parsed=JSON.parse(String(reader.result||'{}'));
      const restored=parsed.data||parsed;
      if(!restored||typeof restored!=='object'||!Array.isArray(restored.products)||!Array.isArray(restored.sales))throw new Error('invalid');
      if(!confirm('Restaurar este backup? Os dados atuais serão substituídos.'))return;
      data={...structuredClone(blank),...restored,settings:{...blank.settings,...(restored.settings||{})}};
      save();
      toast('Backup restaurado. Recarregando o sistema...');
      setTimeout(()=>location.reload(),700);
    }catch(e){toast('Arquivo de backup inválido.');}
  };
  reader.readAsText(file,'utf-8');
}
function systemDataStats(){
  return {
    products:data.products.length,
    clients:data.clients.length,
    sales:data.sales.length,
    expenses:data.expenses.length,
    entries:data.entries.length,
    debts:data.debts.filter(d=>Number(d.balance||0)>0).length
  };
}


function renderConfiguracoes(){
  const s=ensureSettings();
  const stats=systemDataStats();
  const lastBackup=s.lastBackup?String(s.lastBackup).replace('T',' ').slice(0,16):'Nenhum backup exportado';
  $('#page').innerHTML=`
  <div class="settings-layout">
    <div class="settings-main">

      <div class="card settings-section">
        <div class="settings-section-head"><div class="settings-head-icon">${ic('report')}</div><div><h2>Perfil da Empresa</h2><p>Dados usados no sistema, comprovantes e relatórios.</p></div></div>
        <div class="settings-form-grid">
          <label><span>Nome da loja</span><input id="sStore" value="${esc(s.store)}"></label>
          <label><span>CNPJ</span><input id="sCnpj" value="${esc(s.cnpj)}" placeholder="00.000.000/0001-00"></label>
          <label><span>Telefone</span><input id="sPhone" value="${esc(s.phone)}" placeholder="(64) 99999-9999"></label>
          <label><span>E-mail</span><input id="sEmail" value="${esc(s.email)}" placeholder="contato@empresa.com.br"></label>
          <label class="full"><span>Endereço</span><input id="sAddress" value="${esc(s.address)}" placeholder="Rua, número, bairro"></label>
          <label><span>Cidade</span><input id="sCity" value="${esc(s.city)}"></label>
          <label><span>Estado</span><input id="sState" value="${esc(s.state)}" maxlength="2"></label>
          <label><span>Abertura</span><input id="sOpen" type="time" value="${esc(s.open)}"></label>
          <label><span>Fechamento</span><input id="sClose" type="time" value="${esc(s.close)}"></label>
        </div>
      </div>

      <div class="card settings-section">
        <div class="settings-section-head"><div class="settings-head-icon">${ic('settings')}</div><div><h2>Preferências da Operação</h2><p>Defina valores padrão usados nos cadastros e lançamentos.</p></div></div>
        <div class="settings-form-grid three">
          <label><span>Estoque mínimo padrão</span><input id="sDefaultMin" type="number" min="0" value="${Number(s.defaultMinStock||0)}"></label>
          <label><span>Vencimento padrão do fiado</span><div class="settings-input-suffix"><input id="sFiadoDays" type="number" min="1" value="${Number(s.defaultFiadoDays||30)}"><em>dias</em></div></label>
          <label><span>Vendedor padrão</span><input id="sSeller" value="${esc(s.defaultSeller||'Luiz Silva')}"></label>
        </div>
      </div>

      <div class="card settings-section">
        <div class="settings-section-head"><div class="settings-head-icon">${ic('credit')}</div><div><h2>Formas de Pagamento</h2><p>Escolha quais opções devem ficar disponíveis no PDV.</p></div></div>
        <div class="settings-payment-grid">
          <label class="settings-check-card"><input type="checkbox" id="payPix" ${s.payPix!==false?'checked':''}><span>${ic('check')}</span><div><strong>PIX</strong><small>Pagamento imediato</small></div></label>
          <label class="settings-check-card"><input type="checkbox" id="payCard" ${s.payCard!==false?'checked':''}><span>${ic('credit')}</span><div><strong>Cartão</strong><small>Crédito ou débito</small></div></label>
          <label class="settings-check-card"><input type="checkbox" id="payCash" ${s.payCash!==false?'checked':''}><span>${ic('wallet')}</span><div><strong>Dinheiro</strong><small>Pagamento em espécie</small></div></label>
          <label class="settings-check-card"><input type="checkbox" id="payBoleto" ${s.payBoleto!==false?'checked':''}><span>${ic('report')}</span><div><strong>Boleto</strong><small>Compensação bancária</small></div></label>
          <label class="settings-check-card"><input type="checkbox" id="payFiado" ${s.payFiado!==false?'checked':''}><span>${ic('users')}</span><div><strong>Fiado</strong><small>Conta a receber vinculada ao cliente</small></div></label>
        </div>
      </div>

      <div class="settings-save-bar">
        <div><strong>Alterações de configuração</strong><small>Salve para aplicar as novas preferências no sistema.</small></div>
        <button class="btn primary" id="saveSettings">${ic('check')}Salvar alterações</button>
      </div>
    </div>

    <aside class="settings-side">

      <div class="card settings-side-card">
        <div class="settings-side-head"><div class="settings-side-icon green">${ic('bell')}</div><div><h3>Alertas</h3><p>Controle o que aparece no sino de notificações.</p></div></div>
        <div class="settings-toggle-row"><div><strong>Alertas do sistema</strong><small>${s.alerts!==false?'Ativados':'Desativados'}</small></div><label class="switch"><input id="sAlerts" type="checkbox" ${s.alerts!==false?'checked':''}><span></span></label></div>
        <div class="settings-toggle-row"><div><strong>Estoque baixo</strong><small>Avisa quando estoque ≤ mínimo</small></div><label class="switch"><input id="sAlertStock" type="checkbox" ${s.alertStock!==false?'checked':''}><span></span></label></div>
        <div class="settings-toggle-row"><div><strong>Fiados vencidos</strong><small>Avisa contas em atraso</small></div><label class="switch"><input id="sAlertDebts" type="checkbox" ${s.alertDebts!==false?'checked':''}><span></span></label></div>
      </div>

      <div class="card settings-side-card">
        <div class="settings-side-head"><div class="settings-side-icon blue">${ic('download')}</div><div><h3>Backup e Restauração</h3><p>Proteja os dados da loja com cópias externas.</p></div></div>
        <div class="settings-backup-status"><small>Último backup exportado</small><strong>${esc(lastBackup)}</strong></div>
        <button class="settings-action-btn primary" id="exportBackup">${ic('download')}Exportar backup completo</button>
        <label class="settings-action-btn file">${ic('download')}Restaurar backup<input id="restoreBackup" type="file" accept=".json,application/json" hidden></label>
        <div class="settings-backup-note">${ic('check')} O arquivo contém produtos, vendas, estoque, despesas, clientes, fiados e configurações.</div>
      </div>

      <div class="card settings-side-card">
        <div class="settings-side-head"><div class="settings-side-icon amber">${ic('chart')}</div><div><h3>Dados do Sistema</h3><p>Resumo rápido da base atual.</p></div></div>
        <div class="settings-stats-grid">
          <div><strong>${stats.products}</strong><small>Produtos</small></div>
          <div><strong>${stats.clients}</strong><small>Clientes</small></div>
          <div><strong>${stats.sales}</strong><small>Vendas</small></div>
          <div><strong>${stats.entries}</strong><small>Entradas</small></div>
          <div><strong>${stats.expenses}</strong><small>Despesas</small></div>
          <div><strong>${stats.debts}</strong><small>Fiados abertos</small></div>
        </div>
      </div>

      <div class="card settings-side-card danger-zone">
        <div class="settings-side-head"><div class="settings-side-icon rose">${ic('settings')}</div><div><h3>Restauração</h3><p>Volte apenas as preferências aos valores padrão.</p></div></div>
        <button class="settings-action-btn danger" id="resetSettings">${ic('settings')}Restaurar configurações padrão</button>
        <small class="danger-note">Restaura somente as preferências. Produtos, vendas e demais registros são mantidos.</small>
        <div class="settings-danger-divider"></div>
        <button class="settings-action-btn danger strong-danger" id="resetAllData">${ic('trash')}Resetar todos os dados</button>
        <small class="danger-note">Apaga produtos, estoque, vendas, entradas, despesas, clientes, fiados, pagamentos, foto de perfil e configurações locais.</small>
      </div>

    </aside>
  </div>`;

  $('#saveSettings').onclick=()=>{
    Object.assign(data.settings,{
      store:$('#sStore').value.trim(),
      cnpj:$('#sCnpj').value.trim(),
      phone:$('#sPhone').value.trim(),
      email:$('#sEmail').value.trim(),
      address:$('#sAddress').value.trim(),
      city:$('#sCity').value.trim(),
      state:$('#sState').value.trim().toUpperCase(),
      open:$('#sOpen').value,
      close:$('#sClose').value,
      defaultMinStock:Math.max(0,Number($('#sDefaultMin').value||0)),
      defaultFiadoDays:Math.max(1,Number($('#sFiadoDays').value||30)),
      defaultSeller:$('#sSeller').value.trim()||'Luiz Silva',
      payPix:$('#payPix').checked,
      payCard:$('#payCard').checked,
      payCash:$('#payCash').checked,
      payBoleto:$('#payBoleto').checked,
      payFiado:$('#payFiado').checked,
      alerts:$('#sAlerts').checked,
      alertStock:$('#sAlertStock').checked,
      alertDebts:$('#sAlertDebts').checked
    });
    save();
    toast('Configurações salvas com sucesso.');
    setTimeout(()=>location.reload(),450);
  };
  $('#exportBackup').onclick=downloadFullBackup;
  $('#restoreBackup').onchange=e=>restoreFullBackup(e.target.files?.[0]);
  $('#resetSettings').onclick=()=>{
    if(!confirm('Restaurar apenas as configurações para o padrão?'))return;
    data.settings={...structuredClone(blank.settings),lastBackup:data.settings.lastBackup||''};
    save();
    toast('Configurações restauradas.');
    setTimeout(()=>location.reload(),450);
  };
  $('#resetAllData').onclick=async()=>{
    const answer=prompt('Esta ação apaga TODOS os dados compartilhados da D Chácara em TODOS os computadores. Digite RESETAR para confirmar:');
    if(answer!=='RESETAR')return toast('Reset cancelado.');
    data=structuredClone(blank);
    localStorage.setItem(KEY,JSON.stringify(data));
    localStorage.removeItem(PROFILE_PHOTO_KEY);
    sessionStorage.removeItem('dchacara_last_sale_id');
    cloudReady=true;
    await pushCloudState(true);
    toast('Todos os dados compartilhados foram resetados.');
    setTimeout(()=>location.reload(),650);
  };
}
shell();({dashboard:renderDashboard,vendas:renderVendas,estoque:renderEstoque,entradas:renderEntradas,despesas:renderDespesas,fiados:renderFiados,clientes:renderClientes,indicadores:renderIndicadores,relatorios:renderRelatorios,configuracoes:renderConfiguracoes}[page]||renderDashboard)();
})();
