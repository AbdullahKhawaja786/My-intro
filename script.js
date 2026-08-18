(function() {
'use strict';

// Signal that JS is running - removes no-js fallback styles
document.documentElement.classList.remove('no-js');

var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.getElementById('year').textContent = new Date().getFullYear();

// Always register ScrollTrigger - used for nav highlight even with reducedMotion
gsap.registerPlugin(ScrollTrigger);

/* ── HAMBURGER ── */
var hamburger = document.querySelector('.hamburger');
var mobileMenu = document.getElementById('mobile-menu');
var mobileLinks = mobileMenu.querySelectorAll('a');

function openMenu() {
  hamburger.setAttribute('aria-expanded', 'true');
  mobileMenu.classList.add('open');
  document.body.style.overflow = 'hidden';
  // Move focus to first link
  var firstLink = mobileMenu.querySelector('a');
  if (firstLink) firstLink.focus();
}
function closeMenu() {
  hamburger.setAttribute('aria-expanded', 'false');
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
  hamburger.focus();
}

hamburger.addEventListener('click', function() {
  var isOpen = this.getAttribute('aria-expanded') === 'true';
  isOpen ? closeMenu() : openMenu();
});

mobileLinks.forEach(function(link) {
  link.addEventListener('click', closeMenu);
});

// Escape key closes menu
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
    closeMenu();
  }
});

// Focus trap inside mobile menu
mobileMenu.addEventListener('keydown', function(e) {
  if (e.key !== 'Tab') return;
  var focusable = Array.from(mobileMenu.querySelectorAll('a'));
  var first = focusable[0];
  var last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
});

/* ── CURSOR (desktop only, respects reduced motion) ── */
if (!reducedMotion && window.matchMedia('(hover: hover)').matches) {
  var cursor = document.getElementById('cursor');
  var ring = document.getElementById('cursor-ring');
  var mx = window.innerWidth / 2, my = window.innerHeight / 2;
  var rx = mx, ry = my;

  document.addEventListener('mousemove', function(e) {
    mx = e.clientX; my = e.clientY;
    gsap.to(cursor, { x: mx, y: my, duration: 0.08 });
  });

  (function animRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animRing);
  })();

  document.querySelectorAll('a, button, .project-card, .skill-category, .contact-link').forEach(function(el) {
    el.addEventListener('mouseenter', function() {
      gsap.to(cursor, { width: 4, height: 4, duration: 0.2 });
      gsap.to(ring, { width: 48, height: 48, duration: 0.2 });
    });
    el.addEventListener('mouseleave', function() {
      gsap.to(cursor, { width: 8, height: 8, duration: 0.2 });
      gsap.to(ring, { width: 32, height: 32, duration: 0.2 });
    });
  });
}

/* ── GALAXY (THREE.JS) ── */
var canvas = document.getElementById('galaxy-canvas');
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: "low-power" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x03020a, 1);

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 3, 8);

var params = {
  count: window.innerWidth < 768 ? 22000 : 46000,
  radius: 6,
  branches: 5,
  spin: 1.2,
  randomness: 0.4,
  randomnessPower: 2.8,
  insideColor: '#67e8f9',
  outsideColor: '#6b21a8'
};

var galaxyGeo, galaxyMat, galaxyPoints;

function buildGalaxy() {
  if (galaxyPoints) {
    galaxyGeo.dispose();
    galaxyMat.dispose();
    scene.remove(galaxyPoints);
  }

  galaxyGeo = new THREE.BufferGeometry();
  var positions = new Float32Array(params.count * 3);
  var colors = new Float32Array(params.count * 3);
  var colorInside = new THREE.Color(params.insideColor);
  var colorOutside = new THREE.Color(params.outsideColor);

  for (var i = 0; i < params.count; i++) {
    var i3 = i * 3;
    var radius = Math.random() * params.radius;
    var spinAngle = radius * params.spin;
    var branchAngle = (i % params.branches) / params.branches * Math.PI * 2;

    var randX = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius;
    var randY = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius * 0.3;
    var randZ = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius;

    positions[i3]     = Math.cos(branchAngle + spinAngle) * radius + randX;
    positions[i3 + 1] = randY;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randZ;

    var mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, radius / params.radius);
    colors[i3]     = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }

  galaxyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  galaxyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  galaxyMat = new THREE.PointsMaterial({
    size: 0.019,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  });

  galaxyPoints = new THREE.Points(galaxyGeo, galaxyMat);
  scene.add(galaxyPoints);
}

buildGalaxy();

/* Nebula clouds */
function addNebula(x, y, z, color, size) {
  var geo = new THREE.SphereGeometry(size, 8, 8);
  var mat = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.04,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  var mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
}
addNebula(-3, 0.5, -2, 0x6b21a8, 3);
addNebula(4, -0.3, 1, 0x1d4ed8, 2.5);
addNebula(0, 0.8, -4, 0x67e8f9, 2);

/* Scroll-driven galaxy rotation - single consolidated listener */
var targetRotX = 0, targetRotY = 0;
var currentRotX = 0, currentRotY = 0;
var mouseOffsetX = 0, mouseOffsetY = 0;
var targetZ = 8;

window.addEventListener('scroll', function() {
  var scrollH = Math.max(1, document.body.scrollHeight - window.innerHeight);
  var p = window.scrollY / scrollH;
  targetRotY = p * Math.PI * 2;
  targetRotX = p * Math.PI * 0.4;
  targetZ = 8 - p * 2.5;
}, { passive: true });

if (!reducedMotion) {
  document.addEventListener('mousemove', function(e) {
    mouseOffsetX = (e.clientX / window.innerWidth - 0.5) * 0.3;
    mouseOffsetY = (e.clientY / window.innerHeight - 0.5) * 0.15;
  });
}

/* Pause animation when tab is hidden */
var clock = new THREE.Clock();
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    clock.stop();
  } else {
    clock.start();
  }
});

function animate() {
  requestAnimationFrame(animate);

  if (reducedMotion) {
    renderer.render(scene, camera);
    return;
  }

  var elapsed = clock.getElapsedTime();

  currentRotX += (targetRotX + mouseOffsetY * 0.5 - currentRotX) * 0.04;
  currentRotY += (targetRotY + mouseOffsetX + elapsed * 0.04 - currentRotY) * 0.03;
  camera.position.z += (targetZ - camera.position.z) * 0.05;

  galaxyPoints.rotation.x = currentRotX;
  galaxyPoints.rotation.y = currentRotY;

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ── ENTRANCE ANIMATIONS ── */
if (reducedMotion) {
  document.querySelectorAll('.nav-logo, .nav-links, .hero-photo, .hero-name, .hero-role, .hero-role-sub, .hero-claim, .hero-cta, .scroll-hint, .reveal').forEach(function(el) {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
} else {
  gsap.to('.nav-logo', { opacity: 1, duration: 1, delay: 0.5 });
  gsap.to('.nav-links', { opacity: 1, duration: 1, delay: 0.7 });

  var heroTl = gsap.timeline({ delay: 0.3 });
  heroTl
    .fromTo('.hero-photo',    { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'power3.out' })
    .fromTo('.hero-name',     { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, '-=0.3')
    .fromTo('.hero-role',     { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.4')
    .fromTo('.hero-role-sub', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, '-=0.3')
    .fromTo('.hero-claim',    { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.2')
    .fromTo('.hero-cta',      { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.3')
    .fromTo('.scroll-hint',   { opacity: 0 },         { opacity: 1, duration: 0.6 }, '+=0.3');

  /* Scroll reveals */
  document.querySelectorAll('.reveal').forEach(function(el) {
    gsap.fromTo(el,
      { y: 40, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true
        }
      }
    );
  });
}

/* Hide scroll hint after first scroll */
window.addEventListener('scroll', function hideHint() {
  if (!reducedMotion) {
    gsap.to('.scroll-hint', { opacity: 0, duration: 0.4 });
  }
  window.removeEventListener('scroll', hideHint);
}, { passive: true });

/* Project card mouse glow */
document.querySelectorAll('.project-card').forEach(function(card) {
  card.addEventListener('mousemove', function(e) {
    var rect = card.getBoundingClientRect();
    var x = ((e.clientX - rect.left) / rect.width) * 100;
    var y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mx', x + '%');
    card.style.setProperty('--my', y + '%');
  });
});

/* Active nav highlight - with onLeave to un-highlight */
var sections = document.querySelectorAll('section[id]');
var navLinks = document.querySelectorAll('.nav-links a');

sections.forEach(function(sec) {
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 60%',
    end: 'bottom 40%',
    onEnter: function() { highlight(sec.id); },
    onEnterBack: function() { highlight(sec.id); },
    onLeave: function() { highlight(''); },
    onLeaveBack: function() { highlight(''); }
  });
});

function highlight(id) {
  navLinks.forEach(function(a) {
    a.style.color = a.getAttribute('href') === '#' + id ? 'var(--star-cyan)' : '';
  });
}

/* ── DISMISS LOADER ── */
// Dismiss loader, runs at end of script so page is ready
var loaderEl = document.getElementById('loader');
if (loaderEl) { loaderEl.classList.add('hidden'); }

})();

/* ── GITHUB LIVE STATS ── */
(function() {
  var repoCountEl = document.getElementById('gh-repo-count');
  var langCountEl = document.getElementById('gh-lang-count');
  var reposListEl = document.getElementById('github-repos-list');
  var aboutRepoEl = document.getElementById('stat-gh-repos');
  var aboutLangEl = document.getElementById('stat-gh-langs');

  if (!repoCountEl) return;

  fetch('https://api.github.com/users/AbdullahKhawaja786/repos?per_page=100')
    .then(function(res) {
      if (!res.ok) throw new Error('GitHub API error');
      return res.json();
    })
    .then(function(repos) {
      var nonForks = repos.filter(function(r) { return !r.fork; });
      repoCountEl.textContent = nonForks.length;
      if (aboutRepoEl) aboutRepoEl.textContent = nonForks.length;

      var languages = {};
      nonForks.forEach(function(r) {
        if (r.language) languages[r.language] = true;
      });
      var langCount = Object.keys(languages).length;
      langCountEl.textContent = langCount;
      if (aboutLangEl) aboutLangEl.textContent = langCount;

      if (reposListEl) {
        var sorted = nonForks.slice().sort(function(a, b) {
          return new Date(b.updated_at) - new Date(a.updated_at);
        }).slice(0, 5);

        reposListEl.innerHTML = '';
        sorted.forEach(function(r) {
          var item = document.createElement('div');
          item.className = 'github-repo-item';

          var name = document.createElement('span');
          name.className = 'github-repo-name';
          name.textContent = r.name;

          var lang = document.createElement('span');
          lang.className = 'github-repo-lang';
          lang.textContent = r.language || 'N/A';

          item.appendChild(name);
          item.appendChild(lang);
          reposListEl.appendChild(item);
        });
      }
    })
    .catch(function() {
      repoCountEl.textContent = 'N/A';
      langCountEl.textContent = 'N/A';
      if (aboutRepoEl) aboutRepoEl.textContent = 'N/A';
      if (aboutLangEl) aboutLangEl.textContent = 'N/A';
    });
})();
