import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { UserUILayout, HudButtonConfig } from '../types';

export class UILayoutService {
  private static COLLECTION = 'user_ui_layouts';

  static async getLayout(userId: string): Promise<UserUILayout | null> {
    try {
      const docRef = doc(db, this.COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserUILayout;
      }
      return null;
    } catch (error) {
      console.error('Error fetching UI layout:', error);
      return null;
    }
  }

  static async saveLayout(userId: string, layout: UserUILayout): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, userId);
      await setDoc(docRef, {
        ...layout,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving UI layout:', error);
    }
  }

  static async updateButton(userId: string, buttonId: string, updates: Partial<HudButtonConfig>): Promise<void> {
    try {
      const layout = await this.getLayout(userId);
      if (!layout) return;

      const updatedButtons = layout.buttons.map(b => 
        b.id === buttonId ? { ...b, ...updates } : b
      );

      await this.saveLayout(userId, { ...layout, buttons: updatedButtons });
    } catch (error) {
      console.error('Error updating HUD button:', error);
    }
  }
}
