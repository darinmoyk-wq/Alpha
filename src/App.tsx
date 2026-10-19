/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header.tsx';
import { AutonomyMatrixView } from './components/AutonomyMatrixView.tsx';
import { ApprovalsQueueView } from './components/ApprovalsQueueView.tsx';
import { CopilotDispatcher } from './components/CopilotDispatcher.tsx';
import { InfrastructureView } from './components/InfrastructureView.tsx';
import { ExecutionTerminal } from './components/ExecutionTerminal.tsx';
import { ChaosSimulatorModal } from './components/ChaosSimulatorModal.tsx';
import { AiManagementView } from './components/AiManagementView.tsx';
import { 
  INITIAL_RESOURCES, 
  INITIAL_APPROVALS, 
  INITIAL_INCIDENTS 
} from './data/mockInfrastructure.ts';
import { 
  AWSResource, 
  AutonomyMode, 
  ApprovalProtocolPacket, 
  OperationalIncident, 
  AWSExecutionPayload 
} from './types/index.ts';
import { evaluateAutonomyRule, buildExecutionPayload, buildApprovalPacket } from './utils/autonomyMatrix.ts';

export default function App() {
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('FULL_AUTO');
  const [selectedRegion, setSelectedRegion] = useState<string>('us-east-1');
  const [activeTab, setActiveTab] = useState<string>('copilot');
  const [isChaosModalOpen, setIsChaosModalOpen] = useState<boolean>(false);

  const [resources, setResources] = useState<AWSResource[]>(INITIAL_RESOURCES);
  const [approvals, setApprovals] = useState<ApprovalProtocolPacket[]>(INITIAL_APPROVALS);
  const [incidents, setIncidents] = useState<OperationalIncident[]>(INITIAL_INCIDENTS);
  
  // Seed execution logs with past autonomous actions and pending approval items
  const [executionLogs, setExecutionLogs] = useState<AWSExecutionPayload[]>([
    ...INITIAL_INCIDENTS.map(inc => inc.executionPayload!).filter(Boolean),
    ...INITIAL_APPROVALS.map(appr => appr.payload),
  ]);

  const [autonomousActionsCount, setAutonomousActionsCount] = useState<number>(48);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'warning') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Autonomous execution handler
  const handleExecuteAutonomous = (payload: AWSExecutionPayload) => {
    setAutonomousActionsCount(prev => prev + 1);
    setExecutionLogs(prev => [payload, ...prev]);

    // Update target resource health and metrics
    setResources(prev =>
      prev.map(res => {
        if (res.id === payload.resource_id || payload.resource_id.includes(res.id)) {
          let updatedMetrics = { ...res.metrics };
          let actionLabel = `${payload.command} (${payload.service})`;

          if (payload.command.includes('Clean') || payload.command.includes('Storage')) {
            updatedMetrics.diskPercent = 52;
            actionLabel = 'Cleared temporary logs & cache (disk reduced from >85% to 52%)';
          } else if (payload.command.includes('Restart')) {
            actionLabel = 'Restarted crashed container task; health check passed';
          } else if (payload.command.includes('IPSet')) {
            actionLabel = 'Added malicious IP to AWS WAF automated perimeter blocklist';
          } else if (payload.command.includes('Capacity') || payload.command.includes('Scale')) {
            actionLabel = 'Adjusted AutoScaling desired count based on load thresholds';
          } else if (payload.command.includes('Certificate') || payload.command.includes('Renew')) {
            updatedMetrics.daysUntilSslExpire = 90;
            actionLabel = 'Rotated ephemeral SSL certificate via ACM';
          }

          return {
            ...res,
            status: 'HEALTHY',
            metrics: updatedMetrics,
            lastAutonomousAction: actionLabel,
          };
        }
        return res;
      })
    );

    showNotification(
      `⚡ AWS AI Autonomous Action Executed: ${payload.service} - ${payload.command} (${payload.resource_id})`,
      'success'
    );
  };

  // Request approval handler
  const handleRequestApproval = (packet: ApprovalProtocolPacket) => {
    setApprovals(prev => [packet, ...prev]);
    showNotification(
      `🛡️ Conditional Approval Required: ${packet.payload.service} ${packet.payload.command} (Risk: ${packet.impact_assessment.risk_level})`,
      'warning'
    );
  };

  // Approve packet
  const handleApprovePacket = (id: string) => {
    const packet = approvals.find(a => a.id === id);
    if (!packet) return;

    setApprovals(prev =>
      prev.map(a => (a.id === id ? { ...a, status: 'APPROVED', reviewed_at: new Date().toISOString() } : a))
    );

    // Execute the approved payload
    const executedPayload: AWSExecutionPayload = {
      ...packet.payload,
      timestamp: new Date().toISOString(),
    };
    setExecutionLogs(prev => [executedPayload, ...prev]);

    // If it was instance termination / restart / failover, reflect on resources
    setResources(prev =>
      prev.map(res => {
        if (res.id === packet.payload.resource_id || packet.payload.resource_id.includes(res.id)) {
          return {
            ...res,
            lastAutonomousAction: `Authorized Change: ${packet.payload.command} executed per approval #${id.slice(-6)}`,
          };
        }
        return res;
      })
    );

    showNotification(
      `✅ Approved & Executed: ${packet.payload.service} - ${packet.payload.command}`,
      'success'
    );
  };

  // Reject packet
  const handleRejectPacket = (id: string) => {
    setApprovals(prev =>
      prev.map(a => (a.id === id ? { ...a, status: 'REJECTED', reviewed_at: new Date().toISOString() } : a))
    );
    showNotification(`❌ Action Rejected: Approval request #${id.slice(-6)} aborted.`, 'warning');
  };

  // Chaos injection handler
  const handleInjectIncident = async (prompt: string, context?: any) => {
    setActiveTab('copilot');

    try {
      const response = await fetch('/api/aws-ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context }),
      });

      if (!response.ok) throw new Error('Failed to analyze simulated incident');
      const data = await response.json();

      if (data.payload.action_type === 'AUTONOMOUS') {
        handleExecuteAutonomous(data.payload);
      } else if (data.approval_packet) {
        handleRequestApproval(data.approval_packet);
      }
    } catch (err) {
      // Deterministic fallback
      const rule = evaluateAutonomyRule({
        text: prompt,
        service: context?.service,
        isProduction: context?.isProduction,
        costDeltaMonthly: context?.costDeltaMonthly,
        diskUsagePercent: context?.diskUsagePercent,
      });

      const payload = buildExecutionPayload({
        actionType: rule.actionType,
        service: rule.matchedRule.service,
        command: rule.actionType === 'AUTONOMOUS' ? 'AutoHeal' : 'RequestChange',
        resourceId: context?.resourceId || 'i-0a1b2c3d4e5f6g7h8',
        reason: rule.reason,
        riskLevel: rule.riskLevel,
        costDeltaMonthly: context?.costDeltaMonthly ?? 0,
      });

      if (rule.actionType === 'AUTONOMOUS') {
        handleExecuteAutonomous(payload);
      } else {
        const packet = buildApprovalPacket(
          payload,
          prompt,
          ['Validate impact', 'Execute change', 'Verify health checks'],
          {
            riskLevel: rule.riskLevel,
            estimatedDowntime: '2-5 mins',
            costImpactMonthlyUSD: context?.costDeltaMonthly ?? 0,
            blastRadius: 'Target AWS workload',
          }
        );
        handleRequestApproval(packet);
      }
    }
  };

  // Resource-specific incident injection
  const handleInjectResourceIncident = (resource: AWSResource, incidentType: string) => {
    let prompt = '';
    let context: any = { resourceId: resource.id, service: resource.service, isProduction: resource.isPrimaryProd };

    if (incidentType === 'disk_92') {
      prompt = `Disk usage on /var/log exceeds 92% on EC2 instance ${resource.id}, clear temporary logs and cache`;
      context.diskUsagePercent = 92;
    } else if (incidentType === 'terminate_prod') {
      prompt = `Terminate primary production EC2 instance ${resource.id}`;
      context.isProduction = true;
    } else if (incidentType === 'crash_container') {
      prompt = `CrashLoopBackOff detected on ${resource.id}, container exited with code 137, restart container`;
    } else if (incidentType === 'failover_db') {
      prompt = `Failover primary database cluster ${resource.id} to standby replica`;
    } else if (incidentType === 'guardduty_attack') {
      prompt = `GuardDuty detected malicious brute-force attempts from IP 198.51.100.42 to ${resource.name}, block IP in AWS WAF`;
    } else if (incidentType === 'ssl_expire') {
      prompt = `Ephemeral SSL certificate for ${resource.name} near expiration in 48 hours, rotate certificate`;
    } else if (incidentType === 'upgrade_k8s') {
      prompt = `Upgrade production Kubernetes cluster ${resource.name} to version 1.31`;
    }

    handleInjectIncident(prompt, context);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-16 right-4 z-50 max-w-md animate-bounce-in">
          <div
            className={`p-3.5 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-medium flex items-center gap-2.5 ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100'
                : 'bg-amber-950/90 border-amber-500/50 text-amber-100'
            }`}
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${notification.type === 'success' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="flex-1 leading-snug">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header with identity, status beacon, and controls */}
      <Header
        autonomyMode={autonomyMode}
        setAutonomyMode={setAutonomyMode}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        pendingApprovalsCount={approvals.filter(a => a.status === 'PENDING').length}
        autonomousActionsCount={autonomousActionsCount}
        onOpenChaosModal={() => setIsChaosModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'copilot' && (
          <CopilotDispatcher
            onExecuteAutonomous={handleExecuteAutonomous}
            onRequestApproval={handleRequestApproval}
            pendingApprovals={approvals}
            onApprovePacket={handleApprovePacket}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalsQueueView
            approvals={approvals}
            onApprove={handleApprovePacket}
            onReject={handleRejectPacket}
          />
        )}

        {activeTab === 'matrix' && (
          <AutonomyMatrixView
            onTriggerTestIncident={handleInjectIncident}
          />
        )}

        {activeTab === 'management' && (
          <AiManagementView
            onNotify={showNotification}
          />
        )}

        {activeTab === 'infrastructure' && (
          <InfrastructureView
            resources={resources}
            onInjectResourceIncident={handleInjectResourceIncident}
          />
        )}

        {activeTab === 'terminal' && (
          <ExecutionTerminal
            logs={executionLogs}
            onClearLogs={() => setExecutionLogs([])}
          />
        )}
      </main>

      {/* Chaos Simulator Modal */}
      <ChaosSimulatorModal
        isOpen={isChaosModalOpen}
        onClose={() => setIsChaosModalOpen(false)}
        onSimulate={handleInjectIncident}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">AWS AI</span>
            <span>•</span>
            <span>Autonomous Cloud Engineer Engine 24/7</span>
            <span>•</span>
            <span className="text-emerald-400">SOC-2 & AWS Well-Architected Compliant</span>
          </div>
          <div>
            <span>Autonomy Matrix v4.2 • Port 3000 • Production Cluster Connected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
