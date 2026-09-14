/* ════════════════════════════════════════════════════════════════════════
   Diagrama de red de EkoFinance · SVG generado desde datos
   Active Cyber Defense · Ekoparty 2026

   Reemplaza la imagen estática. Una sola fuente de verdad: editás ZONAS,
   NODOS o ENLACES y el diagrama cambia en todas las guías que lo usan.

   Uso:  <div data-eko-network></div>
         <script src="../assets/ekofinance-network.js"></script>

   Decisiones de dibujo:
   · Cada activo lleva ícono de plataforma (Windows, Linux, AWS, appliance,
     hipervisor, usuarios) para que se lea de un vistazo qué es.
   · Los enlaces se rutean en ángulo recto por carriles verticales
     reservados, no con curvas: así no se solapan ni se cruzan.
   · El inventario coincide con resources/04-insumos/03-diagrama-red-anotado.html,
     que es el canon del caso. Si cambia uno, cambia el otro.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var W = 1060, H = 700;

  /* ─── Paleta por plataforma ─────────────────────────────────────────── */
  var PLAT = {
    win:  { c: '#4ea3e0', label: 'Windows' },
    lin:  { c: '#f5b74e', label: 'Linux' },
    aws:  { c: '#ff9900', label: 'AWS gestionado' },
    net:  { c: '#9ca3af', label: 'Equipo de red' },
    hyp:  { c: '#a78bfa', label: 'Hipervisor' },
    user: { c: '#7dd3a0', label: 'Usuarios' },
    net_ext: { c: '#6b7280', label: 'Red externa' }
  };

  /* ─── Íconos · rutas SVG dentro de una caja de 22×22 ────────────────── */
  var ICON = {
    /* ventana de 4 paneles */
    win: '<rect x="1" y="1" width="9" height="9" rx="1"/><rect x="12" y="1" width="9" height="9" rx="1"/>' +
         '<rect x="1" y="12" width="9" height="9" rx="1"/><rect x="12" y="12" width="9" height="9" rx="1"/>',
    /* terminal con prompt: a 22px se lee mejor que un pingüino */
    lin: '<rect x="1" y="3" width="20" height="16" rx="2"/>' +
         '<path d="M4.4,8.6 L7.4,11.2 L4.4,13.8" fill="none" stroke="#141414" stroke-width="1.5" ' +
         'stroke-linecap="round" stroke-linejoin="round"/>' +
         '<path d="M9.4,14.2 L15.6,14.2" stroke="#141414" stroke-width="1.5" stroke-linecap="round" fill="none"/>',
    /* nube */
    aws: '<path d="M5.4,18 C2.6,18 1,16.3 1,14.2 C1,12.2 2.5,10.6 4.6,10.4 C5.1,7.2 7.7,5 11,5 ' +
         'C14,5 16.5,7 17.2,9.8 C19.4,10 21,11.7 21,13.8 C21,16.1 19.1,18 16.6,18 Z"/>',
    /* switch / appliance: caja con puertos */
    net: '<rect x="1" y="6" width="20" height="11" rx="1.6"/><rect x="3.6" y="9" width="2.4" height="2.4" fill="#141414"/>' +
         '<rect x="7.4" y="9" width="2.4" height="2.4" fill="#141414"/><rect x="11.2" y="9" width="2.4" height="2.4" fill="#141414"/>' +
         '<rect x="15" y="9" width="2.4" height="2.4" fill="#141414"/><path d="M4,14 L18,14" stroke="#141414" stroke-width="1.2" fill="none"/>',
    /* servidores apilados */
    hyp: '<rect x="1.5" y="2" width="19" height="5.4" rx="1.2"/><rect x="1.5" y="8.6" width="19" height="5.4" rx="1.2"/>' +
         '<rect x="1.5" y="15.2" width="19" height="5.4" rx="1.2"/>' +
         '<circle cx="17.6" cy="4.7" r="0.9" fill="#141414"/><circle cx="17.6" cy="11.3" r="0.9" fill="#141414"/>' +
         '<circle cx="17.6" cy="17.9" r="0.9" fill="#141414"/>',
    /* dos personas */
    user: '<circle cx="7.6" cy="6.4" r="3.4"/><path d="M1.6,20 C1.6,15.4 4.3,13 7.6,13 C10.9,13 13.6,15.4 13.6,20 Z"/>' +
          '<circle cx="16" cy="7.6" r="2.6"/><path d="M11.8,20 C11.8,16.4 13.6,14.4 16,14.4 C18.4,14.4 20.4,16.4 20.4,20 Z"/>',
    /* globo */
    net_ext: '<circle cx="11" cy="11" r="9.6" fill="none" stroke-width="1.7"/>' +
             '<ellipse cx="11" cy="11" rx="4.2" ry="9.6" fill="none" stroke-width="1.4"/>' +
             '<path d="M1.6,11 L20.4,11" stroke-width="1.4" fill="none"/>' +
             '<path d="M3.2,6 C7,8 15,8 18.8,6 M3.2,16 C7,14 15,14 18.8,16" stroke-width="1.2" fill="none"/>'
  };

  /* ─── Zonas ─────────────────────────────────────────────────────────── */
  var ZONAS = [
    { x:  16, y:  14, w: 700, h:  96, label: 'INTERNET / ACCESO REMOTO', cidr: '',              alt: false },
    { x:  16, y: 126, w: 700, h: 110, label: 'DMZ',          cidr: '10.20.50.0/24',  alt: true  },
    { x:  16, y: 252, w: 700, h:  98, label: 'VLAN OFICINA', cidr: '10.20.10.0/24',  alt: false },
    { x:  16, y: 366, w: 700, h: 200, label: 'VLAN PROD',    cidr: '10.20.30.0/24',  alt: true  },
    { x:  16, y: 582, w: 700, h: 104, label: 'KONEX · RECUPERACIÓN', cidr: '10.40.30.0/24', alt: false },
    { x: 736, y: 126, w: 308, h: 440, label: 'AWS · HACKING FINANCES', cidr: '10.60.0.0/16',  alt: true  }
  ];

  /* ─── Nodos ─────────────────────────────────────────────────────────── */
  var NODOS = [
    { id:'internet', x:  40, y:  44, w: 150, h: 52, plat:'net_ext', name:'Internet', sub:'no confiable',
      rol:'Red pública', os:'—', ip:'—' },
    { id:'home', x: 214, y:  44, w: 170, h: 52, plat:'user', name:'Home Office', sub:'≈40 usuarios',
      rol:'Usuarios remotos que entran por escritorio virtual', os:'Heterogéneo + Google Workspace', ip:'—' },

    { id:'bal', x:  40, y: 158, w: 150, h: 56, plat:'net', name:'EKO-BAL01', sub:'10.20.50.5',
      rol:'Balanceador y publicación NAT hacia internet', os:'Appliance', ip:'10.20.50.5', expuesto:true },
    { id:'vdi', x: 254, y: 158, w: 180, h: 56, plat:'win', name:'EKO-VDI01', sub:'10.20.50.11',
      rol:'VMware Horizon · Connection Server y gateway. Miembro del dominio.', os:'Windows Server 2019', ip:'10.20.50.11', expuesto:true },
    { id:'web', x: 498, y: 158, w: 170, h: 56, plat:'lin', name:'eko-web01', sub:'10.20.50.20',
      rol:'Web Server del Mobile Banking', os:'Ubuntu 22.04 · NodeJS', ip:'10.20.50.20', expuesto:true },

    { id:'ws', x: 254, y: 282, w: 260, h: 52, plat:'win', name:'EKO-WS001 … 180', sub:'10.20.10.0/24',
      rol:'Estaciones de trabajo de oficina (≈180)', os:'Windows 10 / 11', ip:'10.20.10.0/24' },

    { id:'dc',  x:  40, y: 398, w: 156, h: 56, plat:'win', name:'EKO-DC01',  sub:'10.20.30.10',
      rol:'Controlador de dominio ekofinance.local', os:'Windows Server 2019', ip:'10.20.30.10' },
    { id:'exc', x: 216, y: 398, w: 150, h: 56, plat:'win', name:'EKO-EXC01', sub:'10.20.30.20',
      rol:'Exchange Server', os:'Windows Server 2019', ip:'10.20.30.20' },
    { id:'fs',  x: 386, y: 398, w: 150, h: 56, plat:'win', name:'EKO-FS01',  sub:'10.20.30.30',
      rol:'Servidor de archivos', os:'Windows Server 2019', ip:'10.20.30.30' },
    { id:'dns', x: 556, y: 398, w: 130, h: 56, plat:'win', name:'EKO-DNS01', sub:'10.20.30.40',
      rol:'DNS interno', os:'Windows Server 2019', ip:'10.20.30.40' },

    { id:'api', x:  40, y: 480, w: 176, h: 56, plat:'lin', name:'eko-api01', sub:'10.20.30.60',
      rol:'API del Mobile Banking + PostgreSQL', os:'Ubuntu 22.04 · Django', ip:'10.20.30.60' },
    { id:'dev', x: 236, y: 480, w: 150, h: 56, plat:'lin', name:'EKO-DEV01', sub:'10.20.30.50',
      rol:'Desarrollos internos', os:'Debian 12', ip:'10.20.30.50' },
    { id:'esx', x: 406, y: 480, w: 200, h: 56, plat:'hyp', name:'EKO-ESX01 / 02', sub:'10.20.30.71-72',
      rol:'Hipervisores', os:'VMware ESXi', ip:'10.20.30.71-72' },

    { id:'dc2',   x:  40, y: 612, w: 176, h: 52, plat:'win', name:'EKO-DC02', sub:'10.40.30.10',
      rol:'Controlador de dominio secundario', os:'Windows Server 2019', ip:'10.40.30.10' },
    { id:'apidr', x: 236, y: 612, w: 196, h: 52, plat:'lin', name:'eko-api01-dr', sub:'10.40.30.60',
      rol:'Réplica del API', os:'Ubuntu 22.04', ip:'10.40.30.60' },

    { id:'s3',  x: 764, y: 170, w: 124, h: 52, plat:'aws', name:'S3',       sub:'buckets',
      rol:'Almacenamiento de objetos', os:'AWS gestionado', ip:'—', expuesto:true },
    { id:'lam', x: 906, y: 170, w: 116, h: 52, plat:'aws', name:'Lambda',   sub:'funciones',
      rol:'Cómputo sin servidor', os:'AWS gestionado', ip:'—' },
    { id:'ddb', x: 764, y: 246, w: 124, h: 52, plat:'aws', name:'DynamoDB', sub:'content DB',
      rol:'Base de datos del producto', os:'AWS gestionado', ip:'—' },
    { id:'ec2', x: 906, y: 246, w: 116, h: 52, plat:'aws', name:'EC2',      sub:'Win / Linux',
      rol:'Instancias de cómputo', os:'Windows / Linux', ip:'—', expuesto:true }
  ];

  /* ─── Enlaces · ruteo ortogonal ─────────────────────────────────────────
     Cada uno declara los puntos por los que pasa. Los carriles verticales
     están separados a propósito (x = 115, 344, 583, 700) para que ningún
     trazo comparta recorrido con otro.                                   */
  var ENLACES = [
    { pts:[[214,70],[190,70]],                               label:'',          arrow:true },
    { pts:[[115,96],[115,158]],                              label:'443/tcp',   lx:120, ly:130 },
    { pts:[[190,186],[254,186]],                             label:'VDI',       lx:196, ly:180 },
    { pts:[[434,186],[498,186]],                             label:'HTTPS',     lx:440, ly:180 },
    { pts:[[344,214],[344,282]],                             label:'sesiones',  lx:350, ly:250 },
    { pts:[[583,214],[583,344],[128,344],[128,480]],         label:'SQL',       lx:589, ly:300 },
    { pts:[[128,536],[128,612]],                             label:'réplica',   lx:134, ly:578, dash:true }
  ];

  /* ─── Construcción ──────────────────────────────────────────────────── */
  function esc(t) { return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function path(pts) {
    return 'M' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' L');
  }

  function build() {
    var p = [];
    p.push('<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" ' +
           'aria-label="Diagrama de red de EkoFinance con las zonas Internet, DMZ, VLAN Oficina, VLAN PROD, Konex y AWS">');
    p.push('<defs><marker id="ekoAr" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5" markerHeight="5" ' +
           'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#6b7280"/></marker>' +
           '<marker id="ekoArW" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5" markerHeight="5" ' +
           'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#f87171"/></marker></defs>');

    ZONAS.forEach(function (z) {
      p.push('<rect class="' + (z.alt ? 'eko-zone-alt' : 'eko-zone') + '" x="' + z.x + '" y="' + z.y +
             '" width="' + z.w + '" height="' + z.h + '" rx="8"/>');
      p.push('<text class="eko-zone-label" x="' + (z.x + 14) + '" y="' + (z.y + 19) + '">' + esc(z.label) + '</text>');
      if (z.cidr) p.push('<text class="eko-zone-cidr" x="' + (z.x + z.w - 14) + '" y="' + (z.y + 19) +
                         '" text-anchor="end">' + esc(z.cidr) + '</text>');
    });

    ENLACES.forEach(function (l) {
      var mk = l.warn ? 'ekoArW' : 'ekoAr';
      p.push('<path class="eko-link' + (l.dash ? ' is-weak' : '') + (l.warn ? ' is-warn' : '') +
             '" d="' + path(l.pts) + '" marker-end="url(#' + mk + ')"' +
             (l.both ? ' marker-start="url(#' + mk + ')"' : '') + '/>');
      if (l.label) p.push('<text class="eko-link-label' + (l.warn ? ' is-warn' : '') +
                          '" x="' + l.lx + '" y="' + l.ly + '">' + esc(l.label) + '</text>');
    });

    NODOS.forEach(function (n) {
      var pl = PLAT[n.plat] || PLAT.net;
      p.push('<g class="eko-g' + (n.expuesto ? ' is-exposed' : '') + '" data-eko-id="' + n.id +
             '" tabindex="0" role="button" aria-label="' + esc(n.name + ', ' + pl.label + ': ' + n.rol) + '">');
      p.push('<rect class="eko-node" x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="8"/>');
      /* barra de plataforma a la izquierda: color = tipo de activo */
      p.push('<path class="eko-plat-bar" d="M' + (n.x + 1) + ',' + (n.y + 8) + ' L' + (n.x + 1) + ',' + (n.y + n.h - 8) +
             '" stroke="' + pl.c + '" stroke-width="3" stroke-linecap="round"/>');
      /* ícono */
      p.push('<g transform="translate(' + (n.x + 12) + ',' + (n.y + (n.h - 22) / 2) + ')" fill="' + pl.c +
             '" stroke="' + pl.c + '" stroke-width="0">' + ICON[n.plat] + '</g>');
      var tx = n.x + 42;
      p.push('<text class="eko-node-name" x="' + tx + '" y="' + (n.y + (n.sub ? 25 : 33)) + '">' + esc(n.name) + '</text>');
      if (n.sub) p.push('<text class="eko-node-sub" x="' + tx + '" y="' + (n.y + 40) + '">' + esc(n.sub) + '</text>');
      if (n.expuesto) p.push('<circle class="eko-dot" cx="' + (n.x + n.w - 11) + '" cy="' + (n.y + 12) + '" r="3.6"/>');
      p.push('</g>');
    });

    p.push('</svg>');
    return p.join('');
  }

  var LEYENDA =
    '<div class="eko-legend no-print">' +
      '<span class="pl"><b style="background:#4ea3e0"></b>Windows</span>' +
      '<span class="pl"><b style="background:#f5b74e"></b>Linux</span>' +
      '<span class="pl"><b style="background:#ff9900"></b>AWS gestionado</span>' +
      '<span class="pl"><b style="background:#a78bfa"></b>Hipervisor</span>' +
      '<span class="pl"><b style="background:#9ca3af"></b>Equipo de red</span>' +
      '<span class="pl"><b style="background:#7dd3a0"></b>Usuarios</span>' +
      '<span><i class="dot"></i>alcanzable desde internet</span>' +
      '<span><i></i>enlace con control</span>' +
      '<span><i class="weak"></i>enlace de r&eacute;plica</span>' +
    '</div>' +
    '<p class="eko-hint no-print">Pasá el mouse por un activo &mdash; o navegá con Tab &mdash; para ver rol, sistema y dirección.</p>';

  /* ─── Montaje e interacción ─────────────────────────────────────────── */
  Array.prototype.forEach.call(document.querySelectorAll('[data-eko-network]'), function (host) {
    host.classList.add('eko-net');
    host.innerHTML = '<div class="eko-net-scroll">' + build() + '</div>' + LEYENDA +
                     '<div class="eko-tip" data-eko-tip></div>';

    var tip = host.querySelector('[data-eko-tip]');
    var byId = {};
    NODOS.forEach(function (n) { byId[n.id] = n; });

    function show(n, cx, cy) {
      var pl = PLAT[n.plat] || PLAT.net;
      tip.innerHTML = '<h6><span class="sw" style="background:' + pl.c + '"></span>' + esc(n.name) + '</h6><dl>' +
        '<dt>Tipo</dt><dd>' + esc(pl.label) + '</dd>' +
        '<dt>Rol</dt><dd>' + esc(n.rol) + '</dd>' +
        '<dt>Sistema</dt><dd>' + esc(n.os) + '</dd>' +
        '<dt>Dirección</dt><dd class="mono">' + esc(n.ip) + '</dd>' +
        (n.expuesto ? '<dt>Expuesto</dt><dd style="color:#F1912D">Sí, desde internet</dd>' : '') +
        '</dl>';
      tip.classList.add('is-on');
      var hb = host.getBoundingClientRect();
      tip.style.left = Math.max(4, Math.min(cx - hb.left + 16, hb.width - 280)) + 'px';
      tip.style.top = (cy - hb.top + 16) + 'px';
    }
    function hide() { tip.classList.remove('is-on'); }

    host.addEventListener('mousemove', function (ev) {
      var g = ev.target.closest ? ev.target.closest('[data-eko-id]') : null;
      var n = g && byId[g.getAttribute('data-eko-id')];
      if (n) show(n, ev.clientX, ev.clientY); else hide();
    });
    host.addEventListener('mouseleave', hide);
    host.addEventListener('focusin', function (ev) {
      var g = ev.target.closest ? ev.target.closest('[data-eko-id]') : null;
      var n = g && byId[g.getAttribute('data-eko-id')];
      if (!n) return;
      var r = g.getBoundingClientRect();
      show(n, r.left + r.width / 2, r.bottom - 8);
    });
    host.addEventListener('focusout', hide);
  });

  window.EkoNetwork = { zonas: ZONAS, nodos: NODOS, enlaces: ENLACES, plataformas: PLAT };
})();
