import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBlocks, computeCost, eachDate, isValidDate } from '../src/services/availability.js';

test('isValidDate acepta fechas reales y rechaza inválidas', () => {
  assert.equal(isValidDate('2026-07-02'), true);
  assert.equal(isValidDate('2026-13-01'), false);
  assert.equal(isValidDate('2026-02-30'), false);
  assert.equal(isValidDate('07/02/2026'), false);
  assert.equal(isValidDate(null), false);
});

test('eachDate es inclusivo en ambos extremos', () => {
  assert.deepEqual(eachDate('2026-07-01', '2026-07-03'), ['2026-07-01', '2026-07-02', '2026-07-03']);
  assert.deepEqual(eachDate('2026-07-05', '2026-07-05'), ['2026-07-05']);
});

test('computeBlocks: día completo de un día = AM + PM', () => {
  const blocks = computeBlocks({ start_date: '2026-07-02', end_date: '2026-07-02', duration_type: 'complete' });
  assert.deepEqual(blocks, [
    { date: '2026-07-02', slot: 'AM' },
    { date: '2026-07-02', slot: 'PM' },
  ]);
});

test('computeBlocks: día completo multi-día = 2 bloques por día', () => {
  const blocks = computeBlocks({ start_date: '2026-07-02', end_date: '2026-07-03', duration_type: 'complete' });
  assert.equal(blocks.length, 4);
});

test('computeBlocks: medio día = 1 bloque del turno elegido', () => {
  const blocks = computeBlocks({ start_date: '2026-07-02', end_date: '2026-07-02', duration_type: 'half', half_block: 'PM' });
  assert.deepEqual(blocks, [{ date: '2026-07-02', slot: 'PM' }]);
});

test('computeBlocks: medio día requiere un solo día', () => {
  assert.throws(
    () => computeBlocks({ start_date: '2026-07-02', end_date: '2026-07-03', duration_type: 'half', half_block: 'AM' }),
    /un solo día/i,
  );
});

test('computeBlocks: medio día requiere elegir AM o PM', () => {
  assert.throws(
    () => computeBlocks({ start_date: '2026-07-02', end_date: '2026-07-02', duration_type: 'half' }),
    /AM o PM/i,
  );
});

test('computeBlocks: end anterior a start es inválido', () => {
  assert.throws(
    () => computeBlocks({ start_date: '2026-07-05', end_date: '2026-07-02', duration_type: 'complete' }),
    /anterior/i,
  );
});

test('computeCost: External paga 150 por bloque, Internal no paga', () => {
  const twoBlocks = [{ date: '2026-07-02', slot: 'AM' }, { date: '2026-07-02', slot: 'PM' }];
  assert.equal(computeCost(twoBlocks, 'external'), 300);
  assert.equal(computeCost(twoBlocks, 'internal'), 0);
  assert.equal(computeCost([{ date: '2026-07-02', slot: 'AM' }], 'external'), 150);
});
