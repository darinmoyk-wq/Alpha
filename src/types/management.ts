/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ManagementPillarId =
  | 'governance'
  | 'finops'
  | 'reliability'
  | 'security'
  | 'observability'
  | 'integrations'
  | 'organizations'
  | 'containers'
  | 'databases'
  | 'compliance';

export type FeatureStatus = 'ENFORCED' | 'MONITORING' | 'DISABLED';

export interface ManagementFeature {
  id: string;
  pillarId: ManagementPillarId;
  name: string;
  description: string;
  awsService: string;
  status: FeatureStatus;
  autonomyImpact: 'Level 1' | 'Level 2' | 'Safety Guardrail' | 'Telemetry';
  lastTriggered?: string;
  metricsLabel?: string;
  metricsValue?: string;
  configKey?: string;
  configValue?: string | number | boolean;
  configType?: 'toggle' | 'number' | 'select' | 'text';
  configOptions?: string[];
}

export interface ManagementPillar {
  id: ManagementPillarId;
  title: string;
  subtitle: string;
  iconName: string;
  color: string;
  featuresCount: number;
}
