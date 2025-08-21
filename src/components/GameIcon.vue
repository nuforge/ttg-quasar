<script setup lang="ts">
import { computed } from 'vue';
import { getGameIcon } from 'src/utils/game-icons';

const props = defineProps({
  category: {
    type: String as () => 'players' | 'genres' | 'mechanics' | 'age' | 'components',
    required: true,
    validator: (value: string) => ['players', 'genres', 'mechanics', 'age', 'components'].includes(value)
  },
  value: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'md'
  }
});

const iconInfo = computed(() => {
  return getGameIcon(props.category, props.value);
});
</script>

<template>
  <q-icon v-if="iconInfo.type === 'mdi'" :name="iconInfo.icon" :size="size" class="game-icon" v-bind="$attrs" />
  <img v-else :src="`/game-icons/${iconInfo.icon}.svg`" :class="['game-icon', `size-${size}`]" :alt="value"
    v-bind="$attrs" />
</template>

<style scoped>
.game-icon {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.size-xs {
  width: 12px;
  height: 12px;
}

.size-sm {
  width: 16px;
  height: 16px;
}

.size-md {
  width: 24px;
  height: 24px;
}

.size-lg {
  width: 32px;
  height: 32px;
}
</style>
