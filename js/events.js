// js/events.js — events with thumbnails + filters + .ics
(function () {
  const list = document.getElementById('event-list');
  const form = document.getElementById('event-filters');
  if (!list || !form) return;

  // === EDIT YOUR EVENTS HERE (picked from images you already have) ===
  const EVENTS = [
    { id:'kroa-dj',    title:'Club Night (DJ set)',  date:'2025-10-04T22:00', end:'2025-10-05T02:00', venue:'Kroa i Bø',   price:'kr 150', tags:['party','18+'], img:'images/djkroaibo.png' },
    { id:'kroa-band',  title:'Indie Rock Live',      date:'2025-10-18T20:00', end:'2025-10-18T23:00', venue:'Kroa i Bø',   price:'kr 220', tags:['concert'],      img:'images/indierockkroa.jpg' },
    { id:'bull-quiz',  title:'Pub Quiz Night',       date:'2025-10-09T19:00', end:'2025-10-09T21:00', venue:'Bull Inn',     price:'Free',   tags:['quiz','casual'], img:'images/bullinnevent.png' },
    { id:'campus-film',title:'Student Film Evening', date:'2025-10-02T18:00', end:'2025-10-02T20:15', venue:'Campus/Student', price:'Free', tags:['film'],         img:'images/filmkveld.png' },
    { id:'market',     title:'Autumn Street Market', date:'2025-10-12T11:00', end:'2025-10-12T15:00', venue:'Town',        price:'Free',   tags:['market','family'], img:'images/hostmarkedbo.jpg' }
  ];

  const tz = 'Europe/Oslo';
  const fmtDay  = new Intl.DateTimeFormat(undefined, { timeZone: tz, weekday:'short', month:'short', day:'numeric' });
  const fmtTime = new Intl.DateTimeFormat(undefined, { timeZone: tz, hour:'2-digit', minute:'2-digit' });

  const el = (h)=>{ const d=document.createElement('div'); d.innerHTML=h.trim(); return d.firstElementChild; };
  const sameDay = (a,b)=> a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();

  function ics(ev){
    const dt = ev.date.replace(/[-:]/g,'').replace('.000','');
    const ed = (ev.end||ev.date).replace(/[-:]/g,'').replace('.000','');
    const lines = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Telemark Adventures//EN','BEGIN:VEVENT',
      `UID:${ev.id}@telemark-adventures`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z')}`,
      `DTSTART:${dt}`, `DTEND:${ed}`,
      `SUMMARY:${ev.title}`, `LOCATION:${ev.venue}`, `DESCRIPTION:${(ev.price||'').replace(/\n/g,' ')}`,
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([lines], { type:'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (ev.title || 'event') + '.ics';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
  }

  const state = { q:'', venue:'', when:'upcoming' };
  function passWhen(ev){
    const now = new Date();
    const d = new Date(ev.date);
    if (state.when==='all') return true;
    if (state.when==='upcoming') return d >= new Date(now.getTime()-60*60*1000);
    if (state.when==='today') return sameDay(d, now);
    if (state.when==='week') {
      const start = new Date(now); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(end.getDate()+7);
      return d >= start && d < end;
    }
    return true;
  }

  function render(){
    const q = state.q.trim().toLowerCase();
    const items = EVENTS
      .filter(e => (!state.venue || e.venue===state.venue))
      .filter(passWhen)
      .filter(e => !q || `${e.title} ${e.venue} ${e.tags?.join(' ')}`.toLowerCase().includes(q))
      .sort((a,b)=> new Date(a.date) - new Date(b.date));

    list.innerHTML = '';
    if (!items.length){ list.append(el(`<p class="caption">No events match these filters.</p>`)); return; }

    let currentKey = '';
    items.forEach(ev => {
      const d = new Date(ev.date);
      const key = d.toDateString();
      if (key!==currentKey){
        currentKey = key;
        list.append(el(`<h3 class="list-divider">${fmtDay.format(d)}</h3>`));
      }
      const time = fmtTime.format(d);
      const end  = ev.end ? fmtTime.format(new Date(ev.end)) : '';
      list.append(el(`
        <article class="card thumb-left event-card">
          <img class="thumb" src="${ev.img}" alt="${ev.title}" loading="lazy" decoding="async">
          <div class="event-main">
            <h4>${ev.title}</h4>
            <div class="meta">
              <span>🕒 ${time}${end? '–'+end : ''}</span>
              <span>📍 ${ev.venue}</span>
              ${ev.price? `<span>💸 ${ev.price}</span>`:''}
            </div>
            ${ev.tags?.length ? `<div class="tags">${ev.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>`:''}
            <div class="event-actions">
              <button class="btn" data-ics="${ev.id}">Add to calendar</button>
              <a class="btn btn-ghost" href="#" data-dir="${encodeURIComponent(ev.venue)}">Directions</a>
            </div>
          </div>
        </article>
      `));
    });

    list.querySelectorAll('[data-ics]').forEach(btn=>{
      btn.onclick = () => { const id = btn.getAttribute('data-ics'); const ev = EVENTS.find(e=>e.id===id); if (ev) ics(ev); };
    });
    list.querySelectorAll('[data-dir]').forEach(a=>{
      a.onclick = (e)=> {
        e.preventDefault();
        const q = a.getAttribute('data-dir');
        const g = `https://www.google.com/maps/search/?api=1&query=${q}`;
        const ap = `https://maps.apple.com/?q=${q}`;
        const isiOS = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
        window.location.href = isiOS ? ap : g;
      };
    });
  }

  // controls
  form.q.addEventListener('input',  ()=>{ state.q = form.q.value; render(); });
  form.venue.addEventListener('change', ()=>{ state.venue = form.venue.value; render(); });
  form.when.addEventListener('change',  ()=>{ state.when = form.when.value; render(); });
  document.getElementById('clearEvents').addEventListener('click', ()=>{
    form.reset(); state.q=''; state.venue=''; state.when='upcoming'; render();
  });

  render();
})();






// === Hangouts & Venues (Bø + nearby) ======================================
(function () {
  const list = document.getElementById('venue-list');
  if (!list) return;

  // Reuse images you already have
  const VENUES = [
    {
      id: 'sommarland',
      name: 'Bø Sommarland',
      kind: 'Water park (summer)',
      tags: ['family', 'slides', 'seasonal'],
      address: 'Steintjønnvegen 2, 3804 Bø i Telemark',
      site: 'https://www.sommarland.no/',
      img: 'images/slide1.jpg'
    },
    {
      id: 'gullbring',
      name: 'Gullbring Kulturhus / Bø Kino',
      kind: 'Cinema · culture house · pool',
      tags: ['cinema', 'theatre', 'swimming'],
      address: 'Gullbringvegen 34, 3800 Bø i Telemark',
      site: 'https://www.gullbring.no/kino/',
      img: 'images/gullbringkulturhus.jpg'
    },
    {
      id: 'olearys',
      name: 'O’Learys Bø (Bowling & games)',
      kind: 'Bowling · shuffleboard · arcade',
      tags: ['bowling', 'sportsbar', 'family'],
      address: 'Bøgata 36, 3800 Bø i Telemark',
      site: 'https://olearys.com/no-no/boe/activities/bowling/',
      img: 'images/olearys.png'
    },
    {
      id: 'kroa',
      name: 'Kroa i Bø (student house)',
      kind: 'Concerts · club nights · student events',
      tags: ['live', 'student', 'volunteer'],
      address: 'Lektorvegen 61, 3802 Bø i Telemark',
      site: 'https://www.kroaibo.no/en',
      img: 'images/kroaibo.png'
    },
    // Nearby (≤15 min)
    {
      id: 'norsjo-cablepark',
      name: 'Norsjø Cable Park (nearby)',
      kind: 'Wakeboard · water-ski (summer)',
      tags: ['nearby', 'water', 'adventure'],
      address: 'Liagrendvegen 71, 3812 Akkerhaugen',
      site: 'https://www.visittelemark.com/things-to-do/wakeboard-arena-at-norsjo-ferieland-norsjo-cabelpark-p511353',
      img: 'images/norsjocablepark.png'
    }
  ];

  const isIOS = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
  const dirLink = (q) =>
    (isIOS ? `https://maps.apple.com/?q=${encodeURIComponent(q)}`
           : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);

  function card(v){
    const tags = v.tags?.map(t => `<span class="tag">${t}</span>`).join('') || '';
    return `
      <article class="card thumb-left venue-card">
        <img class="thumb" src="${v.img}" alt="${v.name}" loading="lazy" decoding="async">
        <div class="venue-main">
          <h3>${v.name}</h3>
          <div class="meta small">${v.kind}</div>
          <div class="muted small">${v.address}</div>
          ${tags ? `<div class="tags" style="margin-top:6px">${tags}</div>` : ''}
          <div class="event-actions" style="margin-top:8px">
            <a class="btn btn-ghost sm" href="${dirLink(v.name + ' ' + v.address)}" target="_blank" rel="noopener">Directions</a>
            ${v.site ? `<a class="btn sm" href="${v.site}" target="_blank" rel="noopener">Website</a>` : ''}
          </div>
        </div>
      </article>
    `;
  }

  list.innerHTML = VENUES.map(card).join('');
})();
