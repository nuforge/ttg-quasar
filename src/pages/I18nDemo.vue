<template>
    <q-page padding>
        <div class="q-pa-md">
            <h1 class="text-h3 text-center q-mb-xl">{{ $t('language') }} Demo</h1>

            <!-- Language Selector -->
            <div class="text-center q-mb-xl">
                <q-btn-toggle v-model="currentLocale" @update:model-value="changeLanguage" toggle-color="primary"
                    :options="[
                        { label: 'English', value: 'en-US', icon: 'language' },
                        { label: 'Español', value: 'en-ES', icon: 'language' }
                    ]" color="white" text-color="primary" no-caps />
            </div>

            <div class="row q-col-gutter-xl">
                <div class="col-12 col-md-6">
                    <q-card class="q-pa-md">
                        <q-card-section>
                            <div class="text-h5 q-mb-md">{{ $t('navigation') }}</div>
                            <q-list>
                                <q-item>
                                    <q-item-section avatar><q-icon name="home" /></q-item-section>
                                    <q-item-section>{{ $t('home') }}</q-item-section>
                                </q-item>
                                <q-item>
                                    <q-item-section avatar><q-icon name="mdi-calendar-month" /></q-item-section>
                                    <q-item-section>{{ $t('event', 2) }}</q-item-section>
                                </q-item>
                                <q-item>
                                    <q-item-section avatar><q-icon name="mdi-dice-multiple" /></q-item-section>
                                    <q-item-section>{{ $t('game', 2) }}</q-item-section>
                                </q-item>
                                <q-item>
                                    <q-item-section avatar><q-icon name="mdi-account-group" /></q-item-section>
                                    <q-item-section>{{ $t('player', 2) }}</q-item-section>
                                </q-item>
                            </q-list>
                        </q-card-section>
                    </q-card>
                </div>

                <div class="col-12 col-md-6">
                    <q-card class="q-pa-md">
                        <q-card-section>
                            <div class="text-h5 q-mb-md">{{ $t('actions') }}</div>
                            <div class="q-gutter-sm">
                                <q-btn color="primary" :label="$t('create')" />
                                <q-btn color="secondary" :label="$t('edit')" />
                                <q-btn color="positive" :label="$t('save')" />
                                <q-btn color="negative" :label="$t('delete')" />
                                <q-btn outline color="primary" :label="$t('cancel')" />
                                <q-btn outline color="secondary" :label="$t('refresh')" />
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>

            <div class="row q-col-gutter-xl q-mt-lg">
                <div class="col-12 col-md-6">
                    <q-card class="q-pa-md">
                        <q-card-section>
                            <div class="text-h5 q-mb-md">{{ $t('rsvp') }} & {{ $t('events') }}</div>
                            <div class="q-gutter-sm">
                                <q-chip color="positive" icon="mdi-check" :label="$t('confirmed')" />
                                <q-chip color="orange" icon="mdi-heart" :label="$t('interested')" />
                                <q-chip color="grey" icon="mdi-clock" :label="$t('pending')" />
                                <q-chip color="red" icon="mdi-close" :label="$t('cancelled')" />
                            </div>
                            <div class="q-mt-md">
                                <div>{{ $t('upcomingEvents') }}: {{ $t('eventsCount', { count: 5 }, 5) }}</div>
                                <div>{{ $t('featuredGames') }}: {{ $t('gamesCount', { count: 12 }, 12) }}</div>
                                <div>{{ $t('players') }}: {{ $t('playersCount', { count: 3 }, 3) }}</div>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>

                <div class="col-12 col-md-6">
                    <q-card class="q-pa-md">
                        <q-card-section>
                            <div class="text-h5 q-mb-md">{{ $t('notifications') }}</div>
                            <div class="q-gutter-sm">
                                <q-btn flat color="primary" :label="$t('markAllRead')" />
                                <q-btn flat color="secondary" :label="$t('viewAll')" />
                                <q-btn flat color="grey" :label="$t('configure')" />
                            </div>
                            <div class="q-mt-md text-grey-6">
                                <div v-if="demoNotifications === 0">{{ $t('noNotifications') }}</div>
                                <div v-else>{{ $t('messagesCount', { count: demoNotifications }, demoNotifications) }}
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>

            <div class="row q-mt-lg">
                <div class="col-12">
                    <q-card class="q-pa-md">
                        <q-card-section>
                            <div class="text-h5 q-mb-md">{{ $t('formFields') }}</div>
                            <div class="row q-col-gutter-md">
                                <div class="col-12 col-md-4">
                                    <q-input v-model="demoTitle" outlined :label="$t('gameTitle')" />
                                </div>
                                <div class="col-12 col-md-4">
                                    <q-input v-model="demoPublisher" outlined :label="$t('publisher')"
                                        :hint="$t('hint.publisher')" />
                                </div>
                                <div class="col-12 col-md-4">
                                    <q-input v-model="demoAge" outlined :label="$t('recommendedAge')" />
                                </div>
                            </div>
                            <div class="row q-col-gutter-md q-mt-md">
                                <div class="col-12 col-md-6">
                                    <q-select v-model="demoGameFilter" outlined :label="$t('filterByGame')"
                                        :options="[]" />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-select v-model="demoSort" outlined :label="$t('sortBy')" :options="[]" />
                                </div>
                            </div>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLanguage } from 'src/composables/useLanguage';

const { locale } = useI18n();
const { setLanguage } = useLanguage();
const currentLocale = ref(locale.value);
const demoNotifications = ref(3);
const demoTitle = ref('');
const demoPublisher = ref('');
const demoAge = ref('');
const demoGameFilter = ref(null);
const demoSort = ref(null);

const changeLanguage = async (newLocale: string) => {
    try {
        await setLanguage(newLocale as 'en-US' | 'en-ES');
        currentLocale.value = newLocale;
    } catch (error) {
        console.error('Failed to change language:', error);
    }
};
</script>
