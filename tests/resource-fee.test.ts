import { DEFAULT_RESOURCE_FEE_MULTIPLIER, padResourceFee } from '../src/utils/resource-fee';

describe('padResourceFee (#438)', () => {
  it('defaults to a 1.1x multiplier', () => {
    expect(DEFAULT_RESOURCE_FEE_MULTIPLIER).toBe(1.1);
    expect(padResourceFee('1000')).toBe('1100');
  });

  it('rounds up rather than truncating', () => {
    expect(padResourceFee('1', 1.1)).toBe('2');
  });

  it('is exact where Math.ceil on a float overshoots (1000 * 1.1 = 1100.0000000000002)', () => {
    expect(padResourceFee('1000', 1.1)).toBe('1100');
  });

  it('applies a custom multiplier', () => {
    expect(padResourceFee('1000', 2)).toBe('2000');
  });

  it('treats a missing or empty fee as zero', () => {
    expect(padResourceFee(undefined)).toBe('0');
    expect(padResourceFee('')).toBe('0');
  });
});
