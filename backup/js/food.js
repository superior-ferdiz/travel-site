(() => {
  // ---------- helpers ----------
  const $$ = (sel, root=document) => root.querySelector(sel);
  const $$$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const toMin = hhmm => {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  };

  // Handle ranges that cross midnight (e.g., 18:00–02:00)
  function isOpenNow(hours) {
    if (!hours) return { open: false, until: null };

    const now = new Date();
    const dow = now.getDay();           // 0=Sun .. 6=Sat
    const minNow = now.getHours() * 60 + now.getMinutes();

    // Check today's ranges
    const today = hours[dow] || [];
    for (const [open, close] of today) {
      const o = toMin(open), c = toMin(close);
      if (c >= o) {
        if (minNow >= o && minNow <= c) return { open: true, until: close };
      } else {
        // crosses midnight
        if (minNow >= o || minNow <= c) return { open: true, until: close };
      }
    }

    // Not open now: find the next opening today
    let nextOpen = null;
    for (const [open, close] of today) {
      const o = toMin(open), c = toMin(close);
      if (c >= o) {
        if (minNow < o) nextOpen = nextOpen ? Math.min(nextOpen, o) : o;
      } else {
        // If range crosses midnight, and we're before 'o', it still starts today
        if (minNow < o) nextOpen = nextOpen ? Math.min(nextOpen, o) : o;
      }
    }

    return { open: false, next: nextOpen ? `${String(Math.floor(nextOpen/60)).padStart(2,'0')}:${String(nextOpen%60).padStart(2,'0')}` : null };
  }

  function telHref(v){ return `tel:${v.replace(/\s+/g,'')}`; }
  function gmapsHref(addr){ return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`; }

  // ---------- DATA ----------
  // type: 'restaurant' | 'cafe' | 'bar' | 'bakery' | 'fastfood'
  // hours: {0..6: [[open, close], ...]}   // 0=Sun
  const PLACES = [
    // ——— Town centre ———
    {
      id:'provence', name:'Provence Restaurant', type:'restaurant',
      tags:['french','wine','dine-in'], phone:'+47 35 95 35 96',
      address:'Bøgata 70, 3800 Bø i Telemark', link:'https://provencerestaurant.no/',
      img:'images/slide1.jpg',
      hours:{
        0:[['14:00','21:30']], 1:[], 2:[['16:00','22:00']], 3:[['16:00','22:00']],
        4:[['16:00','22:00']], 5:[['16:00','23:00']], 6:[['13:00','23:00']]
      }
    },
    {
      id:'sumyee', name:'Sum Yee Restaurant & Bar', type:'restaurant',
      tags:['chinese','bar','takeaway'], phone:'+47 35 95 00 01',
      address:'Stasjonsvegen 40, 3800 Bø i Telemark', link:'https://sumyee.no/',
      img:'images/slide2.jpg',
      hours:{ 0:[['14:00','21:00']], 1:[['12:00','21:00']], 2:[['12:00','21:00']], 3:[['12:00','21:00']], 4:[['12:00','21:00']], 5:[['12:00','21:00']], 6:[['12:00','21:00']] }
    },
    {
      id:'beijinghouse', name:'Beijing House Bø', type:'restaurant',
      tags:['chinese','takeaway'], phone:'+47 48 07 38 63',
      address:'Bøgata 54, 3800 Bø i Telemark', link:'https://visitbo.no/beijing-house/en/',
      img:'images/slide3.jpg',
      hours:{ 0:[['12:00','22:00']], 1:[['12:00','22:00']], 2:[['12:00','22:00']], 3:[['12:00','22:00']], 4:[['12:00','22:00']], 5:[['12:00','22:30']], 6:[['12:00','22:30']] }
    },
    {
      id:'pizzafjoset', name:'Pizzafjoset', type:'restaurant',
      tags:['pizza','family','buffet'], phone:'+47 35 95 00 12',
      address:'Bøgata 11, 3800 Bø i Telemark', link:'https://visitbo.no/pizzafjoset/en/',
      img:'images/kaffekanne.jpg',
      hours:{ 0:[['13:00','22:00']], 1:[['14:00','22:00']], 2:[['14:00','22:00']], 3:[['14:00','22:00']], 4:[['14:00','22:00']], 5:[['14:00','22:00']], 6:[['13:00','22:00']] }
    },
    {
      id:'pizzabakeren', name:'Pizzabakeren Bø', type:'fastfood',
      tags:['pizza','delivery','takeaway'], phone:'+47 35 95 23 00',
      address:'Bøgata 61, 3800 Bø i Telemark', link:'https://visitbo.no/pizzabakeren/en/',
      img:'images/tur.jpg',
      hours:{ 0:[['13:00','23:00']], 1:[['13:00','22:00']], 2:[['13:00','22:00']], 3:[['13:00','22:00']], 4:[['13:00','22:00']], 5:[['13:00','23:00']], 6:[['13:00','23:00']] }
    },
    {
      id:'bohotell', name:'Bø Hotell – Restaurant', type:'restaurant',
      tags:['hotel','garden','buffet'], phone:'+47 35 06 08 00',
      address:'Gullbringvegen 32, 3800 Bø i Telemark', link:'https://bohotell.no/en/eat-and-drink/',
      img:'images/hero.jpg',
      hours:null // varies by season; shown as “Hours vary”
    },
    {
      id:'husly', name:'Husly Kafé & Catering', type:'cafe',
      tags:['lunch','cakes','coffee'], phone:'+47 475 13 575',
      address:'Bøgata 61, 3800 Bø i Telemark', link:'https://huslykafe.no/',
      img:'images/slide1.jpg',
      hours:{ 0:[], 1:[['10:00','16:00']], 2:[['10:00','16:00']], 3:[['10:00','16:00']], 4:[['10:00','16:00']], 5:[['10:00','16:00']], 6:[['10:00','16:00']] }
    },
    {
      id:'mariposa', name:'Kafé Mariposa', type:'cafe',
      tags:['lunch','soup','coffee'], phone:'+47 40 91 47 77',
      address:'Bøgata 67, 3800 Bø i Telemark', link:'https://restaurantguru.com/Mariposa-Bo-i-Telemark',
      img:'images/slide2.jpg',
      hours:{ 0:[], 1:[['10:00','15:30']], 2:[['10:00','15:30']], 3:[['10:00','15:30']], 4:[['10:00','15:30']], 5:[['10:00','15:30']], 6:[] }
    },
    {
      id:'olearys', name:"O'Learys Bø – Sportsbar & Restaurant", type:'restaurant',
      tags:['american','sportsbar','bowling'], phone:'+47 35 95 01 75',
      address:'Bøgata 36, 3800 Bø i Telemark', link:'https://olearys.com/no-no/boe/',
      img:'images/slide3.jpg',
      hours:{ 0:[['13:00','20:30']], 1:[['15:00','22:00']], 2:[['15:00','22:00']], 3:[['15:00','22:00']], 4:[['15:00','23:00']], 5:[['13:00','24:00']], 6:[['13:00','24:00']] }
    },
    {
      id:'bullinn', name:'The Bull Inn (pub)', type:'bar',
      tags:['pub','music'], phone:'+47 91 34 46 85',
      address:'Bøgata 11, 3800 Bø i Telemark', link:'https://visitbo.no/thebullinn/en/',
      img:'images/kaffekanne.jpg',
      hours:{ 0:[['19:00','01:30']], 1:[['19:00','01:30']], 2:[['19:00','01:30']], 3:[['19:00','01:30']], 4:[['19:00','02:30']], 5:[['19:00','02:30']], 6:[['19:00','01:30']] }
    },
    {
      id:'dattebayo', name:'Sushi & Wok Dattebayo (Bø)', type:'restaurant',
      tags:['japanese','sushi','takeaway'], phone:'+47 35 95 20 00',
      address:'Folkestadvegen 1, 3800 Bø i Telemark', link:'https://www.dattebayo.no/',
      img:'images/slide1.jpg',
      hours:{ 0:[['14:00','21:00']], 1:[['14:00','21:00']], 2:[['14:00','21:00']], 3:[['14:00','21:00']], 4:[['14:00','21:00']], 5:[['14:00','22:00']], 6:[['14:00','22:00']] }
    },
    {
      id:'midori', name:'Midori Katsu & Sando', type:'restaurant',
      tags:['japanese','street food','sandwich'], phone:'+47 488 55 253',
      address:'Bøsenteret, Stasjonsvegen 28, 3800 Bø i Telemark', link:'https://www.midori.no/',
      img:'images/slide2.jpg',
      hours:{ 0:[], 1:[['11:00','19:00']], 2:[['11:00','19:00']], 3:[['11:00','19:00']], 4:[['11:00','19:00']], 5:[['11:00','19:00']], 6:[['11:00','19:00']] }
    },
    {
      id:'jafs', name:'JAFS Bø (gatekjøkken)', type:'fastfood',
      tags:['burgers','kebab','late'], phone:'+47 409 94 856',
      address:'Stasjonsvegen 1, 3800 Bø i Telemark', link:'https://www.jafs.no/restauranter/jafs-bo/',
      img:'images/slide3.jpg',
      hours:{ 0:[['11:00','02:00']], 1:[['11:00','23:00']], 2:[['11:00','23:00']], 3:[['11:00','23:00']], 4:[['11:00','23:00']], 5:[['11:00','02:00']], 6:[['11:00','02:00']] }
    },
    {
      id:'kafeolsen', name:'Kafé Olsen (Gullbring)', type:'cafe',
      tags:['cultural centre','salad bar','coffee'], phone:'+47 35 06 03 90',
      address:'Gullbringvegen 34, 3800 Bø i Telemark', link:'https://www.gullbring.no/kafe/',
      img:'images/hero.jpg',
      hours:null
    },
    {
      id:'vaagal', name:'Vaagal Kaffebar (Sønstebøtunet)', type:'cafe',
      tags:['coffee','student-run'], phone:'',
      address:'Bøgata 36, 3800 Bø i Telemark', link:'https://visitbo.no/sonstebotunet/butikker/vaagal/',
      img:'images/slide1.jpg',
      hours:null
    },

    // ——— Around Lifjell / Sommarland (still within Bø postcodes) ———
    {
      id:'lifjellstua', name:'Lifjellstua (café/restaurant)', type:'restaurant',
      tags:['mountain','view'], phone:'',
      address:'Lifjellvegen 934, 3804 Bø i Telemark', link:'https://smilefjes.mattilsynet.no/kommune/midttelemark/',
      img:'images/skiing.jpg',
      hours:null
    },
    {
      id:'veslekroa', name:'Veslekroa (Lifjell)', type:'cafe',
      tags:['ski','mountain'], phone:'',
      address:'Lifjellvegen 51, 3804 Bø i Telemark', link:'https://smilefjes.mattilsynet.no/kommune/midttelemark/',
      img:'images/skiing.jpg',
      hours:null
    },
    {
      id:'huka', name:'Hukapapa (Bø Sommarland)', type:'fastfood',
      tags:['park','seasonal'], phone:'',
      address:'Steintjønnvegen 2, 3804 Bø i Telemark', link:'https://smilefjes.mattilsynet.no/kommune/midttelemark/',
      img:'images/camping.jpg',
      hours:null
    },
    {
      id:'miti', name:'Miti (Bø Sommarland)', type:'fastfood',
      tags:['park','seasonal'], phone:'',
      address:'Steintjønnvegen 2, 3804 Bø i Telemark', link:'https://smilefjes.mattilsynet.no/kommune/midttelemark/',
      img:'images/camping.jpg',
      hours:null
    },
    {
      id:'oyapizzeria', name:'Øya Pizzeria (Bø Sommarland)', type:'fastfood',
      tags:['pizza','park','seasonal'], phone:'',
      address:'Steintjønnvegen 2, 3804 Bø i Telemark', link:'https://www.sommarland.no/spise/spisesteder-/oya-pizzeria',
      img:'images/camping.jpg',
      hours:null
    },

    // ——— Bakeries / coffee ———
    {
      id:'aasmundsens', name:'Aasmundsens Bakeri (Bøsenteret)', type:'bakery',
      tags:['bakery','coffee'], phone:'',
      address:'Stasjonsvegen 28, 3800 Bø i Telemark', link:'https://smilefjes.mattilsynet.no/kommune/midttelemark/',
      img:'images/slide2.jpg',
      hours:null
    },
    {
      id:'rast', name:'Rast kaffebar (USN)', type:'cafe',
      tags:['campus','coffee'], phone:'',
      address:'Lektorvegen 14, 3802 Bø i Telemark', link:'https://smilefjes.mattilsynet.no/kommune/midttelemark/',
      img:'images/slide3.jpg',
      hours:null
    },
  ];

  // --- More pubs/bars in Bø (center) ---
  const MORE_BARS = [
    {
      id:'placebo-bar',
      name:'PLA•CE•BØ bar',
      type:'bar',
      tags:['cocktails','late'],
      phone:'+47 35 95 35 96',
      address:'Bøgata 70, 3800 Bø i Telemark',
      link:'https://visitbo.no/placebo/en/',
      img:'images/slide1.jpg',
      // IG shows Wed–Thu 19–01, Fri–Sat 19–02; others closed (adjust if needed)
      hours:{
        0:[], 1:[], 2:[['19:00','01:00']], 3:[['19:00','01:00']], 4:[['19:00','02:00']], 5:[['19:00','02:00']], 6:[]
      }
    },
    {
      id:'olsen-pub',
      name:'Olsen Pub',
      type:'bar',
      tags:['pub'],
      phone:'+47 411 89 850',
      address:'Bøgata 83, 3800 Bø i Telemark',
      link:'https://www.yelp.com/biz/olsen-pub-elin-hadland-b%C3%B8-i-telemark',
      img:'images/slide2.jpg',
      hours:null  // hours vary / not reliably listed
    },
    {
      id:'kultores-kroa',
      name:'Kultores pub & kafé (Kroa i Bø)',
      type:'bar',
      tags:['student','events'],
      phone:'',
      address:'Kroa i Bø, Lektorvegen 61, 3802 Bø i Telemark',
      link:'https://www.facebook.com/StudentkafeenKultores/',
      img:'images/slide3.jpg',
      hours:null  // event-based / varies
    }
  ];

  // Merge (skip if already present)
  for (const p of MORE_BARS) {
    if (!PLACES.some(x => x.id === p.id)) PLACES.push(p);
  }

  PLACES.push({
    id: 'bo-brod',
    name: 'Bø Brød (artisan bakery)',
    type: 'bakery',
    tags: ['sourdough', 'handcrafted', 'coffee'],
    phone: '+47 455 14 006',
    address: 'Stasjonsvegen 29, 3800 Bø i Telemark',
    link: 'https://www.bobrod.no/',
    img: 'images/slide2.jpg', // or any photo you like
    hours: {
      0: [],                     // Sun
      1: [['10:00','16:00']],
      2: [['10:00','16:00']],
      3: [['10:00','16:00']],
      4: [['10:00','16:00']],
      5: [['10:00','17:00']],
      6: [['10:00','15:00']]
    }
  });


  // Nearby (10–15 min): Gvarv & Akkerhaugen
  const NEARBY_PLACES = [
    {
      id:'aarnes-kafeteria',
      name:'Aarnes Kafeteria',
      type:'restaurant',
      tags:['norwegian','view','family'],
      phone:'', // optional
      address:'Strannavegen 302, 3810 Gvarv',
      img:'images/kaffekanne.jpg',
      // Daily 08–20 reported; adjust if needed
      hours:{
        0:[['08:00','20:00']],1:[['08:00','20:00']],2:[['08:00','20:00']],
        3:[['08:00','20:00']],4:[['08:00','20:00']],5:[['08:00','20:00']],6:[['08:00','20:00']]
      }
    },
    {
      id:'lindheim-olkompani',
      name:'Lindheim Ølkompani (farm brewery & seasonal kitchen)',
      type:'bar',
      tags:['brewery','cidery','pizza','farm'],
      phone:'',
      address:'Tinghaugvegen 101, 3810 Gvarv',
      img:'images/tur.jpg',
      // Seasonal; hours vary
      hours:null
    },
    {
      id:'gvarv-bakeri',
      name:'Gvarv Bakeri',
      type:'bakery',
      tags:['bakery','coffee','pastry'],
      phone:'',
      address:'Gamlegata 22, 3810 Gvarv',
      img:'images/slide2.jpg',
      hours:{
        0:[],1:[['07:00','15:00']],2:[['07:00','15:00']],3:[['07:00','15:00']],
        4:[['07:00','15:00']],5:[['07:00','15:00']],6:[['08:30','14:00']]
      }
    },
    {
      id:'norsjo-ferieland-restaurant',
      name:'Restaurant Sevilla (Norsjø Ferieland)',
      type:'restaurant',
      tags:['lakeside','buffet','seasonal'],
      phone:'+47 35 95 84 30',
      address:'Liagrendvegen 71, 3812 Akkerhaugen',
      img:'images/camping.jpg',
      hours:null
    },
    {
      id:'norsjo-cablepark-cafe',
      name:'Norsjø Cable Park Café',
      type:'fastfood',
      tags:['park','seasonal','snack bar'],
      phone:'+47 35 95 84 30',
      address:'Liagrendvegen 71, 3812 Akkerhaugen',
      img:'images/camping.jpg',
      hours:null
    },
    {
      id:'norsjo-hotel-restaurant',
      name:'Norsjø Hotel – Restaurant',
      type:'restaurant',
      tags:['hotel','view','lakeside'],
      phone:'+47 35 95 50 00',
      address:'Nordagutuvegen 81, 3812 Akkerhaugen',
      img:'images/hero.jpg',
      // Status varies seasonally
      hours:null
    }
  ];

  // Mark nearby places and merge; default everything else to area:'bo'
  const NEARBY = NEARBY_PLACES.map(p => ({ ...p, area: 'nearby' }));
  PLACES.forEach(p => { if (!p.area) p.area = 'bo'; });
  PLACES.push(...NEARBY);


  // ---------- rendering ----------
  function placeCard(p){
    const status = isOpenNow(p.hours);
    const metaBits = [
      p.type.charAt(0).toUpperCase() + p.type.slice(1),
      p.tags?.slice(0,3).join(' • ')
    ].filter(Boolean).join(' · ');

    const hoursText = p.hours
      ? (status.open ? `Open now · until ${status.until}` : (status.next ? `Closed · opens ${status.next}` : 'Closed today'))
      : 'Hours vary';

    return `
      <article class="card thumb-left place-card">
        <img class="thumb" src="${p.img}" alt="${p.name}">
        <div class="place-main">
          <h3>${p.name}</h3>
          <div class="meta small">${metaBits}</div>
          <div class="small muted">${p.address}</div>
          <div class="small">${p.phone ? `<a href="${telHref(p.phone)}">${p.phone}</a>` : ''}</div>
          <div class="small">${hoursText}</div>
          <div class="place-actions">
            ${p.phone ? `<a class="btn btn-ghost sm" href="${telHref(p.phone)}">Call</a>` : ''}
            <a class="btn btn-ghost sm" href="${gmapsHref(p.address)}" target="_blank" rel="noopener">Directions</a>
            ${p.link ? `<a class="btn sm" href="${p.link}" target="_blank" rel="noopener">Website</a>` : ''}
          </div>
        </div>
      </article>
    `;
  }

  function render(list){
    const root = $$('#food-list');
    if (!root) return;
    root.innerHTML = list.map(placeCard).join('');
  }

  // Map UI select values -> internal types used in PLACES
  const TYPE_MAP = {
    pub: 'bar',
    bar: 'bar',
    takeaway: 'fastfood',
    'fast food': 'fastfood',
    fastfood: 'fastfood',
    café: 'cafe',
    cafe: 'cafe',
    restaurant: 'restaurant',
    bakery: 'bakery'
  };
  const normalizeType = (v = '') => TYPE_MAP[v.trim().toLowerCase()] || v.trim().toLowerCase();


  // ---------- filters ----------
  function applyFilters(){
    const form = document.getElementById('food-filters');

    const q = (form?.elements.q?.value || '').trim().toLowerCase();

    // works whether your <select> is name="kind" or name="type"
    const rawType = (form?.elements.type?.value || form?.elements.kind?.value || '').trim();
    const typeFilter = normalizeType(rawType);

    const openOnly   = !!(form?.elements.open?.checked);
    const showNearby = !!(form?.elements.nearby?.checked);

    const out = PLACES.filter(p => {
      // area filter
      const area = p.area || 'bo';
      if (!showNearby && area === 'nearby') return false;

      // type filter (normalize both sides)
      if (typeFilter && normalizeType(p.type) !== typeFilter) return false;

      // text search
      const hay = [p.name, p.address, (p.tags||[]).join(' '), p.type].join(' ').toLowerCase();
      if (q && !hay.includes(q)) return false;

      // open-now filter
      if (openOnly) {
        const s = isOpenNow(p.hours);
        if (!s.open) return false;
      }
      return true;
    });

    render(out);
  }



  // Bootstrap
  document.addEventListener('DOMContentLoaded', () => {
    render(PLACES);

    const form = $$('#food-filters');
    if (form) {
      form.addEventListener('input', applyFilters);
      form.addEventListener('change', applyFilters);
      $$('#clearFood')?.addEventListener('click', () => {
        form.reset();
        applyFilters();
      });
    }
  });

})();

