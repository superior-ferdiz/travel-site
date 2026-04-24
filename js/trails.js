// js/trails.js — Real Bø i Telemark trails with built-in maps (no redirects)
(function () {
  const listEl = document.getElementById('trail-list');
  const form = document.getElementById('trail-filters');
  if (!listEl || !form) return;

  // --- helper: tiny OSM embed around a point
  const osmEmbed = (lat, lon, pad = 0.03) => {
    const minLat = (lat - pad).toFixed(6), maxLat = (lat + pad).toFixed(6);
    const minLon = (lon - pad).toFixed(6), maxLon = (lon + pad).toFixed(6);
    const bbox = `${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
  };

  // ==== REAL TRAILS (Bø i Telemark / Lifjell) ====
  // Distances/time are rounded; starts default to Jønnbu where relevant.
  const JONNBU = { name: 'Jønnbu (Lifjell)', lat: 59.4779, lon: 9.0017 }; // area start

  const TRAILS = [
    {
      id: 'gygrestolen',
      name: 'Gygrestolen',
      distance_km: 7.3, elevation_m: 600, time_h: 3.5, difficulty: 'Hard',
      features: ['ridge','views','forest'],
      photo: 'images/Gygrestolen.jpg',
      blurb: 'Spectacular rock formation with airy viewpoints; steep/rocky in places.',
      start: { name: 'Tveiten/Uvdalstjønna area', lat: 59.365891, lon: 8.978092 } // Outdooractive coords
    },
    {
      id: 'tretoppern-jonnbu',
      name: 'Tretopper’n (Jønnbu)',
      distance_km: 5.5, elevation_m: 175, time_h: 2.0, difficulty: 'Moderate',
      features: ['family','forest','ridge','views'],
      photo: 'images/jønnbu.png',
      blurb: 'Family-friendly loop: Anebunatten, Krintofjellet & Bøkstulnatten. Blue waymarked.',
      start: JONNBU
    },
    {
      id: 'oysteinnatten',
      name: 'Øysteinnatten (1174 m)',
      distance_km: 11.5, elevation_m: 533, time_h: 4.0, difficulty: 'Hard',
      features: ['summit','ridge','views','forest'],
      photo: 'images/oysteinnhatten.jpg',
      blurb: 'Classic Lifjell summit via Krintokleiva; panoramic views. For confident hikers.',
      start: JONNBU
    },
    {
      id: 'folkestadasane',
      name: 'Folkestadåsane',
      distance_km: 8.0, elevation_m: 60, time_h: 2.3, difficulty: 'Easy',
      features: ['family','forest','lake'],
      photo: 'images/folkestadaasene.png',
      blurb: 'Gentle pine-forest loops with small lakes, close to Bø sentrum.',
      start: { name: 'Folkestad area', lat: 59.43524, lon: 9.06996 }
    },
    // --- extra individual tops from the Three Peaks:
    {
      id: 'anebunatten',
      name: 'Anebunatten',
      distance_km: 4.5, elevation_m: 200, time_h: 1.7, difficulty: 'Moderate',
      features: ['views','forest','family'],
      photo: 'images/anebunattene.jpg',
      blurb: 'Shorter outing to the first top from the Jønnbu side; good views.',
      start: { name: 'Jønnbu → Anebunatten', lat: 59.480839, lon: 8.983702 } // peak vicinity
    },
    {
      id: 'krintofjellet',
      name: 'Krintofjellet (924 m)',
      distance_km: 4.0, elevation_m: 170, time_h: 1.3, difficulty: 'Easy',
      features: ['family','forest','views'],
      photo: 'images/krintofjellet.png',
      blurb: 'Short family-friendly top; part of Tretopper’n circuit.',
      start: { name: 'Krintofjell area (near Jønnbu)', lat: 59.48383, lon: 8.99704 }
    },
    {
      id: 'bokstulnatten',
      name: 'Bøkstulnatten (916 m)',
      distance_km: 1.5, elevation_m: 120, time_h: 0.7, difficulty: 'Easy',
      features: ['views','family'],
      photo: 'images/bookstulhatten.jpg',
      blurb: 'Quick detour/top with views over Jønnbu and Norsjø.',
      start: { name: 'Bøkstulnatten area', lat: 59.48398, lon: 9.00584 }
    }
  ];

  const el = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
  const diffDot = (d) => `<span class="metric"><span class="dot ${d.toLowerCase()}"></span>${d}</span>`;

  const renderCard = (t) => el(`
    <article class="trail-card" data-id="${t.id}">
      <img src="${t.photo}" alt="${t.name}">
      <div class="body">
        <h3>${t.name}</h3>
        <p>${t.blurb}</p>
        <div class="meta">
          ${diffDot(t.difficulty)}
          <span class="metric">🏁 ${t.distance_km.toFixed(1)} km</span>
          <span class="metric">⛰️ ${t.elevation_m} m</span>
          <span class="metric">⏱️ ${t.time_h.toFixed(1)} h</span>
        </div>
        <div class="tags">${t.features.map(f => `<span class="tag">${f}</span>`).join('')}</div>

        <details class="more">
          <summary>Details & map</summary>
          <div class="info-grid">
            <div>Start: ${t.start.name}</div>
            <div>Surface: marked trail</div>
            <div>Best season: May–Oct</div>
            <div>Family-friendly: ${t.difficulty === 'Easy' || t.features.includes('family') ? 'Yes' : 'Use judgement'}</div>
          </div>
          <iframe loading="lazy" src="${osmEmbed(t.start.lat, t.start.lon)}" title="Map for ${t.name}"></iframe>
          <p class="caption">Map shows the start/area. Zoom or drag to explore.</p>
        </details>
      </div>
    </article>
  `);

  // ---- filtering (same UX as before)
  const state = {
    difficulty: '',
    maxDist: parseFloat(form.dist.value || '12'),
    features: [],
    sort: form.sort.value || 'rank'
  };
  const matches = (t) => {
    if (state.difficulty && t.difficulty !== state.difficulty) return false;
    if (!isFinite(state.maxDist) || t.distance_km > state.maxDist) return false;
    for (const f of state.features) if (!t.features.includes(f)) return false;
    return true;
  };
  const sorters = {
    rank: (a, b) => a.distance_km - b.distance_km + (a.elevation_m - b.elevation_m) * 0.001,
    dist: (a, b) => a.distance_km - b.distance_km,
    elev: (a, b) => b.elevation_m - a.elevation_m,
    easy: (a, b) => ({Easy:0, Moderate:1, Hard:2}[a.difficulty] - ({Easy:0, Moderate:1, Hard:2}[b.difficulty]))
  };
  const render = () => {
    const items = TRAILS.filter(matches).sort(sorters[state.sort]);
    listEl.innerHTML = '';
    if (!items.length) {
      listEl.append(el(`<p class="caption">No trails match these filters. Try clearing some filters.</p>`));
      return;
    }
    items.forEach(t => listEl.append(renderCard(t)));
  };

  // controls
  form.dist.addEventListener('input', () => {
    state.maxDist = parseFloat(form.dist.value);
    document.getElementById('distOut').textContent = `≤ ${state.maxDist} km`;
    render();
  });
  form.difficulty.addEventListener('change', () => { state.difficulty = form.difficulty.value; render(); });
  form.sort.addEventListener('change', () => { state.sort = form.sort.value; render(); });
  form.querySelectorAll('input[name="feat"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const s = new Set(state.features);
      cb.checked ? s.add(cb.value) : s.delete(cb.value);
      state.features = Array.from(s);
      render();
    });
  });
  document.getElementById('clearFilters').addEventListener('click', () => {
    form.reset();
    state.difficulty = '';
    state.maxDist = 12;
    state.features = [];
    state.sort = 'rank';
    document.getElementById('distOut').textContent = '≤ 12 km';
    render();
  });

  // ---- Make Popular routes jump to & highlight a card
  function focusTrail(id) {
    const card = listEl.querySelector(`[data-id="${id}"]`);
    if (!card) return;
    card.classList.add('is-highlight');
    const det = card.querySelector('details.more');
    if (det) det.open = true;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => card.classList.remove('is-highlight'), 2500);
  }
  document.querySelectorAll('[data-trail]').forEach(a => {
    a.addEventListener('click', (e) => {
      // Let the hash scroll, then highlight after render
      setTimeout(() => focusTrail(a.dataset.trail), 50);
    });
  });

  // initial render
  render();

  // if arriving with hash like #trails?show=gygrestolen (future-proof)
  try {
    const m = new URLSearchParams(location.hash.split('?')[1]);
    const show = m.get('show');
    if (show) setTimeout(() => focusTrail(show), 100);
  } catch {}
})();


// Add-to-plan for hikes 
(function () {
  const LIST_ID = 'trail-list';
  const root = document.getElementById(LIST_ID);
  if (!root) return;

  // Ensure each card has an "Add to plan" button
  function ensureButtons() {
    root.querySelectorAll('.trail-card').forEach(card => {
      if (card.querySelector('[data-plan-add="hike"]')) return; // already added

      const actions = card.querySelector('.actions') || (() => {
        const b = document.createElement('div'); b.className = 'actions'; card.querySelector('.body')?.appendChild(b); return b;
      })();

      const btn = document.createElement('button');
      btn.className = 'btn btn-ghost';
      btn.type = 'button';
      btn.textContent = 'Add to plan';
      btn.setAttribute('data-plan-add', 'hike');
      actions.appendChild(btn);
    });
  }

  // Scrape minimal info from a card
  function scrapeHike(card) {
    const title = card.querySelector('h3')?.textContent?.trim() || 'Hike';
    const img = card.querySelector('img')?.getAttribute('src') || 'images/hiking.jpg';
    const metaText = card.querySelector('.meta')?.textContent || '';
    // Try to pull simple numbers if present (best-effort)
    const distMatch = metaText.match(/(\d+(?:\.\d+)?)\s*km/i);
    const elevMatch = metaText.match(/(\d+)\s*m/i);

    // Make a stable-ish id from title
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    return {
      id,
      title,
      img,
      distKm: distMatch ? parseFloat(distMatch[1]) : undefined,
      elevM: elevMatch ? parseInt(elevMatch[1], 10) : undefined,
      href: 'hiking.html#trails'
    };
  }

  function getPlan() {
    try { return JSON.parse(localStorage.getItem('journeyPlan')) || {}; }
    catch { return {}; }
  }
  function savePlan(plan) {
    localStorage.setItem('journeyPlan', JSON.stringify(plan));
  }

  function addHikeToPlan(hike) {
    const plan = getPlan();
    if (!Array.isArray(plan.hikes)) plan.hikes = [];
    if (!plan.hikes.some(h => h.id === hike.id)) {
      plan.hikes.push(hike);
      savePlan(plan);
    }
  }

  // Click handler (event delegation)
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-plan-add="hike"]');
    if (!btn) return;
    const card = e.target.closest('.trail-card');
    if (!card) return;

    const hike = scrapeHike(card);
    addHikeToPlan(hike);

    // tiny feedback
    btn.textContent = 'Added ✓';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = 'Add to plan'; btn.disabled = false; }, 1200);
  });

  // Inject buttons now and whenever the list changes (filters, etc.)
  const mo = new MutationObserver(ensureButtons);
  mo.observe(root, { childList: true, subtree: true });
  ensureButtons();
})();
