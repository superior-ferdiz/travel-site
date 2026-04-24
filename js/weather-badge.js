// js/weather-badge.js — compact weather badge for the homepage hero (Open-Meteo)
(function () {
  const el = document.getElementById('weather-badge');
  if (!el) return;

  const lat = parseFloat(el.dataset.lat || '59.413');
  const lon = parseFloat(el.dataset.lon || '9.069');
  const tz  = el.dataset.timezone || 'Europe/Oslo';

  // Small WMO code → [desc, emoji] map
  const WMO = (code) => {
    const m = {
      0:['Clear','☀️'],1:['Mainly clear','🌤️'],2:['Partly cloudy','⛅'],3:['Overcast','☁️'],
      45:['Fog','🌫️'],48:['Rime fog','🌫️'],
      51:['Light drizzle','🌦️'],53:['Drizzle','🌦️'],55:['Heavy drizzle','🌧️'],
      61:['Light rain','🌧️'],63:['Rain','🌧️'],65:['Heavy rain','🌧️'],
      66:['Freezing rain','🌧️'],67:['Freezing rain','🌧️'],
      71:['Light snow','🌨️'],73:['Snow','🌨️'],75:['Heavy snow','❄️'],
      80:['Showers','🌧️'],81:['Showers','🌧️'],82:['Violent showers','🌧️'],
      85:['Snow showers','🌨️'],86:['Snow showers','❄️'],
      95:['Thunderstorm','⛈️'],96:['Thunder w/ hail','⛈️'],99:['Thunder w/ hail','⛈️']
    };
    return m[code] || ['Weather','🌥️'];
  };

  const cacheKey = `wxbadge:${lat.toFixed(3)},${lon.toFixed(3)}`;
  const nowMs = Date.now();

  // read cache (10 min)
  try {
    const c = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
    if (c && (nowMs - c.t) < 10 * 60 * 1000) {
      update(c.data);
      return;
    }
  } catch {}

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: lat, longitude: lon, timezone: tz,
    current_weather: 'true',
    daily: 'weathercode,temperature_2m_max,temperature_2m_min',
    forecast_days: '1'
  }).toString();

  fetch(url, { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => { try { sessionStorage.setItem(cacheKey, JSON.stringify({ t: nowMs, data })); } catch{}; return data; })
    .then(update)
    .catch(() => fail());

  function update(data){
    const cw = data?.current_weather || {};
    const [desc, icon] = WMO(cw.weathercode ?? 0);
    const temp = Math.round(cw.temperature ?? 0);

    const max = Math.round(data?.daily?.temperature_2m_max?.[0] ?? NaN);
    const min = Math.round(data?.daily?.temperature_2m_min?.[0] ?? NaN);

    const $ = (sel) => el.querySelector(sel);
    $('.wxb-icon').textContent = icon;
    $('.wxb-temp').textContent = isFinite(temp) ? `${temp}°C` : '--°C';
    $('.wxb-desc').textContent = isFinite(max) && isFinite(min)
      ? `${desc} · ${min}° / ${max}°`
      : desc;

    el.setAttribute('title', `${desc} — ${isFinite(temp)?temp+'°C':'--'} (min ${isFinite(min)?min+'°':''} / max ${isFinite(max)?max+'°':''})`);
  }

  function fail(){
    const $ = (sel) => el.querySelector(sel);
    $('.wxb-icon').textContent = '⚠️';
    $('.wxb-temp').textContent = '';
    $('.wxb-desc').textContent = 'Weather unavailable';
  }
})();
