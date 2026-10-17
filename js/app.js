/* Core Application Script - Jalisco Es Tradición */

document.addEventListener('DOMContentLoaded', () => {
  initHeroVideo();
  initNavigation();
  initFaqAccordion();
  initScrollEffects();
  initScrollSpy();
});

// Video del hero: solo en pantallas de tablet o mayores, sin ahorro de datos ni movimiento reducido
function initHeroVideo() {
  const video = document.getElementById('hero-video');
  if (!video || !video.dataset.src) return;
  const pantallaGrande = window.matchMedia('(min-width: 768px)').matches;
  const ahorroDatos = navigator.connection && navigator.connection.saveData;
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!pantallaGrande || ahorroDatos || sinMovimiento) return;
  video.src = video.dataset.src;
  video.autoplay = true;
  video.play().catch(() => { /* si el navegador bloquea la reproducción, queda el póster */ });
}

// Mobile Navigation Logic
function initNavigation() {
  const menuToggle = document.getElementById('menu-toggle');
  const menuClose = document.getElementById('menu-close');
  const mobileMenu = document.getElementById('mobile-menu');
  const actionBar = document.getElementById('mobile-action-bar');
  const navLinks = document.querySelectorAll('#mobile-menu a, nav a[href^="#"], #mobile-action-bar a[href^="#"]');

  function onMenuKeydown(e) {
    if (e.key === 'Escape') {
      closeMenu();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...mobileMenu.querySelectorAll('a[href], button')];
    const primero = items[0];
    const ultimo = items[items.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }

  function openMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('hidden');
    mobileMenu.classList.add('flex');
    document.body.style.overflow = 'hidden';
    menuToggle?.setAttribute('aria-expanded', 'true');
    document.addEventListener('keydown', onMenuKeydown);
    mobileMenu.querySelector('a')?.focus();
  }

  function closeMenu({ restoreFocus = true } = {}) {
    if (!mobileMenu || mobileMenu.classList.contains('hidden')) return;
    mobileMenu.classList.add('hidden');
    mobileMenu.classList.remove('flex');
    document.body.style.overflow = '';
    menuToggle?.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onMenuKeydown);
    if (restoreFocus) menuToggle?.focus();
  }

  menuToggle?.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', () => closeMenu());
  // El menú es solo para celular y tablet: si la pantalla crece con el menú abierto, se cierra
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
    if (e.matches) closeMenu({ restoreFocus: false });
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          closeMenu({ restoreFocus: false });
          targetElement.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        }
      }
    });
  });

  // "Apartar" no tiene sentido dentro del formulario: se oculta y WhatsApp ocupa su lugar
  const barApartar = document.getElementById('bar-apartar');
  const reservacion = document.getElementById('reservacion');
  if (barApartar && reservacion && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entrada]) => {
      barApartar.hidden = entrada.isIntersecting;
    }, { threshold: 0.05 }).observe(reservacion);
  }

  // La barra inferior se retira mientras el teclado del celular está abierto sobre un campo
  if (actionBar) {
    const esCampo = (el) => el && el.matches && el.matches('input, select, textarea');
    document.addEventListener('focusin', (e) => {
      if (esCampo(e.target)) actionBar.classList.add('mobile-bar-oculta');
    });
    document.addEventListener('focusout', (e) => {
      if (esCampo(e.target) && !esCampo(e.relatedTarget)) actionBar.classList.remove('mobile-bar-oculta');
    });
  }
}

// FAQ Accordion Logic
function initFaqAccordion() {
  const faqButtons = document.querySelectorAll('.faq-button');

  faqButtons.forEach(button => button.setAttribute('aria-expanded', 'false'));

  faqButtons.forEach(button => {
    button.addEventListener('click', () => {
      const answer = button.nextElementSibling;
      const icon = button.querySelector('.material-symbols-outlined');
      const isOpen = answer.classList.contains('open');

      // Close all other FAQs
      document.querySelectorAll('.faq-answer').forEach(el => el.classList.remove('open'));
      faqButtons.forEach(b => b.setAttribute('aria-expanded', 'false'));
      document.querySelectorAll('.faq-button .material-symbols-outlined').forEach(i => {
        i.style.transform = 'rotate(0deg)';
      });

      if (!isOpen) {
        answer.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    });
  });
}

// Scroll Effects Header
function initScrollEffects() {
  const navbar = document.querySelector('nav');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
      navbar.classList.add('shadow-2xl', 'bg-background/95');
    } else {
      navbar.classList.remove('shadow-2xl', 'bg-background/95');
    }
  });
}

// Marca en la navegación la sección que está en pantalla
function initScrollSpy() {
  const links = document.querySelectorAll('nav .nav-link[href^="#"]');
  if (!links.length) return;
  // Todas las secciones con id: las que no tienen enlace en el menú (testimonios, preguntas) limpian la marca
  const secciones = [...document.querySelectorAll('main section[id]')];
  const marcar = (id) => links.forEach(a => {
    if (a.getAttribute('href') === id) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  });
  // La sección activa es la última cuyo inicio ya pasó la mitad de la pantalla;
  // al llegar al final de la página se marca la última. Funciona también con saltos de ancla.
  let pendiente = false;
  const actualizar = () => {
    pendiente = false;
    const mitad = window.innerHeight / 2;
    const alFinal = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    let actual = secciones[0];
    if (alFinal) actual = secciones[secciones.length - 1];
    else secciones.forEach(s => { if (s.getBoundingClientRect().top <= mitad) actual = s; });
    if (actual) marcar('#' + actual.id);
  };
  window.addEventListener('scroll', () => {
    if (!pendiente) { pendiente = true; requestAnimationFrame(actualizar); }
  }, { passive: true });
  window.addEventListener('resize', actualizar);
  actualizar();
}

// Revelado suave de secciones al entrar en pantalla (el CSS lo desactiva con movimiento reducido)
(function () {
  const secciones = document.querySelectorAll('.revelar');
  if (!secciones.length) return;
  if (!('IntersectionObserver' in window)) {
    secciones.forEach(s => s.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  secciones.forEach(s => obs.observe(s));
  // Al llegar por un enlace (#reservacion, etc.) la sección destino se muestra de inmediato
  if (location.hash) {
    const destino = document.querySelector(location.hash);
    const sec = destino && destino.closest('.revelar');
    if (sec) sec.classList.add('visible');
  }
})();
