export type ToolPermissionScope = 'read' | 'write' | 'system' | 'network';
export type ToolRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ToolExecutionStatus =
  | 'pending'
  | 'confirmed'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'rejected';

export interface ToolManifest {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  permissionScope: ToolPermissionScope;
  riskLevel: ToolRiskLevel;
  requiresConfirmation: boolean;
  auditLog: boolean;
}

export interface ToolExecutionRecord {
  id: string;
  userId: string;
  messageId?: string;
  toolName: string;
  inputArgs: Record<string, unknown>;
  outputResult?: Record<string, unknown>;
  status: ToolExecutionStatus;
  riskLevel: ToolRiskLevel;
  userConfirmed: boolean;
  executedAt: string;
}
