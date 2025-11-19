/**
 * ============================================
 * CONFIGURACIÓN DE MARCA Y LOGO
 * ============================================
 * Este archivo permite personalizar fácilmente la marca y el logo
 * del sistema para cada empresa cliente.
 * 
 * Para personalizar el sistema para una nueva empresa:
 * 1. Reemplaza el archivo en: public/icons/logo_hd.png con el logo de la empresa
 * 2. Modifica las constantes siguientes según sea necesario
 */

export const brandingConfig = {
  // Ruta del logo (relativa a la carpeta public/)
  // Formato recomendado: PNG con fondo transparente, altura mínima 100px
  logoPath: '/icons/logo_hd.png',
  
  // Texto alternativo para el logo (accesibilidad)
  logoAlt: 'Logo de empresa Report+',
  
  // Nombre de la empresa/aplicación
  companyName: 'empresa Report',
  
  // Nombre de la aplicación (aparece en la pestaña del navegador)
  appName: 'empresa Report',
  
  // Descripción de la aplicación
  appDescription: 'Sistema de gestión de registros y reportes',
  
  // Configuración adicional (opcional)
  showLogoInHeader: true,
  showLogoInLogin: true,
  
  // Dimensiones del logo
  logoHeights: {
    header: 40,      // Altura del logo en el header (px)
    login: 80,       // Altura del logo en la página de login (px)
    mobile: {
      header: 32,    // Altura del logo en mobile header (px)
      login: 60      // Altura del logo en mobile login (px)
    }
  }
}

// Exportar constantes individuales para uso directo
export const LOGO_PATH = brandingConfig.logoPath
export const LOGO_ALT = brandingConfig.logoAlt
export const COMPANY_NAME = brandingConfig.companyName
export const APP_NAME = brandingConfig.appName
export const APP_DESCRIPTION = brandingConfig.appDescription

