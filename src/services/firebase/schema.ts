import { 
  OperatorCommand, 
  ChangeRequest, 
  FeatureFlag, 
  ConfigValue, 
  DeploymentRequest, 
  PatchRequest, 
  AuditLog,
  UiPreferences,
  User,
  Publication,
  Task,
  Shop
} from '../../types';

/**
 * Astranov Firebase Schema Definition
 * 
 * Collections:
 * - users: User[]
 * - profiles: User[] (Extended profile data)
 * - ui_preferences: UiPreferences[]
 * - ai_sessions: any[] (AI conversation history)
 * - operator_commands: OperatorCommand[]
 * - change_requests: ChangeRequest[]
 * - feature_flags: FeatureFlag[]
 * - config_store: ConfigValue[]
 * - deployment_requests: DeploymentRequest[]
 * - patch_requests: PatchRequest[]
 * - audit_logs: AuditLog[]
 * - tasks: Task[]
 * - shops: Shop[]
 * - publications: Publication[]
 */

export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  PROFILES: 'profiles',
  UI_PREFERENCES: 'ui_preferences',
  AI_SESSIONS: 'ai_sessions',
  OPERATOR_COMMANDS: 'operator_commands',
  CHANGE_REQUESTS: 'change_requests',
  FEATURE_FLAGS: 'feature_flags',
  CONFIG_STORE: 'config_store',
  DEPLOYMENT_REQUESTS: 'deployment_requests',
  PATCH_REQUESTS: 'patch_requests',
  REPO_SYNC_REQUESTS: 'repo_sync_requests',
  PATCH_ARTIFACTS: 'patch_artifacts',
  AUDIT_LOGS: 'audit_logs',
  TASKS: 'tasks',
  SHOPS: 'shops',
  PUBLICATIONS: 'publications',
};
