/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  Filter, 
  Search, 
  Zap, 
  ShieldAlert, 
  Trash2,
  ExternalLink
} from 'lucide-react';
import { AWSExecutionPayload } from '../types/index.ts';

interface ExecutionTerminalProps {
  logs: AWSExecutionPayload[];
  onClearLogs: () => void;
}

export const ExecutionTerminal: React.FC<ExecutionTerminalProps> = ({ logs, onClearLogs }) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [search, setSearch] = useState<string>('');

  const filteredLogs = logs.filter((item) => {
    const matchesType = filterType === 'ALL' || item.action_type === filterType;
    const matchesSearch =
      item.command.toLowerCase().includes(search.toLowerCase()) ||
      item.resource_id.toLowerCase().includes(search.toLowerCase()) ||
      item.service.toLowerCase().includes(search.toLowerCase()) ||
      item.reason.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCopy = (payload: AWSExecutionPayload, index: number) => {
    // Generate strictly the user's requested 7-field JSON format or full payload
    const strictFormat = {
      agent_name: payload.agent_name,
      action_type: payload.action_type,
      service: payload.service,
      command: payload.command,
      resource_id: payload.resource_id,
      reason: payload.reason,
      risk_level: payload.risk_level,
    };

    navigator.clipboard.writeText(JSON.stringify(strictFormat, null, 2));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadAll = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aws-ai-execution-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <span>Downstream SDK & Lambda Execution Terminal</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Structured JSON event stream ready for Boto3, AWS Lambda, EventBridge, or Terraform triggers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Action type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Actions ({logs.length})</option>
            <option value="AUTONOMOUS">Autonomous Only</option>
            <option value="APPROVAL_REQUIRED">Approval Required</option>
          </select>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search command or resource..."
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-400 font-mono w-44"
          />

          {/* Download JSON */}
          <button
            onClick={handleDownloadAll}
            disabled={logs.length === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          {/* Clear */}
          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
            title="Clear terminal logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal log feed */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-xl">
          <Terminal className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No execution payloads recorded matching current filter.</p>
        </div>
      ) : (
        <div className="space-y-3 font-mono">
          {filteredLogs.map((item, index) => {
            const strictFormat = {
              agent_name: item.agent_name,
              action_type: item.action_type,
              service: item.service,
              command: item.command,
              resource_id: item.resource_id,
              reason: item.reason,
              risk_level: item.risk_level,
            };

            return (
              <div
                key={index}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-900 text-xs">
                  <div className="flex items-center gap-2">
                    {item.action_type === 'AUTONOMOUS' ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3" /> AUTONOMOUS
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> APPROVAL_REQUIRED
                      </span>
                    )}

                    <span className="text-cyan-400 font-bold">{item.service}</span>
                    <span className="text-slate-500">::</span>
                    <span className="text-white font-semibold">{item.command}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-amber-300">{item.resource_id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">
                      {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Recent'}
                    </span>
                    <button
                      onClick={() => handleCopy(item, index)}
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] flex items-center gap-1 transition-colors"
                    >
                      {copiedIndex === index ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Structured JSON code block */}
                <pre className="text-xs text-emerald-400/90 overflow-x-auto p-3 rounded-lg bg-slate-900/90 border border-slate-800/80 leading-relaxed">
                  {JSON.stringify(strictFormat, null, 2)}
                </pre>

                {/* CLI Command row */}
                {item.cli_command && (
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2 overflow-x-auto">
                    <span className="text-slate-500 shrink-0">CLI Equivalent:</span>
                    <code className="text-amber-300 bg-slate-900 px-2 py-0.5 rounded shrink-0">
                      {item.cli_command}
                    </code>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
