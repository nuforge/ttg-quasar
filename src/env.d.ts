declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
    USE_FIREBASE_EMULATOR: string | boolean | undefined;
    FIREBASE_API_KEY: string | undefined;
    FIREBASE_AUTH_DOMAIN: string | undefined;
    FIREBASE_PROJECT_ID: string | undefined;
    FIREBASE_STORAGE_BUCKET: string | undefined;
    FIREBASE_MESSAGING_SENDER_ID: string | undefined;
    FIREBASE_APP_ID: string | undefined;
    GOOGLE_CLOUD_CLIENT_ID: string | undefined;
    GOOGLE_CLOUD_SECRET: string | undefined;
    SHARED_CALENDAR_ID: string | undefined;
    SHARED_CALENDAR_ENABLED: string | boolean | undefined;
  }
}
