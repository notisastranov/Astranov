import { OperatorCommand, OperatorCommandType, UserRole } from '../../types';
import { FIREBASE_COLLECTIONS } from '../firebase/schema';

export class OperatorCommandService {
  /**
   * Logs and processes an operator command.
   * In a real app, this would save to Firestore and trigger backend logic.
   */
  static async processCommand(
    actor: string,
    role: UserRole,
    command: string
  ): Promise<OperatorCommand> {
    const type = this.classifyCommand(command);
    
    const operatorCommand: OperatorCommand = {
      id: `cmd-${Date.now()}`,
      timestamp: Date.now(),
      actor,
      role,
      command,
      type,
      status: 'pending',
      targetArea: this.extractTargetArea(command),
    };

    console.log(`[OperatorCommandService] Processing ${type}: ${command}`);
    
    // Simulate Firestore save
    // await db.collection(FIREBASE_COLLECTIONS.OPERATOR_COMMANDS).add(operatorCommand);
    
    return operatorCommand;
  }

  private static classifyCommand(command: string): OperatorCommandType {
    const cmd = command.toLowerCase();
    if (cmd.includes('config') || cmd.includes('flag') || cmd.includes('value')) {
      return 'live_config_update';
    }
    if (cmd.includes('layout') || cmd.includes('button') || cmd.includes('radar') || cmd.includes('column')) {
      return 'ui_layout_update';
    }
    if (cmd.includes('patch') || cmd.includes('feature') || cmd.includes('fix')) {
      return 'code_patch_request';
    }
    if (cmd.includes('deploy') || cmd.includes('release') || cmd.includes('push')) {
      return 'deployment_request';
    }
    return 'live_config_update'; // Default
  }

  private static extractTargetArea(command: string): string | undefined {
    const cmd = command.toLowerCase();
    if (cmd.includes('radar')) return 'radar';
    if (cmd.includes('left')) return 'left_column';
    if (cmd.includes('right')) return 'right_column';
    if (cmd.includes('top')) return 'top_center';
    if (cmd.includes('bottom')) return 'bottom_center';
    return undefined;
  }
}
