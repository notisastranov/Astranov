import { UserUILayout, HudButtonConfig } from '../types';

export class UILayoutService {
  static async getLayout(userId: string): Promise<UserUILayout | null> {
    try {
      const response = await fetch(`/api/ui-layout/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch UI layout');
      return response.json();
    } catch (error) {
      console.error('Error fetching UI layout:', error);
      return null;
    }
  }

  static async saveLayout(userId: string, layout: UserUILayout): Promise<void> {
    try {
      const response = await fetch(`/api/ui-layout/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layout)
      });
      if (!response.ok) throw new Error('Failed to save UI layout');
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
