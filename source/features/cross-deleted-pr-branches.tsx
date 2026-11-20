import './cross-deleted-pr-branches.css';

import * as pageDetect from 'github-url-detection';
import {$$, closestElement, lastElementOptional} from 'select-dom';

import features from '../feature-manager.js';
import api from '../github-helpers/api.js';
import {getConversationNumber} from '../github-helpers/index.js';
import isPrOverview from '../github-helpers/is-pr-overview.js';
import {has} from '../helpers/css-selectors.js';
import observe from '../helpers/selector-observer.js';

function markDeletedBranch(element: HTMLElement): void {
	element.title = 'This branch has been deleted';
	element.classList.add('rgh-deleted-branch');
}

function wasBranchDeleted(): boolean {
	const lastBranchEvent = lastElementOptional('.TimelineItem-body .user-select-contain.commit-ref');
	return Boolean(lastBranchEvent) // No branch events at all
		&& closestElement('.TimelineItem-body', lastBranchEvent).textContent.includes(' deleted ');
}

// The PR Overview page has no branch events in the timeline #10381
async function wasBranchDeletedApi(): Promise<boolean> {
	const {repository} = await api.v4(`
		repository() {
			pullRequest(number: ${getConversationNumber()!}) {
				headRef { id }
				headRepository { id }
			}
		}
	`);
	// If the head repository was deleted, GitHub already shows it
	return !repository.pullRequest.headRef && Boolean(repository.pullRequest.headRepository);
}

function initOverview(signal: AbortSignal): void {
	observe(
		'a[data-component="BranchName"]' + has('~ [aria-label="Copy head branch name to clipboard"]'),
		markDeletedBranch,
		{signal},
	);
}

function parseBranchName(element: HTMLElement): string {
	return element.textContent.trim().split(':').pop()!;
}

function init(): void {
	// There's static and sticky headers
	const [header1, header2] = $$('a:has(~ [aria-label="Copy head branch name to clipboard"])');
	markDeletedBranch(header1);
	markDeletedBranch(header2);

	const deletedBranchName = parseBranchName(header1);
	for (const element of $$('.commit-ref')) {
		// The selector might also match the base branch in "PR was rebased" events
		if (parseBranchName(element) === deletedBranchName) {
			markDeletedBranch(element);
		}
	}
}

void features.add(import.meta.url, {
	asLongAs: [
		pageDetect.isPRConversation,
		wasBranchDeleted,
	],
	awaitDomReady: true, // Must wait for the last one
	deduplicate: 'has-rgh-inner',
	init,
}, {
	asLongAs: [
		isPrOverview,
		wasBranchDeletedApi,
	],
	requiresToken: true,
	init: initOverview,
});

/*

Test URLs:

- 🔗 never deleted: https://github.com/refined-github/sandbox/pull/148
- ✏️ deleted: https://github.com/refined-github/sandbox/pull/146
- ✏️ deleted (from fork): https://github.com/refined-github/sandbox/pull/149
- 🔗 deleted and restored: https://github.com/refined-github/sandbox/pull/147
- 🔗 deleted and restored (on fork): https://github.com/refined-github/sandbox/pull/150
- 🔗 deleted and repo deleted: https://github.com/refined-github/refined-github/pull/3227
- 🔗 forks that are deleted before deleting the branch are not detectable sometimes

*/
