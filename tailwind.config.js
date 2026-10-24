/** Configuración de Tailwind (antes vivía en un <script> dentro de index.html y se compilaba en el navegador).
 *  Para regenerar css/tailwind.css después de editar clases en index.html o js/*.js:
 *    npm install
 *    npm run build:css
 */
module.exports = {
  content: [__dirname + '/index.html', __dirname + '/*/index.html', __dirname + '/js/**/*.js'],
  darkMode: 'class',
  // hover: solo en dispositivos con mouse; en celular el toque no deja fotos ampliadas pegadas
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      transitionTimingFunction: {
        salida: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      colors: {
        'outline-variant': '#4d4635',
        'on-background': '#e5e2e1',
        'tertiary-fixed': '#ffdf9c',
        'surface-container': '#1A1614',
        'error': '#ffb4ab',
        'secondary-fixed': '#e3e3de',
        'error-container': '#93000a',
        'inverse-on-surface': '#313030',
        'tertiary': '#eeca7f',
        'on-secondary-fixed-variant': '#454744',
        'on-primary-fixed': '#241a00',
        'on-error-container': '#ffdad6',
        'on-primary-container': '#554300',
        'inverse-primary': '#735c00',
        'on-surface': '#e5e2e1',
        'tertiary-container': '#d0af66',
        'secondary-container': '#484a46',
        'surface-dim': '#131313',
        'on-primary': '#3c2f00',
        'surface-container-lowest': '#09080A',
        'surface-container-highest': '#353534',
        'on-error': '#690005',
        'primary-fixed': '#ffe088',
        'on-secondary-container': '#b8b9b4',
        'surface-container-high': '#2A2420',
        'surface-variant': '#353534',
        'surface-tint': '#e9c349',
        'primary': '#E7A33E',
        // Verde de WhatsApp: solo para los botones que abren el chat
        'whatsapp': '#22c55e',
        'whatsapp-claro': '#4ade80',
        'whatsapp-oscuro': '#16a34a',
        'on-tertiary': '#3f2e00',
        'tertiary-fixed-dim': '#e5c277',
        'outline': '#99907c',
        'background': '#0D0D0F',
        'surface': '#0D0D0F',
        'on-tertiary-fixed': '#251a00',
        'on-tertiary-container': '#594200',
        'surface-container-low': '#141110',
        'surface-bright': '#393939',
        'primary-container': '#E7A33E',
        'on-tertiary-fixed-variant': '#5b4302',
        'on-secondary': '#2f312e',
        'on-primary-fixed-variant': '#574500',
        'inverse-surface': '#e5e2e1',
        'secondary': '#c6c7c2',
        'on-surface-variant': '#d0c5af',
        'secondary-fixed-dim': '#c6c7c2',
        'on-secondary-fixed': '#1a1c19',
        'primary-fixed-dim': '#e9c349',
        // Plata de la botonadura: bordes, reglas y estructura (el ámbar queda solo como acento)
        'plata': '#C9C7C1'
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        full: '9999px'
      },
      spacing: {
        base: '8px',
        gutter: '24px',
        'container-max': '1280px',
        'margin-desktop': '64px',
        'margin-mobile': '20px'
      },
      fontFamily: {
        'display-lg-mobile': ['Abril Fatface', 'serif'],
        'label-lg': ['Archivo', 'sans-serif'],
        'body-lg': ['Archivo', 'sans-serif'],
        'display-lg': ['Abril Fatface', 'serif'],
        'body-md': ['Archivo', 'sans-serif'],
        'headline-md': ['Abril Fatface', 'serif'],
        'headline-lg': ['Abril Fatface', 'serif'],
        'label-sm': ['Archivo', 'sans-serif']
      },
      fontSize: {
        'display-lg-mobile': ['40px', { lineHeight: '48px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'label-lg': ['14px', { lineHeight: '20px', letterSpacing: '0.1em', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'display-lg': ['64px', { lineHeight: '72px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '600' }],
        'label-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '500' }]
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')]
};
