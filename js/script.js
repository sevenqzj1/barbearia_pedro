'use strict';

const SITE_CONFIG = {
  // Configure com o telefone oficial: DDI + DDD + número, somente dígitos.
  // Exemplo de formato: 5534999999999. Não use um número fictício.
  whatsappNumber: '',
  businessName: 'Pedro Barber'
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
document.documentElement.classList.add('js-enabled');

const year = document.querySelector('#current-year');
if (year) year.textContent = String(new Date().getFullYear());

const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('#main-nav');

function closeMenu({ restoreFocus = false } = {}) {
  if (!menuToggle || !mainNav) return;
  mainNav.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menu de navegação');
  if (restoreFocus) menuToggle.focus();
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const willOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(willOpen));
    menuToggle.setAttribute('aria-label', willOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    mainNav.classList.toggle('is-open', willOpen);
  });

  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => closeMenu());
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mainNav.classList.contains('is-open')) {
      closeMenu({ restoreFocus: true });
    }
  });

  document.addEventListener('click', event => {
    if (mainNav.classList.contains('is-open') &&
        !mainNav.contains(event.target) &&
        !menuToggle.contains(event.target)) closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) closeMenu();
  }, { passive: true });
}

const header = document.querySelector('.site-header');
const progressBar = document.querySelector('#scroll-progress-bar');
let scrollScheduled = false;

function updateScrollUI() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (header) header.classList.toggle('is-scrolled', scrollTop > 28);
  if (progressBar) {
    const progress = scrollable > 0 ? Math.min(1, Math.max(0, scrollTop / scrollable)) : 0;
    progressBar.style.transform = 'scaleX(' + progress + ')';
  }
  scrollScheduled = false;
}

window.addEventListener('scroll', () => {
  if (scrollScheduled) return;
  window.requestAnimationFrame(updateScrollUI);
  scrollScheduled = true;
}, { passive: true });
updateScrollUI();

const revealElements = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealElements.forEach(element => element.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
  revealElements.forEach(element => revealObserver.observe(element));
}

const navLinks = Array.from(document.querySelectorAll('.main-nav a[href^="#"]'));
const navSections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window && navSections.length) {
  const activeSectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        const active = link.getAttribute('href') === '#' + entry.target.id;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-30% 0px -58% 0px' });
  navSections.forEach(section => activeSectionObserver.observe(section));
}

const hero = document.querySelector('.hero');
if (hero && finePointer && !reduceMotion) {
  let pointerScheduled = false;
  hero.addEventListener('pointermove', event => {
    if (pointerScheduled) return;
    pointerScheduled = true;
    window.requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        hero.style.setProperty('--mouse-x', ((event.clientX - rect.left) / rect.width * 100) + '%');
        hero.style.setProperty('--mouse-y', ((event.clientY - rect.top) / rect.height * 100) + '%');
      }
      pointerScheduled = false;
    });
  }, { passive: true });
}

const toast = document.querySelector('#site-toast');
let toastTimeout;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove('is-visible'), 4500);
}

function getWhatsAppUrl(message) {
  const number = SITE_CONFIG.whatsappNumber.replace(/\D/g, '');
  if (!number) return null;
  return 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
}

document.querySelectorAll('.whatsapp-link').forEach(link => {
  link.addEventListener('click', event => {
    if (SITE_CONFIG.whatsappNumber.replace(/\D/g, '')) return;
    event.preventDefault();
    document.querySelector('#agendar')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    const feedback = document.querySelector('#form-feedback');
    if (feedback) feedback.textContent = 'O contato oficial da barbearia ainda precisa ser configurado para abrir o WhatsApp.';
    showToast('Para ativar o agendamento, configure o telefone oficial em js/script.js.');
  });
});

const bookingForm = document.querySelector('#booking-form');
const feedback = document.querySelector('#form-feedback');
const dateField = document.querySelector('#booking-date');

function getLocalDateValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

if (dateField) dateField.min = getLocalDateValue();

if (bookingForm) {
  bookingForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!bookingForm.reportValidity()) return;

    const data = new FormData(bookingForm);
    const name = String(data.get('nome') || '').trim();
    const service = String(data.get('servico') || '').trim();
    const dateValue = String(data.get('dia') || '').trim();
    const period = String(data.get('horario') || '').trim();

    if (!name || !service || !dateValue || !period) {
      if (feedback) feedback.textContent = 'Preencha todos os campos para preparar a solicitação.';
      return;
    }

    if (dateValue < getLocalDateValue()) {
      if (feedback) feedback.textContent = 'Escolha uma data de hoje em diante.';
      if (dateField) dateField.focus();
      return;
    }

    const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'long',
      timeZone: 'UTC'
    }).format(new Date(dateValue + 'T12:00:00Z'));

    const message = [
      'Olá! Gostaria de consultar a disponibilidade na ' + SITE_CONFIG.businessName + '.',
      'Nome: ' + name,
      'Serviço: ' + service,
      'Dia preferido: ' + dateFormatted,
      'Período: ' + period,
      'Podem confirmar se há horário disponível?'
    ].join('\n');

    const url = getWhatsAppUrl(message);
    if (!url) {
      const warning = 'O telefone oficial ainda não foi configurado. A solicitação não foi enviada. Configure o número em js/script.js.';
      if (feedback) feedback.textContent = warning;
      showToast('O WhatsApp ainda não está configurado. Nenhuma solicitação foi enviada.');
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();

    if (feedback) feedback.textContent = 'Mensagem preparada no WhatsApp. O horário depende da confirmação da barbearia.';
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
