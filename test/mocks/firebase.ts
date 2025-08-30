import { vi } from 'vitest';

// Mock Firebase Auth
export const mockAuth = {
  currentUser: null,
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
};

// Mock Firebase Firestore
export const mockDb = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
};

// Mock Firestore functions
export const mockFirestore = {
  collection: vi.fn(() => mockDb),
  doc: vi.fn(() => mockDb),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
};

// Mock Google Auth Provider
export const mockGoogleAuthProvider = vi.fn();

// Mock Facebook Auth Provider
export const mockFacebookAuthProvider = vi.fn();

// Firebase mock setup
vi.mock('firebase/auth', () => ({
  getAuth: () => mockAuth,
  signInWithPopup: mockAuth.signInWithPopup,
  signOut: mockAuth.signOut,
  onAuthStateChanged: mockAuth.onAuthStateChanged,
  signInWithEmailAndPassword: mockAuth.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockAuth.createUserWithEmailAndPassword,
  updateProfile: mockAuth.updateProfile,
  GoogleAuthProvider: mockGoogleAuthProvider,
  FacebookAuthProvider: mockFacebookAuthProvider,
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: () => mockDb,
  collection: mockFirestore.collection,
  doc: mockFirestore.doc,
  getDocs: mockFirestore.getDocs,
  getDoc: mockFirestore.getDoc,
  setDoc: mockFirestore.setDoc,
  updateDoc: mockFirestore.updateDoc,
  deleteDoc: mockFirestore.deleteDoc,
  onSnapshot: mockFirestore.onSnapshot,
  query: mockFirestore.query,
  where: mockFirestore.where,
  orderBy: mockFirestore.orderBy,
  limit: mockFirestore.limit,
}));

vi.mock('src/boot/firebase', () => ({
  auth: mockAuth,
  db: mockDb,
}));
