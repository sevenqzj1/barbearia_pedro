'use strict';

const SITE_CONFIG = {
  whatsappNumber: '', // Ex.: 5534999999999 — somente números, com DDI e DDD.
  businessName: 'Pedro Barber'
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
document.documentElement.classList.add('js-enabled');

const year = document.querySelector('#current-year');
if (year) year.textContent = String(new Date().getFullYear());

const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('#main-nav');

function closeMenu() {
  if (!menuToggle || !mainNav) return;
  mainNav.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menu');
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    mainNav.classList.toggle('is-open', open);
  });
  mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  document.addEventListener('click', event => {
    if (mainNav.classList.contains('is-open') &&
        !mainNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });
}

const header = document.querySelector('.site-header');
const progressBar = document.querySelector('#scroll-progress-bar');
let scrollTicking = false;

function updateScrollUI() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (header) header.classList.toggle('is-scrolled', scrollTop > 28);
  if (progressBar) progressBar.style.transform = `scaleX(${scrollable > 0 ? Math.min(1, scrollTop / scrollable) : 0})`;
  scrollTicking = false;
}

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    window.requestAnimationFrame(updateScrollUI);
    scrollTicking = true;
  }
}, { passive: true });
updateScrollUI();

const revealElements = [...document.querySelectorAll('.reveal')];
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealElements.forEach(element => element.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
  revealElements.forEach(element => revealObserver.observe(element));
}

const navLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
const navSections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window && navSections.length) {
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-34% 0px -56% 0px' });
  navSections.forEach(section => sectionObserver.observe(section));
}

const hero = document.querySelector('.hero');
if (hero && finePointer && !reduceMotion) {
  let pointerFrame = false;
  hero.addEventListener('pointermove', event => {
    if (pointerFrame) return;
    pointerFrame = true;
    window.requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--mouse-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      hero.style.setProperty('--mouse-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
      pointerFrame = false;
    });
  }, { passive: true });

  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(850px) rotateX(${(-y * 2).toFixed(2)}deg) rotateY(${(x * 2.4).toFixed(2)}deg) translateY(-2px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  document.querySelectorAll('.magnetic').forEach(button => {
    button.addEventListener('pointermove', event => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${(x * 0.045).toFixed(2)}px, ${(y * 0.07).toFixed(2)}px)`;
    });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });
}

const toast = document.querySelector('#site-toast');
let toastTimeout;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove('is-visible'), 5200);
}

function whatsappUrl(message) {
  const number = SITE_CONFIG.whatsappNumber.replace(/\D/g, '');
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

document.querySelectorAll('.whatsapp-link').forEach(link => {
  link.addEventListener('click', event => {
    if (!SITE_CONFIG.whatsappNumber.replace(/\D/g, '')) {
      event.preventDefault();
      document.querySelector('#agendar')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      showToast('O WhatsApp será ativado quando o número oficial da barbearia for configurado.');
    }
  });
});

const bookingForm = document.querySelector('#booking-form');
const feedback = document.querySelector('#form-feedback');
const dateField = document.querySelector('#booking-date');

if (dateField) {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateField.min = localDate;
}

if (bookingForm) {
  bookingForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!bookingForm.reportValidity()) return;

    const data = new FormData(bookingForm);
    const name = String(data.get('nome') || '').trim();
    const service = String(data.get('servico') || '').trim();
    const dateValue = String(data.get('dia') || '').trim();
    const period = String(data.get('horario') || '').trim();
    const dateFormatted = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' })
      .format(new Date(`${dateValue}T12:00:00Z`));

    const message = [
      `Olá! Gostaria de consultar a disponibilidade na ${SITE_CONFIG.businessName}.`,
      `Nome: ${name}`,
      `Serviço: ${service}`,
      `Dia preferido: ${dateFormatted}`,
      `Período: ${period}`,
      'Podem confirmar se há horário disponível?'
    ].join('\n');

    const url = whatsappUrl(message);
    if (!url) {
      const warning = 'Antes de publicar, configure o número oficial no início de js/script.js.';
      if (feedback) feedback.textContent = warning;
      showToast(warning);
      return;
    }

    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (feedback) feedback.textContent = opened
      ? 'Mensagem preparada no WhatsApp. O horário depende da confirmação da barbearia.'
      : 'Se o WhatsApp não abriu, verifique se o navegador bloqueou a nova aba.';
    if (!opened) window.location.href = url;
  });
}

const lightbox = document.querySelector('#gallery-lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');

if (lightbox && lightboxImage && lightboxCaption) {
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const image = item.querySelector('img');
      if (!image) return;
      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = item.dataset.lightboxAlt || image.alt;
      lightboxCaption.textContent = item.dataset.lightboxCaption || '';
      if (typeof lightbox.showModal === 'function') lightbox.showModal();
    });
  });
  document.querySelector('.lightbox-close')?.addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('close', () => lightboxImage.removeAttribute('src'));
}

window.addEventListener('resize', () => {
  if (window.innerWidth > 760) closeMenu();
}, { passive: true });
