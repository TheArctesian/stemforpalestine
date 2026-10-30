import { describe, expect, it } from 'vitest';
import { formatEventTime, isoToZoned, zonedToIso, type StemEvent } from './events';

describe('Bay Area time conversion', () => {
	it('reads admin input as Pacific time, in summer and winter', () => {
		expect(zonedToIso('2026-10-08', '19:00')).toBe('2026-10-08T19:00:00.000-07:00');
		expect(zonedToIso('2026-12-10', '19:00')).toBe('2026-12-10T19:00:00.000-08:00');
		expect(new Date(zonedToIso('2026-10-08', '19:00')).toISOString()).toBe(
			'2026-10-09T02:00:00.000Z'
		);
	});

	it('round-trips', () => {
		expect(isoToZoned('2026-10-08T19:00:00-07:00')).toEqual({ date: '2026-10-08', time: '19:00' });
		expect(isoToZoned(zonedToIso('2027-03-14', '09:30'))).toEqual({
			date: '2027-03-14',
			time: '09:30'
		});
	});

	it('formats times as before', () => {
		const event = {
			start: '2026-10-08T19:00:00-07:00',
			end: '2026-10-08T21:00:00-07:00'
		} as StemEvent;
		expect(formatEventTime(event)).toBe('7–9 PM');
	});
});
