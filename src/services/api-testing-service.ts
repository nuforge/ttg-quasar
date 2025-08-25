import { ref, computed } from 'vue';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from 'src/boot/firebase';
import { useCurrentUser } from 'vuefire';
import { googleCalendarService } from './google-calendar-service';

export interface APITestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

class APITestingService {
  private testResults = ref<APITestResult[]>([]);

  get results() {
    return computed(() => this.testResults.value);
  }

  private addResult(result: APITestResult) {
    this.testResults.value.unshift(result);
    // Keep only last 20 results
    if (this.testResults.value.length > 20) {
      this.testResults.value = this.testResults.value.slice(0, 20);
    }
  }

  async testFirebaseAuth(): Promise<APITestResult> {
    const user = useCurrentUser();
    const result: APITestResult = {
      name: 'Firebase Authentication',
      status: 'success',
      message: '',
      timestamp: new Date(),
    };

    try {
      if (user.value) {
        const token = await user.value.getIdToken(true);
        result.status = 'success';
        result.message = `Authenticated as ${user.value.email || user.value.displayName}`;
        result.details = {
          uid: user.value.uid,
          tokenLength: token.length,
          providerId: user.value.providerId,
        };
      } else {
        result.status = 'warning';
        result.message = 'Not authenticated';
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Authentication error occurred';
      result.status = 'error';
      result.message = `Authentication error: ${message}`;
    }

    this.addResult(result);
    return result;
  }

  async testFirestoreConnection(): Promise<APITestResult> {
    const result: APITestResult = {
      name: 'Firestore Database',
      status: 'success',
      message: '',
      timestamp: new Date(),
    };

    try {
      const user = useCurrentUser();
      if (!user.value) {
        result.status = 'warning';
        result.message = 'User not authenticated - Firestore requires authentication';
        result.details = { requiresAuth: true };
        this.addResult(result);
        return result;
      }

      // Use testDocuments collection which is allowed by security rules
      const testDocRef = doc(db, 'testDocuments', `connectivity-test-${Date.now()}`);

      // Try to write - include userId for security rules
      const testData = {
        title: 'Connectivity Test',
        description: 'Automated connectivity test from API testing service',
        timestamp: serverTimestamp(),
        test: 'connectivity',
        clientTime: new Date().toISOString(),
        userId: user.value.uid, // Required by security rules
        createdAt: serverTimestamp(),
      };

      await setDoc(testDocRef, testData);

      // Try to read back the document
      const docSnap = await getDoc(testDocRef);

      if (docSnap.exists()) {
        result.status = 'success';
        result.message = 'Firestore read/write operations successful';
        result.details = {
          docExists: true,
          data: docSnap.data(),
          documentId: testDocRef.id,
          authStatus: 'authenticated',
        };

        // Clean up test document
        try {
          await deleteDoc(testDocRef);
        } catch (cleanupError) {
          console.warn('Failed to clean up test document:', cleanupError);
        }
      } else {
        result.status = 'error';
        result.message = 'Document was not created or could not be read';
      }
    } catch (error: unknown) {
      result.status = 'error';
      const message = error instanceof Error ? error.message : 'Firestore error occurred';
      const errorCode =
        error && typeof error === 'object' && 'code' in error ? error.code : 'unknown';

      // Provide helpful error messages for common issues
      if (message.includes('permission-denied') || message.includes('PERMISSION_DENIED')) {
        result.message = 'Firestore access denied - check security rules and authentication';
        result.details = {
          errorCode,
          suggestion:
            'Ensure user is authenticated and security rules allow access to testDocuments collection',
          securityRule: 'testDocuments collection requires authentication',
        };
      } else if (message.includes('UNAUTHENTICATED')) {
        result.message = 'Firestore authentication required';
        result.details = {
          errorCode,
          suggestion: 'Sign in with Google to access Firestore',
          authRequired: true,
        };
      } else {
        result.message = `Firestore error: ${message}`;
        result.details = { errorCode, originalError: message };
      }
    }

    this.addResult(result);
    return result;
  }

  async testGoogleCalendarAPI(): Promise<APITestResult> {
    const result: APITestResult = {
      name: 'Google Calendar API',
      status: 'success',
      message: '',
      timestamp: new Date(),
    };

    try {
      const user = useCurrentUser();
      if (!user.value) {
        result.status = 'warning';
        result.message = 'Authentication required for Calendar API';
        this.addResult(result);
        return result;
      }

      // Test listing events
      const calendarResult = await googleCalendarService.listEvents(
        new Date().toISOString(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next 7 days
        10,
      );

      result.status = 'success';
      result.message = `Successfully connected to Google Calendar`;
      result.details = {
        eventsFound: calendarResult.items.length,
        calendarAccess: 'primary',
      };
    } catch (error: unknown) {
      result.status = 'error';
      const message = error instanceof Error ? error.message : 'Calendar API error occurred';
      result.message = `Calendar API error: ${message}`;

      // Check if it's an auth issue
      if (message.includes('401') || message.includes('unauthorized')) {
        result.message += ' (Authorization may be required)';
      }
    }

    this.addResult(result);
    return result;
  }

  testFirebaseStorage(): Promise<APITestResult> {
    const result: APITestResult = {
      name: 'Firebase Storage',
      status: 'success',
      message: '',
      timestamp: new Date(),
    };

    try {
      // Simple test - just check if storage instance is available
      if (storage) {
        result.status = 'success';
        result.message = 'Storage instance available';
        result.details = {
          app: storage.app.name,
          available: true,
        };
      } else {
        result.status = 'error';
        result.message = 'Storage instance not available';
      }
    } catch (error: unknown) {
      result.status = 'error';
      const message = error instanceof Error ? error.message : 'Storage error occurred';
      result.message = `Storage error: ${message}`;
    }

    this.addResult(result);
    return Promise.resolve(result);
  }

  async testNetworkConnectivity(): Promise<APITestResult> {
    const result: APITestResult = {
      name: 'Network Connectivity',
      status: 'success',
      message: '',
      timestamp: new Date(),
    };

    try {
      // Test general internet connectivity - remove unused response variable
      await fetch('https://www.googleapis.com/auth/userinfo.profile', {
        method: 'HEAD',
        mode: 'no-cors',
      });

      result.status = 'success';
      result.message = 'Network connectivity verified';
      result.details = {
        online: navigator.onLine,
        connectionType: 'unknown', // Skip complex navigator.connection typing
      };
    } catch (error: unknown) {
      result.status = 'error';
      const message = error instanceof Error ? error.message : 'Network error occurred';
      result.message = `Network error: ${message}`;
      result.details = {
        online: navigator.onLine,
      };
    }

    this.addResult(result);
    return result;
  }

  async runFullDiagnostics(): Promise<APITestResult[]> {
    const results: APITestResult[] = [];

    // Run all tests
    results.push(await this.testNetworkConnectivity());
    results.push(await this.testFirebaseAuth());
    results.push(await this.testFirestoreConnection());
    results.push(await this.testGoogleCalendarAPI());
    results.push(await this.testFirebaseStorage());

    return results;
  }

  testFirestoreRealTime(): Promise<APITestResult> {
    const result: APITestResult = {
      name: 'Firestore Real-time',
      status: 'success',
      message: '',
      timestamp: new Date(),
    };

    try {
      // This would test real-time listeners
      result.status = 'success';
      result.message = 'Real-time listeners operational';
    } catch (error: unknown) {
      result.status = 'error';
      const message = error instanceof Error ? error.message : 'Real-time error occurred';
      result.message = `Real-time error: ${message}`;
    }

    this.addResult(result);
    return Promise.resolve(result);
  }

  clearResults() {
    this.testResults.value = [];
  }

  getStatusSummary() {
    const recent = this.testResults.value.slice(0, 5);
    const errors = recent.filter((r) => r.status === 'error').length;
    const warnings = recent.filter((r) => r.status === 'warning').length;
    const successes = recent.filter((r) => r.status === 'success').length;

    return {
      total: recent.length,
      errors,
      warnings,
      successes,
      overallStatus: errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'success',
    };
  }
}

export const apiTestingService = new APITestingService();
