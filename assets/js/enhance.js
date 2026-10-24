/* =========================================================
   ENHANCE.JS  -  load AFTER Swiper, Bootstrap and animated.js
   ========================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------
     CONFIG  (edit here)
     --------------------------------------------------------- */
  var REVIEWS_API =
    "https://script.google.com/macros/s/AKfycbw_0hEBageFg3McajGZLs83V5OPilJbrdZOt7iV9zYYO7v8C6_SmoKrLHEhZ_-vBQ8KBA/exec";

  // Optional: paste the Web App URL of visitor-log-apps-script.gs here.
  // With it, EVERY visit is saved to your Google Sheet and the panel shows recent visitors.
  // Leave empty to use the free public counter only (total + today).
  var VISITOR_LOG_URL = "https://script.google.com/macros/s/AKfycbzjxbr15881_E4V4isvaL3xQ3LGI-kQNgYO_d0qJEUvaji4aD4pS3fdD9hQCWz7nlFxjg/exec";

  var COUNTER_NS = "sakshi-pandey-portfolio";

  /* ---------------------------------------------------------
     helpers
     --------------------------------------------------------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var store = {
    get: function (k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
    set: function (k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (e) {} }
  };
  function initialAvatar(name) {
    var ch = esc((String(name || "?").trim()[0] || "?").toUpperCase());
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#078199'/><stop offset='1' stop-color='#0dbfe2'/></linearGradient></defs><rect width='120' height='120' fill='url(#g)'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-family='Segoe UI,Arial' font-size='56' font-weight='700' fill='#fff'>" + ch + "</text></svg>";
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  }
  function stars(n, extraClass) {
    n = Math.max(0, Math.min(5, Math.round(Number(n) || 0)));
    var out = "";
    for (var i = 0; i < 5; i++) out += '<span class="' + (i < n ? "on" : "") + '" style="--i:' + i + '">★</span>';
    return '<div class="' + (extraClass || "rv-stars") + '" role="img" aria-label="Rated ' + n + ' out of 5">' + out + "</div>";
  }
  function fmt(n) {
    if (n == null) return "–";
    if (n >= 10000) return (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "") + "k";
    return String(n);
  }
  function countTo(el, to, ms) {
    if (!el) return;
    if (to == null) { el.textContent = "–"; return; }
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = to; return; }
    var t0 = performance.now(); ms = ms || 1100;
    (function tick(t) {
      var p = Math.min((t - t0) / ms, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function timeoutFetch(url, opt, ms) {
    var c = new AbortController(), id = setTimeout(function () { c.abort(); }, ms || 7000);
    opt = opt || {}; opt.signal = c.signal;
    return fetch(url, opt).finally(function () { clearTimeout(id); });
  }

  /* ---------------------------------------------------------
     1. PROJECT FILTER
     --------------------------------------------------------- */
  function initProjects() {
    var btns = $$(".pc-filter button"), cards = $$(".flip-project-card");
    if (!btns.length) return;
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.classList.remove("active"); x.setAttribute("aria-pressed", "false"); });
        b.classList.add("active"); b.setAttribute("aria-pressed", "true");
        var f = b.dataset.filter, n = 0;
        cards.forEach(function (c) {
          var show = f === "all" || c.dataset.cat === f;
          c.classList.toggle("is-hidden", !show);
          c.classList.remove("rv", "in", "pc-anim");
          if (show) { void c.offsetWidth; c.style.animationDelay = (n++ * 90) + "ms"; c.classList.add("pc-anim"); }
        });
      });
    });
  }

  /* ---------------------------------------------------------
     2. TESTIMONIALS + MODAL
     --------------------------------------------------------- */
  function initReviews() {
    var wrap = $("#reviews-wrapper");
    if (!wrap) return;
    var skel = $("#rvSkeleton"), swiperEl = $(".mySwiper");

    function fail(msg, icon) {
      if (skel) skel.remove();
      swiperEl.outerHTML = '<div class="rv-empty"><i class="fas ' + (icon || "fa-comment-dots") + '"></i>' + msg + "</div>";
    }

    timeoutFetch(REVIEWS_API, {}, 12000)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!Array.isArray(data) || !data.length) {
          return fail('No reviews yet. <a href="add-review.html" target="_blank">Be the first to write one</a>.');
        }
        var seen = {}, list = [];
        data.forEach(function (r) {
          var k = r.name + "::" + r.message;
          if (seen[k]) return; seen[k] = 1; list.push(r);
        });

        // summary
        var sum = 0; list.forEach(function (r) { sum += Math.max(0, Math.min(5, Number(r.rating) || 0)); });
        var avg = sum / list.length;
        var avgBox = $("#rvAvgBox");
        if (avgBox) {
          $("#rvAvg").textContent = avg.toFixed(1);
          $("#rvAvgStars").innerHTML = stars(avg);
          $("#rvCount").textContent = "from " + list.length + (list.length === 1 ? " review" : " reviews");
          avgBox.hidden = false;
        }

        list.forEach(function (r) {
          var photo = r.photo || "";
          var slide = document.createElement("div");
          slide.className = "swiper-slide";
          slide.innerHTML =
            '<article class="rv-card">' +
              '<i class="fas fa-quote-right rv-quote" aria-hidden="true"></i>' +
              stars(r.rating) +
              '<p class="rv-text">“' + esc(r.message) + '”</p>' +
              '<button type="button" class="rv-more" data-bs-toggle="modal" data-bs-target="#reviewModal" ' +
                'data-name="' + esc(r.name) + '" data-role="' + esc(r.role) + '" data-photo="' + esc(photo) + '" ' +
                'data-message="' + esc(r.message) + '" data-rating="' + (Number(r.rating) || 0) + '">' +
                'Read full review <i class="fas fa-arrow-right"></i></button>' +
              '<div class="rv-author"><div class="rv-avatar"><img src="' + esc(photo || initialAvatar(r.name)) + '" alt="' + esc(r.name) + '" loading="lazy"></div>' +
              '<div><h5>' + esc(r.name) + '</h5><small>' + esc(r.role) + "</small></div></div>" +
            "</article>";
          $("img", slide).addEventListener("error", function () { this.onerror = null; this.src = initialAvatar(r.name); });
          wrap.appendChild(slide);
        });

        if (skel) skel.remove();
        swiperEl.hidden = false;

        var cards = $$(".rv-card", wrap);
        cards.forEach(function (c) { c.style.opacity = "0"; });

        new Swiper(".mySwiper", {
          loop: list.length > 3,
          watchOverflow: true,
          grabCursor: true,
          speed: 700,
          spaceBetween: 28,
          slidesPerView: 1,
          autoplay: { delay: 5000, pauseOnMouseEnter: true, disableOnInteraction: false },
          pagination: { el: ".mySwiper .swiper-pagination", clickable: true },
          navigation: { nextEl: ".mySwiper .swiper-button-next", prevEl: ".mySwiper .swiper-button-prev" },
          breakpoints: { 768: { slidesPerView: 2 }, 1100: { slidesPerView: 3 } }
        });

        // cards pop in once the section scrolls into view
        var io = new IntersectionObserver(function (es) {
          if (!es[0].isIntersecting) return;
          io.disconnect();
          $$(".rv-card", wrap).forEach(function (c, i) {
            c.style.opacity = ""; c.style.setProperty("--i", i % 3);
            c.classList.add("rv-pop");
          });
        }, { threshold: 0.15 });
        io.observe(swiperEl);
      })
      .catch(function (err) {
        console.error("Failed loading reviews:", err);
        fail("Reviews could not be loaded right now. Please refresh in a moment.", "fa-wifi");
      });

    // modal
    var modal = $("#reviewModal");
    if (modal) {
      modal.addEventListener("show.bs.modal", function (ev) {
        var b = ev.relatedTarget; if (!b) return;
        var name = b.getAttribute("data-name"), img = $("#reviewerPhoto");
        img.onerror = function () { this.onerror = null; this.src = initialAvatar(name); };
        img.src = b.getAttribute("data-photo") || initialAvatar(name);
        img.alt = name;
        $("#reviewerName").textContent = name;
        $("#reviewerRole").textContent = b.getAttribute("data-role");
        $("#reviewerStars").innerHTML = stars(parseInt(b.getAttribute("data-rating"), 10) || 0, "rv-modal-stars");
        $("#reviewerMessage").textContent = b.getAttribute("data-message");
        var msg = $(".rv-modal-msg"); if (msg) msg.scrollTop = 0;
      });
    }
  }

  /* ---------------------------------------------------------
     3. VISITOR INSIGHTS
     --------------------------------------------------------- */
  function parseUA() {
    var ua = navigator.userAgent, b = "Browser", os = "Unknown OS", dev = "Desktop";
    if (/Instagram/.test(ua)) b = "Instagram app";
    else if (/LinkedInApp/.test(ua)) b = "LinkedIn app";
    else if (/FBAN|FBAV/.test(ua)) b = "Facebook app";
    else if (/Edg\//.test(ua)) b = "Edge"; else if (/OPR\/|Opera/.test(ua)) b = "Opera";
    else if (/SamsungBrowser/.test(ua)) b = "Samsung Internet";
    else if (/Firefox\//.test(ua)) b = "Firefox";
    else if (/Chrome\/|CriOS/.test(ua)) b = "Chrome";
    else if (/Safari\//.test(ua)) b = "Safari";
    if (/Windows/.test(ua)) os = "Windows"; else if (/Android/.test(ua)) os = "Android";
    else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS"; else if (/Mac OS X|Macintosh/.test(ua)) os = "macOS";
    else if (/CrOS/.test(ua)) os = "ChromeOS"; else if (/Linux/.test(ua)) os = "Linux";
    if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) dev = "Tablet";
    else if (/Mobi|iPhone|Android/.test(ua)) dev = "Mobile";
    return { browser: b, os: os, device: dev };
  }
  function detectSource() {
    var ua = navigator.userAgent, q = new URLSearchParams(location.search);
    var tag = (q.get("src") || q.get("utm_source") || "").toLowerCase();
    var names = { instagram: "Instagram", ig: "Instagram", linkedin: "LinkedIn", li: "LinkedIn", facebook: "Facebook", fb: "Facebook", whatsapp: "WhatsApp", wa: "WhatsApp", twitter: "X (Twitter)", x: "X (Twitter)", github: "GitHub", resume: "Resume", email: "Email" };
    if (tag) return names[tag] || tag.charAt(0).toUpperCase() + tag.slice(1);
    if (/Instagram/.test(ua)) return "Instagram";
    if (/LinkedInApp/.test(ua)) return "LinkedIn";
    if (/FBAN|FBAV/.test(ua)) return "Facebook";
    if (/WhatsApp/.test(ua)) return "WhatsApp";
    var h = "";
    try { h = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : ""; } catch (e) {}
    if (!h) return "Direct";
    if (/instagram\.com$/.test(h)) return "Instagram";
    if (/linkedin\.com$|lnkd\.in$/.test(h)) return "LinkedIn";
    if (/facebook\.com$|fb\.com$/.test(h)) return "Facebook";
    if (/(^|\.)t\.co$|twitter\.com$|x\.com$/.test(h)) return "X (Twitter)";
    if (/google\./.test(h)) return "Google search";
    if (/github\.com$/.test(h)) return "GitHub";
    return h;
  }
  function cleanName(n) { return String(n || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 40); }
  function ago(ts) {
    var s = Math.max(0, (Date.now() - new Date(ts).getTime()) / 1000);
    if (isNaN(s)) return "";
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " hr ago";
    return Math.floor(s / 86400) + " d ago";
  }
  function deviceIcon(d) { return d === "Mobile" ? "fa-mobile-screen" : d === "Tablet" ? "fa-tablet-screen-button" : "fa-desktop"; }

  function initVisitors() {
    var openBtn = $("#vpOpen"), panel = $("#visitorPanel"), back = $("#vpBackdrop");
    if (!openBtn || !panel) return;

    var info = parseUA();
    info.screen = screen.width + " × " + screen.height;
    info.lang = navigator.language || "–";
    info.tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || "–";
    info.ref = detectSource();
    var qs = new URLSearchParams(location.search);
    if (qs.get("owner")) store.set("vp_owner", qs.get("owner") === "off" ? "" : qs.get("owner"));
    var OWNER = store.get("vp_owner") || "";
    var isOwner = !!OWNER;   // owner's own visits are never counted or logged
    var vid = store.get("vp_id");
    if (!vid) { vid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36); store.set("vp_id", vid); }
    if (qs.get("name")) store.set("vp_name", cleanName(qs.get("name")));
    info.name = store.get("vp_name") || "";
    info.place = null;

    var state = { total: null, today: null, myNo: null, recent: [] };
    var d = new Date(), dayKey = "day-" + d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
    var firstThisSession = !isOwner && !store.get("vp_hit", true);
    var mine = parseInt(store.get("vp_mine"), 10) || 0;
    if (firstThisSession) { mine++; store.set("vp_mine", mine); store.set("vp_hit", "1", true); }

    /* ---- counters ---- */
    function counterCall(name, hit) {
      var v1 = "https://api.counterapi.dev/v1/" + COUNTER_NS + "/" + name + (hit ? "/up" : "");
      var alt = "https://abacus.jasoncameron.dev/" + (hit ? "hit" : "get") + "/" + COUNTER_NS + "/" + name;
      return timeoutFetch(v1).then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (j) { if (typeof j.count !== "number") throw 0; return j.count; })
        .catch(function () {
          return timeoutFetch(alt).then(function (r) { if (!r.ok) throw 0; return r.json(); })
            .then(function (j) { return typeof j.value === "number" ? j.value : null; });
        })
        .catch(function () { return null; });
    }

    function loadGeo() {
      if (info.place !== null) return Promise.resolve();
      return timeoutFetch("https://ipwho.is/", {}, 6000).then(function (r) { return r.json(); })
        .then(function (g) {
          if (g && g.success !== false && g.city) info.place = g.city + (g.country ? ", " + g.country : "");
          else info.place = "";
        }).catch(function () { info.place = ""; });
    }

    function refreshUI() {
      var badge = $("#vpBadge"), mini = $("#vpMini");
      if (badge) badge.textContent = fmt(state.total);
      if (mini) mini.textContent = fmt(state.total);
    }

    function boot() {
      if (VISITOR_LOG_URL) {
        var p = firstThisSession ? loadGeo().then(function () {
          var body = { id: vid, name: info.name, city: info.place || "", device: info.device, browser: info.browser, os: info.os, ref: info.ref, tz: info.tz, lang: info.lang };
          return fetch(VISITOR_LOG_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) }).catch(function () {});
        }) : Promise.resolve();
        p.then(function () { return timeoutFetch(VISITOR_LOG_URL + "?action=visitors" + (OWNER ? "&scope=today&key=" + encodeURIComponent(OWNER) : ""), {}, 10000); })
          .then(function (r) { return r.json(); })
          .then(function (j) { state.total = j.total; state.today = j.today; state.myNo = firstThisSession ? j.total : null; state.recent = j.recent || []; refreshUI(); })
          .catch(function () {});
      } else {
        var tot = counterCall("views", firstThisSession), tod = counterCall(dayKey, firstThisSession);
        Promise.all([tot, tod]).then(function (r) {
          state.total = r[0]; state.today = r[1];
          if (firstThisSession && r[0] != null) { state.myNo = r[0]; store.set("vp_no", r[0]); }
          refreshUI();
        });
      }
    }

    /* ---- panel ---- */
    var rendered = false;
    function render() {
      countTo($("#vpTotal"), state.total);
      countTo($("#vpToday"), state.today, 900);
      $("#vpMine").textContent = mine;
      var no = state.myNo || parseInt(store.get("vp_no"), 10);
      var noEl = $("#vpNo");
      if (no) { noEl.textContent = "You are visitor #" + no.toLocaleString(); noEl.hidden = false; } else noEl.hidden = true;

      var rows = [];
      if (info.name) rows.push(["fa-user", "Name", info.name]);
      rows = rows.concat([
        ["fa-location-dot", "Location", info.place || info.tz],
        [deviceIcon(info.device), "Device", info.device + " · " + info.os],
        ["fa-globe", "Browser", info.browser],
        ["fa-expand", "Screen", info.screen],
        ["fa-share-nodes", "Came from", info.ref],
        ["fa-clock", "Local time", new Date().toLocaleString([], { dateStyle: "medium", timeStyle: "short" })]
      ]);
      $("#vpYou").innerHTML = rows.map(function (r, i) {
        return '<li style="--i:' + i + '"><i class="fas ' + r[0] + '"></i><div><small>' + r[1] + "</small><b>" + esc(r[2]) + "</b></div></li>";
      }).join("");

      var rw = $("#vpRecentWrap");
      if (state.recent && state.recent.length) {
        $("#vpRecent").innerHTML = state.recent.slice(0, isOwner ? 150 : 8).map(function (v, i) {
          return '<li style="--i:' + i + '"><i class="fas ' + deviceIcon(v.device) + '"></i><div><b>' + esc(v.name ? v.name + (v.city ? " · " + v.city : "") : (v.city || "Unknown location")) +
            "</b><small>" + esc([v.source, v.device, v.browser].filter(Boolean).join(" · ")) + '</small></div><span class="when">' + esc(isOwner ? new Date(v.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ago(v.time)) + "</span></li>";
        }).join("");
        $("#vpRecentTitle").textContent = isOwner ? "Today's visitors (" + state.recent.length + ")" : "Recent visitors";
        rw.hidden = false;
      } else rw.hidden = true;
      $("#vpOwner").hidden = !isOwner;
    }

    var lastFocus;
    function open() {
      lastFocus = document.activeElement;
      loadGeo().then(function () { if (panel.classList.contains("open")) render(); });
      render(); rendered = true;
      panel.classList.add("open"); back.classList.add("open"); document.body.classList.add("vp-open");
      panel.setAttribute("aria-hidden", "false");
      $("#vpClose").focus();
    }
    function close() {
      panel.classList.remove("open"); back.classList.remove("open"); document.body.classList.remove("vp-open");
      panel.setAttribute("aria-hidden", "true");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    openBtn.addEventListener("click", open);
    $("#vpClose").addEventListener("click", close);
    back.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("open")) close(); });

    function saveName(n) {
      n = cleanName(n); if (!n) return;
      info.name = n; store.set("vp_name", n);
      if (VISITOR_LOG_URL && !isOwner) fetch(VISITOR_LOG_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "name", id: vid, name: n }) }).catch(function () {});
      if (panel.classList.contains("open")) render();
    }
    if (info.name && VISITOR_LOG_URL && qs.get("name")) saveName(info.name);

    // friendly, skippable welcome question (asked once per device)
    if (!isOwner && !info.name && !store.get("vp_asked") && window.Swal) {
      setTimeout(function () {
        if (document.body.classList.contains("modal-open") || panel.classList.contains("open")) return;
        store.set("vp_asked", "1");
        Swal.fire({
          title: "Welcome! 👋",
          text: "I would love to know who is visiting. What is your name? (optional)",
          input: "text", inputPlaceholder: "Your name", inputAttributes: { maxlength: 40, autocomplete: "given-name" },
          showCancelButton: true, confirmButtonText: "Continue", cancelButtonText: "Skip",
          confirmButtonColor: "#078199", backdrop: "rgba(0,0,0,0.4)"
        }).then(function (r) { if (r.isConfirmed && r.value) saveName(r.value); });
      }, 9000);
    }

    boot();
  }

  /* ---------------------------------------------------------
     go
     --------------------------------------------------------- */
  function initContact() {
    var sec = $("#contact");
    if (!sec) return;
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { sec.classList.add("in"); io.disconnect(); }
    }, { threshold: 0.12 });
    io.observe(sec);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initContact();
    initProjects();
    initReviews();
    initVisitors();
  });
})();
