<script setup lang="ts">
import type { Player } from 'src/models/Player';
import type { Event } from 'src/models/Event';
import PlayerAvatar from 'src/components/PlayerAvatar.vue';

defineOptions({
  name: 'PlayerDetails',
});

defineProps({
  player: {
    type: Object as () => Player,
    required: true
  },
  playerEvents: {
    type: Array as () => Event[],
    required: true
  }
});
</script>

<template>
  <q-card style="min-width: 350px; max-width: 600px;">
    <q-card-section>
      <div class="text-h6">{{ player.name }}</div>
    </q-card-section>

    <q-card-section class="row items-center q-pb-none">
      <PlayerAvatar :player="player" size="72px" class="q-mr-md" />

      <div>
        <div class="text-subtitle1">{{ player.email }}</div>
        <div class="text-caption">Joined: {{ player.joinDate }}</div>
      </div>
    </q-card-section>

    <q-card-section v-if="player.bio" class="q-pb-none">
      <div class="text-subtitle2">Bio</div>
      <p>{{ player.bio }}</p>
    </q-card-section>

    <q-card-section>
      <div class="text-subtitle2">{{ $t('event', 2) }}</div>
      <q-list dense>
        <q-item v-for="event in playerEvents" :key="event.id" clickable :to="`/events/${event.id}`">
          <q-item-section>
            <q-item-label>{{ event.title }}</q-item-label>
            <q-item-label caption>{{ event.getFormattedDate() }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge :color="event.status === 'upcoming' ? 'green' : 'grey'">
              {{ event.status }}
            </q-badge>
          </q-item-section>
        </q-item>
        <q-item v-if="playerEvents.length === 0">
          <q-item-section>
            <q-item-label class="text-italic">No events</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-actions align="right">
      <slot name="actions"></slot>
    </q-card-actions>
  </q-card>
</template>
