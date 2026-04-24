// js/gear.js — persist checklist state + print
(function () {
  const root = document.getElementById('gear');
  if (!root) return;
  const KEY = 'gear:v1';
  const boxes = root.querySelectorAll('input[type="checkbox"][data-key]');

  // load
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    boxes.forEach(b => { if (saved[b.dataset.key]) b.checked = true; });
  } catch {}

  // save on change
  function save() {
    const obj = {};
    boxes.forEach(b => obj[b.dataset.key] = !!b.checked);
    try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch {}
  }
  boxes.forEach(b => b.addEventListener('change', save));

  // actions
  const printBtn = document.getElementById('gearPrint');
  const clearBtn = document.getElementById('gearClear');
  if (printBtn) printBtn.addEventListener('click', () => window.print());
  if (clearBtn) clearBtn.addEventListener('click', () => { boxes.forEach(b => b.checked = false); save(); });
})();
