import test from 'node:test';
import assert from 'node:assert/strict';
import { createDashboardFallback } from './apiFallbacks';

test('dashboard fallback returns zeroed stats and empty widgets', () => {
  const fallback = createDashboardFallback();

  assert.equal(fallback.stats.totalLeads, 0);
  assert.deepEqual(fallback.widgets.pendingFollowups, []);
  assert.equal(fallback.graphs.monthlyLeads.length, 12);
  assert.equal(fallback.warning, 'Database unavailable. Showing empty CRM data.');
});
