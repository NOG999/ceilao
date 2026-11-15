/* Ceilao Enterprises — client-side static press-release listing.
   Content is managed by editing assets/press-releases-data.js.
   No CMS or server required. Uses safe DOM creation and local asset paths. */
'use strict';
(() => {
  const grid = document.getElementById('press-grid');
  const toolbar = document.getElementById('press-toolbar');
  const empty = document.getElementById('press-empty');
  const status = document.getElementById('press-live-status');
  const search = document.getElementById('press-search');
  const category = document.getElementById('press-category');
  const year = document.getElementById('press-year');
  if (!grid || !toolbar || !empty || !status || !search || !category || !year) return;
  const raw = Array.isArray(window.CEILAO_PRESS_RELEASES) ? window.CEILAO_PRESS_RELEASES : [];
  const categories = new Set(['Event Announcements','Company News','Partnerships','Media Coverage','Other']);
  const localPath = (path) => {
    if (typeof path !== 'string') return null;
    const val = path.trim();
    // Keep assets local and prevent javascript:, data:, protocol-relative and traversal URLs.
    if (val.startsWith('assets/press/') && !val.includes('..') && !/[?#]/.test(val) && !val.includes('\\') && /^assets\/press\/[a-zA-Z0-9_./-]+$/.test(val)) return val;
    if (val.startsWith('press/articles/') && !val.includes('..') && !/[?#]/.test(val) && !val.includes('\\') && /^press\/articles\/[a-zA-Z0-9_./-]+\.html$/.test(val)) return val;
    return null;
  };
  const safeExternalUrl = (value) => {
    if(typeof value !== 'string' || value.length > 2048 || /\s/.test(value)) return null;
    try {
      const u = new URL(value);
      return u.protocol === 'https:' && u.hostname && !u.username && !u.password ? u.href : null;
    } catch { return null; }
  };
  const validDate = (str) => {
    if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
    const d=new Date(`${str}T12:00:00Z`);
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===str;
  };
  const items = raw.filter((x) => x && typeof x === 'object' && typeof x.title === 'string' && x.title.trim() && validDate(x.date) && (localPath(x.pdf) || localPath(x.html) || safeExternalUrl(x.url)))
    .map(x => ({
      title:x.title.trim().slice(0,180),
      date:x.date,
      category: categories.has(x.category) ? x.category : 'Other',
      summary: typeof x.summary==='string' ? x.summary.trim().slice(0,600) : '',
      image:localPath(x.image),
      href:localPath(x.pdf) || localPath(x.html) || safeExternalUrl(x.url),
      pdf:Boolean(localPath(x.pdf)),
      external:!localPath(x.pdf) && !localPath(x.html) && Boolean(safeExternalUrl(x.url)),
      publisher:typeof x.publisher==='string' ? x.publisher.trim().slice(0,100) : '',
      alt:typeof x.alt==='string' ? x.alt.trim().slice(0,200) : '', 
    })).sort((a,b)=>b.date.localeCompare(a.date));
  const el=(tag, className, text)=>{ const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n; };
  const years=[...new Set(items.map(x=>x.date.slice(0,4)))];
  years.forEach(y=>{ const option=document.createElement('option');option.value=y;option.textContent=y;year.append(option); });
  function makeCard(x,index){
    const card=el('article','press-card');
    if (x.category === 'Media Coverage') card.classList.add('press-card--coverage');
    const art=el('a','press-card-image');
    art.href=x.href;art.target='_blank';art.rel='noopener noreferrer';art.setAttribute('aria-label',`Read ${x.title}`);
    if(x.image){
      const img=document.createElement('img');img.src=x.image;img.alt=x.alt || `${x.title} cover`;img.loading=index<2?'eager':'lazy';img.decoding='async';
      img.addEventListener('error',()=>{ art.replaceChildren(el('span','press-image-fallback','CEILAO / PRESS'));});art.append(img);
    } else {
      art.classList.add('press-card-image--empty');
      const symbol=document.createElement('img');symbol.src='assets/ceilao-emblem.webp';symbol.alt='';symbol.setAttribute('aria-hidden','true');symbol.loading='lazy';art.append(symbol);
      art.append(el('span','press-image-fallback','CEILAO / PRESS'));
    }
    const body=el('div','press-card-body');
    const kicker=el('p','press-card-kicker');
    const date=document.createElement('time');date.dateTime=x.date;date.textContent=new Intl.DateTimeFormat('en-AU',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${x.date}T12:00:00Z`)).toUpperCase();
    kicker.append(date,el('span','',' / '),el('span','',x.category.toUpperCase()));
    if(x.publisher) kicker.append(el('span','',' / '),el('span','',x.publisher.toUpperCase()));
    const heading=el('h3','press-card-title');const title=el('a','',x.title);title.href=x.href;title.target='_blank';title.rel='noopener noreferrer';heading.append(title);
    body.append(kicker,heading);
    if(x.summary)body.append(el('p','press-card-summary',x.summary));
    const read=el('a','press-card-read',x.external?'READ FULL ARTICLE ↗':x.pdf?'VIEW PRESS RELEASE ↗':'READ RELEASE ↗');read.href=x.href;read.target='_blank';read.rel='noopener noreferrer';
    if(x.pdf)read.setAttribute('aria-label',`Open PDF: ${x.title}`);
    body.append(read);
    card.append(art,body);return card;
  }
  const filter=()=>{
    const q=search.value.toLocaleLowerCase().trim();
    const selectedCategory=category.value;
    const selectedYear=year.value;
    const matched=items.filter(x=>(selectedCategory==='all'||x.category===selectedCategory)&&(selectedYear==='all'||x.date.startsWith(selectedYear))&&(!q||`${x.title} ${x.summary} ${x.category}`.toLocaleLowerCase().includes(q)));
    grid.replaceChildren(...matched.map(makeCard));
    const noItems=items.length===0;
    empty.hidden=!noItems && matched.length>0;
    const title=empty.querySelector('h3');const text=empty.querySelector('p');
    if(!noItems){title.textContent='NO MATCHING RELEASES.';text.textContent='Try changing your search or filters.';}
    status.textContent=items.length ? `${matched.length} ${matched.length===1?'release':'releases'} shown` : '';
  };
  toolbar.hidden=items.length===0;
  search.addEventListener('input',filter);category.addEventListener('change',filter);year.addEventListener('change',filter);
  filter();
})();
