// SPDX-License-Identifier: LGPL-3.0-or-later
// Copyright © 2021 fvtt-event-viewer Rui Pinheiro

'use strict';

import { PackageInfo } from '../../shared/package_info.js';
import { SEVERITIES } from './event_enums.js';
import { EventViewerInternalError, EventViewerPackageError } from '../errors/base_errors.js';


export class Event {
	_set_source(source) {
		// TODO?
		this.source = source;
	}

	_set_message(message) {
		// Validate
		if(!message)
			throw new EventViewerPackageError('An event must have a message.');

		if(typeof message !== 'string')
			throw new EventViewerPackageError('An event\'s message must be a string.');

		// Done
		this.message = message;
	}

	_set_details(details) {
		// Validate
		if(details === undefined)
			details = "";

		if(typeof details !== 'string')
			throw new EventViewerPackageError('An event\'s details must be a string.');

		// Done
		this.details = details;
	}

	_set_severity(severity) {
		// Validate
		severity = SEVERITIES.get(severity, null);

		// Done
		this.severity = severity;
	}

	_captureStackTrace(trace_frame) {
		const obj = {};
		const old_stack_limit = Error.stackTraceLimit;

		try {
			Error.stackTraceLimit = Infinity;
			Error.captureStackTrace(obj, trace_frame ?? this.source?.emit ?? this.constructor); // TODO: Doesn't work in Firefox. We need to polyfill this
		}
		finally {
			Error.stackTraceLimit = old_stack_limit;
		}

		return obj.stack.replace(/^Error\n?/i, '');
	}

	_set_trace(trace, trace_frame) {
		// If no trace, we need to capture it
		if(trace === undefined)
			trace = this._captureStackTrace(trace_frame);

		// Validate
		if(typeof trace !== 'string')
			throw new EventViewerPackageError('An event\'s stack trace must be a string.');

		// Done
		this.trace = trace;
	}

	_set_users(users) {
		// TODO: Validate
		this.users = users;
	}

	_calculate_modules() {
		return PackageInfo.collect_all(this.trace);
	}

	_set_modules(modules) {
		// If we were provided an array of modules, use it
		if(modules !== undefined) {
			// TODO: Validate
			this.modules = modules;
			return;
		}

		// If we don't have the modules provided to us, we will set up a getter that figures them out on first run
		Object.defineProperty(this, 'modules', {
			get: () => {
				if(modules)
					return modules;

				modules = this._calculate_modules();
				return modules;
			}
		});
	}

	_freeze() {
		Object.freeze(this);

		if(typeof this.users === 'object')
			Object.freeze(this.users);

		if(typeof this.modules === 'object')
			Object.freeze(this.modules);
	}

	constructor(source, ...args) {
		// Parse 'args'. They can be either an object containing various fields, or a list of arguments
		let message, details, severity, trace_frame, trace, users, modules;

		if(args.length == 1 && typeof args[0] === 'object') {
			const obj = args[0];

			message     = obj.message;
			details     = obj.details;
			severity    = obj.severity;
			trace_frame = obj.trace_frame;
			trace       = obj.trace;
			users       = obj.users;
			modules     = obj.modules;
		}
		else {
			message     = args[0];
			details     = args[1];
			severity    = args[2];
			trace_frame = args[3];
		}


		// Set fields
		this._set_source(source);
		this._set_message(message);
		this._set_details(details);
		this._set_severity(severity);
		this._set_trace(trace, trace_frame);
		this._set_users(users);
		this._set_modules(modules);
	}
}