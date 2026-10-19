import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateAutonomyRule,
  buildExecutionPayload,
  buildApprovalPacket,
  AUTONOMY_MATRIX_RULES,
} from './autonomyMatrix.ts';

test('Autonomy Matrix defines all required Level 1 and Level 2 rules', () => {
  const autoRules = AUTONOMY_MATRIX_RULES.filter(r => r.level === 'AUTONOMOUS');
  const approvalRules = AUTONOMY_MATRIX_RULES.filter(r => r.level === 'APPROVAL_REQUIRED');

  assert.equal(autoRules.length, 5, 'Should have 5 full autonomy rules');
  assert.equal(approvalRules.length, 5, 'Should have 5 conditional approval rules');
});

test('Level 1: High disk usage (>85%) triggers AUTONOMOUS cleanup', () => {
  const result = evaluateAutonomyRule({
    text: 'Disk usage on /var/log exceeds 89% on i-09823f',
    diskUsagePercent: 89,
  });

  assert.equal(result.actionType, 'AUTONOMOUS');
  assert.equal(result.matchedRule.id, 'AUTO-DISK-04');
  assert.equal(result.riskLevel, 'LOW');
});

test('Level 1: Malicious IP detected by GuardDuty triggers AUTONOMOUS block', () => {
  const result = evaluateAutonomyRule({
    text: 'GuardDuty identified malicious brute-force attempts from IP 198.51.100.42 to ALB',
  });

  assert.equal(result.actionType, 'AUTONOMOUS');
  assert.equal(result.matchedRule.id, 'AUTO-SEC-05');
  assert.equal(result.riskLevel, 'LOW');
});

test('Level 1: Crashed docker container triggers AUTONOMOUS restart', () => {
  const result = evaluateAutonomyRule({
    text: 'CrashLoopBackOff detected on ecs-task-billing-worker, container exited with code 137',
  });

  assert.equal(result.actionType, 'AUTONOMOUS');
  assert.equal(result.matchedRule.id, 'AUTO-RESTART-02');
  assert.equal(result.riskLevel, 'LOW');
});

test('Level 1: Expiring SSL certificate triggers AUTONOMOUS rotation', () => {
  const result = evaluateAutonomyRule({
    text: 'Ephemeral SSL certificate for api.internal.aws near expiration in 48 hours',
  });

  assert.equal(result.actionType, 'AUTONOMOUS');
  assert.equal(result.matchedRule.id, 'AUTO-SSL-03');
  assert.equal(result.riskLevel, 'LOW');
});

test('Level 1: High CPU load triggers AUTONOMOUS scaling', () => {
  const result = evaluateAutonomyRule({
    text: 'CPU load threshold exceeded 90% for 10 minutes on ECS cluster web-prod, scale up task count',
  });

  assert.equal(result.actionType, 'AUTONOMOUS');
  assert.equal(result.matchedRule.id, 'AUTO-SCALE-01');
  assert.equal(result.riskLevel, 'LOW');
});

test('Level 2: Terminating primary production EC2 requires CONDITIONAL APPROVAL', () => {
  const result = evaluateAutonomyRule({
    text: 'Terminate primary production EC2 instance i-0a1b2c3d4e5f6g7h8',
    isProduction: true,
  });

  assert.equal(result.actionType, 'APPROVAL_REQUIRED');
  assert.equal(result.matchedRule.id, 'APPR-PROD-TERM-01');
  assert.equal(result.riskLevel, 'CRITICAL');
});

test('Level 2: Modifying IAM policy or Security Group requires CONDITIONAL APPROVAL', () => {
  const result = evaluateAutonomyRule({
    text: 'Modify IAM policy to grant AdministratorAccess and update security group sg-01928 to open port 22',
  });

  assert.equal(result.actionType, 'APPROVAL_REQUIRED');
  assert.equal(result.matchedRule.id, 'APPR-NET-IAM-02');
  assert.equal(result.riskLevel, 'HIGH');
});

test('Level 2: Database schema migration or failover requires CONDITIONAL APPROVAL', () => {
  const result = evaluateAutonomyRule({
    text: 'Execute database schema migration and snapshot restoration on aurora-prod-cluster',
  });

  assert.equal(result.actionType, 'APPROVAL_REQUIRED');
  assert.equal(result.matchedRule.id, 'APPR-DB-MIG-03');
  assert.equal(result.riskLevel, 'HIGH');
});

test('Level 2: Spend increase > $100/mo requires CONDITIONAL APPROVAL', () => {
  const result = evaluateAutonomyRule({
    text: 'Provision 4x c6i.8xlarge instances for batch rendering',
    costDeltaMonthly: 480,
  });

  assert.equal(result.actionType, 'APPROVAL_REQUIRED');
  assert.equal(result.matchedRule.id, 'APPR-COST-04');
  assert.equal(result.riskLevel, 'MEDIUM');
});

test('Level 2: Upgrading production DB engine or Kubernetes version requires CONDITIONAL APPROVAL', () => {
  const result = evaluateAutonomyRule({
    text: 'Upgrade production Postgres aurora cluster engine from 14.9 to 16.2',
  });

  assert.equal(result.actionType, 'APPROVAL_REQUIRED');
  assert.equal(result.matchedRule.id, 'APPR-UPGRADE-05');
  assert.equal(result.riskLevel, 'HIGH');
});

test('buildExecutionPayload matches exact user JSON format specification', () => {
  const payload = buildExecutionPayload({
    actionType: 'AUTONOMOUS',
    service: 'EC2',
    command: 'RebootInstances',
    resourceId: 'i-0a1b2c3d4e5f6g7h8',
    reason: 'CPU utilization exceeded 98% for 15 minutes; non-responsive health check.',
    riskLevel: 'LOW',
  });

  assert.equal(payload.agent_name, 'AWS AI');
  assert.equal(payload.action_type, 'AUTONOMOUS');
  assert.equal(payload.service, 'EC2');
  assert.equal(payload.command, 'RebootInstances');
  assert.equal(payload.resource_id, 'i-0a1b2c3d4e5f6g7h8');
  assert.equal(payload.reason, 'CPU utilization exceeded 98% for 15 minutes; non-responsive health check.');
  assert.equal(payload.risk_level, 'LOW');
});

test('buildApprovalPacket contains all specified protocol fields and chat payloads', () => {
  const payload = buildExecutionPayload({
    actionType: 'APPROVAL_REQUIRED',
    service: 'RDS',
    command: 'ModifyDBInstance',
    resourceId: 'aurora-prod-cluster-01',
    reason: 'Upgrade PostgreSQL 14.9 to 16.2',
    riskLevel: 'HIGH',
    costDeltaMonthly: 45,
    downtimeMinutes: 3,
  });

  const packet = buildApprovalPacket(
    payload,
    'Aurora PostgreSQL engine upgrade to v16.2',
    [
      'Take manual snapshot snapshot-pre-upgrade-16',
      'Trigger ModifyDBInstance with ApplyImmediately=true',
      'Verify replication sync and connection pool health',
    ],
    {
      riskLevel: 'HIGH',
      estimatedDowntime: '2-4 minutes',
      costImpactMonthlyUSD: 45,
      blastRadius: 'All production API services using db-cluster-01',
    }
  );

  assert.ok(packet.id.startsWith('appr-'));
  assert.equal(packet.status, 'PENDING');
  assert.equal(packet.incident_summary, 'Aurora PostgreSQL engine upgrade to v16.2');
  assert.equal(packet.proposed_solution.length, 3);
  assert.equal(packet.impact_assessment.risk_level, 'HIGH');
  assert.equal(packet.impact_assessment.estimated_downtime, '2-4 minutes');
  assert.ok(packet.slack_payload.blocks.length >= 3);
  assert.ok(packet.teams_payload.potentialActions.length >= 2);
});
