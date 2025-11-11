/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  readonly USE_FIREBASE_EMULATOR?: string | boolean;
  readonly NODE_ENV: string;
  readonly VUE_ROUTER_MODE?: 'hash' | 'history' | 'abstract';
  readonly VUE_ROUTER_BASE?: string;
  readonly GOOGLE_CLOUD_CLIENT_ID?: string;
  readonly GOOGLE_CLOUD_SECRET?: string;
  readonly SHARED_CALENDAR_ID?: string;
  readonly SHARED_CALENDAR_ENABLED?: string | boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
    USE_FIREBASE_EMULATOR: string | boolean | undefined;
    GOOGLE_CLOUD_CLIENT_ID: string | undefined;
    GOOGLE_CLOUD_SECRET: string | undefined;
    SHARED_CALENDAR_ID: string | undefined;
    SHARED_CALENDAR_ENABLED: string | boolean | undefined;
  }
}
