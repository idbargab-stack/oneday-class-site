(function () {
  var cfg = window.SITE_CONFIG || {};
  var open = cfg.bookingOpen === true;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced) document.documentElement.classList.add("motion");

  // ── 정해진 사실은 그대로, 비어 있으면 "준비 중" ──
  document.querySelectorAll("[data-fact]").forEach(function (el) {
    var value = (cfg[el.dataset.fact] || "").trim();
    el.textContent = value || el.dataset.empty || "준비 중";
  });

  // ── 예약 스위치 ──
  var form = document.querySelector("[data-booking-form]");
  var fieldset = document.querySelector("[data-booking-fieldset]");
  var submit = document.querySelector("[data-booking-submit]");
  var status = document.querySelector("[data-booking-status]");
  var bookingLinks = document.querySelectorAll("[data-booking-button], [data-booking-label]");

  if (open) {
    bookingLinks.forEach(function (b) {
      b.textContent = "예약 신청";
      b.removeAttribute("aria-disabled");
    });
    document.querySelector("[data-booking-short]").textContent = "받는 중";
    document.querySelector("[data-booking-title]").textContent = "예약 신청";
    document.querySelector("[data-booking-lead]").textContent =
      "이름과 연락처를 남겨 주시면 일정을 확인해 연락드릴게요.";
    fieldset.disabled = false;
    submit.textContent = "예약 신청 보내기";
  } else {
    document.querySelectorAll("[data-booking-button]").forEach(function (b) {
      b.classList.add("is-closed");
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!open) { status.textContent = "지금은 예약을 받지 않아요."; return; }
    if (!form.checkValidity()) {
      status.textContent = "이름, 연락처, 희망하는 때를 채우고 동의에 체크해 주세요.";
      return;
    }
    if (!cfg.bookingEndpoint) {
      status.textContent = "예약 저장이 아직 연결되지 않았어요. 잠시 후 다시 시도해 주세요.";
      return;
    }
    var data = Object.fromEntries(new FormData(form));
    data.consent = Boolean(data.consent);
    submit.disabled = true;
    status.textContent = "보내는 중이에요…";
    fetch(cfg.bookingEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.textContent = "예약 신청을 보냈어요. 확인 후 연락드릴게요.";
      })
      .catch(function () {
        status.textContent = "예약 신청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.";
      })
      .finally(function () { submit.disabled = false; });
  });

  // ── 글자를 한 자씩 나눈 워드마크 ──
  var marks = document.querySelectorAll(".wordmark");
  marks.forEach(function (m) {
    var text = m.textContent.trim();
    m.textContent = "";
    Array.from(text).forEach(function (ch) {
      var s = document.createElement("span");
      s.textContent = ch;
      m.appendChild(s);
    });
  });
  var heroMark = document.querySelector("[data-wordmark]");
  if (!reduced) requestAnimationFrame(function () { heroMark.classList.add("is-in"); });

  // ── 한 번만 나타나기 ──
  if (!reduced && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll("[data-reveal]").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("is-in"); });
  }

  // ── 글씨가 저절로 써지는 미리 보기 ──
  var writing = document.querySelector("[data-writing]");
  var strokes = Array.from(writing.querySelectorAll("path"));
  var DRAW_MS = 2000;
  var variants = {
    pen:   { width: 3.5, tool: "만년필" },
    fine:  { width: 7,   tool: "세필붓" },
    brush: { width: 15,  tool: "큰 붓" },
  };
  var outs = {
    tool: document.querySelector('[data-fact-out="tool"]'),
    width: document.querySelector('[data-fact-out="width"]'),
    time: document.querySelector('[data-fact-out="time"]'),
  };

  function draw() {
    var lengths = strokes.map(function (p) { return p.getTotalLength(); });
    var total = lengths.reduce(function (a, b) { return a + b; }, 0);
    var elapsed = 0;
    strokes.forEach(function (p, i) {
      var len = lengths[i];
      p.style.transition = "none";
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = reduced ? 0 : len;
    });
    if (reduced) return;
    writing.getBoundingClientRect(); // 시작 상태를 먼저 그리게 함
    strokes.forEach(function (p, i) {
      var dur = DRAW_MS * lengths[i] / total;
      p.style.transition = "stroke-dashoffset " + dur + "ms linear " + elapsed + "ms, stroke-width .5s ease";
      p.style.strokeDashoffset = 0;
      elapsed += dur;
    });
  }

  function setVariant(key) {
    var v = variants[key];
    strokes.forEach(function (p) { p.setAttribute("stroke-width", v.width); });
    outs.tool.textContent = v.tool;
    outs.width.textContent = String(v.width);
    outs.time.textContent = DRAW_MS / 1000 + "초";
  }

  document.querySelectorAll("[data-variant]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("[data-variant]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      setVariant(btn.dataset.variant);
      draw();
    });
  });
  setVariant("pen");
  strokes.forEach(function (p) {
    var len = p.getTotalLength();
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = reduced ? 0 : len;
  });
  if (!reduced && "IntersectionObserver" in window) {
    var drawIo = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { draw(); drawIo.disconnect(); }
    }, { threshold: 0.4 });
    drawIo.observe(writing);
  }

  // ── 스크롤 위치에 묶인 움직임: 만년필 이동 + 워드마크 벌어짐 (위로 올리면 되돌아감) ──
  if (reduced) return;

  var pen = document.querySelector("[data-traveller]");
  var hero = document.querySelector(".hero");
  var forSec = document.getElementById("for");
  var demo = document.getElementById("demo");
  var stops = [];

  function measure() {
    var vh = window.innerHeight;
    var y = function (el) { return el.getBoundingClientRect().top + window.scrollY; };
    var narrow = window.innerWidth < 760;
    // x, y는 화면 너비·높이에 대한 %
    stops = [
      narrow
        ? { at: 0,                              x: 38, y: 50, r: -18, s: 1,    o: 1 }
        : { at: 0,                              x: 52, y: 26, r: -24, s: 1,    o: 1 },
      { at: y(forSec) - vh * 0.45,              x: 6,  y: 64, r: 16,  s: 0.82, o: 1 },
      { at: y(demo) - vh * 0.35,                x: 24, y: 20, r: -8,  s: 0.72, o: 1 },
      { at: y(demo) + demo.offsetHeight * 0.25, x: 64, y: 30, r: -34, s: 0.62, o: 1 },
      { at: y(demo) + demo.offsetHeight * 0.7,  x: 72, y: 16, r: -50, s: 0.55, o: 0 },
    ];
  }

  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function update() {
    var sy = window.scrollY;
    var a = stops[0], b = stops[stops.length - 1], t = 1;
    if (sy <= stops[0].at) { b = a; t = 0; }
    else {
      for (var i = 0; i < stops.length - 1; i++) {
        if (sy >= stops[i].at && sy <= stops[i + 1].at) {
          a = stops[i]; b = stops[i + 1];
          t = ease((sy - a.at) / Math.max(1, b.at - a.at));
          break;
        }
      }
      if (sy > stops[stops.length - 1].at) { a = b; t = 0; }
    }
    var x = lerp(a.x, b.x, t), yy = lerp(a.y, b.y, t);
    var o = lerp(a.o, b.o, t);
    pen.style.transform =
      "translate(" + (x / 100 * window.innerWidth) + "px," + (yy / 100 * window.innerHeight) + "px)" +
      " rotate(" + lerp(a.r, b.r, t) + "deg) scale(" + lerp(a.s, b.s, t) + ")";
    pen.style.opacity = o;
    pen.style.visibility = o <= 0.01 ? "hidden" : "visible";

    // 첫 화면을 떠날수록 글자가 가운데에서 바깥으로 벌어지고 가라앉음
    var p = Math.min(1, Math.max(0, sy / hero.offsetHeight));
    var letters = heroMark.children, n = letters.length, mid = (n - 1) / 2;
    for (var k = 0; k < n; k++) {
      var off = (k - mid) / mid; // -1 ~ 1
      letters[k].style.transform =
        "translate(" + (off * p * 9) + "vw," + (p * 0.35) + "em)";
    }
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { update(); ticking = false; }); }
  }, { passive: true });
  window.addEventListener("resize", function () { measure(); update(); });
  window.addEventListener("load", function () { measure(); update(); });
  measure();
  update();
})();
