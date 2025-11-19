// src/services/registros.service.js
import { api } from 'boot/axios'

/**
 * Servicio para manejar las peticiones relacionadas con registros
 */
export const registrosService = {
  /**
   * Obtiene la lista de registros con filtros opcionales
   * @param {Object} params - Parámetros de filtrado
   * @param {number} params.page - Número de página
   * @param {number} params.page_size - Tamaño de página
   * @param {number} params.usuario - ID del usuario
   * @param {number} params.sucursal - ID de la sucursal
   * @param {number} params.subempresa - ID de la subempresa
   * @param {number} params.tarea - ID de la tarea
   * @param {number} params.empresa - ID de la empresa
   * @param {number} params.grupo_empresa - ID del grupo empresa
   * @param {string} params.fecha_desde - Fecha desde (YYYY-MM-DD)
   * @param {string} params.fecha_hasta - Fecha hasta (YYYY-MM-DD)
   * @param {boolean} params.activo - true/false
   * @param {number} params.ano_contable - Año contable
   * @param {string} params.search - Búsqueda en observaciones
   * @returns {Promise} Promesa con los datos de registros
   */
  async getRegistros(params = {}) {
    try {
      const response = await api.get('/registros/', { params })
      return response.data
    } catch (error) {
      console.error('Error al obtener registros:', error)
      throw error
    }
  },

  /**
   * Obtiene un registro específico por ID
   * @param {number} id - ID del registro
   * @returns {Promise} Promesa con los datos del registro
   */
  async getRegistro(id) {
    try {
      const response = await api.get(`/registros/${id}/`)
      return response.data
    } catch (error) {
      console.error(`Error al obtener registro ${id}:`, error)
      throw error
    }
  },

  /**
   * Crea un nuevo registro
   * @param {Object} data - Datos del registro a crear
   * @returns {Promise} Promesa con los datos del registro creado
   */
  async createRegistro(data) {
    try {
      const response = await api.post('/registros/', data)
      return response.data
    } catch (error) {
      console.error('Error al crear registro:', error)
      throw error
    }
  },

  /**
   * Actualiza un registro existente
   * @param {number} id - ID del registro
   * @param {Object} data - Datos del registro a actualizar
   * @returns {Promise} Promesa con los datos del registro actualizado
   */
  async updateRegistro(id, data) {
    try {
      const response = await api.put(`/registros/${id}/`, data)
      return response.data
    } catch (error) {
      console.error(`Error al actualizar registro ${id}:`, error)
      throw error
    }
  },

  /**
   * Actualiza parcialmente un registro existente
   * @param {number} id - ID del registro
   * @param {Object} data - Datos parciales del registro a actualizar
   * @returns {Promise} Promesa con los datos del registro actualizado
   */
  async patchRegistro(id, data) {
    try {
      const response = await api.patch(`/registros/${id}/`, data)
      return response.data
    } catch (error) {
      console.error(`Error al actualizar parcialmente registro ${id}:`, error)
      throw error
    }
  },

  /**
   * Elimina (soft delete) un registro
   * @param {number} id - ID del registro
   * @returns {Promise} Promesa con los datos del registro eliminado
   */
  async deleteRegistro(id) {
    try {
      const response = await api.delete(`/registros/${id}/`)
      return response.data
    } catch (error) {
      console.error(`Error al eliminar registro ${id}:`, error)
      throw error
    }
  },

  /**
   * Obtiene la lista de empresas para los filtros
   * @returns {Promise} Promesa con los datos de empresas
   */
  async getEmpresas() {
    try {
      const response = await api.get('/empresas/')
      return response.data
    } catch (error) {
      console.error('Error al obtener empresas:', error)
      throw error
    }
  },

  /**
   * Obtiene la lista de rubros para los filtros
   * @returns {Promise} Promesa con los datos de rubros
   */
  async getRubros() {
    try {
      const response = await api.get('/rubros/')
      return response.data
    } catch (error) {
      console.error('Error al obtener rubros:', error)
      throw error
    }
  },

  /**
   * Obtiene la lista de tareas para los filtros
   * @returns {Promise} Promesa con los datos de tareas
   */
  async getTareas() {
    try {
      const response = await api.get('/tareas/')
      return response.data
    } catch (error) {
      console.error('Error al obtener tareas:', error)
      throw error
    }
  },

  /**
   * Obtiene la lista de usuarios asignados para los filtros
   * @returns {Promise} Promesa con los datos de usuarios asignados
   */
  async getUsuariosAsignados() {
    try {
      const response = await api.get('/usuarios-asignados/')
      return response.data
    } catch (error) {
      console.error('Error al obtener usuarios asignados:', error)
      throw error
    }
  },

  /**
   * Obtiene la lista de sucursales para los filtros
   * @param {Object} params - Parámetros opcionales (para paginación si el backend la requiere)
   * @returns {Promise} Promesa con los datos de sucursales
   */
  async getSucursales(params = {}) {
    try {
      const response = await api.get('/sucursales/', { params })
      // Si el backend retorna paginación, extraer results, sino retornar data directamente
      return response.data.results || response.data
    } catch (error) {
      console.error('Error al obtener sucursales:', error)
      throw error
    }
  },

  /**
   * Obtiene información sobre el archivo Excel de registros existente
   * @returns {Promise} Promesa con los datos del archivo (url, fecha, tamaño, etc.)
   */
  async getExcelRegistros() {
    try {
      const response = await api.get('/excel/registros/')
      return response.data
    } catch (error) {
      console.error('Error al obtener archivo Excel:', error)
      throw error
    }
  },

  /**
   * Descarga el archivo Excel de registros usando la URL del archivo
   * @returns {Promise} Promesa con el blob del archivo
   */
  async downloadExcelRegistros() {
    try {
      // Primero obtener la información del archivo
      const archivoInfo = await this.getExcelRegistros()
      
      console.log('📋 Información del archivo recibida:', archivoInfo)
      
      // El backend puede usar diferentes nombres de campo: 'archivo', 'file', 'file_url'
      const archivoUrl = archivoInfo.file_url || archivoInfo.file || archivoInfo.archivo
      
      console.log('📁 URL del archivo:', archivoUrl)
      
      if (!archivoInfo || !archivoUrl) {
        console.error('❌ No se encontró la URL del archivo. Objeto completo:', archivoInfo)
        throw new Error('No se encontró la URL del archivo')
      }
      
      // Usar la URL completa directamente
      let urlDescarga = archivoUrl
      
      console.log('📥 Descargando desde:', urlDescarga)
      
      // Usar axios sin el baseURL para archivos estáticos
      // Crear una instancia de axios sin interceptores para archivos estáticos
      const axios = (await import('axios')).default
      const response = await axios.get(urlDescarga, {
        responseType: 'blob'
      })
      
      // Agregar el nombre del archivo a la respuesta
      // El backend puede usar 'nombre_archivo' o 'nombre'
      response.fileName = archivoInfo.nombre_archivo || archivoInfo.nombre || 'registros.xlsx'
      
      // Si no tiene extensión, agregar .xlsx
      if (response.fileName && !response.fileName.endsWith('.xlsx')) {
        response.fileName += '.xlsx'
      }
      
      return response
    } catch (error) {
      console.error('❌ Error al descargar archivo Excel:', error)
      throw error
    }
  },

  /**
   * Genera un archivo Excel de registros con filtros aplicados
   * @param {Object} filtros - Filtros a aplicar
   * @param {number} filtros.subempresa_id - ID de la subempresa
   * @param {number} filtros.userbase_id - ID del usuario
   * @param {number} filtros.subrubro_id - ID del subrubro
   * @param {number} filtros.tarea_id - ID de la tarea
   * @param {string} filtros.fecha_desde - Fecha desde (YYYY-MM-DD)
   * @param {string} filtros.fecha_hasta - Fecha hasta (YYYY-MM-DD)
   * @param {number} filtros.ano_contable - Año contable
   * @param {string} filtros.order_by - Campo por el cual ordenar
   * @returns {Promise} Promesa con los datos del archivo generado
   */
  async generarExcelRegistros(filtros = {}) {
    try {
      // Usar un timeout extendido de 120 segundos para evitar bloqueos de Cloudflare
      // Cloudflare típicamente tiene un límite de 100 segundos, pero algunos planes permiten más
      // Si el backend procesa en background, esta petición debería completarse rápidamente
      const response = await api.post('/excel/registros/generar/', filtros, {
        timeout: 120000 // 120 segundos (2 minutos)
      })
      return response.data 
    } catch (error) {
      console.error('Error al generar archivo Excel:', error)
      
      // Manejar específicamente errores de timeout
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        const timeoutError = new Error('La generación del Excel está tardando más de lo esperado. Por favor, inténtalo de nuevo o contacta al administrador.')
        timeoutError.isTimeout = true
        throw timeoutError
      }
      
      throw error
    }
  }
}

export default registrosService

