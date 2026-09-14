/* ════════════════════════════════════════════════════════════════════════
   BASE4 Security · Motor de workbook interactivo
   Active Cyber Defense · Ekoparty 2026 (v3)

   Convierte una guía de laboratorio en un cuaderno de trabajo: todo campo
   se edita en la página, se guarda solo, y se exporta o se importa.

   ── Cómo se marca el HTML ──────────────────────────────────────────────
   Campo simple:
     <div class="wb-cell" contenteditable="true" data-wb="objetivo" data-ph="..."></div>
     <textarea class="fill-in" data-wb="notas"></textarea>
     <input class="wb-input" data-wb="meta.grupo">
     <select class="wb-select" data-wb="color"></select>
     <input type="checkbox" data-wb="chk.joyas">

   Tabla precargada desde un catálogo (el alumno no retipea lo que ya existe):
     <script type="application/json" data-wb-seed-for="ttps">
       [{"id":"T1189","tecnica":"Drive-by Compromise"}, ...]
     </script>
     <div data-wb-table="ttps" data-wb-key="id">
       ...
       <template data-wb-row>
         <tr>
           <td data-wb-col="id" data-wb-fixed></td>          <!-- del catálogo, no se edita -->
           <td><select data-wb-col="veredicto">…</select></td>
           <td><input type="checkbox" data-wb-col="choke"></td>
           <td class="is-editable"><div class="wb-cell" contenteditable="true" data-wb-col="nota"></div></td>
         </tr>
       </template>
     </div>

   data-wb-key   → columna que identifica la fila. Al recargar, los valores del
                   alumno se fusionan sobre el catálogo por esa clave, así que
                   corregir el catálogo no le borra el trabajo.
   data-wb-fixed → celda de catálogo: se pinta desde el seed y no se edita.

   Tabla de filas dinámicas vacías:
     <div data-wb-table="joyas" data-wb-min="3">
       <table class="data-table">
         <thead><tr><th>Joya</th><th>Activo</th><th></th></tr></thead>
         <tbody data-wb-body></tbody>
       </table>
       <template data-wb-row>
         <tr>
           <td class="is-editable"><div class="wb-cell" contenteditable="true" data-wb-col="joya"></div></td>
           <td class="is-editable"><div class="wb-cell" contenteditable="true" data-wb-col="activo"></div></td>
           <td class="wb-rowtools"><button class="wb-del" type="button">✕</button></td>
         </tr>
       </template>
       <div class="wb-tablefoot">
         <button class="wb-btn wb-add" type="button" data-wb-add>+ Agregar fila</button>
         <span class="wb-count"></span>
       </div>
     </div>

   Estructura del documento para exportar:
     data-wb-md-h="2"  → encabezado de nivel 2 en el Markdown
     data-wb-label     → etiqueta del campo en el Markdown

   Todo el estado vive en localStorage del navegador del alumno. Si falla
   (modo incógnito, cookies bloqueadas) la guía sigue funcionando: se
   pierde el autoguardado, no la posibilidad de trabajar y exportar.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var root = document.querySelector('[data-wb-scope]');
  if (!root) return;

  var LAB   = document.body.getAttribute('data-lab') || 'lab';
  var TITLE = (document.querySelector('[data-wb-title]') || {}).textContent || document.title;
  var KEY   = 'b4cda26:wb:' + LAB;

  var state = { meta: {}, fields: {}, tables: {}, checks: {}, savedAt: null };

  /* ══ Almacenamiento ══════════════════════════════════════════════════ */
  var storageOK = true;
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        ['meta', 'fields', 'tables', 'checks'].forEach(function (k) {
          if (parsed && typeof parsed[k] === 'object' && parsed[k]) state[k] = parsed[k];
        });
        state.savedAt = parsed && parsed.savedAt || null;
      }
    } catch (e) { storageOK = false; }
  }

  var saveTimer = null;
  function scheduleSave() {
    setStatus('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(commit, 400);
  }
  function commit() {
    state.savedAt = new Date().toISOString();
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      setStatus('saved');
    } catch (e) {
      storageOK = false;
      setStatus('error');
    }
  }

  var statusEl;
  function setStatus(kind) {
    if (!statusEl) return;
    statusEl.classList.remove('is-saving', 'is-saved', 'is-error');
    var label = statusEl.querySelector('[data-wb-status-label]');
    if (kind === 'saving') { statusEl.classList.add('is-saving'); if (label) label.textContent = 'Guardando…'; return; }
    if (kind === 'error')  { statusEl.classList.add('is-error');  if (label) label.textContent = 'Sin autoguardado — exportá tu trabajo'; return; }
    statusEl.classList.add('is-saved');
    if (label) {
      var d = state.savedAt ? new Date(state.savedAt) : new Date();
      label.textContent = 'Guardado ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }
  }

  /* ══ Utilidades ══════════════════════════════════════════════════════ */
  function txt(el) { return (el.textContent || '').replace(/ /g, ' ').trim(); }

  /* Un contenteditable vacío suele quedar con <br>, y eso rompe :empty,
     que es lo que dibuja el placeholder. Se normaliza en cada input. */
  function normalize(el) {
    if (!txt(el)) el.innerHTML = '';
  }

  function bucketFor(key) {
    if (key.indexOf('meta.') === 0)  return [state.meta, key.slice(5)];
    if (key.indexOf('chk.') === 0)   return [state.checks, key.slice(4)];
    return [state.fields, key];
  }

  /* ══ Campos simples ══════════════════════════════════════════════════ */
  function bindField(el) {
    var key = el.getAttribute('data-wb');
    if (!key) return;
    var pair = bucketFor(key), store = pair[0], k = pair[1];
    var stored = store[k];

    if (el.type === 'checkbox') {
      if (stored === true) el.checked = true;
      el.addEventListener('change', function () {
        store[k] = el.checked;
        scheduleSave();
        if (window.B4Labs && window.B4Labs.paintProgress) window.B4Labs.paintProgress();
      });
      return;
    }
    if (el.isContentEditable) {
      if (typeof stored === 'string') el.textContent = stored;
      normalize(el);
      el.addEventListener('input', function () { normalize(el); store[k] = txt(el); scheduleSave(); });
      /* Pegar como texto plano: si no, entra el HTML de Word o del navegador */
      el.addEventListener('paste', function (ev) {
        ev.preventDefault();
        var t = (ev.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, t);
      });
      return;
    }
    if (typeof stored === 'string') el.value = stored;
    if (el.tagName === 'SELECT') el.setAttribute('data-v', el.value);
    var evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, function () {
      store[k] = el.value;
      if (el.tagName === 'SELECT') el.setAttribute('data-v', el.value);
      scheduleSave();
    });
  }

  /* ══ Tablas dinámicas ════════════════════════════════════════════════ */
  var tables = {};

  function initTable(wrap) {
    var id   = wrap.getAttribute('data-wb-table');
    var tpl  = wrap.querySelector('template[data-wb-row]');
    var body = wrap.querySelector('[data-wb-body]');
    var min  = parseInt(wrap.getAttribute('data-wb-min') || '1', 10);
    var keyCol = wrap.getAttribute('data-wb-key') || '';
    if (!tpl || !body) return;
    tables[id] = { wrap: wrap, tpl: tpl, body: body, min: min, key: keyCol };

    /* Catálogo precargado, si esta tabla tiene uno */
    var seed = null;
    var seedEl = document.querySelector('script[type="application/json"][data-wb-seed-for="' + id + '"]');
    if (seedEl) {
      try { seed = JSON.parse(seedEl.textContent); }
      catch (e) { seed = null; }
    }
    /* Columnas que vienen del catálogo y no se editan */
    var fixedCols = {};
    Array.prototype.forEach.call(tpl.content.querySelectorAll('[data-wb-col][data-wb-fixed]'), function (c) {
      fixedCols[c.getAttribute('data-wb-col')] = true;
    });
    tables[id].seed = seed;
    tables[id].fixedCols = fixedCols;

    function refresh() {
      var n = body.querySelectorAll('tr[data-wb-tr]').length;
      var counter = wrap.querySelector('.wb-count:not([data-wb-tally])');
      if (counter) counter.textContent = n + (n === 1 ? ' fila' : ' filas');
      var empty = wrap.querySelector('[data-wb-empty]');
      if (empty) empty.hidden = n > 0;

      /* Recuento en vivo por valor de una columna: le muestra al alumno si
         está clasificando o aceptando todo. */
      var tally = wrap.querySelector('[data-wb-tally]');
      if (tally) {
        var col = tally.getAttribute('data-wb-tally') || 'veredicto';
        var counts = {}, sin = 0;
        Array.prototype.forEach.call(body.querySelectorAll('tr[data-wb-tr]'), function (tr) {
          var c = tr.querySelector('[data-wb-col="' + col + '"]');
          var v = c ? (c.value || '') : '';
          if (!v) { sin++; return; }
          counts[v] = (counts[v] || 0) + 1;
        });
        var LABELS = { viable: 'viables', depende: 'depende', no: 'descartadas' };
        var parts = Object.keys(LABELS)
          .filter(function (k) { return counts[k]; })
          .map(function (k) { return counts[k] + ' ' + LABELS[k]; });
        if (sin) parts.push(sin + ' sin clasificar');
        tally.textContent = parts.join(' · ');
      }
    }

    function harvest() {
      state.tables[id] = Array.prototype.map.call(
        body.querySelectorAll('tr[data-wb-tr]'),
        function (tr) {
          var row = {};
          Array.prototype.forEach.call(tr.querySelectorAll('[data-wb-col]'), function (cell) {
            var col = cell.getAttribute('data-wb-col');
            if (cell.hasAttribute('data-wb-fixed'))      row[col] = txt(cell);
            else if (cell.type === 'checkbox')           row[col] = cell.checked;
            else if (cell.isContentEditable)             row[col] = txt(cell);
            else                                         row[col] = cell.value || '';
          });
          return row;
        }
      );
      scheduleSave();
    }

    function addRow(data, silent) {
      var tr = tpl.content.firstElementChild.cloneNode(true);
      tr.setAttribute('data-wb-tr', '');
      Array.prototype.forEach.call(tr.querySelectorAll('[data-wb-col]'), function (cell) {
        var col = cell.getAttribute('data-wb-col');
        var val = data && data[col] !== undefined && data[col] !== null ? data[col] : '';
        if (cell.hasAttribute('data-wb-fixed')) {
          /* Contenido de catálogo: puede traer marcado propio del seed, que es
             nuestro, no del usuario. No lleva listener: no se edita. */
          cell.innerHTML = String(val);
          return;
        }
        if (cell.type === 'checkbox') {
          cell.checked = val === true || val === 'true';
          cell.addEventListener('change', harvest);
          return;
        }
        if (cell.isContentEditable) {
          cell.textContent = val;
          normalize(cell);
          cell.addEventListener('input', function () { normalize(cell); harvest(); });
          cell.addEventListener('paste', function (ev) {
            ev.preventDefault();
            var t = (ev.clipboardData || window.clipboardData).getData('text/plain');
            document.execCommand('insertText', false, t);
          });
        } else {
          if (val) cell.value = val;
          if (cell.tagName === 'SELECT') cell.setAttribute('data-v', cell.value);
          cell.addEventListener(cell.tagName === 'SELECT' ? 'change' : 'input', function () {
            if (cell.tagName === 'SELECT') cell.setAttribute('data-v', cell.value);
            harvest();
            refresh();
          });
        }
      });
      var del = tr.querySelector('.wb-del');
      if (del) del.addEventListener('click', function () {
        tr.remove(); harvest(); refresh();
      });
      body.appendChild(tr);
      if (!silent) { harvest(); refresh(); }
      return tr;
    }

    tables[id].addRow = addRow;
    tables[id].refresh = refresh;
    tables[id].harvest = harvest;

    var stored = state.tables[id] || [];
    if (seed) {
      /* El catálogo manda en las columnas fijas; lo que cargó el alumno se
         fusiona encima por clave. Así se puede corregir un ID del catálogo
         sin perder las clasificaciones ya hechas. */
      /* La clave se normaliza sin marcado: el seed puede traer HTML en una
         celda fija, pero lo guardado se cosecha como texto. Si no se
         normaliza, nada coincide y el catálogo se duplica. */
      var norm = function (v) {
        return String(v == null ? '' : v).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      };
      var byKey = {};
      stored.forEach(function (r) { if (keyCol && norm(r[keyCol])) byKey[norm(r[keyCol])] = r; });
      var seedKeys = {};
      seed.forEach(function (sr) {
        if (keyCol && norm(sr[keyCol])) seedKeys[norm(sr[keyCol])] = true;
        var prev = keyCol && norm(sr[keyCol]) ? byKey[norm(sr[keyCol])] : null;
        if (!prev) { addRow(sr, true); return; }
        var merged = {};
        Object.keys(prev).forEach(function (k) { if (!fixedCols[k]) merged[k] = prev[k]; });
        Object.keys(sr).forEach(function (k) { merged[k] = sr[k]; });
        addRow(merged, true);
      });
      /* Filas que el alumno agregó a mano, fuera del catálogo */
      stored.forEach(function (r) {
        if (!keyCol || !norm(r[keyCol]) || !seedKeys[norm(r[keyCol])]) addRow(r, true);
      });
      harvest();
    } else if (stored.length) {
      stored.forEach(function (r) { addRow(r, true); });
    } else {
      for (var i = 0; i < min; i++) addRow(null, true);
    }
    refresh();

    var addBtn = wrap.querySelector('[data-wb-add]');
    if (addBtn) addBtn.addEventListener('click', function () {
      var tr = addRow();
      var first = tr.querySelector('[data-wb-col]');
      if (first && first.focus) first.focus();
    });
  }

  /* ══ Exportación ═════════════════════════════════════════════════════ */
  function metaBlock() {
    return {
      lab: LAB,
      titulo: TITLE.trim(),
      grupo: state.meta.grupo || '',
      integrantes: state.meta.integrantes || '',
      exportado: new Date().toISOString()
    };
  }

  function toJSON() {
    return JSON.stringify({ _meta: metaBlock(), meta: state.meta, fields: state.fields, tables: state.tables, checks: state.checks }, null, 2);
  }

  function mdEscape(s) { return String(s || '').replace(/\|/g, '\\|').replace(/\n+/g, ' '); }

  function toMarkdown() {
    var m = metaBlock();
    var out = ['# ' + m.titulo, ''];
    out.push('- **Grupo:** ' + (m.grupo || '_sin completar_'));
    out.push('- **Integrantes:** ' + (m.integrantes || '_sin completar_'));
    out.push('- **Exportado:** ' + new Date().toLocaleString('es-AR'));
    out.push('');

    var nodes = root.querySelectorAll('[data-wb-md-h], [data-wb-table], [data-wb]');
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.closest('[data-wb-table]') && !el.hasAttribute('data-wb-table')) return;

      if (el.hasAttribute('data-wb-md-h')) {
        var lvl = parseInt(el.getAttribute('data-wb-md-h'), 10) || 2;
        out.push('', new Array(lvl + 1).join('#') + ' ' + txt(el), '');
        return;
      }

      if (el.hasAttribute('data-wb-table')) {
        var id = el.getAttribute('data-wb-table');
        var ths = Array.prototype.map.call(el.querySelectorAll('thead th'), function (th) { return txt(th); });
        var cols = Array.prototype.map.call(
          el.querySelector('template[data-wb-row]').content.querySelectorAll('[data-wb-col]'),
          function (c) { return c.getAttribute('data-wb-col'); }
        );
        var headers = ths.filter(function (h) { return h !== ''; });
        if (headers.length !== cols.length) headers = cols;
        var rows = (state.tables[id] || []).filter(function (r) {
          return cols.some(function (c) {
            if (r[c] === true) return true;
            return typeof r[c] === 'string' && r[c].trim() !== '';
          });
        });
        if (!rows.length) { out.push('_(sin filas completadas)_', ''); return; }
        out.push('| ' + headers.join(' | ') + ' |');
        out.push('|' + headers.map(function () { return ' --- '; }).join('|') + '|');
        rows.forEach(function (r) {
          out.push('| ' + cols.map(function (c) {
            if (r[c] === true)  return 'sí';
            if (r[c] === false) return '—';
            return mdEscape(r[c]) || '—';
          }).join(' | ') + ' |');
        });
        out.push('');
        return;
      }

      var key = el.getAttribute('data-wb');
      if (!key || key.indexOf('meta.') === 0) return;
      var pair = bucketFor(key), val = pair[0][pair[1]];
      var label = el.getAttribute('data-wb-label') || '';

      if (el.type === 'checkbox') {
        var lbl = label || txt(el.closest('label') || el);
        out.push('- [' + (val === true ? 'x' : ' ') + '] ' + lbl);
        return;
      }
      if (!val || !String(val).trim()) {
        if (label) out.push('**' + label + ':** _sin completar_', '');
        return;
      }
      if (label) out.push('**' + label + '**', '');
      out.push(String(val).trim(), '');
    });

    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  /* ══ Descarga y portapapeles ═════════════════════════════════════════ */
  function slug() {
    var g = (state.meta.grupo || 'grupo').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'grupo';
    return LAB + '-' + g;
  }

  function download(text, filename, mime) {
    try {
      var blob = new Blob([text], { type: mime + ';charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      return true;
    } catch (e) { return false; }
  }

  function copy(text, btn) {
    var done = function () {
      if (!btn) return;
      var old = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Copiado';
      setTimeout(function () { btn.innerHTML = old; }, 1700);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
    } else { fallback(text, done); }
  }
  function fallback(text, done) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove(); done();
    } catch (e) { /* el modal siempre queda como salida manual */ }
  }

  /* ══ Modal ═══════════════════════════════════════════════════════════ */
  var modal, modalTitle, modalOut, modalFoot, modalHint;
  function buildModal() {
    modal = document.createElement('div');
    modal.className = 'wb-modal';
    modal.innerHTML =
      '<div class="wb-modal-box" role="dialog" aria-modal="true" aria-labelledby="wb-modal-title">' +
        '<div class="wb-modal-head">' +
          '<h3 id="wb-modal-title" data-t></h3>' +
          '<button class="wb-btn" type="button" data-close style="margin-left:auto"><i class="fas fa-xmark"></i> Cerrar</button>' +
        '</div>' +
        '<div class="wb-modal-body">' +
          '<p class="text-xs text-gray-400 mb-3" data-hint></p>' +
          '<textarea class="wb-out" spellcheck="false"></textarea>' +
        '</div>' +
        '<div class="wb-modal-foot" data-foot></div>' +
      '</div>';
    document.body.appendChild(modal);
    modalTitle = modal.querySelector('[data-t]');
    modalOut   = modal.querySelector('.wb-out');
    modalFoot  = modal.querySelector('[data-foot]');
    modalHint  = modal.querySelector('[data-hint]');
    modal.querySelector('[data-close]').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
  }
  function closeModal() { modal.classList.remove('is-open'); }
  function openModal(title, hint, content, buttons, readonly) {
    if (!modal) buildModal();
    modalTitle.textContent = title;
    modalHint.textContent = hint;
    modalOut.value = content;
    modalOut.readOnly = !!readonly;
    modalFoot.innerHTML = '';
    buttons.forEach(function (b) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'wb-btn' + (b.primary ? ' is-primary' : '');
      el.innerHTML = b.html;
      el.addEventListener('click', function () { b.fn(el); });
      modalFoot.appendChild(el);
    });
    modal.classList.add('is-open');
    if (readonly) modalOut.select();
    else modalOut.focus();
  }

  /* ══ Importación ═════════════════════════════════════════════════════ */
  function applyImport(text) {
    var data;
    try { data = JSON.parse(text); }
    catch (e) { alert('El contenido no es JSON válido.\n\n' + e.message); return; }
    if (!data || typeof data !== 'object') { alert('El archivo no tiene el formato esperado.'); return; }
    if (data._meta && data._meta.lab && data._meta.lab !== LAB) {
      if (!confirm('Ese archivo es del laboratorio "' + data._meta.lab + '" y estás en "' + LAB + '".\n\n¿Importarlo igual?')) return;
    }
    if (!confirm('Importar reemplaza todo lo que tengas cargado en esta guía.\n\n¿Continuar?')) return;
    ['meta', 'fields', 'tables', 'checks'].forEach(function (k) {
      if (data[k] && typeof data[k] === 'object') state[k] = data[k];
    });
    commit();
    location.reload();
  }

  function pickFile() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () { applyImport(String(r.result)); };
      r.readAsText(f);
    });
    input.click();
  }

  /* ══ Derivadores ══════════════════════════════════════════════════════
     Rearman una tabla a partir de lo que el alumno ya cargó en otras. La idea
     es que nada se escriba dos veces: si una TTP ya está clasificada, el top 5
     y los supuestos salen de ahí. ─────────────────────────────────────────── */
  function rows(id) { return state.tables[id] || []; }

  /* Lee el trabajo de otro laboratorio. Es lo que permite que un supuesto
     escrita en el LAB 01 llegue al LAB 05 sin que nadie lo retipee. */
  function labRows(lab, table) {
    try {
      var raw = localStorage.getItem('b4cda26:wb:' + lab);
      if (!raw) return [];
      var st = JSON.parse(raw);
      return (st && st.tables && st.tables[table]) || [];
    } catch (e) { return []; }
  }
  function labField(lab, key) {
    try {
      var raw = localStorage.getItem('b4cda26:wb:' + lab);
      if (!raw) return '';
      var st = JSON.parse(raw);
      return (st && st.fields && st.fields[key]) || '';
    } catch (e) { return ''; }
  }
  function nonEmpty(list, cols) {
    return list.filter(function (r) {
      return cols.some(function (c) { return r[c] === true || (typeof r[c] === 'string' && r[c].trim()); });
    });
  }

  /* Las claves son "lab:tabla" porque dos laboratorios distintos tienen una
     tabla llamada "lagunas" y cada uno la arma desde otra fuente. */
  var DERIVERS = {

    /* LAB 00 · síntesis por joya */
    'lab00:sintesis': function (target) {
      var joyas = nonEmpty(rows('joyas'), ['joya', 'activo']);
      if (!joyas.length) return 'Todavía no hay joyas cargadas en el paso 1.';
      var caminos = rows('caminos'), chokes = rows('chokepoints');
      var rojos = rows('visibilidad')
        .filter(function (v) { return v.color === 'rojo' && (v.salto || '').trim(); })
        .map(function (v) { return v.salto; });

      target.body.innerHTML = '';
      joyas.forEach(function (j, i) {
        var nombre = (j.joya || '').trim() || ('J' + (i + 1));
        var low = nombre.toLowerCase();
        var camino = caminos.filter(function (c) {
          var ref = (c.joya || '').toLowerCase();
          return ref && (low.indexOf(ref) > -1 || ref.indexOf(low) > -1);
        })[0] || caminos[i] || {};
        var choke = chokes.filter(function (c) {
          return (c.caminos || '').toLowerCase().indexOf(low) > -1;
        })[0] || {};
        target.addRow({
          joya: nombre,
          impacto: [j.leen, j.modifican, j.apagan].filter(function (x) { return (x || '').trim(); }).join(' · '),
          camino: (camino.camino || '').trim(),
          chokepoint: (choke.nodo || '').trim(),
          peor: rojos[i] || rojos[0] || ''
        }, true);
      });
      return null;
    },

    /* LAB 01 · top 5 de TTPs, ordenado por el criterio de la guía */
    'lab01:top5': function (target) {
      var viables = rows('ttps').filter(function (t) { return t.veredicto === 'viable'; });
      if (!viables.length) return 'Todavía no clasificaste ninguna técnica como VIABLE.';

      /* Orden: chokepoint primero, después visibilidad roja, después ámbar.
         Es el mismo criterio que pide el paso, aplicado a lo ya cargado. */
      var peso = { rojo: 0, ambar: 1, verde: 2, '': 3 };
      viables.sort(function (a, b) {
        var ca = a.choke === true ? 0 : 1, cb = b.choke === true ? 0 : 1;
        if (ca !== cb) return ca - cb;
        return (peso[a.visibilidad] === undefined ? 3 : peso[a.visibilidad]) -
               (peso[b.visibilidad] === undefined ? 3 : peso[b.visibilidad]);
      });

      target.body.innerHTML = '';
      viables.slice(0, 5).forEach(function (t, i) {
        var razones = [];
        if (t.choke === true) razones.push('está sobre un chokepoint');
        if (t.visibilidad === 'rojo') razones.push('visibilidad roja: sin alternativa de detección');
        if (t.visibilidad === 'ambar') razones.push('visibilidad ámbar: hay datos, falta la pregunta');
        target.addRow({
          orden: String(i + 1),
          tecnica: (t.id || '') + (t.tecnica ? ' · ' + t.tecnica : ''),
          activo: (t.activo || '').trim(),
          visibilidad: t.visibilidad || '',
          criterio: razones.join(' · ') || (t.nota || '').trim()
        }, true);
      });
      return null;
    },

    /* LAB 01 · supuestos sin verificar, desde los DEPENDE */
    'lab01:supuestos': function (target) {
      var dep = rows('ttps').filter(function (t) { return t.veredicto === 'depende'; });
      if (!dep.length) return 'No hay técnicas marcadas como DEPENDE. Ahí es donde viven los supuestos sin verificar: revisá el paso 1.';
      target.body.innerHTML = '';
      dep.forEach(function (t, i) {
        var supuesto = (t.nota || '').trim();
        target.addRow({
          ref: 'L' + (i + 1),
          pregunta: supuesto ? ('¿' + supuesto.replace(/^¿/, '').replace(/\?$/, '') + '?') : '',
          origen: (t.id || '') + (t.tecnica ? ' · ' + t.tecnica : ''),
          aquien: '',
          desbloquea: ''
        }, true);
      });
      return null;
    },

    /* LAB 05 · trae los supuestos de la primera parte para contrastarlos con el
       incidente. Agrega, no reemplaza: lo que ya cargaron del caso queda. */
    'lab05:brechas': appendDeriver(
      'No hay supuestos cargados en el LAB 01. Abrí ese laboratorio, completá los DEPENDE y volvé.',
      function () {
        return labRows('lab01', 'supuestos')
          .filter(function (l) { return (l.pregunta || '').trim(); })
          .map(function (l, i) {
            return {
              ref: 'D1-' + (i + 1),
              brecha: (l.pregunta || '').trim(),
              tipo: '4',
              tecnicas: (l.origen || '').trim(),
              eslabones: '',
              prioridad: ''
            };
          });
      },
      'Se van a agregar tus supuestos del LAB 01 como Tipo 4 (desconocido), para contrastarlos con las brechas que salieron del incidente.\n\nLo que ya cargaste acá no se toca. ¿Continuar?'
    ),

    /* LAB 07 · una fila por brecha priorizada en el LAB 05, con el objetivo de
       Engage que sugiere su tipo ya propuesto. */
    'lab07:actividades': function (target) {
      var lag = labRows('lab05', 'brechas').filter(function (l) { return (l.brecha || '').trim(); });
      if (!lag.length) return 'No hay brechas cargadas en el LAB 05. Completá la taxonomía allá y volvé.';
      var SUGERENCIA = {
        '1': 'Expose / Collect — ',
        '2': 'Expose / Detect — ',
        '3': 'Prepare / Plan — ',
        '4': 'Elicit — '
      };
      target.body.innerHTML = '';
      lag.forEach(function (l) {
        target.addRow({
          ref: ((l.ref || '') + ' · ' + (l.brecha || '')).trim(),
          tipo: l.tipo || '',
          tecnica: (l.tecnicas || '').trim(),
          actividad: SUGERENCIA[l.tipo] || '',
          id: '',
          despliegue: ''
        }, true);
      });
      return null;
    }
  };

  /* Envuelve un derivador que agrega filas en lugar de reemplazarlas. */
  function appendDeriver(emptyMsg, produce, confirmMsg) {
    var fn = function (target) {
      var nuevas = produce();
      if (!nuevas.length) return emptyMsg;
      nuevas.forEach(function (r) { target.addRow(r, true); });
      return null;
    };
    fn.confirmMsg = confirmMsg;
    return fn;
  }

  function runDerive(name, btn) {
    var target = tables[name];
    if (!target) return;
    var fn = DERIVERS[LAB + ':' + name] || DERIVERS[name];
    if (!fn) return;
    var hasRows = target.body.querySelectorAll('tr[data-wb-tr]').length > 0;
    var msg = fn.confirmMsg ||
      'Se va a rearmar esta tabla con lo que cargaste antes.\n\nLo que hayas escrito acá a mano se reemplaza. ¿Continuar?';
    if ((hasRows || fn.confirmMsg) && !confirm(msg)) return;
    var err = fn(target);
    if (err) { alert(err); return; }
    target.harvest();
    target.refresh();
    if (btn) {
      var old = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> Listo';
      setTimeout(function () { btn.innerHTML = old; }, 1700);
    }
  }

  /* ══ Modo edición de la guía (instructor) ════════════════════════════ */
  function initProseEdit() {
    var btn = root.querySelector('[data-wb-prose-toggle]');
    if (!btn) return;
    var SEL = 'main p, main h2, main h3, main h4, main h5, main li, main td.col-label, main .callout-title';
    btn.addEventListener('click', function () {
      var on = !document.body.classList.contains('wb-editing');
      document.body.classList.toggle('wb-editing', on);
      Array.prototype.forEach.call(document.querySelectorAll(SEL), function (el) {
        if (el.closest('.wb-toolbar') || el.querySelector('[data-wb]') || el.hasAttribute('data-wb')) return;
        if (on) { el.setAttribute('contenteditable', 'true'); el.setAttribute('data-wb-prose', ''); }
        else { el.removeAttribute('contenteditable'); el.removeAttribute('data-wb-prose'); }
      });
      btn.innerHTML = on
        ? '<i class="fas fa-lock-open"></i> Texto editable: ON'
        : '<i class="fas fa-pen-to-square"></i> Editar texto de la guía';
    });

    var dl = root.querySelector('[data-wb-prose-save]');
    if (dl) dl.addEventListener('click', function () {
      var clone = document.documentElement.cloneNode(true);
      Array.prototype.forEach.call(clone.querySelectorAll('[data-wb-prose]'), function (el) {
        el.removeAttribute('contenteditable'); el.removeAttribute('data-wb-prose');
      });
      Array.prototype.forEach.call(clone.querySelectorAll('.wb-modal'), function (el) { el.remove(); });
      var body = clone.querySelector('body');
      if (body) body.classList.remove('wb-editing', 'show-instructor');
      var html = '<!DOCTYPE html>\n' + clone.outerHTML;
      if (!download(html, LAB + '-guia-editada.html', 'text/html')) {
        openModal('HTML de la guía', 'El navegador bloqueó la descarga. Copiá el contenido y guardalo como .html', html,
          [{ html: '<i class="far fa-copy"></i> Copiar', primary: true, fn: function (b) { copy(html, b); } }], true);
      }
    });
  }

  /* ══ Barra de herramientas ═══════════════════════════════════════════ */
  function initToolbar() {
    statusEl = root.querySelector('[data-wb-status]');

    var acts = {
      md: function () {
        var md = toMarkdown();
        openModal('Exportar como Markdown',
          'Pegalo en el reporte del grupo, en Notion, en Google Docs o en cualquier editor. El respaldo .json es el que se puede volver a importar en otra máquina.',
          md,
          [
            { html: '<i class="far fa-copy"></i> Copiar todo', primary: true, fn: function (b) { copy(modalOut.value, b); } },
            { html: '<i class="fas fa-download"></i> Descargar .md', fn: function () { download(modalOut.value, slug() + '.md', 'text/markdown'); } },
            { html: '<i class="fas fa-shield-halved"></i> Respaldo .json', fn: function () { download(toJSON(), slug() + '.json', 'application/json'); } }
          ], false);
      },
      json: function () {
        var js = toJSON();
        openModal('Exportar como JSON',
          'Es la copia de respaldo: se puede volver a importar en esta guía para seguir trabajando en otra máquina o en otro momento.',
          js,
          [
            { html: '<i class="fas fa-download"></i> Descargar .json', primary: true, fn: function () { download(modalOut.value, slug() + '.json', 'application/json'); } },
            { html: '<i class="far fa-copy"></i> Copiar', fn: function (b) { copy(modalOut.value, b); } }
          ], true);
      },
      copy: function (btn) { copy(toMarkdown(), btn); },
      importFile: function () { pickFile(); },
      importPaste: function () {
        openModal('Importar', 'Pegá acá el JSON exportado antes y confirmá. Reemplaza todo lo que tengas cargado.', '',
          [{ html: '<i class="fas fa-file-import"></i> Importar', primary: true, fn: function () { applyImport(modalOut.value); } }], false);
      },
      print: function () { window.print(); },
      clear: function () {
        if (!confirm('Se borra todo lo que cargaste en esta guía: tablas, notas y tildes.\n\n¿Seguro? Conviene exportar antes.')) return;
        clearAll();
      }
    };

    Array.prototype.forEach.call(root.querySelectorAll('[data-wb-act]'), function (btn) {
      var fn = acts[btn.getAttribute('data-wb-act')];
      if (fn) btn.addEventListener('click', function () { fn(btn); });
    });

    Array.prototype.forEach.call(root.querySelectorAll('[data-wb-derive-btn]'), function (btn) {
      var name = btn.getAttribute('data-wb-derive-btn');
      btn.addEventListener('click', function () { runDerive(name, btn); });
    });

    if (!storageOK) setStatus('error'); else setStatus('saved');
  }

  function clearAll() {
    state = { meta: {}, fields: {}, tables: {}, checks: {}, savedAt: null };
    try { localStorage.removeItem(KEY); } catch (e) { /* noop */ }
    location.reload();
  }

  /* ══ Al salir ════════════════════════════════════════════════════════
     El autoguardado espera 400 ms para no escribir en cada tecla. Si el
     alumno cierra la pestaña dentro de esa ventana, se perdería lo último
     que escribió: acá se fuerza el commit pendiente antes de irse. ────── */
  function flush() {
    if (!saveTimer) return;
    clearTimeout(saveTimer);
    saveTimer = null;
    commit();
  }

  function guardUnload() {
    window.addEventListener('beforeunload', function (e) {
      flush();
      if (storageOK) return;                 // con autoguardado no hace falta molestar
      var hasWork = Object.keys(state.fields).length || Object.keys(state.tables).length;
      if (!hasWork) return;
      e.preventDefault();
      e.returnValue = '';
    });
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) flush();
    });
  }

  /* ══ Arranque ════════════════════════════════════════════════════════ */
  load();
  Array.prototype.forEach.call(root.querySelectorAll('[data-wb-table]'), initTable);
  Array.prototype.forEach.call(root.querySelectorAll('[data-wb]'), function (el) {
    if (el.closest('[data-wb-table]')) return;   // las filas las maneja initTable
    bindField(el);
  });
  initToolbar();
  initProseEdit();
  guardUnload();
  if (window.B4Labs && window.B4Labs.paintProgress) window.B4Labs.paintProgress();

  window.B4Workbook = {
    clear: clearAll,
    flush: flush,
    markdown: toMarkdown,
    json: toJSON,
    state: function () { return state; }
  };
})();
