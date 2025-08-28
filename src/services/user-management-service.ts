import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  type UpdateData,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from 'src/boot/firebase';
import { Player } from 'src/models/Player';

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface UserStatus {
  id: string;
  status: 'active' | 'blocked' | 'pending' | 'suspended';
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
  expiresAt?: Date;
}

export class UserManagementService {
  private readonly USERS_COLLECTION = 'players';
  private readonly ROLES_COLLECTION = 'userRoles';
  private readonly STATUS_COLLECTION = 'userStatuses';
  private readonly AUDIT_COLLECTION = 'userAudit';

  /**
   * Create a new user with email and password
   */
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role?: string[];
    bio?: string;
  }): Promise<Player> {
    try {
      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password,
      );
      const firebaseUser = userCredential.user;

      // Update display name
      await updateProfile(firebaseUser, {
        displayName: userData.name,
      });

      // Create player profile
      const player = new Player({
        id: parseInt(firebaseUser.uid.slice(-6), 36),
        name: userData.name,
        email: userData.email,
        bio: userData.bio,
        joinDate: new Date(),
        firebaseId: firebaseUser.uid,
        status: 'active',
      });

      // Save to Firestore
      await setDoc(doc(db, this.USERS_COLLECTION, firebaseUser.uid), {
        id: player.id,
        name: player.name,
        email: player.email,
        bio: player.bio,
        joinDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Set default role if provided
      if (userData.role && userData.role.length > 0) {
        await this.setUserRole(firebaseUser.uid, {
          name: userData.role.join(', '),
          permissions: userData.role,
        });
      }

      // Set initial status
      await this.setUserStatus(firebaseUser.uid, 'active');

      // Log audit event
      await this.logAuditEvent(firebaseUser.uid, 'user_created', {
        createdBy: auth.currentUser?.uid || 'system',
        email: userData.email,
        name: userData.name,
      });

      return player;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(
        `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Update user profile information
   */
  async updateUser(
    firebaseId: string,
    updates: Partial<{
      name: string;
      email: string;
      bio: string;
    }>,
  ): Promise<void> {
    try {
      const updateData: UpdateData<Record<string, unknown>> = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, this.USERS_COLLECTION, firebaseId), updateData);

      // Log audit event
      await this.logAuditEvent(firebaseId, 'user_updated', {
        updatedBy: auth.currentUser?.uid || 'system',
        changes: updates,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(
        `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Set user role and permissions
   */
  async setUserRole(
    firebaseId: string,
    role: {
      name: string;
      permissions: string[];
    },
  ): Promise<void> {
    try {
      const roleData: Omit<UserRole, 'id'> = {
        name: role.name,
        permissions: role.permissions,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: auth.currentUser?.uid || 'system',
      };

      await setDoc(doc(db, this.ROLES_COLLECTION, firebaseId), roleData);

      // Log audit event
      await this.logAuditEvent(firebaseId, 'role_updated', {
        updatedBy: auth.currentUser?.uid || 'system',
        role: role.name,
        permissions: role.permissions,
      });
    } catch (error) {
      console.error('Error setting user role:', error);
      throw new Error(
        `Failed to set user role: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Set user status (active, blocked, suspended, etc.)
   */
  async setUserStatus(
    firebaseId: string,
    status: UserStatus['status'],
    reason?: string,
    expiresAt?: Date,
  ): Promise<void> {
    try {
      const statusData: Record<string, unknown> = {
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: auth.currentUser?.uid || 'system',
      };

      if (reason) {
        statusData.reason = reason;
      }

      if (expiresAt) {
        statusData.expiresAt = expiresAt;
      }

      await setDoc(doc(db, this.STATUS_COLLECTION, firebaseId), statusData);

      // Log audit event
      await this.logAuditEvent(firebaseId, 'status_updated', {
        updatedBy: auth.currentUser?.uid || 'system',
        status,
        reason,
        expiresAt: expiresAt?.toISOString(),
      });
    } catch (error) {
      console.error('Error setting user status:', error);
      throw new Error(
        `Failed to set user status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete user completely (use with caution)
   */
  async deleteUser(firebaseId: string): Promise<void> {
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, this.USERS_COLLECTION, firebaseId));
      await deleteDoc(doc(db, this.ROLES_COLLECTION, firebaseId));
      await deleteDoc(doc(db, this.STATUS_COLLECTION, firebaseId));

      // Log audit event before potential Firebase Auth user deletion
      await this.logAuditEvent(firebaseId, 'user_deleted', {
        deletedBy: auth.currentUser?.uid || 'system',
      });

      // Note: Deleting Firebase Auth user requires admin SDK in a cloud function
      // This can only be done from the client if the user is currently signed in
      // For admin deletion, you'll need to implement a cloud function
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(
        `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);

      // Log audit event (find user by email first)
      const usersQuery = query(collection(db, this.USERS_COLLECTION), where('email', '==', email));
      const snapshot = await getDocs(usersQuery);

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        if (userDoc) {
          await this.logAuditEvent(userDoc.id, 'password_reset_sent', {
            requestedBy: auth.currentUser?.uid || 'system',
            email,
          });
        }
      }
    } catch (error) {
      console.error('Error sending password reset:', error);
      throw new Error(
        `Failed to send password reset: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get user by Firebase ID
   */
  async getUser(firebaseId: string): Promise<Player | null> {
    try {
      const userDoc = await getDoc(doc(db, this.USERS_COLLECTION, firebaseId));

      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      return new Player({
        ...data,
        id: data.id || parseInt(firebaseId.slice(-6), 36),
        joinDate: data.joinDate?.toDate() || data.createdAt?.toDate() || new Date(),
        firebaseId,
      });
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error(
        `Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(searchTerm: string): Promise<Player[]> {
    try {
      // Firebase doesn't support full-text search natively
      // This is a basic implementation using name prefix matching
      const usersQuery = query(
        collection(db, this.USERS_COLLECTION),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        orderBy('name'),
        // limit(limit) // Uncomment if you want to limit results
      );

      const snapshot = await getDocs(usersQuery);
      const users: Player[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push(
          new Player({
            ...data,
            id: data.id || parseInt(doc.id.slice(-6), 36),
            joinDate: data.joinDate?.toDate() || data.createdAt?.toDate() || new Date(),
            firebaseId: doc.id,
          }),
        );
      });

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error(
        `Failed to search users: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Log audit events for user management actions
   */
  private async logAuditEvent(
    userId: string,
    action: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    try {
      await setDoc(doc(collection(db, this.AUDIT_COLLECTION)), {
        userId,
        action,
        details,
        timestamp: serverTimestamp(),
        performedBy: auth.currentUser?.uid || 'system',
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw here as audit logging shouldn't break the main operation
    }
  }

  /**
   * Get audit log for a user
   */
  async getUserAuditLog(userId: string): Promise<Record<string, unknown>[]> {
    try {
      const auditQuery = query(
        collection(db, this.AUDIT_COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
      );

      const snapshot = await getDocs(auditQuery);
      const auditLog: Record<string, unknown>[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        auditLog.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        });
      });

      return auditLog;
    } catch (error) {
      console.error('Error getting audit log:', error);
      throw new Error(
        `Failed to get audit log: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

// Export singleton instance
export const userManagementService = new UserManagementService();
