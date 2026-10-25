/* ============================================================
   D CHÁCARA EMPÓRIO — TEMA VISUAL v2.0
   Só aparência: dá cor padronizada aos cards de indicador e
   coloca ícones nos títulos. Não altera dados nem Supabase.
   Carregar DEPOIS de js/app.js.
   ============================================================ */
(()=>{
  const ICONS={
    cart:'<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2.5 11h10.7l2.2-8H6.2"/>',
    box:'<path d="m12 2 8 4.5v11L12 22 4 17.5v-11L12 2Z"/><path d="M12 22V11"/><path d="m20 6.5-8 4.5-8-4.5"/>',
    wallet:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M16 12h5"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
    chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20V9"/>',
    trend:'<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    pie:'<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
    report:'<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5M9 13h6M9 17h6"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
    credit:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>',
    truck:'<path d="M3 7h11v8H3z"/><path d="M14 10h4l3 3v2h-7z"/><circle cx="7.5" cy="18.5" r="1.5"/><circle cx="17.5" cy="18.5" r="1.5"/>',
    layers:'<path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/>',
    bolt:'<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
    store:'<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v8h14v-8"/><path d="M10 21v-5h4v5"/>',
    shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/>',
    database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    note:'<path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4"/><path d="M8 9h8M8 13h5"/>',
    scale:'<path d="M12 3v18M5 21h14"/><path d="M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0Z"/><path d="m19 7-3 7a3 3 0 0 0 6 0Z"/>',
    leaf:'<path d="M5 21c0-9 5-15 15-16-1 10-7 15-15 16Z"/><path d="M5 21 14 12"/>'
  };
  const svg=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||ICONS.leaf}</svg>`;

  // título -> [ícone, tom]  (a primeira regra que bater vence)
  const RULES=[
    [/a[cç][oõ]es r[aá]pidas|atalho/,'bolt','milho'],
    [/fiad|receber|situa[cç][aã]o dos fiados/,'credit','milho'],
    [/forma.* de pagamento|pagamento/,'credit','ceu'],
    [/receitas? x despesas|lucro/,'trend','pasto'],
    [/despesa/,'wallet','urucum'],
    [/fornecedor|entrada|frete|itens da compra/,'truck','ceu'],
    [/categoria|mix/,'pie','uva'],
    [/inteiro x fracionado|fracionad|saldos abertos/,'scale','rio'],
    [/estoque|produto/,'box','pasto'],
    [/carrinho|venda|caixa/,'cart','pasto'],
    [/faturamento|indicador|di[aá]rio/,'chart','pasto'],
    [/cliente/,'users','ceu'],
    [/relat[oó]rio|resumo|exporta/,'report','mata'],
    [/perfil|empresa/,'store','pasto'],
    [/prefer[eê]ncia|configura/,'settings','pasto'],
    [/alerta|notifica/,'bell','milho'],
    [/backup/,'download','ceu'],
    [/restaura/,'shield','urucum'],
    [/dados do sistema/,'database','rio'],
    [/observa/,'note','pasto']
  ];

  // cor do card de indicador a partir da cor que o app já define no ícone
  const TONE_FROM_CLASS={green:'pasto',emerald:'pasto',deep:'mata',gold:'milho',amber:'milho',orange:'milho',rose:'urucum',red:'urucum',blue:'ceu',purple:'uva',teal:'rio',olive:'pasto'};
  const KPI_SEL='.stat-home,.stock-stat-card,.expense-stat,.analytics-kpi';
  const ICON_SEL='.stat-icon,.stock-stat-icon,.expense-stat-icon,.analytics-kpi-icon';

  function toneOf(card){
    const candidates=[card.querySelector(ICON_SEL),card];
    for(const el of candidates){
      if(!el)continue;
      for(const c of el.classList){if(TONE_FROM_CLASS[c])return TONE_FROM_CLASS[c];}
    }
    return 'pasto';
  }

  function decorateKpis(root){
    root.querySelectorAll(KPI_SEL).forEach(card=>{
      const tone=toneOf(card);
      if(card.dataset.tone!==tone)card.dataset.tone=tone;
      // texto completo no "title" quando o rótulo for cortado
      card.querySelectorAll('small,strong,.trend').forEach(el=>{const t=el.textContent.trim();if(t&&el.title!==t)el.title=t;});
    });
  }

  const SKIP_HEAD='.debt-client-head,.pdv-toolbar-title,.modal-card,.client-profile-head';
  function headAlreadyHasIcon(h){
    if(h.querySelector('svg,.t-ico'))return true;
    const prev=h.previousElementSibling;
    if(prev&&(prev.matches('svg,i,.icon')||prev.querySelector?.(':scope > svg')))return true;
    const box=h.parentElement;
    if(box&&box.children.length<=3){
      const prevBox=box.previousElementSibling;
      if(prevBox&&!prevBox.matches('h1,h2,h3,p,div:has(h2)')&&prevBox.querySelector?.(':scope > svg')&&!prevBox.matches('button,a'))return true;
    }
    return false;
  }

  function decorateHeads(root){
    root.querySelectorAll('.card h2, .card h3').forEach(h=>{
      if(h.dataset.tIco)return;
      h.dataset.tIco='1';
      if(h.closest(SKIP_HEAD)||headAlreadyHasIcon(h))return;
      const text=h.textContent.trim().toLowerCase();
      if(!text)return;
      const rule=RULES.find(([re])=>re.test(text));
      const [name,tone]=rule?[rule[1],rule[2]]:['leaf','pasto'];
      const span=document.createElement('span');
      span.className='t-ico';span.dataset.tone=tone;span.setAttribute('aria-hidden','true');
      span.innerHTML=svg(name);
      h.prepend(span);
      h.classList.add('t-has-ico');
    });
  }

  let queued=false;
  function run(){
    queued=false;
    const page=document.getElementById('page');
    if(!page)return;
    decorateKpis(page);
    decorateHeads(page);
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(run);}}

  function boot(){
    // o app.js monta a página depois de carregar os dados; observamos e decoramos
    const obs=new MutationObserver(schedule);
    obs.observe(document.body,{childList:true,subtree:true});
    schedule();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
