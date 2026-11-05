/* R Rocket - the sound side.

   A good /r/ is the one English sound that pulls the third formant (F3, the
   third resonance of the mouth and throat) right down, close to the second.
   In a child's "ah" or "ee" F3 sits around 3,000 Hz or more; in a good /r/ it
   falls to about 2,000-2,500 Hz. A "w"-like or distorted /r/ leaves it high.
   That drop is what speech therapists show children on screen in
   visual-acoustic biofeedback, and it is what this file measures.

   It does not, and cannot, say whether a word was right. It says where F3 is
   while Rory is making a sound he can hold ("rrrr"), which is where the drop
   is clear. In quick words the /r/ lasts a few hundredths of a second, so the
   word practice uses a grown-up's ear as the judge and this only as a hint.

   Method: linear prediction (LPC) on a 12 kHz copy of the microphone signal,
   order 10, the roots of the prediction polynomial taken as resonances, and
   the ones narrow enough to be formants kept. Works in the page and in node
   (tools/rcheck.mjs tests it on made-up vowels). */
(function (root) {
"use strict";

var ORDER = 10;

/* Durand-Kerner: all the complex roots of a monic polynomial
   z^n + a[1] z^(n-1) + ... + a[n]. Small n, so the plain method is plenty. */
function roots(a) {
  var n = a.length - 1, re = new Float64Array(n), im = new Float64Array(n), i, j, k;
  for (i = 0; i < n; i++) { var ang = 2 * Math.PI * i / n + 0.4; re[i] = 0.9 * Math.cos(ang); im[i] = 0.9 * Math.sin(ang); }
  for (k = 0; k < 500; k++) {
    var moved = 0;
    for (i = 0; i < n; i++) {
      /* p(z) by Horner */
      var pr = 1, pi = 0;
      for (j = 1; j <= n; j++) { var t = pr * re[i] - pi * im[i] + a[j]; pi = pr * im[i] + pi * re[i]; pr = t; }
      /* product of (z_i - z_j) */
      var qr = 1, qi = 0;
      for (j = 0; j < n; j++) {
        if (j === i) continue;
        var dr = re[i] - re[j], di = im[i] - im[j];
        var u = qr * dr - qi * di; qi = qr * di + qi * dr; qr = u;
      }
      var den = qr * qr + qi * qi || 1e-30;
      var cr = (pr * qr + pi * qi) / den, ci = (pi * qr - pr * qi) / den;
      re[i] -= cr; im[i] -= ci;
      moved = Math.max(moved, Math.abs(cr) + Math.abs(ci));
    }
    if (moved < 1e-10) break;
  }
  var out = [];
  for (i = 0; i < n; i++) out.push([re[i], im[i]]);
  return out;
}

/* autocorrelation LPC by Levinson-Durbin; returns [1, a1..ap] */
function lpc(x, p) {
  var n = x.length, r = new Float64Array(p + 1), i, j;
  for (i = 0; i <= p; i++) { var s = 0; for (j = i; j < n; j++) s += x[j] * x[j - i]; r[i] = s; }
  r[0] *= 1.0001; /* a whisker of white noise keeps it stable */
  if (r[0] <= 0) return null;
  var a = new Float64Array(p + 1), tmp = new Float64Array(p + 1), e = r[0];
  a[0] = 1;
  for (i = 1; i <= p; i++) {
    var acc = r[i];
    for (j = 1; j < i; j++) acc += a[j] * r[i - j];
    var k = -acc / e;
    for (j = 0; j <= i; j++) tmp[j] = a[j];
    for (j = 1; j < i; j++) a[j] = tmp[j] + k * tmp[i - j];
    a[i] = k;
    e *= (1 - k * k);
    if (e <= 0) return null;
  }
  return a;
}

/* Is there a voice here? The strongest repeat in the 80-600 Hz pitch range,
   as a share of the frame's energy. Hum and hiss score low; a held vowel or
   "rrr" scores high. */
function voicing(x, fs) {
  var n = x.length, r0 = 0, i, lag, best = 0, bestLag = 0;
  for (i = 0; i < n; i++) r0 += x[i] * x[i];
  if (r0 <= 0) return { v: 0, f0: 0 };
  var lo = Math.floor(fs / 600), hi = Math.min(n - 1, Math.ceil(fs / 80));
  for (lag = lo; lag <= hi; lag++) {
    var s = 0, e1 = 0, e2 = 0;
    for (i = 0; i + lag < n; i++) { s += x[i] * x[i + lag]; e1 += x[i] * x[i]; e2 += x[i + lag] * x[i + lag]; }
    var c = s / Math.sqrt(e1 * e2 + 1e-20);
    if (c > best) { best = c; bestLag = lag; }
  }
  return { v: best, f0: bestLag ? fs / bestLag : 0 };
}

/* The whole analysis of one frame (already at about 12 kHz).
   Returns rms, voicing, the formants found, F2 and F3, and a smooth
   spectrum envelope (dB, `bins` points from 0 to `top` Hz) for drawing. */
function analyze(frame, fs, opts) {
  opts = opts || {};
  var bins = opts.bins || 160, top = opts.top || 5000, n = frame.length, i;
  var x = new Float64Array(n), mean = 0, rms = 0;
  for (i = 0; i < n; i++) mean += frame[i];
  mean /= n;
  for (i = 0; i < n; i++) { x[i] = frame[i] - mean; rms += x[i] * x[i]; }
  rms = Math.sqrt(rms / n);
  var res = { rms: rms, voiced: 0, f0: 0, formants: [], f2: 0, f3: 0, env: null };
  if (rms < 1e-5) return res;

  var vc = voicing(x, fs);
  res.voiced = vc.v; res.f0 = vc.f0;

  /* pre-emphasis (lifts the upper formants, F3 among them) and a Hamming window */
  var y = new Float64Array(n);
  y[0] = x[0];
  for (i = 1; i < n; i++) y[i] = x[i] - 0.95 * x[i - 1];
  for (i = 0; i < n; i++) y[i] *= 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
  var a = lpc(y, ORDER);
  if (!a) return res;

  /* envelope for the screen */
  var env = new Float32Array(bins);
  for (var b = 0; b < bins; b++) {
    var w = 2 * Math.PI * (b / (bins - 1)) * top / fs, re = 0, im = 0;
    for (i = 0; i <= ORDER; i++) { re += a[i] * Math.cos(w * i); im -= a[i] * Math.sin(w * i); }
    env[b] = -10 * Math.log10(re * re + im * im + 1e-20);
  }
  res.env = env;

  /* formants: roots in the upper half plane, narrow enough, above 250 Hz */
  var rs = roots(Array.prototype.slice.call(a)), fm = [];
  for (i = 0; i < rs.length; i++) {
    var zr = rs[i][0], zi = rs[i][1];
    if (zi <= 0) continue;
    var f = Math.atan2(zi, zr) * fs / (2 * Math.PI);
    var mag = Math.sqrt(zr * zr + zi * zi);
    var bw = -Math.log(Math.max(mag, 1e-9)) * fs / Math.PI;
    if (f > 250 && f < fs / 2 - 200 && bw < 700) fm.push({ f: f, bw: bw });
  }
  fm.sort(function (p, q) { return p.f - q.f; });
  res.formants = fm;
  /* F1 of a child's vowel is at least ~350 Hz and at most ~1,200; F2 above
     ~900. Take the first formant as F1 if it is in F1's range, then the
     next two. */
  var k = 0;
  if (fm.length && fm[0].f < 1250) k = 1;
  if (fm.length > k) res.f2 = fm[k].f;
  if (fm.length > k + 1) res.f3 = fm[k + 1].f;
  return res;
}

/* A rolling median, to steady a number that jumps frame to frame. */
function Smoother(size) { this.size = size || 5; this.buf = []; }
Smoother.prototype.push = function (v) {
  this.buf.push(v); if (this.buf.length > this.size) this.buf.shift();
  var s = this.buf.slice().sort(function (p, q) { return p - q; });
  return s[s.length >> 1];
};
Smoother.prototype.clear = function () { this.buf = []; };

/* Bring the microphone's rate (44.1 or 48 kHz) down to about 12 kHz by
   taking every nth sample. The page puts a 5 kHz low-pass in front of this,
   so nothing above the new top folds back down. */
function decimate(buf, factor) {
  var out = new Float32Array(Math.floor(buf.length / factor));
  for (var i = 0; i < out.length; i++) out[i] = buf[i * factor];
  return out;
}

var api = { analyze: analyze, lpc: lpc, roots: roots, voicing: voicing, decimate: decimate, Smoother: Smoother, ORDER: ORDER };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.RDSP = api;
})(this);
