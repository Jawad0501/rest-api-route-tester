/**
 * REST API Route Tester — static site
 * Mobile nav + optional enhancements. Safe with JS disabled (nav links still work if duplicated in footer later).
 */
(function () {
  'use strict';

  var toggle = document.querySelector('.site-nav__toggle');
  var nav = document.querySelector('.site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();
