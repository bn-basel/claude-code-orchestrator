(function () {
  'use strict';

  var board = document.querySelector('.board');
  var readout = document.getElementById('readout');
  if (!board || !readout) return;

  var details = Array.prototype.slice.call(readout.querySelectorAll('.stage-detail'));
  var allStations = Array.prototype.slice.call(board.querySelectorAll('.stn'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrow = window.matchMedia('(max-width: 719.98px)');
  var current = 0;

  function visibleSvg() {
    var svgs = board.querySelectorAll('.dia');
    for (var i = 0; i < svgs.length; i++) if (svgs[i].getClientRects().length) return svgs[i];
    return null;
  }

  function stationsIn(svg) {
    return Array.prototype.slice.call(svg.querySelectorAll('.stn'));
  }

  function select(n) {
    n = Number(n);
    current = n;
    details.forEach(function (d) { d.classList.toggle('is-active', Number(d.dataset.stage) === n); });
    allStations.forEach(function (s) {
      var on = Number(s.dataset.stage) === n;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var hot = false;
    board.querySelectorAll('.ret, .lbl-ret').forEach(function (r) {
      var isHot = n > 0 && (Number(r.dataset.from) === n || Number(r.dataset.to) === n);
      r.classList.toggle('hot', isHot);
      if (isHot) hot = true;
    });
    board.classList.toggle('has-hot', hot);
  }

  function showReadoutOnNarrow() {
    if (!narrow.matches) return;
    readout.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }

  allStations.forEach(function (s) {
    s.setAttribute('aria-pressed', 'false');
    s.addEventListener('focus', function () { select(s.dataset.stage); });
    s.addEventListener('click', function () {
      select(s.dataset.stage);
      showReadoutOnNarrow();
    });
    s.addEventListener('keydown', function (e) {
      var list = stationsIn(s.ownerSVGElement);
      var i = list.indexOf(s), next = null;
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          select(s.dataset.stage);
          showReadoutOnNarrow();
          return;
        case 'ArrowRight':
        case 'ArrowDown':
          next = list[(i + 1) % list.length]; break;
        case 'ArrowLeft':
        case 'ArrowUp':
          next = list[(i - 1 + list.length) % list.length]; break;
        case 'Home': next = list[0]; break;
        case 'End': next = list[list.length - 1]; break;
        default: return;
      }
      e.preventDefault();
      next.focus();
    });
  });

  // "Next:" links inside the readout
  readout.addEventListener('click', function (e) {
    var a = e.target.closest('[data-go]');
    if (!a) return;
    e.preventDefault();
    var n = a.dataset.go;
    var svg = visibleSvg();
    var target = svg && svg.querySelector('.stn[data-stage="' + n + '"]');
    if (target && !narrow.matches) {
      target.focus({ preventScroll: true });
    } else {
      select(n);
      readout.focus({ preventScroll: true });
    }
  });

  // Copy buttons (the install line and the start line)
  if (navigator.clipboard && window.isSecureContext) {
    document.querySelectorAll('.copy').forEach(function (copyBtn) {
      copyBtn.hidden = false;
      copyBtn.addEventListener('click', function () {
        var text = document.getElementById(copyBtn.dataset.copy).textContent.trim();
        navigator.clipboard.writeText(text).then(function () {
          copyBtn.textContent = 'Copied';
          setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1600);
        });
      });
    });
  }

  // One calm run of a work item around the loop, the first time the diagram is seen.
  function runToken(svg) {
    var path = svg.querySelector('.trk');
    var token = svg.querySelector('.token');
    if (!path || !token || !path.getTotalLength) return;
    var total = path.getTotalLength();
    var steps = 600, samples = [];
    for (var k = 0; k <= steps; k++) samples.push(path.getPointAtLength((total * k) / steps));
    var dots = Array.prototype.slice.call(svg.querySelectorAll('.stn')).map(function (s) {
      var d = s.querySelector('.dot-you') || s.querySelector('.dot');
      var x = d.hasAttribute('cx') ? +d.getAttribute('cx') : +d.getAttribute('x') + 6;
      var y = d.hasAttribute('cy') ? +d.getAttribute('cy') : +d.getAttribute('y') + 6;
      var best = 0, bd = Infinity;
      for (var k = 0; k <= steps; k++) {
        var dx = samples[k].x - x, dy = samples[k].y - y, dd = dx * dx + dy * dy;
        if (dd < bd) { bd = dd; best = k; }
      }
      return { el: d, at: (total * best) / steps, done: false };
    });
    var duration = 9000, start = null;
    var ease = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
    token.style.transition = 'opacity 500ms ease';
    token.style.opacity = '1';
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / duration);
      var l = ease(t) * total;
      var p = path.getPointAtLength(l);
      var q = path.getPointAtLength(Math.min(total, l + 1));
      var ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
      if (svg.classList.contains('dia-v')) ang -= 90;
      token.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
      dots.forEach(function (d) {
        if (!d.done && l >= d.at - 0.5 && d.at > 1) {
          d.done = true;
          d.el.classList.add('lit');
          setTimeout(function () { d.el.classList.remove('lit'); }, 900);
        }
      });
      if (t < 1) requestAnimationFrame(frame);
      else {
        dots[0].el.classList.add('lit');
        setTimeout(function () { dots[0].el.classList.remove('lit'); token.style.opacity = '0'; }, 900);
      }
    }
    requestAnimationFrame(frame);
  }

  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    var played = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (played || !en.isIntersecting) return;
        var svg = visibleSvg();
        if (!svg) return;
        played = true;
        io.disconnect();
        setTimeout(function () { runToken(svg); }, 500);
      });
    }, { threshold: 0.45 });
    io.observe(board);
  }
})();
