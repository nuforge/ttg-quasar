<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 600px; max-width: 800px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">📅 Submit New Event</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="submitEvent" class="q-gutter-md">
          <!-- Event Basic Info -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-8">
              <q-input v-model="eventData.title" label="Event Title *" outlined
                :rules="[val => !!val || 'Title is required']" />
            </div>
            <div class="col-12 col-md-4">
              <q-select v-model="eventData.eventType" :options="eventTypeOptions" label="Event Type *" outlined
                emit-value map-options :rules="[val => !!val || 'Event type is required']" />
            </div>
          </div>

          <q-input v-model="eventData.description" label="Description *" outlined type="textarea" rows="3"
            :rules="[val => !!val || 'Description is required']" />

          <!-- Date and Time -->
          <div class="text-subtitle2 text-primary">📅 Date & Time</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="eventData.startDate" label="Start Date *" outlined type="date"
                :rules="[val => !!val || 'Start date is required']" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="eventData.startTime" label="Start Time *" outlined type="time"
                :rules="[val => !!val || 'Start time is required']" />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="eventData.endDate" label="End Date *" outlined type="date"
                :rules="[val => !!val || 'End date is required']" />
            </div>
            <div class="col-12 col-md-6">
              <q-input v-model="eventData.endTime" label="End Time *" outlined type="time"
                :rules="[val => !!val || 'End time is required']" />
            </div>
          </div>

          <!-- Location -->
          <div class="text-subtitle2 text-primary">📍 Location</div>
          <q-input v-model="eventData.location" label="Location *" outlined
            :rules="[val => !!val || 'Location is required']" />
          <q-input v-model="locationDetailsValue" label="Location Details (optional)" outlined
            placeholder="Additional directions, room number, etc." />

          <!-- Capacity -->
          <div class="text-subtitle2 text-primary">👥 Capacity</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-input :model-value="minPlayersValue"
                @update:model-value="val => minPlayersValue = val?.toString() || ''" label="Min Players" outlined
                type="number" min="1" />
            </div>
            <div class="col-12 col-md-4">
              <q-input :model-value="maxPlayersValue"
                @update:model-value="val => maxPlayersValue = val?.toString() || ''" label="Max Players" outlined
                type="number" min="1" />
            </div>
            <div class="col-12 col-md-4">
              <q-input :model-value="estimatedAttendanceValue"
                @update:model-value="val => estimatedAttendanceValue = val?.toString() || ''"
                label="Expected Attendance" outlined type="number" min="1" />
            </div>
          </div>

          <!-- Game Info (conditional) -->
          <div v-if="eventData.eventType === 'game_night' || eventData.eventType === 'tournament'"
            class="text-subtitle2 text-primary">🎮 Game Information</div>
          <div v-if="eventData.eventType === 'game_night' || eventData.eventType === 'tournament'" class="row col--md">
            <div class="col-12 col-md-6">
              <q-input v-model="eventData.gameName" label="Game Name" outlined placeholder="e.g., Catan, D&D, Poker" />
            </div>
            <div class="col-12 col-md-6">
              <q-input :model-value="gameIdValue" @update:model-value="val => gameIdValue = val?.toString() || ''"
                label="Game ID (optional)" outlined type="number" placeholder="Reference ID if applicable" />
            </div>
          </div>

          <!-- Contact Info -->
          <div class="text-subtitle2 text-primary">📧 Contact Information</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input :model-value="contactEmailValue"
                @update:model-value="val => contactEmailValue = val?.toString() || ''" label="Contact Email" outlined
                type="email" :placeholder="currentUser?.email || 'your-email@example.com'" />
            </div>
            <div class="col-12 col-md-6">
              <q-input :model-value="contactPhoneValue"
                @update:model-value="val => contactPhoneValue = val?.toString() || ''" label="Contact Phone" outlined
                placeholder="(555) 123-4567" />
            </div>
          </div>

          <!-- Tags -->
          <q-input v-model="tagsInput" label="Tags (optional)" outlined
            placeholder="casual, competitive, beginner-friendly (comma separated)" @blur="updateTags" />

          <!-- Recurring Events -->
          <div class="row items-center">
            <q-checkbox v-model="isRecurringValue" label="Recurring Event" />
            <q-input v-if="isRecurringValue" :model-value="recurringPatternValue"
              @update:model-value="val => recurringPatternValue = val?.toString() || ''" label="Pattern" outlined
              placeholder="e.g., weekly, monthly, bi-weekly" class="q-ml-md" style="flex: 1" />
          </div>

          <!-- Additional Notes -->
          <q-expansion-item icon="notes" label="Additional Notes">
            <q-card-section class="q-pt-none">
              <div class="text-caption q-mb-sm">
                This information will be visible to admins reviewing your submission:
              </div>
              <q-input v-model="additionalNotes" outlined type="textarea" rows="2"
                placeholder="Any special requirements, equipment needed, or other notes for the admin..." />
            </q-card-section>
          </q-expansion-item>
        </q-form>
      </q-card-section>

      <!-- Submission Info -->
      <q-card-section class="q-pt-none">
        <q-banner class="text-blue-8 bg-blue-1" rounded>
          <template v-slot:avatar>
            <q-icon name="info" color="blue" />
          </template>
          <div class="text-caption">
            <strong>Submission Process:</strong><br>
            1. Your event will be submitted for review<br>
            2. An admin will review and approve/reject it<br>
            3. Approved events are automatically added to the public calendar<br>
            4. You'll be notified of the status via email
          </div>
        </q-banner>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancel" v-close-popup :disable="isSubmitting" />
        <q-btn color="primary" label="Submit Event" @click="submitEvent" :loading="isSubmitting"
          :disable="!canSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { vueFireAuthService } from '../../services/vuefire-auth-service';
import { eventSubmissionService } from '../../services/event-submission-service';
import type { CreateEventSubmissionData, EventType } from '../../models/EventSubmission';

const $q = useQuasar();
const currentUser = vueFireAuthService.currentUser;

// Props
interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'submitted': [submissionId: string];
}>();

// Reactive data
const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const isSubmitting = ref(false);
const additionalNotes = ref('');
const tagsInput = ref('');

// Optional field handlers
const minPlayersValue = ref<string>('');
const maxPlayersValue = ref<string>('');
const estimatedAttendanceValue = ref<string>('');
const gameIdValue = ref<string>('');
const contactEmailValue = ref<string>('');
const contactPhoneValue = ref<string>('');
const isRecurringValue = ref(false);
const recurringPatternValue = ref<string>('');
const locationDetailsValue = ref<string>('');

const eventData = ref<CreateEventSubmissionData>({
  title: '',
  description: '',
  eventType: 'game_night' as EventType,
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  location: '',
  gameName: '',
  tags: []
});

// Options
const eventTypeOptions = [
  { label: '🎮 Game Night', value: 'game_night' },
  { label: '🏆 Tournament', value: 'tournament' },
  { label: '🎉 Social Event', value: 'social' },
  { label: '📚 Workshop', value: 'workshop' },
  { label: '🔹 Other', value: 'other' }
];

// Computed
const canSubmit = computed(() => {
  return eventData.value.title &&
    eventData.value.description &&
    eventData.value.eventType &&
    eventData.value.startDate &&
    eventData.value.startTime &&
    eventData.value.endDate &&
    eventData.value.endTime &&
    eventData.value.location &&
    !isSubmitting.value;
});

// Methods
const updateTags = () => {
  eventData.value.tags = tagsInput.value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
};

const resetForm = () => {
  eventData.value = {
    title: '',
    description: '',
    eventType: 'game_night',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    gameName: '',
    tags: []
  };
  additionalNotes.value = '';
  tagsInput.value = '';

  // Reset optional fields
  minPlayersValue.value = '';
  maxPlayersValue.value = '';
  estimatedAttendanceValue.value = '';
  gameIdValue.value = '';
  contactEmailValue.value = '';
  contactPhoneValue.value = '';
  isRecurringValue.value = false;
  recurringPatternValue.value = '';
  locationDetailsValue.value = '';
};

const submitEvent = async () => {
  if (!canSubmit.value) return;

  isSubmitting.value = true;
  try {
    updateTags(); // Make sure tags are updated

    const submissionData: CreateEventSubmissionData = {
      ...eventData.value,
      description: eventData.value.description + (additionalNotes.value ? `\n\nAdmin Notes: ${additionalNotes.value}` : ''),
      contactEmail: contactEmailValue.value || currentUser.value?.email || '',
      // Add optional fields if they have values
      ...(locationDetailsValue.value && { locationDetails: locationDetailsValue.value }),
      ...(minPlayersValue.value && { minPlayers: parseInt(minPlayersValue.value) }),
      ...(maxPlayersValue.value && { maxPlayers: parseInt(maxPlayersValue.value) }),
      ...(estimatedAttendanceValue.value && { estimatedAttendance: parseInt(estimatedAttendanceValue.value) }),
      ...(gameIdValue.value && { gameId: gameIdValue.value }),
      ...(contactPhoneValue.value && { contactPhone: contactPhoneValue.value }),
      ...(isRecurringValue.value && { isRecurring: true }),
      ...(isRecurringValue.value && recurringPatternValue.value && { recurringPattern: recurringPatternValue.value })
    };

    const submissionId = await eventSubmissionService.createSubmission(submissionData);

    $q.notify({
      type: 'positive',
      message: 'Event submitted successfully!',
      caption: 'Your event is now pending admin approval.',
      position: 'top',
      timeout: 5000
    });

    emit('submitted', submissionId);
    showDialog.value = false;
    resetForm();
  } catch (error) {
    console.error('Error submitting event:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to submit event',
      caption: error instanceof Error ? error.message : 'Unknown error occurred',
      position: 'top'
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>
