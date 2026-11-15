'use strict';
(() => {
  const $ = (selector) => document.querySelector(selector);
  const all = (selector) => [...document.querySelectorAll(selector)];
  const safeStorage = {
    get(key, fallback = null) { try { return window.sessionStorage.getItem(key) ?? fallback; } catch { return fallback; } },
    set(key, val) { try { window.sessionStorage.setItem(key, val); } catch { /* storage may be disabled */ } }
  };
  document.documentElement.classList.add('js-ready');
  const year = $('#year'); if (year) year.textContent = String(new Date().getFullYear());
  const header = $('#header');
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  updateHeader(); window.addEventListener('scroll', updateHeader, {passive:true});

  const nav = $('#nav'), toggle = $('#nav-toggle');
  function closeNav() { nav?.classList.remove('is-open'); toggle?.setAttribute('aria-expanded','false'); toggle?.setAttribute('aria-label','Open menu'); }
  toggle?.addEventListener('click', () => { const open = !nav?.classList.contains('is-open'); nav?.classList.toggle('is-open',open); toggle.setAttribute('aria-expanded',String(open)); toggle.setAttribute('aria-label',open?'Close menu':'Open menu'); });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click',closeNav));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });

  const modal=$('#enquiry'), topic=$('#inquiry-topic'), closeButton=$('#dialog-close');
  const openEnquiry=(selection) => {
    closeNav();
    if (!modal) return;
    if (selection && topic && [...topic.options].some(x=>x.value === selection)) topic.value=selection;
    if (!modal.open) modal.showModal();
  };
  all('[data-contact]').forEach(button=>button.addEventListener('click',()=>openEnquiry(button.getAttribute('data-contact'))));
  closeButton?.addEventListener('click',()=>modal?.close());
  modal?.addEventListener('click',e=>{ if(e.target===modal) modal.close(); });

  // Enquiries use native Formspree POST and its hosted confirmation/CAPTCHA flow.

  let motionOff = false;
  const motionButton=$('#motion-switch');
  const startOff = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  motionOff=Boolean(startOff) || safeStorage.get('ceilao-motion') === 'off';
  function setMotion(off) { motionOff=off; document.documentElement.classList.toggle('motion-off',off); motionButton?.setAttribute('aria-pressed',String(off)); if(motionButton)motionButton.textContent=off?'RESUME MOTION':'PAUSE MOTION'; safeStorage.set('ceilao-motion',off?'off':'on'); }
  setMotion(motionOff);

  const revealItems=all('.reveal');
  let observer = null;
  function initReveal(){
    if(observer){ observer.disconnect(); observer = null; }
    if('IntersectionObserver' in window && !motionOff){
      observer=new IntersectionObserver(entries=>{ entries.forEach(entry=>{ if(entry.isIntersecting){ entry.target.classList.add('is-visible'); observer.unobserve(entry.target);} }); },{threshold:0.1,rootMargin:'0px 0px 45px 0px'});
      revealItems.forEach(item=>observer.observe(item));
    } else revealItems.forEach(item=>item.classList.add('is-visible'));
  }
  initReveal();
  motionButton?.addEventListener('click',()=>{ setMotion(!motionOff); if(motionOff) revealItems.forEach(item=>item.classList.add('is-visible')); initReveal(); });

  const intro=$('#intro');
  let introTimeouts=[];
  let wasFocused=null;
  const clearIntroTimers=()=>{ introTimeouts.forEach(clearTimeout); introTimeouts=[]; };
  const setPageInert=(on)=>{ document.querySelectorAll('body > header, body > main, body > footer').forEach(el=>{el.inert=on;}); };
  const hideIntro=()=>{
    if(!intro || intro.hidden) return;
    clearIntroTimers();
    intro.classList.add('is-exiting');
    const done=()=>{
      intro.hidden=true;
      intro.classList.remove('is-exiting');
      document.body.classList.remove('intro-open');
      setPageInert(false);
      safeStorage.set('ceilao-seen-intro','yes');
      (wasFocused&&document.contains(wasFocused)?wasFocused:$('#main'))?.focus?.({preventScroll:true});
    };
    if(motionOff) done(); else introTimeouts.push(setTimeout(done,520));
  };
  const playIntro=(force=false)=>{
    if(!intro) return;
    clearIntroTimers();
    if(motionOff && !force){ intro.hidden=true; return; }
    wasFocused=document.activeElement;
    intro.hidden=false;
    intro.classList.remove('is-exiting');
    intro.dataset.scene='one';
    document.body.classList.add('intro-open');
    setPageInert(true);
    intro.focus({preventScroll:true});
    introTimeouts.push(setTimeout(()=>{ intro.dataset.scene='two'; }, 2400));
    introTimeouts.push(setTimeout(()=>{ intro.dataset.scene='final'; }, 5000));
    introTimeouts.push(setTimeout(()=>{ hideIntro(); }, 8100));
  };

  const requestedReplay = new URLSearchParams(window.location.search).get('replay') === '1';
  if(intro && ((safeStorage.get('ceilao-seen-intro') !== 'yes' && !motionOff) || requestedReplay)) playIntro(requestedReplay);
  if(intro && requestedReplay) { try { window.history.replaceState(null,'',window.location.pathname + window.location.hash); } catch {} }
  intro?.addEventListener('keydown',e=>{ if(e.key==='Escape'){ e.preventDefault(); hideIntro(); }});
  all('[data-replay]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!intro){ window.location.href='index.html?replay=1'; return; }
    playIntro(true);
  }));
})();
