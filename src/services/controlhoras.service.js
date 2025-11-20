// src/services/controlhoras.service.js
import { api } from 'boot/axios'

/**
 * Campos y reglas de sólo lectura según el serializer de ControlHora:
 * fields = [
 *   'id',
 *   'userbase',
 *   'usuario_nombre',
 *   'fecha',
 *   'tiempo_inicio',
 *   'tiempo_fin',
 *   'coor_inicio_x',
 *   'coor_inicio_y',
 *   'coor_fin_x',
 *   'coor_fin_y',
 *   'intervalo_tiempo',
 *   'activo',
 *   'estado',
 *   'estado_display',
 *   'created_at',
 *   'updated_at',
 *   'creado_por',
 *   'creado_por_nombre',
 *   'modificado_por',
 *   'modificado_por_nombre',
 *   'segundos_transcurridos',
 *   'horas_totales',
 * ]
 * read_only_fields = ['id', 'created_at', 'updated_at', 'intervalo_tiempo']
 */
export const controlhorasService = {
  /**
   * Obtiene la lista de registros de Control de Horas, con soporte para filtros.
   * @param {Object} params - Filtros para la consulta
   * @param {number} params.page
   * @param {number} params.page_size
   * @param {number} params.userbase - ID del usuario
   * @param {string} params.fecha - Fecha específica o filtros relacionados
   * @param {string} params.fecha_desde - Desde esta fecha (YYYY-MM-DD)
   * @param {string} params.fecha_hasta - Hasta esta fecha (YYYY-MM-DD)
   * @param {boolean} params.activo - Filtrar por estado activo
   * @param {string} params.estado - Estado del registro
   * @returns {Promise<Object[]>}
   */
  async getControlHoras(params = {}) {
    try {
      const response = await api.get('/control-horas/', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener control de horas:', error);
      throw error;
    }
  },

  /**
   * Crea un nuevo registro de Control de Hora.
   * Recibe un objeto con todos los campos menos los de sólo lectura.
   * @param {Object} data - Campos para creación (no incluir id, created_at, updated_at ni intervalo_tiempo)
   * @returns {Promise<Object>}
   */
  async createControlHora(data) {
    // Los campos de sólo lectura ('id', 'created_at', 'updated_at', 'intervalo_tiempo') serán ignorados por el backend si se envían
    try {
      const payload = { ...data };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.intervalo_tiempo;
      const response = await api.post('/control-horas/', payload);
      return response.data;
    } catch (error) {
      console.error('Error al crear registro:', error);
      throw error;
    }
  },

  /**
   * Actualiza completamente un registro existente de Control de Hora.
   * @param {number} id - ID del registro
   * @param {Object} data - Campos a actualizar (no incluir los sólo lectura)
   * @returns {Promise<Object>}
   */
  async updateControlHora(id, data) {
    try {
      const payload = { ...data };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.intervalo_tiempo;
      const response = await api.put(`/control-horas/${id}/`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar registro ${id}:`, error);
      throw error;
    }
  },

  /**
   * Actualiza sólo algunos campos de un registro (PATCH).
   * @param {number} id
   * @param {Object} data - Campos parciales a cambiar (no incluir los de sólo lectura)
   * @returns {Promise<Object>}
   */
  async patchControlHora(id, data) {
    try {
      const payload = { ...data };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.intervalo_tiempo;
      const response = await api.patch(`/control-horas/${id}/`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar parcialmente registro ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina (soft delete) un registro de Control de Hora.
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async deleteControlHora(id) {
    try {
      const response = await api.delete(`/control-horas/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar registro ${id}:`, error);
      throw error;
    }
  },

  /**
   * Alias para eliminar un registro (por compatibilidad).
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async eliminar(id) {
    return this.deleteControlHora(id);
  },

  /**
   * Obtiene información del archivo Excel generado del control de horas.
   * @returns {Promise<Object>}
   */
  async getExcelControlHoras() {
    try {
      const response = await api.get('/excel/control-horas/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener información del Excel de control de horas:', error);
      throw error;
    }
  },

  /**
   * Descarga el archivo Excel generado para el control de horas.
   * @returns {Promise<Blob>} Archivo descargado (con fileName adjunto)
   */
  async downloadExcelControlHoras() {
    try {
      const archivoInfo = await this.getExcelControlHoras();
      const archivoUrl = archivoInfo.file_url || archivoInfo.file || archivoInfo.archivo;
      if (!archivoInfo || !archivoUrl) {
        throw new Error('No se encontró la URL del archivo');
      }
      const axios = (await import('axios')).default;
      const response = await axios.get(archivoUrl, { responseType: 'blob' });
      response.fileName = archivoInfo.nombre_archivo || archivoInfo.nombre || 'control_horas.xlsx';
      if (response.fileName && !response.fileName.endsWith('.xlsx')) {
        response.fileName += '.xlsx';
      }
      return response;
    } catch (error) {
      console.error('Error al descargar Excel de control de horas:', error);
      throw error;
    }
  },

  /**
   * Solicita la generación de un nuevo archivo Excel para control de horas, con filtros.
   * @param {Object} filtros - Filtros para generar el Excel
   * @returns {Promise<Object>} Info archivo generado
   */
  async generarExcelControlHoras(filtros = {}) {
    try {
      const response = await api.post('/excel/control-horas/generar/', filtros, { timeout: 120000 });
      return response.data;
    } catch (error) {
      console.error('Error al generar archivo Excel de control de horas:', error);
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        const timeoutError = new Error('La generación del Excel está tardando más de lo esperado. Por favor, inténtalo de nuevo o contacta al administrador.');
        timeoutError.isTimeout = true;
        throw timeoutError;
      }
      throw error;
    }
  },

  /**
   * Obtiene la lista de usuarios asignados al módulo de control de horas.
   * @returns {Promise<Object[]>}
   */
  async getUsuariosAsignados() {
    try {
      const response = await api.get('/usuarios-asignados/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios asignados para control de horas:', error);
      throw error;
    }
  }
}
