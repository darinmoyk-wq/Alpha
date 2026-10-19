/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  Cpu, 
  Shield, 
  Lock, 
  Activity, 
  HardDrive, 
  Zap, 
  AlertTriangle, 
  Flame, 
  DollarSign, 
  CheckCircle2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { AWSResource, AWSService } from '../types/index.ts';

interface InfrastructureViewProps {
  resources: AWSResource[];
  onInjectResourceIncident: (resource: AWSResource, incidentType: string) => void;
}

export const InfrastructureView: React.FC<InfrastructureViewProps> = ({
  resources,
  onInjectResourceIncident,
}) => {
  const [filterService, setFilterService] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredResources = resources.filter((res) => {
    const matchesService = filterService === 'ALL' || res.service === filterService;
    const matchesSearch =
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.service.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesService && matchesSearch;
  });

  const getServiceIcon = (service: AWSService) => {
    switch (service) {
      case 'EC2': return <Server className="w-5 h-5 text-amber-400" />;
      case 'RDS': return <Database className="w-5 h-5 text-cyan-400" />;
      case 'ECS':
      case 'EKS': return <Cpu className="w-5 h-5 text-purple-400" />;
      case 'WAF':
      case 'GuardDuty': return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'ACM': return <Lock className="w-5 h-5 text-blue-400" />;
      default: return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">HEALTHY</span>;
      case 'DEGRADED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">DEGRADED</span>;
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">CRITICAL</span>;
      case 'REMEDIATING':
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse">REMEDIATING</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top filter and summary header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-amber-400" />
            <span>AWS Infrastructure & Fleet Topology</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time status of 24/7 monitored cloud resources across multi-AZ production architecture.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Service filter */}
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Services</option>
            <option value="EC2">EC2 Instances</option>
            <option value="RDS">RDS Aurora</option>
            <option value="ECS">ECS / EKS</option>
            <option value="WAF">WAF & Perimeter</option>
            <option value="ACM">ACM Ephemeral TLS</option>
          </select>

          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resource..."
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-400 w-40 sm:w-56 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Grid of Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((res) => (
          <div
            key={res.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-lg flex flex-col justify-between transition-all"
          >
            <div>
              {/* Header: Service, Name, Status */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    {getServiceIcon(res.service)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-slate-100 truncate max-w-[160px]">
                        {res.name}
                      </h4>
                      {res.isPrimaryProd && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          PROD
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 block truncate">
                      {res.id}
                    </span>
                  </div>
                </div>

                {getStatusBadge(res.status)}
              </div>

              {/* Specs & Region */}
              <div className="text-xs text-slate-300 space-y-1 mb-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Type: {res.type}</span>
                  <span>{res.region}</span>
                </div>
              </div>

              {/* Metric meters */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 font-mono">
                {res.metrics.cpuPercent !== undefined && (
                  <div>
                    <span className="text-[10px] text-slate-500 block">CPU Load</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full ${res.metrics.cpuPercent > 80 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                          style={{ width: `${res.metrics.cpuPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-200">{res.metrics.cpuPercent}%</span>
                    </div>
                  </div>
                )}

                {res.metrics.diskPercent !== undefined && (
                  <div>
                    <span className="text-[10px] text-slate-500 block">Disk Space</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full ${res.metrics.diskPercent > 85 ? 'bg-amber-500' : 'bg-cyan-400'}`}
                          style={{ width: `${res.metrics.diskPercent}%` }}
                        />
                      </div>
                      <span className={`text-[11px] ${res.metrics.diskPercent > 85 ? 'text-amber-400 font-bold' : 'text-slate-200'}`}>
                        {res.metrics.diskPercent}%
                      </span>
                    </div>
                  </div>
                )}

                {res.metrics.daysUntilSslExpire !== undefined && (
                  <div>
                    <span className="text-[10px] text-slate-500 block">SSL Validity</span>
                    <span className="text-[11px] text-blue-300 font-bold">
                      {res.metrics.daysUntilSslExpire} days left
                    </span>
                  </div>
                )}

                {res.metrics.trafficRps !== undefined && (
                  <div>
                    <span className="text-[10px] text-slate-500 block">Throughput</span>
                    <span className="text-[11px] text-emerald-300 font-bold">
                      {res.metrics.trafficRps} RPS
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-[10px] text-slate-500 block">Cost / Month</span>
                  <span className="text-[11px] text-slate-300 font-bold">
                    ${res.costMonthlyUSD.toFixed(2)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block">Availability</span>
                  <span className="text-[11px] text-emerald-400 font-bold">
                    {res.metrics.uptime || '99.98%'}
                  </span>
                </div>
              </div>

              {/* Last Autonomous Action */}
              {res.lastAutonomousAction && (
                <div className="mt-2.5 p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-tight">
                    <strong>Auto-Healed:</strong> {res.lastAutonomousAction}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Actions / Chaos Triggers */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">Inject Test:</span>
              <div className="flex items-center gap-1.5">
                {res.service === 'EC2' && (
                  <>
                    <button
                      onClick={() => onInjectResourceIncident(res, 'disk_92')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono"
                      title="Simulate disk usage > 85% to trigger Level 1 autonomous cleanup"
                    >
                      Fill Disk 92%
                    </button>
                    {res.isPrimaryProd && (
                      <button
                        onClick={() => onInjectResourceIncident(res, 'terminate_prod')}
                        className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-mono"
                        title="Trigger Level 2 Conditional Approval for primary prod termination"
                      >
                        Terminate
                      </button>
                    )}
                  </>
                )}

                {res.service === 'ECS' && (
                  <button
                    onClick={() => onInjectResourceIncident(res, 'crash_container')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono"
                    title="Simulate crashloop to trigger Level 1 autonomous container restart"
                  >
                    Crash Container
                  </button>
                )}

                {res.service === 'RDS' && (
                  <button
                    onClick={() => onInjectResourceIncident(res, 'failover_db')}
                    className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono"
                    title="Trigger Level 2 Conditional Approval for Aurora DB failover"
                  >
                    Failover
                  </button>
                )}

                {res.service === 'WAF' && (
                  <button
                    onClick={() => onInjectResourceIncident(res, 'guardduty_attack')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono"
                    title="Simulate GuardDuty brute-force finding to trigger Level 1 autonomous IP block"
                  >
                    Simulate Attack
                  </button>
                )}

                {res.service === 'ACM' && (
                  <button
                    onClick={() => onInjectResourceIncident(res, 'ssl_expire')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono"
                    title="Simulate cert expiring soon to trigger Level 1 autonomous certificate rotation"
                  >
                    Expire Soon
                  </button>
                )}

                {res.service === 'EKS' && (
                  <button
                    onClick={() => onInjectResourceIncident(res, 'upgrade_k8s')}
                    className="px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-mono"
                    title="Trigger Level 2 Conditional Approval for EKS version upgrade"
                  >
                    Upgrade v1.31
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
