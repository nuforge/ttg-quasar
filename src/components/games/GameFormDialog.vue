<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import type { Game, FirebaseGame } from 'src/models/Game';
import type { GameSubmissionData } from 'src/models/GameSubmission';
import { GAME_GENRES, GAME_DIFFICULTIES, GAME_COMPONENTS, GAME_TAGS } from './gameFormOptions';

const $q = useQuasar();
const { t } = useI18n();
const gamesStore = useGamesFirebaseStore();

// Props
interface Props {
  modelValue: boolean;
  game?: Game | null; // If provided, we're in edit mode
  isAdmin?: boolean; // Admin can auto-approve
}

const props = withDefaults(defineProps<Props>(), {
  game: null,
  isAdmin: false,
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submitted: [game?: Game];
  updated: [gameId: string];
}>();

// Computed
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isEditMode = computed(() => !!props.game);
const dialogTitle = computed(() => (isEditMode.value ? t('editGame') : t('submitNewGame')));
const submitLabel = computed(() => (isEditMode.value ? t('saveChanges') : t('submitGame')));

// Form data
const getDefaultFormData = (): GameSubmissionData => ({
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

const gameData = ref<GameSubmissionData>(getDefaultFormData());
const loading = ref(false);

// Watch for game prop changes to populate edit form
watch(
  () => props.game,
  (game) => {
    if (game) {
      gameData.value = {
        title: game.title,
        genre: game.genre,
        numberOfPlayers: game.numberOfPlayers,
        recommendedAge: game.recommendedAge,
        playTime: game.playTime,
        components: [...game.components],
        description: game.description,
        releaseYear: game.releaseYear,
        image: game.image || '',
        link: game.link || '',
        tags: game.tags ? [...game.tags] : [],
        difficulty: game.difficulty || '',
        publisher: game.publisher || '',
      };
    } else {
      gameData.value = getDefaultFormData();
    }
  },
  { immediate: true },
);

// Reset form when dialog closes
watch(dialogVisible, (visible) => {
  if (!visible && !isEditMode.value) {
    resetForm();
  }
});

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
    const submissionData: GameSubmissionData = {
      title: gameData.value.title,
      genre: gameData.value.genre,
      numberOfPlayers: gameData.value.numberOfPlayers,
      recommendedAge: gameData.value.recommendedAge,
      playTime: gameData.value.playTime,
      components: gameData.value.components,
      description: gameData.value.description,
      ...(gameData.value.releaseYear && { releaseYear: gameData.value.releaseYear }),
      ...(gameData.value.image && { image: gameData.value.image }),
      ...(gameData.value.link && { link: gameData.value.link }),
      ...(gameData.value.tags?.length && { tags: gameData.value.tags }),
      ...(gameData.value.difficulty && { difficulty: gameData.value.difficulty }),
      ...(gameData.value.publisher && { publisher: gameData.value.publisher }),
    };

    if (isEditMode.value && props.game) {
      // Update existing game
      const updates: Partial<FirebaseGame> = {
        ...submissionData,
      };
      await gamesStore.updateGame(props.game.id, updates);
      $q.notify({
        type: 'positive',
        message: 'Game updated successfully!',
        icon: 'mdi-check-circle',
      });
      emit('updated', props.game.id);
    } else {
      // Submit new game
      await gamesStore.submitGame(submissionData);
      $q.notify({
        type: 'positive',
        message: 'Game submitted successfully! It will be reviewed by an admin.',
        timeout: 5000,
        icon: 'mdi-check-circle',
      });
      emit('submitted');
    }

    closeDialog();
    if (!isEditMode.value) {
      resetForm();
    }
  } catch (error) {
    console.error('Failed to save game:', error);
    $q.notify({
      type: 'negative',
      message: isEditMode.value ? 'Failed to update game.' : 'Failed to submit game.',
      icon: 'mdi-alert-circle',
    });
  } finally {
    loading.value = false;
  }
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const resetForm = () => {
  gameData.value = getDefaultFormData();
};
</script>

<template>
  <q-dialog v-model="dialogVisible" persistent max-width="800px">
    <q-card class="game-form-dialog">
      <q-card-section class="q-pb-none">
        <div class="row items-center justify-between">
          <div class="text-h6">
            <q-icon :name="isEditMode ? 'mdi-pencil' : 'mdi-plus-circle'" class="q-mr-sm" />
            {{ dialogTitle }}
          </div>
          <q-btn flat round dense icon="mdi-close" @click="closeDialog" :disable="loading" />
        </div>
        <div v-if="!isEditMode" class="text-body2 text-grey-6 q-mt-sm">
          Suggest a game to be added to our collection. Submissions require admin approval.
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="submitGame" class="q-gutter-md">
          <!-- Basic Game Information -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-8">
              <q-input
                v-model="gameData.title"
                :label="t('gameTitle') + ' *'"
                outlined
                dense
                :rules="[(val) => !!val || t('gameTitleRequired')]"
                lazy-rules
                aria-required="true"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                v-model="gameData.publisher"
                :label="t('publisher')"
                outlined
                dense
                hint="Game publisher"
              />
            </div>
          </div>

          <!-- Genre and Difficulty -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-select
                v-model="gameData.genre"
                :options="GAME_GENRES"
                :label="t('genre') + ' *'"
                outlined
                dense
                use-input
                fill-input
                hide-selected
                input-debounce="0"
                new-value-mode="add-unique"
                :rules="[(val) => !!val || 'Genre is required']"
                lazy-rules
                aria-required="true"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="gameData.difficulty"
                :options="GAME_DIFFICULTIES"
                :label="t('difficulty')"
                outlined
                dense
                clearable
                hint="Optional - Game difficulty level"
              />
            </div>
          </div>

          <!-- Players and Age -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="gameData.numberOfPlayers"
                :label="t('numberOfPlayers') + ' *'"
                outlined
                dense
                hint="e.g., '2-4', '3+', '1-6'"
                :rules="[(val) => !!val || 'Number of players is required']"
                lazy-rules
                aria-required="true"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="gameData.recommendedAge"
                :label="t('recommendedAge') + ' *'"
                outlined
                dense
                hint="e.g., '8+', '12+', '16+'"
                :rules="[(val) => !!val || 'Recommended age is required']"
                lazy-rules
                aria-required="true"
              />
            </div>
          </div>

          <!-- Play Time and Release Year -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="gameData.playTime"
                :label="t('playTime') + ' *'"
                outlined
                dense
                hint="e.g., '30-60 minutes', '1-2 hours'"
                :rules="[(val) => !!val || 'Play time is required']"
                lazy-rules
                aria-required="true"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="gameData.releaseYear"
                :label="t('releaseYear')"
                outlined
                dense
                type="number"
                hint="Year the game was released"
                :rules="[
                  (val) =>
                    !val ||
                    (val >= 1800 && val <= new Date().getFullYear()) ||
                    'Please enter a valid year',
                ]"
                lazy-rules
              />
            </div>
          </div>

          <!-- Components -->
          <q-select
            v-model="gameData.components"
            :options="GAME_COMPONENTS"
            :label="t('gameComponents') + ' *'"
            outlined
            dense
            multiple
            use-chips
            use-input
            fill-input
            hide-selected
            input-debounce="0"
            new-value-mode="add-unique"
            hint="Select or add game components"
            :rules="[(val) => val.length > 0 || 'At least one component is required']"
            lazy-rules
            aria-required="true"
          />

          <!-- Description -->
          <q-input
            v-model="gameData.description"
            :label="t('description') + ' *'"
            outlined
            type="textarea"
            rows="4"
            hint="Describe the game, its mechanics, and what makes it fun"
            :rules="[(val) => !!val || 'Description is required']"
            lazy-rules
            aria-required="true"
          />

          <!-- Tags -->
          <q-select
            v-model="gameData.tags"
            :options="GAME_TAGS"
            :label="t('tags')"
            outlined
            dense
            multiple
            use-chips
            use-input
            fill-input
            hide-selected
            input-debounce="0"
            new-value-mode="add-unique"
            hint="Add tags to help with searching (optional)"
          />

          <!-- Links -->
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="gameData.link"
                :label="t('boardGameGeekLink')"
                outlined
                dense
                hint="Link to BoardGameGeek page"
                type="url"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="gameData.image"
                :label="t('imageUrl')"
                outlined
                dense
                hint="URL to game image"
                type="url"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat color="grey-7" :label="t('cancel')" @click="closeDialog" :disable="loading" />
        <q-btn
          color="primary"
          :label="submitLabel"
          @click="submitGame"
          :loading="loading"
          :disable="!isFormValid"
          :icon="isEditMode ? 'mdi-content-save' : 'mdi-send'"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.game-form-dialog {
  width: 100%;
  max-width: 800px;
}
</style>

