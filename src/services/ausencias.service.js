// src/services/ausencias.service.js
import { api } from 'boot/axios'
export const ausenciasService = {
  /**
   * Obtiene la lista de ausencias con filtros opcionales.
   * @param {Object} params - Parámetros de filtrado
   * @param {number} params.page - Número de página
   * @param {number} params.page_size - Tamaño de página
   * @param {number} params.usuario - ID del usuario (UserBase)
   * @param {string} params.fecha_desde - Fecha desde (YYYY-MM-DD)
   * @param {string} params.fecha_hasta - Fecha hasta (YYYY-MM-DD)
   * @param {string} params.tipo_ausencia - 'parcial' o 'completo'
   * @param {boolean} params.activo - true/false
   * @param {number} params.motivo - ID del motivo de ausencia
   * @returns {Promise} Promesa con los datos de ausencias
   */
  async getAusencias(params = {}) {
    try {
      const response = await api.get('/ausencias/', { params })
      return response.data
    } catch (error) {
      console.error('Error al obtener ausencias:', error)
      throw error
    }
  },
    /**
   * Crea un nuevo Ausencias
   * @param {Object} data - Datos del Ausencias a crear
   * @returns {Promise} Promesa con los datos del Ausencias creado
   */
    async createAusencias(data) {
      try {
        const response = await api.post('/ausencias/', data)
        return response.data
      } catch (error) {
        console.error('Error al crear registro:', error)
        throw error
      }
    },
  
    /**
     * Actualiza un Ausencias existente
     * @param {number} id - ID del Ausencias
     * @param {Object} data - Datos del Ausencias a actualizar
     * @returns {Promise} Promesa con los datos del Ausencias actualizado
     */
    async updateRegistro(id, data) {
      try {
        const response = await api.put(`/ausencias/${id}/`, data)
        return response.data
      } catch (error) {
        console.error(`Error al actualizar registro ${id}:`, error)
        throw error
      }
    },
  
    /**
     * Actualiza parcialmente un Ausencias existente
     * @param {number} id - ID del Ausencias
     * @param {Object} data - Datos parciales del Ausencias a actualizar
     * @returns {Promise} Promesa con los datos del Ausencias actualizado
     */
    async patchAusencias(id, data) {
      try {
        const response = await api.patch(`/ausencias/${id}/`, data)
        return response.data
      } catch (error) {
        console.error(`Error al actualizar parcialmente registro ${id}:`, error)
        throw error
      }
    },
  
    /**
     * Elimina (soft delete) un Ausencias
     * @param {number} id - ID del Ausencias
     * @returns {Promise} Promesa con los datos del Ausencias eliminado
     */
    async deleteRegistro(id) {
      try {
        const response = await api.delete(`/ausencias/${id}/`)
        return response.data
      } catch (error) {
        console.error(`Error al eliminar registro ${id}:`, error)
        throw error
      }
    },

    /**
     * Elimina (soft delete) un Ausencias (alias para deleteRegistro)
     * @param {number} id - ID del Ausencias
     * @returns {Promise} Promesa con los datos del Ausencias eliminado
     */
    async deleteAusencia(id) {
      return this.deleteRegistro(id)
    },

    /**
     * Obtiene información del archivo Excel de ausencias generado
     * @returns {Promise} Promesa con los datos del archivo Excel
     */
    async getExcelAusencias() {
      try {
        const response = await api.get('/excel/ausencias/')
        return response.data
      } catch (error) {
        console.error('Error al obtener información del Excel de ausencias:', error)
        throw error
      }
    },

    /**
     * Descarga el archivo Excel de ausencias generado
     * @returns {Promise} Promesa con el archivo Excel
     */
    async downloadExcelAusencias() {
      try {
        // Primero obtener la información del archivo
        const archivoInfo = await this.getExcelAusencias()
        
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
        const axios = (await import('axios')).default
        const response = await axios.get(urlDescarga, {
          responseType: 'blob'
        })
        
        // Agregar el nombre del archivo a la respuesta
        response.fileName = archivoInfo.nombre_archivo || archivoInfo.nombre || 'ausencias.xlsx'
        
        // Si no tiene extensión, agregar .xlsx
        if (response.fileName && !response.fileName.endsWith('.xlsx')) {
          response.fileName += '.xlsx'
        }
        
        return response
      } catch (error) {
        console.error('Error al descargar Excel de ausencias:', error)
        throw error
      }
    },

    /**
     * Genera un archivo Excel de ausencias con filtros aplicados
     * @param {Object} filtros - Filtros a aplicar
     * @param {number} filtros.usuario - ID del usuario (UserBase)
     * @param {string} filtros.fecha_desde - Fecha desde (YYYY-MM-DD)
     * @param {string} filtros.fecha_hasta - Fecha hasta (YYYY-MM-DD)
     * @param {string} filtros.tipo_ausencia - 'parcial' o 'completo'
     * @param {boolean} filtros.activo - true/false
     * @param {number} filtros.motivo - ID del motivo de ausencia
     * @returns {Promise} Promesa con los datos del archivo generado
     */
    async generarExcelAusencias(filtros = {}) {
      try {
        // Usar un timeout extendido de 120 segundos para evitar bloqueos de Cloudflare
        const response = await api.post('/excel/ausencias/generar/', filtros, {
          timeout: 120000 // 120 segundos (2 minutos)
        })
        return response.data 
      } catch (error) {
        console.error('Error al generar archivo Excel de ausencias:', error)
        
        // Manejar específicamente errores de timeout
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          const timeoutError = new Error('La generación del Excel está tardando más de lo esperado. Por favor, inténtalo de nuevo o contacta al administrador.')
          timeoutError.isTimeout = true
          throw timeoutError
        }
        
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
     * Obtiene la lista de motivos de ausencia
     * @returns {Promise} Promesa con los datos de motivos de ausencia
     */
    async getMotivosAusencia() {
        try {
        const response = await api.get('/motivos-ausencia/')
        return response.data
        } catch (error) {
        console.error('Error al obtener motivos de ausencia:', error)
        throw error
        }
    },

}