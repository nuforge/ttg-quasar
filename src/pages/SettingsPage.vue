<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { ref, onMounted } from 'vue'

const { locale, availableLocales } = useI18n({ useScope: 'global' });
const $q = useQuasar();

// Create a ref for theme mode
const themeMode = ref<string>('auto');

// Theme options
const themeOptions = [
  { label: 'Auto (System)', value: 'auto', icon: 'mdi-theme-light-dark' },
  { label: 'Light', value: 'light', icon: 'mdi-white-balance-sunny' },
  { label: 'Dark', value: 'dark', icon: 'mdi-weather-night' }
];

// Function to set the dark mode
const setThemeMode = (mode: string) => {
  themeMode.value = mode;

  if (mode === 'auto') {
    $q.dark.set('auto');
  } else if (mode === 'dark') {
    $q.dark.set(true);
  } else {
    $q.dark.set(false);
  }

  // Save preference to localStorage
  localStorage.setItem('themeMode', mode);
};

// Initialize theme from saved preference
onMounted(() => {
  const savedTheme = localStorage.getItem('themeMode');
  if (savedTheme && ['auto', 'light', 'dark'].includes(savedTheme)) {
    setThemeMode(savedTheme);
  } else {
    // Set initial value based on current Quasar dark mode setting
    themeMode.value = $q.dark.isActive ? 'dark' : ($q.dark.mode === 'auto' ? 'auto' : 'light');
  }
});
</script>

<template>
  <div class="text-h6 text-uppercase"><q-icon name="mdi-cog-outline" /> {{ $t('setting', 2) }}</div>

  <div class="q-mt-md">
    <label>{{ $t('language') }}</label>
    <q-select v-model="locale" :options="availableLocales" dense outlined />
  </div>

  <!-- Theme Selection -->
  <div class="q-mt-lg">
    <label>Theme</label>
    <q-select v-model="themeMode" :options="themeOptions" @update:model-value="setThemeMode" dense outlined emit-value
      map-options>
      <!-- Custom display for the options -->
      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section avatar>
            <q-icon :name="scope.opt.icon" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <!-- Custom display for the selected option -->
      <template v-slot:selected>
        <q-item>
          <q-item-section avatar>
            <q-icon :name="themeOptions.find(opt => opt.value === themeMode)?.icon || 'mdi-theme-light-dark'" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{themeOptions.find(opt => opt.value === themeMode)?.label || 'Auto (System)'
              }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>
