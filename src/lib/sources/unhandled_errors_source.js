// SPDX-License-Identifier: LGPL-3.0-or-later
// Copyright © 2021 fvtt-event-viewer Rui Pinheiro

'use strict';


import { IS_UNITTEST } from '../../consts.js';
import { SEVERITIES } from '../events/event_enums.js';
import { register_source } from '../sources/source.js';
import { EventViewerError } from '../errors/base_errors.js';



/*
 * Class that handles the Console event source
 */
class UnhandledErrorsSource {
	static init() {
		// Do nothing inside unit tests
		if(IS_UNITTEST)
			return;

		// Register source
		this.source = register_source('unhandled', 'Unhandled Errors', 'Unhandled Javascript Errors');

		// Setup listeners
		this.setup_listeners();

		// Done
		Object.freeze(this);
	}

	static setup_listeners() {
		// Javascript native unhandled exception listeners
		globalThis.addEventListener('error', this.onUnhandledError);
		globalThis.addEventListener('unhandledrejection', this.onUnhandledError);

		// Wrap Hooks._call to intercept unhandled exceptions during hooks
		// We don't use libWrapper itself here as we can guarantee we come first (well, before any libWrapper wrapper) and we want to avoid polluting the callstack of every single hook.
		// Otherwise users might think libWrapper is causing failures, when they're actually the fault of another package.
		// We try to patch the existing method. If anything fails, we just alert the user and skip this section.
		try {
			// Patch original method
			const orig = '() => function ' + Hooks._call.toString();
			const patched = orig.replace(/^( *).*catch\((.*)\)\s*{/img, '$&\n$1  globalThis.EventViewer.onUnhandledError($2);');
			if(orig === patched)
				throw `Could not patch 'Hooks._call' method:\n${orig}`;
			if(DEBUG)
				console.log(`Patched Hooks._call: ${patched}`);

			const patched_fn = global_eval(patched)?.();
			if(typeof patched_fn !== 'function')
				throw `Evaluation of patched 'Hooks._call' method did not return a function:\nPatched Method: ${patched}\nReturned: ${patched_fn}`;

			Hooks._call = patched_fn;
		}
		catch(e) {
			// Handle a possible error gracefully
			/*LibWrapperNotifications.console_ui(
				"A non-critical error occurred while initializing EventViewer's \"Unhandled Errors\" event source.",
				"Could not setup 'Hooks._call' wrapper.\n",
				'warn',
				e
			);*/
			console.warn("EventViewer: Could not setup 'Hooks._call' wrapper.");
		}

		// Wrap Application.prototype._render to intercept unhandled exceptions when rendering Applications
		try {
			libWrapper.register('lib-wrapper', 'Application.prototype._render', function(wrapped, ...args) {
				return wrapped(...args).catch(err => {
					UnhandledErrorsSource.onUnhandledError(err);
					throw err;
				});
			}, 'WRAPPER', {perf_mode: 'FAST'});
		}
		catch(e) {
			// Handle a possible error gracefully
			/*LibWrapperNotifications.console_ui(
				"A non-critical error occurred while initializing libWrapper.",
				"Could not setup 'Application.prototype._render' wrapper.\n",
				'warn',
				e
			);*/
			console.warn("EventViewer: Could not setup 'Application.prototype._render' wrapper.");
		}
	}

	static onUnhandledError(e) {
		// In case someone broke our 'this'
		const cls = UnhandledErrorsSource;

		// This is a LibWrapperError exception, and we need to handle it
		try {
			// We first check whether the cause of the event is an instance of EventViewerError - in which case we do nothing
			const exc = e.reason ?? e.error ?? e;
			if(!exc || (exc instanceof EventViewerError))
				return;

			// Emit event
			if(!cls.emit(exc))
				ui.notifications.error("Unhandled error detected");
		}
		catch (e) {
			console.warn('EventViewer: Exception thrown while processing an unhandled exception.', e);
		}
	}

	static _calculate_stack(e) {
		const prefix = `${e.name}: ${e.message}\n`;

		let stack = e.stack;
		if(stack.startsWith(prefix))
			stack = stack.substring(prefix.length);

		return stack;
	}

	static _calculate_message(e, stack) {
		let full_msg = e.message;

		// Remove exception class prefix
		const prefix = `${e.name}: `;
		if(full_msg.startsWith(prefix))
			full_msg = full_msg.substring(prefix.length);

		// First line is the message, remaining lines are details
		const msg = full_msg.split("\n", 1)[0];
		const details = full_msg.substring(msg.length+1);

		return [msg, details];
	}

	static emit(e) {
		const stack = this._calculate_stack(e);
		const [msg, details] = this._calculate_message(e);

		// returns false if the event is ignored
		return this.source.emit({
			message: msg,
			details: details,
			severity: SEVERITIES.ERROR,
			trace: stack
		});
	}
}

// Initialise
UnhandledErrorsSource.init();