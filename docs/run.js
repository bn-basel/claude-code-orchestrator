/* Watch one feature run: an animated, controllable walk of a ticket around the loop. */
(function () {
  'use strict';

  var root = document.getElementById('run');
  if (!root) return;
  var stage = root.querySelector('.run-stage');
  var capKick = root.querySelector('.run-cap-kick');
  var capTitle = root.querySelector('.run-cap-title');
  var capText = root.querySelector('.run-cap-text');
  var playBtn = root.querySelector('[data-run="play"]');
  var restartBtn = root.querySelector('[data-run="restart"]');
  var speedBtns = Array.prototype.slice.call(root.querySelectorAll('[data-speed]'));
  var stageList = root.querySelector('.run-stops');
  var bar = root.querySelector('.run-bar i');
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrowMq = window.matchMedia('(max-width: 719.98px)');

  // ── The loop: stations, the way back, and one feature's journey ──────────────────────────
  var NODES = [
    { id: 'idea', t: 'Idea', s: 'you', who: 'you' },
    { id: 'plan', t: 'Plan', s: 'orchestrator · Opus', who: 'orch' },
    { id: 'prev', t: 'Plan review', s: 'reviewer · Opus', who: 'help', opt: true },
    { id: 'ok', t: 'You approve', s: 'you', who: 'you' },
    { id: 'tests', t: 'Tests first', s: 'test-writer · Sonnet', who: 'help', opt: true },
    { id: 'build', t: 'Build', s: 'implementer · Sonnet', who: 'help' },
    { id: 'check', t: 'Check by command', s: 'orchestrator', who: 'orch' },
    { id: 'click', t: 'Click-through', s: 'ui-tester · Haiku', who: 'help', opt: true },
    { id: 'review', t: 'Code review', s: 'reviewer · Opus', who: 'help' },
    { id: 'pr', t: 'Pull request + CI', s: 'orchestrator', who: 'orch' },
    { id: 'merge', t: 'Merge', s: 'you', who: 'you' },
    { id: 'verify', t: 'Verify', s: 'orchestrator + you', who: 'orch' },
    { id: 'learn', t: 'Learn', s: 'orchestrator', who: 'orch' }
  ];
  var RETURNS = [
    { id: 'prev-plan', from: 'prev', to: 'plan', label: 'revise · max 3 rounds' },
    { id: 'ok-plan', from: 'ok', to: 'plan', label: 'no: change it' },
    { id: 'check-build', from: 'check', to: 'build', label: 'fix · max 2 tries' },
    { id: 'review-build', from: 'review', to: 'build', label: 'code problem' },
    { id: 'review-plan', from: 'review', to: 'plan', label: 'design problem' },
    { id: 'pr-build', from: 'pr', to: 'build', label: 'CI red' },
    { id: 'verify-plan', from: 'verify', to: 'plan', label: 'switch off' }
  ];
  var WHO = { you: 'You', orch: 'Orchestrator', help: 'Helper' };

  // One feature, start to finish: a plan sent back once, a failed check fixed once, then clean to live.
  var SCRIPT = [
    ['dwell', 'idea', 1300, 'You describe the feature in plain words. No ticket format.'],
    ['move', 'idea', 'plan'],
    ['dwell', 'plan', 2000, 'The orchestrator splits it into small tasks, each with a label and a “Done when” check, and writes the goal and your decisions into PLAN.md.'],
    ['move', 'plan', 'prev'],
    ['dwell', 'prev', 1800, 'Wide and closed work only. A reviewer checks the plan against the real code. Round 1 finds a blocker.'],
    ['back', 'prev', 'plan', 'Sent back with the evidence. At most 3 rounds, then you decide.'],
    ['dwell', 'plan', 1000, 'The plan is revised.'],
    ['move', 'plan', 'prev'],
    ['dwell', 'prev', 1200, 'Round 2: clean.'],
    ['move', 'prev', 'ok'],
    ['dwell', 'ok', 2000, 'You get one plain summary: what it does, how it’s built, how it will be proved, the risks and the cost. Nothing runs until you say yes.'],
    ['move', 'ok', 'tests'],
    ['dwell', 'tests', 1800, 'Wide and closed work only. A test-writer turns each “Done when” into tests that fail now. Then they are frozen.'],
    ['move', 'tests', 'build'],
    ['dwell', 'build', 2000, 'An implementer codes one task in the build worktree, commits, and reports with a handoff line.'],
    ['move', 'build', 'check'],
    ['dwell', 'check', 1800, 'The orchestrator runs commands instead of reading code: the tests pass, the new tests fail on main, only the planned files changed. One check fails.'],
    ['back', 'check', 'build', 'Sent back with the command, the output and file:line. At most 2 fixes.'],
    ['dwell', 'build', 1100, 'Fixed and committed.'],
    ['move', 'build', 'check'],
    ['dwell', 'check', 1100, 'All checks pass.'],
    ['move', 'check', 'click'],
    ['dwell', 'click', 2000, 'Screen changes only. ui-tester clicks through the change on localhost at phone and desktop width and reports pass or fail per step. Evidence, not proof.'],
    ['move', 'click', 'review'],
    ['dwell', 'review', 2000, 'A reviewer sees only the plan, the diff and the test output, never the coder’s own story. Every finding needs evidence. This one is clean.'],
    ['move', 'review', 'pr'],
    ['dwell', 'pr', 1800, 'Full test suite, one pull request per feature, filled from the same template. CI goes green.'],
    ['move', 'pr', 'merge'],
    ['dwell', 'merge', 1600, 'You click merge. Merging is deploying, so this click is the release.'],
    ['move', 'merge', 'verify'],
    ['dwell', 'verify', 1600, 'The feature is switched on for one test account first, and you check it yourself.'],
    ['move', 'verify', 'learn'],
    ['dwell', 'learn', 1600, 'PLAN.md is updated, and zero to two new rules are proposed for your approval.'],
    ['move', 'learn', 'idea'],
    ['dwell', 'idea', 1400, 'Live. The next feature starts here.']
  ];
  var MOVE_MS = 750, BACK_MS = 1300;

  var byId = {};
  NODES.forEach(function (n, i) { n.i = i; byId[n.id] = n; });

  // ── Geometry for the two layouts ──────────────────────────────────────────────────────────
  function layoutWide() {
    var row1 = 132, row2 = 352;
    var xs1 = [70, 232, 394, 556, 718, 880, 1068], xs2 = [1068, 880, 718, 556, 394, 232];
    var pos = {};
    NODES.slice(0, 7).forEach(function (n, i) { pos[n.id] = { x: xs1[i], y: row1, lab: 'above' }; });
    NODES.slice(7).forEach(function (n, i) { pos[n.id] = { x: xs2[i], y: row2, lab: 'below' }; });
    var P = function (id) { return pos[id]; };
    var fwd = {}, ret = {};
    NODES.forEach(function (n, i) {
      var a = P(n.id), b = P(NODES[(i + 1) % NODES.length].id), key = n.id + '>' + NODES[(i + 1) % NODES.length].id;
      if (n.id === 'learn') fwd[key] = rounded([[a.x, a.y], [70, a.y], [b.x, b.y]]);
      else fwd[key] = 'M' + a.x + ',' + a.y + ' L' + b.x + ',' + b.y;
    });
    var s = 12;
    ret['prev-plan'] = curve(P('prev'), P('plan'), 60, s);
    ret['ok-plan'] = curve(P('ok'), P('plan'), 86, s);
    ret['check-build'] = curve(P('check'), P('build'), 60, s);
    ret['review-build'] = rounded([[P('review').x + 8, P('review').y - s], [P('review').x + 8, 258], [P('build').x + 8, 258], [P('build').x + 8, P('build').y + s]]);
    ret['review-plan'] = rounded([[P('review').x - 8, P('review').y - s], [P('review').x - 8, 286], [P('plan').x - 8, 286], [P('plan').x - 8, P('plan').y + s]]);
    ret['pr-build'] = rounded([[P('pr').x, P('pr').y - s], [P('pr').x, 236], [P('build').x - 8, 236], [P('build').x - 8, P('build').y + s]]);
    ret['verify-plan'] = rounded([[P('verify').x, P('verify').y - s], [P('verify').x, 310], [P('plan').x + 8, 310], [P('plan').x + 8, P('plan').y + s]]);
    var lab = {
      'prev-plan': [313, 168, 'middle'], 'ok-plan': [394, 220, 'middle'], 'check-build': [974, 168, 'middle'],
      'review-build': [892, 300, 'start'], 'review-plan': [556, 280, 'middle'], 'pr-build': [799, 230, 'middle'],
      'verify-plan': [313, 304, 'middle']
    };
    return { w: 1140, h: 352, vx: 20, vy: 70, pos: pos, fwd: fwd, ret: ret, lab: lab, wide: true };
  }

  function layoutNarrow() {
    var x = 112, y0 = 36, step = 62, pos = {};
    NODES.forEach(function (n, i) { pos[n.id] = { x: x, y: y0 + i * step, lab: 'right' }; });
    var fwd = {}, ret = {};
    NODES.forEach(function (n, i) {
      var nx = NODES[(i + 1) % NODES.length], a = pos[n.id], b = pos[nx.id];
      fwd[n.id + '>' + nx.id] = n.id === 'learn'
        ? rounded([[a.x, a.y], [14, a.y], [14, b.y], [b.x, b.y]])
        : 'M' + a.x + ',' + a.y + ' L' + b.x + ',' + b.y;
    });
    var lanes = { 'prev-plan': 92, 'ok-plan': 80, 'check-build': 92, 'review-build': 80, 'review-plan': 68, 'pr-build': 56, 'verify-plan': 44 };
    RETURNS.forEach(function (r) {
      var a = pos[r.from], b = pos[r.to], L = lanes[r.id];
      ret[r.id] = rounded([[a.x - 12, a.y], [L, a.y], [L, b.y], [b.x - 12, b.y]]);
    });
    return { w: 360, h: y0 + 12 * step + 40, vx: 0, vy: 0, pos: pos, fwd: fwd, ret: ret, lab: null, wide: false };
  }

  function curve(a, b, depth, s) {
    return 'M' + a.x + ',' + (a.y + s) + ' C' + a.x + ',' + (a.y + s + depth) + ' ' + b.x + ',' + (b.y + s + depth) + ' ' + b.x + ',' + (b.y + s);
  }
  function rounded(pts) {
    var r = 10, d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (var i = 1; i < pts.length - 1; i++) {
      var p = pts[i - 1], c = pts[i], n = pts[i + 1];
      var ax = c[0] - Math.sign(c[0] - p[0]) * r, ay = c[1] - Math.sign(c[1] - p[1]) * r;
      var bx = c[0] + Math.sign(n[0] - c[0]) * r, by = c[1] + Math.sign(n[1] - c[1]) * r;
      d += ' L' + ax + ',' + ay + ' Q' + c[0] + ',' + c[1] + ' ' + bx + ',' + by;
    }
    var last = pts[pts.length - 1];
    return d + ' L' + last[0] + ',' + last[1];
  }

  // ── Drawing ──────────────────────────────────────────────────────────────────────────────
  function el(parent, tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    parent.appendChild(e);
    return e;
  }

  var L, svg, nodeEls = {}, fwdEls = {}, retEls = {}, ticket;

  function draw() {
    L = narrowMq.matches ? layoutNarrow() : layoutWide();
    stage.textContent = '';
    svg = el(stage, 'svg', {
      viewBox: L.vx + ' ' + L.vy + ' ' + L.w + ' ' + L.h, class: 'run-svg ' + (L.wide ? 'is-wide' : 'is-narrow'),
      role: 'img', 'aria-labelledby': 'run-title', 'aria-describedby': 'run-desc'
    });
    nodeEls = {}; fwdEls = {}; retEls = {};
    var gRet = el(svg, 'g', { class: 'run-rets' });
    RETURNS.forEach(function (r) {
      retEls[r.id] = el(gRet, 'path', { d: L.ret[r.id], class: 'run-ret' });
      if (L.lab) {
        var lb = L.lab[r.id];
        retEls[r.id].lab = el(gRet, 'text', { x: lb[0], y: lb[1], 'text-anchor': lb[2], class: 'run-ret-lab' }, r.label);
      }
    });
    var gFwd = el(svg, 'g', { class: 'run-fwds' });
    Object.keys(L.fwd).forEach(function (k) { fwdEls[k] = el(gFwd, 'path', { d: L.fwd[k], class: 'run-fwd' }); });
    var gN = el(svg, 'g', { class: 'run-nodes' });
    NODES.forEach(function (n) {
      var p = L.pos[n.id];
      var g = el(gN, 'g', { class: 'run-node who-' + n.who + (n.opt ? ' is-opt' : ''), transform: 'translate(' + p.x + ' ' + p.y + ')' });
      if (n.who === 'you') el(g, 'rect', { x: -10, y: -10, width: 20, height: 20, rx: 5, class: 'run-dot' });
      else el(g, 'circle', { r: 10, class: 'run-dot' });
      var tx = 0, ty1, ty2, anchor = 'middle';
      if (p.lab === 'above') { ty1 = -42; ty2 = -24; }
      else if (p.lab === 'below') { ty1 = 34; ty2 = 52; }
      else { tx = 26; ty1 = -2; ty2 = 15; anchor = 'start'; }
      el(g, 'text', { x: tx, y: ty1, 'text-anchor': anchor, class: 'run-t' }, n.t);
      el(g, 'text', { x: tx, y: ty2, 'text-anchor': anchor, class: 'run-s' }, n.s);
      nodeEls[n.id] = g;
    });
    ticket = el(svg, 'g', { class: 'run-ticket', 'aria-hidden': 'true' });
    el(ticket, 'rect', { x: -22, y: -10, width: 44, height: 20, rx: 10 });
    el(ticket, 'text', { x: 0, y: 4, 'text-anchor': 'middle' }, 'F-12');
    render(t);
  }

  // ── Timeline ─────────────────────────────────────────────────────────────────────────────
  var steps = [], total = 0;
  SCRIPT.forEach(function (s) {
    var st = { kind: s[0], start: total };
    if (s[0] === 'dwell') { st.node = s[1]; st.dur = s[2]; st.text = s[3]; }
    else { st.from = s[1]; st.to = s[2]; st.dur = s[0] === 'back' ? BACK_MS : MOVE_MS; st.text = s[3] || null; }
    total += st.dur;
    steps.push(st);
  });

  function retId(from, to) {
    for (var i = 0; i < RETURNS.length; i++) if (RETURNS[i].from === from && RETURNS[i].to === to) return RETURNS[i].id;
    return null;
  }

  var t = 0, playing = false, rate = 1, last = null, userPaused = false, raf = null;

  function stateAt(time) {
    var nodes = {}, fwd = {}, ret = {}, cur = null, curIdx = 0;
    for (var i = 0; i < steps.length; i++) {
      var s = steps[i];
      if (s.start > time && i > 0) break;
      cur = s; curIdx = i;
      var done = time >= s.start + s.dur;
      if (s.kind === 'dwell') {
        nodes[s.node] = 'live';
      } else if (s.kind === 'move') {
        var k = s.from + '>' + s.to;
        nodes[s.from] = 'done';
        fwd[k] = done ? 'done' : 'live';
        if (s.to === 'idea') NODES.forEach(function (n) { if (n.id !== 'idea') nodes[n.id] = 'done'; });
      } else {
        var r = retId(s.from, s.to);
        nodes[s.from] = 'back';
        ret[r] = done ? 'was' : 'live';
      }
    }
    return { nodes: nodes, fwd: fwd, ret: ret, cur: cur, idx: curIdx };
  }

  function pointOn(path, f) {
    var len = path.getTotalLength();
    return path.getPointAtLength(Math.max(0, Math.min(1, f)) * len);
  }
  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

  var lastCapIdx = -1;
  function render(time) {
    if (!svg) return;
    var st = stateAt(time);
    NODES.forEach(function (n) {
      var g = nodeEls[n.id], v = st.nodes[n.id];
      g.classList.toggle('is-live', v === 'live');
      g.classList.toggle('is-done', v === 'done');
      g.classList.toggle('is-back', v === 'back');
    });
    Object.keys(fwdEls).forEach(function (k) {
      fwdEls[k].classList.toggle('is-live', st.fwd[k] === 'live');
      fwdEls[k].classList.toggle('is-done', st.fwd[k] === 'done');
    });
    Object.keys(retEls).forEach(function (k) {
      var on = st.ret[k];
      retEls[k].classList.toggle('is-live', on === 'live');
      retEls[k].classList.toggle('is-was', on === 'was');
      if (retEls[k].lab) retEls[k].lab.classList.toggle('is-on', !!on);
    });
    // ticket
    var s = st.cur, p;
    if (s.kind === 'dwell') p = L.pos[s.node];
    else {
      var path = s.kind === 'move' ? fwdEls[s.from + '>' + s.to] : retEls[retId(s.from, s.to)];
      var f = reduce.matches ? 1 : ease(Math.min(1, (time - s.start) / s.dur));
      p = pointOn(path, f);
    }
    var lift = L.wide ? 0 : 0;
    ticket.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + (p.y + lift).toFixed(1) + ')');
    ticket.classList.toggle('is-back', s.kind === 'back');
    // caption: the step being shown (a move's caption is the next dwell's unless it has its own)
    var capIdx = st.idx;
    if (s.kind === 'move') capIdx = Math.min(st.idx + 1, steps.length - 1);
    if (capIdx !== lastCapIdx) { caption(capIdx); lastCapIdx = capIdx; }
    if (bar) bar.style.transform = 'scaleX(' + Math.min(1, time / total).toFixed(4) + ')';
  }

  function caption(i) {
    var s = steps[i];
    var nodeId = s.kind === 'dwell' ? s.node : (s.kind === 'back' ? s.from : s.to);
    var n = byId[nodeId];
    var isBack = s.kind === 'back';
    root.classList.toggle('cap-back', isBack);
    capKick.textContent = (isBack ? 'Sent back · ' : 'Stage ' + String(n.i + 1).padStart(2, '0') + ' · ') + (n.who === 'you' ? 'You' : n.s);
    capTitle.textContent = isBack ? n.t + ' → ' + byId[s.to].t : n.t;
    capText.textContent = s.text || '';
    stopBtns.forEach(function (b) { b.setAttribute('aria-current', b.dataset.node === nodeId && !isBack ? 'step' : 'false'); });
  }

  function tick(now) {
    if (!playing) { last = null; return; }
    if (last !== null) t += (now - last) * rate;
    last = now;
    if (t >= total) { t = total; render(t); setPlaying(false); finished = true; return; }
    render(t);
    raf = requestAnimationFrame(tick);
  }

  var finished = false;
  function setPlaying(on) {
    playing = on;
    playBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    playBtn.querySelector('.lbl').textContent = on ? 'Pause' : (finished || t >= total ? 'Replay' : 'Play');
    root.classList.toggle('is-playing', on);
    if (on) { last = null; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
  }

  // ── Controls ─────────────────────────────────────────────────────────────────────────────
  playBtn.addEventListener('click', function () {
    if (playing) { userPaused = true; setPlaying(false); return; }
    userPaused = false;
    if (t >= total) { t = 0; finished = false; }
    setPlaying(true);
  });
  restartBtn.addEventListener('click', function () {
    t = 0; finished = false; lastCapIdx = -1; userPaused = false; render(t); setPlaying(true);
  });
  speedBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      rate = Number(b.dataset.speed);
      speedBtns.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
    });
  });

  var stopBtns = [];
  NODES.forEach(function (n) {
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button';
    b.dataset.node = n.id;
    b.innerHTML = '<span class="run-stop-n">' + String(n.i + 1).padStart(2, '0') + '</span> ' + n.t;
    b.addEventListener('click', function () {
      for (var i = 0; i < steps.length; i++) if (steps[i].kind === 'dwell' && steps[i].node === n.id) { t = steps[i].start + 1; break; }
      finished = false; lastCapIdx = -1;
      render(t);
      if (!playing) playBtn.querySelector('.lbl').textContent = 'Play';
    });
    li.appendChild(b);
    stageList.appendChild(li);
    stopBtns.push(b);
  });

  // Redraw when crossing the phone breakpoint; play when on screen, pause when off it.
  var onMq = function () { draw(); };
  if (narrowMq.addEventListener) narrowMq.addEventListener('change', onMq); else narrowMq.addListener(onMq);

  draw();
  setPlaying(false);

  if (!reduce.matches && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !userPaused && !finished) setPlaying(true);
        else if (!en.isIntersecting && playing) setPlaying(false);
      });
    }, { threshold: 0.4 }).observe(stage);
  }
})();
