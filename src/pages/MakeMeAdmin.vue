<template>
    <q-page padding class="make-me-admin">
        <div class="row justify-center">
            <div class="col-12 col-md-6">
                <q-card>
                    <q-card-section>
                        <div class="text-h5 text-center">
                            <q-icon name="mdi-shield-crown" size="lg" color="primary" class="q-mr-sm" />
                            Make Me Admin
                        </div>
                        <div class="text-body2 text-grey-6 text-center q-mt-sm">
                            Add admin permissions to your existing account
                        </div>
                    </q-card-section>

                    <q-card-section class="text-center">
                        <div v-if="user" class="q-mb-md">
                            <div class="text-body1">Current User:</div>
                            <div class="text-h6">{{ user.displayName || user.email }}</div>
                            <div class="text-caption">{{ user.uid }}</div>
                        </div>

                        <q-btn @click="makeAdmin" color="primary" :loading="loading" :disable="loading" size="lg"
                            label="Make Me Admin" icon="mdi-shield-plus" class="full-width" />

                        <div v-if="success" class="text-positive q-mt-md">
                            ✅ Admin permissions added! Refresh the page to see admin menu.
                        </div>

                        <div v-if="error" class="text-negative q-mt-md">
                            ❌ {{ error }}
                        </div>
                    </q-card-section>
                </q-card>
            </div>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCurrentUser } from 'src/composables/useFirebaseAuth';
import { userManagementService } from 'src/services/user-management-service';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';

const user = useCurrentUser();
const playersStore = usePlayersFirebaseStore();
const loading = ref(false);
const success = ref(false);
const error = ref('');

const makeAdmin = async () => {
    if (!user.value) {
        error.value = 'No user logged in';
        return;
    }

    loading.value = true;
    error.value = '';
    success.value = false;

    try {
        await userManagementService.setUserRole(user.value.uid, {
            name: 'admin, moderator, user',
            permissions: ['admin', 'moderator', 'user']
        });

        // Force refresh the roles in the store
        await playersStore.initializeAdminData();

        success.value = true;
    } catch (err) {
        console.error('Error making admin:', err);
        error.value = 'Failed to add admin permissions';
    } finally {
        loading.value = false;
    }
};
</script>
