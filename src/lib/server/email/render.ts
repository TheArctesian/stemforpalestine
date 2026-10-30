import juice from 'juice';
import { convert } from 'html-to-text';
import { escapeHtml, fillPlaceholders } from '$lib/email/placeholders';

/*
 * A template plus one recipient's values → the email they receive. Mail clients ignore most CSS,
 * so the layout is a table and juice copies the styles onto each element.
 */

const STYLES = `
	body { margin: 0; padding: 0; background: #f4f9f0; }
	.wrapper { width: 100%; background: #f4f9f0; padding: 24px 12px; }
	.card { width: 100%; max-width: 600px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; }
	.brand { padding: 24px 32px 0; font-family: Inter, Arial, sans-serif; font-size: 18px; font-weight: 800; color: #009639; }
	.content { padding: 16px 32px 28px; font-family: Inter, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #2d3748; }
	.content p { margin: 0 0 16px; }
	.content h1, .content h2 { margin: 0 0 16px; font-size: 24px; line-height: 1.25; color: #1a202c; }
	.content h3, .content h4 { margin: 0 0 12px; font-size: 18px; line-height: 1.3; color: #1a202c; }
	.content a { color: #007a2e; text-decoration: underline; }
	.content img { max-width: 100%; height: auto; border: 0; }
	.content ul, .content ol { margin: 0 0 16px; padding-left: 24px; }
	.content blockquote { margin: 0 0 16px; padding-left: 16px; border-left: 4px solid #009639; color: #4a5568; }
	.footer { padding: 16px 32px 24px; font-family: Inter, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #718096; border-top: 1px solid #e2e8f0; }
	.footer a { color: #718096; text-decoration: underline; }
`;

function layout(body: string, footer: string, title: string): string {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body>
<table role="presentation" class="wrapper" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
<table role="presentation" class="card" cellpadding="0" cellspacing="0" width="600">
<tr><td class="brand">STEM4Palestine</td></tr>
<tr><td class="content">${body}</td></tr>
<tr><td class="footer">${footer}</td></tr>
</table>
</td></tr></table>
</body>
</html>`;
}

export type RenderedEmail = { subject: string; html: string; text: string };

export function renderEmail(
	template: { subject: string; html: string },
	vars: Record<string, string>,
	{ unsubscribeUrl }: { unsubscribeUrl: string }
): RenderedEmail {
	const values = { ...vars, unsubscribe_url: unsubscribeUrl };
	const subject = fillPlaceholders(template.subject, values).replace(/\s+/g, ' ').trim();
	const body = fillPlaceholders(template.html, values, escapeHtml);
	const reason = vars.form_title
		? `You're getting this because you filled in “${escapeHtml(vars.form_title)}” on stem4pal.org.`
		: "You're getting this because you signed up on stem4pal.org.";
	const footer = `${reason} <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a><br>STEM4Palestine · Berkeley, CA · <a href="mailto:info@stem4pal.org">info@stem4pal.org</a>`;

	const html = juice(layout(body, footer, subject));
	const text = convert(html, {
		wordwrap: 90,
		selectors: [
			{ selector: 'img', format: 'skip' },
			{ selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
			{ selector: 'h1', options: { uppercase: false } },
			{ selector: 'h2', options: { uppercase: false } },
			{ selector: 'h3', options: { uppercase: false } },
			{ selector: 'h4', options: { uppercase: false } },
			{ selector: 'table.wrapper', format: 'block' }
		]
	});
	return { subject, html, text };
}
