<template>
  <q-dialog v-model="dialogVisible" persistent max-width="800px">
    <q-card class="game-submission-dialog">
      <q-card-section class="q-pb-none">
        <div class="text-h6">
          <q-icon name="mdi-plus-circle" class="q-mr-sm" />
          Submit a New Game
        </div>
        <div class="text-body2 text-grey-6 q-mt-sm">
          Suggest a game to be added to our collection. Submissions require admin approval.
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="submitGame" class="q-gutter-md">
          <!-- Basic Game Information -->
          <div class="row q-col-gutter-md">
            <div class="col">
              <q-input v-model="gameData.title" :label="$t('gameTitle') + ' *'" outlined dense
                :rules="[val => !!val || $t('gameTitleRequired')]" lazy-rules />
            </div>
            <div class="col">
              <q-input v-model="gameData.publisher" :label="$t('publisher')" outlined dense
                :hint="$t('hint.publisher')" />
            </div>
          </div>

          <!-- Genre and Difficulty -->
          <div class="row q-col-gutter-md">
            <div class="col">
              <q-select v-model="gameData.genre" :options="genreOptions" :label="t('genre') + ' *'" outlined dense
                use-input fill-input hide-selected input-debounce="0" new-value-mode="add-unique"
                :rules="[val => !!val || 'Genre is required']" lazy-rules />
            </div>
            <div class="col">
              <q-select v-model="gameData.difficulty" :options="difficultyOptions" :label="t('difficulty')" outlined
                dense hint="Optional - Game difficulty level" />
            </div>
          </div>

          <!-- Players and Age -->
          <div class="row q-col-gutter-md">
            <div class="col">
              <q-input v-model="gameData.numberOfPlayers" :label="t('numberOfPlayers') + ' *'" outlined dense
                hint="e.g., '2-4', '3+', '1-6'" :rules="[val => !!val || 'Number of players is required']" lazy-rules />
            </div>
            <div class="col">
              <q-input v-model="gameData.recommendedAge" :label="t('recommendedAge') + ' *'" outlined dense
                hint="e.g., '8+', '12+', '16+'" :rules="[val => !!val || 'Recommended age is required']" lazy-rules />
            </div>
          </div>

          <!-- Play Time and Release Year -->
          <div class="row q-col-gutter-md">
            <div class="col">
              <q-input v-model="gameData.playTime" :label="t('playTime') + ' *'" outlined dense
                hint="e.g., '30-60 minutes', '1-2 hours'" :rules="[val => !!val || 'Play time is required']"
                lazy-rules />
            </div>
            <div class="col">
              <q-input v-model.number="gameData.releaseYear" :label="t('releaseYear')" outlined dense type="number"
                hint="Optional - Year the game was released"
                :rules="[val => !val || (val >= 1800 && val <= new Date().getFullYear()) || 'Please enter a valid year']"
                lazy-rules />
            </div>
          </div>

          <!-- Components -->
          <q-select v-model="gameData.components" :options="componentOptions" :label="t('gameComponents') + ' *'"
            outlined dense multiple use-chips use-input fill-input hide-selected input-debounce="0"
            new-value-mode="add-unique" hint="Select or add game components"
            :rules="[val => val.length > 0 || 'At least one component is required']" lazy-rules />

          <!-- Description -->
          <q-input v-model="gameData.description" :label="t('description') + ' *'" outlined type="textarea" rows="4"
            hint="Describe the game, its mechanics, and what makes it fun"
            :rules="[val => !!val || 'Description is required']" lazy-rules />

          <!-- Tags -->
          <q-select v-model="gameData.tags" :options="tagOptions" :label="t('tags')" outlined dense multiple use-chips
            use-input fill-input hide-selected input-debounce="0" new-value-mode="add-unique"
            hint="Add tags to help with searching (optional)" />

          <!-- Links -->
          <div class="row q-col-gutter-md">
            <div class="col">
              <q-input v-model="gameData.link" :label="t('boardGameGeekLink')" outlined dense
                hint="Optional - Link to BoardGameGeek page" type="url" />
            </div>
            <div class="col">
              <q-input v-model="gameData.image" :label="t('imageUrl')" outlined dense :hint="t('hint.imageUrl')"
                type="url" />
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat color="grey-7" :label="t('cancel')" @click="closeDialog" :disable="loading" />
        <q-btn color="primary" :label="t('submitGame')" @click="submitGame" :loading="loading"
          :disable="!isFormValid" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import type { GameSubmissionData } from 'src/models/GameSubmission';

const $q = useQuasar();
const { t } = useI18n();
const gamesStore = useGamesFirebaseStore();

// Props
interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submitted'): void;
}>();

// Computed dialog visibility
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Form data
const gameData = ref<Partial<GameSubmissionData>>({
  title: '',
  genre: '',
  numberOfPlayers: '',
  recommendedAge: '',
  playTime: '',
  components: [],
  description: '',
  image: '',
  link: '',
  tags: [],
  difficulty: '',
  publisher: '',
});

// Form state
const loading = ref(false);

// Import shared options
import { GAME_GENRES, GAME_DIFFICULTIES, GAME_COMPONENTS, GAME_TAGS } from './gameFormOptions';

// Use shared options
const genreOptions = [...GAME_GENRES];
const difficultyOptions = [...GAME_DIFFICULTIES];
const componentOptions = [...GAME_COMPONENTS];
const tagOptions = [...GAME_TAGS];

// Form validation
const isFormValid = computed(() => {
  return !!(
    gameData.value.title &&
    gameData.value.genre &&
    gameData.value.numberOfPlayers &&
    gameData.value.recommendedAge &&
    gameData.value.playTime &&
    gameData.value.components?.length &&
    gameData.value.description
  );
});

// Methods
const submitGame = async () => {
  if (!isFormValid.value) {
    $q.notify({
      type: 'negative',
      message: t('pleaseFillAllRequiredFields'),
    });
    return;
  }

  loading.value = true;

  try {
    // Convert to proper GameSubmissionData format
    const submissionData: GameSubmissionData = {
      title: gameData.value.title!,
      genre: gameData.value.genre!,
      numberOfPlayers: gameData.value.numberOfPlayers!,
      recommendedAge: gameData.value.recommendedAge!,
      playTime: gameData.value.playTime!,
      components: gameData.value.components!,
      description: gameData.value.description!,
      ...(gameData.value.releaseYear && { releaseYear: gameData.value.releaseYear }),
      ...(gameData.value.image && { image: gameData.value.image }),
      ...(gameData.value.link && { link: gameData.value.link }),
      ...(gameData.value.tags?.length && { tags: gameData.value.tags }),
      ...(gameData.value.difficulty && { difficulty: gameData.value.difficulty }),
      ...(gameData.value.publisher && { publisher: gameData.value.publisher }),
    };

    await gamesStore.submitGame(submissionData);

    $q.notify({
      type: 'positive',
      message: 'Game submitted successfully! It will be reviewed by an admin.',
      timeout: 5000,
    });

    emit('submitted');
    closeDialog();
    resetForm();
  } catch (error) {
    console.error('Failed to submit game:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to submit game. Please try again.',
    });
  } finally {
    loading.value = false;
  }
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const resetForm = () => {
  gameData.value = {
    title: '',
    genre: '',
    numberOfPlayers: '',
    recommendedAge: '',
    playTime: '',
    components: [],
    description: '',
    image: '',
    link: '',
    tags: [],
    difficulty: '',
    publisher: '',
  };
};
</script>

<style scoped>
.game-submission-dialog {
  width: 100%;
  max-width: 800px;
}

.q-dialog__inner {
  padding: 16px;
}
</style>
