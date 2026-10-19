/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionType, AWSService, RiskLevel, AWSExecutionPayload, ApprovalProtocolPacket } from '../utils/autonomyMatrix.ts';

export type { ActionType, AWSService, RiskLevel, AWSExecutionPayload, ApprovalProtocolPacket };

export type AutonomyMode = 'FULL_AUTO' | 'SUPERVISED' | 'DRY_RUN';

export interface AWSResource {
  id: string;
  name: string;
  service: AWSService;
  type: string;
  region: string;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'REMEDIATING' | 'RESTARTING';
  metrics: {
    cpuPercent?: number;
    memoryPercent?: number;
    diskPercent?: number;
    uptime?: string;
    trafficRps?: number;
    latencyMs?: number;
    daysUntilSslExpire?: number;
  };
  tags: Record<string, string>;
  lastAutonomousAction?: string;
  isPrimaryProd?: boolean;
  costMonthlyUSD: number;
}

export interface OperationalIncident {
  id: string;
  title: string;
  description: string;
  service: AWSService;
  resourceId: string;
  actionType: ActionType;
  timestamp: string;
  status: 'RESOLVED_AUTONOMOUSLY' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  executionPayload?: AWSExecutionPayload;
  approvalPacket?: ApprovalProtocolPacket;
}
