import { parseEvent, parseEvents } from '../src/events';
import type { RawContractEvent, ParsedTrustFlowEvent } from '../src/events';
import { EscrowMonitor } from '../src/escrow/monitor';

/** Build the base64 an `SCV_STRING` ScVal decodes to `s` (prefix byte 0x0e, 4 skipped bytes). */
function scStr(s: string): string {
  return Buffer.concat([
    Buffer.from([0x0e, 0, 0, 0, s.length]),
    Buffer.from(s, 'utf8'),
  ]).toString('base64');
}

const CONTRACT_ID = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4';

function rawCreated(): RawContractEvent {
  return {
    type: 'contract',
    ledger: 42,
    ledgerClosedAt: '2024-01-01T00:00:00Z',
    contractId: CONTRACT_ID,
    id: 'ev-1',
    pagingToken: 'pt',
    value: '5000000',
    topic: [scStr('escrow_created'), scStr('esc-1'), scStr('GSENDER'), scStr('GRECIPIENT')],
  };
}

describe('event consolidation (#108, #112)', () => {
  it('parseEvent returns a discriminated union that narrows data on type (#112)', () => {
    const event = parseEvent(rawCreated());
    expect(event).not.toBeNull();
    expect(event!.type).toBe('escrow_created');

    if (event && event.type === 'escrow_created') {
      // `data` is EscrowCreatedData here — no cast, and these members exist.
      expect(event.data.escrowId).toBe('esc-1');
      expect(event.data.sender).toBe('GSENDER');
      expect(event.data.recipient).toBe('GRECIPIENT');
      expect(event.data.amount).toBe(5_000_000n);
    } else {
      throw new Error('expected an escrow_created event');
    }
  });

  it('an unknown/unhandled event type falls back to an empty record payload', () => {
    const raw = rawCreated();
    raw.topic = [scStr('milestone_completed'), scStr('esc-9')];
    const event = parseEvent(raw);
    expect(event?.type).toBe('milestone_completed');
    expect(event?.data).toEqual({});
  });

  it('parseEvents output flows straight into an EscrowMonitor handler (#108)', async () => {
    const monitor = new EscrowMonitor();
    const seen: ParsedTrustFlowEvent[] = [];
    monitor.on('escrow_created', (e) => {
      seen.push(e);
    });

    // No adapter between the two — parseEvents returns exactly what deliver() takes.
    monitor.deliver(parseEvents([rawCreated()], CONTRACT_ID));
    await Promise.resolve();

    expect(seen).toHaveLength(1);
    expect(seen[0].type).toBe('escrow_created');
    if (seen[0].type === 'escrow_created') {
      expect(seen[0].data.amount).toBe(5_000_000n);
    }
  });

  it('parseEvents filters events from other contracts', () => {
    const mine = rawCreated();
    const theirs = { ...rawCreated(), contractId: 'COTHER', id: 'ev-2' };
    expect(parseEvents([mine, theirs], CONTRACT_ID)).toHaveLength(1);
  });
});
