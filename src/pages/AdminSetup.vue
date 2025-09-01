<template>
  <q-page padding class="admin-setup">
    <div class="row justify-center">
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h5 text-center">
              <q-icon name="mdi-shield-crown" size="lg" color="primary" class="q-mr-sm" />
              Admin Setup
            </div>
            <div class="text-body2 text-grey-6 text-center q-mt-sm">
              Initialize the first administrator account
            </div>
          </q-card-section>

          <q-card-section>
            <q-form @submit="setupAdmin" ref="formRef">
              <q-input v-model="adminData.email" label="Admin Email" type="email" outlined :rules="[
                val => !!val || 'Email is required',
                val => /.+@.+\..+/.test(val) || 'Email must be valid'
              ]" class="q-mb-md" />

              <q-input v-model="adminData.name" label="Full Name" outlined :rules="[val => !!val || 'Name is required']"
                class="q-mb-md" />

              <q-input v-model="adminData.password" label="Password" type="password" outlined :rules="[
                val => !!val || 'Password is required',
                val => val.length >= 6 || 'Password must be at least 6 characters'
              ]" class="q-mb-md" />

              <q-input v-model="adminData.confirmPassword" label="Confirm Password" type="password" outlined :rules="[
                val => !!val || 'Please confirm password',
                val => val === adminData.password || 'Passwords do not match'
              ]" class="q-mb-md" />

              <q-input v-model="adminData.bio" label="Bio (Optional)" type="textarea" outlined rows="3"
                class="q-mb-md" />

              <div class="text-center">
                <q-btn type="submit" color="primary" :loading="creating" :disable="creating" size="lg"
                  label="Create Admin Account" icon="mdi-account-plus" class="full-width" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>

        <!-- Status Card -->
        <q-card v-if="showStatus" class="q-mt-md">
          <q-card-section>
            <div class="text-h6">Setup Status</div>
            <q-list>
              <q-item v-for="step in setupSteps" :key="step.name">
                <q-item-section avatar>
                  <q-avatar
                    :color="step.status === 'completed' ? 'positive' : step.status === 'error' ? 'negative' : 'grey'"
                    text-color="white">
                    <q-icon
                      :name="step.status === 'completed' ? 'check' : step.status === 'error' ? 'error' : 'hourglass_empty'" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ step.label }}</q-item-label>
                  <q-item-label v-if="step.error" caption class="text-negative">{{ step.error }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { QForm } from 'quasar';
import { userManagementService } from 'src/services/user-management-service';

const $q = useQuasar();
const router = useRouter();
const formRef = ref<QForm>();

const creating = ref(false);
const showStatus = ref(false);

const adminData = reactive({
  email: '',
  name: '',
  password: '',
  confirmPassword: '',
  bio: 'System Administrator'
});

const setupSteps = ref([
  { name: 'create_user', label: 'Creating Firebase user account', status: 'pending', error: '' },
  { name: 'set_profile', label: 'Setting up user profile', status: 'pending', error: '' },
  { name: 'assign_role', label: 'Assigning admin role', status: 'pending', error: '' },
  { name: 'set_status', label: 'Activating account', status: 'pending', error: '' }
]);

const updateStepStatus = (stepName: string, status: 'pending' | 'completed' | 'error', error = '') => {
  const step = setupSteps.value.find(s => s.name === stepName);
  if (step) {
    step.status = status;
    step.error = error;
  }
};

const setupAdmin = async () => {
  if (!formRef.value) return;

  const isValid = await formRef.value.validate();
  if (!isValid) return;

  creating.value = true;
  showStatus.value = true;

  try {
    // Reset all steps
    setupSteps.value.forEach(step => {
      step.status = 'pending';
      step.error = '';
    });

    updateStepStatus('create_user', 'pending');

    // Create the admin user
    const adminUser = await userManagementService.createUser({
      email: adminData.email,
      password: adminData.password,
      name: adminData.name,
      bio: adminData.bio,
      role: ['admin', 'moderator', 'user']
    });

    updateStepStatus('create_user', 'completed');
    updateStepStatus('set_profile', 'completed');
    updateStepStatus('assign_role', 'completed');
    updateStepStatus('set_status', 'completed');

    $q.notify({
      type: 'positive',
      message: 'Admin account created successfully!',
      caption: `Welcome, ${adminUser.name}`,
      timeout: 5000,
      actions: [
        { label: 'Dismiss', color: 'dark' }
      ]
    });

    // Wait a moment to show completion
    setTimeout(() => {
      void router.push('/admin');
    }, 2000);

  } catch (error) {
    console.error('Error setting up admin:', error);

    // Update the appropriate step status
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    if (errorMessage.includes('auth')) {
      updateStepStatus('create_user', 'error', errorMessage);
    } else if (errorMessage.includes('profile')) {
      updateStepStatus('set_profile', 'error', errorMessage);
    } else if (errorMessage.includes('role')) {
      updateStepStatus('assign_role', 'error', errorMessage);
    } else {
      updateStepStatus('set_status', 'error', errorMessage);
    }

    $q.notify({
      type: 'negative',
      message: 'Failed to create admin account',
      caption: errorMessage,
      timeout: 10000,
      actions: [
        { label: 'Dismiss', color: 'dark' }
      ]
    });
  } finally {
    creating.value = false;
  }
};
</script>

<style scoped lang="scss">
.admin-setup {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 2rem 1rem;

  .q-card {
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }
}
</style>
