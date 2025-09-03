<template>
    <q-page class="q-pa-md">
        <div class="row justify-center">
            <div class="col-12 col-md-8 col-lg-6">
                <q-card>
                    <q-card-section>
                        <div class="text-h6">{{ $t('calendar.subscription.title') }}</div>
                        <div class="text-subtitle2 text-grey-7">
                            {{ $t('calendar.subscription.subtitle') }}
                        </div>
                    </q-card-section>

                    <q-card-section>
                        <CalendarSubscriptionManager />
                    </q-card-section>
                </q-card>
            </div>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import CalendarSubscriptionManager from 'src/components/calendar/CalendarSubscriptionManager.vue';

defineOptions({
    name: 'CalendarSubscriptionPage',
});
</script>
