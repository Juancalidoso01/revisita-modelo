(function () {
  "use strict";

  var track = document.getElementById("magazineTrack");
  var viewport = document.getElementById("magazineViewport");
  var btnPrev = document.getElementById("btnPrev");
  var btnNext = document.getElementById("btnNext");
  var pageLabel = document.getElementById("pageLabel");
  var dotsContainer = document.getElementById("magazineDots");
  var yearEl = document.getElementById("year");

  if (!track || !viewport) return;

  var pages = Array.prototype.slice.call(track.querySelectorAll(".magazine-page"));
  var total = pages.length;
  var index = 0;

  var prefersReduced =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function syncYear() {
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  function updateDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = "";
    for (var i = 0; i < total; i++) {
      (function (pageIndex) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "magazine-dot" + (pageIndex === index ? " is-active" : "");
        b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", pageIndex === index ? "true" : "false");
        b.setAttribute("aria-label", "Ir a página " + (pageIndex + 1));
        b.addEventListener("click", function () {
          goTo(pageIndex);
        });
        dotsContainer.appendChild(b);
      })(i);
    }
  }

  function slideWidth() {
    return viewport.offsetWidth || window.innerWidth || 0;
  }

  function layout() {
    var w = slideWidth();
    if (w <= 0) return;
    track.style.width = total * w + "px";
    pages.forEach(function (p) {
      p.style.flex = "0 0 " + w + "px";
      p.style.width = w + "px";
      p.style.maxWidth = w + "px";
    });
    goTo(index);
  }

  function goTo(i) {
    if (i < 0 || i >= total) return;
    index = i;
    var w = slideWidth();
    var offsetPx = -(index * w);
    track.style.transform = "translate3d(" + offsetPx + "px, 0, 0)";
    if (pageLabel) pageLabel.textContent = index + 1 + " / " + total;
    if (btnPrev) btnPrev.disabled = index === 0;
    if (btnNext) btnNext.disabled = index === total - 1;
    updateDots();
    var active = pages[index];
    if (active) active.setAttribute("tabindex", "-1");
  }

  function next() {
    goTo(Math.min(index + 1, total - 1));
  }

  function prev() {
    goTo(Math.max(index - 1, 0));
  }

  function onKey(e) {
    if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      prev();
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(total - 1);
    }
  }

  var touchStartX = 0;
  var touchEndX = 0;

  function onTouchStart(e) {
    if (!e.touches || !e.touches.length) return;
    touchStartX = e.touches[0].clientX;
  }

  function onTouchEnd(e) {
    if (!e.changedTouches || !e.changedTouches.length) return;
    touchEndX = e.changedTouches[0].clientX;
    var dx = touchEndX - touchStartX;
    var threshold = 50;
    if (dx < -threshold) next();
    else if (dx > threshold) prev();
  }

  track.style.transitionDuration = prefersReduced ? "0.05s" : "0.65s";
  track.style.transitionTimingFunction = prefersReduced ? "linear" : "cubic-bezier(0.33, 1, 0.68, 1)";
  track.style.transitionProperty = "transform";

  if (btnPrev) btnPrev.addEventListener("click", prev);
  if (btnNext) btnNext.addEventListener("click", next);
  window.addEventListener("keydown", onKey);
  viewport.addEventListener("touchstart", onTouchStart, { passive: true });
  viewport.addEventListener("touchend", onTouchEnd, { passive: true });

  window.addEventListener(
    "resize",
    function () {
      layout();
    },
    { passive: true }
  );

  syncYear();
  layout();
})();
