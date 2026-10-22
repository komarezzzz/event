// Страница выбора идей (корпоратив Газпром ПХГ, профсоюз, 29.10.2026, 47 гостей). Данные: data/data-program.js (IDEAS, HOURS, TIMING) и data/more.js (SETS).
// Логика и имена перенесены из рабочей страницы site/gazprom: IDEAS, SETS, KEY, st, paint, summary, save, ENDPOINT, id send / sheet / push / copy / save.
// Отметки хранятся в браузере. Наружу уходит только то, что организатор отправил кнопкой «Отправить ведущему».
// Ключи адреса: ?demo=1 (примерные отметки для кадров, в память не пишутся) · ?reset=1 (очистить сохранённый выбор).
(function () {
  "use strict";
  var KEY = "gazprom-evening-2026-10-29";
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbwNkv6WGTWhvZ4d1KlBdtSTpKG4gTEg9cc9Y7oAeLlBt57euDRGjrtFSZsq6Its90qmqA/exec";
  var qs = new URLSearchParams(location.search);
  var SETS = window.SETS || [];
  var LAB = { y: "Хотим", m: "Можно", n: "Не наше" };
  // значок + слово + цвет: состояние понятно не только цветом
  var ICON = {
    y: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>',
    m: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.6 6.1c0-1.4 1-2.3 2.4-2.3s2.4.9 2.4 2.1c0 1.9-2.4 1.9-2.4 3.7"/><path d="M8 12.4v.1"/></svg>',
    n: '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>'
  };
  var SLUG = { "С экраном": "screen", "Команда на команду": "versus", "Музыкальные": "music", "С участием коллег": "people" };
  var TAB = { screen: "Экран", versus: "Команды", music: "Музыка", people: "Коллеги" };
  var HUE = { screen: 212, versus: 200, music: 192, people: 222 };
  // тайминг вечера (data/data-program.js): часы называем, только когда Григорий подтвердил HOURS
  var HOURS = +window.HOURS || 3, HOURS_OK = window.HOURS_OK === true;
  var TM = window.TIMING || { game: 20, breakFirstHour: 15, breakLater: 20 };

  function $(i) { return document.getElementById(i); }
  function el(tag, attrs) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) { var v = attrs[k]; if (v == null || v === false) continue; if (k === "class") e.className = v; else if (k === "html") e.innerHTML = v; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? "" : v); }
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null || c === false) continue; if (Array.isArray(c)) c.forEach(function (x) { x != null && e.append(x.nodeType ? x : document.createTextNode(x)); }); else e.append(c.nodeType ? c : document.createTextNode(c)); }
    return e;
  }
  function plural(n, a, b, c5) { var m = n % 100, k = n % 10; return m > 10 && m < 15 ? c5 : k === 1 ? a : k > 1 && k < 5 ? b : c5; }
  function reduced() { return matchMedia("(prefers-reduced-motion: reduce)").matches; }
  // длина вечера на n игр: игра ≈ 20 мин, после каждой перерыв (в первый час 15 мин, дальше 20)
  function eveningMin(n) { var t = 0; for (var k = 1; k <= n; k++) { t += TM.game; if (k < n) t += t < 60 ? TM.breakFirstHour : TM.breakLater; } return t; }
  function slotsFor(h) { var n = 0; while (n < 99 && eveningMin(n + 1) <= h * 60) n++; return n; }
  var SLOTS = slotsFor(HOURS);
  function hoursText(n) { var h = Math.max(.5, Math.round(eveningMin(n) / 30) / 2); return h === .5 ? "полчаса" : h % 1 ? String(h).replace(".", ",") + " часа" : h + " " + plural(h, "час", "часа", "часов"); }
  function chosenText(n) { return plural(n, "Выбрана", "Выбрано", "Выбрано") + " " + n + " " + plural(n, "игра", "игры", "игр"); }
  function enoughText(n) { return "примерно хватит на " + hoursText(n) + " вечера"; }
  // примерный порядок: от спокойных к динамичным (поле pace), при равенстве — как в списке
  function byPace(a) { return a.map(function (i, n) { return [i, n]; }).sort(function (p, q) { return ((p[0].pace || 99) - (q[0].pace || 99)) || (p[1] - q[1]); }).map(function (p) { return p[0]; }); }

  // ——— память ———
  var st = {};
  try { if (qs.has("reset")) localStorage.removeItem(KEY); var raw = localStorage.getItem(KEY); if (raw) st = JSON.parse(raw) || {}; } catch (e) { st = {}; }
  // отметки игр, которых больше нет в списке (убраны 23.10), не храним и не отправляем
  var known = {}; IDEAS.forEach(function (i) { known[i.id] = 1; });
  Object.keys(st).forEach(function (k) { if (k !== "_set" && !known[k]) delete st[k]; });
  if (qs.has("demo") && !Object.keys(st).length) IDEAS.forEach(function (i, n) { var r = n % 5 === 3 ? "m" : n % 7 === 5 ? "n" : n % 3 === 0 || n % 3 === 1 ? "y" : ""; if (r) st[i.id] = r; });
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* без памяти работаем в рамках сессии */ } }

  // ——— группы ———
  var groups = [];
  IDEAS.forEach(function (i) { var g = groups.filter(function (x) { return x.name === i.group; })[0]; if (!g) { g = { name: i.group, lead: i.glead, slug: SLUG[i.group] || ("g" + (groups.length + 1)), items: [] }; groups.push(g); } g.items.push(i); });

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
  function cardFor(i, g) {
    var seg = segFor(i), pill = el("span", { class: "state", "aria-hidden": "true" });
    var need = String(i.need || "").replace(/^С вас:\s*/, "");
    var how = el("div", { class: "how" }, el("h4", null, "Как это проходит"), el("p", { class: "more" }, i.more));
    var c = el("article", { class: "item", id: "c-" + i.id, "data-id": i.id, "data-v": "" },
      pill,
      el("figure", { class: "pic", "aria-hidden": "true" },
        el("img", { src: "assets/img/corp/" + i.id + ".webp", alt: "", loading: "lazy", decoding: "async", width: 1200, height: 800,
          onerror: function () { this.parentNode.remove(); } })),
      el("div", { class: "ihead" },
        el("div", { class: "ititle" }, el("h3", null, i.title), i.suggest ? el("span", { class: "tag" }, "предложение") : null)),
      el("p", { class: "why" }, i.why),
      el("dl", { class: "facts" },
        el("div", null, el("dt", null, "Участвуют"), el("dd", null, i.who)),
        el("div", null, el("dt", null, "С вас"), el("dd", null, need))),
      how, seg);
    cardEl[i.id] = c; segEl[i.id] = seg; stateEl[i.id] = pill;
    return c;
  }
  groups.forEach(function (g, gi) {
    var hue = HUE[g.slug] || 205;
    var tab = el("button", { class: "tab", type: "button", "aria-label": g.name, onclick: function () { go("s-" + g.slug); } }, TAB[g.slug] || g.name);
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
  main.append(el("p", { class: "foot" }, "Ведущий: Григорий. Порядок игр примерный, точный согласуем с вами."));

  function go(id) { var t = $(id); if (t) t.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" }); }
  var cta = $("goFirst"); if (cta) cta.addEventListener("click", function (e) { e.preventDefault(); go("s-" + groups[0].slug); });

  // ——— наборы ———
  var setsEl = $("sets");
  SETS.forEach(function (S) {
    var b = el("button", { type: "button", class: "set", "data-id": S.id, "aria-pressed": "false" }, el("b", null, S.name), el("span", null, S.desc), el("span", { class: "ok", "aria-hidden": "true", html: ICON.y }));
    b.addEventListener("click", function () {
      var before = JSON.stringify(st), ids = S.ids === "all" ? IDEAS.map(function (x) { return x.id; }) : S.ids;
      IDEAS.forEach(function (i) { st[i.id] = ids.indexOf(i.id) >= 0 ? "y" : "n"; });
      st._set = S.id; save(); paint();
      notify("Набор «" + S.name + "»: " + ids.length + " " + plural(ids.length, "игра", "игры", "игр") + " отмечено «Хотим»", function () { st = JSON.parse(before); save(); paint(); });
    });
    setsEl.append(b);
  });

  // ——— отметка ———
  function mark(i, k) {
    var prev = st[i.id] || "", now = prev === k ? "" : k;
    st[i.id] = now; delete st._set; save(); paint(i.id);
    var b = segEl[i.id].querySelector('[data-v="' + k + '"]'); if (b && now && !reduced()) { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
    notify(now ? "«" + i.title + "» — " + LAB[now] : "Отметка снята: «" + i.title + "»", function () { st[i.id] = prev; delete st._set; save(); paint(i.id); });
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
  function paint() {
    IDEAS.forEach(function (i) {
      var v = st[i.id] || "", c = cardEl[i.id];
      c.dataset.v = v; syncSeg(segEl[i.id], v);
      if (v) stateEl[i.id].innerHTML = '<span class="ico">' + ICON[v] + "</span>" + LAB[v]; // при снятии отметки метка плавно гаснет с прежним словом
    });
    [].forEach.call(setsEl.children, function (b) { b.setAttribute("aria-pressed", st._set === b.dataset.id ? "true" : "false"); });
    // полоска и кольцо — по выходам: сколько «Хотим» из игр, которые помещаются в вечер
    var t = totals(), fill = SLOTS ? Math.min(1, t.y / SLOTS) : 0;
    var prog = $("prog");
    prog.textContent = HOURS_OK ? t.y + " из " + SLOTS : t.y + " " + plural(t.y, "игра", "игры", "игр");
    prog.setAttribute("aria-label", chosenText(t.y) + (HOURS_OK ? " из " + SLOTS + ", которые поместятся в вечер" : ""));
    prog.style.setProperty("--p", fill.toFixed(3));
    if (lastMark !== "" && lastMark !== String(t.y) && !reduced()) { prog.classList.remove("tick"); void prog.offsetWidth; prog.classList.add("tick"); }
    lastMark = String(t.y);
    $("barfill").style.width = fill * 100 + "%";
    var num = function (n) { return '<b class="num">' + n + "</b>"; };
    $("sum").innerHTML = t.done
      ? "<span>" + plural(t.y, "Выбрана", "Выбрано", "Выбрано") + " " + num(t.y) + " " + plural(t.y, "игра", "игры", "игр") + "</span><small>"
        + (HOURS_OK && t.y ? enoughText(t.y) : "можно " + num(t.m) + " · не наше " + num(t.n)) + "</small>"
      : "<span>Пока ничего не отмечено</span><small>Выберите набор или игры</small>";
    groups.forEach(function (g) {
      var d = 0; g.items.forEach(function (i) { if (st[i.id]) d++; });
      scaleEl[g.slug].style.setProperty("--p", (d / g.items.length).toFixed(3));
      groupEl[g.slug].textContent = d ? "Отмечено " + d + " из " + g.items.length : "";
    });
    if (sheetOn) fillSheet();
  }

  // ——— текст выбора (он же уходит ведущему) ———
  function summary() {
    var L = ["Игры для вечера: Газпром ПХГ, профсоюз, 29.10.2026, 47 человек.", ""];
    var y = wanted(), m = [], n = [], none = [];
    IDEAS.forEach(function (i) { var v = st[i.id] || ""; if (v !== "y") (v === "m" ? m : v === "n" ? n : none).push(i); });
    if (y.length) { L.push("ХОТИМ (" + y.length + "), примерный порядок вечера:"); y.forEach(function (i, k) { L.push((k + 1) + ". " + i.title); }); L.push(""); }
    function sec(t, a) { if (a.length) { L.push(t + " (" + a.length + "):"); a.forEach(function (i) { L.push("• " + i.title); }); L.push(""); } }
    sec("МОЖНО", m); sec("НЕ НАШЕ", n); sec("НЕ ОТМЕЧЕНО", none);
    L.push(chosenText(y.length) + (HOURS_OK && y.length ? ", " + enoughText(y.length) : "") + ".");
    return L.join("\n");
  }

  // ——— уведомление об отметке с отменой ———
  var toast = $("toast"), tmsg = $("tmsg"), tundo = $("tundo"), undoFn = null, tTimer = 0;
  function hideToast() { toast.classList.remove("on"); }
  function notify(text, undo) {
    var live = $("glive"); live.textContent = ""; setTimeout(function () { live.textContent = text; }, 30);
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
    var y = wanted(), ol = $("order");
    ol.innerHTML = ""; y.forEach(function (i) { ol.append(el("li", null, i.title)); });
    $("orderbox").hidden = !y.length;
    $("ordhrs").textContent = chosenText(y.length) + (HOURS_OK && y.length ? ", " + enoughText(y.length) : "") + ".";
    $("pre").textContent = summary();
    $("emptyhint").hidden = t.done > 0;
  }
  function openSheet() {
    opener = document.activeElement; hideToast();
    if (sentSig && sentSig !== JSON.stringify(st) && (sendS === "ok")) setSend("idle");
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
  sheet.inert = true; sheet.setAttribute("aria-hidden", "true");
  $("send").onclick = openSheet;
  $("shx").onclick = closeSheet;
  scrim.addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && sheetOn) closeSheet(); });

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
    var doc = [], mk = function (t, a, ord) { if (a.length) doc.push({ section: t, items: a.map(function (i, k) { return { q: i.title, a: ord ? "№ " + (k + 1) + " в порядке вечера" : t }; }) }); };
    var y = wanted(), m = [], n = []; IDEAS.forEach(function (i) { var v = st[i.id] || ""; (v === "m" ? m : v === "n" ? n : []).push(i); });
    mk("Хотим", y, true); mk("Можно", m); mk("Не наше", n);
    var payload = { app: "wedding-constructor", kind: "program", couple: "gazprom-phg-29-10", names: { b: "Газпром ПХГ, профсоюз, 29.10", g: "" }, answers: st, doc: doc, text: summary() };
    var sig = JSON.stringify(st);
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
    groups.forEach(function (g) { var r = $("s-" + g.slug).getBoundingClientRect(); if (r.top <= line && r.bottom > line) cur = g.slug; });
    if (cur && cur !== curTab) moveThumb(cur);
    var up = $("toTop"); if (up) up.classList.toggle("on", scrollY > 1100);
  }
  addEventListener("scroll", function () { if (!scrollTick) scrollTick = requestAnimationFrame(onScroll); }, { passive: true });
  var up = $("toTop"); if (up) up.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" }); });

  paint(); onScroll();
})();
