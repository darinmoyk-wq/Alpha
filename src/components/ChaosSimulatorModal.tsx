/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  Flame, 
  Zap, 
  ShieldAlert, 
  HardDrive, 
  Shield, 
  RefreshCw, 
  Lock, 
  Scale, 
  PowerOff, 
  Key, 
  Database, 
  DollarSign, 
  GitFork 
} from 'lucide-react';

interface ChaosSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulate: (prompt: string, context?: any) => void;
}

export const ChaosSimulatorModal: React.FC<ChaosSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSimulate,
}) => {
  if (!isOpen) return null;

  const scenarios = [
    {
      tier: 'Level 1: FULL AUTONOMY',
      type: 'AUTONOMOUS',
      title: 'Disk Threshold Exceeded (92%)',
      desc: 'EC2 instance i-09823f /var/log filled with stale dumps. Threshold > 85% reached.',
      prompt: 'Disk usage on /var/log exceeds 92% on EC2 instance i-09823f, execute automated cleanup of temp logs and cache',
      context: { diskUsagePercent: 92, resourceId: 'i-09823f4b1e7c0d2a9' },
      icon: <HardDrive className="w-4 h-4 text-emerald-400" />,
    },
    {
      tier: 'Level 1: FULL AUTONOMY',
      type: 'AUTONOMOUS',
      title: 'GuardDuty SSH Brute Force Detected',
      desc: 'GuardDuty flagged 1,200 unauthorized SSH connection attempts from 198.51.100.42 to ALB.',
      prompt: 'GuardDuty identified malicious brute-force attempts from IP 198.51.100.42 to ALB, block IP in AWS WAF',
      context: { resourceId: 'waf-ipset-global-perimeter', parameters: { ip: '198.51.100.42/32' } },
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
    },
    {
      tier: 'Level 1: FULL AUTONOMY',
      type: 'AUTONOMOUS',
      title: 'ECS Worker Container CrashLoopBackOff',
      desc: 'Billing processor task exited unexpectedly with code 137 (OOMKilled).',
      prompt: 'CrashLoopBackOff detected on ecs-svc-billing-worker, container exited with code 137, execute autonomous task restart',
      context: { resourceId: 'ecs-svc-billing-worker-us-east-1' },
      icon: <RefreshCw className="w-4 h-4 text-emerald-400" />,
    },
    {
      tier: 'Level 1: FULL AUTONOMY',
      type: 'AUTONOMOUS',
      title: 'Ephemeral SSL Certificate Near Expiration',
      desc: 'Internal TLS certificate for api.internal.aws expires in under 48 hours.',
      prompt: 'Ephemeral SSL certificate for api.production.aws.internal near expiration in 48 hours, rotate certificate',
      context: { resourceId: 'arn:aws:acm:us-east-1:128490234411:certificate/ephemeral-tls-09' },
      icon: <Lock className="w-4 h-4 text-emerald-400" />,
    },
    {
      tier: 'Level 1: FULL AUTONOMY',
      type: 'AUTONOMOUS',
      title: 'High CPU Load AutoScale Event',
      desc: 'ECS web-prod cluster CPU exceeded 92% for 12 minutes during flash sale.',
      prompt: 'CPU load threshold exceeded 90% for 12 minutes on ECS web cluster, scale up capacity from 4 to 8 tasks',
      context: { resourceId: 'asg-prod-frontend-us-east-1' },
      icon: <Scale className="w-4 h-4 text-emerald-400" />,
    },
    {
      tier: 'Level 2: CONDITIONAL APPROVAL',
      type: 'APPROVAL_REQUIRED',
      title: 'Terminate Primary Production EC2',
      desc: 'Terminate primary production gateway node i-0a1b2c3d4e5f6g7h8.',
      prompt: 'Terminate primary production EC2 instance i-0a1b2c3d4e5f6g7h8',
      context: { isProduction: true, resourceId: 'i-0a1b2c3d4e5f6g7h8' },
      icon: <PowerOff className="w-4 h-4 text-rose-400" />,
    },
    {
      tier: 'Level 2: CONDITIONAL APPROVAL',
      type: 'APPROVAL_REQUIRED',
      title: 'Modify Security Group / Open SSH (0.0.0.0/0)',
      desc: 'Ingress rule change to open SSH port 22 globally to the internet.',
      prompt: 'Modify security group sg-019283fa to allow ingress port 22 from 0.0.0.0/0 for urgent debugging',
      context: { resourceId: 'sg-019283fa' },
      icon: <Key className="w-4 h-4 text-amber-400" />,
    },
    {
      tier: 'Level 2: CONDITIONAL APPROVAL',
      type: 'APPROVAL_REQUIRED',
      title: 'Aurora DB Cluster Failover',
      desc: 'Trigger failover on primary production Aurora Postgres cluster to secondary AZ.',
      prompt: 'Execute primary region failover and snapshot restoration on aurora-pg-prod-cluster',
      context: { resourceId: 'rds-aurora-postgres-prod-master' },
      icon: <Database className="w-4 h-4 text-orange-400" />,
    },
    {
      tier: 'Level 2: CONDITIONAL APPROVAL',
      type: 'APPROVAL_REQUIRED',
      title: 'Spend Increase > $100 / Month (+$420/mo)',
      desc: 'Provision 6x g5.2xlarge GPU worker instances for ML inference batch.',
      prompt: 'Provision 6x g5.2xlarge GPU worker instances for ML inference batch, increasing spend by $420/month',
      context: { costDeltaMonthly: 420 },
      icon: <DollarSign className="w-4 h-4 text-amber-400" />,
    },
    {
      tier: 'Level 2: CONDITIONAL APPROVAL',
      type: 'APPROVAL_REQUIRED',
      title: 'Upgrade Production Kubernetes to v1.31',
      desc: 'Upgrade production EKS cluster control plane and worker nodes to v1.31.',
      prompt: 'Upgrade production Kubernetes cluster eks-prod-k8s-v130 from 1.30 to 1.31',
      context: { resourceId: 'eks-cluster-payment-microservices' },
      icon: <GitFork className="w-4 h-4 text-purple-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Simulate Cloud Incident / Chaos</h3>
              <p className="text-xs text-slate-400">
                Trigger real-world infrastructure scenarios to observe AWS AI autonomy matrix in action.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scenarios list */}
        <div className="p-5 overflow-y-auto space-y-3">
          {scenarios.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSimulate(item.prompt, item.context);
                onClose();
              }}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 cursor-pointer transition-all flex items-start justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 mt-0.5">
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h4>
                    <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full ${
                      item.type === 'AUTONOMOUS'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {item.type === 'AUTONOMOUS' ? 'Level 1: Auto' : 'Level 2: Approval'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>

              <span className="shrink-0 text-xs font-semibold text-amber-400 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all mt-1">
                Inject →
              </span>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>All 10 Autonomy Matrix criteria supported</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
