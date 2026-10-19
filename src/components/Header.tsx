/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Server, 
  AlertTriangle, 
  DollarSign, 
  Zap, 
  Flame, 
  Activity, 
  Clock, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { AutonomyMode } from '../types/index.ts';

interface HeaderProps {
  autonomyMode: AutonomyMode;
  setAutonomyMode: (mode: AutonomyMode) => void;
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  pendingApprovalsCount: number;
  autonomousActionsCount: number;
  onOpenChaosModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  autonomyMode,
  setAutonomyMode,
  selectedRegion,
  setSelectedRegion,
  pendingApprovalsCount,
  autonomousActionsCount,
  onOpenChaosModal,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      {/* Top tier brand and status bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/40">
              <Cpu className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">
                  AWS <span className="text-amber-400">AI</span>
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/30">
                  AUTONOMOUS CLOUD ENGINEER
                </span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs text-emerald-400 font-mono hidden sm:inline">
                  24/7 ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="font-mono text-slate-300">aws://1284-9023-4411 (Production Core)</span>
                <span>•</span>
                <span>Uptime: <strong className="text-emerald-400">99.98%</strong></span>
              </p>
            </div>
          </div>

          {/* Controls: Region, Autonomy Mode, Chaos Injector */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {/* Region Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 mr-2 font-mono">Region:</span>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
                aria-label="Select AWS Region"
              >
                <option value="us-east-1" className="bg-slate-900 text-slate-200">us-east-1 (N. Virginia)</option>
                <option value="us-west-2" className="bg-slate-900 text-slate-200">us-west-2 (Oregon)</option>
                <option value="eu-west-1" className="bg-slate-900 text-slate-200">eu-west-1 (Ireland)</option>
              </select>
            </div>

            {/* Autonomy Mode Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setAutonomyMode('FULL_AUTO')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  autonomyMode === 'FULL_AUTO'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Level 1 actions execute immediately; Level 2 prompts for user approval"
              >
                Full Auto
              </button>
              <button
                onClick={() => setAutonomyMode('SUPERVISED')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  autonomyMode === 'SUPERVISED'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Supervised mode requires approval for all medium-high changes"
              >
                Supervised
              </button>
              <button
                onClick={() => setAutonomyMode('DRY_RUN')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  autonomyMode === 'DRY_RUN'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Simulates actions without making AWS SDK changes"
              >
                Dry Run
              </button>
            </div>

            {/* Chaos Simulator / Inject Incident button */}
            <button
              onClick={onOpenChaosModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold transition-colors"
            >
              <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Simulate Incident</span>
            </button>
          </div>
        </div>

        {/* Live operational KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-3 pt-3 border-t border-slate-900/80 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Autonomous Actions (24h):</span>
            <strong className="text-white font-mono">{autonomousActionsCount}</strong>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Pending Approvals:</span>
            <strong className={`font-mono px-1.5 py-0.2 rounded ${pendingApprovalsCount > 0 ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400'}`}>
              {pendingApprovalsCount}
            </strong>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <span>Spend Velocity:</span>
            <span className="text-slate-400 font-mono"><strong className="text-white">$14,280</strong> / $16k mo</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Threats Mitigated:</span>
            <strong className="text-emerald-300 font-mono">142 IPs blocked</strong>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-slate-900">
        {[
          { id: 'copilot', label: 'Copilot & Dispatcher', count: null },
          { id: 'approvals', label: 'Approvals Queue', count: pendingApprovalsCount },
          { id: 'matrix', label: 'Autonomy Matrix & Rules', count: null },
          { id: 'management', label: 'AI Governance & Controls (120+)', count: 125, isHighlight: true },
          { id: 'infrastructure', label: 'AWS Resources', count: null },
          { id: 'terminal', label: 'JSON Execution Log', count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-amber-400 text-amber-300 bg-amber-400/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${
                tab.isHighlight
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : tab.count > 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </header>
  );
};
