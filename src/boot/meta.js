import { defineBoot } from '#q-app/wrappers'
import { APP_NAME, APP_DESCRIPTION, LOGO_PATH } from 'src/config/branding'

export default defineBoot(({ app }) => {
  // Configurar título y descripción usando el plugin Meta de Quasar
  if (typeof document !== 'undefined') {
    // Actualizar título
    document.title = APP_NAME
    
    // Actualizar o crear meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', APP_DESCRIPTION)

    // Actualizar favicon dinámicamente
    const updateFavicon = (href) => {
      // Remover favicons existentes
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]')
      existingFavicons.forEach(link => link.remove())

      // Crear nuevo favicon
      const link = document.createElement('link')
      link.rel = 'icon'
      link.type = 'image/png'
      link.href = href
      document.head.appendChild(link)

      // Agregar también apple-touch-icon
      const appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      appleLink.href = href
      document.head.appendChild(appleLink)
    }

    // Actualizar favicon con el logo de Nimbus
    updateFavicon(LOGO_PATH)
  }
})

