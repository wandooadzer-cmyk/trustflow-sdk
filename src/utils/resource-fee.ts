/**
 * Default headroom applied to the RPC-reported `minResourceFee`. Ledger state
 * can shift between simulation and submission, so a small margin keeps the
 * submitted transaction from failing with "insufficient resource fee" (#438).
 */
export const DEFAULT_RESOURCE_FEE_MULTIPLIER = 1.1;

/**
 * Pads the RPC-reported minimum resource fee by a safety multiplier, rounding up.
 *
 * Shared by `TransactionPipeline` and `invokeContract` so both submission paths
 * apply identical headroom. Uses integer math, so the result is exact for every
 * stroop amount; `Math.ceil` on a float can overshoot by a stroop (`1000 * 1.1`
 * evaluates to `1100.0000000000002`).
 *
 * @param minResourceFee - The `minResourceFee` from a simulation, in stroops
 * @param multiplier - Safety multiplier; defaults to {@link DEFAULT_RESOURCE_FEE_MULTIPLIER}
 * @returns The padded fee as a decimal string of stroops
 *
 * @example
 * ```typescript
 * padResourceFee('1000');      // '1100'
 * padResourceFee('1000', 2);   // '2000'
 * ```
 */
export function padResourceFee(
  minResourceFee: string | undefined,
  multiplier: number = DEFAULT_RESOURCE_FEE_MULTIPLIER,
): string {
  const multiplierBps = BigInt(Math.round(multiplier * 10000));
  const fee = BigInt(minResourceFee || '0');
  return ((fee * multiplierBps + 9999n) / 10000n).toString();
}
