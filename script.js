/* =========================================================
   Ember Tech — Interactions
   ========================================================= */

import { Analytics } from "@vercel/analytics/next"

document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  initMobileMenu();
  initHeaderScroll();
  initTypedText();
  initRevealOnScroll();
  initParticles();
  initCursorGlow();
  initTiltCards();
  initMagneticButtons();
  initRippleButtons();
  initContactForm();
  initEmailCopy();
});

/* ---------------- Lucide Icons ---------------- */
function initIcons() {
  if (window.lucide) lucide.createIcons();
}

/* ---------------- Mobile Menu ---------------- */
function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggle.innerHTML = isOpen
      ? '<i data-lucide="x" class="w-6 h-6"></i>'
      : '<i data-lucide="menu" class="w-6 h-6"></i>';
    initIcons();
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.innerHTML = '<i data-lucide="menu" class="w-6 h-6"></i>';
      initIcons();
    });
  });
}

/* ---------------- Header Scroll State ---------------- */
function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------------- Typed Text Effect ---------------- */
function initTypedText() {
  const el = document.getElementById('typed-text');
  if (!el) return;

  const phrases = [
    'building_intelligent_agents.py',
    'training_ml_models.py',
    'automating_workflows.sh',
    'designing_RAG_pipelines.py',
    'shipping_web_interfaces.js'
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const TYPE_SPEED = 55;
  const DELETE_SPEED = 30;
  const HOLD_TIME = 1400;

  function tick() {
    const current = phrases[phraseIndex];

    if (!deleting) {
      charIndex++;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tick, HOLD_TIME);
        return;
      }
      setTimeout(tick, TYPE_SPEED);
    } else {
      charIndex--;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(tick, 300);
        return;
      }
      setTimeout(tick, DELETE_SPEED);
    }
  }

  tick();
}

/* ---------------- Reveal on Scroll ---------------- */
function initRevealOnScroll() {
  const items = document.querySelectorAll('.reveal-up');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  items.forEach(el => observer.observe(el));
}

/* ---------------- Ambient Particle Drift (no connecting lines / no graph) ---------------- */
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, particles;
  const COUNT = 70;
  const COLORS = ['rgba(255,138,41,0.55)', 'rgba(255,255,255,0.4)', 'rgba(255,61,26,0.4)'];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = Math.max(window.innerHeight, 800);
  }

  function createParticles() {
    particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.8 + 0.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      pulse: Math.random() * Math.PI * 2
    }));
  }

  function step() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += 0.02;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      const alpha = 0.5 + 0.5 * Math.sin(p.pulse);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + alpha * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.4 + alpha * 0.4;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    if (!reduceMotion) requestAnimationFrame(step);
  }

  resize();
  createParticles();
  step();

  window.addEventListener('resize', () => {
    resize();
    createParticles();
    if (reduceMotion) step();
  });
}

/* ---------------- Trailing Ring Cursor ---------------- */
function initCursorGlow() {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring || window.matchMedia('(pointer: coarse)').matches) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    dot.classList.add('active');
    ring.classList.add('active');
  });

  document.addEventListener('mouseleave', () => {
    dot.classList.remove('active');
    ring.classList.remove('active');
  });

  document.querySelectorAll('a, button, .tilt-card, input, textarea').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
  });

  function follow() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(follow);
  }
  follow();
}

/* ---------------- 3D Tilt Cards ---------------- */
function initTiltCards() {
  const cards = document.querySelectorAll('.tilt-card');
  if (!cards.length || window.matchMedia('(pointer: coarse)').matches) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = ((y / rect.height) - 0.5) * -8;
      const rotateY = ((x / rect.width) - 0.5) * 8;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
}

/* ---------------- Magnetic Buttons ---------------- */
function initMagneticButtons() {
  const buttons = document.querySelectorAll('.magnetic-btn');
  if (!buttons.length || window.matchMedia('(pointer: coarse)').matches) return;

  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });
}

/* ---------------- Ripple Click Effect ---------------- */
function initRippleButtons() {
  const buttons = document.querySelectorAll('.btn-glow');

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });
}

/* ---------------- Contact Form Handling ---------------- */
// The contact form submits to a small local backend endpoint. In production
// you can swap this URL with a hosted server or a serverless function.
const CONTACT_ENDPOINT = window.location.protocol === 'file:'
  ? 'http://127.0.0.1:3000/api/contact'
  : '/api/contact';

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const submitBtn = document.getElementById('submit-btn');
  const submitText = document.getElementById('submit-text');
  const submitIcon = document.getElementById('submit-icon');
  const successMsg = document.getElementById('form-success');
  const failMsg = document.getElementById('form-fail');

  const validators = {
    name: v => v.trim().length >= 2,
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    subject: v => v.trim().length >= 3,
    message: v => v.trim().length >= 10
  };

  Object.keys(validators).forEach(field => {
    const input = form.elements[field];
    if (!input) return;
    input.addEventListener('blur', () => validateField(field));
    input.addEventListener('input', () => {
      if (input.closest('.form-group').classList.contains('invalid')) {
        validateField(field);
      }
    });
  });

  function validateField(field) {
    const input = form.elements[field];
    const group = input.closest('.form-group');
    const valid = validators[field](input.value);
    group.classList.toggle('invalid', !valid);
    return valid;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    successMsg.classList.add('hidden');
    if (failMsg) failMsg.classList.add('hidden');

    // Honeypot: bots fill hidden fields, humans never see them.
    if (form.elements._honey && form.elements._honey.checked) return;

    const allValid = Object.keys(validators)
      .map(validateField)
      .every(Boolean);

    if (!allValid) return;

    submitBtn.disabled = true;
    submitText.textContent = 'Sending...';
    submitIcon.setAttribute('data-lucide', 'loader-2');
    submitIcon.classList.add('animate-spin');
    initIcons();

    const resetButton = () => {
      submitText.textContent = 'Send Message';
      submitIcon.setAttribute('data-lucide', 'send');
      submitIcon.classList.remove('animate-spin');
      initIcons();
      submitBtn.disabled = false;
    };

    // Guard against a hung request (slow network, blocked by an ad-blocker,
    // etc.) so the button never spins forever.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const name = form.elements.name.value.trim();
      const email = form.elements.email.value.trim();
      const subject = form.elements.subject.value.trim();
      const message = form.elements.message.value.trim();

      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result || result.success !== true) {
        throw new Error((result && result.error) || (result && result.message) || `Submission failed with status ${response.status}`);
      }

      resetButton();
      successMsg.classList.remove('hidden');
      form.reset();
      Object.keys(validators).forEach(field => {
        form.elements[field].closest('.form-group').classList.remove('invalid');
      });
      setTimeout(() => successMsg.classList.add('hidden'), 6000);
    } catch (err) {
      console.error('Contact form submission failed:', err);
      resetButton();
      if (failMsg) {
        const messageText = failMsg.querySelector('span');
        if (messageText) {
          messageText.textContent = err.message || "Couldn't send — please email me directly at awaismeer019@gmail.com.";
        }
        failMsg.classList.remove('hidden');
      }
    } finally {
      clearTimeout(timeout);
    }
  });
}

/* ---------------- Email Copy Fallback ----------------
   mailto: links only do something visible if the OS/browser has a mail
   client configured — otherwise a click can look like "nothing happened".
   So on every click we also copy the address to the clipboard and show a
   tooltip, which always gives the visitor a working way to reach you. */
function initEmailCopy() {
  document.querySelectorAll('.email-link').forEach(link => {
    link.addEventListener('click', () => {
      const email = link.dataset.email;
      if (navigator.clipboard && email) {
        navigator.clipboard.writeText(email).catch(() => {});
      }
      link.classList.add('copied');
      setTimeout(() => link.classList.remove('copied'), 2400);
    });
  });
}
