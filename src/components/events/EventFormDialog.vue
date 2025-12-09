<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventForm } from 'src/composables/useEventForm';
import type { Event } from 'src/models/Event';

const { t } = useI18n();

interface Props {
  modelValue: boolean;
  event?: Event | null;
  isAdmin?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  event: null,
  isAdmin: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submitted: [eventId?: string];
  updated: [eventId: string];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const eventForm = useEventForm({
  onSubmitted: (eventId) => emit('submitted', eventId),
  onUpdated: (eventId) => emit('updated', eventId),
});

const dialogTitle = computed(() =>
  eventForm.isEditMode.value ? t('eventForm.editEvent') : t('eventForm.createEvent'),
);
const submitLabel = computed(() =>
  eventForm.isEditMode.value ? t('saveChanges') : t('eventForm.createEvent'),
);

// Sync event prop with form
watch(() => props.event, (event) => eventForm.setEvent(event ?? null), { immediate: true });

// Reset form when dialog closes
watch(dialogVisible, (visible) => {
  if (!visible && !eventForm.isEditMode.value) eventForm.resetForm();
});

const handleSubmit = async () => {
  const success = await eventForm.submitForm();
  if (success) dialogVisible.value = false;
};
</script>

<template>
  <q-dialog v-model="dialogVisible" persistent max-width="700px">
    <q-card class="event-form-dialog">
      <q-card-section class="q-pb-none">
        <div class="row items-center justify-between">
          <div class="text-h6">
            <q-icon :name="eventForm.isEditMode.value ? 'mdi-calendar-edit' : 'mdi-calendar-plus'" class="q-mr-sm" />
            {{ dialogTitle }}
          </div>
          <q-btn flat round dense icon="mdi-close" @click="dialogVisible = false" :disable="eventForm.loading.value" />
        </div>
        <div v-if="!eventForm.isEditMode.value" class="text-body2 text-grey-6 q-mt-sm">
          {{ t('eventForm.subtitle') }}
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
          <!-- Event Title -->
          <q-input v-model="eventForm.formData.value.title" :label="`${t('eventTitle')} *`"
            outlined dense :rules="[eventForm.requiredRule]" lazy-rules aria-required="true" />

          <!-- Game Selection -->
          <q-select v-model="eventForm.formData.value.gameId" :options="eventForm.gameOptions.value"
            :label="`${t('game', 1)} *`" outlined dense emit-value map-options use-input
            fill-input hide-selected input-debounce="0" :rules="[eventForm.requiredRule]"
            lazy-rules aria-required="true" @filter="(val, update) => update(() => {})">
            <template #no-option>
              <q-item><q-item-section class="text-grey">{{ t('noResultsFound') }}</q-item-section></q-item>
            </template>
          </q-select>

          <!-- Date and Time -->
          <div class="text-subtitle2 text-primary q-mt-md">
            <q-icon name="mdi-clock-outline" class="q-mr-xs" />{{ t('eventForm.dateAndTime') }}
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-4">
              <q-input v-model="eventForm.formData.value.date" :label="`${t('date')} *`"
                outlined dense type="date" :rules="[eventForm.requiredRule]" lazy-rules aria-required="true" />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-model="eventForm.formData.value.time" :label="`${t('startTime')} *`"
                outlined dense type="time" :rules="[eventForm.requiredRule]" lazy-rules aria-required="true" />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-model="eventForm.formData.value.endTime" :label="`${t('endTime')} *`"
                outlined dense type="time" :rules="[eventForm.requiredRule]" lazy-rules aria-required="true" />
            </div>
          </div>

          <!-- Location -->
          <q-input v-model="eventForm.formData.value.location" :label="`${t('location')} *`"
            outlined dense :rules="[eventForm.requiredRule]" lazy-rules aria-required="true">
            <template #prepend><q-icon name="mdi-map-marker" /></template>
          </q-input>

          <!-- Player Capacity -->
          <div class="text-subtitle2 text-primary q-mt-md">
            <q-icon name="mdi-account-group" class="q-mr-xs" />{{ t('eventForm.playerCapacity') }}
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input v-model.number="eventForm.formData.value.minPlayers" :label="`${t('minPlayers')} *`"
                outlined dense type="number" min="1" :rules="[eventForm.requiredRule, eventForm.minPlayersRule]"
                lazy-rules aria-required="true" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model.number="eventForm.formData.value.maxPlayers" :label="`${t('maxPlayers')} *`"
                outlined dense type="number" min="1" :rules="[eventForm.requiredRule, eventForm.maxPlayersRule]"
                lazy-rules aria-required="true" />
            </div>
          </div>

          <!-- Description -->
          <q-input v-model="eventForm.formData.value.description" :label="t('description')"
            outlined type="textarea" rows="3" :hint="t('eventForm.descriptionHint')" />

          <!-- Notes (for organizers) -->
          <q-expansion-item icon="mdi-note-text-outline" :label="t('eventForm.organizerNotes')" caption="Optional">
            <q-card-section class="q-pt-none">
              <q-input v-model="eventForm.formData.value.notes" outlined type="textarea"
                rows="2" :hint="t('eventForm.notesHint')" />
            </q-card-section>
          </q-expansion-item>

          <!-- Google Calendar Sync (new events only) -->
          <div v-if="!eventForm.isEditMode.value" class="q-mt-md">
            <q-toggle v-model="eventForm.formData.value.syncToGoogleCalendar"
              :label="t('eventForm.syncToCalendar')" color="primary" />
            <div class="text-caption text-grey-6 q-ml-xl">{{ t('eventForm.syncDescription') }}</div>
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat color="grey-7" :label="t('cancel')" @click="dialogVisible = false" :disable="eventForm.loading.value" />
        <q-btn color="primary" :label="submitLabel" @click="handleSubmit" :loading="eventForm.loading.value"
          :disable="!eventForm.isFormValid.value" :icon="eventForm.isEditMode.value ? 'mdi-content-save' : 'mdi-calendar-plus'" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.event-form-dialog {
  width: 100%;
  max-width: 700px;
}
</style>
