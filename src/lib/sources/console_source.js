// SPDX-License-Identifier: LGPL-3.0-or-later
// Copyright © 2021 fvtt-event-viewer Rui Pinheiro

'use strict';


import { IS_UNITTEST } from '../../consts.js';
import { SEVERITIES } from '../events/event_enums.js';
import { register_source } from '../sources/source.js';



/*
 * Class that handles the Console event source
 */
class ConsoleSource {
	static init() {
		// Do nothing inside unit tests
		if(IS_UNITTEST)
			return;

		// Register source
		this.source = register_source('console', 'Console', 'Javascript Console Messages');

		// Setup listeners
		this.setup_listeners();

		// Done
		Object.freeze(this);
	}

	static setup_listeners() {
		const _this = this;

		// TODO: Enable only if active. Allow configuring which of the log functions gets wrapped/unwrapped
		//       We will need to wait until game.settings is available, if we want to do this.
		/*this.wrap_method('log');
		this.wrap_method('debug');
		this.wrap_method('info');
		this.wrap_method('warn');*/
		this.wrap_method('error');
	}

	static wrap_method(name) {
		const noevent = `${name}_noevent`;
		const method  = console[name];

		// Backup method (if not already backed up)
		if(console[noevent] === undefined)
			console[noevent] = method;

		// Wrap method
		//
		// TODO: This loses file and line numbers...
		//       If we really wanted to, we could grab this from a stack trace, and then replicate the browser's default formatting.
		//
		// TODO: Use libWrapper.register if available
		const _this = this;
		console[name] = function(...args) {
			if(_this.emit(console[name], args))
				console[noevent].apply(this, args);
		}
	}

	static unwrap_method(name) {
		const noevent = `${name}_noevent`;
		const method  = console[noevent];

		// Unwrap method
		//
		// TODO: Use libWrapper.unregister if available
		if(method)
			console[name] = method;
	}

	static calculate_severity(method) {
		return (method == console.debug ) ? SEVERITIES.DEBUG   :
			   (method == console.log   ) ? SEVERITIES.INFO    :
		       (method == console.info  ) ? SEVERITIES.INFO    :
		       (method == console.warn  ) ? SEVERITIES.WARNING :
		       (method == console.error ) ? SEVERITIES.ERROR   :
			                                SEVERITIES.NOTSET  ;
	}

	static calculate_message(args) {
		// TODO: Maybe args[1..n] as details?
		let message = "";
		for(const arg of args) {
			if(message) message += '\n';
			message += String(arg);
		}
		return message;
	}

	static emit(method, args) {
		const severity = this.calculate_severity(method);
		const message = this.calculate_message(args);

		// returns false if the event is ignored
		return this.source.emit(
			message,
			"", // TODO: Any details?
			severity,
			method
		);
	}
}

// Initialise
ConsoleSource.init();