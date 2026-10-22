// Страница выбора идей (корпоратив Газпром ПХГ, профсоюз, 29.10.2026, 47 гостей). Данные: data/data-program.js (IDEAS, HOURS, EXITS, TIMING),
// data/titles.js (TITLES — варианты названия вечера), data/prizes.js (PRIZES — идеи призов; цены в данных есть, на странице не выводятся).
// Логика и имена перенесены из рабочей страницы site/gazprom: IDEAS, KEY, st, paint, summary, save, ENDPOINT, id send / sheet / push / copy / save.
// Отметки игр, закреплённое название и призы хранятся в браузере, у каждого свой ключ. Наружу уходит только то, что организатор отправил кнопкой «Отправить ведущему».
// Ключи адреса: ?demo=1 (примерные отметки для кадров, в память не пишутся) · ?reset=1 (очистить сохранённый выбор, название и призы).
(function () {
  "use strict";
  var KEY = "gazprom-evening-2026-10-29", TKEY = KEY + "-title", PKEY = KEY + "-prizes", PFKEY = KEY + "-prizes-fixed", CKEY = KEY + "-comments", CMAX = 400;
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbwNkv6WGTWhvZ4d1KlBdtSTpKG4gTEg9cc9Y7oAeLlBt57euDRGjrtFSZsq6Its90qmqA/exec";
  var qs = new URLSearchParams(location.search);
  var LAB = { y: "Хотим", m: "Можно", n: "Не наше" };
  // значок + слово + цвет: состояние понятно не только цветом
  var ICON = {
    y: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>',
    m: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.6 6.1c0-1.4 1-2.3 2.4-2.3s2.4.9 2.4 2.1c0 1.9-2.4 1.9-2.4 3.7"/><path d="M8 12.4v.1"/></svg>',
    n: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>'
  };
  // штамп «Рекомендует ведущий» и значки призов (без фото): фиксированная разметка, поля данных сюда не подставляются
  var STAR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>';
  var PZI = function (d) { return '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>"; };
  var PZICON = {
    cup: PZI('<path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 6H4.5v1.5a3 3 0 0 0 3 3M17 6h2.5v1.5a3 3 0 0 1-3 3"/><path d="M12 13v4M9.5 17h5M8 20h8"/>'),
    medal: PZI('<path d="M8 3l3 6M16 3l-3 6"/><circle cx="12" cy="15" r="5"/><path d="M12 12.6l.8 1.6 1.7.2-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.2z"/>'),
    basket: PZI('<path d="M4 10h16l-1.6 8.4a2 2 0 0 1-2 1.6H7.6a2 2 0 0 1-2-1.6z"/><path d="M8 10l3-6M16 10l-3-6M9 13.5v3.5M12 13.5v3.5M15 13.5v3.5"/>'),
    tea: PZI('<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3M4 21h14"/>'),
    game: PZI('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.1" fill="currentColor"/>'),
    paper: PZI('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 11h7M9 14h7M9 17h4"/>')
  };
  var SLUG = { "С экраном": "screen", "Команда на команду": "versus", "Музыкальные": "music", "С участием коллег": "people" };
  var TAB = { screen: "Экран", versus: "Команды", music: "Музыка", people: "Коллеги" }; // короткие имена вкладок только для узкой шапки; от 600 px показываем полные
  var HUE = { screen: 212, versus: 200, music: 192, people: 222 };
  // тайминг вечера (data/data-program.js): часы и число выходов (EXITS) идут в нижнюю строку «Вечер 4 часа ≈ 6 игр: выбрано N» и в «Итог»; минуты игр не показываем
  var HOURS = +window.HOURS || 4, HOURS_OK = window.HOURS_OK === true;
  var TM = window.TIMING || { game: 20, breakFirstHour: 15, breakLater: 20 };

  function $(i) { return document.getElementById(i); }
  function el(tag, attrs) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) { var v = attrs[k]; if (v == null || v === false) continue; if (k === "class") e.className = v; else if (k === "html") e.innerHTML = v; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? "" : v); }
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null || c === false) continue; if (Array.isArray(c)) c.forEach(function (x) { x != null && e.append(x.nodeType ? x : document.createTextNode(x)); }); else e.append(c.nodeType ? c : document.createTextNode(c)); }
    return e;
  }
  function dict(a) { var d = Object.create(null); a.forEach(function (k) { d[k] = 1; }); return d; }
  function plural(n, a, b, c5) { var m = n % 100, k = n % 10; return m > 10 && m < 15 ? c5 : k === 1 ? a : k > 1 && k < 5 ? b : c5; }
  function reduced() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }
  // длина вечера на n игр: игра ≈ 20 мин, после каждой перерыв (в первый час 15 мин, дальше 20)
  function eveningMin(n) { var t = 0; for (var k = 1; k <= n; k++) { t += TM.game; if (k < n) t += t < 60 ? TM.breakFirstHour : TM.breakLater; } return t; }
  function slotsFor(h) { var n = 0; while (n < 99 && eveningMin(n + 1) <= h * 60) n++; return n; }
  // сколько выходов помещается в вечер: число задано в данных (EXITS) или считается по TIMING
  var SLOTS = +window.EXITS > 0 ? +window.EXITS : slotsFor(HOURS);
  var CAPS = HOURS_OK && SLOTS > 0; // вместимость известна: считаем «под чертой»
  function chosenText(n) { return plural(n, "Выбрана", "Выбрано", "Выбрано") + " " + n + " " + plural(n, "игра", "игры", "игр"); }
  // «Вечер 4 часа ≈ 6 игр: выбрано N» (число выходов берём из параметра); за чертой — игры сверх числа выходов
  function capHead() { return "Вечер " + HOURS + " " + plural(HOURS, "час", "часа", "часов") + " ≈ " + SLOTS + " " + plural(SLOTS, "игра", "игры", "игр") + ": выбрано "; }
  function overText(n) { return "плюс " + (n - SLOTS) + " под чертой: обсудим до финального сценария"; }
  function capLine(n) { return CAPS ? capHead() + n + (n > SLOTS ? ". " + overText(n).charAt(0).toUpperCase() + overText(n).slice(1) : "") + "." : chosenText(n) + "."; }
  function lc(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  // примерный порядок: от спокойных к динамичным (поле pace), при равенстве — как в списке
  function byPace(a) { return a.map(function (i, n) { return [i, n]; }).sort(function (p, q) { return ((p[0].pace || 99) - (q[0].pace || 99)) || (p[1] - q[1]); }).map(function (p) { return p[0]; }); }

  // ——— память ———
  function load(k) { try { if (qs.has("reset")) localStorage.removeItem(k); return localStorage.getItem(k); } catch (e) { return null; } }
  function keep(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* без памяти работаем в рамках сессии */ } }
  function drop(k) { try { localStorage.removeItem(k); } catch (e) { /* без памяти работаем в рамках сессии */ } }
  var st = {}, VAL = dict(["y", "m", "n"]);
  try { var raw = load(KEY); if (raw) st = JSON.parse(raw); } catch (e) { st = {}; }
  if (!st || typeof st !== "object" || Array.isArray(st)) st = {};
  // оставляем только известные игры со значением y / m / n; убранные игры (23.10), следы наборов (_set), старые и повреждённые значения сбрасываем
  var known = dict(IDEAS.map(function (i) { return i.id; }));
  Object.keys(st).forEach(function (k) { if (!known[k] || !VAL[st[k]]) delete st[k]; });
  if (qs.has("demo") && !Object.keys(st).length) IDEAS.forEach(function (i, n) { var r = n % 5 === 3 ? "m" : n % 7 === 5 ? "n" : n % 3 === 0 || n % 3 === 1 ? "y" : ""; if (r) st[i.id] = r; });
  function save() { keep(KEY, JSON.stringify(st)); }
  function put(id, v) { if (VAL[v]) st[id] = v; else delete st[id]; }

  // комментарии заказчика к играм: свой ключ (CKEY), объект {id игры: текст ≤ 400}. Читаем только известные игры и строки; пустые и повреждённые значения отбрасываем.
  // Комментарий не зависит от отметки «Хотим / Можно / Не наше». Выводится только через textContent, переносы строк сохраняются.
  var cm = Object.create(null);
  try {
    var craw = JSON.parse(load(CKEY) || "{}");
    if (craw && typeof craw === "object" && !Array.isArray(craw)) Object.keys(craw).forEach(function (k) {
      var v = craw[k]; if (!known[k] || typeof v !== "string") return;
      v = v.replace(/\r\n?/g, "\n").slice(0, CMAX); if (v.trim()) cm[k] = v;
    });
  } catch (e) { cm = Object.create(null); }
  function saveCm() { if (Object.keys(cm).length) keep(CKEY, JSON.stringify(cm)); else drop(CKEY); }
  function setCm(id, v) { v = String(v).replace(/\r\n?/g, "\n").slice(0, CMAX); if (v.trim()) cm[id] = v; else delete cm[id]; saveCm(); }
  function cmText(id) { return cm[id] ? cm[id].trim().slice(0, CMAX) : ""; }
  function cmCount() { return Object.keys(cm).length; }
  // строки «Комментарий: …» для текста выбора: первая с подписью, остальные со сдвигом
  function cmLines(i, pad) { var t = cmText(i.id); return t ? t.split("\n").map(function (s, k) { return pad + (k ? "  " : "Комментарий: ") + s; }) : []; }
  // тот же комментарий строкой в шторке «Итог» (null, если комментария нет)
  function cmNode(i) { var t = cmText(i.id); return t ? el("span", { class: "ocm" }, "Комментарий: " + t) : null; }
  // подпись выбора: отметки и комментарии вместе; по ней шторка понимает, что после отправки что-то изменилось
  function sigNow() { return JSON.stringify([st, cm]); }

  // название вечера: свой ключ хранит только закреплённое название, принимаем его лишь если оно есть в списке TITLES;
  // иначе название предварительное, по умолчанию первое («Кубок столов»)
  var TITLES = (window.TITLES || []).filter(function (t) { return typeof t === "string" && t.trim(); });
  if (!TITLES.length) TITLES = ["Кубок столов"];
  var title = TITLES[0], tFixed = false, tSaved = load(TKEY);
  if (tSaved && TITLES.indexOf(tSaved) >= 0) { title = tSaved; tFixed = true; }
  var tIdx = TITLES.indexOf(title);
  function titleText() { return title + (tFixed ? "" : " (предварительное)"); }

  // призы: свой ключ, в памяти — список id; неизвестные id отбрасываем. Второй ключ (PFKEY) хранит «призы зафиксированы»; без выбранных призов фиксация не читается.
  // Цены в данных (поле price) нигде не выводятся.
  var PRIZES = (window.PRIZES || []).filter(function (p) { return p && p.id && p.title; });
  var pzKnown = dict(PRIZES.map(function (p) { return p.id; })), pz = Object.create(null);
  try { var praw = JSON.parse(load(PKEY) || "[]"); if (Array.isArray(praw)) praw.forEach(function (id) { if (typeof id === "string" && pzKnown[id]) pz[id] = 1; }); } catch (e) { /* повреждённую память призов не читаем */ }
  var pzFixed = load(PFKEY) === "1" && Object.keys(pz).length > 0;
  function savePz() { keep(PKEY, JSON.stringify(Object.keys(pz))); }
  function pzChosen() { return PRIZES.filter(function (p) { return pz[p.id]; }); }

  // ——— группы ———
  var groups = [];
  IDEAS.forEach(function (i) { var g = groups.filter(function (x) { return x.name === i.group; })[0]; if (!g) { g = { name: i.group, lead: i.glead, slug: SLUG[i.group] || ("g" + (groups.length + 1)), items: [] }; groups.push(g); } g.items.push(i); });
  var PICKS = IDEAS.filter(function (i) { return i.pick; });

  // ——— разметка: карточки по группам ———
  var main = $("main"), cardEl = {}, segEl = {}, stateEl = {}, groupEl = {}, tabEl = {}, scaleEl = {};
  var tabsBox = $("tabs"), thumb = tabsBox.querySelector(".thumb"), scaleBox = $("scale");

  function segFor(i) {
    var seg = el("div", { class: "seg", role: "group", "aria-label": "Ваш выбор: " + i.title }, el("i", { "aria-hidden": "true" }));
    ["y", "m", "n"].forEach(function (k) {
      var b = el("button", { type: "button", class: "k-" + k, "data-v": k, "aria-pressed": "false" }, el("span", { class: "ico", "aria-hidden": "true", html: ICON[k] }), LAB[k]);
      b.addEventListener("click", function () { mark(i, k); });
      seg.append(b);
    });
    return seg;
  }
  // комментарий к игре: пилюля раскрывает поле; текст сохраняется при вводе, кнопка меняется на «Комментарий добавлен ✓»
  function cmFor(i) {
    var id = "cm-" + i.id, open = false;
    var plus = el("span", { "aria-hidden": "true" }, "+"), word = el("span"), ok = el("span", { class: "ico", "aria-hidden": "true", html: ICON.y, hidden: true });
    var btn = el("button", { type: "button", class: "cmb", "aria-expanded": "false", "aria-controls": id + "-box" }, plus, word, ok, el("span", { class: "sr" }, " к игре «" + i.title + "»"));
    var prev = el("p", { class: "cmprev", hidden: true });
    var ta = el("textarea", { id: id, class: "cmt", rows: 3, maxlength: CMAX, autocomplete: "off", placeholder: "Например: у нас на этом столе в команде 6 человек", "aria-describedby": id + "-n" });
    var count = el("span", { class: "cmcount", id: id + "-n" });
    var box = el("div", { class: "cmbox", id: id + "-box", hidden: true },
      el("div", { class: "cmhead" }, el("label", { class: "cml", for: id }, "Ваш комментарий к игре", el("span", { class: "sr" }, " «" + i.title + "»")), count), ta);
    ta.value = cm[i.id] || "";
    function sync() {
      var has = !!cm[i.id];
      btn.dataset.has = has ? "1" : "";
      plus.hidden = has; ok.hidden = !has;
      word.textContent = has ? "Комментарий добавлен" : "Комментарий";
      btn.setAttribute("aria-expanded", String(open));
      box.hidden = !open;
      prev.hidden = open || !has; prev.textContent = has ? cm[i.id].trim() : "";
      count.textContent = ta.value.length + " / " + CMAX;
    }
    btn.addEventListener("click", function () { open = !open; sync(); if (open) ta.focus(); });
    ta.addEventListener("input", function () { setCm(i.id, ta.value); sync(); });
    sync();
    return el("div", { class: "cm" }, btn, prev, box);
  }
  function cardFor(i, g) {
    var seg = segFor(i), pill = el("span", { class: "state", "aria-hidden": "true" });
    var need = String(i.need || "").replace(/^С вас:\s*/, "");
    var how = el("div", { class: "how" }, el("h4", null, "Как это проходит"), el("p", { class: "more" }, i.more));
    // штамп — метка, не кнопка; без картинки встаёт над названием (класс no-pic)
    var stamp = i.pick ? el("p", { class: "pick" }, el("span", { class: "ico", "aria-hidden": "true", html: STAR }), el("span", { class: "pickt" }, el("span", null, "Рекомендует"), " ", el("span", null, "ведущий"))) : null;
    var c = el("article", { class: "item", id: "c-" + i.id, "data-id": i.id, "data-v": "" },
      pill,
      i.nopic ? null : el("figure", { class: "pic", "aria-hidden": "true" },
        el("img", { src: "assets/img/corp/" + i.id + ".webp", alt: "", loading: "lazy", decoding: "async", width: 1200, height: 800,
          onerror: function () { var f = this.parentNode, card = f.parentNode; f.remove(); if (card) card.classList.add("no-pic"); } })),
      stamp,
      el("div", { class: "ihead" },
        el("div", { class: "ititle" }, el("h3", null, i.title), i.suggest ? el("span", { class: "tag" }, "предложение") : null)),
      el("p", { class: "why" }, i.why),
      el("dl", { class: "facts" },
        el("div", null, el("dt", null, "Участвуют"), el("dd", null, i.who)),
        el("div", null, el("dt", null, "С вас"), el("dd", null, need))),
      how, seg, cmFor(i));
    cardEl[i.id] = c; segEl[i.id] = seg; stateEl[i.id] = pill;
    if (i.nopic) c.classList.add("no-pic");
    return c;
  }
  groups.forEach(function (g, gi) {
    var hue = HUE[g.slug] || 205;
    var tab = el("button", { class: "tab", type: "button", "aria-label": g.name, onclick: function () { go("s-" + g.slug); } }, el("span", { class: "tl-s", "aria-hidden": "true" }, TAB[g.slug] || g.name), el("span", { class: "tl-f", "aria-hidden": "true" }, g.name));
    tabEl[g.slug] = tab; tabsBox.append(tab);
    var sc = el("i", { style: "--w:" + g.items.length + ";--p:0" }); scaleEl[g.slug] = sc; scaleBox.append(sc);
    var cnt = el("p", { class: "stm", id: "stm-" + g.slug });
    groupEl[g.slug] = cnt;
    var sec = el("section", { class: "stage", id: "s-" + g.slug, "data-id": g.slug, style: "--h:" + hue, "aria-labelledby": "h-" + g.slug },
      el("div", { class: "stage-in" },
        el("header", { class: "stage-head" },
          el("p", { class: "when" }, "Глава " + (gi + 1) + " из " + groups.length + " · " + g.items.length + " " + plural(g.items.length, "игра", "игры", "игр")),
          el("h2", { id: "h-" + g.slug }, g.name),
          el("p", { class: "lead" }, g.lead), cnt),
        el("div", { class: "grid" }, g.items.map(function (i) { return cardFor(i, g); }))));
    main.append(sec);
  });
  var navIds = groups.map(function (g) { return g.slug; });

  // ——— призы: отдельный раздел внизу, вручаем столу без выхода на сцену; кнопка «Зафиксировать призы» закрепляет выбор ———
  var pzCard = {}, pzSt = null, pzStT = null, pzStI = null, pzFix = null, pzChg = null;
  function prizeFor(p) {
    var id = "pz-" + p.id;
    var box = el("input", { type: "checkbox", class: "pzc", id: id, "aria-labelledby": id + "-t", "aria-describedby": id + "-d" });
    box.addEventListener("change", function () {
      if (pzFixed) { box.checked = !!pz[p.id]; return; }
      if (box.checked) pz[p.id] = 1; else delete pz[p.id];
      savePz(); paintPz();
    });
    var icon = function () { return el("span", { class: "ico", "aria-hidden": "true", html: PZICON[p.icon] || PZICON.cup }); };
    // место под фото: если в данных есть img, показываем его с alt; не загрузилось или нет — значок
    var art = el("span", { class: "pzart" }, p.img ? el("img", { src: p.img, alt: p.alt || p.title, loading: "lazy", decoding: "async", width: 144, height: 144, onerror: function () { this.replaceWith(icon()); } }) : icon());
    var li = el("li", { class: "pz" }, el("label", { for: id }, box, art,
      el("span", { class: "pzt" },
        el("b", { id: id + "-t" }, p.title),
        el("span", { class: "pzd", id: id + "-d" }, p.desc))));
    pzCard[p.id] = li;
    return li;
  }
  if (PRIZES.length) {
    pzStI = el("span", { class: "ico", "aria-hidden": "true", html: ICON.y, hidden: true });
    pzStT = el("span");
    pzSt = el("p", { class: "pzst", role: "status", "aria-live": "polite" }, pzStI, pzStT);
    pzFix = el("button", { type: "button", class: "tfixb", id: "pzfix" }, "Зафиксировать призы");
    pzChg = el("button", { type: "button", class: "tchg", id: "pzchg", hidden: true }, "Изменить");
    pzFix.addEventListener("click", function () {
      if (pzFixed) return;
      if (!pzChosen().length) { notify("Отметьте хотя бы один приз, потом зафиксируйте"); return; }
      pzFixed = true; keep(PFKEY, "1"); paintPz(); pzChg.focus();
    });
    pzChg.addEventListener("click", function () {
      pzFixed = false; drop(PFKEY); paintPz(); pzFix.focus();
      say("Призы снова можно менять");
    });
    var tabP = el("button", { class: "tab", type: "button", "aria-label": "Призы", onclick: function () { go("s-prizes"); } }, "Призы");
    tabEl.prizes = tabP; tabsBox.append(tabP); navIds.push("prizes");
    main.append(el("section", { class: "stage prizes", id: "s-prizes", "data-id": "prizes", style: "--h:198", "aria-labelledby": "h-prizes" },
      el("div", { class: "stage-in" },
        el("header", { class: "stage-head" },
          el("p", { class: "when" }, "После игр · награждаем столы"),
          el("h2", { id: "h-prizes" }, "Чем наградить победителей"),
          el("p", { class: "lead" }, "Победителей награждает стол, не отдельный человек. Отметьте, что вам нравится.")),
        el("ul", { class: "pzgrid", "aria-label": "Идеи призов" }, PRIZES.map(prizeFor)),
        el("div", { class: "pzfoot" }, pzSt, pzFix, pzChg),
        el("p", { class: "pznote" }, "Выбранные призы попадут в «Итог» вместе с играми."))));
  }
  // ——— подготовка к вечеру: обратный отсчёт до срока выбора и лента «Что дальше» (data/prep.js) ———
  var DEADLINE = window.DEADLINE ? Date.parse(window.DEADLINE) : NaN, NEXT = (window.NEXT_STEPS || []).filter(function (s) { return typeof s === "string" && s.trim(); });
  // ?now=ISO-время подменяет «сейчас» только для проверки; без параметра (или с неверным) берётся настоящее время. В адресе «+» превращается в пробел, возвращаем его
  var clockOff = 0;
  try { var np = qs.get("now"), nt = np ? Date.parse(np.replace(/ (\d\d:\d\d)$/, "+$1")) : NaN; if (!isNaN(nt)) clockOff = nt - Date.now(); } catch (e) { clockOff = 0; }
  var cdBig = null, cdNote = null, cdTg = null, cdBox = null, cdTimer = 0;
  function paintCd() {
    try {
      var left = DEADLINE - (Date.now() + clockOff);
      if (!(left > 0)) {
        cdBig.className = "cdbig done"; cdBig.textContent = "Срок выбора прошёл, напишите нам";
        cdNote.hidden = true; cdTg.hidden = false; clearInterval(cdTimer); return;
      }
      var d = Math.floor(left / 864e5), h = Math.floor(left % 864e5 / 36e5), u = function (n, w) { return '<span class="cdu"><b class="num">' + n + "</b>" + w + "</span>"; };
      cdBig.className = "cdbig";
      cdBig.innerHTML = '<span class="cdl">осталось</span>' + (d || h ? (d ? u(d, " дн.") : "") + u(h, " ч") : '<span class="cdu">меньше часа</span>');
    } catch (e) { if (cdBox) cdBox.hidden = true; clearInterval(cdTimer); }
  }
  var prepBlocks = [];
  if (!isNaN(DEADLINE)) {
    cdBig = el("p", { class: "cdbig", role: "timer" });
    cdNote = el("p", { class: "cdnote" }, "Выбрать игры и призы можно до 26.10. Потом мы соберём порядок вечера.");
    cdTg = el("a", { class: "tglink", href: "https://t.me/komarez", hidden: true }, "Telegram @komarez");
    cdBox = el("div", { class: "cd" }, el("p", { class: "cdk" }, "До срока выбора"), cdBig, cdNote, cdTg);
    prepBlocks.push(cdBox);
  }
  if (NEXT.length) {
    prepBlocks.push(el("div", { class: "nxt-box" }, el("h3", { id: "nxt-t" }, "Что дальше"),
      el("ol", { class: "nxt", "aria-labelledby": "nxt-t" }, NEXT.map(function (s, k) { return el("li", null, el("span", { class: "n", "aria-hidden": "true" }, String(k + 1)), el("span", { class: "t" }, s)); }))));
  }
  if (prepBlocks.length) {
    main.append(el("section", { class: "stage prep", id: "s-prep", "data-id": "prep", style: "--h:205", "aria-labelledby": "h-prep" },
      el("div", { class: "stage-in" },
        el("header", { class: "stage-head" },
          el("p", { class: "when" }, "Дальше · до вечера"),
          el("h2", { id: "h-prep", tabindex: "-1" }, "Подготовка к вечеру"),
          el("p", { class: "lead" }, "Мы подстроимся под ваш выбор. Ответить можно в любой момент, а срок ниже нужен, чтобы всё успеть подготовить.")),
        el("div", { class: "prep-grid" }, prepBlocks))));
    if (cdBig) { paintCd(); cdTimer = setInterval(paintCd, 60000); document.addEventListener("visibilitychange", function () { if (!document.hidden && cdBox && !cdBox.hidden) paintCd(); }); }
  }
  var toPrep = $("toPrep");
  if (toPrep) toPrep.addEventListener("click", function (e) {
    var t = $("s-prep"); if (!t) return;
    e.preventDefault(); go("s-prep");
    var hd = $("h-prep"); if (hd) hd.focus({ preventScroll: true });
  });
  main.append(el("p", { class: "foot" }, "Ведущий: Григорий. Порядок игр примерный, точный согласуем с вами."));

  function go(id) { var t = $(id); if (t) t.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" }); }
  var cta = $("goFirst"); if (cta) cta.addEventListener("click", function (e) { e.preventDefault(); go("s-" + groups[0].slug); });

  // ——— название вечера: карусель со стрелками в первом экране, «Зафиксировать» закрепляет ———
  var ttlEl = $("ttl"), evTitle = $("evTitle"), tcar = $("tcar"), tprev = $("tprev"), tnext = $("tnext"), tmeta = $("tmeta"), tfix = $("tfix"), tchg = $("tchg");
  function showTitle(anim, dir) {
    var p = title.split(": "); // часть до двоеточия — короткое имя для шапки на телефоне
    ttlEl.textContent = p[0];
    if (p.length > 1) ttlEl.append(el("span", { class: "ttl-x" }, ": " + p.slice(1).join(": ")));
    evTitle.textContent = title; document.title = title + " · выбор игр 29.10";
    evTitle.style.setProperty("--dir", dir < 0 ? "-1" : "1");
    if (anim && !reduced()) { evTitle.classList.remove("swap"); void evTitle.offsetWidth; evTitle.classList.add("swap"); }
  }
  function paintTitle() {
    var one = TITLES.length < 2;
    tcar.classList.toggle("fixed", tFixed || one);
    [tprev, tnext].forEach(function (b) { b.hidden = tFixed || one; });
    tfix.hidden = tFixed; tchg.hidden = !tFixed;
    if (tFixed || one) tcar.removeAttribute("tabindex"); else tcar.setAttribute("tabindex", "0");
    tmeta.innerHTML = tFixed ? "Название закреплено" : '<b class="num">' + (tIdx + 1) + "</b> из <b class=\"num\">" + TITLES.length + "</b> · предварительное название";
    tmeta.hidden = one && !tFixed;
  }
  function stepTitle(d) {
    if (tFixed || TITLES.length < 2) return;
    tIdx = (tIdx + d + TITLES.length) % TITLES.length; title = TITLES[tIdx];
    showTitle(true, d); paintTitle(); say("Название: " + title + ", " + (tIdx + 1) + " из " + TITLES.length);
    if (sheetOn) fillSheet();
  }
  tprev.addEventListener("click", function () { stepTitle(-1); });
  tnext.addEventListener("click", function () { stepTitle(1); });
  tcar.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); stepTitle(-1); } else if (e.key === "ArrowRight") { e.preventDefault(); stepTitle(1); }
  });
  // свайп пальцем: влево — следующее, вправо — предыдущее; короткий сдвиг и вертикальную прокрутку не считаем
  var swipe = null;
  tcar.addEventListener("pointerdown", function (e) { swipe = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY }; });
  tcar.addEventListener("pointercancel", function () { swipe = null; });
  tcar.addEventListener("pointerup", function (e) {
    var s = swipe; swipe = null; if (!s) return;
    var dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) stepTitle(dx < 0 ? 1 : -1);
  });
  tfix.addEventListener("click", function () {
    tFixed = true; keep(TKEY, title); paintTitle(); tchg.focus();
    say("Название вечера закреплено: " + title);
    if (sheetOn) fillSheet();
  });
  tchg.addEventListener("click", function () {
    tFixed = false; drop(TKEY); paintTitle(); tnext.focus();
    say("Название снова можно менять");
    if (sheetOn) fillSheet();
  });
  showTitle(false); paintTitle();

  // ——— отметка ———
  function mark(i, k) {
    var prev = st[i.id] || "", now = prev === k ? "" : k;
    put(i.id, now); save(); paint(i.id);
    var b = segEl[i.id].querySelector('[data-v="' + k + '"]'); if (b && now && !reduced()) { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
    notify(now ? "«" + i.title + "» — " + LAB[now] : "Отметка снята: «" + i.title + "»", function () { put(i.id, prev); save(); paint(i.id); });
  }
  function syncSeg(seg, v) {
    var idx = { y: 0, m: 1, n: 2 }, th = seg.firstElementChild, had = seg.dataset.set === "1";
    if (v) seg.dataset.v = v; // при снятии отметки ползунок гаснет прежним цветом
    if (v) {
      if (!had) { th.style.transition = "none"; seg.style.setProperty("--i", idx[v]); void th.offsetWidth; th.style.transition = ""; } else seg.style.setProperty("--i", idx[v]);
      seg.dataset.set = "1";
    } else seg.dataset.set = "";
    [].forEach.call(seg.querySelectorAll("button"), function (b) { b.setAttribute("aria-pressed", String(b.dataset.v === v)); });
  }

  // ——— итог ———
  function totals() {
    var t = { y: 0, m: 0, n: 0, done: 0, none: 0 };
    IDEAS.forEach(function (i) { var v = st[i.id] || ""; if (v) { t.done++; t[v]++; } else t.none++; });
    return t;
  }
  function wanted() { return byPace(IDEAS.filter(function (i) { return st[i.id] === "y"; })); }
  var lastMark = "";
  if (!HOURS_OK) document.querySelector(".strip").hidden = true; // без подтверждённых часов шкалу вместимости не показываем
  function paint() {
    IDEAS.forEach(function (i) {
      var v = st[i.id] || "", c = cardEl[i.id];
      c.dataset.v = v; syncSeg(segEl[i.id], v);
      if (v) stateEl[i.id].innerHTML = '<span class="ico">' + ICON[v] + "</span>" + LAB[v]; // при снятии отметки метка плавно гаснет с прежним словом
    });
    // полоска и кольцо — по выходам: сколько «Хотим» из выходов, которые помещаются в вечер; при выборе сверх выходов полоска полная
    var t = totals(), fill = CAPS ? Math.min(1, t.y / SLOTS) : 0;
    var prog = $("prog");
    prog.textContent = t.y + " " + plural(t.y, "игра", "игры", "игр");
    prog.setAttribute("aria-label", chosenText(t.y));
    prog.style.setProperty("--p", fill.toFixed(3));
    if (lastMark !== "" && lastMark !== String(t.y) && !reduced()) { prog.classList.remove("tick"); void prog.offsetWidth; prog.classList.add("tick"); }
    lastMark = String(t.y);
    $("barfill").style.width = fill * 100 + "%";
    var num = function (n) { return '<b class="num">' + n + "</b>"; };
    var over = CAPS && t.y > SLOTS;
    $("sum").innerHTML = t.done
      ? "<span>" + (CAPS ? capHead() + num(t.y) : plural(t.y, "Выбрана", "Выбрано", "Выбрано") + " " + num(t.y) + " " + plural(t.y, "игра", "игры", "игр")) + "</span>"
        + "<small>" + (over ? overText(t.y) : "можно " + num(t.m) + " · не наше " + num(t.n)) + "</small>"
      : "<span>" + (CAPS ? capHead() + num(0) : "Пока ничего не отмечено") + "</span><small>Отметьте игры</small>";
    groups.forEach(function (g) {
      var d = 0; g.items.forEach(function (i) { if (st[i.id]) d++; });
      scaleEl[g.slug].style.setProperty("--p", (d / g.items.length).toFixed(3));
      groupEl[g.slug].textContent = d ? "Отмечено " + d + " из " + g.items.length : "";
    });
    if (sheetOn) fillSheet();
  }
  // призы: карточки с чекбоксами; после «Зафиксировать призы» чекбоксы заблокированы, внизу «Призы выбраны» и «Изменить»
  function paintPz() {
    if (!pzSt) return;
    var a = pzChosen();
    PRIZES.forEach(function (p) {
      var on = !!pz[p.id], li = pzCard[p.id], box = li.querySelector("input");
      li.classList.toggle("on", on); li.classList.toggle("locked", pzFixed);
      box.checked = on; box.disabled = pzFixed;
    });
    pzStT.textContent = pzFixed ? "Призы выбраны" : a.length ? "Отмечено: " + a.length + " " + plural(a.length, "приз", "приза", "призов") : "Пока ничего не отмечено";
    pzStI.hidden = !pzFixed; pzSt.classList.toggle("done", pzFixed);
    pzFix.hidden = pzFixed; pzChg.hidden = !pzFixed;
    pzFix.setAttribute("aria-disabled", String(!a.length));
    if (sheetOn) fillSheet();
  }

  // ——— текст выбора (он же уходит ведущему) ———
  function prizeLine() {
    var a = pzChosen();
    return a.length ? "Призы: " + a.map(function (p) { return lc(p.title); }).join(", ") + (pzFixed ? "." : " (предварительно).") : "Призы: пока не выбраны.";
  }
  function summary() {
    var L = ["Игры для вечера: Газпром ПХГ, профсоюз, 29.10.2026, 47 человек.", "Название вечера: " + titleText(), ""];
    var y = wanted(), m = [], n = [], none = [], cut = CAPS ? SLOTS : y.length;
    IDEAS.forEach(function (i) { var v = st[i.id] || ""; if (v !== "y") (v === "m" ? m : v === "n" ? n : none).push(i); });
    if (y.length) {
      L.push("ХОТИМ (" + y.length + "), примерный порядок вечера:"); y.slice(0, cut).forEach(function (i, k) { L.push((k + 1) + ". " + i.title); L.push.apply(L, cmLines(i, "   ")); }); L.push("");
      if (y.length > cut) { L.push("ПОД ЧЕРТОЙ, обсудим до финального сценария (" + (y.length - cut) + "):"); y.slice(cut).forEach(function (i) { L.push("• " + i.title); L.push.apply(L, cmLines(i, "  ")); }); L.push(""); }
    }
    function sec(t, a) { if (a.length) { L.push(t + " (" + a.length + "):"); a.forEach(function (i) { L.push("• " + i.title); L.push.apply(L, cmLines(i, "  ")); }); L.push(""); } }
    sec("МОЖНО", m); sec("НЕ НАШЕ", n); sec("НЕ ОТМЕЧЕНО", none);
    L.push(capLine(y.length));
    if (cmCount()) L.push("Комментариев: " + cmCount() + ".");
    if (PRIZES.length) L.push("", prizeLine());
    return L.join("\n");
  }

  // ——— уведомление об отметке с отменой ———
  var toast = $("toast"), tmsg = $("tmsg"), tundo = $("tundo"), undoFn = null, tTimer = 0;
  function say(text) { var live = $("glive"); live.textContent = ""; setTimeout(function () { live.textContent = text; }, 30); }
  function hideToast() { toast.classList.remove("on"); }
  function notify(text, undo) {
    say(text);
    tmsg.textContent = text; undoFn = undo || null; tundo.hidden = !undo; toast.classList.add("on");
    clearTimeout(tTimer); tTimer = setTimeout(hideToast, 4600);
  }
  tundo.addEventListener("click", function () { hideToast(); var f = undoFn; undoFn = null; if (f) { f(); $("glive").textContent = "Отметка возвращена"; } });

  // ——— шторка отправки ———
  var sheet = $("sheet"), scrim = $("scrim"), msg = $("msg"), sheetOn = false, opener = null, sendS = "idle", sentSig = "";
  var behind = [main, $("top"), $("dock"), $("toast"), $("toTop")];
  function setMsg(state, text) { msg.dataset.s = state; msg.textContent = text; }
  function setSend(state, text) {
    sendS = state; sheet.dataset.s = state; var b = $("push");
    b.setAttribute("aria-disabled", state === "busy" || state === "ok" ? "true" : "false");
    $("pushl").textContent = state === "busy" ? "Отправляю…" : state === "ok" ? "Отправлено ✓" : state === "err" ? "Повторить отправку" : "Отправить ведущему";
    setMsg(state === "idle" ? "" : state === "busy" ? "busy" : state, text || "");
  }
  function fillSheet() {
    var t = totals(), box = $("digest");
    box.innerHTML = "";
    [["y", "Хотим", t.y], ["m", "Можно", t.m], ["n", "Не наше", t.n]].forEach(function (r) {
      box.append(el("div", { class: "dg dg-" + r[0] }, el("span", { class: "dgl" }, el("span", { class: "ico", "aria-hidden": "true", html: ICON[r[0]] }), r[1]), el("b", { class: "num" }, String(r[2]))));
    });
    box.append(el("div", { class: "dg dg-t" }, el("span", { class: "dgl" }, "Не отмечено"), el("b", { class: "num" }, String(t.none))));
    box.append(el("div", { class: "dg dg-c" }, el("span", { class: "dgl" }, "Комментариев:"), el("b", { class: "num" }, String(cmCount()))));
    // название, призы и сколько выбрано из рекомендованных (штамп в текст выбора не попадает)
    var pa = pzChosen();
    $("xtitle").textContent = titleText();
    $("xprizerow").hidden = !PRIZES.length; $("topz").hidden = !PRIZES.length;
    $("xprize").textContent = pa.length ? pa.map(function (p) { return lc(p.title); }).join(", ") + (pzFixed ? "" : " (предварительно)") : "пока не выбраны";
    $("topz").textContent = pzFixed ? "Изменить призы" : pa.length ? "Закрепить призы" : "Выбрать призы";
    $("xpickrow").hidden = !PICKS.length;
    $("xpick").textContent = "выбрано " + PICKS.filter(function (i) { return st[i.id] === "y"; }).length + " из " + PICKS.length;
    var y = wanted(), ol = $("order"), bl = $("below"), cut = CAPS ? SLOTS : y.length;
    ol.innerHTML = ""; y.slice(0, cut).forEach(function (i) { ol.append(el("li", null, el("span", null, i.title, cmNode(i)))); });
    bl.innerHTML = ""; y.slice(cut).forEach(function (i) { bl.append(el("li", null, el("span", null, i.title, cmNode(i)))); });
    bl.hidden = $("belowh").hidden = y.length <= cut;
    $("orderbox").hidden = !y.length;
    $("ordhrs").textContent = capLine(y.length);
    $("pre").textContent = summary();
    $("emptyhint").hidden = t.done > 0;
  }
  function openSheet() {
    opener = document.activeElement; hideToast();
    if (sentSig && sentSig !== sigNow() && (sendS === "ok")) setSend("idle");
    if (sendS === "busy") { /* отправка уже идёт: показываем её состояние */ } else if (sendS === "err") { /* оставляем сообщение об ошибке */ } else if (sendS !== "ok") setSend("idle");
    sheetOn = true; fillSheet();
    sheet.setAttribute("aria-hidden", "false"); sheet.inert = false; scrim.classList.add("on"); sheet.classList.add("on");
    behind.forEach(function (n) { if (n) n.inert = true; });
    document.documentElement.classList.add("sheet-open");
    sheet.querySelector(".cr-sheet-body").scrollTop = 0;
    sheet.focus({ preventScroll: true });
  }
  function closeSheet() {
    if (!sheetOn) return; sheetOn = false;
    scrim.classList.remove("on"); sheet.classList.remove("on"); sheet.setAttribute("aria-hidden", "true"); sheet.inert = true;
    behind.forEach(function (n) { if (n) n.inert = false; });
    document.documentElement.classList.remove("sheet-open");
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }
  // удержание фокуса: пока шторка открыта, Tab и Shift+Tab ходят по кругу внутри неё; Escape закрывает, фокус возвращается на «Итог»
  function focusables() {
    return [].filter.call(sheet.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'), function (n) { return !n.disabled && n.getClientRects().length > 0; });
  }
  sheet.inert = true; sheet.setAttribute("aria-hidden", "true");
  $("send").onclick = openSheet;
  $("shx").onclick = closeSheet;
  scrim.addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (e) {
    if (!sheetOn) return;
    if (e.key === "Escape") { closeSheet(); return; }
    if (e.key !== "Tab") return;
    var f = focusables(), a = document.activeElement;
    if (!f.length) { e.preventDefault(); sheet.focus({ preventScroll: true }); return; }
    if (e.shiftKey && (a === f[0] || a === sheet || !sheet.contains(a))) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && (a === f[f.length - 1] || !sheet.contains(a))) { e.preventDefault(); f[0].focus(); }
  });
  document.addEventListener("focusin", function (e) { if (sheetOn && !sheet.contains(e.target)) { var f = focusables(); (f[0] || sheet).focus({ preventScroll: true }); } });
  // «Выбрать / Закрепить / Изменить призы» ведёт к блоку призов: фокус на первом чекбоксе, а при закреплённом выборе — на «Изменить»
  $("topz").onclick = function () {
    closeSheet(); go("s-prizes");
    var first = pzFixed ? $("pzchg") : document.querySelector("#s-prizes .pzc"); if (first) first.focus({ preventScroll: true });
  };

  $("copy").onclick = function () {
    var t = summary();
    var fallback = function () {
      try { var ta = el("textarea", { readonly: true }); ta.value = t; ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0"; document.body.append(ta); ta.select(); ta.setSelectionRange(0, t.length); var ok = document.execCommand("copy"); ta.remove(); if (ok) { setMsg("info", "Скопировано. Вставьте в Telegram ведущему @komarez."); return; } } catch (e) { /* ниже выделим текст на экране */ }
      var r = document.createRange(); r.selectNodeContents($("pre")); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      setMsg("info", "Не удалось скопировать автоматически: текст выделен, нажмите «Копировать» вручную.");
    };
    try { navigator.clipboard.writeText(t).then(function () { setMsg("info", "Скопировано. Вставьте в Telegram ведущему @komarez."); }, fallback); } catch (e) { fallback(); }
  };
  $("save").onclick = function () {
    var t = summary(), name = "Выбор-игр-Газпром-29-10.txt";
    (window.claude && claude.use ? claude.use("downloads") : Promise.resolve(null)).then(function (d) {
      if (d) return d.save({ filename: name, data: t }).then(function () { setMsg("info", "Файл сохранён."); });
      var f = new Blob(["﻿" + t], { type: "text/plain;charset=utf-8" }), url = URL.createObjectURL(f), a = el("a", { href: url, download: name });
      document.body.append(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      setMsg("info", "Файл «" + name + "» сохранён на устройство. Пришлите его в Telegram @komarez или приложите к письму.");
    }).catch(function () { setMsg("err", "Файл не сохранён. Нажмите «Скопировать для Telegram» и вставьте текст в сообщение."); });
  };
  if (ENDPOINT) { $("push").hidden = false; $("copy").classList.remove("main"); $("push").classList.add("main"); } else { $("push").hidden = true; }
  $("push").onclick = function () {
    if (sendS === "busy" || sendS === "ok") return;
    var y = wanted(), cut = CAPS ? SLOTS : y.length, m = [], n = [], none = []; IDEAS.forEach(function (i) { var v = st[i.id] || ""; (v === "m" ? m : v === "n" ? n : v === "y" ? [] : none).push(i); });
    // комментарий уходит в то же поле a отдельной строкой; игры без отметки идут в раздел «Не отмечено» только если к ним есть комментарий
    var cc = function (i, s) { var c = cmText(i.id); return c ? s + "\nКомментарий: " + c : s; };
    none = none.filter(function (i) { return cmText(i.id); });
    var doc = [], mk = function (t, a, ord) { if (a.length) doc.push({ section: t, items: a.map(function (i, k) { return { q: i.title, a: cc(i, ord ? (k < cut ? "№ " + (k + 1) + " в порядке вечера" : "под чертой: обсудим до финального сценария") : t) }; }) }); };
    doc.push({ section: "Название вечера", items: [{ q: title, a: tFixed ? "Название вечера" : "Название вечера (предварительное)" }] });
    mk("Хотим", y, true); mk("Можно", m); mk("Не наше", n); mk("Не отмечено", none);
    var pa = pzChosen(); if (pa.length) doc.push({ section: "Призы", items: pa.map(function (p) { return { q: p.title, a: pzFixed ? "Приз выбран" : "Приз выбран (предварительно)" }; }) });
    var payload = { app: "wedding-constructor", kind: "program", couple: "gazprom-phg-29-10", names: { b: "Газпром ПХГ, профсоюз, 29.10", g: "" }, answers: st, doc: doc, text: summary() };
    var sig = sigNow();
    setSend("busy", "Отправляю ведущему. Это занимает несколько секунд.");
    var ctl = "AbortController" in window ? new AbortController() : null, to = setTimeout(function () { ctl && ctl.abort(); }, 30000);
    fetch(ENDPOINT, { method: "POST", mode: "cors", redirect: "follow", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.ok) { sentSig = sig; setSend("ok", "Отправлено. Ведущий получил ваш выбор. Спасибо!"); } else { throw new Error("no"); } })
      .catch(function () { setSend("err", "Не получилось отправить. Нажмите «Скопировать для Telegram» и вставьте текст ведущему @komarez или сохраните файл."); })
      .then(function () { clearTimeout(to); });
  };

  // ——— вкладки: ползунок-линза, сворачивание шапки ———
  var curTab = groups[0].slug;
  function moveThumb(slug) {
    var t = tabEl[slug]; if (!t) return;
    thumb.style.width = t.offsetWidth + "px"; thumb.style.transform = "translateX(" + t.offsetLeft + "px)";
    if (tabEl[curTab]) tabEl[curTab].removeAttribute("aria-current"); curTab = slug; t.setAttribute("aria-current", "true");
    var box = tabsBox.getBoundingClientRect(), tb = t.getBoundingClientRect();
    if (tabsBox.scrollWidth > tabsBox.clientWidth + 2) tabsBox.scrollTo({ left: tabsBox.scrollLeft + (tb.left - box.left) - (box.width - tb.width) / 2, behavior: reduced() ? "auto" : "smooth" });
  }
  var redo = function () { thumb.style.transition = "none"; moveThumb(curTab); requestAnimationFrame(function () { thumb.style.transition = ""; }); };
  tabEl[curTab].setAttribute("aria-current", "true"); requestAnimationFrame(redo); addEventListener("resize", redo); if (document.fonts && document.fonts.ready) document.fonts.ready.then(redo);
  var topEl = $("top");
  function setPanel() { if (!document.body.classList.contains("compact")) document.documentElement.style.setProperty("--panel-b", Math.round(topEl.getBoundingClientRect().bottom) + "px"); }
  if (window.ResizeObserver) new ResizeObserver(setPanel).observe(topEl); addEventListener("resize", setPanel); if (document.fonts && document.fonts.ready) document.fonts.ready.then(setPanel); setPanel();
  var scrollTick = 0;
  function onScroll() {
    scrollTick = 0;
    document.body.classList.toggle("compact", scrollY > 180);
    var line = innerHeight * 0.4, cur = null;
    navIds.forEach(function (s) { var r = $("s-" + s).getBoundingClientRect(); if (r.top <= line && r.bottom > line) cur = s; });
    if (cur && cur !== curTab) moveThumb(cur);
    var up = $("toTop"); if (up) up.classList.toggle("on", scrollY > 1100);
  }
  addEventListener("scroll", function () { if (!scrollTick) scrollTick = requestAnimationFrame(onScroll); }, { passive: true });
  var up = $("toTop"); if (up) up.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" }); });

  // нижняя строка может занять несколько строк: высота панели нужна отступу страницы, кнопке «Наверх» и уведомлению
  var dockEl = $("dock");
  function setDock() { document.documentElement.style.setProperty("--dock-h", Math.round(dockEl.getBoundingClientRect().height) + "px"); }
  if (window.ResizeObserver) new ResizeObserver(setDock).observe(dockEl); addEventListener("resize", setDock);

  paint(); paintPz(); setDock(); onScroll();
})();
