<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { locale, availableLocales } = useI18n({ useScope: 'global' });

</script>

<template>
  <q-page>
    <q-page-container>
      <div class="text-h6 text-uppercase"><q-icon name="mdi-cog-outline" /> {{ $t('setting', 2) }}</div>
      <q-label>{{ $t('language') }}</q-label>
      <q-select v-model="locale" :options="availableLocales" dense outlined />

    </q-page-container>
  </q-page>
</template>
