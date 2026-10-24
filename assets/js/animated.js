document.addEventListener("DOMContentLoaded", function () {

  // Footer year
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Scroll progress bar
  var bar = document.createElement("div");
  bar.id = "sp";
  document.body.appendChild(bar);
  window.addEventListener("scroll", function () {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
  });

  // Scroll reveal (classes are removed afterwards so card hover keeps working)
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var t = e.target;
      t.classList.add("in");
      io.unobserve(t);
      setTimeout(function () {
        t.classList.remove("rv", "in");
        t.style.transitionDelay = "";
      }, 1300);
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".service-card, .flip-project-card, .achievement-card, #tabs .card.h-100, .flip-project-heading, .achievement-heading, .marquee")
    .forEach(function (el, i) {
      el.classList.add("rv");
      el.style.transitionDelay = (i % 3) * 120 + "ms";
      io.observe(el);
    });

  // Floating tech icons inside the hero box
  var box = document.querySelector("#about .about");
  if (box) {
    ["fab fa-html5", "fab fa-css3-alt", "fab fa-js", "fab fa-bootstrap", "fab fa-github",
     "fas fa-database", "fas fa-code", "fab fa-microsoft", "fas fa-server", "fas fa-network-wired"]
      .forEach(function (c, i) {
        var el = document.createElement("i");
        el.className = "fi " + c;
        el.style.cssText = "left:" + ((i * 13 + 4) % 92) + "%;top:" + ((i * 29 + 8) % 80) +
          "%;font-size:" + (24 + (i % 3) * 10) + "px;--d:" + (5 + (i % 4)) + "s;animation-delay:" + (i * 0.4) + "s";
        box.appendChild(el);
      });
  }
});
