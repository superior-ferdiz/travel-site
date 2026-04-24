// js/snow.js — Snowfall & freezing level (Open-Meteo)
(function () {
  const el = document.getElementById('snow-widget');
  if (!el) return;

  const lat = parseFloat(el.dataset.lat || '59.478');
  const lon = parseFloat(el.dataset.lon || '9.010');
  const tz  = el.dataset.timezone || 'Europe/Oslo';

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    timezone: tz,
    hourly: 'snowfall,freezing_level_height,temperature_2m',
    daily: 'snowfall_sum,freezing_level_height_max,freezing_level_height_min,temperature_2m_min,temperature_2m_max',
    forecast_days: '7'
  }).toString();

  const fmt = (opts) => new Intl.DateTimeFormat(undefined, { timeZone: tz, ...opts });
  const fmtHour = fmt({ hour: 'numeric' });
  const fmtDay  = fmt({ weekday: 'short' });

  const $ = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; };

  const render = (data) => {
    const root = document.createDocumentFragment();
    const wrap = $(`<section class="snow"><h3>Snow forecast</h3></section>`);

    // --- Now snapshot
    const H = data.hourly;
    const nowIdx = Math.max(0, H.time.findIndex(t => new Date(t) >= new Date()));
    const snowfallNow = H.snowfall[nowIdx] ?? 0;
    const freezeNow   = H.freezing_level_height[nowIdx] ?? NaN;
    const tempNow     = H.temperature_2m[nowIdx] ?? NaN;

    const now = $(`
      <div class="snow-now">
        <div class="cell"><span class="label">Now snowfall</span>${(snowfallNow).toFixed(1)} mm/h</div>
        <div class="cell"><span class="label">Freezing lvl</span>${isFinite(freezeNow)? Math.round(freezeNow) + ' m' : '—'}</div>
        <div class="cell"><span class="label">Temp</span>${isFinite(tempNow)? Math.round(tempNow) + '°C' : '—'}</div>
      </div>
    `);
    wrap.appendChild(now);

    // --- Next 24 hours bars
    const end = Math.min(nowIdx + 24, H.time.length);
    const bars = $(`<div class="snow-bars" aria-label="Next 24 hours snowfall"></div>`);
    // find max for scaling height
    let max = 0;
    for (let i = nowIdx; i < end; i++) max = Math.max(max, H.snowfall[i] || 0);
    const scale = max > 0 ? 60 / max : 0; // 60px tall = max

    for (let i = nowIdx; i < end; i++) {
      const mm = Math.max(0, H.snowfall[i] || 0);
      const h  = Math.round(mm * scale);
      const t  = fmtHour.format(new Date(H.time[i]));
      bars.appendChild($(`
        <div class="snow-bar" title="${mm.toFixed(1)} mm at ${t}">
          <div class="col" style="height:${h}px"></div>
          <div class="val">${mm ? mm.toFixed(1) : ''}</div>
          <div class="t">${t}</div>
        </div>
      `));
    }
    wrap.appendChild(bars);

    // --- Next 7 days summary
    const D = data.daily;
    const days = $(`<div class="snow-days" aria-label="7-day snowfall"></div>`);
    D.time.forEach((iso, i) => {
      const mm = D.snowfall_sum?.[i] ?? 0;
      const fmin = D.freezing_level_height_min?.[i];
      const fmax = D.freezing_level_height_max?.[i];
      days.appendChild($(`
        <div class="snow-day">
          <div class="name">${fmtDay.format(new Date(iso))}</div>
          <div class="mm">${mm.toFixed(1)} mm</div>
          <div class="freeze">${isFinite(fmin)&&isFinite(fmax) ? `${Math.round(fmin)}–${Math.round(fmax)} m` : ''}</div>
        </div>
      `));
    });
    wrap.appendChild(days);

    el.innerHTML = '';
    el.appendChild(wrap);
  };

  const renderError = () => {
    el.innerHTML = `<div class="wx-error">⚠️ Unable to load snow forecast.</div>`;
  };

  fetch(url, { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(render)
    .catch(renderError);
})();
