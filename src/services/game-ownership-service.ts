import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import type { FieldValue, Timestamp } from 'firebase/firestore';
import { db } from 'src/boot/firebase';

type GameOwnershipData = {
  gameId: string;
  playerId: string;
  canBring: boolean;
  notes?: string;
  addedAt: Timestamp;
  updatedAt?: Timestamp;
};

type GameOwnershipWithId = GameOwnershipData & { id: string };

const COLLECTION_NAME = 'gameOwnerships';

export class GameOwnershipService {
  static async addOwnership(
    gameId: string,
    playerId: string,
    canBring = true,
    notes?: string,
  ): Promise<string> {
    const ownershipData: {
      gameId: string;
      playerId: string;
      canBring: boolean;
      addedAt: FieldValue;
      notes?: string;
    } = {
      gameId,
      playerId,
      canBring,
      addedAt: serverTimestamp(),
    };

    if (notes) {
      ownershipData.notes = notes;
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), ownershipData);
    return docRef.id;
  }

  static async updateOwnership(
    ownershipId: string,
    updates: { canBring?: boolean; notes?: string },
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, ownershipId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  static async removeOwnership(ownershipId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, ownershipId);
    await deleteDoc(docRef);
  }

  static subscribeToPlayerOwnerships(
    playerId: string,
    callback: (ownerships: GameOwnershipWithId[]) => void,
  ) {
    const q = query(collection(db, COLLECTION_NAME), where('playerId', '==', playerId));

    return onSnapshot(q, (snapshot) => {
      const ownerships = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as GameOwnershipData),
      }));
      callback(ownerships);
    });
  }
}
