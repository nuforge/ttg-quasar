<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h4 text-center">🧪 Firebase & Google Cloud Testing Dashboard</div>
      </div>
      <div class="col-auto">
        <q-btn @click="toggleTheme" :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          :color="$q.dark.isActive ? 'amber' : 'grey-8'" round size="md"
          :title="$q.dark.isActive ? 'Switch to Light Mode' : 'Switch to Dark Mode'" />
      </div>
    </div>

    <!-- Status Overview -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">🔍 API Status Overview</div>
        <div class="row q-gutter-md q-mt-sm">
          <q-chip :color="authStatus.color" text-color="white" :icon="authStatus.icon" size="lg">
            Firebase Auth: {{ authStatus.text }}
          </q-chip>
          <q-chip :color="firestoreStatus.color" text-color="white" :icon="firestoreStatus.icon" size="lg">
            Firestore: {{ firestoreStatus.text }}
          </q-chip>
          <q-chip :color="calendarStatus.color" text-color="white" :icon="calendarStatus.icon" size="lg">
            Google Calendar: {{ calendarStatus.text }}
          </q-chip>
        </div>
      </q-card-section>
    </q-card>

    <!-- Test Actions Grid -->
    <div class="row q-gutter-md">
      <!-- Firebase Auth Testing -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">🔐 Firebase Authentication</div>
            <div class="q-mt-md">
              <div class="text-subtitle2 q-mb-sm">Current User:</div>
              <q-chip v-if="currentUser" color="green" text-color="white" icon="person" class="q-mb-md">
                {{ currentUser.email || currentUser.displayName || 'Anonymous' }}
              </q-chip>
              <q-chip v-else color="red" text-color="white" icon="person_off" class="q-mb-md">
                Not authenticated
              </q-chip>

              <div class="q-gutter-sm">
                <q-btn v-if="!currentUser" color="primary" icon="login" label="Sign In with Google"
                  @click="signInWithGoogle" :loading="authLoading" />
                <q-btn v-if="currentUser" color="negative" icon="logout" label="Sign Out" @click="signOut"
                  :loading="authLoading" />
                <q-btn color="info" icon="refresh" label="Check Auth Status" @click="checkAuthStatus"
                  :loading="authLoading" />
                <q-btn color="purple" icon="bug_report" label="Run API Tests" @click="runAPITests"
                  :loading="authLoading" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Firestore Testing -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">🔥 Firestore Database</div>
            <div class="q-mt-md">
              <div class="text-subtitle2 q-mb-sm">Test Document Operations:</div>

              <div class="q-mb-md">
                <q-input v-model="testDocData.title" label="Test Title" outlined dense class="q-mb-sm" />
                <q-input v-model="testDocData.description" label="Test Description" outlined dense type="textarea"
                  rows="2" />
              </div>

              <div class="q-gutter-sm">
                <q-btn color="primary" icon="add" label="Create Test Doc" @click="createTestDocument"
                  :loading="firestoreLoading" />
                <q-btn color="info" icon="refresh" label="Load Test Docs" @click="loadTestDocuments"
                  :loading="firestoreLoading" />
                <q-btn color="negative" icon="delete" label="Clear All" @click="clearTestDocuments"
                  :loading="firestoreLoading" />
              </div>

              <!-- Test Documents List -->
              <div v-if="testDocuments.length > 0" class="q-mt-md">
                <div class="text-subtitle2 q-mb-sm">Test Documents ({{ testDocuments.length }}):</div>
                <q-list dense bordered class="rounded-borders">
                  <q-item v-for="doc in testDocuments" :key="doc.id || 'unknown'" class="q-pa-sm">
                    <q-item-section>
                      <q-item-label class="text-weight-bold">{{ doc.title }}</q-item-label>
                      <q-item-label caption>{{ doc.description }}</q-item-label>
                      <q-item-label caption class="text-body2">
                        Created: {{ formatDate(doc.createdAt) }}
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-btn flat round color="negative" icon="delete" size="sm" @click="deleteTestDocument(doc.id!)" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Google Calendar Testing -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">📅 Google Calendar Integration</div>
            <div class="row q-gutter-md q-mt-md">
              <div class="col-12 col-md-6">
                <div class="text-subtitle2 q-mb-sm">Create Test Event:</div>

                <q-input v-model="testEvent.summary" label="Event Title" outlined dense class="q-mb-sm" />
                <q-input v-model="testEvent.description" label="Event Description" outlined dense type="textarea"
                  rows="2" class="q-mb-sm" />
                <q-input v-model="testEvent.location" label="Location" outlined dense class="q-mb-sm" />
                <div class="row q-gutter-sm q-mb-sm">
                  <q-input v-model="testEvent.startDate" label="Start Date" type="date" outlined dense class="col" />
                  <q-input v-model="testEvent.startTime" label="Start Time" type="time" outlined dense class="col" />
                </div>
                <div class="row q-gutter-sm q-mb-md">
                  <q-input v-model="testEvent.endDate" label="End Date" type="date" outlined dense class="col" />
                  <q-input v-model="testEvent.endTime" label="End Time" type="time" outlined dense class="col" />
                </div>

                <!-- Token Status -->
                <q-card class="q-mt-md" v-if="currentUser">
                  <q-card-section class="q-pb-sm">
                    <div class="text-caption text-weight-bold text-blue q-mb-sm">🔑 Google OAuth Token Status</div>

                    <div class="row items-center q-gutter-sm q-mb-sm">
                      <q-chip :color="vueFireAuthService.isGoogleTokenValid() ? 'green' : 'red'" text-color="white"
                        :icon="vueFireAuthService.isGoogleTokenValid() ? 'verified' : 'error'" size="sm">
                        {{ vueFireAuthService.isGoogleTokenValid() ? 'Valid' : 'Expired/Missing' }}
                      </q-chip>

                      <q-btn v-if="!vueFireAuthService.isGoogleTokenValid()" color="primary" icon="refresh"
                        label="Refresh Token" @click="refreshGoogleAuth" :loading="authLoading" size="sm" dense />
                    </div>

                    <div class="text-caption text-grey-6">
                      {{ vueFireAuthService.googleAccessToken.value ?
                        'Token available, expires automatically in ~1 hour' :
                        'No token available. Sign in with Google to obtain calendar access.' }}
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Calendar Selection -->
                <q-card class="q-mt-md">
                  <q-card-section class="q-pb-none">
                    <div class="text-caption text-weight-bold text-orange q-mb-sm">🎯 Target Calendar Selection</div>

                    <!-- Dropdown Selection -->
                    <q-select v-model="selectedCalendarId" :options="calendarOptions" option-value="value"
                      option-label="label" emit-value map-options label="Select Calendar" outlined dense class="q-mb-sm"
                      :disable="!currentUser">
                      <template v-slot:option="scope">
                        <q-item v-bind="scope.itemProps">
                          <q-item-section>
                            <q-item-label>{{ scope.opt.label }}</q-item-label>
                            <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-select>

                    <!-- Manual Calendar ID Input -->
                    <q-expansion-item icon="settings" label="Manual Calendar ID Setup" class="q-mt-sm">
                      <q-card-section class="q-pt-none">
                        <div class="text-caption q-mb-sm">Enter a specific calendar ID directly:</div>
                        <q-input v-model="manualCalendarId" label="Calendar ID" outlined dense
                          placeholder="cf4f155a3c69597b84acfb7ac13cda167375de8bf6c83f34da2f9de64684867e@group.calendar.google.com"
                          class="q-mb-sm">
                          <template v-slot:hint>
                            Format: abc123@group.calendar.google.com or 'primary'
                          </template>
                        </q-input>
                        <div class="q-gutter-sm">
                          <q-btn color="primary" size="sm" label="Use This Calendar" @click="setManualCalendar"
                            :disable="!manualCalendarId" />
                          <q-btn color="secondary" size="sm" label="Use ttgaming Calendar"
                            @click="setTtgamingCalendar" />
                          <q-btn color="green" size="sm" label="Use Personal Calendar" @click="setPersonalCalendar"
                            title="Switch to your personal calendar (always has write access)" />
                        </div>
                      </q-card-section>
                    </q-expansion-item>

                    <div class="text-caption text-body2 q-mt-sm">
                      Selected: {{ getSelectedCalendarName() }}
                    </div>
                  </q-card-section>
                </q-card>

                <div class="q-gutter-sm">
                  <q-btn color="primary" icon="event" label="Create Calendar Event" @click="createCalendarEvent"
                    :loading="calendarLoading" :disable="!currentUser" />
                  <q-btn color="info" icon="list" label="List My Events" @click="listCalendarEvents"
                    :loading="calendarLoading" :disable="!currentUser" />
                  <q-btn color="purple" icon="calendar_view_month" label="List Available Calendars"
                    @click="listAvailableCalendars" :loading="calendarLoading" :disable="!currentUser" />
                  <q-btn color="orange" icon="refresh" label="Refresh Google Auth" @click="refreshGoogleAuth"
                    :loading="authLoading" :disable="!currentUser"
                    title="Re-authenticate with Google to refresh Calendar permissions" />
                </div>

                <!-- Calendar Configuration Status -->
                <q-card class="q-mt-md">
                  <q-card-section class="q-pb-none">
                    <div class="text-caption text-weight-bold text-primary q-mb-xs">📅 Calendar Configuration</div>
                    <div class="text-caption">
                      <span class="text-weight-medium">Target Calendar:</span> {{ getCalendarConfigText() }}
                    </div>
                    <div class="text-caption text-body2 q-mt-xs">
                      💡 Tip: Use "List Available Calendars" to populate the dropdown, then select your target calendar
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Calendar Permissions Info -->
                <q-card class="q-mt-md">
                  <q-card-section class="q-pb-none">
                    <div class="text-caption text-weight-bold text-orange q-mb-xs">🔐 Calendar Permissions</div>
                    <div class="text-caption text-body2">
                      <div><strong>Current User:</strong> {{ currentUser?.email || 'Not signed in' }}</div>
                      <div class="q-mt-xs"><strong>For shared calendars:</strong> The calendar owner must share it with
                        your email
                        address using "Make changes to events" permission.</div>
                      <div class="q-mt-xs"><strong>Alternative:</strong> Use "Personal Calendar (Primary)" which you
                        always have write
                        access to.</div>
                    </div>
                  </q-card-section>
                </q-card>

                <!-- Event Submission Testing -->
                <q-card class="q-mt-md">
                  <q-card-section>
                    <div class="text-caption text-weight-bold text-purple q-mb-xs">📝 Event Submission System</div>
                    <div class="text-caption text-body2 q-mb-md">
                      Test the new event submission and approval workflow
                    </div>
                    <div class="q-gutter-sm">
                      <q-btn color="purple" icon="add_circle" label="Submit New Event"
                        @click="showEventSubmissionDialog = true" :disable="!currentUser" size="sm" />
                      <q-btn color="blue" icon="list" label="My Submissions" @click="loadMySubmissions"
                        :loading="eventsLoading" :disable="!currentUser" size="sm" />
                      <q-btn color="orange" icon="admin_panel_settings" label="Admin Review"
                        @click="loadPendingSubmissions" :loading="eventsLoading" :disable="!currentUser" size="sm" />
                    </div>

                    <!-- Event Submissions List -->
                    <div v-if="eventSubmissions.length > 0" class="q-mt-md">
                      <div class="text-caption text-weight-bold q-mb-sm">Event Submissions ({{ eventSubmissions.length
                        }}):</div>
                      <q-list dense bordered class="rounded-borders">
                        <q-item v-for="submission in eventSubmissions" :key="submission.id || 'unknown'"
                          class="q-pa-sm">
                          <q-item-section>
                            <q-item-label class="text-weight-bold">{{ submission.title }}</q-item-label>
                            <q-item-label caption>{{ submission.description.substring(0, 100) }}...</q-item-label>
                            <q-item-label caption class="text-body2">
                              📅 {{ formatSubmissionDate(submission) }} | Status: {{ submission.status }}
                            </q-item-label>
                            <q-item-label caption class="text-body2">
                              📍 {{ submission.location }} | Type: {{ submission.eventType }}
                            </q-item-label>
                          </q-item-section>
                          <q-item-section side>
                            <div class="q-gutter-xs">
                              <q-btn v-if="submission.status === 'pending'" flat round color="green" icon="check"
                                size="sm" @click="approveSubmission(submission.id!)"
                                title="Approve and publish to calendar" />
                              <q-btn v-if="submission.status === 'pending'" flat round color="red" icon="close"
                                size="sm" @click="rejectSubmission(submission.id!)" title="Reject submission" />
                            </div>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-md-6">
                <div class="text-subtitle2 q-mb-sm">Recent Calendar Events:</div>
                <q-list v-if="calendarEvents.length > 0" dense bordered class="rounded-borders">
                  <q-item v-for="event in calendarEvents" :key="event.id || 'no-id'" class="q-pa-sm">
                    <q-item-section>
                      <q-item-label class="text-weight-bold">{{ event.summary }}</q-item-label>
                      <q-item-label caption>{{ event.description || 'No description' }}</q-item-label>
                      <q-item-label caption class="text-body2">
                        📅 {{ event.start ? formatCalendarDate(event.start) : 'No date' }}
                      </q-item-label>
                      <q-item-label caption class="text-body2" v-if="event.location">
                        📍 {{ event.location }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
                <div v-else class="text-body2 text-center q-pa-md">
                  No events loaded. Click "List My Events" to fetch.
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Real-time Data Monitoring -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">📊 Real-time Data Flow Monitor</div>
            <div class="row q-gutter-md q-mt-md">
              <div class="col-12 col-md-4">
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-subtitle2 text-center">Events Store</div>
                    <div class="text-h4 text-center text-primary">{{ eventsCount }}</div>
                    <div class="text-caption text-center">Total Events</div>
                    <q-btn flat color="primary" icon="refresh" label="Refresh" class="full-width q-mt-sm"
                      @click="refreshEventsData" :loading="eventsLoading" />
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-12 col-md-4">
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-subtitle2 text-center">Messages Store</div>
                    <div class="text-h4 text-center text-secondary">{{ messagesCount }}</div>
                    <div class="text-caption text-center">Total Messages</div>
                    <q-btn flat color="secondary" icon="refresh" label="Refresh" class="full-width q-mt-sm"
                      @click="refreshMessagesData" :loading="messagesLoading" />
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-12 col-md-4">
                <q-card flat bordered>
                  <q-card-section>
                    <div class="text-subtitle2 text-center">Test Documents</div>
                    <div class="text-h4 text-center text-accent">{{ testDocuments.length }}</div>
                    <div class="text-caption text-center">Test Docs Created</div>
                    <q-btn flat color="accent" icon="science" label="Run All Tests" class="full-width q-mt-sm"
                      @click="runAllTests" :loading="allTestsLoading" />
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- API Test Results -->
      <div class="col-12" v-if="apiTestingService.results.value.length > 0">
        <q-card>
          <q-card-section>
            <div class="text-h6">🔧 API Test Results</div>
            <q-btn flat color="grey" icon="clear" label="Clear Results" class="float-right"
              @click="apiTestingService.clearResults()" />

            <!-- Helpful debug information -->
            <q-banner class="bg-info text-white q-mb-md" rounded>
              <template v-slot:avatar>
                <q-icon name="info" />
              </template>
              <div class="text-caption">
                <strong>Debug Info:</strong> API tests now use the 'testDocuments' collection with proper
                authentication.
                If you see Firestore errors, ensure you're signed in and the security rules are deployed.
              </div>
            </q-banner>

            <div class="q-mt-md">
              <q-list dense class="rounded-borders">
                <q-item v-for="(result, index) in apiTestingService.results.value.slice(0, 10)" :key="`result-${index}`"
                  class="q-pa-xs">
                  <q-item-section avatar>
                    <q-icon
                      :name="result.status === 'success' ? 'check_circle' : result.status === 'warning' ? 'warning' : 'error'"
                      :color="result.status === 'success' ? 'green' : result.status === 'warning' ? 'orange' : 'red'"
                      size="sm" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ result.name }}</q-item-label>
                    <q-item-label caption>{{ result.message }}</q-item-label>
                    <q-item-label caption class="text-body2">
                      {{ formatTime(result.timestamp) }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side v-if="result.details">
                    <q-btn flat round color="grey" icon="info" size="sm" @click="showResultDetails(result)" />
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Games Migration -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">🎮 Games Data Migration</div>
            <div class="q-mt-md">
              <div class="text-body2 q-mb-md">
                Migrate games data from local JSON to Firebase with image storage support.
              </div>

              <div class="q-gutter-sm">
                <q-btn color="primary" icon="cloud_upload" label="Migrate Games to Firebase" @click="runGamesMigration"
                  :loading="migrationLoading" />
                <q-btn color="negative" icon="delete_forever" label="Clear All Games" @click="clearAllGames"
                  :loading="migrationLoading" />
              </div>

              <div v-if="migrationResult" class="q-mt-md">
                <q-card flat bordered :class="migrationResult.errors.length > 0 ? 'bg-orange-1' : 'bg-green-1'">
                  <q-card-section class="q-pa-sm">
                    <div class="text-subtitle2">Migration Results:</div>
                    <div class="text-body2">
                      Total: {{ migrationResult.total }}<br>
                      Successful: {{ migrationResult.successful }}<br>
                      Errors: {{ migrationResult.errors.length }}
                    </div>
                    <div v-if="migrationResult.errors.length > 0" class="q-mt-sm">
                      <div class="text-caption text-weight-bold">Errors:</div>
                      <div v-for="error in migrationResult.errors.slice(0, 3)" :key="error.gameId" class="text-caption">
                        • Game ID {{ error.gameId }}: {{ error.error }}
                      </div>
                      <div v-if="migrationResult.errors.length > 3" class="text-caption">
                        ... and {{ migrationResult.errors.length - 3 }} more
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Activity Log -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">📝 Activity Log</div>
            <q-btn flat color="grey" icon="clear" label="Clear Log" class="float-right" @click="clearActivityLog" />
            <div class="q-mt-md">
              <q-list dense class="rounded-borders" style="max-height: 300px; overflow-y: auto;">
                <q-item v-for="(log, index) in activityLog" :key="index" class="q-pa-xs">
                  <q-item-section avatar>
                    <q-icon :name="log.icon" :color="log.color" size="sm" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ log.message }}</q-item-label>
                    <q-item-label caption class="text-body2">
                      {{ formatTime(log.timestamp) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-if="activityLog.length === 0" class="text-body2 text-center q-pa-md">
                No activity yet. Start testing to see logs here.
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Event Submission Dialog -->
    <EventSubmissionDialog v-model="showEventSubmissionDialog" @submitted="onEventSubmitted" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { vueFireAuthService } from 'src/services/vuefire-auth-service';
import { googleCalendarService, type CalendarEvent } from 'src/services/google-calendar-service';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { useMessagesFirebaseStore } from 'src/stores/messages-firebase-store';
import { apiTestingService, type APITestResult } from 'src/services/api-testing-service';
import { eventSubmissionService } from 'src/services/event-submission-service';
import { type EventSubmission } from 'src/models/EventSubmission';
import EventSubmissionDialog from 'src/components/events/EventSubmissionDialog.vue';
import { gameMigrationService, type MigrationResult } from 'src/services/game-migration-service';

const $q = useQuasar();

// Helper function to safely show notifications
const showNotification = (options: {
  type: 'positive' | 'negative' | 'warning' | 'info' | 'ongoing';
  message: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right' | 'center';
}) => {
  try {
    if (typeof $q?.notify === 'function') {
      $q.notify(options);
    } else {
      console.log(`Notification: ${options.type.toUpperCase()} - ${options.message}`);
    }
  } catch {
    console.log(`Notification: ${options.type.toUpperCase()} - ${options.message}`);
  }
};

// Reactive references
const currentUser = computed(() => vueFireAuthService.currentUser.value);

// Loading states
const authLoading = ref(false);
const firestoreLoading = ref(false);
const calendarLoading = ref(false);
const eventsLoading = ref(false);
const messagesLoading = ref(false);
const allTestsLoading = ref(false);
const migrationLoading = ref(false);

// Migration results
const migrationResult = ref<MigrationResult | null>(null);

// Event submission system
const showEventSubmissionDialog = ref(false);
const eventSubmissions = ref<EventSubmission[]>([]);

// Test data
const testDocData = ref({
  title: 'Test Document',
  description: 'This is a test document created from the testing dashboard'
});

const testEvent = ref({
  summary: 'Test Event',
  description: 'Test event created from testing dashboard',
  location: 'Virtual Meeting',
  startDate: new Date().toISOString().split('T')[0],
  startTime: '10:00',
  endDate: new Date().toISOString().split('T')[0],
  endTime: '11:00'
});

// Type definitions
interface TestDocument {
  id?: string;
  title: string;
  description: string;
  createdAt: Date | { toDate(): Date } | null;
  userId: string;
}

interface ActivityLogEntry {
  message: string;
  color: string;
  icon: string;
  timestamp: Date;
}

const testDocuments = ref<TestDocument[]>([]);
const calendarEvents = ref<CalendarEvent[]>([]);
const activityLog = ref<ActivityLogEntry[]>([]);

// Calendar selection
interface CalendarOption {
  id: string;
  name: string;
  isPrimary?: boolean;
  accessRole?: string;
}

const availableCalendars = ref<CalendarOption[]>([]);
const selectedCalendarId = ref<string>('cf4f155a3c69597b84acfb7ac13cda167375de8bf6c83f34da2f9de64684867e@group.calendar.google.com');
const manualCalendarId = ref<string>('cf4f155a3c69597b84acfb7ac13cda167375de8bf6c83f34da2f9de64684867e@group.calendar.google.com');

// Stores
const eventsStore = useEventsFirebaseStore();
const messagesStore = useMessagesFirebaseStore();

// Real-time listeners
let testDocsUnsubscribe: Unsubscribe | null = null;

// Computed status indicators
const authStatus = computed(() => {
  const authResults = apiTestingService.results.value.filter(r => r.name === 'Firebase Authentication');

  if (authResults.length > 0) {
    const latest = authResults[0]!;
    return {
      color: latest.status === 'success' ? 'green' : latest.status === 'warning' ? 'orange' : 'red',
      icon: latest.status === 'success' ? 'check_circle' : latest.status === 'warning' ? 'warning' : 'error',
      text: latest.status === 'success' ? 'Connected' : latest.status === 'warning' ? 'Not Authenticated' : 'Error'
    };
  }

  if (currentUser.value) {
    return { color: 'green', icon: 'check_circle', text: 'Connected' };
  }
  return { color: 'red', icon: 'error', text: 'Disconnected' };
});

const firestoreStatus = computed(() => {
  const firestoreResults = apiTestingService.results.value.filter(r => r.name === 'Firestore Database');

  if (firestoreResults.length > 0) {
    const latest = firestoreResults[0]!;
    return {
      color: latest.status === 'success' ? 'green' : latest.status === 'warning' ? 'orange' : 'red',
      icon: latest.status === 'success' ? 'check_circle' : latest.status === 'warning' ? 'warning' : 'error',
      text: latest.status === 'success' ? 'Connected' : 'Error'
    };
  }

  return { color: 'grey', icon: 'help', text: 'Unknown' };
});

const calendarStatus = computed(() => {
  const calendarResults = apiTestingService.results.value.filter(r => r.name === 'Google Calendar API');

  if (calendarResults.length > 0) {
    const latest = calendarResults[0]!;
    return {
      color: latest.status === 'success' ? 'green' : latest.status === 'warning' ? 'orange' : 'red',
      icon: latest.status === 'success' ? 'check_circle' : latest.status === 'warning' ? 'warning' : 'error',
      text: latest.status === 'success' ? 'Connected' : latest.status === 'warning' ? 'Auth Required' : 'Error'
    };
  }

  if (currentUser.value) {
    // Check Google token status
    if (vueFireAuthService.isGoogleTokenValid()) {
      return { color: 'green', icon: 'verified', text: 'Token Valid' };
    } else if (vueFireAuthService.googleAccessToken.value) {
      return { color: 'orange', icon: 'schedule', text: 'Token Expired' };
    } else {
      return { color: 'orange', icon: 'warning', text: 'No Token' };
    }
  }
  return { color: 'red', icon: 'error', text: 'Auth Required' };
});

const eventsCount = computed(() => eventsStore.events.length);
const messagesCount = computed(() => messagesStore.messages.length);

// Calendar selection computed properties
const calendarOptions = computed(() => {
  const options = availableCalendars.value.map(cal => ({
    label: cal.name + (cal.isPrimary ? ' (Primary)' : ''),
    value: cal.id,
    description: cal.accessRole ? `Access: ${cal.accessRole}` : 'Calendar access'
  }));

  // Always ensure primary is available
  if (!options.find(opt => opt.value === 'primary')) {
    options.unshift({
      label: 'Personal Calendar (Primary)',
      value: 'primary',
      description: 'Your personal Google Calendar'
    });
  }

  // Add ttgaming shared calendar if not already present
  const ttgamingCalendarId = 'cf4f155a3c69597b84acfb7ac13cda167375de8bf6c83f34da2f9de64684867e@group.calendar.google.com';
  if (!options.find(opt => opt.value === ttgamingCalendarId)) {
    options.push({
      label: 'ttgaming Shared Calendar',
      value: ttgamingCalendarId,
      description: 'Shared calendar for ttgaming events'
    });
  }

  return options;
});

const getSelectedCalendarName = () => {
  const selected = calendarOptions.value.find(opt => opt.value === selectedCalendarId.value);
  return selected ? selected.label : 'Unknown Calendar';
};

// Activity logging
const addLog = (message: string, color = 'primary', icon = 'info') => {
  activityLog.value.unshift({
    message,
    color,
    icon,
    timestamp: new Date()
  });
  // Keep only last 50 logs
  if (activityLog.value.length > 50) {
    activityLog.value = activityLog.value.slice(0, 50);
  }
};

// Auth functions
const signInWithGoogle = async () => {
  authLoading.value = true;
  try {
    await vueFireAuthService.signInWithGoogle();
    addLog('Successfully signed in with Google', 'green', 'login');
    showNotification({
      type: 'positive',
      message: 'Successfully signed in!',
      position: 'top'
    });

    // Auto-load available calendars after successful sign-in
    try {
      await listAvailableCalendars();
    } catch (error) {
      console.warn('Failed to auto-load calendars after sign-in:', error);
      addLog('Note: Use "List Available Calendars" button to populate calendar selector', 'orange', 'info');
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Google sign-in failed: ${message}`, 'red', 'error');
    showNotification({
      type: 'negative',
      message: `Sign-in failed: ${message}`,
      position: 'top'
    });
  } finally {
    authLoading.value = false;
  }
};

const signOut = async () => {
  authLoading.value = true;
  try {
    await vueFireAuthService.signOut();
    addLog('Successfully signed out', 'blue', 'logout');
    showNotification({
      type: 'info',
      message: 'Successfully signed out!',
      position: 'top'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Sign-out failed: ${message}`, 'red', 'error');
    showNotification({
      type: 'negative',
      message: `Sign-out failed: ${message}`,
      position: 'top'
    });
  } finally {
    authLoading.value = false;
  }
};

const runAPITests = async () => {
  authLoading.value = true;
  addLog('Running comprehensive API diagnostics...', 'purple', 'bug_report');

  try {
    // Pre-flight check for authentication
    if (!currentUser.value) {
      addLog('❌ Authentication required for API tests', 'orange', 'warning');
      showNotification({
        type: 'warning',
        message: 'Please sign in with Google before running API tests',
        position: 'top'
      });
      return;
    }

    addLog(`✅ Running tests as: ${currentUser.value.email || currentUser.value.displayName}`, 'blue', 'person');

    const results = await apiTestingService.runFullDiagnostics();

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;

    addLog(`API diagnostics complete: ${successCount} passed, ${warningCount} warnings, ${errorCount} errors`,
      errorCount > 0 ? 'red' : warningCount > 0 ? 'orange' : 'green', 'assessment');

    // Provide specific guidance for failures
    if (errorCount > 0) {
      const firestoreError = results.find(r => r.name === 'Firestore Database' && r.status === 'error');
      if (firestoreError) {
        addLog('💡 Firestore error detected. Check the "Details" button for specific error information.', 'orange', 'lightbulb');
      }
    }

    showNotification({
      type: errorCount > 0 ? 'negative' : warningCount > 0 ? 'warning' : 'positive',
      message: `API tests complete: ${successCount}/${results.length} passed`,
      position: 'top'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`API diagnostics failed: ${message}`, 'red', 'error');
    showNotification({
      type: 'negative',
      message: 'API diagnostics failed',
      position: 'top'
    });
  } finally {
    authLoading.value = false;
  }
};

const checkAuthStatus = async () => {
  authLoading.value = true;
  try {
    if (currentUser.value) {
      const token = await currentUser.value.getIdToken(true);
      addLog(`Auth token refreshed. Length: ${token.length}`, 'green', 'verified');
      showNotification({
        type: 'positive',
        message: 'Authentication verified!',
        position: 'top'
      });
    } else {
      addLog('No authenticated user found', 'orange', 'person_off');
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Auth check failed: ${message}`, 'red', 'error');
  } finally {
    authLoading.value = false;
  }
};

// Firestore functions
const createTestDocument = async () => {
  firestoreLoading.value = true;
  try {
    const docData = {
      ...testDocData.value,
      createdAt: serverTimestamp(),
      userId: currentUser.value?.uid || 'anonymous'
    };

    const docRef = await addDoc(collection(db, 'testDocuments'), docData);
    addLog(`Test document created with ID: ${docRef.id}`, 'green', 'add_circle');

    showNotification({
      type: 'positive',
      message: 'Test document created successfully!',
      position: 'top'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Failed to create test document: ${message}`, 'red', 'error');
    showNotification({
      type: 'negative',
      message: `Failed to create document: ${message}`,
      position: 'top'
    });
  } finally {
    firestoreLoading.value = false;
  }
};

const loadTestDocuments = async () => {
  firestoreLoading.value = true;
  try {
    const q = query(collection(db, 'testDocuments'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    testDocuments.value = querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as TestDocument));

    addLog(`Loaded ${testDocuments.value.length} test documents`, 'blue', 'folder');

    showNotification({
      type: 'info',
      message: `Loaded ${testDocuments.value.length} test documents`,
      position: 'top'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Failed to load test documents: ${message}`, 'red', 'error');
    showNotification({
      type: 'negative',
      message: `Failed to load documents: ${message}`,
      position: 'top'
    });
  } finally {
    firestoreLoading.value = false;
  }
};

const deleteTestDocument = async (docId: string) => {
  try {
    await deleteDoc(doc(db, 'testDocuments', docId));
    testDocuments.value = testDocuments.value.filter(doc => doc.id !== docId);
    addLog(`Test document ${docId} deleted`, 'orange', 'delete');

    showNotification({
      type: 'warning',
      message: 'Test document deleted',
      position: 'top'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Failed to delete document: ${message}`, 'red', 'error');
  }
};

const clearTestDocuments = async () => {
  firestoreLoading.value = true;
  try {
    const deletePromises = testDocuments.value.map(document =>
      deleteDoc(doc(db, 'testDocuments', document.id!))
    );

    await Promise.all(deletePromises);
    testDocuments.value = [];

    addLog('All test documents cleared', 'orange', 'clear_all');
    showNotification({
      type: 'warning',
      message: 'All test documents cleared',
      position: 'top'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Failed to clear documents: ${message}`, 'red', 'error');
  } finally {
    firestoreLoading.value = false;
  }
};

// Calendar functions
const createCalendarEvent = async () => {
  calendarLoading.value = true;
  try {
    // Debug information
    const userEmail = currentUser.value?.email;
    addLog(`🔍 Creating event as user: ${userEmail}`, 'blue', 'person');
    addLog(`🎯 Target calendar: ${getSelectedCalendarName()}`, 'blue', 'calendar_today');

    const startDateTime = new Date(`${testEvent.value.startDate}T${testEvent.value.startTime}`);
    const endDateTime = new Date(`${testEvent.value.endDate}T${testEvent.value.endTime}`);

    const eventData: CalendarEvent = {
      summary: testEvent.value.summary,
      description: testEvent.value.description,
      location: testEvent.value.location,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    const createdEvent = await googleCalendarService.createEvent(eventData);
    addLog(`Calendar event created: ${createdEvent.summary}`, 'green', 'event');

    showNotification({
      type: 'positive',
      message: 'Calendar event created successfully!',
      position: 'top'
    });

    // Refresh the events list
    await listCalendarEvents();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Failed to create calendar event: ${message}`, 'red', 'error');

    // Provide specific guidance for permission issues
    if (message.includes('writer access') || message.includes('Access denied')) {
      addLog(`⚠️ Permission Issue Detected!`, 'orange', 'warning');
      addLog(`💡 Solutions:`, 'blue', 'lightbulb');
      addLog(`1. Share the ttgaming calendar with your current user (${currentUser.value?.email}) as "Make changes to events"`, 'blue', 'share');
      addLog(`2. Or use your personal calendar instead by selecting "Personal Calendar (Primary)"`, 'blue', 'person');
      addLog(`3. Or create events in the nuforge Google account directly`, 'blue', 'account_circle');
    }

    showNotification({
      type: 'negative',
      message: `Failed to create calendar event: ${message}`,
      position: 'top'
    });
  } finally {
    calendarLoading.value = false;
  }
};

const listCalendarEvents = async () => {
  calendarLoading.value = true;
  try {
    // First check if we have a Google access token
    const hasToken = !!vueFireAuthService.googleAccessToken.value;
    addLog(`Google OAuth Token available: ${hasToken}`, hasToken ? 'green' : 'orange', 'info');

    if (!hasToken) {
      addLog('No Google OAuth token found. You may need to sign out and sign in again with Google.', 'orange', 'warning');
      showNotification({
        type: 'warning',
        message: 'Please sign out and sign in again to refresh Google permissions',
        position: 'top'
      });
      return;
    }

    const result = await googleCalendarService.listEvents();
    calendarEvents.value = result.items.slice(0, 10); // Show only first 10 events

    // Debug logging to see the actual event structure
    if (result.items.length > 0) {
      console.log('Sample calendar event:', JSON.stringify(result.items[0], null, 2));
      addLog(`Sample event structure logged to console`, 'blue', 'bug_report');
    }

    addLog(`Loaded ${result.items.length} calendar events`, 'blue', 'list');
    showNotification({
      type: 'info',
      message: `Loaded ${result.items.length} calendar events`,
      position: 'top'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Failed to load calendar events: ${message}`, 'red', 'error');

    // Provide specific guidance for common errors
    if (message.includes('401') || message.includes('Unauthorized')) {
      addLog('Google Calendar API unauthorized. Please sign out and sign in again.', 'orange', 'warning');
      showNotification({
        type: 'warning',
        message: 'Calendar access unauthorized. Please sign out and sign in again.',
        position: 'top'
      });
    } else {
      showNotification({
        type: 'negative',
        message: `Failed to load events: ${message}`,
        position: 'top'
      });
    }
  } finally {
    calendarLoading.value = false;
  }
};

// Refresh Google authentication to get new access token
const refreshGoogleAuth = async () => {
  authLoading.value = true;
  try {
    addLog('Refreshing Google authentication...', 'blue', 'refresh');

    // Clean up any active Firestore listeners to prevent permission errors
    if (testDocsUnsubscribe) {
      testDocsUnsubscribe();
      testDocsUnsubscribe = null;
      addLog('Cleaned up Firestore listeners', 'blue', 'cleaning_services');
    }

    // Sign out and sign in again to get fresh tokens
    await vueFireAuthService.signOut();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
    await vueFireAuthService.signInWithGoogle();

    const hasToken = !!vueFireAuthService.googleAccessToken.value;
    addLog(`Google authentication refreshed. Token available: ${hasToken}`, hasToken ? 'green' : 'orange', hasToken ? 'check' : 'warning');

    // Restart the Firestore listeners
    setupRealtimeListeners();

    showNotification({
      type: hasToken ? 'positive' : 'warning',
      message: hasToken ? 'Google authentication refreshed successfully!' : 'Authentication refresh completed but no token received',
      position: 'top'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Failed to refresh Google authentication: ${message}`, 'red', 'error');
    showNotification({
      type: 'negative',
      message: `Auth refresh failed: ${message}`,
      position: 'top'
    });
  } finally {
    authLoading.value = false;
  }
};

// List available calendars for the authenticated user
const listAvailableCalendars = async () => {
  calendarLoading.value = true;
  try {
    addLog('Fetching available calendars...', 'purple', 'calendar_view_month');

    const calendarsResult = await googleCalendarService.listCalendars();
    const calendars = calendarsResult.items || [];

    // Populate the availableCalendars array
    availableCalendars.value = calendars.map(calendar => ({
      id: calendar.id,
      name: calendar.summary,
      ...(calendar.primary !== undefined && { isPrimary: calendar.primary }),
      ...(calendar.accessRole && { accessRole: calendar.accessRole })
    }));

    addLog(`Found ${calendars.length} accessible calendars`, 'purple', 'list');

    // Log details about each calendar
    const ttgamingCalendarId = 'cf4f155a3c69597b84acfb7ac13cda167375de8bf6c83f34da2f9de64684867e@group.calendar.google.com';
    let foundTtgaming = false;

    calendars.forEach((calendar) => {
      const isPrimary = calendar.primary ? ' (Primary)' : '';
      const accessRole = calendar.accessRole ? ` - ${calendar.accessRole}` : '';
      addLog(`📅 ${calendar.summary}${isPrimary}${accessRole}`, 'blue', 'info');

      if (!calendar.primary) {
        addLog(`   Calendar ID: ${calendar.id}`, 'grey', 'info');
      }

      // Check if ttgaming calendar was found
      if (calendar.id === ttgamingCalendarId) {
        foundTtgaming = true;
        addLog(`✅ Found ttgaming shared calendar in API response!`, 'green', 'check');
      }
    });

    // Check if ttgaming calendar is missing from API but added manually
    if (!foundTtgaming) {
      addLog(`⚠️ ttgaming calendar not found in API response`, 'orange', 'warning');
      addLog(`💡 ttgaming calendar added manually to dropdown`, 'blue', 'info');
    }

    showNotification({
      type: 'info',
      message: `Found ${calendars.length} accessible calendars. Updated calendar selector.`,
      position: 'top'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Failed to list calendars: ${message}`, 'red', 'error');
    showNotification({
      type: 'negative',
      message: `Failed to list calendars: ${message}`,
      position: 'top'
    });
  } finally {
    calendarLoading.value = false;
  }
};

// Get calendar configuration text for display
const getCalendarConfigText = () => {
  const currentCalendarId = selectedCalendarId.value;

  if (currentCalendarId === 'primary') {
    return 'Personal Calendar (Primary)';
  }

  const calendar = availableCalendars.value.find(cal => cal.id === currentCalendarId);
  if (calendar) {
    return `${calendar.name}${calendar.isPrimary ? ' (Primary)' : ''}`;
  }

  return `Calendar ID: ${currentCalendarId}`;
};

// Store data functions
const refreshEventsData = () => {
  eventsLoading.value = true;
  try {
    eventsStore.subscribeToEvents();
    addLog(`Events data refreshed: ${eventsStore.events.length} events`, 'blue', 'refresh');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    addLog(`Failed to refresh events: ${message}`, 'red', 'error');
  } finally {
    eventsLoading.value = false;
  }
};

const refreshMessagesData = () => {
  messagesLoading.value = true;
  try {
    messagesStore.subscribeToDirectMessages();
    addLog(`Messages data refreshed: ${messagesStore.messages.length} messages`, 'blue', 'refresh');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    addLog(`Failed to refresh messages: ${message}`, 'red', 'error');
  } finally {
    messagesLoading.value = false;
  }
};

// Event submission functions
const loadMySubmissions = async () => {
  eventsLoading.value = true;
  try {
    addLog('Loading your event submissions...', 'blue', 'list');
    const submissions = await eventSubmissionService.getUserSubmissions();
    eventSubmissions.value = submissions;
    addLog(`Loaded ${submissions.length} event submissions`, 'blue', 'list');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Failed to load submissions: ${message}`, 'red', 'error');
  } finally {
    eventsLoading.value = false;
  }
};

const loadPendingSubmissions = async () => {
  eventsLoading.value = true;
  try {
    addLog('Loading pending event submissions for review...', 'orange', 'admin_panel_settings');
    const submissions = await eventSubmissionService.getSubmissions({ status: 'pending' });
    eventSubmissions.value = submissions;
    addLog(`Loaded ${submissions.length} pending submissions`, 'orange', 'list');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Failed to load pending submissions: ${message}`, 'red', 'error');
  } finally {
    eventsLoading.value = false;
  }
};

const approveSubmission = async (submissionId: string) => {
  try {
    addLog(`Approving and publishing submission: ${submissionId}`, 'green', 'check');
    const calendarEventId = await eventSubmissionService.approveAndPublish(submissionId, 'Approved via testing dashboard');
    addLog(`Event published to calendar with ID: ${calendarEventId}`, 'green', 'event');
    showNotification({
      type: 'positive',
      message: 'Event approved and published to calendar!',
      position: 'top'
    });

    // Reload submissions to reflect the change
    if (eventSubmissions.value.some(s => s.status === 'pending')) {
      await loadPendingSubmissions();
    } else {
      await loadMySubmissions();
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Failed to approve submission: ${message}`, 'red', 'error');
    showNotification({
      type: 'negative',
      message: `Failed to approve submission: ${message}`,
      position: 'top'
    });
  }
};

const rejectSubmission = async (submissionId: string) => {
  try {
    addLog(`Rejecting submission: ${submissionId}`, 'red', 'close');
    await eventSubmissionService.updateSubmissionStatus(submissionId, 'rejected', 'Rejected via testing dashboard');
    addLog(`Submission rejected`, 'red', 'close');
    showNotification({
      type: 'info',
      message: 'Event submission rejected',
      position: 'top'
    });

    // Reload submissions to reflect the change
    if (eventSubmissions.value.some(s => s.status === 'pending')) {
      await loadPendingSubmissions();
    } else {
      await loadMySubmissions();
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Failed to reject submission: ${message}`, 'red', 'error');
    showNotification({
      type: 'negative',
      message: `Failed to reject submission: ${message}`,
      position: 'top'
    });
  }
};

const onEventSubmitted = (submissionId: string) => {
  addLog(`Event submitted with ID: ${submissionId}`, 'purple', 'add_circle');
  showNotification({
    type: 'positive',
    message: 'Event submitted successfully!',
    position: 'top'
  });

  // Optionally reload submissions to show the new one
  void loadMySubmissions();
};

const formatSubmissionDate = (submission: EventSubmission): string => {
  const startDate = new Date(`${submission.startDate}T${submission.startTime}`);
  return startDate.toLocaleString();
};

const runAllTests = async () => {
  allTestsLoading.value = true;
  addLog('Running comprehensive test suite...', 'purple', 'science');

  try {
    // Test 1: Auth status
    await checkAuthStatus();

    // Test 2: Firestore read/write
    await loadTestDocuments();

    // Test 3: Create a test document
    testDocData.value.title = `Test ${Date.now()}`;
    await createTestDocument();

    // Test 4: Calendar (if authenticated)
    if (currentUser.value) {
      await listCalendarEvents();
    }

    // Test 5: Store data
    refreshEventsData();
    refreshMessagesData();

    addLog('✅ All tests completed successfully!', 'green', 'check_circle');
    showNotification({
      type: 'positive',
      message: 'All tests completed successfully!',
      position: 'top'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`❌ Test suite failed: ${message}`, 'red', 'error');
    showNotification({
      type: 'negative',
      message: 'Some tests failed. Check activity log for details.',
      position: 'top'
    });
  } finally {
    allTestsLoading.value = false;
  }
};

// Utility functions
const formatDate = (timestamp: unknown) => {
  if (!timestamp) return 'Unknown';

  let date: Date;
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp as string | number);
  }

  return date.toLocaleString();
};

const formatCalendarDate = (start?: { dateTime?: string; date?: string; timeZone?: string }) => {
  if (!start) return 'No date specified';

  try {
    // Handle timed events (has dateTime)
    if (start.dateTime) {
      const date = new Date(start.dateTime);
      return date.toLocaleString();
    }

    // Handle all-day events (has date only)
    if (start.date) {
      const date = new Date(start.date + 'T00:00:00'); // Add time to avoid timezone issues
      return `${date.toLocaleDateString()} (All day)`;
    }

    return 'Invalid date format';
  } catch (error) {
    console.warn('Error formatting calendar date:', error, start);
    return 'Invalid date';
  }
};

const formatTime = (timestamp: Date) => {
  return timestamp.toLocaleTimeString();
};

const showResultDetails = (result: APITestResult) => {
  $q.dialog({
    title: `${result.name} Details`,
    message: `
      <strong>Status:</strong> ${result.status}<br/>
      <strong>Message:</strong> ${result.message}<br/>
      <strong>Timestamp:</strong> ${formatTime(result.timestamp)}<br/>
      <strong>Details:</strong><br/>
      <pre>${JSON.stringify(result.details, null, 2)}</pre>
    `,
    html: true,
    ok: 'Close'
  });
};

const clearActivityLog = () => {
  activityLog.value = [];
  showNotification({
    type: 'info',
    message: 'Activity log cleared',
    position: 'top'
  });
};

// Manual calendar functions
const setManualCalendar = () => {
  if (manualCalendarId.value) {
    selectedCalendarId.value = manualCalendarId.value;
    addLog(`Calendar set to: ${manualCalendarId.value}`, 'purple', 'event');
    showNotification({
      type: 'positive',
      message: `Calendar target updated to: ${manualCalendarId.value}`,
      position: 'top'
    });
  }
};

const setTtgamingCalendar = () => {
  const ttgamingCalendarId = 'cf4f155a3c69597b84acfb7ac13cda167375de8bf6c83f34da2f9de64684867e@group.calendar.google.com';
  selectedCalendarId.value = ttgamingCalendarId;
  manualCalendarId.value = ttgamingCalendarId;
  addLog('Calendar set to: ttgaming shared calendar', 'purple', 'event');
  showNotification({
    type: 'positive',
    message: 'Calendar target updated to ttgaming shared calendar',
    position: 'top'
  });
};

const setPersonalCalendar = () => {
  selectedCalendarId.value = 'primary';
  manualCalendarId.value = 'primary';
  addLog('Calendar set to: Personal Calendar (Primary)', 'green', 'person');
  showNotification({
    type: 'positive',
    message: 'Calendar target updated to your personal calendar',
    position: 'top'
  });
};

// Theme toggle function
const toggleTheme = () => {
  $q.dark.toggle();
  const newMode = $q.dark.isActive ? 'dark' : 'light';
  addLog(`Theme switched to ${newMode} mode`, 'purple', $q.dark.isActive ? 'dark_mode' : 'light_mode');
};

// Setup real-time listeners
const setupRealtimeListeners = () => {
  // Clean up existing listener first
  if (testDocsUnsubscribe) {
    testDocsUnsubscribe();
    testDocsUnsubscribe = null;
  }

  // Only setup listeners if user is authenticated
  if (!currentUser.value) {
    return;
  }

  // Listen to test documents changes
  try {
    const q = query(collection(db, 'testDocuments'), orderBy('createdAt', 'desc'));
    testDocsUnsubscribe = onSnapshot(q, (snapshot) => {
      testDocuments.value = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as TestDocument));

      if (!snapshot.metadata.fromCache) {
        addLog(`Real-time update: ${testDocuments.value.length} test documents`, 'info', 'sync');
      }
    }, (error) => {
      // Handle permission errors gracefully
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for Firestore listener, user may have signed out');
        addLog('Real-time listener permission denied - user may need to re-authenticate', 'orange', 'warning');
      } else {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        addLog(`Real-time listener error: ${message}`, 'red', 'error');
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`Failed to setup real-time listener: ${message}`, 'red', 'error');
  }
};

// Games Migration Functions
const runGamesMigration = () => {
  migrationLoading.value = true;
  migrationResult.value = null;

  try {
    addLog('🎮 Starting games migration to Firebase...', 'blue', 'cloud_upload');
    const result = gameMigrationService.migrateGamesToFirebase($q);
    migrationResult.value = result;

    if (result.errors.length === 0) {
      addLog(`✅ Games migration completed successfully! ${result.successful} games migrated.`, 'green', 'check_circle');
      showNotification({
        type: 'positive',
        message: `Successfully migrated ${result.successful} games to Firebase with image support!`,
        position: 'top'
      });
    } else {
      addLog(`⚠️ Games migration completed with ${result.errors.length} errors. ${result.successful} games migrated successfully.`, 'orange', 'warning');
      showNotification({
        type: 'warning',
        message: `Migration completed with some errors. ${result.successful} games migrated successfully.`,
        position: 'top'
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`❌ Games migration failed: ${message}`, 'red', 'error');
    showNotification({
      type: 'negative',
      message: 'Games migration failed. Check activity log for details.',
      position: 'top'
    });
  } finally {
    migrationLoading.value = false;
  }
};

const clearAllGames = () => {
  migrationLoading.value = true;

  try {
    addLog('🗑️ Clearing all games from Firebase...', 'orange', 'delete_forever');
    gameMigrationService.clearAllGames($q);
    migrationResult.value = null;

    addLog('✅ All games cleared from Firebase successfully!', 'green', 'check_circle');
    showNotification({
      type: 'positive',
      message: 'All games cleared from Firebase successfully!',
      position: 'top'
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    addLog(`❌ Failed to clear games: ${message}`, 'red', 'error');
    showNotification({
      type: 'negative',
      message: 'Failed to clear games. Check activity log for details.',
      position: 'top'
    });
  } finally {
    migrationLoading.value = false;
  }
};

// Watch for calendar selection changes
watch(selectedCalendarId, (newCalendarId) => {
  googleCalendarService.setCalendarId(newCalendarId);
  addLog(`Calendar target changed to: ${getSelectedCalendarName()}`, 'blue', 'swap_horiz');
}, { immediate: true });

// Lifecycle
onMounted(() => {
  addLog('Testing Dashboard initialized', 'green', 'dashboard');
  void loadTestDocuments();
  setupRealtimeListeners();
});

onUnmounted(() => {
  if (testDocsUnsubscribe) {
    testDocsUnsubscribe();
  }
});
</script>

<style scoped>
.q-card {
  border-radius: 8px;
  transition: box-shadow 0.3s ease;
}

.q-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.body--dark .q-card:hover {
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
}

.text-h6 {
  color: var(--q-primary);
}

.q-chip {
  font-weight: 500;
}

/* Enhanced theme-aware colors */
.text-orange {
  color: #ff9800;
}

.body--dark .text-orange {
  color: #ffb74d;
}

/* Better contrast for captions in both themes */
.q-item-label--caption {
  opacity: 0.8;
}

/* Smooth transitions for theme changes */
* {
  transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}
</style>
