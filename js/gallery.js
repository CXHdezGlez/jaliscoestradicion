/* Interactive Gallery Lightbox - Jalisco Es Tradición */

document.addEventListener('DOMContentLoaded', () => {
  initGallery();
});

function initGallery() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');

  if (!galleryItems.length || !lightboxModal) return;

  let origen = null;

  function abrir(item) {
    const img = item.querySelector('img');
    const alt = img ? img.getAttribute('alt') || img.getAttribute('data-alt') : 'Jalisco Es Tradición';
    if (lightboxImg && img) {
      lightboxImg.src = img.src;
      lightboxImg.alt = alt;
    }
    if (lightboxCaption) lightboxCaption.textContent = alt;

    origen = item;
    lightboxModal.classList.remove('hidden');
    lightboxModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    lightboxClose?.focus();
  }

  function cerrar() {
    if (lightboxModal.classList.contains('hidden')) return;
    lightboxModal.classList.add('hidden');
    lightboxModal.classList.remove('flex');
    document.body.style.overflow = '';
    // El foco regresa a la foto que abrió el visor
    origen?.focus();
  }

  galleryItems.forEach(item => {
    item.addEventListener('click', () => abrir(item));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrir(item);
      }
    });
  });

  lightboxClose?.addEventListener('click', cerrar);

  lightboxModal.addEventListener('click', (e) => {
    if (e.target === lightboxModal) cerrar();
  });

  document.addEventListener('keydown', (e) => {
    if (lightboxModal.classList.contains('hidden')) return;
    if (e.key === 'Escape') {
      cerrar();
    } else if (e.key === 'Tab') {
      // Único control dentro del visor: el foco se queda en "Cerrar"
      e.preventDefault();
      lightboxClose?.focus();
    }
  });
}
