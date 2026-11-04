// أيقونات SVG خطية
(function () {
  const p = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c3 .2 5.5 2.3 5.5 5.8"/>',
    userPlus: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M19 8v6M16 11h6"/>',
    file: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
    quote: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><circle cx="15.5" cy="16.5" r="2.5"/><path d="M9 11h5"/>',
    design: '<rect x="3" y="4" width="15" height="11" rx="1"/><path d="M8 19h6M11 15v4"/><path d="m14 11 6.5-6.5 1.5 1.5L15.5 12.5 13.5 13z"/>',
    contract: '<path d="M14 3H6v18h12V9"/><path d="M9 12h5M9 16h3"/><path d="m15 13 6-6-2-2-6 6-.5 2.5z"/>',
    ruler: '<path d="m3 17 14-14 4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M12 8v8M14 9.5c0-.8-.9-1.5-2-1.5s-2 .7-2 1.5.9 1.3 2 1.5 2 .7 2 1.5-.9 1.5-2 1.5-2-.7-2-1.5"/>',
    orders: '<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><path d="M9 11h6M9 14h6M9 17h4"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    log: '<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    logout: '<path d="M15 4h4v16h-4"/><path d="M10 8 6 12l4 4M6 12h10"/>',
    coins: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v4c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 10v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/><path d="M5 14v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/>',
    cart: '<path d="M3 4h2l2.5 11h11L21 7H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="1"/><path d="M7 14h10v7H7z"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    factory: '<path d="M3 21V10l6 4V10l6 4V4h6v17z"/><path d="M7 17h2M12 17h2M17 17h2"/>',
    chevron: '<path d="m15 6-6 6 6 6"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    store: '<path d="M3 9 5 4h14l2 5"/><path d="M3 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3"/><path d="M5 12v9h14v-9"/><path d="M10 21v-5h4v5"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
    // ---- أيقونات المرحلة الثانية (إضافة فقط) ----
    box: '<path d="m12 3 9 4.5v9L12 21l-9-4.5v-9z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>',
    truck: '<path d="M2 6h12v10H2z"/><path d="M14 9h4l4 4v3h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    wrench: '<path d="M14.5 5.5a4 4 0 0 0 5 5L12 18l-3 3-3-3 3-3 7.5-7.5a4 4 0 0 0-2-2z"/>',
    camera: '<path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="13.5" r="3.5"/>',
    qc: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
    play: '<path d="M7 4v16l13-8z"/>',
    pause: '<path d="M7 4h3v16H7zM14 4h3v16h-3z"/>',
    arrowLeft: '<path d="M20 12H5M11 6l-6 6 6 6"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/>',
    supplier: '<path d="M3 21V9l6 3V9l6 3V5h6v16z"/><path d="M7 17h2M12 17h2M17 17h2"/>',
    stack: '<rect x="4" y="4" width="16" height="5" rx="1"/><rect x="4" y="10" width="16" height="5" rx="1"/><rect x="4" y="16" width="16" height="4" rx="1"/>',
    handshake: '<path d="m2 12 4-4 4 2 4-3 4 3 4 2"/><path d="m6 8 6 7a2 2 0 0 0 3 0l5-5"/><path d="m9 13 2 2M7 15l2 2"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>',
    cloud: '<path d="M7 18a5 5 0 0 1-.6-9.96A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 16v4h16v-4"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1"/><rect x="17" y="14" width="4" height="6" rx="1"/><path d="M19 20a3 3 0 0 1-3 2h-3"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.9-3.5M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.9 3.5M20 20v-4h-4"/>',
    save: '<path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
    send: '<path d="m21 3-9 18-2-8-8-2z"/><path d="m21 3-11 10"/>',
    sheet: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
  };
  window.icon = function (name, size) {
    const s = size || 20;
    return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (p[name] || p.file) + '</svg>';
  };
  window.logoSVG = function (w) {
    return '<svg class="logo" width="' + (w || 140) + '" viewBox="0 0 300 98" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="98" fill="#7e1416"/>' +
      '<g fill="#fff"><path d="M22 82 72 18h18L48 72h-4l10-12h10L54 72z" opacity="0"/>' +
      '<path d="M22 84 78 16h20L42 84z"/><path d="M60 54h22l-8 10H52z"/>' +
      '<path d="M82 84 128 28h4l18 22-8 9-12-15-36 40z"/>' +
      '<path d="M120 84 176 16h4l78 68h-26l-54-48-38 48z"/>' +
      '<rect x="168" y="50" width="30" height="30"/></g>' +
      '<g stroke="#7e1416" stroke-width="3"><path d="M183 50v30M168 65h30"/></g></svg>';
  };
})();
