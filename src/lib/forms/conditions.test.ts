import { describe, expect, it } from 'vitest';
import { evaluate, evaluateRule, isVisible, type AnswerValue } from './conditions';

const rule = (op: Parameters<typeof evaluateRule>[0]['op'], value?: string) => ({
	field: 'f',
	op,
	value
});

describe('evaluateRule', () => {
	it('compares text without caring about case or surrounding spaces', () => {
		expect(evaluateRule(rule('equals', 'yes'), ' Yes ')).toBe(true);
		expect(evaluateRule(rule('not_equals', 'yes'), 'No')).toBe(true);
		expect(evaluateRule(rule('contains', 'san francisco'), 'Lives in San Francisco, CA')).toBe(
			true
		);
		expect(evaluateRule(rule('not_contains', 'berkeley'), 'oakland')).toBe(true);
	});

	it('treats checkbox lists as "has selected"', () => {
		const picked: AnswerValue = ['Events', 'Tech Projects'];
		expect(evaluateRule(rule('includes', 'events'), picked)).toBe(true);
		expect(evaluateRule(rule('equals', 'Events'), picked)).toBe(true);
		expect(evaluateRule(rule('excludes', 'Communications'), picked)).toBe(true);
		expect(evaluateRule(rule('contains', 'tech'), picked)).toBe(true);
	});

	it('treats a single checkbox as yes/no', () => {
		expect(evaluateRule(rule('equals', 'Yes'), true)).toBe(true);
		expect(evaluateRule(rule('equals', 'Yes'), false)).toBe(false);
		expect(evaluateRule(rule('is_empty'), false)).toBe(true);
	});

	it('handles missing answers', () => {
		expect(evaluateRule(rule('equals', 'No'), undefined)).toBe(false);
		expect(evaluateRule(rule('not_equals', 'No'), undefined)).toBe(true);
		expect(evaluateRule(rule('is_empty'), undefined)).toBe(true);
		expect(evaluateRule(rule('is_not_empty'), '  ')).toBe(false);
	});

	it('compares numbers numerically and dates as dates', () => {
		expect(evaluateRule(rule('gt', '9'), '10')).toBe(true);
		expect(evaluateRule(rule('lt', '2026-01-01'), '2025-12-31')).toBe(true);
		expect(evaluateRule(rule('gt', '5'), undefined)).toBe(false);
	});
});

describe('evaluate', () => {
	const answers: Record<string, AnswerValue> = { city: 'San Francisco', list: 'Yes' };
	const lookup = (field: string) => answers[field];

	it('passes with no rules', () => {
		expect(evaluate({ match: 'all', rules: [] }, lookup)).toBe(true);
		expect(evaluate(null, lookup)).toBe(true);
	});

	it('supports all and any', () => {
		const rules = [
			{ field: 'city', op: 'contains' as const, value: 'san francisco' },
			{ field: 'list', op: 'equals' as const, value: 'No' }
		];
		expect(evaluate({ match: 'all', rules }, lookup)).toBe(false);
		expect(evaluate({ match: 'any', rules }, lookup)).toBe(true);
	});
});

describe('isVisible', () => {
	const rules = [{ field: 'onboarding', op: 'equals' as const, value: 'No' }];

	it('"hide when" hides only while the rule holds', () => {
		const vis = { action: 'hide' as const, match: 'all' as const, rules };
		expect(isVisible(vis, () => undefined)).toBe(true);
		expect(isVisible(vis, () => 'Yes')).toBe(true);
		expect(isVisible(vis, () => 'No')).toBe(false);
	});

	it('"show when" shows only while the rule holds', () => {
		const vis = { action: 'show' as const, match: 'all' as const, rules };
		expect(isVisible(vis, () => undefined)).toBe(false);
		expect(isVisible(vis, () => 'No')).toBe(true);
	});
});
