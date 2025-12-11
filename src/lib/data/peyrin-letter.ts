// Data for the Peyrin Reinstatement Open Letter

export interface Organization {
	name: string;
	logo?: string;
}

export interface NotableSignatory {
	name: string;
	title: string;
	affiliation: string;
}

export interface Signatory {
	name: string;
	affiliation?: string;
}

export interface Comment {
	author: string;
	affiliation?: string;
	text: string;
}

// Google Form URL for signing the letter
export const SIGN_FORM_URL = 'https://forms.gle/umUk5kkvfvPdoeCF8';

// Endorsing organizations
export const organizations: Organization[] = [
	// Add organizations here, e.g.:
	// { name: 'Organization Name', logo: '/logos/org.png' }
];

// Notable signatories (faculty, prominent individuals)
export const notableSignatories: NotableSignatory[] = [
	// Add notable signatories here, e.g.:
	// { name: 'Prof. Jane Doe', title: 'Professor of Computer Science', affiliation: 'UC Berkeley' }
];

// All signatories
export const allSignatories: Signatory[] = [
	// Add all signatories here, e.g.:
	// { name: 'John Smith', affiliation: 'Stanford University' }
];

// Featured community comments
export const comments: Comment[] = [
	// Add comments here, e.g.:
	// { author: 'Jane Doe', affiliation: 'UC Berkeley', text: 'Comment text here...' }
];
