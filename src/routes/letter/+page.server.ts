import type { PageServerLoad } from './$types';
import signatories from '../../../static/signatories.json';
import orgSignatories from '../../../static/org_signatories.json';

export const load: PageServerLoad = async () => {
	return {
		signatories: signatories.signatories,
		totalCount: signatories.totalCount,
		lastUpdated: signatories.lastUpdated,
		orgSignatories
	};
};
