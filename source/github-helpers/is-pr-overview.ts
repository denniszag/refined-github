import elementReady from 'element-ready';
import * as pageDetect from 'github-url-detection';

/** Detects GitHub's React PR "Overview" page, which replaces the PR conversation page #10381 */
export default async function isPrOverview(): Promise<boolean> {
	return pageDetect.isPRConversation()
		&& Boolean(await elementReady('[data-overview-sidebar-item], #overview-comments'));
}
