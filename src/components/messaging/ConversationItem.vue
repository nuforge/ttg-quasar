<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const props = defineProps({
  id: {
    type: [Number, String],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: [String, null],
    default: null
  },
  lastMessage: {
    type: String,
    default: null
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select']);

const selectItem = () => {
  emit('select', props.id);
};
</script>

<template>
  <q-item :active="isActive" active-class="bg-primary text-white" clickable v-ripple @click="selectItem">
    <q-item-section avatar v-if="avatar">
      <q-avatar>
        <img :src="avatar" />
      </q-avatar>
    </q-item-section>
    <q-item-section avatar v-else>
      <q-avatar color="secondary" text-color="white">
        {{ name.charAt(0) }}
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ name }}</q-item-label>
      <q-item-label caption lines="1" :class="unreadCount > 0 ? 'text-weight-bold' : ''">
        {{ lastMessage || t('noMessagesYet') }}
      </q-item-label>
    </q-item-section>

    <q-item-section side v-if="unreadCount > 0">
      <q-badge color="negative" :label="unreadCount" />
    </q-item-section>
  </q-item>
</template>

<style scoped>
/* You can add custom styling here if needed */
</style>
