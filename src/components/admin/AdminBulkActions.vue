<script setup lang="ts">
interface Props {
  selectedCount: number;
  processing?: boolean;
}

withDefaults(defineProps<Props>(), {
  processing: false,
});

const emit = defineEmits<{
  approve: [];
  reject: [];
  delete: [];
  deselectAll: [];
}>();
</script>

<template>
  <transition
    enter-active-class="animated fadeInDown"
    leave-active-class="animated fadeOutUp"
    mode="out-in"
  >
    <q-toolbar v-if="selectedCount > 0" class="bulk-actions-bar bg-primary text-white">
      <div class="row items-center q-gutter-md full-width">
        <q-chip
          :label="`${selectedCount} selected`"
          color="white"
          text-color="primary"
          icon="mdi-check-circle"
        />

        <q-space />

        <q-btn-group flat>
          <q-btn
            flat
            icon="mdi-check-all"
            label="Approve All"
            @click="emit('approve')"
            :loading="processing"
            :disable="processing"
            aria-label="Approve all selected games"
          />
          <q-btn
            flat
            icon="mdi-close-circle-outline"
            label="Reject All"
            @click="emit('reject')"
            :loading="processing"
            :disable="processing"
            aria-label="Reject all selected games"
          />
          <q-btn
            flat
            icon="mdi-delete-outline"
            label="Delete All"
            @click="emit('delete')"
            :loading="processing"
            :disable="processing"
            aria-label="Delete all selected games"
          />
        </q-btn-group>

        <q-separator vertical dark class="q-mx-sm" />

        <q-btn
          flat
          round
          icon="mdi-close"
          @click="emit('deselectAll')"
          :disable="processing"
          aria-label="Clear selection"
        >
          <q-tooltip>Clear selection</q-tooltip>
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

