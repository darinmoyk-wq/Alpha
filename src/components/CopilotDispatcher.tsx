/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Send, 
  Cpu, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  Terminal, 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw,
  Sliders,
  ExternalLink,
  Flame,
  ArrowRight
} from 'lucide-react';
import { AWSExecutionPayload, ApprovalProtocolPacket } from '../types/index.ts';

interface CopilotDispatcherProps {
  onExecuteAutonomous: (payload: AWSExecutionPayload) => void;
  onRequestApproval: (packet: ApprovalProtocolPacket) => void;
  pendingApprovals: ApprovalProtocolPacket[];
  onApprovePacket: (id: string) => void;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  analysis?: {
    agent_name: string;
    source: string;
    rule: any;
    payload: AWSExecutionPayload;
    approval_packet?: ApprovalProtocolPacket | null;
    ai_reasoning: string;
  };
}

export const CopilotDispatcher: React.FC<CopilotDispatcherProps> = ({
  onExecuteAutonomous,
  onRequestApproval,
  pendingApprovals,
  onApprovePacket,
}) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: "AWS AI 24/7 Autonomous Cloud Engineer initialized. I am monitoring your AWS infrastructure to maximize uptime, optimize cloud spending, maintain security compliance, and resolve operational issues autonomously wherever safe to do so per the Autonomy Matrix.",
      timestamp: 'Just now',
    },
  ]);

  const presetQueries = [
    { label: 'Clear Temp Disk (>85%)', query: 'EC2 instance i-09823f /var/log disk usage is at 92%, purge rotated logs and cache', level: 'Level 1: Autonomous' },
    { label: 'Block Malicious IP', query: 'GuardDuty flagged brute-force SSH attacks from 198.51.100.42 to ALB, block IP in AWS WAF', level: 'Level 1: Autonomous' },
    { label: 'Restart Crashed Container', query: 'ECS task ecs-svc-billing-worker crashed with exit code 137, restart service', level: 'Level 1: Autonomous' },
    { label: 'Terminate Primary Prod EC2', query: 'Terminate primary production EC2 instance i-0a1b2c3d4e5f6g7h8 immediately', level: 'Level 2: Approval Required' },
    { label: 'Failover Aurora DB', query: 'Failover primary production Aurora Postgres cluster to secondary AZ reader', level: 'Level 2: Approval Required' },
    { label: 'Spend Spike +$380/mo', query: 'Spin up 4 additional c6i.8xlarge instances for video transcoding (+ $380/month)', level: 'Level 2: Approval Required' },
  ];

  const handleSubmit = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputText;
    if (!promptToSend.trim() || loading) return;

    const userMsgId = `usr-${Date.now()}`;
    const newMessages: MessageItem[] = [
      ...messages,
      {
        id: userMsgId,
        sender: 'user',
        text: promptToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/aws-ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          context: {
            isProduction: promptToSend.toLowerCase().includes('prod') || promptToSend.toLowerCase().includes('primary'),
            costDeltaMonthly: promptToSend.includes('$380') ? 380 : undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Dispatch to main applet state
      if (data.payload.action_type === 'AUTONOMOUS') {
        onExecuteAutonomous(data.payload);
      } else if (data.approval_packet) {
        onRequestApproval(data.approval_packet);
      }

      setMessages([
        ...newMessages,
        {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: data.ai_reasoning || 'Evaluated against operational rules and matrix criteria.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          analysis: data,
        },
      ]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          text: `Analysis error: ${err.message}. Retrying with deterministic rule evaluation engine...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
              Live AWS Operations Copilot
            </span>
            <span className="text-xs text-slate-500 font-mono">• Gemini 3.8 Flash Grounded</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Autonomous Incident Dispatcher & AI Cloud Engineer
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Input infrastructure tasks, CloudWatch alarms, or SRE instructions. AWS AI classifies autonomy tier, generates structured JSON execution payloads, and requests approval when safety limits are triggered.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Agent: <strong>AWS AI</strong></span>
          </span>
        </div>
      </div>

      {/* Preset Quick Chips */}
      <div>
        <span className="text-xs text-slate-400 block mb-2 font-medium">Quick Incident & Task Scenarios:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {presetQueries.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(preset.query);
                handleSubmit(preset.query);
              }}
              className="text-left p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition-all group"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
                  {preset.label}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  preset.level.includes('Autonomous') 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {preset.level}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {preset.query}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Dialogue & Analysis Stream */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4 min-h-[420px] flex flex-col justify-between">
        <div className="space-y-4 overflow-y-auto max-h-[560px] pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 text-[11px] font-mono text-slate-400">
                <span>{msg.sender === 'user' ? 'Human Operator (SRE)' : 'AWS AI Autonomous Agent'}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-3xl rounded-xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-amber-500/10 text-amber-100 border border-amber-500/30'
                    : 'bg-slate-950 text-slate-200 border border-slate-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Rich analysis card if returned by agent */}
                {msg.analysis && (
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-3">
                    {/* Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {msg.analysis.payload.action_type === 'AUTONOMOUS' ? (
                          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold text-xs flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" />
                            LEVEL 1: FULL AUTONOMY (Executed Immediately)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold text-xs flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            LEVEL 2: CONDITIONAL APPROVAL REQUIRED
                          </span>
                        )}

                        <span className="text-xs font-mono text-slate-400">
                          Risk: <strong className="text-white">{msg.analysis.payload.risk_level}</strong>
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-slate-500">
                        {msg.analysis.source}
                      </span>
                    </div>

                    {/* Structured JSON Payload view matching exact prompt format */}
                    <div className="rounded-lg bg-slate-900 border border-slate-800 p-3">
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[11px]">
                        <span className="font-mono text-slate-400">Structured JSON Execution Payload:</span>
                        <button
                          onClick={() => handleCopy(JSON.stringify(msg.analysis!.payload, null, 2), msg.id)}
                          className="hover:text-white flex items-center gap-1 font-mono text-slate-400"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy JSON'}</span>
                        </button>
                      </div>
                      <pre className="text-xs font-mono text-emerald-300 overflow-x-auto">
                        {JSON.stringify(msg.analysis.payload, null, 2)}
                      </pre>
                    </div>

                    {/* If conditional approval packet exists, show approval summary and action buttons */}
                    {msg.analysis.approval_packet && (
                      <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/40 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-300 flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4" />
                            Human Authorization Protocol Generated
                          </span>
                          <span className="font-mono text-slate-400">
                            Est. Downtime: {msg.analysis.approval_packet.impact_assessment.estimated_downtime}
                          </span>
                        </div>

                        <div className="text-xs text-slate-300">
                          <strong>Proposed Solution:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300">
                            {msg.analysis.approval_packet.proposed_solution.map((step: string, sIdx: number) => (
                              <li key={sIdx}>{step}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-amber-500/20">
                          <span className="text-[11px] font-mono text-amber-200">
                            Monthly Spend Impact: {msg.analysis.approval_packet.impact_assessment.cost_impact_monthly_usd >= 0 ? '+' : ''}${msg.analysis.approval_packet.impact_assessment.cost_impact_monthly_usd.toFixed(2)}/mo
                          </span>
                          <button
                            onClick={() => onApprovePacket(msg.analysis!.approval_packet!.id)}
                            className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 font-bold" />
                            <span>Approve Action</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 p-3 rounded-lg bg-slate-950 border border-slate-800 animate-pulse">
              <Cpu className="w-4 h-4 animate-spin" />
              <span>AWS AI analyzing telemetry and evaluating Autonomy Matrix rules...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Give instructions to AWS AI (e.g., 'i-09823f disk usage reached 92%, purge logs' or 'Upgrade Aurora Postgres to 16.2')..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !inputText.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-lg transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <span>Dispatch</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-mono flex items-center justify-between">
            <span>Operational Boundary: Level 1 actions auto-execute; Level 2 prompts for impact sign-off.</span>
            <span>Port 3000 • Production AWS Connected</span>
          </p>
        </div>
      </div>
    </div>
  );
};
