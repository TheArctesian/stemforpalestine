import sanitizeHtml from 'sanitize-html';

/*
 * Rich text from the admin's editor is rendered with {@html}, so it's cleaned on save. Admins
 * are trusted, but the account is shared, and a pasted snippet could carry a script.
 */

const ALIGN = { 'text-align': [/^(left|right|center|justify)$/] };

const OPTIONS: sanitizeHtml.IOptions = {
	allowedTags: [
		'p',
		'br',
		'strong',
		'b',
		'em',
		'i',
		'u',
		's',
		'a',
		'ul',
		'ol',
		'li',
		'h1',
		'h2',
		'h3',
		'h4',
		'blockquote',
		'hr',
		'span',
		'img',
		'table',
		'thead',
		'tbody',
		'tr',
		'th',
		'td'
	],
	allowedAttributes: {
		a: ['href', 'target', 'rel', 'title'],
		img: ['src', 'alt', 'width', 'height', 'style'],
		'*': ['style']
	},
	allowedStyles: {
		'*': {
			...ALIGN,
			color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i],
			'text-decoration': [/^(underline|line-through|none)$/]
		},
		img: {
			...ALIGN,
			width: [/^\d+(px|%)$/],
			height: [/^\d+(px|%)$/, /^auto$/],
			'max-width': [/^\d+(px|%)$/],
			display: [/^block$/],
			margin: [/^[\d\spxauto]+$/],
			'margin-left': [/^(auto|\d+px)$/],
			'margin-right': [/^(auto|\d+px)$/]
		}
	},
	allowedSchemes: ['http', 'https', 'mailto', 'tel'],
	allowedSchemesByTag: { img: ['http', 'https'] },
	transformTags: {
		// Links open in a new tab and don't hand the opener page to the other site.
		a: (tagName, attribs) => ({
			tagName,
			attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' }
		})
	}
};

export function sanitizeRichText(html: string): string {
	return sanitizeHtml(html, OPTIONS).trim();
}
