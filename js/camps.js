// js/camps.js — Campsite finder for Bø i Telemark (embedded OSM maps)
(function () {
  const listEl = document.getElementById('camp-list');
  const form = document.getElementById('camp-filters');
  if (!listEl || !form) return;

  const osmEmbed = (lat, lon, pad = 0.01) => {
    const minLat = (lat - pad).toFixed(6), maxLat = (lat + pad).toFixed(6);
    const minLon = (lon - pad).toFixed(6), maxLon = (lon + pad).toFixed(6);
    const bbox = `${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
  };

  // Real local stays (coords + quick facts)
  const CAMPS = [
    {
      id: 'first-camp-bo',
      name: 'First Camp Bø – Telemark',
      coords: { lat: 59.4445366, lon: 9.0630146 }, // Lifjellvegen 51
      distance_to_sentrum_km: 3.5,
      photo: 'images/firstcampbo.jpg',
      blurb: 'Family-oriented site near Sommarland & Høyt & Lavt; pitches + cabins.',
      badges: ['family','sommarland','open-year','cabins'],
      facts: { power: 'Yes', season: 'All year', water: 'Yes', river_lake: 'Nearby' }
    },
    {
      id: 'beveroya-camping',
      name: 'Beverøya Camping',
      coords: { lat: 59.4105248, lon: 9.0899131 }, // Gvarvvegen 80
      distance_to_sentrum_km: 1.0,
      photo: 'images/beveroyacamping.jpg',
      blurb: 'By the Bø river; cabins + pitches; easy access to sentrum & bathing spots.',
      badges: ['family','river','open-year','cabins'],
      facts: { power: 'Yes', season: 'All year', water: 'Yes', river_lake: 'Riverside' }
    },
    {
      id: 'breiva-glamping',
      name: 'Breiva Gjestegård & Glamping',
      coords: { lat: 59.471827, lon: 9.072857 }, // Skjelbreidvegen 179
      distance_to_sentrum_km: 6.0, // approx
      photo: 'images/breivagjestegaard.jpg',
      blurb: 'Atmospheric guest farm with glamping tents and nature-focused stays.',
      badges: ['family','glamping','cabins'],
      facts: { power: 'Yes (shared)', season: 'Summer-forward', water: 'Yes', river_lake: 'Countryside' }
    }
  ];

  const label = {
    family: 'Family-friendly',
    river: 'By river/lake',
    sommarland: 'Near Sommarland',
    'open-year': 'Open all year',
    cabins: 'Cabins/pods',
    glamping: 'Glamping'
  };

  const el = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };
  const renderCard = (c) => el(`
    <article class="camp-card" data-id="${c.id}">
      <img src="${c.photo}" alt="${c.name}">
      <div class="body">
        <h3>${c.name}</h3>
        <p>${c.blurb}</p>
        <div class="meta"><span>≈ ${c.distance_to_sentrum_km.toFixed(1)} km from sentrum</span></div>
        <div class="badges">${c.badges.map(b => `<span class="badge">${label[b] || b}</span>`).join('')}</div>
        <details class="more">
          <summary>Details & map</summary>
          <div class="info-grid">
            <div>Season: ${c.facts.season}</div>
            <div>Power: ${c.facts.power}</div>
            <div>Water: ${c.facts.water}</div>
            <div>Setting: ${c.facts.river_lake}</div>
          </div>
          <iframe loading="lazy" src="${osmEmbed(c.coords.lat, c.coords.lon)}" title="Map for ${c.name}"></iframe>
          <p class="caption">Map centers the campsite/lodging. Zoom in for more detail.</p>
        </details>
      </div>
    </article>
  `);

  const state = { feature: '', sort: 'rank' };
  const matches = (c) => !state.feature || c.badges.includes(state.feature);
  const sorters  = { rank: (a,b) => a.distance_to_sentrum_km - b.distance_to_sentrum_km,
                     distance: (a,b) => a.distance_to_sentrum_km - b.distance_to_sentrum_km };

  const render = () => {
    const items = CAMPS.filter(matches).sort(sorters[state.sort]);
    listEl.innerHTML = '';
    if (!items.length) { listEl.append(el(`<p class="caption">No campsites match this filter. Try clearing filters.</p>`)); return; }
    items.forEach(c => listEl.append(renderCard(c)));
  };

  form.feature.addEventListener('change', () => { state.feature = form.feature.value; render(); });
  form.sort.addEventListener('change', () => { state.sort = form.sort.value; render(); });
  document.getElementById('campClear').addEventListener('click', () => { form.reset(); state.feature = ''; state.sort='rank'; render(); });

  render();
})();
