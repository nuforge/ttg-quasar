<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  selectedCount: number;
  processing?: boolean;
}

withDefaults(defineProps<Props>(), {
  processing: false,
});

const emit = defineEmits<{
  cancel: [];
  delete: [];
  deselectAll: [];
}>();
</script>

<template>
  <transition enter-active-class="animated fadeInDown" leave-active-class="animated fadeOutUp" mode="out-in">
    <q-toolbar v-if="selectedCount > 0" class="bulk-actions-bar text-white ">
      <div class="row items-center q-gutter-md full-width">
        <q-chip :label="`${selectedCount} ${t('selected')}`" text-color="primary" icon="mdi-check-circle" />

        <q-space />

        <q-btn-group flat>
          <q-btn flat icon="mdi-calendar-remove" :label="t('adminEvents.cancelAll')" @click="emit('cancel')"
            :loading="processing" :disable="processing" :aria-label="t('adminEvents.cancelAll')" />
          <q-btn flat icon="mdi-delete-outline" :label="t('deleteAll')" @click="emit('delete')" :loading="processing"
            :disable="processing" :aria-label="t('deleteAll')" />
        </q-btn-group>

        <q-separator vertical dark class="q-mx-sm" />

        <q-btn flat round icon="mdi-close" @click="emit('deselectAll')" :disable="processing"
          :aria-label="t('clearSelection')">
          <q-tooltip>{{ t('clearSelection') }}</q-tooltip>
        </q-btn>
      </div>
    </q-toolbar>
  </transition>
</template>

<style scoped>
.bulk-actions-bar {
  border-radius: 8px;
  margin-bottom: 16px;
}
</style>
