# Guía de Debugging - Sistema de Excel

## Problema: No aparece el botón "Descargar Excel Generado"

### Checklist de Verificación

#### 1. **Verificar respuesta del endpoint `/excel/registros/`**

Abrir DevTools del navegador (F12) y en la pestaña Network, buscar la petición GET a `/excel/registros/`.

**Respuesta esperada (200 OK):**
```json
{
  "id": 42,
  "usuario": 1,
  "archivo": "/media/excel/registros_2024-11-18.xlsx",
  "nombre_archivo": "registros_2024-11-18.xlsx",
  "fecha_generado": "2024-11-18T10:30:00Z",
  "procesando": false,
  "tipo_archivo": "REGISTROS",
  "created_at": "2024-11-18T10:29:00Z"
}
```

**Si retorna 404:**
- Significa que no hay archivos generados aún para ese usuario
- Normal si es la primera vez que se genera
- Solución: Generar un archivo primero usando el botón "Generar Excel"

#### 2. **Verificar campo `procesando`**

El botón solo aparece cuando `procesando: false`

**Si `procesando: true`:**
- El archivo se está generando en background
- El frontend espera 3 segundos y vuelve a verificar automáticamente
- Ver en consola: `⏳ Archivo Excel en proceso de generación...`

**Si se queda en `procesando: true` por mucho tiempo:**
- Verificar logs del backend Django
- Puede haber un error en el thread de generación
- Revisar la tabla `Archivo` en la base de datos

#### 3. **Verificar campo `archivo` (URL del archivo)**

La respuesta debe incluir el campo `archivo` con la URL del archivo:

```json
{
  "archivo": "/media/excel/registros_2024-11-18.xlsx"
}
```

**Si falta el campo `archivo`:**
- Verificar el ArchivoSerializer en Django
- Asegurarse de que el campo esté incluido en el serializer
- Verificar que el archivo físico exista en el servidor

#### 4. **Verificar consola del navegador**

Abrir DevTools → Console y buscar estos mensajes:

**Archivo detectado correctamente:**
```
📊 Archivo Excel existente detectado: {id: 42, archivo: "/media/...", ...}
```

**No hay archivo:**
```
ℹ️ No hay archivo Excel generado aún
```

**Archivo en proceso:**
```
⏳ Archivo Excel en proceso de generación...
```

**Error:**
```
❌ Error al verificar archivo Excel: ...
```

#### 5. **Verificar estado de la variable reactiva**

En Vue DevTools (extensión del navegador), buscar el componente `IndexPage` y verificar:

- `archivoExcelExiste`: debe ser `true` para que aparezca el botón
- `fechaUltimoExcel`: debe tener una fecha válida
- `descargandoExcel`: debe ser `false` (si es `true`, el botón está cargando)

### Flujo Completo de Debugging

#### Paso 1: Generar el archivo
```
1. Aplicar filtros (opcional)
2. Click en "Generar Excel"
3. Verificar notificación: "Generación de Excel iniciada"
4. Esperar mensaje: "Puedes descargar el archivo usando el botón..."
```

#### Paso 2: Verificar en Network
```
1. F12 → Network
2. Filtrar por "excel"
3. Buscar: POST /excel/registros/generar/
4. Verificar respuesta 200 OK con:
   {
     "message": "Generación de Excel iniciada",
     "archivo": { "id": ..., "procesando": true }
   }
```

#### Paso 3: Esperar procesamiento
```
1. El frontend automáticamente verifica cada 3 segundos
2. Ver en Network: GET /excel/registros/ (repetidos)
3. Esperar hasta que "procesando": false
```

#### Paso 4: Botón debe aparecer
```
1. Cuando procesando=false, el botón aparece
2. Hacer click en "Descargar Excel Generado"
3. El archivo se descarga automáticamente
```

### Problemas Comunes

#### Problema: GET /excel/registros/ retorna 404

**Causa:** No hay archivos generados para ese usuario

**Solución:**
1. Hacer POST /excel/registros/generar/ primero
2. Verificar que el usuario autenticado sea correcto
3. Revisar tabla `Archivo` en la BD:
   ```sql
   SELECT * FROM archivo 
   WHERE usuario_id = <user_id> 
   AND tipo_archivo = 'REGISTROS'
   ORDER BY fecha_generado DESC;
   ```

#### Problema: Archivo siempre en `procesando: true`

**Causa:** El thread de generación falló

**Solución:**
1. Ver logs de Django para errores
2. Verificar que la función `crearExcelRegistros` funcione
3. Actualizar manualmente en la BD:
   ```sql
   UPDATE archivo 
   SET procesando = false 
   WHERE id = <archivo_id>;
   ```

#### Problema: Campo `archivo` es `null`

**Causa:** El archivo no se generó o se borró

**Solución:**
1. Verificar que el directorio `media/excel/` exista
2. Verificar permisos de escritura
3. Re-generar el archivo

#### Problema: Error CORS al descargar

**Causa:** El backend no permite descargar desde el frontend

**Solución:**
1. Verificar configuración CORS en Django
2. Agregar `/media/` a las rutas permitidas
3. Verificar headers de la respuesta

#### Problema: El botón no descarga nada

**Causa:** Error en la función `downloadExcelRegistros`

**Solución:**
1. Abrir Console → Network
2. Ver la petición GET al archivo
3. Verificar respuesta (debe ser blob)
4. Ver errores en Console

### Debugging en Backend (Django)

#### Verificar modelo Archivo
```python
# En Django shell
from tu_app.models import Archivo
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.get(username='tu_usuario')

# Listar archivos del usuario
archivos = Archivo.objects.filter(
    usuario=user,
    tipo_archivo=Archivo.REGISTROS
).order_by('-fecha_generado')

for archivo in archivos:
    print(f"ID: {archivo.id}")
    print(f"Nombre: {archivo.nombre_archivo}")
    print(f"Procesando: {archivo.procesando}")
    print(f"Archivo: {archivo.archivo}")
    print(f"Fecha: {archivo.fecha_generado}")
    print("---")
```

#### Verificar serializer
```python
# En Django shell
from tu_app.serializers import ArchivoSerializer

archivo = Archivo.objects.last()
serializer = ArchivoSerializer(archivo)
print(serializer.data)

# Debe incluir:
# - id
# - usuario
# - archivo (URL)
# - nombre_archivo
# - fecha_generado
# - procesando
# - tipo_archivo
```

### Testing Manual

#### Test 1: Generar primer archivo
```
1. Usuario sin archivos previos
2. Click "Generar Excel"
3. Esperar 3-5 segundos
4. Botón "Descargar Excel Generado" debe aparecer
5. Click en el botón
6. Archivo debe descargarse
```

#### Test 2: Re-generar archivo
```
1. Usuario con archivo existente
2. Aplicar diferentes filtros
3. Click "Generar Excel"
4. El archivo anterior se elimina
5. Se crea uno nuevo
6. Botón se actualiza con nueva fecha
```

#### Test 3: Múltiples usuarios
```
1. Usuario A genera su archivo
2. Usuario B genera su archivo
3. Usuario A solo ve su archivo
4. Usuario B solo ve su archivo
```

### Logs Útiles

En el frontend (Console):
- `🔄 Iniciando generación de Excel en el backend...`
- `📋 Filtros a enviar: {...}`
- `📤 Filtros mapeados: {...}`
- `✅ Respuesta del servidor: {...}`
- `📊 Archivo Excel existente detectado: {...}`
- `⏳ Archivo Excel en proceso de generación...`
- `📥 Descargando archivo Excel existente...`

En el backend (Django logs):
- `Generando Excel para usuario X con Y registros`
- `Excel generado exitosamente: archivo.xlsx`
- `Error al generar Excel: ...`

### Resumen de la Lógica

```
1. onMounted() → verificarArchivoExcel()
2. GET /excel/registros/
3. Si 404 → No hay archivo → Botón oculto
4. Si 200 y procesando=true → Esperar 3s → Repetir paso 2
5. Si 200 y procesando=false → archivoExcelExiste=true → Botón visible
6. Click botón → downloadExcelRegistros()
7. GET /excel/registros/ → Obtener info
8. GET archivo.archivo → Descargar blob
9. Crear link → Click automático → Descarga
```

