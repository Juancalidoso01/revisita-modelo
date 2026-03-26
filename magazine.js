(function () {
  "use strict";

  var book = document.getElementById("magazineBook");
  var track = document.getElementById("magazineTrack");
  var viewport = document.getElementById("magazineViewport");
  var btnPrev = document.getElementById("btnPrev");
  var btnNext = document.getElementById("btnNext");
  var btnZoomIn = document.getElementById("btnZoomIn");
  var btnZoomOut = document.getElementById("btnZoomOut");
  var btnZoomReset = document.getElementById("btnZoomReset");
  var btnSound = document.getElementById("btnSound");
  var pageTurnAudio = document.getElementById("pageTurnAudio");
  var pageLabel = document.getElementById("pageLabel");
  var dotsContainer = document.getElementById("magazineDots");
  var yearEls = document.querySelectorAll("#year");

  if (!book || !track || !viewport) return;

  var pages = Array.prototype.slice.call(track.querySelectorAll(".magazine-page"));
  var total = pages.length;
  var index = 0;
  var turnTimer = null;
  var soundEnabled = true;
  var logoUrl = "https://www.telered.com.pa/wp-content/uploads/2019/11/logo-horizontal-version-1.png";
  var zoomLevel = 1;
  var minZoom = 1;
  var maxZoom = 2.2;
  var originX = 50;
  var originY = 50;
  var mobileQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(max-width: 720px)")
      : null;

  function syncYear() {
    Array.prototype.forEach.call(yearEls, function (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    });
  }

  function injectPageBranding() {
    pages.forEach(function (page, pageIndex) {
      var inner = page.querySelector(".magazine-page__inner");
      if (!inner) return;

      if (!inner.querySelector(".page-corner-logos")) {
        var logos = document.createElement("div");
        logos.className = "page-corner-logos";

        for (var i = 0; i < 4; i++) {
          var img = document.createElement("img");
          img.src = logoUrl;
          img.alt = "";
          img.loading = "lazy";
          logos.appendChild(img);
        }

        inner.insertBefore(logos, inner.firstChild);
      }

      if (!inner.querySelector(".page-visual")) {
        var visual = document.createElement("div");
        visual.className = "page-visual page-visual--" + ((pageIndex % 4) + 1);

        var orb = document.createElement("span");
        orb.className = "page-visual__orb";
        var ring = document.createElement("span");
        ring.className = "page-visual__ring";
        var line = document.createElement("span");
        line.className = "page-visual__line";

        visual.appendChild(orb);
        visual.appendChild(ring);
        visual.appendChild(line);
        inner.insertBefore(visual, inner.firstChild);
      }
    });
  }

  function isMobile() {
    return !!(mobileQuery && mobileQuery.matches);
  }

  function pageStep() {
    return isMobile() ? 1 : 2;
  }

  function visibleCount() {
    return isMobile() ? 1 : 2;
  }

  function maxIndex() {
    if (isMobile()) return total - 1;
    return Math.max(0, total - 2);
  }

  function clampIndex(nextIndex) {
    var clamped = Math.max(0, Math.min(nextIndex, maxIndex()));
    if (!isMobile()) {
      clamped = clamped - (clamped % 2);
    }
    return clamped;
  }

  function currentPageWidth() {
    if (!pages.length) return 0;
    return pages[0].getBoundingClientRect().width;
  }

  function updateZoomUi() {
    if (btnZoomReset) {
      btnZoomReset.querySelector(".magazine-btn__label").textContent =
        Math.round(zoomLevel * 100) + "%";
    }
    if (btnZoomOut) btnZoomOut.disabled = zoomLevel <= minZoom + 0.001;
    if (btnZoomIn) btnZoomIn.disabled = zoomLevel >= maxZoom - 0.001;
    book.classList.toggle("is-zoomed", zoomLevel > 1.001);
  }

  function applyTrackTransform() {
    var width = currentPageWidth();
    var offset = -(index * width);
    track.style.transformOrigin = originX + "% " + originY + "%";
    track.style.transform =
      "translate3d(" + offset + "px, 0, 0) scale(" + zoomLevel + ")";
  }

  function fitPageContent() {
    pages.forEach(function (page) {
      var inner = page.querySelector(".magazine-page__inner");
      if (!inner) return;

      inner.style.transform = "none";
      inner.style.width = "";
      inner.style.height = "";

      var availableWidth = page.clientWidth;
      var availableHeight = page.clientHeight;
      if (!availableWidth || !availableHeight) return;

      var contentWidth = inner.scrollWidth;
      var contentHeight = inner.scrollHeight;
      if (!contentWidth || !contentHeight) return;

      var scale = Math.min(1, availableWidth / contentWidth, availableHeight / contentHeight);
      inner.style.transform = "scale(" + scale + ")";
      inner.style.width = 100 / scale + "%";
      inner.style.height = 100 / scale + "%";
    });
  }

  function labelForIndex(i) {
    if (isMobile()) return i + 1 + " / " + total;
    return i + 1 + "-" + Math.min(i + 2, total) + " / " + total;
  }

  function totalStops() {
    return isMobile() ? total : Math.ceil(total / 2);
  }

  function currentStop() {
    return isMobile() ? index : Math.floor(index / 2);
  }

  function scheduleTurnFeedback(direction) {
    if (turnTimer) window.clearTimeout(turnTimer);

    book.classList.remove("is-turning", "is-turning-forward", "is-turning-backward");
    book.classList.add("is-turning", direction === "forward" ? "is-turning-forward" : "is-turning-backward");

    turnTimer = window.setTimeout(function () {
      book.classList.remove("is-turning", "is-turning-forward", "is-turning-backward");
      turnTimer = null;
    }, 950);
  }

  function updateSoundButton() {
    if (!btnSound) return;
    btnSound.classList.toggle("is-on", soundEnabled);
    btnSound.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
    btnSound.setAttribute(
      "aria-label",
      soundEnabled ? "Desactivar sonido de página" : "Activar sonido de página"
    );
  }

  function unlockAudio() {
    if (!pageTurnAudio) return;
    pageTurnAudio.load();
  }

  function playTurnSound() {
    if (!soundEnabled) return;
    if (!pageTurnAudio) return;

    try {
      pageTurnAudio.pause();
      pageTurnAudio.currentTime = 0;
      pageTurnAudio.volume = 0.65;

      var playPromise = pageTurnAudio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    } catch (error) {}
  }

  function updateDots() {
    if (!dotsContainer) return;

    dotsContainer.innerHTML = "";

    for (var i = 0; i < totalStops(); i++) {
      (function (stopIndex) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "magazine-dot" + (stopIndex === currentStop() ? " is-active" : "");
        button.setAttribute("role", "tab");
        button.setAttribute("aria-selected", stopIndex === currentStop() ? "true" : "false");
        button.setAttribute(
          "aria-label",
          isMobile()
            ? "Ir a la página " + (stopIndex + 1)
            : "Ir a las páginas " + (stopIndex * 2 + 1) + " y " + Math.min(stopIndex * 2 + 2, total)
        );
        button.addEventListener("click", function () {
          goTo(isMobile() ? stopIndex : stopIndex * 2);
        });
        dotsContainer.appendChild(button);
      })(i);
    }
  }

  function updateVisiblePages() {
    var firstVisible = index;
    var lastVisible = Math.min(index + visibleCount() - 1, total - 1);

    pages.forEach(function (page, pageIndex) {
      var visible = pageIndex >= firstVisible && pageIndex <= lastVisible;
      page.classList.toggle("is-visible", visible);
      page.setAttribute("aria-hidden", visible ? "false" : "true");
      page.tabIndex = visible ? 0 : -1;
    });
  }

  function layout() {
    index = clampIndex(index);
    fitPageContent();
    applyTrackTransform();
    updateVisiblePages();

    if (pageLabel) pageLabel.textContent = labelForIndex(index);
    if (btnPrev) btnPrev.disabled = index === 0;
    if (btnNext) btnNext.disabled = index >= maxIndex();
    updateDots();
    updateZoomUi();
  }

  function goTo(nextIndex) {
    var target = clampIndex(nextIndex);
    if (target === index) return;

    var direction = target > index ? "forward" : "backward";
    index = target;
    scheduleTurnFeedback(direction);
    layout();
    playTurnSound();
  }

  function next() {
    goTo(index + pageStep());
  }

  function prev() {
    goTo(index - pageStep());
  }

  function setZoom(nextZoom) {
    zoomLevel = Math.max(minZoom, Math.min(maxZoom, nextZoom));
    applyTrackTransform();
    updateZoomUi();
  }

  function zoomIn() {
    setZoom(Math.min(maxZoom, zoomLevel + 0.2));
  }

  function zoomOut() {
    setZoom(Math.max(minZoom, zoomLevel - 0.2));
  }

  function resetZoom() {
    originX = 50;
    originY = 50;
    setZoom(1);
  }

  function updateOriginFromPointer(event) {
    if (zoomLevel <= 1.001) return;
    var rect = book.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    originX = ((event.clientX - rect.left) / rect.width) * 100;
    originY = ((event.clientY - rect.top) / rect.height) * 100;
    originX = Math.max(0, Math.min(100, originX));
    originY = Math.max(0, Math.min(100, originY));
    applyTrackTransform();
  }

  function onBookClick(event) {
    if (event.target.closest("a, button")) return;

    var rect = book.getBoundingClientRect();
    if (rect.width && rect.height) {
      originX = ((event.clientX - rect.left) / rect.width) * 100;
      originY = ((event.clientY - rect.top) / rect.height) * 100;
    }

    if (zoomLevel > 1.001) {
      resetZoom();
    } else {
      setZoom(1.6);
    }
  }

  function shouldIgnoreFlipbookKeys(event) {
    if (event.defaultPrevented) return true;
    var t = event.target;
    if (!t || typeof t.closest !== "function") return false;
    return !!t.closest(
      "button, a[href], input, textarea, select, [contenteditable='true'], [role='tab']"
    );
  }

  function onKey(event) {
    if (shouldIgnoreFlipbookKeys(event)) return;

    var key = event.key;

    if (key === "ArrowRight" || key === "PageDown" || key === " ") {
      event.preventDefault();
      next();
      return;
    }

    if (key === "ArrowLeft" || key === "PageUp") {
      event.preventDefault();
      prev();
      return;
    }

    if (key === "Home") {
      event.preventDefault();
      goTo(0);
      return;
    }

    if (key === "End") {
      event.preventDefault();
      goTo(maxIndex());
    }
  }

  var touchStartX = 0;
  var touchStartY = 0;

  function onTouchStart(event) {
    if (!event.touches || !event.touches.length) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }

  function onTouchEnd(event) {
    if (!event.changedTouches || !event.changedTouches.length) return;

    var touch = event.changedTouches[0];
    var deltaX = touch.clientX - touchStartX;
    var deltaY = touch.clientY - touchStartY;
    var threshold = 50;

    if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

    if (deltaX < -threshold) next();
    if (deltaX > threshold) prev();
  }

  function handleResponsiveChange() {
    index = clampIndex(index);
    resetZoom();
    layout();
  }

  function bindResponsiveListener() {
    if (!mobileQuery) return;

    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", handleResponsiveChange);
      return;
    }

    if (typeof mobileQuery.addListener === "function") {
      mobileQuery.addListener(handleResponsiveChange);
    }
  }

  function bindAssetLayoutRefresh() {
    var media = document.querySelectorAll("img");

    media.forEach(function (item) {
      if (item.complete) return;
      item.addEventListener("load", layout, { passive: true });
      item.addEventListener("error", layout, { passive: true });
    });

    window.addEventListener("load", layout, { passive: true });

    if (document.fonts && typeof document.fonts.ready === "object") {
      document.fonts.ready.then(layout).catch(function () {});
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    updateSoundButton();

    if (soundEnabled) {
      unlockAudio();
    }
  }

  var controlsNav = document.querySelector(".magazine-controls");
  if (controlsNav) {
    controlsNav.addEventListener(
      "click",
      function (e) {
        e.stopPropagation();
      },
      false
    );
  }

  if (btnPrev) btnPrev.addEventListener("click", prev);
  if (btnNext) btnNext.addEventListener("click", next);
  if (btnZoomIn) {
    btnZoomIn.addEventListener("click", function (e) {
      e.stopPropagation();
      zoomIn();
    });
  }
  if (btnZoomOut) {
    btnZoomOut.addEventListener("click", function (e) {
      e.stopPropagation();
      zoomOut();
    });
  }
  if (btnZoomReset) {
    btnZoomReset.addEventListener("click", function (e) {
      e.stopPropagation();
      resetZoom();
    });
  }
  if (btnSound) btnSound.addEventListener("click", toggleSound);

  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("keydown", onKey);
  window.addEventListener("keydown", unlockAudio);
  window.addEventListener("resize", layout, { passive: true });
  book.addEventListener("click", onBookClick);
  book.addEventListener("mousemove", updateOriginFromPointer, { passive: true });

  viewport.addEventListener("touchstart", onTouchStart, { passive: true });
  viewport.addEventListener("touchend", onTouchEnd, { passive: true });

  bindResponsiveListener();
  bindAssetLayoutRefresh();
  injectPageBranding();
  syncYear();
  updateSoundButton();
  layout();
})();
