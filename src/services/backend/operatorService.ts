import firestore from "../../../firestore";
import { 
  OperatorCommand, 
  OperatorActionType, 
  ChangeRequest, 
  DeploymentRequest, 
  AuditLog 
} from '../../types/operational';

export class AuditLogService {
  private static logs = firestore.collection('audit_logs');

  static async log(actorId: string, action: string, status: 'success' | 'failure', details: any, targetId?: string) {
    const log: AuditLog = {
      id: this.logs.doc().id,
      actorId,
      action,
      targetId,
      status,
      details,
      timestamp: Date.now()
    };
    await this.logs.doc(log.id).set(log);
    console.log(`[Audit] ${action} by ${actorId}: ${status}`);
    return log;
  }
}

export class ConfigService {
  private static config = firestore.collection('config_store');
  private static flags = firestore.collection('feature_flags');

  static async updateConfig(key: string, value: any, operatorId: string) {
    await this.config.doc(key).set({ value, updatedAt: Date.now(), updatedBy: operatorId });
    await AuditLogService.log(operatorId, 'CONFIG_UPDATE', 'success', { key, value }, key);
    return { key, value };
  }

  static async setFeatureFlag(flag: string, enabled: boolean, operatorId: string) {
    await this.flags.doc(flag).set({ enabled, updatedAt: Date.now(), updatedBy: operatorId });
    await AuditLogService.log(operatorId, 'FEATURE_FLAG_UPDATE', 'success', { flag, enabled }, flag);
    return { flag, enabled };
  }

  static async getConfig(key: string) {
    const doc = await this.config.doc(key).get();
    return doc.data();
  }
}

export class ChangeRequestService {
  private static requests = firestore.collection('change_requests');

  static async createRequest(operatorId: string, description: string, patch?: string) {
    const request: ChangeRequest = {
      id: this.requests.doc().id,
      operatorId,
      description,
      patch,
      status: 'review',
      createdAt: Date.now()
    };
    await this.requests.doc(request.id).set(request);
    await AuditLogService.log(operatorId, 'CHANGE_REQUEST_CREATED', 'success', { description }, request.id);
    return request;
  }

  static async updateStatus(requestId: string, status: ChangeRequest['status'], operatorId: string) {
    await this.requests.doc(requestId).update({ status });
    await AuditLogService.log(operatorId, 'CHANGE_REQUEST_STATUS_UPDATE', 'success', { status }, requestId);
  }
}

export class PatchGenerationService {
  static async generatePatch(description: string) {
    // This would normally call an LLM to generate a git patch or code diff
    // For now, we simulate the generation
    return `--- a/src/App.tsx\n+++ b/src/App.tsx\n@@ -1,1 +1,1 @@\n- // ${description}\n+ // Applied: ${description}`;
  }
}

export class DeploymentRequestService {
  private static deployments = firestore.collection('deployment_requests');

  static async requestDeployment(operatorId: string, environment: 'staging' | 'production', version: string) {
    const request: DeploymentRequest = {
      id: this.deployments.doc().id,
      operatorId,
      environment,
      version,
      status: 'queued',
      createdAt: Date.now()
    };
    await this.deployments.doc(request.id).set(request);
    await AuditLogService.log(operatorId, 'DEPLOYMENT_REQUESTED', 'success', { environment, version }, request.id);
    
    // Simulate deployment process
    setTimeout(async () => {
      await this.deployments.doc(request.id).update({ status: 'success' });
      await AuditLogService.log('system', 'DEPLOYMENT_COMPLETED', 'success', { requestId: request.id });
    }, 5000);

    return request;
  }
}

export class OperatorCommandService {
  private static commands = firestore.collection('operator_commands');

  static async recordCommand(operatorId: string, rawCommand: string, action: OperatorActionType, parameters: any) {
    const command: OperatorCommand = {
      id: this.commands.doc().id,
      operatorId,
      rawCommand,
      interpretedAction: action,
      parameters,
      status: 'pending',
      timestamp: Date.now()
    };
    await this.commands.doc(command.id).set(command);
    return command;
  }

  static async updateCommandResult(commandId: string, status: OperatorCommand['status'], result?: any) {
    await this.commands.doc(commandId).update({ status, result });
  }
}
