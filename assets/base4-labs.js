/* ════════════════════════════════════════════════════════════════════════
   BASE4 Security · Guías de laboratorio · comportamiento compartido
   Active Cyber Defense · Ekoparty 2026 (v3)

   A diferencia del template comercial, acá NO se randomiza nada ni se
   muestra "una sección a la vez": un alumno lee de arriba a abajo y
   necesita poder buscar con Ctrl+F en todo el documento.

   Todo el estado vive en localStorage del navegador del alumno y es
   opcional: si falla (modo incógnito, cookies bloqueadas), la guía
   funciona igual. De ahí los try/catch.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var LAB = document.body.getAttribute('data-lab') || 'lab';
  var KEY = 'b4cda26:' + LAB;

  /* ─── Almacenamiento tolerante a fallos ─── */
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* sin persistencia, seguimos */ }
  }

  var state = load();

  /* ─── 1 · Checklists y campos de texto persistidos ─────────────────────
     Los elementos marcados con data-wb los administra base4-workbook.js:
     acá sólo se cuentan para la barra de progreso, no se persisten dos veces. */
  var boxes = Array.prototype.slice.call(document.querySelectorAll('.checklist input[type="checkbox"]'));
  boxes.filter(function (b) { return !b.hasAttribute('data-wb'); }).forEach(function (box, i) {
    var id = box.id || (LAB + '-chk-' + i);
    box.id = id;
    if (state[id] === true) box.checked = true;
    box.addEventListener('change', function () {
      state[id] = box.checked;
      save(state);
      paintProgress();
    });
  });

  Array.prototype.slice.call(document.querySelectorAll('.fill-in'))
    .filter(function (f) { return !f.hasAttribute('data-wb'); })
    .forEach(function (field, i) {
      var id = field.id || (LAB + '-txt-' + i);
      field.id = id;
      if (typeof state[id] === 'string') field.value = state[id];
      field.addEventListener('input', function () {
        state[id] = field.value;
        save(state);
      });
    });

  /* ─── 2 · Barra de progreso = % de checklist completado ────────────── */
  var bar = document.querySelector('.lab-progress > i');
  var readout = document.querySelector('[data-progress-readout]');
  function paintProgress() {
    if (!boxes.length) return;
    var done = boxes.filter(function (b) { return b.checked; }).length;
    var pct = Math.round((done / boxes.length) * 100);
    if (bar) bar.style.width = pct + '%';
    if (readout) readout.textContent = done + ' / ' + boxes.length;
  }
  paintProgress();

  /* El workbook administra sus propios checkboxes pero comparte esta barra. */
  window.B4Labs = { paintProgress: paintProgress };

  /* ─── 3 · Reset del laboratorio ────────────────────────────────────── */
  var resetBtn = document.querySelector('[data-reset]');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (!confirm('¿Borrar tus tildes y anotaciones de este laboratorio?')) return;
      boxes.forEach(function (b) { b.checked = false; });
      Array.prototype.slice.call(document.querySelectorAll('.fill-in')).forEach(function (f) { f.value = ''; });
      if (window.B4Workbook && window.B4Workbook.clear) window.B4Workbook.clear();
      state = {};
      try { localStorage.removeItem(KEY); } catch (e) { /* noop */ }
      paintProgress();
    });
  }

  /* ─── 4 · Modo instructor ──────────────────────────────────────────────
     Oculta/muestra los bloques .instructor-only (solucionario, notas de
     dictado, incongruencias plantadas). Se recuerda entre labs con una
     clave global, así el docente lo activa una vez.
     NO es un control de acceso: el contenido está en el HTML y cualquiera
     puede verlo con Ctrl+U. Si el solucionario no debe llegar al alumno,
     hay que publicar la variante sin esos bloques (ver README). ────────── */
  var GKEY = 'b4cda26:instructor';
  var toggle = document.querySelector('[data-instructor-toggle]');
  function applyMode(on) {
    document.body.classList.toggle('show-instructor', !!on);
    if (toggle) {
      var lbl = toggle.querySelector('[data-mode-label]');
      if (lbl) lbl.textContent = on ? 'Modo instructor: ON' : 'Modo instructor';
      toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }
  var initial = false;
  try { initial = localStorage.getItem(GKEY) === '1'; } catch (e) { /* noop */ }
  applyMode(initial);
  if (toggle) {
    toggle.addEventListener('click', function () {
      var on = !document.body.classList.contains('show-instructor');
      applyMode(on);
      try { localStorage.setItem(GKEY, on ? '1' : '0'); } catch (e) { /* noop */ }
    });
  }

  /* ─── 5 · Temporizador de actividad ────────────────────────────────────
     Cuenta hacia atrás los minutos declarados en data-minutes. Sirve para
     proyectar el bloque mientras los grupos trabajan. ─────────────────── */
  Array.prototype.slice.call(document.querySelectorAll('[data-timer]')).forEach(function (el) {
    var mins = parseInt(el.getAttribute('data-minutes') || '0', 10);
    if (!mins) return;
    var out = el.querySelector('[data-timer-out]');
    var btn = el.querySelector('[data-timer-btn]');
    var left = mins * 60, tick = null;

    function render() {
      var m = Math.floor(Math.abs(left) / 60), s = Math.abs(left) % 60;
      var txt = (left < 0 ? '-' : '') + m + ':' + (s < 10 ? '0' : '') + s;
      if (out) out.textContent = txt;
      if (out) out.style.color = left <= 0 ? '#f87171' : (left <= 120 ? '#F1912D' : '');
    }
    function stop() {
      clearInterval(tick); tick = null;
      if (btn) btn.innerHTML = '<i class="fas fa-play"></i>';
    }
    render();
    if (btn) btn.addEventListener('click', function () {
      if (tick) { stop(); return; }
      btn.innerHTML = '<i class="fas fa-pause"></i>';
      tick = setInterval(function () { left--; render(); }, 1000);
    });
  });

  /* ─── 6 · Índice: resaltar la sección visible ──────────────────────── */
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  if (links.length && 'IntersectionObserver' in window) {
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
                       .filter(Boolean);
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-15% 0px -75% 0px' });
    targets.forEach(function (t) { obs.observe(t); });
  }

  /* ─── 7 · Copiar bloques de código ─────────────────────────────────── */
  Array.prototype.slice.call(document.querySelectorAll('pre.code')).forEach(function (pre) {
    var wrap = pre.parentElement;
    if (!wrap || !wrap.classList.contains('code-wrap')) return;
    var btn = wrap.querySelector('[data-copy]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var text = pre.innerText;
      var done = function () {
        btn.innerHTML = '<i class="fas fa-check"></i> Copiado';
        setTimeout(function () { btn.innerHTML = '<i class="far fa-copy"></i> Copiar'; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { /* noop */ });
      } else {
        try {
          var ta = document.createElement('textarea');
          ta.value = text; document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); document.body.removeChild(ta); done();
        } catch (e) { /* noop */ }
      }
    });
  });

  /* ─── 8 · Al imprimir, abrir todos los desplegables ────────────────── */
  var opened = [];
  window.addEventListener('beforeprint', function () {
    opened = [];
    Array.prototype.slice.call(document.querySelectorAll('details:not([open])')).forEach(function (d) {
      opened.push(d); d.open = true;
    });
  });
  window.addEventListener('afterprint', function () {
    opened.forEach(function (d) { d.open = false; });
    opened = [];
  });

})();
