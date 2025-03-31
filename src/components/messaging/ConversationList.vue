<script setup lang="ts">
import { computed } from 'vue';
import { usePlayersStore } from 'src/stores/players-store';
import ConversationItem from './ConversationItem.vue';
import type {
  DirectConversation,
  GroupConversation,
  FormattedConversationItem
} from 'src/models/Conversation';

type StoreConversation = DirectConversation | GroupConversation;

const playersStore = usePlayersStore();

const props = defineProps({
  items: {
    type: Array as () => StoreConversation[],
    required: true
  },
  selectedId: {
    type: [Number, String],
    default: null
  },
  type: {
    type: String as () => 'direct' | 'group',
    default: 'direct',
    validator: (value: string) => ['direct', 'group'].includes(value)
  }
});

const emit = defineEmits<{
  (e: 'select', id: number | string): void
}>();

// Get player name for direct conversations
const getPlayerName = (id: number): string => {
  const player = playersStore.getPlayerById(id);
  return player?.name || `User ${id}`;
};

// Handle item selection
const handleSelect = (id: number | string): void => {
  emit('select', id);
};

// Format items for display
const formattedItems = computed<FormattedConversationItem[]>(() => {
  if (!props.items || props.items.length === 0) return [];

  return props.items.map(item => {
    if (props.type === 'direct') {
      const directItem = item as DirectConversation;
      return {
        id: directItem.partnerId,
        name: getPlayerName(directItem.partnerId),
        avatar: null,
        lastMessage: directItem.latestMessage?.content ?? '',
        unreadCount: directItem.unreadCount,
        isActive: props.selectedId === directItem.partnerId
      };
    } else {
      const groupItem = item as GroupConversation;
      return {
        id: groupItem.groupName,
        name: groupItem.groupName,
        avatar: null,
        lastMessage: groupItem.latestMessage?.content ?? '',
        unreadCount: groupItem.unreadCount,
        isActive: props.selectedId === groupItem.groupName
      };
    }
  });
});
</script>

<template>
  <div class="conversation-list">
    <q-list bordered separator>
      <ConversationItem v-for="item in formattedItems" :key="item.id" :id="item.id" :name="item.name"
        :avatar="item.avatar" :last-message="item.lastMessage" :unread-count="item.unreadCount"
        :is-active="item.isActive" @select="handleSelect" />

      <q-item v-if="formattedItems.length === 0">
        <q-item-section>
          <q-item-label class="text-center text-grey">
            No {{ type === 'direct' ? 'conversations' : 'groups' }} yet
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<style scoped>
.conversation-list {
  height: 100%;
}
</style>
