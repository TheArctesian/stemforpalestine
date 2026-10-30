import { desc, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { emailSuppressions, forms, formSubmissions, type Audience } from '$lib/server/db/schema';
import { selectRecipients, type AudienceResult } from '$lib/email/audience';

export async function resolveAudience(audience: Audience): Promise<AudienceResult> {
	if (!audience.formIds.length) {
		return {
			recipients: [],
			perForm: [],
			excluded: { noEmail: 0, duplicates: 0, suppressed: 0, manual: 0 }
		};
	}
	const [formRows, submissions, suppressions] = await Promise.all([
		db
			.select({ id: forms.id, title: forms.title, fields: forms.fields })
			.from(forms)
			.where(inArray(forms.id, audience.formIds)),
		db
			.select({
				id: formSubmissions.id,
				formId: formSubmissions.formId,
				data: formSubmissions.data,
				email: formSubmissions.email,
				submittedAt: formSubmissions.submittedAt
			})
			.from(formSubmissions)
			.where(inArray(formSubmissions.formId, audience.formIds))
			.orderBy(desc(formSubmissions.submittedAt)),
		db.select({ email: emailSuppressions.email }).from(emailSuppressions)
	]);
	return selectRecipients(
		formRows,
		submissions,
		audience,
		new Set(suppressions.map((s) => s.email))
	);
}
