<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { locale, availableLocales } = useI18n({ useScope: 'global' });

</script>

<template>
  <div class="text-h6 text-uppercase"><q-icon name="mdi-cog-outline" /> {{ $t('setting', 2) }}</div>
  <label>{{ $t('language') }}</label>
  <q-select v-model="locale" :options="availableLocales" dense outlined />
</template>
