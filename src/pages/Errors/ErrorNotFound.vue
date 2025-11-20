<template>
  <div class="fullscreen bg-primary text-white text-center q-pa-md flex flex-center">
    <div class="q-pa-lg q-gutter-lg" style="background: rgba(255,255,255,0.05); border-radius: 32px; box-shadow: 0 6px 24px 0 rgba(0,0,0,0.25);">
      <div style="font-size: 10vh; font-weight: bold; text-shadow: 0px 4px 18px rgba(0,0,0,0.14); letter-spacing: 10px;">
        <q-icon name="sentiment_dissatisfied" size="2.7em" class="q-mb-sm text-white" style="vertical-align: sub;" />
        404
      </div>

      <div class="text-h4 q-mb-md" style="opacity:.8; font-weight:500;letter-spacing:1px;">
        ¡Página no encontrada!
      </div>
      <div class="text-subtitle1 q-mb-xl" style="opacity:0.7">
        Lo sentimos, la página que buscas no existe <br />
        o fue movida a otro sitio.
      </div>

      <q-btn
        class="q-mt-md"
        color="white"
        text-color="primary"
        icon="arrow_back"
        unelevated
        to="/"
        size="lg"
        label="Volver al inicio"
        no-caps
      />
    </div>
  </div>
</template>

<script setup>
// No se requiere lógica específica para esta página de error.
</script>
