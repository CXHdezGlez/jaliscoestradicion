# Genera las páginas de servicio (carpeta/index.html) con el mismo encabezado, pie y barra de celular que index.html.
# Uso (desde la raíz del proyecto): python scripts/build_pages.py . && npm run build:css
import json, re, sys, os, html
from urllib.parse import quote

ROOT = sys.argv[1]
DOM = 'https://www.jaliscoestradicion.com'
WA = 'https://wa.me/523320262503?text='
home = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()

def bloque(inicio, fin):
    i = home.index(inicio)
    return home[i:home.index(fin, i) + len(fin)]

def a_raiz(fragmento):
    # Rutas relativas de index.html -> absolutas, para que funcionen desde /carpeta/
    f = fragmento.replace('src="assets/', 'src="/assets/')
    return re.sub(r'href="#', 'href="/#', f)

FUENTES = '\n'.join(l for l in home.splitlines() if 'fonts.g' in l)
FOOTER = a_raiz(bloque('<!-- Footer -->', '</footer>'))
BARRA = a_raiz(bloque('<!-- Barra de acciones al alcance del pulgar', '</div>\n  </div>'))

NAV_ITEMS = [('/', 'Inicio'), ('/precios/', 'Precios'), ('/mariachi-para-bodas/', 'Bodas'),
             ('/serenatas/', 'Serenatas'), ('/eventos-corporativos/', 'Empresas'), ('/#contacto', 'Contacto')]
NAV_CLASE = 'nav-link font-label-lg uppercase tracking-wider text-on-background/70 hover:text-primary transition-colors duration-300'

ICON = '<span class="material-symbols-outlined {c}" aria-hidden="true">{n}</span>'
def icon(n, c='text-lg'): return ICON.format(n=n, c=c)

RESENAS = {
    'victor': ('Victor Armenta', '¡Excelente servicio! Son sumamente puntuales, impecables en su presentación y tienen un repertorio buenísimo y muy amplio. Un agradecimiento especial por su excelente disposición, profesionalismo y por hacer cantar y emocionar a todos los invitados. ¡Definitivamente los volveremos a contratar y los recomendamos al 100%!'),
    'jocy': ('Jocy M', '100% recomendables, siempre me sorprenden. Los he contratado varias veces y me dejan sorprendida por lo increíble que son, buena presentación ante todo. Cuando me preguntan sobre un mariachi los recomiendo con los ojos cerrados.'),
    'vanessa': ('Vanessa Ulloa González', 'Puntuales y de ambiente. En el aniversario de mis papás tocaron y quedaron encantados los invitados. Lo recomiendo ampliamente.'),
}

# ---------- piezas de contenido ----------
def seccion(titulo, cuerpo, antetitulo='', fondo='bg-background', id_=''):
    ide = f' id="{id_}"' if id_ else ''
    ante = f'<p class="seccion-antetitulo">{antetitulo}</p>\n      ' if antetitulo else ''
    return f'''
  <section class="py-16 md:py-20 {fondo}"{ide}>
    <div class="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop">
      {ante}<h2 class="seccion-titulo">{titulo}</h2>
      <div class="botonadura-h botonadura-corta mt-5 mb-8" aria-hidden="true"></div>
      <div class="space-y-5 font-body-md text-on-background/80 leading-relaxed text-[17px]">
{cuerpo}
      </div>
    </div>
  </section>'''

def tarjetas(items):
    # items: (icono, título, texto)
    lis = '\n'.join(f'''        <li class="bg-surface-container gala-border rounded-xl p-6">
          <div class="flex items-center gap-3 mb-3">{icon(i, "text-2xl text-plata")}<h3 class="font-headline-md text-xl text-on-background">{t}</h3></div>
          <p class="text-on-background/75 text-[15px] leading-relaxed">{x}</p>
        </li>''' for i, t, x in items)
    return f'<ul class="grid grid-cols-1 sm:grid-cols-2 gap-5">\n{lis}\n      </ul>'

def lista(items):
    lis = '\n'.join(f'<li class="flex items-start gap-2.5">{icon("check", "text-plata text-lg leading-6 shrink-0")}<span>{x}</span></li>' for x in items)
    return f'<ul class="space-y-3">\n{lis}\n</ul>'

def b(t): return f'<strong class="text-on-background">{t}</strong>'

def resena(clave):
    nombre, texto = RESENAS[clave]
    estrella = '<span class="material-symbols-outlined text-xl" aria-hidden="true" style="font-variation-settings: \'FILL\' 1;">star</span>'
    return f'''<figure class="bg-surface-container gala-border rounded-xl p-6 md:p-8">
  <div class="flex gap-0.5 text-primary mb-4" role="img" aria-label="5 de 5 estrellas">{estrella * 5}</div>
  <blockquote class="text-on-background/85 text-[17px] leading-relaxed">“{texto}”</blockquote>
  <figcaption class="mt-4 text-sm text-on-background/65"><strong class="text-on-background">{nombre}</strong> · Reseña en Google Maps</figcaption>
</figure>'''

def faq_html(preguntas):
    items = '\n'.join(f'''<details class="group border-b border-plata/20">
  <summary class="flex justify-between items-center gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden min-h-[44px] font-semibold text-on-background text-[17px]">
    <span>{q}</span>{icon("expand_more", "text-plata transition-transform group-open:rotate-180 shrink-0")}
  </summary>
  <div class="pb-5 text-on-background/80 leading-relaxed">{a}</div>
</details>''' for q, a in preguntas)
    return f'<div class="border-t border-plata/20">\n{items}\n</div>'

def texto_plano(h):
    return html.unescape(re.sub(r'<[^>]+>', '', h)).strip()

def enlace(u, t): return f'<a href="{u}" class="text-primary underline underline-offset-4 hover:text-on-background">{t}</a>'

def relacionados(slug_actual):
    paginas = [('/precios/', 'Precios del mariachi', 'Lo que cuesta por tanda y el paquete de 8 canciones.'),
               ('/mariachi-para-bodas/', 'Mariachi para bodas', 'Misa, marcha nupcial, recepción y vals.'),
               ('/serenatas/', 'Serenatas', 'Pedidas, cumpleaños, Mañanitas y sorpresas.'),
               ('/eventos-corporativos/', 'Eventos corporativos', 'Congresos, cenas de gala y factura CFDI.'),
               ('/dia-de-las-madres/', 'Serenata 10 de mayo', 'Mañanitas para mamá a domicilio.')]
    lis = '\n'.join(f'''<li><a href="{u}" class="block h-full bg-surface-container gala-border rounded-xl p-5 hover:border-primary transition-colors">
  <span class="flex items-center justify-between font-semibold text-primary">{t} {icon("arrow_forward", "text-base")}</span>
  <span class="block mt-1 text-sm text-on-background/70">{d}</span></a></li>''' for u, t, d in paginas if u != slug_actual)
    return f'<ul class="grid grid-cols-1 sm:grid-cols-2 gap-4">\n{lis}\n</ul>'

PRECIOS_LINK = f'<p>Todos los detalles en {enlace("/precios/", "precios")}.</p>'

# ---------- páginas ----------
P = {}

P['precios'] = dict(
    titulo='Precios de Mariachi en Guadalajara 2026 | Jalisco Es Tradición',
    descripcion='Cuánto cuesta un mariachi en Guadalajara: $2,500 por tanda con 3 músicos, $3,700 con 5 y $9,700 con 15. Paquete de 8 canciones desde $1,899.',
    og='Precios del mariachi por tanda en Guadalajara',
    miga='Precios', evento='', wa='Hola, quiero cotizar un mariachi. Vi los precios en su página.',
    antetitulo='Precios publicados, sin sorpresas',
    h1='Precios de mariachi en Guadalajara',
    intro=f'Cobramos por {b("tanda")}: 45 minutos de música en vivo con audio profesional incluido. Estos son nuestros precios en la Zona Metropolitana de Guadalajara; el precio final te lo confirmamos por WhatsApp según la fecha y la ubicación.',
    cuerpo=lambda: seccion('Precio por tanda', '''
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
  <caption class="sr-only">Precio por tanda de 45 minutos según el número de músicos</caption>
  <thead><tr class="border-b border-plata/30 text-plata text-sm uppercase tracking-wider">
    <th scope="col" class="py-3 pr-4 font-semibold">Agrupación</th><th scope="col" class="py-3 pr-4 font-semibold">1 tanda (45 min)</th><th scope="col" class="py-3 font-semibold">2 tandas (1 h 30 min)</th></tr></thead>
  <tbody class="text-on-background">
    <tr class="border-b border-plata/15"><th scope="row" class="py-4 pr-4 font-semibold">3 músicos <span class="block text-sm font-normal text-on-background/65">Trío de gala</span></th><td class="py-4 pr-4 text-primary font-bold text-lg">$2,500</td><td class="py-4">$5,000</td></tr>
    <tr class="border-b border-plata/15"><th scope="row" class="py-4 pr-4 font-semibold">5 músicos <span class="block text-sm font-normal text-on-background/65">El que más recomendamos</span></th><td class="py-4 pr-4 text-primary font-bold text-lg">$3,700</td><td class="py-4">$7,400</td></tr>
    <tr class="border-b border-plata/15"><th scope="row" class="py-4 pr-4 font-semibold">15 músicos <span class="block text-sm font-normal text-on-background/65">Gran orquesta mariachi</span></th><td class="py-4 pr-4 text-primary font-bold text-lg">$9,700</td><td class="py-4">$19,400</td></tr>
  </tbody>
</table>
</div>
<p class="text-sm text-on-background/65">Precios en pesos mexicanos (MXN), dentro de la ZMG. Agrupaciones de 4 a 14 músicos: el precio te lo confirmamos por WhatsApp.</p>
''', antetitulo='Por agrupación') + seccion('Paquete de 8 canciones, desde $1,899', f'''
<p>Para un detalle rápido entre semana: {b("8 canciones pre-seleccionadas")} desde $1,899. Es ideal para unas Mañanitas o una sorpresa corta.</p>
{lista(["Solo de lunes a jueves", "Solo dentro de la Zona Metropolitana de Guadalajara", "Sin pilón (canciones extra de cortesía)", "El precio según el número de músicos se confirma por WhatsApp"])}
<p>También tenemos {b("promociones de lunes a jueves")}; las condiciones y fechas disponibles te las damos por WhatsApp.</p>
''', fondo='bg-surface-container-lowest') + seccion('Qué incluye y qué cambia el precio', lista([
        f'{b("Incluido:")} 45 minutos de música efectiva por tanda y equipo de audio profesional para eventos de hasta 300 personas.',
        f'{b("Traslado:")} fuera de la ZMG (foráneos) se suma el costo de traslado. Validamos el domicilio de tu evento en Google Maps.',
        f'{b("Canciones especiales:")} si la que quieres no está en nuestro repertorio, pídela con al menos 15 días de anticipación.',
        f'{b("Anticipo:")} no es obligatorio, pero asegura tu fecha. El monto lo acordamos contigo por WhatsApp.'])) + seccion('Formas de pago', lista([
        'Efectivo, sin comisión', 'Transferencia SPEI o depósito',
        'Tarjeta, o 3, 9 y 12 meses sin intereses con Mercado Pago (aplica la comisión del servicio de pago)',
        'Factura fiscal (CFDI) para empresas y particulares']), fondo='bg-surface-container-lowest'),
    faq=[('¿Cuánto cuesta un mariachi en Guadalajara?', 'Con nosotros, una tanda de 45 minutos cuesta $2,500 con 3 músicos, $3,700 con 5 y $9,700 con 15, dentro de la Zona Metropolitana de Guadalajara. De lunes a jueves también hay un paquete de 8 canciones desde $1,899.'),
         ('¿Qué es una tanda?', 'Son 45 minutos de música en vivo, con audio profesional incluido. Puedes contratar una o varias tandas seguidas.'),
         ('¿Cuánto cuesta con 4, 6 u otro número de músicos?', 'Tenemos agrupaciones de 3 a 15 músicos. Publicamos el precio de 3, 5 y 15; para cualquier otro tamaño te damos el precio por WhatsApp.'),
         ('¿Cobran traslado?', 'Dentro de la ZMG aplica el precio por tanda. Fuera de la ZMG se suma el costo de traslado, que te confirmamos por WhatsApp con la dirección de tu evento.')],
    resena='victor',
)

P['mariachi-para-bodas'] = dict(
    titulo='Mariachi para Bodas en Guadalajara | Jalisco Es Tradición',
    descripcion='Mariachi para tu boda en Guadalajara y la ZMG: misa nupcial o ceremonia civil, marcha nupcial, recepción y vals. Desde $3,700 por tanda con 5 músicos.',
    og='Mariachi para bodas en Guadalajara',
    miga='Bodas', evento='Boda', wa='Hola, quiero cotizar mariachi para mi boda.',
    antetitulo='Misa · Recepción · Vals',
    h1='Mariachi para bodas en Guadalajara',
    intro='Acompañamos tu boda desde la misa hasta el vals, en traje de charro negro con botonadura de plata. Más de 20 años de trayectoria, en Guadalajara, Zapopan, Tlajomulco, Tonalá, El Salto y toda la ZMG.',
    imagen=('/assets/images/web/servicio_bodas.webp', 1000, 558, 'Mariachi para bodas y misas nupciales en Guadalajara'),
    cuerpo=lambda: seccion('Los momentos de tu boda', tarjetas([
        ('church', 'Misa o ceremonia civil', 'Acompañamiento solemne para la misa nupcial religiosa o la ceremonia civil.'),
        ('favorite', 'Marcha nupcial', 'La entrada y la salida de los novios con mariachi en vivo.'),
        ('celebration', 'Recepción', 'Música festiva para recibir a los invitados y poner ambiente.'),
        ('groups', 'Vals de novios', 'El vals de recién casados interpretado en vivo.')]), antetitulo='Dónde tocamos') + seccion('¿Cuántos músicos y cuántas tandas?', f'''
<p>Cada tanda son 45 minutos de música. Si quieres mariachi en la misa y también en la recepción, dinos los horarios de cada momento y armamos la cotización por tandas.</p>
{lista([f'{b("3 músicos")}, trío de gala: $2,500 por tanda', f'{b("5 músicos")}, el que más recomendamos: $3,700 por tanda', f'{b("15 músicos")}, gran orquesta mariachi: $9,700 por tanda'])}
<p>Ejemplo: 5 músicos durante 2 tandas (1 hora 30 minutos) son $7,400 dentro de la ZMG.</p>
{PRECIOS_LINK}
''', fondo='bg-surface-container-lowest') + seccion('Para planear con tiempo', lista([
        f'{b("Aparta pronto:")} la agenda de fin de semana se llena rápido. El anticipo no es obligatorio, pero asegura tu fecha.',
        f'{b("Canciones especiales:")} si quieren una canción que no está en nuestro repertorio, pídanla con al menos 15 días de anticipación para ensayarla.',
        f'{b("Audio:")} llevamos equipo profesional para recepciones de hasta 300 personas.',
        f'{b("Pago:")} efectivo, transferencia, tarjeta o meses sin intereses. Emitimos factura (CFDI).'])),
    faq=[('¿Tocan en la misa o solo en la fiesta?', 'En los dos. Acompañamos la misa nupcial religiosa o la ceremonia civil, la marcha nupcial, la recepción y el vals de novios.'),
         ('¿Pueden tocar una canción que no está en su repertorio?', 'Sí. Pídela con al menos 15 días de anticipación para ensayarla.'),
         ('¿Llevan equipo de sonido para la recepción?', 'Sí, equipo de audio profesional para eventos de hasta 300 personas. En eventos más grandes nos coordinamos con el proveedor técnico.'),
         ('¿Dan factura?', 'Sí, emitimos factura fiscal (CFDI) para particulares y empresas.')],
    resena='victor',
)

P['serenatas'] = dict(
    titulo='Serenatas con Mariachi en Guadalajara | Jalisco Es Tradición',
    descripcion='Serenata con mariachi a domicilio en Guadalajara y la ZMG: pedidas de mano, cumpleaños, Mañanitas y aniversarios. También el mismo día. Desde $1,899.',
    og='Serenatas con mariachi a domicilio en Guadalajara',
    miga='Serenatas', evento='Serenata', wa='Hola, quiero cotizar una serenata con mariachi.',
    antetitulo='A domicilio en toda la ZMG',
    h1='Serenatas con mariachi en Guadalajara',
    intro='Llevamos la serenata hasta la puerta: pedidas de matrimonio, cumpleaños, Mañanitas, aniversarios y reconciliaciones. Te atendemos por WhatsApp las 24 horas y, según la agenda, llegamos el mismo día.',
    imagen=('/assets/images/web/servicio_serenatas.webp', 1000, 558, 'Mariachi dando una serenata en Guadalajara'),
    cuerpo=lambda: seccion('Para cada ocasión', tarjetas([
        ('favorite', 'Pedida de matrimonio', 'La pregunta más importante, con mariachi en vivo de fondo.'),
        ('celebration', 'Cumpleaños y Mañanitas', 'Despierta o sorprende a quien festejas con sus canciones favoritas.'),
        ('groups', 'Aniversarios', 'Para la pareja, o para los papás frente a toda la familia.'),
        ('chat', 'Reconciliaciones y detalles', 'Cuando hay algo que decir y es mejor cantarlo.')])
        + f'\n<p>¿Es para el Día de las Madres? Revisa nuestra página de {enlace("/dia-de-las-madres/", "serenata para el 10 de mayo")}.</p>', antetitulo='Serenatas y detalles') + seccion('¿Mariachi para hoy?', f'''
<p>Atendemos eventos para el mismo día, según la disponibilidad de la agenda y el tiempo de traslado a tu domicilio. Escríbenos por WhatsApp con la {b("dirección, la hora y el número de músicos")} y te confirmamos en ese momento.</p>
''', fondo='bg-surface-container-lowest') + seccion('Cuánto cuesta una serenata', lista([
        f'{b("Paquete de 8 canciones, desde $1,899:")} canciones pre-seleccionadas, de lunes a jueves, sin pilón y solo dentro de la ZMG.',
        f'{b("Por tanda de 45 minutos:")} $2,500 con 3 músicos, $3,700 con 5. Aquí eliges tú las canciones y las dedicatorias.',
        f'{b("Fuera de la ZMG:")} se cotiza por tanda y se suma el costo de traslado.']) + '\n' + PRECIOS_LINK) + seccion('Cómo pedir tu serenata', '''
<ol class="space-y-4">
  <li class="flex items-center gap-4"><span class="paso-concho shrink-0">1</span><span>Elige fecha, hora y la dirección donde llegamos.</span></li>
  <li class="flex items-center gap-4"><span class="paso-concho shrink-0">2</span><span>Decide el tamaño del mariachi y si quieres paquete de 8 canciones o tandas.</span></li>
  <li class="flex items-center gap-4"><span class="paso-concho shrink-0">3</span><span>Dinos las canciones y la dedicatoria, si la hay.</span></li>
  <li class="flex items-center gap-4"><span class="paso-concho shrink-0">4</span><span>Manda tu solicitud por WhatsApp y te confirmamos la fecha.</span></li>
</ol>''', fondo='bg-surface-container-lowest'),
    faq=[('¿Puedo elegir las canciones?', 'Sí. Cuando contratas por tanda eliges las canciones y las dedicatorias. En el paquete de 8 canciones, las canciones ya están pre-seleccionadas.'),
         ('¿Pueden llegar el mismo día?', 'Sí, según la disponibilidad de la agenda y el tiempo de traslado. Escríbenos por WhatsApp con la dirección y la hora.'),
         ('¿Van fuera de Guadalajara?', 'Sí. Fuera de la ZMG se cotiza por tanda y se suma el costo de traslado; el paquete de 8 canciones aplica solo dentro de la ZMG.')],
    resena='vanessa',
)

P['eventos-corporativos'] = dict(
    titulo='Mariachi para Eventos Corporativos en Guadalajara | Factura CFDI',
    descripcion='Mariachi para congresos, convenciones, cenas de gala y aniversarios de empresa en Guadalajara. Factura CFDI, puntualidad y audio para hasta 300 personas.',
    og='Mariachi para eventos corporativos en Guadalajara',
    miga='Eventos corporativos', evento='Corporativo', wa='Buen día, quiero cotizar mariachi para un evento de empresa.',
    antetitulo='Empresas · Hoteles · Congresos',
    h1='Mariachi para eventos corporativos en Guadalajara',
    intro='Una presentación puntual e impecable para sus clientes, socios y colaboradores. Atendemos congresos, convenciones, cenas de gala y aniversarios de empresa en toda la Zona Metropolitana de Guadalajara, con factura fiscal.',
    imagen=('/assets/images/web/servicio_corporativos.webp', 1000, 558, 'Mariachi en un evento corporativo en Guadalajara'),
    cuerpo=lambda: seccion('Eventos que atendemos', tarjetas([
        ('domain', 'Congresos y convenciones', 'Bienvenida a los asistentes o cierre con música mexicana en vivo.'),
        ('celebration', 'Cenas de gala', 'Ambiente jalisciense para cenas ejecutivas y premiaciones.'),
        ('groups', 'Aniversarios de empresa', 'Celebraciones internas y eventos para colaboradores.'),
        ('verified', 'Hoteles y organizadores', 'Nos ajustamos al protocolo y los horarios del recinto.')]), antetitulo='Para su empresa') + seccion('Lo que su evento necesita', lista([
        f'{b("Factura fiscal (CFDI).")}', f'{b("Puntualidad rigurosa")} y protocolo formal de escenario.',
        f'{b("Audio profesional propio")} para eventos de hasta 300 personas; en eventos masivos nos coordinamos con el proveedor técnico.',
        f'{b("Pago:")} transferencia SPEI, depósito, efectivo o tarjeta, incluso a meses sin intereses.']), fondo='bg-surface-container-lowest') + seccion('Tamaño de la agrupación', f'''
<p>Contamos con agrupaciones de 3 a 15 músicos. Cada tanda son 45 minutos de música en vivo.</p>
{lista(["3 músicos: $2,500 por tanda", "5 músicos: $3,700 por tanda", "15 músicos, gran orquesta mariachi: $9,700 por tanda"])}
<p>Para otros tamaños o eventos fuera de la ZMG le enviamos la cotización por WhatsApp. Más detalles en {enlace("/precios/", "precios")}.</p>
'''),
    faq=[('¿Emiten factura?', 'Sí, emitimos factura fiscal (CFDI) para empresas y particulares.'),
         ('¿Pueden coordinarse con el proveedor de audio del recinto?', 'Sí. Llevamos audio propio para eventos de hasta 300 personas y, en eventos masivos, nos coordinamos con el proveedor técnico.'),
         ('¿Atienden eventos fuera de Guadalajara?', 'Sí. Fuera de la Zona Metropolitana de Guadalajara se suma el costo de traslado a la cotización.')],
    resena=None,
)

P['dia-de-las-madres'] = dict(
    titulo='Serenata 10 de Mayo en Guadalajara | Jalisco Es Tradición',
    descripcion='Serenata con mariachi para el Día de las Madres en Guadalajara y la ZMG. Mañanitas a domicilio para mamá. Aparta tu horario del 10 de mayo con tiempo.',
    og='Serenata para el 10 de mayo en Guadalajara',
    miga='Serenata 10 de mayo', evento='Serenata', wa='Hola, quiero apartar una serenata para el 10 de mayo.',
    antetitulo='Día de las Madres',
    h1='Serenata para el 10 de mayo en Guadalajara',
    intro='Lleva las Mañanitas con mariachi hasta la casa de mamá. Llegamos a domicilio en Guadalajara, Zapopan, Tlajomulco, Tonalá, El Salto y toda la ZMG.',
    imagen=('/assets/images/web/servicio_serenatas.webp', 1000, 558, 'Mariachi dando una serenata a domicilio por el Día de las Madres'),
    cuerpo=lambda: seccion('Aparta tu horario con tiempo', '''
<p>El 10 de mayo es uno de los días de más serenatas del año y la agenda se llena rápido. Lo mejor es apartar tu horario con anticipación; el anticipo no es obligatorio, pero asegura tu lugar.</p>
<p>Si lo decides a última hora, escríbenos de todos modos: atendemos el mismo día según la disponibilidad y el tiempo de traslado.</p>
''', antetitulo='Antes de que se llene la agenda') + seccion('Opciones y precios', lista([
        f'{b("Paquete de 8 canciones, desde $1,899:")} aplica cuando el 10 de mayo cae de lunes a jueves, dentro de la ZMG y sin pilón.',
        f'{b("Por tanda de 45 minutos:")} $2,500 con 3 músicos, $3,700 con 5. Tú eliges las canciones para mamá.',
        f'{b("Fuera de la ZMG:")} por tanda, con costo de traslado.']) + '\n' + PRECIOS_LINK, fondo='bg-surface-container-lowest') + seccion('Lo que necesitamos para tu serenata', lista([
        'La dirección completa y la hora', 'El número de músicos y si prefieres paquete o tandas',
        'Las canciones y el nombre de mamá para la dedicatoria',
        'Si quieres una canción fuera de nuestro repertorio, pídela con al menos 15 días de anticipación'])),
    faq=[('¿Con cuánta anticipación aparto la serenata del 10 de mayo?', 'Lo antes posible: es uno de los días con más demanda del año. También atendemos el mismo día, según la disponibilidad de la agenda.'),
         ('¿A qué hora pueden llegar?', 'Dinos la hora que prefieres por WhatsApp y te confirmamos la disponibilidad para ese horario.'),
         ('¿Puedo pagar con tarjeta?', 'Sí, con tarjeta o a 3, 9 y 12 meses sin intereses con Mercado Pago (aplica la comisión del servicio de pago). En efectivo no hay comisión.')],
    resena='jocy',
)

# ---------- plantilla ----------
def pagina(slug, d):
    url = f'{DOM}/{slug}/'
    actual = f'/{slug}/'
    marca = lambda u: ' aria-current="page"' if u == actual else ''
    nav = '\n'.join(f'        <a class="{NAV_CLASE}" href="{u}"{marca(u)}>{t}</a>' for u, t in NAV_ITEMS)
    menu = '\n'.join(f'        <li><a href="{u}" class="mobile-menu-link"{marca(u)}>{t}</a></li>'
                     for u, t in NAV_ITEMS + [('/dia-de-las-madres/', 'Serenata 10 de mayo')])
    apartar = f'/?evento={d["evento"]}#reservacion' if d['evento'] else '/#reservacion'
    wa = WA + quote(d['wa'])
    img = ''
    if d.get('imagen'):
        src, w, h, alt = d['imagen']
        img = f'\n      <img src="{src}" width="{w}" height="{h}" alt="{alt}" fetchpriority="high" decoding="async" class="mt-12 w-full aspect-[16/9] object-cover rounded-xl gala-border"/>'

    servicio = {
        '@type': 'Service', '@id': url + '#servicio', 'name': texto_plano(d['h1']),
        'serviceType': 'Mariachi', 'url': url,
        'provider': {'@id': DOM + '/#negocio'},
        'areaServed': {'@type': 'AdministrativeArea', 'name': 'Zona Metropolitana de Guadalajara'},
    }
    if slug == 'precios':
        servicio['hasOfferCatalog'] = {'@type': 'OfferCatalog', 'name': 'Precios por tanda de 45 minutos', 'itemListElement': [
            {'@type': 'Offer', 'name': n, 'price': p, 'priceCurrency': 'MXN'} for n, p in
            [('Tanda de 45 minutos, 3 músicos', '2500'), ('Tanda de 45 minutos, 5 músicos', '3700'), ('Tanda de 45 minutos, 15 músicos', '9700')]] + [
            {'@type': 'Offer', 'name': 'Paquete de 8 canciones (lunes a jueves, dentro de la ZMG)',
             'priceSpecification': {'@type': 'PriceSpecification', 'minPrice': '1899', 'priceCurrency': 'MXN'}}]}
    grafo = [
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Inicio', 'item': DOM + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': d['miga'], 'item': url}]},
        servicio,
        {'@type': 'FAQPage', '@id': url + '#preguntas', 'mainEntity': [
            {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': texto_plano(a)}} for q, a in d['faq']]},
    ]
    ld = json.dumps({'@context': 'https://schema.org', '@graph': grafo}, ensure_ascii=False, indent=2)

    res = seccion('Lo que dicen nuestros clientes', resena(d['resena']), antetitulo='Reseñas de Google Maps', fondo='bg-surface-container-lowest') if d['resena'] else ''
    barra = BARRA.replace('href="/#reservacion" id="bar-apartar"', f'href="{apartar}" id="bar-apartar"')

    return f'''<!DOCTYPE html>
<html class="dark" lang="es">
<head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0, viewport-fit=cover" name="viewport"/>
  <title>{d["titulo"]}</title>
  <meta name="description" content="{d["descripcion"]}"/>
  <link rel="canonical" href="{url}"/>
  <meta name="robots" content="index, follow, max-image-preview:large"/>
  <meta name="theme-color" content="#0D0D0F"/>
  <meta property="og:type" content="website"/>
  <meta property="og:locale" content="es_MX"/>
  <meta property="og:site_name" content="Mariachi Jalisco Es Tradición"/>
  <meta property="og:url" content="{url}"/>
  <meta property="og:title" content="{d["og"]}"/>
  <meta property="og:description" content="{d["descripcion"]}"/>
  <meta property="og:image" content="{DOM}/assets/images/web/og-mariachi.jpg"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/web/favicon-32.png"/>
  <link rel="apple-touch-icon" href="/assets/images/web/apple-touch-icon.png"/>
  <!-- Página generada: el pie y la barra de celular son copia de index.html; si cambian allá, hay que regenerar -->
  <link rel="stylesheet" href="/css/tailwind.css"/>
{FUENTES}
  <link rel="stylesheet" href="/css/custom.css"/>
  <script>document.documentElement.classList.add('js');</script>
  <script type="application/ld+json">
{ld}
  </script>
</head>
<body class="font-body-md text-body-md selection:bg-primary-container selection:text-on-primary">
  <a href="#contenido" class="skip-link">Saltar al contenido</a>

  <nav class="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-plata/30 transition-all duration-300">
    <div class="flex justify-between items-center px-4 lg:px-margin-desktop py-3 max-w-container-max mx-auto">
      <a href="/" class="flex items-center gap-2.5 group shrink-0 min-h-[44px]" aria-label="Mariachi Jalisco Es Tradición, ir al inicio">
        <img width="128" height="128" src="/assets/images/web/logo-128.webp" alt="Logotipo Mariachi Jalisco Es Tradición" class="h-10 md:h-12 w-auto object-contain mix-blend-lighten"/>
        <div class="flex flex-col justify-center leading-none">
          <span class="font-headline-md text-xs text-primary/80 uppercase tracking-[0.25em] font-semibold mb-0.5">Mariachi</span>
          <span class="font-headline-md text-base lg:text-xl text-primary tracking-tight font-bold leading-tight">Jalisco Es Tradición</span>
        </div>
      </a>
      <div class="hidden lg:flex items-center gap-5 xl:gap-6 text-xs">
{nav}
      </div>
      <a href="{apartar}" class="btn-ambar hidden lg:inline-block bg-primary text-black px-5 py-2.5 rounded-lg font-label-lg uppercase tracking-wider transition-colors active:scale-95 text-center font-bold text-xs shrink-0">Apartar fecha</a>
    </div>
  </nav>

  <main id="contenido">
  <section class="pt-28 md:pt-36 pb-16 md:pb-20 bg-background">
    <div class="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop">
      <nav aria-label="Ruta de navegación" class="mb-6 text-sm text-on-background/65">
        <ol class="flex flex-wrap items-center gap-2">
          <li><a href="/" class="underline underline-offset-4 hover:text-primary">Inicio</a></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" class="text-on-background/85">{d["miga"]}</li>
        </ol>
      </nav>
      <p class="seccion-antetitulo">{d["antetitulo"]}</p>
      <h1 class="font-headline-md text-4xl md:text-6xl leading-[1.08] text-on-background text-balance">{d["h1"]}</h1>
      <div class="botonadura-h botonadura-corta mt-6 mb-8" aria-hidden="true"></div>
      <p class="font-body-lg text-body-lg text-on-background/80 leading-relaxed max-w-3xl">{d["intro"]}</p>
      <div class="mt-8 flex flex-col sm:flex-row gap-3">
        <a href="{apartar}" class="btn-ambar min-h-[48px] inline-flex items-center justify-center gap-2 bg-primary text-black px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm">{icon("event")} Cotizar y apartar fecha</a>
        <a href="{wa}" target="_blank" rel="noopener" class="min-h-[48px] inline-flex items-center justify-center gap-2 border border-green-500/50 text-green-400 hover:bg-green-600/20 px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm">{icon("chat")} Escribir por WhatsApp</a>
      </div>{img}
    </div>
  </section>
{d["cuerpo"]()}
{res}
{seccion("Preguntas frecuentes", faq_html(d["faq"]), antetitulo="Antes de apartar", id_="preguntas")}
{seccion("También te puede interesar", relacionados(actual), fondo="bg-surface-container-lowest")}

  <section class="py-16 md:py-20 bg-surface-container-low">
    <div class="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop text-center">
      <h2 class="seccion-titulo text-center">Aparta tu fecha</h2>
      <div class="botonadura-h botonadura-corta mx-auto mt-5 mb-6" aria-hidden="true"></div>
      <p class="text-on-background/80 text-[17px] mb-8">Arma tu cotización en línea o escríbenos directo. Te atendemos por WhatsApp y teléfono las 24 horas, los 7 días: <a href="tel:+523320262503" class="text-primary font-semibold underline underline-offset-4">33 2026 2503</a>.</p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <a href="{apartar}" class="btn-ambar min-h-[48px] inline-flex items-center justify-center gap-2 bg-primary text-black px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm">{icon("event_available")} Arma tu cotización</a>
        <a href="{wa}" target="_blank" rel="noopener" class="min-h-[48px] inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-sm">{icon("chat")} WhatsApp</a>
      </div>
    </div>
  </section>
  </main>

  {FOOTER}

  <!-- Menú de páginas (solo celular) -->
  <div id="mobile-menu" class="fixed inset-0 z-[120] hidden flex-col bg-background lg:hidden" role="dialog" aria-modal="true" aria-label="Menú de páginas">
    <nav class="flex-1 overflow-y-auto px-margin-mobile pt-24 pb-6" aria-label="Páginas">
      <ul class="border-t border-plata/15">
{menu}
      </ul>
    </nav>
    <div class="mobile-safe-bottom grid grid-cols-2 gap-3 px-margin-mobile pt-3 border-t border-plata/20">
      <a href="{wa}" target="_blank" rel="noopener" class="h-12 flex items-center justify-center gap-2 bg-green-500 text-black rounded font-bold uppercase tracking-wider text-sm">{icon("chat")} WhatsApp</a>
      <button id="menu-close" type="button" class="h-12 flex items-center justify-center gap-2 border border-plata/40 text-primary rounded font-bold uppercase tracking-wider text-sm">{icon("close")} Cerrar</button>
    </div>
  </div>

  {barra}

  <script src="/js/app.js"></script>
</body>
</html>
'''

for slug, d in P.items():
    os.makedirs(os.path.join(ROOT, slug), exist_ok=True)
    destino = os.path.join(ROOT, slug, 'index.html')
    nuevo = pagina(slug, d)
    # Solo se reescribe si cambió: así la fecha del archivo es la de su último cambio real (la usa <lastmod>)
    if os.path.exists(destino) and open(destino, encoding='utf-8').read() == nuevo:
        print('sin cambios', slug)
        continue
    with open(destino, 'w', encoding='utf-8', newline='\n') as f:
        f.write(nuevo)
    print('ok', slug)

# sitemap.xml: la portada y cada página generada, con <lastmod> = fecha de modificación de su archivo
from datetime import date
entradas = [('', 'index.html')] + [(f'{slug}/', os.path.join(slug, 'index.html')) for slug in P]
urls = '\n'.join(
    f'  <url>\n    <loc>{DOM}/{ruta}</loc>\n    <lastmod>{date.fromtimestamp(os.path.getmtime(os.path.join(ROOT, archivo))).isoformat()}</lastmod>\n  </url>'
    for ruta, archivo in entradas)
with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n') as f:
    f.write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n')
print('ok sitemap.xml')
