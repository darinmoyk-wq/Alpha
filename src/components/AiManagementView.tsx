/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  DollarSign, 
  Zap, 
  Lock, 
  Activity, 
  Terminal, 
  Layers, 
  Cpu, 
  Database, 
  FileCheck,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Sparkles,
  RefreshCw,
  X,
  Check,
  ChevronRight,
  ExternalLink,
  Settings2
} from 'lucide-react';
import { ManagementFeature, ManagementPillarId, FeatureStatus } from '../types/management.ts';
import { ALL_MANAGEMENT_FEATURES, MANAGEMENT_PILLARS } from '../data/managementFeatures.ts';

interface AiManagementViewProps {
  onNotify: (message: string, type: 'success' | 'warning') => void;
}

export const AiManagementView: React.FC<AiManagementViewProps> = ({ onNotify }) => {
  const [features, setFeatures] = useState<ManagementFeature[]>(ALL_MANAGEMENT_FEATURES);
  const [selectedPillar, setSelectedPillar] = useState<ManagementPillarId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | FeatureStatus>('ALL');
  const [activeConfigFeature, setActiveConfigFeature] = useState<ManagementFeature | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'scp_json' | 'terraform' | 'control_tower_yaml'>('scp_json');

  // Summary counts
  const totalCount = features.length;
  const enforcedCount = features.filter(f => f.status === 'ENFORCED').length;
  const monitoringCount = features.filter(f => f.status === 'MONITORING').length;
  const disabledCount = features.filter(f => f.status === 'DISABLED').length;

  // Filter features
  const filteredFeatures = useMemo(() => {
    return features.filter((feat) => {
      const matchesPillar = selectedPillar === 'all' || feat.pillarId === selectedPillar;
      const matchesStatus = statusFilter === 'ALL' || feat.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        feat.name.toLowerCase().includes(q) ||
        feat.description.toLowerCase().includes(q) ||
        feat.awsService.toLowerCase().includes(q) ||
        feat.id.toLowerCase().includes(q);
      return matchesPillar && matchesStatus && matchesQuery;
    });
  }, [features, selectedPillar, statusFilter, searchQuery]);

  // Handle toggling feature status
  const handleToggleStatus = (id: string) => {
    setFeatures(prev =>
      prev.map(f => {
        if (f.id === id) {
          const nextStatus: FeatureStatus =
            f.status === 'ENFORCED' ? 'MONITORING' : f.status === 'MONITORING' ? 'DISABLED' : 'ENFORCED';
          onNotify(`Updated ${f.name} to ${nextStatus}`, 'success');
          return { ...f, status: nextStatus };
        }
        return f;
      })
    );
  };

  // Preset profiles
  const applyPresetProfile = (preset: 'autonomy' | 'finops' | 'banking' | 'well_architected') => {
    setFeatures(prev =>
      prev.map(f => {
        if (preset === 'autonomy') {
          // Maximum autonomy: Enforce Level 1, monitor governance
          return {
            ...f,
            status: f.autonomyImpact === 'Level 1' || f.autonomyImpact === 'Telemetry' ? 'ENFORCED' : 'MONITORING',
          };
        } else if (preset === 'finops') {
          // Strict FinOps: Enforce all cost rules
          return {
            ...f,
            status: f.pillarId === 'finops' || f.id === 'FIN-01' ? 'ENFORCED' : f.status,
          };
        } else if (preset === 'banking') {
          // Zero-Trust Banking: All security & compliance strictly enforced
          return {
            ...f,
            status: f.pillarId === 'security' || f.pillarId === 'compliance' || f.autonomyImpact === 'Level 2' ? 'ENFORCED' : f.status,
          };
        } else {
          // Well-architected baseline
          return { ...f, status: 'ENFORCED' };
        }
      })
    );
    onNotify(`Applied '${preset.replace('_', ' ').toUpperCase()}' management profile across all 125 features`, 'success');
  };

  const getPillarIcon = (pillarId: ManagementPillarId) => {
    switch (pillarId) {
      case 'governance': return <Shield className="w-4 h-4 text-amber-400" />;
      case 'finops': return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'reliability': return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'security': return <Lock className="w-4 h-4 text-rose-400" />;
      case 'observability': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'integrations': return <Terminal className="w-4 h-4 text-purple-400" />;
      case 'organizations': return <Layers className="w-4 h-4 text-indigo-400" />;
      case 'containers': return <Cpu className="w-4 h-4 text-orange-400" />;
      case 'databases': return <Database className="w-4 h-4 text-teal-400" />;
      case 'compliance': return <FileCheck className="w-4 h-4 text-emerald-400" />;
      default: return <Sliders className="w-4 h-4 text-slate-400" />;
    }
  };

  // Generate exported policy
  const generateExportText = () => {
    if (exportFormat === 'scp_json') {
      return JSON.stringify(
        {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AwsAiAutonomousGovernancePolicy',
              Effect: 'Deny',
              Action: [
                'ec2:TerminateInstances',
                'rds:DeleteDBInstance',
                'rds:FailoverDBCluster',
                'iam:PutRolePolicy',
                'iam:AttachRolePolicy',
              ],
              Resource: '*',
              Condition: {
                StringNotEquals: {
                  'aws:PrincipalTag/AutonomyTier': 'AuthorizedHumanSRE',
                },
                NumericGreaterThan: {
                  'aws:RequestCostDeltaUSD': '100',
                },
              },
            },
            {
              Sid: 'AwsAiEnforcedFeatures',
              Effect: 'Allow',
              Action: features.filter(f => f.status === 'ENFORCED').map(f => `${f.awsService.toLowerCase().replace(/[^a-z0-9]/g, '')}:*`),
              Resource: '*',
            },
          ],
        },
        null,
        2
      );
    } else if (exportFormat === 'terraform') {
      return `# AWS AI Autonomous Cloud Engineer - Terraform Governance Configuration
# 125 Enforced Management Controls & Safeguards

resource "aws_organizations_policy" "ai_governance" {
  name        = "AWS-AI-Autonomous-Guardrails"
  description = "Mandatory 120+ management constraints and autonomy boundaries"
  type        = "SERVICE_CONTROL_POLICY"

  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "RequireHumanApprovalForHighSpend"
        Effect = "Deny"
        Action = ["*"]
        Resource = ["*"]
        Condition = {
          NumericGreaterThan = {
            "aws:RequestCostDeltaUSD" = "100"
          }
        }
      }
    ]
  })
}

resource "aws_appconfig_configuration_profile" "aws_ai_matrix" {
  application_id = "aws-ai-core"
  name           = "AutonomyMatrixConfig"
  location_uri   = "hosted"

  validator {
    type    = "JSON_SCHEMA"
    content = file("schema.json")
  }
}`;
    } else {
      return `# AWS Control Tower Guardrails Specification for AWS AI
AWSTemplateFormatVersion: '2010-09-09'
Description: '120+ Enterprise AI Controls, Security Baselines & FinOps Guardrails'

Parameters:
  AutonomyMode:
    Type: String
    Default: 'FullAuto'
  MaxMonthlySpendCeilingUSD:
    Type: Number
    Default: 100

Resources:
  AwsAiKillSwitchFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: AwsAiEmergencyKillSwitch
      Runtime: nodejs22.x
      Handler: index.handler
      Role: !GetAtt AwsAiSecurityExecutionRole.Arn

Outputs:
  ActiveControlsCount:
    Value: "125"
    Description: Total enterprise management controls provisioned`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: 120+ Features Announcement */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                125 ENTERPRISE AI MANAGEMENT CAPABILITIES
              </span>
              <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> SOC-2 & AWS Well-Architected Certified
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              AWS AI Management, Governance & Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Comprehensive suite of <strong>125 modular controls</strong> designed for AWS cloud administrators, FinOps directors, and SRE managers to govern, tune thresholds, monitor model telemetry, restrict blast radiuses, and audit AWS AI 24/7.
            </p>
          </div>

          {/* Quick preset selector & export */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
              <span className="text-slate-400 px-2 font-mono">Profile:</span>
              <select
                onChange={(e) => applyPresetProfile(e.target.value as any)}
                defaultValue="well_architected"
                className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer pr-2"
                aria-label="Select AI Management Profile"
              >
                <option value="well_architected" className="bg-slate-900 text-slate-200">Well-Architected (Default)</option>
                <option value="autonomy" className="bg-slate-900 text-slate-200">Maximum Autonomy</option>
                <option value="finops" className="bg-slate-900 text-slate-200">Strict FinOps Guardrail</option>
                <option value="banking" className="bg-slate-900 text-slate-200">Zero-Trust Banking (SOC2/PCI)</option>
              </select>
            </div>

            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/10"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>Export Policy / IaC</span>
            </button>
          </div>
        </div>

        {/* Global Control KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Total AI Controls</span>
            <strong className="text-lg text-white font-bold">{totalCount}</strong>
            <span className="text-[10px] text-slate-500 block">Across 10 Pillars</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-emerald-500/20">
            <span className="text-emerald-400 block text-[11px]">Enforced (Active)</span>
            <strong className="text-lg text-emerald-300 font-bold">{enforcedCount}</strong>
            <span className="text-[10px] text-emerald-500/80 block">{Math.round((enforcedCount / totalCount) * 100)}% Coverage</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-amber-500/20">
            <span className="text-amber-400 block text-[11px]">Audit / Monitoring</span>
            <strong className="text-lg text-amber-300 font-bold">{monitoringCount}</strong>
            <span className="text-[10px] text-amber-500/80 block">Telemetry Only</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Compliance Score</span>
            <strong className="text-lg text-cyan-300 font-bold">99.4%</strong>
            <span className="text-[10px] text-cyan-500/80 block">Zero Critical Drift</span>
          </div>
        </div>
      </div>

      {/* 10 Architectural Pillars Horizontal Scroll / Grid */}
      <div>
        <div className="flex items-center justify-between pb-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Architectural Management Pillars:
          </span>
          <span className="text-xs font-mono text-slate-500">
            Showing {filteredFeatures.length} of {totalCount} features
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            onClick={() => setSelectedPillar('all')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedPillar === 'all'
                ? 'bg-amber-400/10 border-amber-400/60 text-white ring-1 ring-amber-400/30'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400">
                125
              </span>
            </div>
            <div className="text-xs font-bold truncate">All Controls</div>
            <div className="text-[10px] text-slate-500 truncate">Unified Catalog</div>
          </button>

          {MANAGEMENT_PILLARS.map((p) => {
            const isSelected = selectedPillar === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPillar(p.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-amber-400/10 border-amber-400/60 text-white ring-1 ring-amber-400/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  {getPillarIcon(p.id)}
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400">
                    {p.featuresCount}
                  </span>
                </div>
                <div className="text-xs font-bold truncate">{p.title}</div>
                <div className="text-[10px] text-slate-500 truncate">{p.featuresCount} features</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across 125 features by name, AWS service, keyword, or ID (e.g. 'kill switch', 'gp3', 'WAF', 'Karpenter')..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-2 py-1 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Statuses ({features.length})</option>
            <option value="ENFORCED">Enforced ({enforcedCount})</option>
            <option value="MONITORING">Monitoring ({monitoringCount})</option>
            <option value="DISABLED">Disabled ({disabledCount})</option>
          </select>
        </div>
      </div>

      {/* Feature Cards Grid (125 Features) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredFeatures.map((feat) => {
          const isEnforced = feat.status === 'ENFORCED';
          const isMonitoring = feat.status === 'MONITORING';

          return (
            <div
              key={feat.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                isEnforced
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  : isMonitoring
                  ? 'bg-slate-900/60 border-amber-500/20'
                  : 'bg-slate-950/60 border-slate-900 opacity-60'
              }`}
            >
              <div>
                {/* Header: ID, Service, Status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-slate-400 border border-slate-800">
                      {feat.id}
                    </span>
                    <span className="text-xs font-mono font-semibold text-cyan-400 truncate max-w-[130px]">
                      {feat.awsService}
                    </span>
                  </div>

                  {/* Status badge and toggle button */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(feat.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                        isEnforced
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : isMonitoring
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                      }`}
                      title="Click to toggle Enforced -> Monitoring -> Disabled"
                    >
                      {feat.status}
                    </button>
                  </div>
                </div>

                {/* Feature Title */}
                <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">
                  {feat.name}
                </h4>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-3">
                  {feat.description}
                </p>
              </div>

              {/* Bottom specs & config */}
              <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 truncate">{feat.metricsLabel || 'Impact'}:</span>
                  <strong className="text-amber-300 truncate ml-1">{feat.metricsValue || feat.autonomyImpact}</strong>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    feat.autonomyImpact === 'Level 1' ? 'bg-emerald-500/10 text-emerald-400' :
                    feat.autonomyImpact === 'Level 2' ? 'bg-amber-500/10 text-amber-400' :
                    feat.autonomyImpact === 'Safety Guardrail' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-blue-500/10 text-blue-400'
                  }`}>
                    {feat.autonomyImpact}
                  </span>

                  <button
                    onClick={() => setActiveConfigFeature(feat)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Configure</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFeatures.length === 0 && (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-sm text-slate-400">No AI management features found matching your search.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedPillar('all');
              setStatusFilter('ALL');
            }}
            className="mt-2 text-xs text-amber-400 font-bold hover:underline"
          >
            Reset filters to view all 125 controls
          </button>
        </div>
      )}

      {/* Feature Configuration Modal / Drawer */}
      {activeConfigFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  {activeConfigFeature.id} • {activeConfigFeature.awsService}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {activeConfigFeature.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveConfigFeature(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {activeConfigFeature.description}
            </p>

            <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-mono">Enforcement Mode:</label>
                <select
                  value={activeConfigFeature.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as FeatureStatus;
                    setActiveConfigFeature({ ...activeConfigFeature, status: newStatus });
                    setFeatures(prev =>
                      prev.map(f => (f.id === activeConfigFeature.id ? { ...f, status: newStatus } : f))
                    );
                    onNotify(`Updated ${activeConfigFeature.name} to ${newStatus}`, 'success');
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 font-mono"
                >
                  <option value="ENFORCED">ENFORCED (Strict Policy Block)</option>
                  <option value="MONITORING">MONITORING (Audit & Log Only)</option>
                  <option value="DISABLED">DISABLED (Bypass Control)</option>
                </select>
              </div>

              {activeConfigFeature.configKey && (
                <div>
                  <label className="text-slate-400 block mb-1 font-mono">
                    Parameter: <strong className="text-slate-200">{activeConfigFeature.configKey}</strong>
                  </label>
                  {activeConfigFeature.configType === 'toggle' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(activeConfigFeature.configValue)}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setActiveConfigFeature({ ...activeConfigFeature, configValue: val });
                          setFeatures(prev =>
                            prev.map(f => (f.id === activeConfigFeature.id ? { ...f, configValue: val } : f))
                          );
                        }}
                        className="rounded bg-slate-900 border-slate-700"
                        id="toggle-val"
                      />
                      <label htmlFor="toggle-val" className="text-slate-200 font-mono">
                        {activeConfigFeature.configValue ? 'Enabled (Active)' : 'Disabled'}
                      </label>
                    </div>
                  ) : activeConfigFeature.configType === 'select' && activeConfigFeature.configOptions ? (
                    <select
                      value={String(activeConfigFeature.configValue)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setActiveConfigFeature({ ...activeConfigFeature, configValue: val });
                        setFeatures(prev =>
                          prev.map(f => (f.id === activeConfigFeature.id ? { ...f, configValue: val } : f))
                        );
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 font-mono"
                    >
                      {activeConfigFeature.configOptions.map((opt, oIdx) => (
                        <option key={oIdx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={activeConfigFeature.configType === 'number' ? 'number' : 'text'}
                      value={String(activeConfigFeature.configValue ?? '')}
                      onChange={(e) => {
                        const val = activeConfigFeature.configType === 'number' ? Number(e.target.value) : e.target.value;
                        setActiveConfigFeature({ ...activeConfigFeature, configValue: val });
                        setFeatures(prev =>
                          prev.map(f => (f.id === activeConfigFeature.id ? { ...f, configValue: val } : f))
                        );
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 font-mono"
                    />
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
                <span>Autonomy Classification: </span>
                <strong className="text-amber-400">{activeConfigFeature.autonomyImpact}</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setActiveConfigFeature(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onNotify(`Simulated test run on ${activeConfigFeature.name}: Policy Healthy (0 violations)`, 'success');
                  setActiveConfigFeature(null);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-colors shadow-md"
              >
                Test Policy Evaluation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Policy Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Export AWS AI 120+ Management Policy / IaC</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Export complete active governance rules to AWS Organizations, Terraform, or Control Tower.
                </p>
              </div>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3 text-xs">
              <button
                onClick={() => setExportFormat('scp_json')}
                className={`px-3 py-1.5 rounded-lg font-mono font-medium ${
                  exportFormat === 'scp_json' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-slate-950 text-slate-400'
                }`}
              >
                AWS SCP JSON
              </button>
              <button
                onClick={() => setExportFormat('terraform')}
                className={`px-3 py-1.5 rounded-lg font-mono font-medium ${
                  exportFormat === 'terraform' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-slate-950 text-slate-400'
                }`}
              >
                Terraform / OpenTofu (.tf)
              </button>
              <button
                onClick={() => setExportFormat('control_tower_yaml')}
                className={`px-3 py-1.5 rounded-lg font-mono font-medium ${
                  exportFormat === 'control_tower_yaml' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-slate-950 text-slate-400'
                }`}
              >
                Control Tower CloudFormation (.yaml)
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-y-auto max-h-[360px] leading-relaxed">
              {generateExportText()}
            </pre>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">125 Rules Included in Artifact</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generateExportText());
                  onNotify('Copied policy to clipboard!', 'success');
                  setShowExportModal(false);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-slate-950" />
                <span>Copy Specification</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
