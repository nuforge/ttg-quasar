<script setup lang="ts">
import QRScanner from './QRScanner.vue';

</script>

<template>

  <q-dialog persistent>
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">{{ $t('scan') }} QR Code</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <QRScanner />
      </q-card-section>

      <q-card-actions align="right" class="text-primary">
        <q-btn flat :label="$t('cancel')" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>
