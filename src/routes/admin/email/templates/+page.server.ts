import { redirect } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { emailTemplateForms, emailTemplates, forms } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/permissions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [templates, links] = await Promise.all([
		db
			.select({
				id: emailTemplates.id,
				name: emailTemplates.name,
				subject: emailTemplates.subject,
				updatedAt: emailTemplates.updatedAt
			})
			.from(emailTemplates)
			.orderBy(desc(emailTemplates.updatedAt)),
		db
			.select({ templateId: emailTemplateForms.templateId, title: forms.title })
			.from(emailTemplateForms)
			.innerJoin(forms, eq(forms.id, emailTemplateForms.formId))
	]);
	return {
		templates: templates.map((t) => ({
			...t,
			forms: links.filter((l) => l.templateId === t.id).map((l) => l.title)
		}))
	};
};

const STARTER = `<p>Hi {{first_name|friend}},</p>
<p>Write your message here. Use <strong>Insert field</strong> in the toolbar to add answers from the form, like someone's name.</p>
<p>In solidarity,<br>STEM4Palestine</p>`;

export const actions: Actions = {
	create: async ({ locals }) => {
		const me = requireAdmin(locals);
		const [template] = await db
			.insert(emailTemplates)
			.values({
				name: 'Untitled email',
				subject: 'News from STEM4Palestine',
				html: STARTER,
				createdBy: me.id,
				updatedBy: me.id
			})
			.returning({ id: emailTemplates.id });
		redirect(303, `/admin/email/templates/${template.id}`);
	}
};
