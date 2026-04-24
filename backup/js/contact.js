// js/contact.js — contact UX: copy, hours, directions, distance, mailto compose, drafts
(function () {
  const EMAIL = 'youremail@example.com'; // <-- change to your address
  const form = document.getElementById('contactForm');
  const distanceEl = document.getElementById('distance');

  // --- Copy buttons
  document.querySelectorAll('.copy[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const sel = btn.getAttribute('data-copy');
      const el = document.querySelector(sel);
      const text = el?.innerText?.trim() || '';
      try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 1400); }
      catch { alert('Copy failed'); }
    });
  });

  // --- Hours (local time, Europe/Oslo intent)
  const openStatus = document.getElementById('openStatus');
  if (openStatus) {
    const now = new Date();
    const day = now.getDay(); // 0=Sun
    const mins = now.getHours() * 60 + now.getMinutes();

    // Mon–Fri 09:00–17:00, Sat 10:00–14:00, Sun closed
    const schedule = {
      1: [9*60, 17*60], 2: [9*60, 17*60], 3: [9*60, 17*60], 4: [9*60, 17*60], 5: [9*60, 17*60],
      6: [10*60, 14*60]
    };
    const range = schedule[day];
    if (!range) openStatus.textContent = 'Closed today';
    else {
      const [start, end] = range;
      if (mins < start) openStatus.textContent = `Opens today at ${String(Math.floor(start/60)).padStart(2,'0')}:` + String(start%60).padStart(2,'0');
      else if (mins > end) openStatus.textContent = 'Closed for today';
      else openStatus.textContent = `Open now — until ${String(Math.floor(end/60)).padStart(2,'0')}:` + String(end%60).padStart(2,'0');
    }
  }

  // --- Directions + Distance
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const toRad = d => d * Math.PI/180;
    const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  document.querySelectorAll('.directions[data-lat][data-lon]').forEach(btn => {
    const lat = parseFloat(btn.dataset.lat), lon = parseFloat(btn.dataset.lon);

    // distance
    if (distanceEl && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const d = haversine(pos.coords.latitude, pos.coords.longitude, lat, lon);
          distanceEl.textContent = `≈ ${d.toFixed(1)} km from you`;
        },
        () => { /* ignore */ },
        { maximumAge: 60_000 }
      );
    }

    // click → maps
    btn.addEventListener('click', () => {
      const g = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
      const a = `https://maps.apple.com/?daddr=${lat},${lon}&dirflg=d`;
      const isiOS = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
      window.location.href = isiOS ? a : g;
    });
  });

  // --- Form → mailto
  if (form) {
    const draftKey = 'contact:draft';
    // load draft
    try {
      const d = JSON.parse(localStorage.getItem(draftKey) || 'null');
      if (d) { form.name.value = d.name || ''; form.email.value = d.email || ''; form.topic.value = d.topic || 'General'; form.message.value = d.message || ''; }
    } catch {}

    form.addEventListener('submit', (e) => {
      e.preventDefault(); form.classList.add('submitted');
      if (!form.checkValidity()) return;

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const topic = form.topic.value.trim();
      const msg = form.message.value.trim();

      const subject = encodeURIComponent(`Telemark Adventures — ${topic}`);
      const body = encodeURIComponent(
        `${msg}\n\n— ${name}\n${email}\n`
      );
      const href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
      window.location.href = href;
    });

    const saveBtn = document.getElementById('saveDraft');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const d = { name: form.name.value, email: form.email.value, topic: form.topic.value, message: form.message.value };
        try { localStorage.setItem(draftKey, JSON.stringify(d)); alert('Draft saved on this device.'); } catch { alert('Could not save draft.'); }
      });
    }
  }
})();
