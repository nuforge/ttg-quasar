<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { ref, onMounted, watch } from 'vue'
import { useUserPreferencesStore } from 'src/stores/user-preferences-store';
import { useLanguage } from 'src/composables/useLanguage';

const { t } = useI18n({ useScope: 'global' });
const $q = useQuasar();
const preferencesStore = useUserPreferencesStore();
const { setLanguage } = useLanguage();

// Language options for the selector
const languageOptions = [
  { label: 'English', value: 'en-US', flag: '🇺🇸' },
  { label: 'Español', value: 'en-ES', flag: '🇪🇸' }
];

// Current language selection
const selectedLanguage = ref<string>('en-US');

// Update language function
const updateLanguage = async (newLanguage: string) => {
  try {
    await setLanguage(newLanguage as 'en-US' | 'en-ES');
    selectedLanguage.value = newLanguage;
    $q.notify({
      type: 'positive',
      message: t('notifications.languageUpdated'),
      position: 'top',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: t('notifications.failedToUpdateLanguage'),
      position: 'top',
    });
  }
};

// Create a ref for theme mode
const themeMode = ref<string>('auto');

// State for notifications
const saving = ref(false);

// Theme options
const themeOptions = [
  { label: 'Auto (System)', value: 'auto', icon: 'mdi-theme-light-dark' },
  { label: 'Light', value: 'light', icon: 'mdi-white-balance-sunny' },
  { label: 'Dark', value: 'dark', icon: 'mdi-weather-night' }
];

// Global notification settings
const globalSettings = ref({
  emailNotifications: true,
  pushNotifications: true,
  defaultNotifyDaysBefore: 3,
});

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

// Update global notification settings
const updateGlobalSettings = async () => {
  if (saving.value) return;

  saving.value = true;
  try {
    await preferencesStore.updateGlobalSettings(globalSettings.value);
    $q.notify({
      type: 'positive',
      message: 'Settings updated successfully',
      position: 'top',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Failed to update settings',
      position: 'top',
    });
  } finally {
    saving.value = false;
  }
};

// Watch for changes in store global settings
watch(
  () => preferencesStore.globalSettings,
  (newSettings) => {
    if (newSettings) {
      globalSettings.value = { ...newSettings };
    }
  },
  { immediate: true, deep: true }
);

// Initialize theme from saved preference
onMounted(() => {
  const savedTheme = localStorage.getItem('themeMode');
  if (savedTheme && ['auto', 'light', 'dark'].includes(savedTheme)) {
    setThemeMode(savedTheme);
  } else {
    // Set initial value based on current Quasar dark mode setting
    themeMode.value = $q.dark.isActive ? 'dark' : ($q.dark.mode === 'auto' ? 'auto' : 'light');
  }

  // Initialize language preference
  const currentLanguage = localStorage.getItem('ttg-preferred-language') || 'en-US';
  selectedLanguage.value = currentLanguage;
});
</script>

<template>
  <q-page class="q-pa-md">
    <div class="q-mb-lg">
      <h4 class="text-h4 q-mb-sm">{{ t('settings.title') }}</h4>
      <p class="text-body1 text-grey-7">
        {{ t('settings.description') }}
      </p>
    </div>

    <div class="row q-gutter-lg">
      <!-- App Settings Card -->
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="mdi-tune" class="q-mr-sm" />
              {{ t('settings.appSettings') }}
            </div>

            <div class="q-gutter-lg">
              <div>
                <label class="text-subtitle2 q-mb-sm block">{{ t('settings.language') }}</label>
                <q-select v-model="selectedLanguage" :options="languageOptions" @update:model-value="updateLanguage"
                  dense outlined emit-value map-options>
                  <template v-slot:option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section avatar>
                        <span class="text-h6">{{ scope.opt.flag }}</span>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ scope.opt.label }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>

                  <template v-slot:selected>
                    <q-item>
                      <q-item-section avatar>
                        <span class="text-h6">{{languageOptions.find(opt => opt.value === selectedLanguage)?.flag ||
                          '🇺🇸'}}</span>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{languageOptions.find(opt => opt.value === selectedLanguage)?.label || 'English'
                        }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div>
                <label class="text-subtitle2 q-mb-sm block">{{ t('settings.theme') }}</label>
                <q-select v-model="themeMode" :options="themeOptions" @update:model-value="setThemeMode" dense outlined
                  emit-value map-options>
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
                        <q-icon
                          :name="themeOptions.find(opt => opt.value === themeMode)?.icon || 'mdi-theme-light-dark'" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{themeOptions.find(opt => opt.value === themeMode)?.label || 'Auto (System)'
                          }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Notification Settings Card -->
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="mdi-bell-cog" class="q-mr-sm" />
              {{ t('settings.notificationSettings') }}
            </div>

            <div class="q-gutter-md">
              <q-toggle v-model="globalSettings.emailNotifications" :label="t('settings.emailNotifications')"
                :disable="saving" @update:model-value="updateGlobalSettings" />

              <q-toggle v-model="globalSettings.pushNotifications" :label="t('settings.browserNotifications')"
                :disable="saving" @update:model-value="updateGlobalSettings" />

              <div>
                <q-field :label="t('settings.defaultNotificationTiming')" stack-label borderless>
                  <template v-slot:control>
                    <q-slider v-model="globalSettings.defaultNotifyDaysBefore" :min="1" :max="14" :step="1" label
                      :label-value="`${globalSettings.defaultNotifyDaysBefore} day${globalSettings.defaultNotifyDaysBefore !== 1 ? 's' : ''} before`"
                      color="primary" @update:model-value="updateGlobalSettings" class="q-mt-md" />
                  </template>
                </q-field>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>
