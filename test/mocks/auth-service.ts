import { vi } from 'vitest';

// Mock Firebase Auth functions
export const mockSignInWithPopup = vi.fn();
export const mockSignOut = vi.fn();
export const mockOnAuthStateChanged = vi.fn();
export const mockSignInWithEmailAndPassword = vi.fn();
export const mockCreateUserWithEmailAndPassword = vi.fn();
export const mockUpdateProfile = vi.fn();
export const mockGoogleAuthProvider = vi.fn();
export const mockFacebookAuthProvider = vi.fn();

// Mock Firebase Firestore functions
export const mockDoc = vi.fn();
export const mockSetDoc = vi.fn();
export const mockGetDoc = vi.fn();

export const mockAuth = {
  currentUser: null,
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
};

export const mockDb = {};

// Setup Firebase mocks
vi.mock('firebase/auth', () => ({
  signInWithPopup: mockSignInWithPopup,
  GoogleAuthProvider: mockGoogleAuthProvider,
  FacebookAuthProvider: mockFacebookAuthProvider,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  updateProfile: mockUpdateProfile,
}));

vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  setDoc: mockSetDoc,
  getDoc: mockGetDoc,
}));

vi.mock('src/boot/firebase', () => ({
  auth: mockAuth,
  db: mockDb,
}));
