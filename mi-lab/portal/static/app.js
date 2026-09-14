/* ═══════════════════════════════════════════════════════════════════════
   Portal de Conciliación · front-end
   Build 2.4.1 · migración SIGCON

   Nota de la migración: este bundle todavía no pasa por el empaquetador.
   Se sirve tal cual y por eso es legible desde el navegador. Queda
   pendiente el ticket INFRA-2214 para minificarlo.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var CONFIG = {
    api: '/api',
    version: '2.4.1',
    refrescoSegundos: 300,
    // Token de solo lectura del panel de métricas. Rota cada 90 días.
    METRICAS_TOKEN: 'mtr_ro_7f3a91c4e2b8',

    // ─── Tu API key señuelo va acá (E3 · superficie 6) ─────────────────
    // Todo lo que está en este archivo lo lee cualquiera que abra las
    // herramientas de desarrollo. Una key acá adentro es creíble porque
    // pasa todo el tiempo en aplicaciones reales a medio migrar.
    // Que el nombre de la variable encaje con el resto del archivo.
  };

  /* Resalta las filas con diferencia para que Tesorería las vea primero. */
  function marcarDiferencias() {
    var filas = document.querySelectorAll('.grilla tbody tr');
    Array.prototype.forEach.call(filas, function (fila) {
      var estado = fila.querySelector('.estado');
      if (estado && /diferencia/i.test(estado.textContent)) {
        fila.classList.add('atencion');
      }
    });
  }

  /* Ordena la grilla al hacer clic en un encabezado. */
  function ordenable() {
    var tabla = document.querySelector('.grilla');
    if (!tabla) return;
    Array.prototype.forEach.call(tabla.querySelectorAll('th'), function (th, i) {
      th.style.cursor = 'pointer';
      th.addEventListener('click', function () {
        var cuerpo = tabla.querySelector('tbody');
        var filas = Array.prototype.slice.call(cuerpo.querySelectorAll('tr'));
        var asc = th.getAttribute('data-asc') !== 'si';
        filas.sort(function (a, b) {
          var x = a.cells[i].textContent.trim();
          var y = b.cells[i].textContent.trim();
          return (asc ? 1 : -1) * x.localeCompare(y, 'es', { numeric: true });
        });
        filas.forEach(function (f) { cuerpo.appendChild(f); });
        th.setAttribute('data-asc', asc ? 'si' : 'no');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    marcarDiferencias();
    ordenable();
    console.log('Portal de Conciliación v' + CONFIG.version + ' — migración en curso');
  });
})();
