<template>
    <q-page padding>
        <div class="page-header q-mb-md">
            <div class="text-h4">Data Migration</div>
            <div class="text-body1 text-grey-6">Migrate data from JSON files to Firebase and sync with Google Calendar
            </div>
        </div>

        <EventMigrationDashboard />
    </q-page>
</template>

<script setup lang="ts">
import EventMigrationDashboard from 'src/components/events/EventMigrationDashboard.vue';
</script>

<style scoped>
.page-header {
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
