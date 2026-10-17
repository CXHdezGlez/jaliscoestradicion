/* Form Processing & Booking Handler - Jalisco Es Tradición */

const WHATSAPP_NUMERO = '523320262503';
const BORRADOR_KEY = 'jet-reserva-borrador';
const CAMPOS_BORRADOR = ['form-evento', 'form-name', 'form-phone', 'form-email', 'form-date', 'form-time', 'form-members', 'form-duration', 'form-address', 'form-notes'];
const CAMPOS_VALIDADOS = ['form-name', 'form-phone', 'form-email', 'form-date', 'form-time', 'form-duration', 'form-address'];
const BOTON_PRINCIPAL = 'bg-primary text-black px-5 py-2.5 rounded font-label-lg uppercase tracking-wider font-bold text-sm hover:bg-white transition-colors';
const BOTON_SECUNDARIO = 'text-on-background/80 hover:text-on-background px-2 py-2.5 text-sm underline underline-offset-4';

document.addEventListener('DOMContentLoaded', () => {
  initBookingForm();
});

// ---------- Utilidades de fecha, hora y dinero (siempre en hora local de México) ----------

function fechaLocalISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseFechaLocal(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function esLunesAJueves(iso) {
  const dia = parseFechaLocal(iso).getDay();
  return dia >= 1 && dia <= 4;
}

function formatearFecha(iso) {
  return new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseFechaLocal(iso));
}

function formatearHora(hhmm) {
  const [h, min] = hhmm.split(':').map(Number);
  return new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, h, min));
}

function pesos(monto) {
  return `$${monto.toLocaleString('es-MX')} MXN`;
}

function duracionTexto(tandas) {
  const minutos = tandas * 45;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (!horas) return `${resto} min`;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

// Acepta 10 dígitos con espacios/guiones, o con prefijo +52 / +521
function normalizarTelefono(valor) {
  let digitos = valor.replace(/\D/g, '');
  if (digitos.length === 13 && digitos.startsWith('521')) digitos = digitos.slice(3);
  if (digitos.length === 12 && digitos.startsWith('52')) digitos = digitos.slice(2);
  return digitos.length === 10 ? digitos : null;
}

function unaLinea(texto) {
  return texto.replace(/\s+/g, ' ').trim();
}

// Precio por tanda de 45 min según el número de músicos (3 a 15)
const PRECIO_TANDA = { 3: 2500, 4: 3100, 5: 3700, 6: 4300, 7: 4900, 8: 5500, 9: 6100, 10: 6700, 11: 7300, 12: 7900, 13: 8500, 14: 9100, 15: 9700 };
const AGRUPACIONES_FIJAS = ['3', '5', '15'];
const PRECIOS_PUBLICADOS = [3, 5, 15];
const NOMBRES_CAMPO = {
  'form-name': 'nombre', 'form-phone': 'teléfono', 'form-email': 'correo', 'form-date': 'fecha',
  'form-time': 'hora', 'form-duration': 'duración', 'form-address': 'dirección'
};

function precioPorTanda(members) {
  return PRECIO_TANDA[members] || (2500 + (members - 3) * 600);
}

function initBookingForm() {
  const form = document.getElementById('detailed-booking-form') || document.getElementById('booking-form');
  if (!form) return;

  const campo = (id) => document.getElementById(id);
  const dateInput = campo('form-date');
  const membersSelect = campo('form-members');
  const durationSelect = campo('form-duration');
  const submitBtn = campo('form-submit');
  const quoteTotal = campo('form-quote-total');
  const quoteDetail = campo('form-quote-detail');

  const modal = campo('booking-success-modal');
  const modalTitle = campo('booking-modal-title');
  const modalDesc = campo('booking-modal-desc');
  const waLink = campo('booking-wa-link');
  const copyBtn = campo('booking-copy');
  const copyStatus = campo('booking-copy-status');
  const closeBtn = campo('booking-success-close');
  const doneBtn = campo('booking-done');

  let mensajeActual = '';
  let enviando = false;
  let focoPrevio = null;

  // ---------- Fecha mínima en hora local (permite reservar para hoy después de las 18:00) ----------
  function actualizarFechaMinima() {
    if (dateInput) dateInput.min = fechaLocalISO(new Date());
  }
  actualizarFechaMinima();
  if (dateInput) dateInput.addEventListener('focus', actualizarFechaMinima);

  // ---------- Presupuesto estimado ----------
  function cotizacion() {
    const members = parseInt(membersSelect?.value, 10) || 5;
    const duracion = durationSelect?.value || '1';

    // El paquete se publica "desde $1,899"; el precio según el número de músicos se confirma por WhatsApp
    if (duracion === 'paquete8') {
      return {
        members,
        total: 'Desde $1,899 MXN',
        detalle: `${members} músicos · Paquete de 8 canciones · lunes a jueves · sin pilón · dentro de la ZMG. El precio para ${members} músicos se confirma por WhatsApp.`,
        duracion: 'Paquete de 8 canciones (lunes a jueves)',
        presupuesto: `Paquete de 8 canciones desde $1,899 MXN; precio para ${members} músicos por confirmar`
      };
    }

    const tandas = parseInt(duracion, 10) || 1;
    const tandaTexto = `${tandas} ${tandas === 1 ? 'tanda' : 'tandas'} (${duracionTexto(tandas)} de música)`;
    const traslado = fueraDeZmg() ? ' + traslado por confirmar (fuera de la ZMG)' : '';

    // Solo 3, 5 y 15 músicos tienen precio publicado; otros tamaños se confirman por WhatsApp
    if (!PRECIOS_PUBLICADOS.includes(members)) {
      return {
        members,
        total: 'Por confirmar',
        detalle: `${members} músicos · ${tandaTexto}${traslado}. El precio para ${members} músicos te lo confirmamos por WhatsApp.`,
        duracion: tandaTexto,
        presupuesto: `Por confirmar por WhatsApp (${members} músicos)${traslado}`
      };
    }

    const porTanda = precioPorTanda(members);
    return {
      members,
      total: pesos(porTanda * tandas),
      detalle: `${members} músicos · ${tandaTexto}${traslado}`,
      duracion: tandaTexto,
      porTanda: pesos(porTanda),
      presupuesto: `${pesos(porTanda * tandas)} (${pesos(porTanda)} por tanda)${traslado}`
    };
  }

  function renderCotizacion() {
    const c = cotizacion();
    if (quoteTotal) quoteTotal.textContent = c.total;
    if (quoteDetail) quoteDetail.textContent = c.detalle;
  }

  // Opciones de agrupación (Trío / Mariachi / Gran mariachi / Otro) sincronizadas con el selector de músicos
  const grupoRadios = [...form.querySelectorAll('input[name="form-grupo"]')];
  const otroWrap = campo('form-members-otro');
  function sincronizarGrupo() {
    const valor = membersSelect?.value || '5';
    const fijo = AGRUPACIONES_FIJAS.includes(valor) && (!otroWrap || otroWrap.hidden);
    grupoRadios.forEach(r => { r.checked = fijo ? r.value === valor : r.value === 'otro'; });
    if (otroWrap) otroWrap.hidden = fijo;
  }
  grupoRadios.forEach(radio => radio.addEventListener('change', () => {
    if (!radio.checked) return;
    if (radio.value === 'otro') {
      if (otroWrap) otroWrap.hidden = false;
      if (AGRUPACIONES_FIJAS.includes(membersSelect.value)) membersSelect.value = '4';
    } else {
      if (otroWrap) otroWrap.hidden = true;
      membersSelect.value = radio.value;
    }
    membersSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }));
  membersSelect?.addEventListener('change', () => {
    if (otroWrap && !AGRUPACIONES_FIJAS.includes(membersSelect.value)) otroWrap.hidden = false;
    sincronizarGrupo();
    renderCotizacion();
  });
  durationSelect?.addEventListener('change', renderCotizacion);

  // Tipo de evento: el "Paquete entre semana" es su propia opción y fija la duración en 8 canciones
  const eventoInput = campo('form-evento');
  const eventoRadios = [...form.querySelectorAll('input[name="form-evento-opcion"]')];
  const duracionWrap = campo('form-duration-wrap');
  function aplicarEvento(valor) {
    if (eventoInput) eventoInput.value = valor || '';
    eventoRadios.forEach(r => { r.checked = r.value === valor; });
    const paquete = valor === 'Paquete entre semana';
    if (duracionWrap) duracionWrap.hidden = paquete;
    if (!durationSelect) return;
    if (paquete) durationSelect.value = 'paquete8';
    else if (durationSelect.value === 'paquete8') durationSelect.value = '1';
    durationSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }
  eventoRadios.forEach(radio => radio.addEventListener('change', () => {
    if (radio.checked) aplicarEvento(radio.value);
  }));

  // ---------- Borrador: lo escrito sobrevive a recargas, pestañas cerradas o WhatsApp bloqueado ----------
  function guardarBorrador() {
    const datos = {};
    CAMPOS_BORRADOR.forEach(id => {
      const el = campo(id);
      if (el) datos[id] = el.value;
    });
    try {
      localStorage.setItem(BORRADOR_KEY, JSON.stringify(datos));
    } catch (e) { /* almacenamiento no disponible: el formulario sigue funcionando */ }
  }

  function borrarBorrador() {
    try {
      localStorage.removeItem(BORRADOR_KEY);
    } catch (e) { /* sin almacenamiento */ }
  }

  function restaurarBorrador() {
    let datos = null;
    try {
      datos = JSON.parse(localStorage.getItem(BORRADOR_KEY) || 'null');
    } catch (e) {
      return;
    }
    if (!datos || typeof datos !== 'object') return false;
    let recuperado = false;

    CAMPOS_BORRADOR.forEach(id => {
      const el = campo(id);
      const valor = datos[id];
      if (!el || typeof valor !== 'string' || !valor) return;
      if (el.tagName === 'SELECT' && ![...el.options].some(o => o.value === valor)) return;
      if (id === 'form-date' && valor < fechaLocalISO(new Date())) return;
      el.value = valor;
      if (!['form-members', 'form-duration'].includes(id)) recuperado = true;
    });

    // Que el cotizador refleje lo recuperado
    membersSelect?.dispatchEvent(new Event('change'));
    durationSelect?.dispatchEvent(new Event('change'));
    return recuperado;
  }

  // Formulario en blanco (también lo usa "Ya lo envié")
  const avisoBorrador = campo('form-borrador-aviso');
  function empezarDeNuevo() {
    form.reset();
    borrarBorrador();
    CAMPOS_VALIDADOS.forEach(limpiarError);
    if (otroWrap) otroWrap.hidden = true;
    if (avisoBorrador) avisoBorrador.hidden = true;
    membersSelect?.dispatchEvent(new Event('change'));
    durationSelect?.dispatchEvent(new Event('change'));
    aplicarEvento('');
    revisarZonaPaquete();
  }
  campo('form-borrador-reset')?.addEventListener('click', () => {
    empezarDeNuevo();
    campo('form-name')?.focus();
  });

  // El widget lateral fijo tapa contenido en escritorio: se retira mientras el formulario o la foto de "Nosotros" están en pantalla
  const sideWidget = campo('side-booking-widget');
  const zonasDespejadas = ['reservacion', 'nosotros'].map(campo).filter(Boolean);
  if (sideWidget && zonasDespejadas.length && 'IntersectionObserver' in window) {
    const visibles = new Set();
    const observer = new IntersectionObserver((entradas) => {
      entradas.forEach(e => (e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target)));
      sideWidget.classList.toggle('side-widget-oculto', visibles.size > 0);
    }, { threshold: 0.05 });
    zonasDespejadas.forEach(zona => observer.observe(zona));
  }

  // Aviso (no bloquea): el paquete de 8 canciones es solo dentro de la ZMG
  const MUNICIPIOS_ZMG = ['guadalajara', 'zapopan', 'tlaquepaque', 'tonala', 'tlajomulco', 'el salto', 'juanacatlan', 'ixtlahuacan', 'zapotlanejo', 'acatlan', 'zmg', 'gdl'];
  const avisoZmg = campo('form-address-aviso');
  const sinAcentos = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  // Dirección escrita (8+ caracteres) que no menciona ningún municipio de la ZMG
  function fueraDeZmg() {
    const direccion = sinAcentos(campo('form-address')?.value || '');
    return direccion.trim().length >= 8 && !MUNICIPIOS_ZMG.some(m => direccion.includes(m));
  }
  function revisarZonaPaquete() {
    if (!avisoZmg) return;
    const fuera = fueraDeZmg();
    avisoZmg.hidden = !fuera;
    if (fuera) {
      avisoZmg.textContent = durationSelect?.value === 'paquete8'
        ? 'El paquete de 8 canciones aplica solo dentro de la ZMG. Si tu evento es fuera, te cotizamos por tanda con costo de traslado.'
        : 'Tu evento parece estar fuera de la ZMG: al precio se suma el costo de traslado, que te confirmamos por WhatsApp.';
    }
  }
  campo('form-address')?.addEventListener('input', () => { revisarZonaPaquete(); renderCotizacion(); });
  durationSelect?.addEventListener('change', revisarZonaPaquete);

  if (restaurarBorrador() && avisoBorrador) avisoBorrador.hidden = false;
  // Borradores anteriores guardaban el paquete como duración
  if (!eventoInput?.value && durationSelect?.value === 'paquete8' && eventoInput) eventoInput.value = 'Paquete entre semana';
  if (eventoInput?.value) aplicarEvento(eventoInput.value);
  sincronizarGrupo();
  renderCotizacion();
  revisarZonaPaquete();
  form.addEventListener('input', guardarBorrador);
  form.addEventListener('change', guardarBorrador);

  // ---------- Validación en línea ----------
  function mostrarError(id, mensaje) {
    const el = campo(id);
    const error = campo(`${id}-error`);
    if (el) el.setAttribute('aria-invalid', 'true');
    if (error) {
      error.textContent = mensaje;
      error.hidden = false;
    }
  }

  function limpiarError(id) {
    const el = campo(id);
    const error = campo(`${id}-error`);
    if (el) el.removeAttribute('aria-invalid');
    if (error) {
      error.textContent = '';
      error.hidden = true;
    }
  }

  CAMPOS_VALIDADOS.forEach(id => {
    const el = campo(id);
    if (!el) return;
    const limpiar = () => {
      if (el.getAttribute('aria-invalid') === 'true') limpiarError(id);
    };
    el.addEventListener('input', limpiar);
    el.addEventListener('change', limpiar);
  });
  // Cambiar la fecha puede resolver el error del paquete de lunes a jueves o el de una hora ya pasada
  dateInput?.addEventListener('change', () => {
    limpiarError('form-duration');
    limpiarError('form-time');
  });
  const MSG_PAQUETE_FIN = 'El paquete de 8 canciones aplica solo de lunes a jueves. Elige tandas o cambia la fecha.';
  function revisarPaqueteDia() {
    if (durationSelect?.value === 'paquete8' && dateInput?.value && !esLunesAJueves(dateInput.value)) {
      mostrarError('form-duration', MSG_PAQUETE_FIN);
    }
  }
  dateInput?.addEventListener('change', revisarPaqueteDia);
  durationSelect?.addEventListener('change', revisarPaqueteDia);

  function validar() {
    const errores = [];
    const hoy = fechaLocalISO(new Date());
    const nombre = unaLinea(campo('form-name')?.value || '');
    const telefono = campo('form-phone')?.value.trim() || '';
    const email = campo('form-email');
    const fecha = dateInput?.value || '';
    const hora = campo('form-time')?.value || '';
    const domicilio = unaLinea(campo('form-address')?.value || '');

    if (nombre.length < 2) {
      errores.push(['form-name', 'Escribe tu nombre para saber a quién confirmarle la fecha.']);
    }

    if (!telefono) {
      errores.push(['form-phone', 'Escribe tu teléfono o WhatsApp para confirmarte la fecha.']);
    } else if (!normalizarTelefono(telefono)) {
      errores.push(['form-phone', 'Revisa tu número: debe tener 10 dígitos, por ejemplo 33 2026 2503.']);
    }

    if (email && email.value.trim() && !email.validity.valid) {
      errores.push(['form-email', 'Revisa tu correo, parece incompleto (ejemplo: nombre@correo.com). También puedes dejarlo vacío.']);
    }

    if (!fecha) {
      errores.push(['form-date', 'Elige el día de tu evento.']);
    } else if (fecha < hoy) {
      errores.push(['form-date', 'Esa fecha ya pasó. Elige hoy o un día posterior.']);
    }

    if (!hora) {
      errores.push(['form-time', 'Elige la hora de inicio.']);
    } else if (fecha === hoy) {
      const ahora = new Date();
      const ahoraHHMM = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
      if (hora <= ahoraHHMM) {
        errores.push(['form-time', 'Esa hora ya pasó hoy. Elige una hora más tarde.']);
      }
    }

    if (durationSelect?.value === 'paquete8' && fecha && !esLunesAJueves(fecha)) {
      errores.push(['form-duration', 'El paquete de 8 canciones aplica solo de lunes a jueves. Elige tandas o cambia la fecha.']);
    }

    if (domicilio.length < 8) {
      errores.push(['form-address', 'Escribe la dirección completa (calle, número, colonia y municipio) para confirmar cobertura.']);
    }

    return errores;
  }

  // ---------- Mensaje de WhatsApp ----------
  function construirMensaje() {
    const c = cotizacion();
    const nombre = unaLinea(campo('form-name').value);
    const telefono = unaLinea(campo('form-phone').value);
    const email = unaLinea(campo('form-email')?.value || '');
    const fecha = dateInput.value;
    const hora = campo('form-time').value;
    const domicilio = unaLinea(campo('form-address').value);
    const notas = (campo('form-notes')?.value || '').trim();
    const gmapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(domicilio)}`;

    const presupuesto = c.presupuesto || (c.porTanda ? `${c.total} (${c.porTanda} por tanda)` : c.total);

    return [
      '*NUEVA SOLICITUD DE RESERVACIÓN*',
      '*Mariachi Jalisco Es Tradición*',
      '',
      `*Contratante:* ${nombre}`,
      `*Teléfono / WhatsApp:* ${telefono}`,
      `*Correo:* ${email || 'No proporcionado'}`,
      '',
      `*Tipo de evento:* ${campo('form-evento')?.value || 'No especificado'}`,
      `*Fecha del evento:* ${formatearFecha(fecha)}`,
      `*Hora de inicio:* ${formatearHora(hora)}`,
      '',
      `*Agrupación:* ${c.members} músicos`,
      `*Duración:* ${c.duracion}`,
      `*Presupuesto estimado en la web:* ${presupuesto}`,
      '',
      `*Domicilio del evento:* ${domicilio}`,
      `Ver en Google Maps: ${gmapsLink}`,
      '',
      `*Notas:* ${notas || 'Sin observaciones'}`
    ].join('\n');
  }

  // ---------- Modal de confirmación honesto ----------
  function focusables() {
    return [...modal.querySelectorAll('a[href], button:not([disabled])')];
  }

  function onModalKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      cerrarModal();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = focusables();
    if (!items.length) return;
    const primero = items[0];
    const ultimo = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === primero || document.activeElement === modalTitle)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }

  function abrirModal(seAbrio, url) {
    if (!modal) return;
    if (seAbrio) {
      modalTitle.textContent = 'Tu mensaje está listo en WhatsApp';
      modalDesc.innerHTML = 'Abrimos WhatsApp con los datos de tu evento. Para apartar tu fecha, solo falta presionar <strong class="text-on-background">Enviar</strong> en el chat. Te respondemos las 24 horas, todos los días.';
    } else {
      modalTitle.textContent = 'Falta un paso: abre WhatsApp';
      modalDesc.textContent = 'Tu navegador no abrió WhatsApp automáticamente. Tus datos siguen guardados en el formulario; usa el botón verde para enviar tu mensaje.';
    }
    const fallbackHint = campo('booking-fallback-hint');
    if (fallbackHint) fallbackHint.hidden = !seAbrio;
    if (waLink) waLink.href = url;
    if (copyStatus) copyStatus.textContent = '';

    // Si WhatsApp no se abrió, "Ya lo envié" (que borra el formulario) no puede ser la acción principal
    if (doneBtn) {
      doneBtn.className = seAbrio ? BOTON_PRINCIPAL : BOTON_SECUNDARIO;
      doneBtn.textContent = seAbrio ? 'Ya lo envié' : 'Ya lo envié por mi cuenta';
    }

    focoPrevio = document.activeElement;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onModalKeydown);
    // Con WhatsApp bloqueado, el foco va directo a la acción que resuelve: abrir WhatsApp
    if (seAbrio) modalTitle?.focus();
    else waLink?.focus();
  }

  function cerrarModal() {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onModalKeydown);
    if (focoPrevio && typeof focoPrevio.focus === 'function') focoPrevio.focus();
  }

  async function copiarMensaje() {
    let copiado = false;
    try {
      await navigator.clipboard.writeText(mensajeActual);
      copiado = true;
    } catch (e) {
      // Respaldo para navegadores sin Clipboard API o sin HTTPS
      const temp = document.createElement('textarea');
      temp.value = mensajeActual;
      temp.setAttribute('readonly', '');
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      try {
        copiado = document.execCommand('copy');
      } catch (err) {
        copiado = false;
      }
      temp.remove();
    }
    if (!copyStatus) return;
    copyStatus.style.color = copiado ? '' : '#fcd34d';
    copyStatus.textContent = copiado
      ? 'Mensaje copiado. Pégalo en un chat con el 33 2026 2503.'
      : 'No se pudo copiar automáticamente. Usa el botón verde para abrir WhatsApp.';
  }

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) cerrarModal();
  });
  closeBtn?.addEventListener('click', cerrarModal);
  copyBtn?.addEventListener('click', copiarMensaje);
  doneBtn?.addEventListener('click', () => {
    empezarDeNuevo();
    cerrarModal();
  });

  // ---------- Envío ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (enviando) return;

    CAMPOS_VALIDADOS.forEach(limpiarError);
    const errores = validar();
    if (errores.length) {
      errores.forEach(([id, mensaje]) => mostrarError(id, mensaje));
      const resumen = campo('form-error-resumen');
      if (resumen) {
        const nombres = errores.map(([id]) => NOMBRES_CAMPO[id] || id).join(', ');
        resumen.textContent = errores.length === 1
          ? `Falta corregir un campo: ${nombres}.`
          : `Faltan corregir ${errores.length} campos: ${nombres}.`;
      }
      const primero = campo(errores[0][0]);
      primero?.focus({ preventScroll: true });
      primero?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      return;
    }

    enviando = true;
    if (submitBtn) submitBtn.disabled = true;
    setTimeout(() => {
      enviando = false;
      if (submitBtn) submitBtn.disabled = false;
    }, 1500);

    guardarBorrador();
    mensajeActual = construirMensaje();
    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensajeActual)}`;

    // Sin "noopener" en el tercer argumento: así sabemos si el navegador bloqueó la ventana
    const ventana = window.open(url, '_blank');
    if (ventana) {
      try {
        ventana.opener = null;
      } catch (err) { /* ventana de otro origen */ }
    }

    // Los datos NO se borran aquí: solo cuando el cliente confirma "Ya lo envié"
    abrirModal(Boolean(ventana), url);
  });
}

// Preselección de servicio desde las tarjetas interactivas (sin borrar lo que el cliente ya escribió)
// Las tarjetas de servicios eligen el tipo de evento en el formulario
window.preselectService = function(serviceType) {
  const tipos = { Boda: 'Boda', Corporativo: 'Evento corporativo', Serenata: 'Serenata o fiesta' };
  const radio = document.querySelector(`input[name="form-evento-opcion"][value="${tipos[serviceType] || serviceType}"]`);
  if (radio && !radio.checked) {
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const reservacion = document.getElementById('reservacion');
  if (reservacion) {
    reservacion.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
};

// Las páginas de servicio llegan con /?evento=Boda#reservacion: el formulario abre con ese tipo de evento
document.addEventListener('DOMContentLoaded', () => {
  const evento = new URLSearchParams(location.search).get('evento');
  if (evento) window.preselectService(evento);
});
