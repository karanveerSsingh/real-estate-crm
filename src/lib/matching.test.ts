import test from 'node:test';
import assert from 'node:assert/strict';
import { rankPropertiesForCustomer } from './matching';

test('rankPropertiesForCustomer sorts the best-fit projects first for the customer', () => {
  const customer = {
    budget: '30 Lakh',
    preferredLocations: ['Tonk Road'],
    purpose: 'Plot',
    requirement: 'JDA approved east facing',
  };

  const properties = [
    {
      _id: 'p-1',
      propertyName: 'City Crest',
      projectName: 'City Crest',
      societyName: 'City Crest',
      location: 'Jaipur',
      road: 'Tonk Road',
      price: 2500000,
      propertyCategory: 'Plot',
      facing: 'East',
      jdaApproved: true,
      rera: true,
      societyApproved: true,
      status: 'Available',
    },
    {
      _id: 'p-2',
      propertyName: 'Green Valley',
      projectName: 'Green Valley',
      societyName: 'Green Valley',
      location: 'Jaipur',
      road: 'Sikar Road',
      price: 2200000,
      propertyCategory: 'Plot',
      facing: 'West',
      jdaApproved: false,
      rera: false,
      societyApproved: false,
      status: 'Available',
    },
  ];

  const ranked = rankPropertiesForCustomer(customer as any, properties as any);

  assert.equal(ranked.length, 2);
  assert.equal(ranked[0].propertyName, 'City Crest');
  assert.ok(ranked[0].matchScore >= ranked[1].matchScore);
  assert.ok(ranked[0].matchReasons.includes('Location match'));
});
