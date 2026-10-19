/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ActionType = 'AUTONOMOUS' | 'APPROVAL_REQUIRED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AWSService = 
  | 'EC2'
  | 'ECS'
  | 'EKS'
  | 'RDS'
  | 'WAF'
  | 'GuardDuty'
  | 'IAM'
  | 'VPC'
  | 'ACM'
  | 'AutoScaling'
  | 'CloudWatch'
  | 'S3';

export interface AWSExecutionPayload {
  agent_name: 'AWS AI';
  action_type: ActionType;
  service: AWSService;
  command: string;
  resource_id: string;
  reason: string;
  risk_level: RiskLevel;
  // Extended fields for telemetry & downstream dispatch
  timestamp?: string;
  execution_id?: string;
  parameters?: Record<string, any>;
  cost_delta_monthly_usd?: number;
  estimated_downtime_minutes?: number;
  cli_command?: string;
}

export interface ApprovalProtocolPacket {
  id: string;
  incident_summary: string;
  proposed_solution: string[];
  impact_assessment: {
    risk_level: RiskLevel;
    estimated_downtime: string;
    cost_impact_monthly_usd: number;
    blast_radius: string;
  };
  payload: AWSExecutionPayload;
  slack_payload: {
    channel: string;
    text: string;
    blocks: any[];
  };
  teams_payload: {
    summary: string;
    sections: any[];
    potentialActions: any[];
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface RuleDefinition {
  id: string;
  level: ActionType;
  category: string;
  title: string;
  description: string;
  keywords: string[];
  service: AWSService;
  defaultRisk: RiskLevel;
}

export const AUTONOMY_MATRIX_RULES: RuleDefinition[] = [
  // 1. FULL AUTONOMY LEVEL
  {
    id: 'AUTO-SCALE-01',
    level: 'AUTONOMOUS',
    category: 'Compute Elasticity',
    title: 'Scale EC2/ECS/EKS Capacity',
    description: 'Scaling EC2/ECS/EKS capacity up or down based on load thresholds.',
    keywords: ['scale up', 'scale down', 'autoscale', 'capacity', 'ecs task count', 'eks replica', 'high cpu load', 'traffic spike'],
    service: 'AutoScaling',
    defaultRisk: 'LOW',
  },
  {
    id: 'AUTO-RESTART-02',
    level: 'AUTONOMOUS',
    category: 'Process Self-Healing',
    title: 'Restart Crashed Containers / Services',
    description: 'Restarting crashed Docker containers or failed systemd services.',
    keywords: ['crashloopbackoff', 'container exited', 'crashed container', 'failed systemd', 'restart docker', 'reboot container', 'service restart'],
    service: 'ECS',
    defaultRisk: 'LOW',
  },
  {
    id: 'AUTO-SSL-03',
    level: 'AUTONOMOUS',
    category: 'Certificate Management',
    title: 'Rotate Ephemeral SSL Certificates',
    description: 'Rotating ephemeral SSL certificates near expiration.',
    keywords: ['ssl certificate', 'acm cert renewal', 'rotate tls', 'expiring certificate', 'certbot renewal', 'ssl near expiration'],
    service: 'ACM',
    defaultRisk: 'LOW',
  },
  {
    id: 'AUTO-DISK-04',
    level: 'AUTONOMOUS',
    category: 'Storage Remediation',
    title: 'Clear Disk & Logs (> 85% usage)',
    description: 'Clearing temporary disk space, logs, and cache when disk usage exceeds 85%.',
    keywords: ['disk usage exceeds 85%', 'disk 88%', 'disk 90%', 'disk 95%', 'disk 92%', 'clear temp logs', 'purge cache', 'disk full', 'clean /var/log'],
    service: 'EC2',
    defaultRisk: 'LOW',
  },
  {
    id: 'AUTO-SEC-05',
    level: 'AUTONOMOUS',
    category: 'Threat Defense',
    title: 'Block Malicious IPs (WAF / GuardDuty)',
    description: 'Blocking malicious IPs identified by AWS WAF or GuardDuty.',
    keywords: ['block ip', 'guardduty malicious', 'brute force', 'ddos attack', 'waf ip set', 'sql injection ip', 'port scanner'],
    service: 'WAF',
    defaultRisk: 'LOW',
  },

  // 2. CONDITIONAL APPROVAL LEVEL
  {
    id: 'APPR-PROD-TERM-01',
    level: 'APPROVAL_REQUIRED',
    category: 'Production Lifecycle',
    title: 'Terminate / Shutdown Primary Production Instances',
    description: 'Terminating or shutting down primary production EC2/RDS instances.',
    keywords: ['terminate production', 'terminate primary ec2', 'shutdown prod', 'delete rds master', 'stop production instance', 'stop primary'],
    service: 'EC2',
    defaultRisk: 'CRITICAL',
  },
  {
    id: 'APPR-NET-IAM-02',
    level: 'APPROVAL_REQUIRED',
    category: 'Access & Network Boundary',
    title: 'Modify IAM Policies, SGs, or NACLs',
    description: 'Modifying IAM policies, security groups, or network ACLs.',
    keywords: ['modify iam', 'attach policy', 'allow 0.0.0.0/0', 'security group rule', 'network acl', 'iam role change', 'open port 22'],
    service: 'IAM',
    defaultRisk: 'HIGH',
  },
  {
    id: 'APPR-DB-MIG-03',
    level: 'APPROVAL_REQUIRED',
    category: 'Data Integrity',
    title: 'Database Schema Migrations / Failover',
    description: 'Database schema migrations, snapshot restorations, or primary region failovers.',
    keywords: ['schema migration', 'snapshot restoration', 'rds restore', 'region failover', 'aurora failover', 'disaster recovery promote'],
    service: 'RDS',
    defaultRisk: 'HIGH',
  },
  {
    id: 'APPR-COST-04',
    level: 'APPROVAL_REQUIRED',
    category: 'FinOps Governance',
    title: 'Spend Increase > $100 / Month',
    description: 'Any single action that increases total monthly AWS spend by > $100.',
    keywords: ['spend > $100', 'increase spend', 'cost spike', 'spin up 10 instances', 'gpu instance p4d', 'provisioned iops +150', 'upgrade instance size'],
    service: 'CloudWatch',
    defaultRisk: 'MEDIUM',
  },
  {
    id: 'APPR-UPGRADE-05',
    level: 'APPROVAL_REQUIRED',
    category: 'Platform Lifecycle',
    title: 'Upgrade Production DB or Kubernetes Versions',
    description: 'Upgrading production database engines or Kubernetes cluster versions.',
    keywords: ['upgrade postgres', 'upgrade mysql engine', 'upgrade eks 1.30', 'kubernetes cluster upgrade', 'aurora version bump', 'major engine upgrade'],
    service: 'EKS',
    defaultRisk: 'HIGH',
  },
];

/**
 * Classifies an incident, task or instruction according to the AWS AI Autonomy Matrix.
 */
export function evaluateAutonomyRule(input: {
  text: string;
  service?: AWSService;
  isProduction?: boolean;
  costDeltaMonthly?: number;
  diskUsagePercent?: number;
}): {
  actionType: ActionType;
  matchedRule: RuleDefinition;
  reason: string;
  riskLevel: RiskLevel;
} {
  const normalized = input.text.toLowerCase();

  // Rule: Monthly spend > $100 requires approval
  if (input.costDeltaMonthly !== undefined && input.costDeltaMonthly > 100) {
    const rule = AUTONOMY_MATRIX_RULES.find(r => r.id === 'APPR-COST-04')!;
    return {
      actionType: 'APPROVAL_REQUIRED',
      matchedRule: rule,
      reason: `Action results in estimated +$${input.costDeltaMonthly.toFixed(2)}/mo increase, exceeding the $100 threshold limit.`,
      riskLevel: 'MEDIUM',
    };
  }

  // Check Level 2 Conditional Approval criteria first (Safety Precedence)
  // 1. Terminate or shut down primary production EC2/RDS
  if (
    (normalized.includes('terminate') || normalized.includes('shut down') || normalized.includes('shutdown') || normalized.includes('delete') || normalized.includes('stop')) &&
    (normalized.includes('prod') || normalized.includes('primary') || normalized.includes('master') || input.isProduction) &&
    (normalized.includes('ec2') || normalized.includes('rds') || normalized.includes('instance') || normalized.includes('database'))
  ) {
    const rule = AUTONOMY_MATRIX_RULES.find(r => r.id === 'APPR-PROD-TERM-01')!;
    return {
      actionType: 'APPROVAL_REQUIRED',
      matchedRule: rule,
      reason: 'Terminating or shutting down primary production compute/database instances requires human review and impact signoff.',
      riskLevel: 'CRITICAL',
    };
  }

  // 2. Modifying IAM policies, security groups, or network ACLs
  if (
    normalized.includes('iam') ||
    normalized.includes('security group') ||
    normalized.includes('sg-') ||
    normalized.includes('nacl') ||
    normalized.includes('network acl') ||
    normalized.includes('policy') ||
    normalized.includes('authorize-security-group') ||
    normalized.includes('open port')
  ) {
    const rule = AUTONOMY_MATRIX_RULES.find(r => r.id === 'APPR-NET-IAM-02')!;
    return {
      actionType: 'APPROVAL_REQUIRED',
      matchedRule: rule,
      reason: 'Modifications to IAM policies, Security Groups, or Network ACLs alter network attack surface and access boundaries.',
      riskLevel: 'HIGH',
    };
  }

  // 3. Database schema migrations, snapshot restorations, or primary region failovers
  if (
    normalized.includes('migration') ||
    normalized.includes('schema') ||
    normalized.includes('snapshot restore') ||
    normalized.includes('restore-db') ||
    normalized.includes('failover') ||
    normalized.includes('dr failover') ||
    normalized.includes('region failover')
  ) {
    const rule = AUTONOMY_MATRIX_RULES.find(r => r.id === 'APPR-DB-MIG-03')!;
    return {
      actionType: 'APPROVAL_REQUIRED',
      matchedRule: rule,
      reason: 'Database schema migration, snapshot restore, or primary region failover carries risk of state drift, locks, or split-brain.',
      riskLevel: 'HIGH',
    };
  }

  // 5. Upgrading production database engines or Kubernetes cluster versions
  if (
    (normalized.includes('upgrade') || normalized.includes('version bump') || normalized.includes('major engine')) &&
    (normalized.includes('database') || normalized.includes('rds') || normalized.includes('aurora') || normalized.includes('postgres') || normalized.includes('mysql') || normalized.includes('eks') || normalized.includes('kubernetes') || normalized.includes('cluster'))
  ) {
    const rule = AUTONOMY_MATRIX_RULES.find(r => r.id === 'APPR-UPGRADE-05')!;
    return {
      actionType: 'APPROVAL_REQUIRED',
      matchedRule: rule,
      reason: 'Upgrading database engine or Kubernetes cluster version requires scheduled maintenance window and compatibility verification.',
      riskLevel: 'HIGH',
    };
  }

  // Level 1 FULL AUTONOMY rules
  // Disk usage > 85%
  if (
    (input.diskUsagePercent !== undefined && input.diskUsagePercent > 85) ||
    normalized.includes('disk') && (normalized.includes('> 85%') || normalized.includes('85%') || normalized.includes('90%') || normalized.includes('95%') || normalized.includes('exceeds 85%') || normalized.includes('clear temp') || normalized.includes('disk usage'))
  ) {
    const rule = AUTONOMY_MATRIX_RULES.find(r => r.id === 'AUTO-DISK-04')!;
    return {
      actionType: 'AUTONOMOUS',
      matchedRule: rule,
      reason: 'Disk usage exceeds 85% threshold; autonomous cleanup of temporary files, rotated logs, and cache executed.',
      riskLevel: 'LOW',
    };
  }

  // Malicious IP blocking via WAF or GuardDuty
  if (
    normalized.includes('guardduty') ||
    normalized.includes('malicious ip') ||
    normalized.includes('waf') ||
    normalized.includes('block ip') ||
    normalized.includes('brute force') ||
    normalized.includes('ddos')
  ) {
    const rule = AUTONOMY_MATRIX_RULES.find(r => r.id === 'AUTO-SEC-05')!;
    return {
      actionType: 'AUTONOMOUS',
      matchedRule: rule,
      reason: 'Malicious threat telemetry flagged by AWS WAF / GuardDuty; IP added to automated perimeter blocklist.',
      riskLevel: 'LOW',
    };
  }

  // Restart crashed docker containers or systemd services
  if (
    normalized.includes('crashed') ||
    normalized.includes('crashloop') ||
    normalized.includes('failed systemd') ||
    normalized.includes('restart docker') ||
    normalized.includes('container exited') ||
    normalized.includes('unhealthy container')
  ) {
    const rule = AUTONOMY_MATRIX_RULES.find(r => r.id === 'AUTO-RESTART-02')!;
    return {
      actionType: 'AUTONOMOUS',
      matchedRule: rule,
      reason: 'Application container or systemd daemon failed health check; automated reboot executed to restore uptime.',
      riskLevel: 'LOW',
    };
  }

  // Rotate ephemeral SSL certs
  if (
    normalized.includes('ssl') ||
    normalized.includes('certificate') ||
    normalized.includes('tls') ||
    normalized.includes('acm')
  ) {
    const rule = AUTONOMY_MATRIX_RULES.find(r => r.id === 'AUTO-SSL-03')!;
    return {
      actionType: 'AUTONOMOUS',
      matchedRule: rule,
      reason: 'Ephemeral SSL certificate near expiration window; automated ACME / ACM reissue & deployment initiated.',
      riskLevel: 'LOW',
    };
  }

  // Scale EC2/ECS/EKS capacity
  if (
    normalized.includes('scale') ||
    normalized.includes('capacity') ||
    normalized.includes('replica') ||
    normalized.includes('cpu load') ||
    normalized.includes('high latency') ||
    normalized.includes('traffic spike')
  ) {
    const rule = AUTONOMY_MATRIX_RULES.find(r => r.id === 'AUTO-SCALE-01')!;
    return {
      actionType: 'AUTONOMOUS',
      matchedRule: rule,
      reason: 'Workload demand crossed target threshold; AutoScaling desired count adjusted automatically.',
      riskLevel: 'LOW',
    };
  }

  // Default fallback based on risk/keywords
  return {
    actionType: 'AUTONOMOUS',
    matchedRule: AUTONOMY_MATRIX_RULES[0],
    reason: 'Operational task qualifies under standard self-healing parameters.',
    riskLevel: 'LOW',
  };
}

/**
 * Creates the exact structured JSON execution format specified in the user prompt:
 * ```json
 * {
 *   "agent_name": "AWS AI",
 *   "action_type": "AUTONOMOUS | APPROVAL_REQUIRED",
 *   "service": "EC2",
 *   "command": "RebootInstances",
 *   "resource_id": "i-0a1b2c3d4e5f6g7h8",
 *   "reason": "CPU utilization exceeded 98% for 15 minutes; non-responsive health check.",
 *   "risk_level": "LOW"
 * }
 * ```
 */
export function buildExecutionPayload(input: {
  actionType: ActionType;
  service: AWSService;
  command: string;
  resourceId: string;
  reason: string;
  riskLevel: RiskLevel;
  costDeltaMonthly?: number;
  downtimeMinutes?: number;
  parameters?: Record<string, any>;
}): AWSExecutionPayload {
  return {
    agent_name: 'AWS AI',
    action_type: input.actionType,
    service: input.service,
    command: input.command,
    resource_id: input.resourceId,
    reason: input.reason,
    risk_level: input.riskLevel,
    timestamp: new Date().toISOString(),
    execution_id: `exec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    cost_delta_monthly_usd: input.costDeltaMonthly ?? 0,
    estimated_downtime_minutes: input.downtimeMinutes ?? 0,
    parameters: input.parameters,
    cli_command: generateAWSCLIEquivalent(input.service, input.command, input.resourceId, input.parameters),
  };
}

/**
 * Creates human-executable AWS CLI equivalent command for downstream engineers / audit logs.
 */
export function generateAWSCLIEquivalent(
  service: AWSService,
  command: string,
  resourceId: string,
  parameters?: Record<string, any>
): string {
  switch (service) {
    case 'EC2':
      if (command === 'RebootInstances') return `aws ec2 reboot-instances --instance-ids ${resourceId}`;
      if (command === 'TerminateInstances') return `aws ec2 terminate-instances --instance-ids ${resourceId}`;
      if (command === 'StopInstances') return `aws ec2 stop-instances --instance-ids ${resourceId}`;
      return `aws ec2 ${command.toLowerCase()} --instance-id ${resourceId}`;
    case 'RDS':
      if (command === 'FailoverDBCluster') return `aws rds failover-db-cluster --db-cluster-identifier ${resourceId}`;
      if (command === 'ModifyDBInstance') return `aws rds modify-db-instance --db-instance-identifier ${resourceId} --apply-immediately`;
      if (command === 'DeleteDBInstance') return `aws rds delete-db-instance --db-instance-identifier ${resourceId} --skip-final-snapshot`;
      return `aws rds ${command.toLowerCase()} --db-instance-identifier ${resourceId}`;
    case 'WAF':
      return `aws wafv2 update-ip-set --name ${resourceId} --scope CLOUDFRONT --addresses '["${parameters?.ip || '198.51.100.42/32'}"]'`;
    case 'AutoScaling':
      return `aws autoscaling set-desired-capacity --auto-scaling-group-name ${resourceId} --desired-capacity ${parameters?.desiredCapacity ?? 4}`;
    case 'ECS':
      return `aws ecs update-service --cluster ${parameters?.cluster || 'prod-core'} --service ${resourceId} --force-new-deployment`;
    case 'ACM':
      return `aws acm renew-certificate --certificate-arn ${resourceId}`;
    case 'IAM':
      return `aws iam put-role-policy --role-name ${resourceId} --policy-name CustomBoundary --policy-document file://policy.json`;
    case 'EKS':
      return `aws eks update-cluster-version --name ${resourceId} --kubernetes-version ${parameters?.version || '1.31'}`;
    default:
      return `aws ${service.toLowerCase()} ${command.toLowerCase()} --resource-id ${resourceId}`;
  }
}

/**
 * Formats structured Approval Protocol Packet according to the user specification:
 * - Incident / Task Summary
 * - Proposed Solution (step-by-step)
 * - Impact Assessment (Risk level, estimated downtime, cost impact)
 * - Approval Buttons / Payload (Slack/Teams/Dashboard integration)
 */
export function buildApprovalPacket(
  payload: AWSExecutionPayload,
  summary: string,
  solutionSteps: string[],
  impact: {
    riskLevel: RiskLevel;
    estimatedDowntime: string;
    costImpactMonthlyUSD: number;
    blastRadius: string;
  }
): ApprovalProtocolPacket {
  const packetId = `appr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  
  const slackPayload = {
    channel: '#aws-ops-approvals',
    text: `🚨 AWS AI Approval Required: ${summary}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `🚨 AWS AI Approval Request: ${payload.service} ${payload.command}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Resource:* \`${payload.resource_id}\`` },
          { type: 'mrkdwn', text: `*Risk Level:* *${impact.riskLevel}*` },
          { type: 'mrkdwn', text: `*Est. Downtime:* ${impact.estimatedDowntime}` },
          { type: 'mrkdwn', text: `*Cost Impact:* ${impact.costImpactMonthlyUSD >= 0 ? '+' : ''}$${impact.costImpactMonthlyUSD.toFixed(2)}/mo` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Incident / Task Summary:*\n${summary}\n\n*Proposed Solution Steps:*\n${solutionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Approve & Execute' },
            style: 'primary',
            value: `approve_${packetId}`,
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Reject / Abort' },
            style: 'danger',
            value: `reject_${packetId}`,
          },
        ],
      },
    ],
  };

  const teamsPayload = {
    summary: `AWS AI Governance Request: ${summary}`,
    sections: [
      {
        activityTitle: `AWS AI Approval Required: ${payload.service} - ${payload.command}`,
        activitySubtitle: `Resource: ${payload.resource_id} | Risk: ${impact.riskLevel}`,
        facts: [
          { name: 'Downtime', value: impact.estimatedDowntime },
          { name: 'Monthly Cost Delta', value: `$${impact.costImpactMonthlyUSD.toFixed(2)}` },
          { name: 'Blast Radius', value: impact.blastRadius },
        ],
        text: `**Summary:** ${summary}\n\n**Steps:**\n${solutionSteps.map(s => `- ${s}`).join('\n')}`,
      },
    ],
    potentialActions: [
      {
        '@type': 'ActionCard',
        name: 'Approve & Execute Action',
        actions: [{ '@type': 'HttpPOST', name: 'Confirm Approval', target: `/api/aws-ai/approvals/${packetId}/approve` }],
      },
      {
        '@type': 'ActionCard',
        name: 'Reject',
        actions: [{ '@type': 'HttpPOST', name: 'Reject Request', target: `/api/aws-ai/approvals/${packetId}/reject` }],
      },
    ],
  };

  return {
    id: packetId,
    incident_summary: summary,
    proposed_solution: solutionSteps,
    impact_assessment: {
      risk_level: impact.riskLevel,
      estimated_downtime: impact.estimatedDowntime,
      cost_impact_monthly_usd: impact.costImpactMonthlyUSD,
      blast_radius: impact.blastRadius,
    },
    payload,
    slack_payload: slackPayload,
    teams_payload: teamsPayload,
    status: 'PENDING',
    created_at: new Date().toISOString(),
  };
}
