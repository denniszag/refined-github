import delegate, {type DelegateEvent} from 'delegate-it';
import * as pageDetect from 'github-url-detection';
import {$} from 'select-dom';

import features from '../feature-manager.js';
import {has, is} from '../helpers/css-selectors.js';
import {wasInteractiveElementClicked} from './easy-toggle-commit-messages.js';

function toggle(event: DelegateEvent<MouseEvent>): void {
	if (!wasInteractiveElementClicked(event)) {
		$(
			[
				'.review-thread-chevron', // PRs
				'button' + has(
					'> .octicon-unfold',
					'> .octicon-fold',
				), // Issues
				'button' + is(
					'[aria-label^="Open review comment"]',
					'[aria-label^="Close review comment"]',
				), // PR Overview page #10381
			],
			event.delegateTarget,
		).click();
	}
}

function init(signal: AbortSignal): void {
	delegate(
		[
			'.js-toggle-outdated-comments', // PRs
			'div[data-testid="comment-header"]' + has(
				'.octicon-unfold',
				'.octicon-fold',
			), // Issues
			'[data-testid="review-thread-focus-target"] > article > [class^="header"]' + has(
				'button[aria-label^="Open review comment"]',
				'button[aria-label^="Close review comment"]',
			), // PR Overview page #10381
		],
		'click',
		toggle,
		{signal},
	);
}

void features.add(import.meta.url, {
	include: [
		pageDetect.isConversation,
	],
	init,
});

/*

Test URLs:

- Resolved PR review: https://github.com/refined-github/sandbox/pull/47#pullrequestreview-4175514676

- Hidden issue comment: https://github.com/refined-github/sandbox/issues/131#issuecomment-4297544223

*/
