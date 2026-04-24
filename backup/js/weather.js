// js/weather.js — Weather for Hiking page (Open-Meteo)
(function () {
  const el = document.getElementById('weather-widget');
  if (!el) return;

  const lat = parseFloat(el.dataset.lat || '59.413');
  const lon = parseFloat(el.dataset.lon || '9.069');
  const tz  = el.dataset.timezone || 'Europe/Oslo';

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    timezone: tz,
    current_weather: 'true',
    hourly: 'temperature_2m,precipitation_probability,weathercode',
    daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset',
    forecast_days: '7',
  }).toString();

  const WMO = (code) => {
    // Minimal WMO weathercode map (Open-Meteo)
    const m = {
      0:  ['Clear', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
      45: ['Fog', '🌫️'], 48: ['Rime fog', '🌫️'],
      51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
      56: ['Freezing drizzle', '🌧️'], 57: ['Freezing drizzle', '🌧️'],
      61: ['Light rain', '🌧️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
      66: ['Freezing rain', '🌧️'], 67: ['Freezing rain', '🌧️'],
      71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'],
      77: ['Snow grains', '🌨️'],
      80: ['Rain showers', '🌧️'], 81: ['Rain showers', '🌧️'], 82: ['Violent showers', '🌧️'],
      85: ['Snow showers', '🌨️'], 86: ['Snow showers', '❄️'],
      95: ['Thunderstorm', '⛈️'], 96: ['Thunder w/ hail', '⛈️'], 99: ['Thunder w/ hail', '⛈️'],
    };
    return m[code] || ['Weather', '🌥️'];
  };

  const fmt = (opts) => new Intl.DateTimeFormat(undefined, { timeZone: tz, ...opts });
  const fmtHour   = fmt({ hour: 'numeric' });
  const fmtDay    = fmt({ weekday: 'short' });

  const $ = (html) => {
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstElementChild;
  };

  const render = (data) => {
    const root = document.createDocumentFragment();

    // ---- Current
    const cw = data.current_weather || {};
    const [desc, icon] = WMO(cw.weathercode ?? 0);
    const now = $(`
      <section class="wx-now" aria-label="Current weather">
        <div class="wx-icon" role="img" aria-label="${desc}">${icon}</div>
        <div class="wx-temp">${Math.round(cw.temperature)}°C</div>
        <div class="wx-meta">
          <div>${desc}</div>
          <div>Wind ${Math.round(cw.windspeed)} m/s</div>
        </div>
      </section>
    `);
    root.append(now);

    // ---- Next 12 hours
    const hours = $(`<section class="wx-hours" aria-label="Next 12 hours"><h3>Next hours</h3><div class="wx-strip"></div></section>`);
    const strip = hours.querySelector('.wx-strip');

    const hTime = data.hourly.time;
    const hTemp = data.hourly.temperature_2m;
    const hProb = data.hourly.precipitation_probability || [];
    const hCode = data.hourly.weathercode || [];

    // Find current index (closest hour >= now)
    const nowISO = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    let idx = hTime.findIndex(t => t.startsWith(nowISO));
    if (idx < 0) idx = 0;
    const end = Math.min(idx + 12, hTime.length);

    for (let i = idx; i < end; i++) {
      const [dsc, ico] = WMO(hCode[i] ?? 0);
      const t = fmtHour.format(new Date(hTime[i]));
      const p = (hProb[i] ?? 0);
      strip.appendChild($(`
        <div class="wx-hour" title="${dsc}">
          <div class="t">${t}</div>
          <div class="i">${ico}</div>
          <div class="v">${Math.round(hTemp[i])}°</div>
          <div class="p">${p ? p + '%' : ''}</div>
        </div>
      `));
    }
    root.append(hours);

    // ---- Next 7 days
    const days = $(`<section class="wx-days" aria-label="Next 7 days"><h3>7-day</h3><div class="wx-grid"></div></section>`);
    const grid = days.querySelector('.wx-grid');

    const dDay  = data.daily.time;
    const dMax  = data.daily.temperature_2m_max;
    const dMin  = data.daily.temperature_2m_min;
    const dPre  = data.daily.precipitation_sum || [];
    const dCode = data.daily.weathercode || [];

    dDay.forEach((iso, i) => {
      const [dsc, ico] = WMO(dCode[i] ?? 0);
      grid.appendChild($(`
        <div class="wx-day" title="${dsc}">
          <div class="name">${fmtDay.format(new Date(iso))}</div>
          <div class="i">${ico}</div>
          <div class="temps"><span class="max">${Math.round(dMax[i])}°</span><span class="min">${Math.round(dMin[i])}°</span></div>
          <div class="precip">${dPre[i] ? dPre[i].toFixed(1) + ' mm' : ''}</div>
        </div>
      `));
    });
    root.append(days);

    el.innerHTML = '';
    el.appendChild(root);
  };

  const renderError = (msg) => {
    el.innerHTML = `<div class="wx-error">⚠️ ${msg}</div>`;
  };

  fetch(url, { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject(new Error('Network response was not ok')))
    .then(render)
    .catch(() => renderError('Unable to load weather right now.'));
})();
