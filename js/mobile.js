/* ============================================================
   D CHÁCARA EMPÓRIO — MOBILE v1.26
   Complemento de interface. Não altera dados nem Supabase.
   Carregar DEPOIS de js/app.js.
   ============================================================ */
(()=>{
  const VERSION='1.26-mobile';

  function enhanceMobile(){
    const sidebar=document.querySelector('.sidebar');
    const topbar=document.querySelector('.topbar');

    if(!sidebar || !topbar) return false;
    if(document.querySelector('#mobileMenuBtn')) return true;

    const btn=document.createElement('button');
    btn.type='button';
    btn.id='mobileMenuBtn';
    btn.className='mobile-menu-btn';
    btn.setAttribute('aria-label','Abrir menu');
    btn.setAttribute('aria-expanded','false');
    btn.innerHTML='<span></span><span></span><span></span>';

    const backdrop=document.createElement('div');
    backdrop.id='sidebarBackdrop';
    backdrop.className='sidebar-backdrop';

    const closeBtn=document.createElement('button');
    closeBtn.type='button';
    closeBtn.className='mobile-close-btn';
    closeBtn.setAttribute('aria-label','Fechar menu');
    closeBtn.innerHTML='×';

    sidebar.prepend(closeBtn);
    document.body.appendChild(backdrop);
    topbar.prepend(btn);

    const closeMenu=()=>{
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('show');
      document.body.classList.remove('mobile-nav-open');
      btn.setAttribute('aria-expanded','false');
    };

    const openMenu=()=>{
      sidebar.classList.add('mobile-open');
      backdrop.classList.add('show');
      document.body.classList.add('mobile-nav-open');
      btn.setAttribute('aria-expanded','true');
    };

    btn.addEventListener('click',()=>{
      sidebar.classList.contains('mobile-open') ? closeMenu() : openMenu();
    });

    closeBtn.addEventListener('click',closeMenu);
    backdrop.addEventListener('click',closeMenu);

    sidebar.querySelectorAll('.nav a').forEach(link=>{
      link.addEventListener('click',closeMenu);
    });

    document.addEventListener('keydown',event=>{
      if(event.key==='Escape') closeMenu();
    });

    window.addEventListener('resize',()=>{
      if(window.innerWidth>900) closeMenu();
    });

    document.documentElement.dataset.mobileEnhancement=VERSION;
    return true;
  }

  function boot(){
    if(enhanceMobile()) return;

    const observer=new MutationObserver(()=>{
      if(enhanceMobile()) observer.disconnect();
    });

    observer.observe(document.documentElement,{
      childList:true,
      subtree:true
    });

    setTimeout(()=>observer.disconnect(),15000);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();
