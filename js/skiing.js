// js/skiing.js — night-skiing / lit-loops toggles (saved locally)
(function () {
  const inputs = document.querySelectorAll('input[data-toggle-badge]');
  if (!inputs.length) return;

  inputs.forEach(input => {
    const key = 'ski-toggle:' + (input.id || input.name || Math.random());
    const badgeSel = input.dataset.toggleBadge;
    const badge = badgeSel ? document.querySelector(badgeSel) : null;

    // load saved state
    try { input.checked = localStorage.getItem(key) === '1'; } catch {}
    sync();

    input.addEventListener('change', () => {
      sync();
      try { localStorage.setItem(key, input.checked ? '1' : '0'); } catch {}
    });

    function sync(){
      if (badge) badge.classList.toggle('is-on', !!input.checked);
    }
  });
})();
