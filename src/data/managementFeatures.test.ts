import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_MANAGEMENT_FEATURES, MANAGEMENT_PILLARS } from './managementFeatures.ts';

test('Management features catalog contains more than 120 enterprise features', () => {
  assert.ok(
    ALL_MANAGEMENT_FEATURES.length > 120,
    `Expected > 120 features, but found ${ALL_MANAGEMENT_FEATURES.length}`
  );
  assert.equal(ALL_MANAGEMENT_FEATURES.length, 125, 'Catalog should contain exactly 125 curated features');
});

test('All 10 architectural pillars are represented with correct feature counts', () => {
  assert.equal(MANAGEMENT_PILLARS.length, 10, 'Should have exactly 10 pillars');

  const totalFromPillars = MANAGEMENT_PILLARS.reduce((sum, p) => sum + p.featuresCount, 0);
  assert.equal(totalFromPillars, ALL_MANAGEMENT_FEATURES.length);

  for (const pillar of MANAGEMENT_PILLARS) {
    const featuresInPillar = ALL_MANAGEMENT_FEATURES.filter(f => f.pillarId === pillar.id);
    assert.equal(
      featuresInPillar.length,
      pillar.featuresCount,
      `Pillar ${pillar.id} feature count mismatch: expected ${pillar.featuresCount}, found ${featuresInPillar.length}`
    );
  }
});

test('Every feature has unique ID and complete enterprise metadata', () => {
  const ids = new Set<string>();

  for (const feature of ALL_MANAGEMENT_FEATURES) {
    assert.ok(feature.id, 'Feature must have an id');
    assert.ok(!ids.has(feature.id), `Duplicate feature id detected: ${feature.id}`);
    ids.add(feature.id);

    assert.ok(feature.name.length > 3, `Feature ${feature.id} name is too short`);
    assert.ok(feature.description.length > 15, `Feature ${feature.id} description is too short`);
    assert.ok(feature.awsService.length > 2, `Feature ${feature.id} must map to a valid AWS service`);
    assert.ok(
      ['ENFORCED', 'MONITORING', 'DISABLED'].includes(feature.status),
      `Feature ${feature.id} has invalid status: ${feature.status}`
    );
    assert.ok(
      ['Level 1', 'Level 2', 'Safety Guardrail', 'Telemetry'].includes(feature.autonomyImpact),
      `Feature ${feature.id} has invalid autonomyImpact`
    );
  }
});
