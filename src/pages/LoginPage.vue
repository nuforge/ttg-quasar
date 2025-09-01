<template>
  <q-page class="flex flex-center">
    <div class="q-pa-md" style="max-width: 400px; width: 100%">
      <div class="text-center q-mb-lg">
        <img src="~assets/ttg-logo.svg" alt="TTG Logo" style="height: 80px" />
        <h4 class="text-h4 q-mt-md q-mb-md">Welcome Back</h4>
        <p class="text-subtitle1 text-grey-7">Sign in to continue to Tabletop Gaming</p>
      </div>

      <!-- Redirect message -->
      <q-banner v-if="redirectMessage" class="text-white bg-info q-mb-md" rounded>
        <template v-slot:avatar>
          <q-icon name="info" color="white" />
        </template>
        {{ redirectMessage }}
      </q-banner>

      <!-- Error banner -->
      <q-banner v-if="error" class="text-white bg-negative q-mb-md" rounded>
        <template v-slot:avatar>
          <q-icon name="warning" color="white" />
        </template>
        {{ error }}
      </q-banner>

      <div class="q-pa-lg">
        <div>
          <!-- Social Sign In -->
          <div class="q-gutter-sm q-mb-lg">
            <q-btn @click="signInWithGoogle" :loading="loading" flat size="lg" class="full-width" icon="mdi-google"
              label="Sign in with Google" />
            <q-btn @click="signInWithFacebook" :loading="loading" flat size="lg" class="full-width" icon="mdi-facebook"
              label="Sign in with Facebook" />
          </div>

          <q-separator class="q-my-lg">
            <span class="text-grey-7 q-px-md">or</span>
          </q-separator>

          <!-- Email Sign In Form -->
          <q-form @submit="signInWithEmail" class="q-gutter-md">
            <q-input v-model="email" outlined type="email" label="Email" lazy-rules :rules="[
              (val) => (val && val.length > 0) || 'Please enter your email',
              (val) => /.+@.+\..+/.test(val) || 'Please enter a valid email',
            ]">
              <template v-slot:prepend>
                <q-icon name="mail" />
              </template>
            </q-input>

            <q-input v-model="password" outlined :type="showPassword ? 'text' : 'password'" label="Password" lazy-rules
              :rules="[(val) => (val && val.length > 0) || 'Please enter your password']">
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
              <template v-slot:append>
                <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                  @click="showPassword = !showPassword" />
              </template>
            </q-input>

            <div class="row justify-between items-center">
              <q-checkbox v-model="rememberMe" label="Remember me" />
              <q-btn flat color="primary" label="Forgot password?" />
            </div>

            <q-btn type="submit" :loading="loading" unelevated size="lg" color="primary" class="full-width"
              label="Sign In" />
          </q-form>

          <q-separator class="q-my-lg" />

          <!-- Sign Up Link -->
          <div class="text-center">
            <p class="text-grey-7">Don't have an account?</p>
            <q-btn @click="showSignUp = true" flat color="primary" label="Create Account" class="text-weight-bold" />
          </div>
        </div>
      </div>

      <!-- Sign Up Dialog -->
      <q-dialog v-model="showSignUp">
        <q-card flat style="min-width: 350px">
          <q-card-section>
            <div class="text-h6">Create Account</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-form @submit="signUpWithEmail" class="q-gutter-md">
              <q-input v-model="signUpData.displayName" outlined label="Display Name" lazy-rules
                :rules="[(val) => (val && val.length > 0) || 'Please enter your name']">
                <template v-slot:prepend>
                  <q-icon name="person" />
                </template>
              </q-input>

              <q-input v-model="signUpData.email" outlined type="email" label="Email" lazy-rules :rules="[
                (val) => (val && val.length > 0) || 'Please enter your email',
                (val) => /.+@.+\..+/.test(val) || 'Please enter a valid email',
              ]">
                <template v-slot:prepend>
                  <q-icon name="mail" />
                </template>
              </q-input>

              <q-input v-model="signUpData.password" outlined type="password" label="Password" lazy-rules :rules="[
                (val) => (val && val.length >= 6) || 'Password must be at least 6 characters',
              ]">
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>

              <q-input v-model="signUpData.confirmPassword" outlined type="password" label="Confirm Password" lazy-rules
                :rules="[
                  (val) => val === signUpData.password || 'Passwords do not match',
                ]">
                <template v-slot:prepend>
                  <q-icon name="lock" />
                </template>
              </q-input>
            </q-form>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" @click="showSignUp = false" />
            <q-btn unelevated label="Create Account" color="primary" :loading="loading" @click="signUpWithEmail" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCurrentUser } from 'vuefire';
import { vueFireAuthService } from 'src/services/vuefire-auth-service';
import { Notify } from 'quasar';

const route = useRoute();
const router = useRouter();
const user = useCurrentUser();

// Form data
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberMe = ref(false);
const loading = ref(false);
const error = ref('');

// Sign up dialog
const showSignUp = ref(false);
const signUpData = ref({
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
});

// Redirect message from route query
const redirectMessage = computed(() => {
  return route.query.message as string;
});

// Auth methods
const signInWithGoogle = async () => {
  loading.value = true;
  error.value = '';

  try {
    await vueFireAuthService.signInWithGoogle();
    Notify.create({
      type: 'positive',
      message: 'Successfully signed in with Google!',
      position: 'top',
    });
    redirectAfterLogin();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Sign in failed';
  } finally {
    loading.value = false;
  }
};

const signInWithFacebook = async () => {
  loading.value = true;
  error.value = '';

  try {
    await vueFireAuthService.signInWithFacebook();
    Notify.create({
      type: 'positive',
      message: 'Successfully signed in with Facebook!',
      position: 'top',
    });
    redirectAfterLogin();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Sign in failed';
  } finally {
    loading.value = false;
  }
};

const signInWithEmail = async () => {
  loading.value = true;
  error.value = '';

  try {
    await vueFireAuthService.signInWithEmail(email.value, password.value);
    Notify.create({
      type: 'positive',
      message: 'Successfully signed in!',
      position: 'top',
    });
    redirectAfterLogin();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Sign in failed';
  } finally {
    loading.value = false;
  }
};

const signUpWithEmail = async () => {
  loading.value = true;
  error.value = '';

  try {
    await vueFireAuthService.signUpWithEmail(
      signUpData.value.email,
      signUpData.value.password,
      signUpData.value.displayName
    );

    showSignUp.value = false;
    Notify.create({
      type: 'positive',
      message: 'Account created successfully!',
      position: 'top',
    });
    redirectAfterLogin();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Sign up failed';
  } finally {
    loading.value = false;
  }
};

const redirectAfterLogin = () => {
  // Wait a moment for auth state to propagate
  setTimeout(() => {
    const redirectTo = route.query.redirect as string || '/';
    void router.push(redirectTo);
  }, 100);
};

// Redirect if already authenticated
onMounted(() => {
  if (user.value) {
    redirectAfterLogin();
  }
});
</script>

<style scoped>
.q-page {
  min-height: calc(100vh - 50px);
}
</style>
