/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  evaluateAutonomyRule,
  buildExecutionPayload,
  buildApprovalPacket,
  ActionType,
  AWSService,
  RiskLevel,
  AWSExecutionPayload,
  ApprovalProtocolPacket,
} from '../src/utils/autonomyMatrix.ts';

export const apiApp = express();
apiApp.use(express.json());

// Initialize Google GenAI on the server side as required by gemini-api skill
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

apiApp.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    agent_name: 'AWS AI',
    autonomy_level: '24/7 AUTONOMOUS',
    gemini_enabled: Boolean(ai),
    uptime: '99.99%',
    current_time: new Date().toISOString(),
  });
});

/**
 * Endpoint to analyze an AWS incident or user command
 */
apiApp.post('/api/aws-ai/analyze', async (req: Request, res: Response) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    // 1. First run deterministic rule check to ensure strict safety boundaries
    const ruleEval = evaluateAutonomyRule({
      text: prompt,
      service: context?.service,
      isProduction: context?.isProduction ?? prompt.toLowerCase().includes('prod'),
      costDeltaMonthly: context?.costDeltaMonthly,
      diskUsagePercent: context?.diskUsagePercent,
    });

    let aiReasoning = '';
    let proposedSteps: string[] = [];
    let customDowntime = '0 mins';
    let blastRadius = 'Isolated to specified resource';

    // 2. If Gemini is available, enhance with deep autonomous cloud reasoning
    if (ai) {
      try {
        const systemInstruction = `You are "AWS AI", an enterprise-grade autonomous cloud engineer designed to manage AWS cloud infrastructure 24/7.
Your goal is to maximize server uptime, optimize cloud spending, maintain security compliance, and resolve operational issues without human intervention wherever safe to do so.

OPERATIONAL RULES & AUTONOMY MATRIX:
1. FULL AUTONOMY LEVEL (Execute Immediately without asking approval):
   - Scaling EC2/ECS/EKS capacity up or down based on load thresholds.
   - Restarting crashed Docker containers or failed systemd services.
   - Rotating ephemeral SSL certificates near expiration.
   - Clearing temporary disk space, logs, and cache when disk usage exceeds 85%.
   - Blocking malicious IPs identified by AWS WAF or GuardDuty.

2. CONDITIONAL APPROVAL LEVEL (Draft plan, calculate impact, and request user approval):
   - Terminating or shutting down primary production EC2/RDS instances.
   - Modifying IAM policies, security groups, or network ACLs.
   - Database schema migrations, snapshot restorations, or primary region failovers.
   - Any single action that increases total monthly AWS spend by > $100.
   - Upgrading production database engines or Kubernetes cluster versions.

Return a JSON object with:
- "action_type": "AUTONOMOUS" or "APPROVAL_REQUIRED"
- "service": "EC2" | "ECS" | "EKS" | "RDS" | "WAF" | "GuardDuty" | "IAM" | "VPC" | "ACM" | "AutoScaling"
- "command": AWS API action (e.g. RebootInstances, SetDesiredCapacity, UpdateIPSet, ModifyDBInstance, etc.)
- "resource_id": target AWS ARN or ID (e.g. i-0a1b2c3d4e5f6g7h8, rds-aurora-prod-01, waf-ipset-blocklist)
- "reason": concise explanation
- "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
- "proposed_steps": array of 2-4 concrete step strings
- "estimated_downtime": e.g. "0 mins" or "3-5 mins"
- "cost_impact_monthly_usd": number (positive or negative)
- "blast_radius": string description of affected systems`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Analyze this operational task/incident: "${prompt}"\nContext: ${JSON.stringify(context || {})}`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const rawJson = response.text?.trim() || '{}';
        const parsed = JSON.parse(rawJson);

        if (parsed.reason) aiReasoning = parsed.reason;
        if (Array.isArray(parsed.proposed_steps) && parsed.proposed_steps.length > 0) {
          proposedSteps = parsed.proposed_steps;
        }
        if (parsed.estimated_downtime) customDowntime = parsed.estimated_downtime;
        if (parsed.blast_radius) blastRadius = parsed.blast_radius;

        // If the deterministic evaluator says APPROVAL_REQUIRED, enforce it over AI for maximum safety
        const finalActionType: ActionType =
          ruleEval.actionType === 'APPROVAL_REQUIRED' ? 'APPROVAL_REQUIRED' : (parsed.action_type || ruleEval.actionType);

        const finalRiskLevel: RiskLevel =
          ruleEval.riskLevel === 'CRITICAL' ? 'CRITICAL' : (parsed.risk_level || ruleEval.riskLevel);

        const executionPayload: AWSExecutionPayload = buildExecutionPayload({
          actionType: finalActionType,
          service: (parsed.service as AWSService) || ruleEval.matchedRule.service,
          command: parsed.command || (finalActionType === 'AUTONOMOUS' ? 'AutoRemediate' : 'ModifyResource'),
          resourceId: parsed.resource_id || context?.resourceId || 'i-0a1b2c3d4e5f6g7h8',
          reason: aiReasoning || ruleEval.reason,
          riskLevel: finalRiskLevel,
          costDeltaMonthly: typeof parsed.cost_impact_monthly_usd === 'number' ? parsed.cost_impact_monthly_usd : context?.costDeltaMonthly ?? 0,
          downtimeMinutes: customDowntime.includes('min') ? parseInt(customDowntime, 10) || 0 : 0,
          parameters: context?.parameters,
        });

        let approvalPacket: ApprovalProtocolPacket | null = null;
        if (finalActionType === 'APPROVAL_REQUIRED') {
          approvalPacket = buildApprovalPacket(
            executionPayload,
            prompt,
            proposedSteps.length > 0 ? proposedSteps : [
              `Pre-check health metrics and capture manual snapshot for ${executionPayload.resource_id}`,
              `Execute AWS API call: ${executionPayload.command}`,
              `Run post-change synthetic validation and notify SRE on-call`,
            ],
            {
              riskLevel: finalRiskLevel,
              estimatedDowntime: customDowntime,
              costImpactMonthlyUSD: executionPayload.cost_delta_monthly_usd ?? 0,
              blastRadius,
            }
          );
        }

        res.json({
          agent_name: 'AWS AI',
          source: 'Gemini 3.8 Flash + Autonomy Matrix',
          rule: ruleEval.matchedRule,
          payload: executionPayload,
          approval_packet: approvalPacket,
          ai_reasoning: aiReasoning || ruleEval.reason,
        });
        return;
      } catch (genAiErr) {
        console.warn('Gemini API call failed, falling back to deterministic Autonomy Matrix:', genAiErr);
      }
    }

    // Deterministic fallback (fast, offline-capable & resilient)
    const fallbackService = ruleEval.matchedRule.service;
    let fallbackCommand = 'ExecuteSelfHealing';
    let fallbackResourceId = context?.resourceId || 'i-0a1b2c3d4e5f6g7h8';
    let fallbackCost = context?.costDeltaMonthly ?? 0;
    let fallbackDowntime = '0 mins';

    if (ruleEval.matchedRule.id === 'AUTO-DISK-04') {
      fallbackCommand = 'CleanTemporaryStorage';
      fallbackResourceId = context?.resourceId || 'i-09823f-api-prod';
    } else if (ruleEval.matchedRule.id === 'AUTO-SEC-05') {
      fallbackCommand = 'UpdateIPSet';
      fallbackResourceId = 'waf-ip-blocklist-global';
    } else if (ruleEval.matchedRule.id === 'AUTO-RESTART-02') {
      fallbackCommand = 'RestartTask';
      fallbackResourceId = context?.resourceId || 'ecs-worker-billing-crashed';
    } else if (ruleEval.matchedRule.id === 'AUTO-SSL-03') {
      fallbackCommand = 'RenewCertificate';
      fallbackResourceId = 'arn:aws:acm:us-east-1:128490234411:certificate/ephemeral-tls-09';
    } else if (ruleEval.matchedRule.id === 'AUTO-SCALE-01') {
      fallbackCommand = 'SetDesiredCapacity';
      fallbackResourceId = 'asg-prod-frontend-us-east-1';
    } else if (ruleEval.matchedRule.id === 'APPR-PROD-TERM-01') {
      fallbackCommand = 'TerminateInstances';
      fallbackResourceId = context?.resourceId || 'i-0a1b2c3d4e5f6g7h8';
      fallbackDowntime = '3-10 mins (failover window)';
    } else if (ruleEval.matchedRule.id === 'APPR-DB-MIG-03') {
      fallbackCommand = 'FailoverDBCluster';
      fallbackResourceId = 'rds-aurora-postgres-prod-master';
      fallbackDowntime = '35-90 seconds';
    } else if (ruleEval.matchedRule.id === 'APPR-COST-04') {
      fallbackCommand = 'CreateFleet';
      fallbackResourceId = 'asg-gpu-compute-pool';
      fallbackCost = context?.costDeltaMonthly || 340;
    } else if (ruleEval.matchedRule.id === 'APPR-UPGRADE-05') {
      fallbackCommand = 'UpgradeClusterVersion';
      fallbackResourceId = 'eks-production-cluster-v1';
      fallbackDowntime = 'Rolling update (no dropped connections)';
    }

    const payload = buildExecutionPayload({
      actionType: ruleEval.actionType,
      service: fallbackService,
      command: fallbackCommand,
      resourceId: fallbackResourceId,
      reason: ruleEval.reason,
      riskLevel: ruleEval.riskLevel,
      costDeltaMonthly: fallbackCost,
      downtimeMinutes: fallbackDowntime.includes('min') ? 5 : 0,
      parameters: context?.parameters,
    });

    let approvalPacket: ApprovalProtocolPacket | null = null;
    if (ruleEval.actionType === 'APPROVAL_REQUIRED') {
      approvalPacket = buildApprovalPacket(
        payload,
        prompt,
        [
          `Verify active traffic draining and execute snapshot on ${payload.resource_id}`,
          `Execute operational command '${payload.command}' with blast radius containment`,
          `Validate health checks, latencies, and alert channels for 15 minutes post-change`,
        ],
        {
          riskLevel: ruleEval.riskLevel,
          estimatedDowntime: fallbackDowntime,
          costImpactMonthlyUSD: fallbackCost,
          blastRadius: `Production resources dependent on ${payload.service} - ${payload.resource_id}`,
        }
      );
    }

    res.json({
      agent_name: 'AWS AI',
      source: 'Autonomy Matrix Engine',
      rule: ruleEval.matchedRule,
      payload,
      approval_packet: approvalPacket,
      ai_reasoning: ruleEval.reason,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal error analyzing incident' });
  }
});
