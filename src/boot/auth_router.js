import {boot} from 'quasar/wrappers'
import {isLoggedIn, user_detail, isAdmin, loadUserDetail} from "src/utils/auth";
import {Notify} from 'quasar'

export default boot(({router, store}) => {
  router.beforeEach(async (to, from, next) => {
    console.log('🔍 [AUTH GUARD] Navegando de:', from.path, '→', to.path)
    console.log('🔍 [AUTH GUARD] ¿Requiere auth?:', to.meta.requiresAuth)
    console.log('🔍 [AUTH GUARD] ¿Está logueado?:', isLoggedIn.value)
    console.log('🔍 [AUTH GUARD] Detalles de usuario:', user_detail.value)

    // Verificar autenticación
    if (to.meta.requiresAuth && !isLoggedIn.value) {
      console.log('❌ [AUTH GUARD] No está autenticado, redirigiendo a login');
      next({name: 'login'});
      return;
    }
    
    // Verificar si la ruta requiere permisos de administrador
    if (to.meta.requiresAdmin) {
      console.log('🔍 [AUTH GUARD] Verificando permisos de administrador...');
      
      // Esperar a que se resuelva la promesa de isAdmin
      const userIsAdmin = await isAdmin();
      console.log('🔍 [AUTH GUARD] ¿Es administrador?:', userIsAdmin);
      
      if (!userIsAdmin) {
        console.log('❌ [AUTH GUARD] No tiene permisos de administrador');
        
        // Mostrar notificación
        Notify.create({
          type: 'negative',
          message: 'No tienes permisos para acceder a esta sección',
          position: 'top',
          timeout: 3000
        });
        
        // Redirigir a la página principal
        next({name: 'index'});
        return;
      }
    }
    
    // Si pasa todas las verificaciones, permitir navegación
    console.log('✅ [AUTH GUARD] Acceso permitido a:', to.path);
    next();
  })
})