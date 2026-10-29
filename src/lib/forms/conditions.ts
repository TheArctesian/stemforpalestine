/*
 * Rules like "onboarding equals Yes". Forms use them to show or hide fields and to pick an ending,
 * keyed by field id. The email audience builder reuses them, keyed by field key.
 */

export type AnswerValue = string | string[] | boolean;
/** One submission's answers, by field id. Unanswered fields are simply missing. */
export type Answers = Record<string, AnswerValue>;

export const OPERATORS = [
	'equals',
	'not_equals',
	'contains',
	'not_contains',
	'includes',
	'excludes',
	'is_empty',
	'is_not_empty',
	'gt',
	'lt'
] as const;

export type Operator = (typeof OPERATORS)[number];

export const OPERATOR_LABELS: Record<Operator, string> = {
	equals: 'is',
	not_equals: 'is not',
	contains: 'contains',
	not_contains: "doesn't contain",
	includes: 'has selected',
	excludes: "hasn't selected",
	is_empty: 'is empty',
	is_not_empty: 'is answered',
	gt: 'is greater than',
	lt: 'is less than'
};

/** Operators that don't compare against a value. */
export const UNARY_OPERATORS: ReadonlySet<Operator> = new Set(['is_empty', 'is_not_empty']);

export type Rule = { field: string; op: Operator; value?: string };
export type Condition = { match: 'all' | 'any'; rules: Rule[] };
export type Visibility = Condition & { action: 'show' | 'hide' };

export function isEmpty(value: AnswerValue | null | undefined): boolean {
	if (value === undefined || value === null || value === false) return true;
	if (Array.isArray(value)) return value.length === 0;
	return typeof value === 'string' && value.trim() === '';
}

/** How an answer reads as text: checkbox lists joined, single checkboxes as Yes/No. */
export function answerText(value: AnswerValue | null | undefined): string {
	if (value === undefined || value === null) return '';
	if (Array.isArray(value)) return value.join(', ');
	if (typeof value === 'boolean') return value ? 'Yes' : 'No';
	return value;
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function compare(value: AnswerValue | null | undefined, target: string): number | null {
	const text = answerText(value).trim();
	if (!text || !target.trim()) return null;
	const [a, b] = [Number(text), Number(target)];
	if (Number.isFinite(a) && Number.isFinite(b)) return a - b;
	// ISO dates (YYYY-MM-DD) sort correctly as strings.
	return text.localeCompare(target.trim());
}

export function evaluateRule(rule: Rule, value: AnswerValue | null | undefined): boolean {
	const target = rule.value ?? '';
	switch (rule.op) {
		case 'is_empty':
			return isEmpty(value);
		case 'is_not_empty':
			return !isEmpty(value);
		case 'equals':
		case 'includes':
			if (Array.isArray(value)) return value.some((v) => same(v, target));
			if (typeof value === 'boolean')
				return value === ['yes', 'true', 'checked'].includes(target.trim().toLowerCase());
			return value !== undefined && value !== null && same(value, target);
		case 'not_equals':
		case 'excludes':
			return !evaluateRule({ ...rule, op: 'equals' }, value);
		case 'contains':
			return answerText(value).toLowerCase().includes(target.trim().toLowerCase());
		case 'not_contains':
			return !answerText(value).toLowerCase().includes(target.trim().toLowerCase());
		case 'gt':
			return (compare(value, target) ?? 0) > 0;
		case 'lt':
			return (compare(value, target) ?? 0) < 0;
	}
}

/** Whether the condition holds. A condition with no rules always holds. */
export function evaluate(
	condition: Condition | null | undefined,
	lookup: (field: string) => AnswerValue | null | undefined
): boolean {
	if (!condition || condition.rules.length === 0) return true;
	const check = (rule: Rule) => evaluateRule(rule, lookup(rule.field));
	return condition.match === 'any' ? condition.rules.some(check) : condition.rules.every(check);
}

/** "Show when …" fields appear only while the rules hold; "Hide when …" fields disappear while they do. */
export function isVisible(
	visibility: Visibility | null | undefined,
	lookup: (field: string) => AnswerValue | null | undefined
): boolean {
	if (!visibility || visibility.rules.length === 0) return true;
	const holds = evaluate(visibility, lookup);
	return visibility.action === 'show' ? holds : !holds;
}
