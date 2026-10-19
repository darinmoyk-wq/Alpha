/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Scale, 
  RefreshCw, 
  Lock, 
  HardDrive, 
  Shield, 
  PowerOff, 
  Key, 
  Database, 
  DollarSign, 
  GitFork,
  Search,
  Sliders
} from 'lucide-react';
import { AUTONOMY_MATRIX_RULES, evaluateAutonomyRule, RuleDefinition } from '../utils/autonomyMatrix.ts';

interface AutonomyMatrixViewProps {
  onTriggerTestIncident: (prompt: string, context?: any) => void;
}

export const AutonomyMatrixView: React.FC<AutonomyMatrixViewProps> = ({ onTriggerTestIncident }) => {
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const level1Rules = AUTONOMY_MATRIX_RULES.filter(r => r.level === 'AUTONOMOUS');
  const level2Rules = AUTONOMY_MATRIX_RULES.filter(r => r.level === 'APPROVAL_REQUIRED');

  const getRuleIcon = (id: string) => {
    switch (id) {
      case 'AUTO-SCALE-01': return <Scale className="w-5 h-5 text-emerald-400" />;
      case 'AUTO-RESTART-02': return <RefreshCw className="w-5 h-5 text-emerald-400" />;
      case 'AUTO-SSL-03': return <Lock className="w-5 h-5 text-emerald-400" />;
      case 'AUTO-DISK-04': return <HardDrive className="w-5 h-5 text-emerald-400" />;
      case 'AUTO-SEC-05': return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'APPR-PROD-TERM-01': return <PowerOff className="w-5 h-5 text-rose-400" />;
      case 'APPR-NET-IAM-02': return <Key className="w-5 h-5 text-amber-400" />;
      case 'APPR-DB-MIG-03': return <Database className="w-5 h-5 text-orange-400" />;
      case 'APPR-COST-04': return <DollarSign className="w-5 h-5 text-amber-400" />;
      case 'APPR-UPGRADE-05': return <GitFork className="w-5 h-5 text-purple-400" />;
      default: return <Sliders className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleRunTest = (customPrompt?: string) => {
    const query = customPrompt || testInput;
    if (!query) return;
    const res = evaluateAutonomyRule({ text: query });
    setTestResult({ query, ...res });
  };

  return (
    <div className="space-y-6">
      {/* Intro Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider font-mono">
                Core Governance Protocol
              </span>
              <span className="text-xs text-slate-400 font-mono">v4.2-autonomous</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Operational Rules & Autonomy Matrix
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              AWS AI operates on a two-tier governance matrix designed to maximize uptime and eliminate manual toil for safe operational actions, while enforcing strict impact calculations and conditional human signoffs for high-blast-radius production changes.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Rule Tester Sandbox */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-amber-400" />
          <span>Interactive Matrix Classifier & Rule Evaluator</span>
        </h2>
        <p className="text-xs text-slate-400 mb-3">
          Type an AWS CLI command, CloudWatch alarm, or infrastructure task to test how AWS AI classifies it in real-time.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunTest()}
            placeholder="e.g., 'Disk usage on /dev/xvda reached 92% on EC2 i-071b', 'Terminate primary production RDS instance'..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
          />
          <button
            onClick={() => handleRunTest()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>Evaluate Rule</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Sample Queries */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs">
          <span className="text-slate-400 font-medium">Quick test samples:</span>
          {[
            { label: 'Clear Disk >85%', text: 'Disk usage on /var/log exceeds 89% on i-09823f', level: 'Level 1' },
            { label: 'GuardDuty Malicious IP', text: 'GuardDuty identified malicious brute-force attempts from IP 198.51.100.42 to ALB', level: 'Level 1' },
            { label: 'Terminate Prod RDS', text: 'Terminate primary production RDS cluster rds-pg-master', level: 'Level 2' },
            { label: 'IAM Open 0.0.0.0/0', text: 'Modify security group sg-01928 to open port 22 to 0.0.0.0/0', level: 'Level 2' },
            { label: 'Cost +$340/mo', text: 'Spin up 4x c6i.8xlarge instances for batch processing (+$340/mo)', level: 'Level 2' },
          ].map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTestInput(sample.text);
                handleRunTest(sample.text);
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors flex items-center gap-1"
            >
              <span>{sample.label}</span>
              <span className={`text-[10px] font-mono px-1 rounded ${sample.level === 'Level 1' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {sample.level}
              </span>
            </button>
          ))}
        </div>

        {/* Evaluation Output */}
        {testResult && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className={`p-4 rounded-lg border ${
              testResult.actionType === 'AUTONOMOUS'
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {testResult.actionType === 'AUTONOMOUS' ? (
                    <Zap className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                  )}
                  <span className="font-bold text-sm tracking-wide font-mono uppercase">
                    {testResult.actionType === 'AUTONOMOUS' ? 'FULL AUTONOMY LEVEL' : 'CONDITIONAL APPROVAL LEVEL'}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                    testResult.riskLevel === 'CRITICAL' ? 'bg-rose-500 text-white' :
                    testResult.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' :
                    testResult.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    Risk: {testResult.riskLevel}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-300">
                  Matched Rule: <span className="font-semibold text-white">{testResult.matchedRule.id} - {testResult.matchedRule.title}</span>
                </div>
              </div>

              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                <strong>Evaluation Rationale:</strong> {testResult.reason}
              </p>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <span className="text-slate-400">
                  {testResult.actionType === 'AUTONOMOUS' 
                    ? '⚡ This task will execute immediately with zero human delay.' 
                    : '🛡️ This task will generate a structured approval protocol with impact assessment.'}
                </span>
                <button
                  onClick={() => onTriggerTestIncident(testResult.query)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded font-medium transition-colors"
                >
                  Send to Live Dispatcher →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two-Column Grid: Level 1 vs Level 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tier 1: FULL AUTONOMY */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-lg relative flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>1. FULL AUTONOMY LEVEL</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ZERO APPROVAL
                  </span>
                </h2>
                <p className="text-xs text-emerald-400/90 font-medium">
                  Execute Immediately Without Asking Approval
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">
              5 Core Protocols
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {level1Rules.map((rule) => (
              <div
                key={rule.id}
                className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/40 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800 mt-0.5">
                      {getRuleIcon(rule.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
                          {rule.title}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {rule.service}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onTriggerTestIncident(`Trigger ${rule.title} for ${rule.service} workload`)}
                    className="shrink-0 text-xs px-2 py-1 rounded bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-400 border border-slate-700 transition-colors opacity-90 group-hover:opacity-100"
                  >
                    Test
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              SLA: Instant sub-second execution
            </span>
            <span className="font-mono text-slate-500">Autonomous Self-Healing</span>
          </div>
        </div>

        {/* Tier 2: CONDITIONAL APPROVAL */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-lg relative flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>2. CONDITIONAL APPROVAL</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    SIGN-OFF REQUIRED
                  </span>
                </h2>
                <p className="text-xs text-amber-400/90 font-medium">
                  Draft Plan, Calculate Impact, and Request User Approval
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">
              5 Governance Protocols
            </span>
          </div>

          <div className="space-y-3 flex-1">
            {level2Rules.map((rule) => (
              <div
                key={rule.id}
                className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800 mt-0.5">
                      {getRuleIcon(rule.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">
                          {rule.title}
                        </h4>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          rule.defaultRisk === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          Risk: {rule.defaultRisk}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onTriggerTestIncident(`Request ${rule.title} in production environment`)}
                    className="shrink-0 text-xs px-2 py-1 rounded bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-400 border border-slate-700 transition-colors opacity-90 group-hover:opacity-100"
                  >
                    Draft Plan
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              Requires 4-point Impact Assessment
            </span>
            <span className="font-mono text-slate-500">Slack / Teams / Dashboard</span>
          </div>
        </div>

      </div>
    </div>
  );
};
