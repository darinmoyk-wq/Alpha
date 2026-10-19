/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Terminal, 
  Copy, 
  Check, 
  MessageSquare, 
  Layers, 
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Send
} from 'lucide-react';
import { ApprovalProtocolPacket } from '../types/index.ts';

interface ApprovalsQueueViewProps {
  approvals: ApprovalProtocolPacket[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const ApprovalsQueueView: React.FC<ApprovalsQueueViewProps> = ({
  approvals,
  onApprove,
  onReject,
}) => {
  const [selectedId, setSelectedId] = useState<string>(approvals[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'json' | 'slack' | 'teams'>('dashboard');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedPacket = approvals.find(a => a.id === selectedId) || approvals[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'LOW': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Conditional Approval Queue</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {approvals.filter(a => a.status === 'PENDING').length} Pending
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Level 2 operational actions awaiting human authorization per the Autonomy Matrix.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Governance protocol:</span>
          <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Audit Trail Active
          </span>
        </div>
      </div>

      {approvals.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Approvals Queue is Clear</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
            All operational tasks are either running autonomously under Level 1 rules or have been resolved.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: List of items */}
          <div className="lg:col-span-5 space-y-2.5">
            {approvals.map((packet) => {
              const isSelected = packet.id === selectedPacket?.id;
              return (
                <div
                  key={packet.id}
                  onClick={() => setSelectedId(packet.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-amber-400/60 shadow-lg shadow-amber-500/5 ring-1 ring-amber-400/30'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${getRiskBadgeColor(packet.impact_assessment.risk_level)}`}>
                        {packet.impact_assessment.risk_level}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {packet.payload.service} • {packet.payload.command}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      packet.status === 'PENDING' ? 'bg-amber-400/20 text-amber-300 font-bold' :
                      packet.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' :
                      'bg-rose-500/20 text-rose-300'
                    }`}>
                      {packet.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-100 mt-2 line-clamp-2">
                    {packet.incident_summary}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60 font-mono">
                    <span>Target: {packet.payload.resource_id}</span>
                    <span>Cost: {packet.impact_assessment.cost_impact_monthly_usd >= 0 ? '+' : ''}${packet.impact_assessment.cost_impact_monthly_usd.toFixed(2)}/mo</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed Structured Protocol Card */}
          {selectedPacket && (
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
              
              {/* Card top banner & tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${getRiskBadgeColor(selectedPacket.impact_assessment.risk_level)}`}>
                    RISK: {selectedPacket.impact_assessment.risk_level}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {selectedPacket.id}
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'dashboard' ? 'bg-amber-400/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Protocol View
                  </button>
                  <button
                    onClick={() => setActiveTab('json')}
                    className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'json' ? 'bg-amber-400/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Structured JSON
                  </button>
                  <button
                    onClick={() => setActiveTab('slack')}
                    className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'slack' ? 'bg-amber-400/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Slack Payload
                  </button>
                  <button
                    onClick={() => setActiveTab('teams')}
                    className={`px-2.5 py-1 rounded transition-colors ${activeTab === 'teams' ? 'bg-amber-400/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Teams Card
                  </button>
                </div>
              </div>

              {/* View 1: Standard Dashboard Protocol View */}
              {activeTab === 'dashboard' && (
                <div className="space-y-4 py-4 flex-1">
                  
                  {/* 1. Incident / Task Summary */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono mb-1.5 flex items-center gap-1.5">
                      <span>• Incident / Task Summary</span>
                    </h4>
                    <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 leading-relaxed font-medium">
                      {selectedPacket.incident_summary}
                    </div>
                  </div>

                  {/* 2. Proposed Solution Steps */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono mb-1.5 flex items-center gap-1.5">
                      <span>• Proposed Solution (Autonomous Execution Plan)</span>
                    </h4>
                    <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                      {selectedPacket.proposed_solution.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                          <span className="w-5 h-5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Impact Assessment */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono mb-1.5 flex items-center gap-1.5">
                      <span>• Impact Assessment</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Risk Level</span>
                        <strong className={`text-xs font-bold font-mono ${
                          selectedPacket.impact_assessment.risk_level === 'CRITICAL' ? 'text-rose-400' :
                          selectedPacket.impact_assessment.risk_level === 'HIGH' ? 'text-orange-400' :
                          selectedPacket.impact_assessment.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {selectedPacket.impact_assessment.risk_level}
                        </strong>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Est. Downtime</span>
                        <strong className="text-xs font-bold font-mono text-slate-100">
                          {selectedPacket.impact_assessment.estimated_downtime}
                        </strong>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Cost Impact</span>
                        <strong className={`text-xs font-bold font-mono ${selectedPacket.impact_assessment.cost_impact_monthly_usd > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {selectedPacket.impact_assessment.cost_impact_monthly_usd >= 0 ? '+' : ''}${selectedPacket.impact_assessment.cost_impact_monthly_usd.toFixed(2)}/mo
                        </strong>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[11px] text-slate-400 block mb-0.5">Service</span>
                        <strong className="text-xs font-bold font-mono text-cyan-400">
                          {selectedPacket.payload.service} ({selectedPacket.payload.command})
                        </strong>
                      </div>
                    </div>

                    <div className="mt-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300">
                      <span className="text-slate-400">Blast Radius:</span>{' '}
                      <span className="text-slate-200">{selectedPacket.impact_assessment.blast_radius}</span>
                    </div>
                  </div>

                  {/* Equivalent AWS CLI preview */}
                  {selectedPacket.payload.cli_command && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-mono">Downstream AWS CLI Command:</span>
                        <button
                          onClick={() => handleCopy(selectedPacket.payload.cli_command!, 'cli')}
                          className="hover:text-white flex items-center gap-1 text-[11px]"
                        >
                          {copiedKey === 'cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'cli' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300 overflow-x-auto">
                        {selectedPacket.payload.cli_command}
                      </pre>
                    </div>
                  )}

                </div>
              )}

              {/* View 2: Structured JSON for Lambda / EventBridge execution */}
              {activeTab === 'json' && (
                <div className="py-4 space-y-3 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-mono">
                      Downstream SDK / Lambda Execution Payload (Strict Schema)
                    </span>
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedPacket.payload, null, 2), 'json')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === 'json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'json' ? 'Copied' : 'Copy JSON'}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[380px] leading-relaxed">
                    {JSON.stringify(selectedPacket.payload, null, 2)}
                  </pre>
                </div>
              )}

              {/* View 3: Slack Webhook Block Preview */}
              {activeTab === 'slack' && (
                <div className="py-4 space-y-3 flex-1">
                  <div className="p-4 rounded-xl bg-[#1A1D21] border border-[#2C3136] text-[#D1D2D3] font-sans text-xs space-y-3 shadow-inner">
                    <div className="flex items-center gap-2 border-b border-[#2C3136] pb-2 text-[11px] text-[#ABABAD]">
                      <span className="font-bold text-[#E8912D]">#aws-ops-approvals</span>
                      <span>•</span>
                      <span>BOT: AWS AI Agent</span>
                    </div>
                    <div className="font-bold text-sm text-white">
                      🚨 AWS AI Approval Request: {selectedPacket.payload.service} {selectedPacket.payload.command}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#222529] p-3 rounded">
                      <div><strong className="text-slate-400">Resource:</strong> <code className="bg-[#1A1D21] px-1 py-0.5 rounded text-amber-300">{selectedPacket.payload.resource_id}</code></div>
                      <div><strong className="text-slate-400">Risk Level:</strong> <span className="text-rose-400 font-bold">{selectedPacket.impact_assessment.risk_level}</span></div>
                      <div><strong className="text-slate-400">Est. Downtime:</strong> {selectedPacket.impact_assessment.estimated_downtime}</div>
                      <div><strong className="text-slate-400">Cost Impact:</strong> ${selectedPacket.impact_assessment.cost_impact_monthly_usd.toFixed(2)}/mo</div>
                    </div>
                    <p className="text-xs text-[#D1D2D3]">
                      <strong>Incident Summary:</strong> {selectedPacket.incident_summary}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => onApprove(selectedPacket.id)}
                        disabled={selectedPacket.status !== 'PENDING'}
                        className="px-3 py-1.5 bg-[#007A5A] hover:bg-[#148567] text-white font-bold rounded text-xs"
                      >
                        Approve & Execute
                      </button>
                      <button
                        onClick={() => onReject(selectedPacket.id)}
                        disabled={selectedPacket.status !== 'PENDING'}
                        className="px-3 py-1.5 bg-[#E01E5A] hover:bg-[#C91A4F] text-white font-bold rounded text-xs"
                      >
                        Reject / Abort
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* View 4: Microsoft Teams Adaptive Card Preview */}
              {activeTab === 'teams' && (
                <div className="py-4 space-y-3 flex-1">
                  <div className="p-4 rounded-xl bg-[#202020] border border-[#3b3b3b] text-[#f5f5f5] text-xs space-y-3">
                    <div className="flex items-center justify-between text-[#a0a0a0] text-[11px]">
                      <span>Microsoft Teams Adaptive Card Payload</span>
                      <span className="font-mono">{selectedPacket.id}</span>
                    </div>
                    <div className="border-l-4 border-amber-500 pl-3">
                      <h4 className="font-bold text-white text-sm">
                        AWS AI Approval Required: {selectedPacket.payload.service} - {selectedPacket.payload.command}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        Resource: <span className="font-mono text-amber-300">{selectedPacket.payload.resource_id}</span>
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-[#2d2d2d] text-xs space-y-1">
                      <div>• Estimated Downtime: <strong>{selectedPacket.impact_assessment.estimated_downtime}</strong></div>
                      <div>• Monthly Cost Delta: <strong>${selectedPacket.impact_assessment.cost_impact_monthly_usd.toFixed(2)}</strong></div>
                      <div>• Blast Radius: <strong>{selectedPacket.impact_assessment.blast_radius}</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Approval Buttons / Execution Action Bar */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  {selectedPacket.status === 'PENDING' ? (
                    <span>Awaiting authorization from authorized SRE / Cloud Architect</span>
                  ) : selectedPacket.status === 'APPROVED' ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Action approved and dispatched to AWS execution pipeline
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Action rejected by human supervisor
                    </span>
                  )}
                </div>

                {selectedPacket.status === 'PENDING' && (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onReject(selectedPacket.id)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Reject / Abort</span>
                    </button>
                    <button
                      onClick={() => onApprove(selectedPacket.id)}
                      className="flex-1 sm:flex-none px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-slate-950 font-bold" />
                      <span>Approve & Execute</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};
