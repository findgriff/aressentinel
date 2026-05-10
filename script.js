/* =========================================================
   Ares Sentinel — Site interactions
   • Loader / page entry
   • Custom cursor (with link/cta states)
   • Scroll progress
   • Sticky header state
   • Mobile nav
   • Smooth scroll
   • IntersectionObserver reveals (with stagger + per-element triggers)
   • 3D tilt cards (with mouse-position glow)
   • Magnetic buttons
   • Animated number counters
   • Animated SVG sparklines / progress bars
   • Floating-label fix for selects
   • Contact form validation + mailto
   ========================================================= */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isCoarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initLoader();
    initYear();
    initHeaderScrollState();
    initScrollProgress();
    initMobileNav();
    initSmoothScroll();
    initCustomCursor();
    initRevealOnScroll();
    initTiltCards();
    initMagneticButtons();
    initCountUp();
    initSparkAndBars();
    initSelectFloatFix();
    initContactForm();
  }

  /* ========================================================
     LOADER — fade out after assets are settled
     ======================================================== */
  function initLoader() {
    var loader = document.getElementById('loader');
    if (!loader) return;

    var hide = function () {
      loader.classList.add('is-hidden');
      document.body.classList.add('is-loaded');
    };

    if (document.readyState === 'complete') {
      setTimeout(hide, 750);
    } else {
      window.addEventListener('load', function () {
        setTimeout(hide, prefersReducedMotion ? 0 : 750);
      });
    }
    // Hard fallback
    setTimeout(hide, 3500);
  }

  /* ========================================================
     YEAR
     ======================================================== */
  function initYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ========================================================
     HEADER scroll state
     ======================================================== */
  function initHeaderScrollState() {
    var header = document.getElementById('siteHeader');
    if (!header) return;

    var update = function () {
      if (window.scrollY > 8) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ========================================================
     SCROLL PROGRESS bar
     ======================================================== */
  function initScrollProgress() {
    var bar = document.querySelector('#scrollProgress span');
    if (!bar) return;

    var ticking = false;
    var update = function () {
      var doc = document.documentElement;
      var max = (doc.scrollHeight - doc.clientHeight) || 1;
      var pct = (window.scrollY / max) * 100;
      bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
    update();
  }

  /* ========================================================
     MOBILE NAV
     ======================================================== */
  function initMobileNav() {
    var btn = document.querySelector('.nav-toggle');
    var panel = document.getElementById('mobileNav');
    if (!btn || !panel) return;

    var setOpen = function (open) {
      btn.setAttribute('aria-expanded', String(open));
      if (open) {
        panel.hidden = false;
        requestAnimationFrame(function () {
          panel.style.maxHeight = panel.scrollHeight + 'px';
        });
      } else {
        panel.style.maxHeight = '';
        panel.hidden = true;
      }
    };

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      setOpen(!open);
    });

    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });

    var mq = window.matchMedia('(min-width: 761px)');
    mq.addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  }

  /* ========================================================
     SMOOTH SCROLL
     ======================================================== */
  function initSmoothScroll() {
    var header = document.getElementById('siteHeader');

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (!href || href === '#') return;
        var target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        var headerH = header ? header.offsetHeight : 0;
        var top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;

        window.scrollTo({
          top: top,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });

        if (history.pushState) history.pushState(null, '', href);
      });
    });
  }

  /* ========================================================
     CUSTOM CURSOR
     ======================================================== */
  function initCustomCursor() {
    if (isCoarse) return;
    var cursor = document.getElementById('cursor');
    var dot = cursor && cursor.querySelector('.cursor-dot');
    var ring = cursor && cursor.querySelector('.cursor-ring');
    if (!cursor || !dot || !ring) return;

    document.body.classList.add('cursor-ready');

    var mx = window.innerWidth / 2;
    var my = window.innerHeight / 2;
    var rx = mx, ry = my;     // ring trails the dot

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    }, { passive: true });

    var animate = function () {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    // Hide near edges (out of viewport)
    document.addEventListener('mouseleave', function () {
      document.body.classList.add('cursor-hidden');
    });
    document.addEventListener('mouseenter', function () {
      document.body.classList.remove('cursor-hidden');
    });

    // States: link / cta
    var setState = function (state) {
      document.body.classList.remove('cursor-link', 'cursor-cta');
      if (state) document.body.classList.add('cursor-' + state);
    };
    var bind = function (selector, state) {
      document.querySelectorAll(selector).forEach(function (el) {
        el.addEventListener('mouseenter', function () { setState(state); });
        el.addEventListener('mouseleave', function () { setState(null); });
      });
    };
    bind('[data-cursor="cta"], .btn', 'cta');
    bind('[data-cursor="link"], a:not(.btn), input, select, textarea, button', 'link');
  }

  /* ========================================================
     REVEAL ON SCROLL — with stagger per group
     ======================================================== */
  function initRevealOnScroll() {
    if (!('IntersectionObserver' in window)) return;

    // Sections / large elements
    var blockTargets = document.querySelectorAll(
      '.section-head, .crm-copy, .crm-visual, .pull-quote .container, ' +
      '.cta-strip-inner, .contact-copy, .contact-form, ' +
      '.hero-edge, .marquee-strip'
    );
    blockTargets.forEach(function (el) { el.classList.add('reveal'); });

    var blockIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          blockIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    blockTargets.forEach(function (el) { blockIO.observe(el); });

    // Card grids — stagger the children
    var groups = document.querySelectorAll(
      '.problem-grid, .services-grid, .ai-grid, .why-grid, .process-list, .crm-features'
    );
    var cardIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var children = entry.target.querySelectorAll(':scope > *');
          children.forEach(function (c, i) {
            c.style.transitionDelay = Math.min(i * 70, 480) + 'ms';
            c.classList.add('is-visible');
          });
          cardIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    groups.forEach(function (group) {
      var children = group.querySelectorAll(':scope > *');
      children.forEach(function (c) { c.classList.add('reveal'); });
      cardIO.observe(group);
    });
  }

  /* ========================================================
     3D TILT — also drives --mx/--my for radial glow on cards
     ======================================================== */
  function initTiltCards() {
    if (isCoarse || prefersReducedMotion) return;
    var els = document.querySelectorAll('.tilt');
    var max = 6; // degrees

    els.forEach(function (el) {
      var rect, raf;
      var update = function (e) {
        rect = rect || el.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top) / rect.height;
        var rotY = (x - 0.5) * (max * 2);
        var rotX = (0.5 - y) * (max * 2);
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          el.style.setProperty('--tilt-y', rotY.toFixed(2) + 'deg');
          el.style.setProperty('--tilt-x', rotX.toFixed(2) + 'deg');
          el.style.setProperty('--tilt-y-offset', '-2px');
          el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
          el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        });
      };
      el.addEventListener('mouseenter', function () {
        rect = el.getBoundingClientRect();
      });
      el.addEventListener('mousemove', update);
      el.addEventListener('mouseleave', function () {
        rect = null;
        el.style.setProperty('--tilt-x', '0deg');
        el.style.setProperty('--tilt-y', '0deg');
        el.style.setProperty('--tilt-y-offset', '0px');
      });
    });
  }

  /* ========================================================
     MAGNETIC BUTTONS — subtle pull toward cursor
     ======================================================== */
  function initMagneticButtons() {
    if (isCoarse || prefersReducedMotion) return;
    var els = document.querySelectorAll('.magnetic');
    var strength = 0.25;
    var radius = 90;

    els.forEach(function (el) {
      var rect;
      var raf;

      el.addEventListener('mouseenter', function () {
        rect = el.getBoundingClientRect();
      });
      el.addEventListener('mousemove', function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        var dist = Math.hypot(dx, dy);
        if (dist > radius) return;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          el.style.transform = 'translate(' + (dx * strength).toFixed(1) + 'px,' + (dy * strength).toFixed(1) + 'px)';
        });
      });
      el.addEventListener('mouseleave', function () {
        rect = null;
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = '';
      });
    });
  }

  /* ========================================================
     COUNT UP — animated stat numbers
     ======================================================== */
  function initCountUp() {
    if (!('IntersectionObserver' in window)) return;
    var nums = document.querySelectorAll('[data-count-to]');
    if (!nums.length) return;

    var run = function (el) {
      var to = parseFloat(el.getAttribute('data-count-to')) || 0;
      var suffix = el.getAttribute('data-count-suffix') || '';
      var duration = 1600;
      var start = null;

      if (prefersReducedMotion) {
        el.textContent = to + suffix;
        return;
      }

      var step = function (ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        // ease-out cubic
        var eased = 1 - Math.pow(1 - progress, 3);
        var v = to * eased;
        el.textContent = (Number.isInteger(to) ? Math.round(v) : v.toFixed(1)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    nums.forEach(function (n) { io.observe(n); });
  }

  /* ========================================================
     SPARKLINES + BARS — animate when in view
     ======================================================== */
  function initSparkAndBars() {
    if (!('IntersectionObserver' in window)) return;
    var els = document.querySelectorAll('.spark, .bar');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ========================================================
     SELECT FLOAT-LABEL FIX — ensure :valid only after change
     (selects with a hidden empty option remain "invalid" until chosen,
      which keeps the label in its placeholder state)
     ======================================================== */
  function initSelectFloatFix() {
    document.querySelectorAll('.float-field select').forEach(function (sel) {
      sel.addEventListener('change', function () {
        if (sel.value) sel.classList.add('has-value');
        else sel.classList.remove('has-value');
      });
    });
  }

  /* ========================================================
     CONTACT FORM — validation + mailto fallback
     ======================================================== */
  function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;
    var status = document.getElementById('formStatus');

    var setStatus = function (msg, kind) {
      if (!status) return;
      status.textContent = msg;
      status.classList.remove('is-success', 'is-error');
      if (kind) status.classList.add('is-' + kind);
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('', '');

      var fields = form.querySelectorAll('[required]');
      var firstInvalid = null;

      fields.forEach(function (f) {
        var ok = f.checkValidity();
        if (f.type === 'checkbox') ok = f.checked;
        if (!ok) {
          f.classList.add('invalid');
          if (!firstInvalid) firstInvalid = f;
        } else {
          f.classList.remove('invalid');
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        setStatus('Please complete the highlighted fields.', 'error');
        return;
      }

      var data = new FormData(form);
      var name    = (data.get('name')    || '').toString().trim();
      var company = (data.get('company') || '').toString().trim();
      var role    = (data.get('role')    || '').toString().trim();
      var size    = (data.get('size')    || '').toString().trim();
      var email   = (data.get('email')   || '').toString().trim();
      var phone   = (data.get('phone')   || '').toString().trim();
      var message = (data.get('message') || '').toString().trim();

      var subject = 'Consultation enquiry — ' + (company || name);
      var body = [
        'Name: '    + name,
        'Company: ' + company,
        'Role: '    + role,
        'Size: '    + size,
        'Email: '   + email,
        'Phone: '   + phone,
        '',
        'Message:',
        message
      ].join('\n');

      var mailto = 'mailto:craig@aressentinel.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body='    + encodeURIComponent(body);

      window.location.href = mailto;

      setStatus('Opening your email client to send the enquiry. If nothing happens, email craig@aressentinel.com directly.', 'success');
      form.reset();
    });

    form.querySelectorAll('input, select, textarea').forEach(function (f) {
      f.addEventListener('input',  function () { f.classList.remove('invalid'); });
      f.addEventListener('change', function () { f.classList.remove('invalid'); });
    });
  }
})();
