// --- Saved hikes rednering
function getPlan() {
  try { return JSON.parse(localStorage.getItem('journeyPlan')) || {}; }
  catch { return {}; }
}
function savePlan(plan) {
  localStorage.setItem('journeyPlan', JSON.stringify(plan));
}

function hikeCardHTML(h) {
  return `
    <article class="card">
      <img src="${h.img}" alt="${h.title}">
      <div class="card-body">
        <h3>${h.title}</h3>
        <p class="muted">
          ${h.distKm ? `${h.distKm} km` : ''}${h.distKm && h.elevM ? ' · ' : ''}${h.elevM ? `${h.elevM} m` : ''}
        </p>
        <div class="journey-cta" style="margin-top:8px">
          <a class="btn btn-ghost" href="${h.href}">View</a>
          <button class="btn btn-ghost" data-remove-hike="${h.id}">Remove</button>
        </div>
      </div>
    </article>
  `;
}

function renderSavedHikes() {
  const sec = document.getElementById('saved-hikes');
  const wrap = document.getElementById('hike-cards');
  if (!sec || !wrap) return;

  const plan = getPlan();
  const hikes = Array.isArray(plan.hikes) ? plan.hikes : [];
  if (!hikes.length) {
    sec.hidden = true;
    wrap.innerHTML = '';
    return;
  }
  wrap.innerHTML = hikes.map(hikeCardHTML).join('');
  sec.hidden = false;

  // remove handlers
  wrap.querySelectorAll('[data-remove-hike]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-remove-hike');
      const plan = getPlan();
      plan.hikes = (plan.hikes || []).filter(h => h.id !== id);
      savePlan(plan);
      renderSavedHikes();
    };
  });
}

// Initial render & update after form submit (so users see it right away)
window.addEventListener('DOMContentLoaded', renderSavedHikes);
document.getElementById('journey-form')?.addEventListener('submit', () => {
  setTimeout(renderSavedHikes, 0);
});


// Simple data to render familiar cards
const STAYS = [
  { id:'hotel', title:'Bø Hotell', img:'images/hero.jpg', text:'Comfortable base in town — easy access to dining and buses.', href:'https://bohotell.no/en/eat-and-drink/' },
  { id:'cabin', title:'Lifjell Cabins', img:'images/skiing.jpg', text:'Cabins close to trails and ski terrain on Lifjell.', href:'https://www.visittelemark.com' },
  { id:'camp',  title:'Lakeside Camp', img:'images/camping.jpg', text:'Wake up by the water — great for summer swims & paddling.', href:'https://www.sommarland.no' }
];

const EXPS = [
  { id:'hike',   title:'Hiking: Gygrestolen', img:'images/Gygrestolen.jpg', text:'Iconic rock formation above Bø with dramatic views.', href:'hiking.html#trails' },
  { id:'summit', title:'Summit: Øysteinnatten', img:'images/oysteinnhatten.jpg', text:'One of Lifjell’s classic summits with wide panoramas.', href:'hiking.html#trails' },
  { id:'lake',   title:'Lakes & swimming', img:'images/slide3.jpg', text:'Find calm water for a dip or paddle on warm days.', href:'index.html#plan' },
  { id:'ski',    title:'Skiing: Lifjell', img:'images/skiing.jpg', text:'Alpine and cross-country options when the snow is on.', href:'skiing.html' },
  { id:'food',   title:'Local food & cafés', img:'images/kaffekanne.jpg', text:'Cafés, bakeries and casual dining in and around Bø.', href:'food.html' },
  { id:'culture',title:'Culture & cinema', img:'images/gullbringkulturhus.jpg', text:'Gullbring culture house, films and local events.', href:'events.html#hangouts' }
];

const $ = sel => document.querySelector(sel);
const byId = id => document.getElementById(id);

function cardHTML({title, img, text, href}) {
  return `
    <a class="card" ${href ? `href="${href}"` : ''} ${href ? 'target="_blank" rel="noopener"' : ''}>
      <img src="${img}" alt="${title}">
      <div class="card-body">
        <h3>${title}</h3>
        <p>${text}</p>
      </div>
    </a>
  `;
}

// Form behavior
const form = byId('journey-form');
const stayWrap = byId('stay-cards');
const expWrap  = byId('exp-cards');
const sugg     = byId('suggestions');
const result   = byId('journey-result');
const cta      = byId('journey-cta');

// Render suggestions based on selections
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const stay = form.stay.value;
  const days = form.days.value;
  const exps = [...form.querySelectorAll('input[name="exp"]:checked')].map(x => x.value);

  // Build suggested cards
  stayWrap.innerHTML = '';
  expWrap.innerHTML = '';

  const stayCard = STAYS.find(s => s.id === stay);
  if (stayCard) stayWrap.innerHTML = cardHTML(stayCard);

  const expCards = EXPS.filter(x => exps.includes(x.id));
  if (expCards.length) expWrap.innerHTML = expCards.map(cardHTML).join('');
  sugg.hidden = !(stayCard || expCards.length);

  // Summary
  const stayText = stayCard ? stayCard.title : '—';
  const dayText  = days ? (days === '2' ? 'Weekend (2 days)' : days === '4' ? 'Short break (3–4 days)' : 'Full week (7 days)') : '—';
  const expText  = expCards.length ? expCards.map(x => x.title).join(', ') : '—';

  result.innerHTML = `
    <h3>Your plan</h3>
    <ul class="info">
      <li><strong>Stay:</strong> ${stayText}</li>
      <li><strong>Length:</strong> ${dayText}</li>
      <li><strong>Experiences:</strong> ${expText}</li>
    </ul>
    <p class="muted">Tip: adjust the checkboxes and click “Build my plan” again to refine.</p>
  `;
  result.hidden = false;
  cta.hidden = false;

  // Save simple draft locally
  localStorage.setItem('journeyPlan', JSON.stringify({ stay, days, exps }));
});

// Load saved choices (nice touch)
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('journeyPlan');
  if (!saved) return;
  try {
    const { stay, days, exps } = JSON.parse(saved);
    if (stay) form.stay.value = stay;
    if (days) form.days.value = days;
    if (Array.isArray(exps)) {
      exps.forEach(v => {
        const box = form.querySelector(`input[name="exp"][value="${v}"]`);
        if (box) box.checked = true;
      });
    }
  } catch {}
});
