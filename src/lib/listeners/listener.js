// SPDX-License-Identifier: LGPL-3.0-or-later
// Copyright © 2021 fvtt-event-viewer Rui Pinheiro

'use strict';


import { EventViewerInternalError } from "../errors/base_errors.js";
import { Event } from "../events/event.js";

/*
 * Constants and variables
 */
const EVENTS    = [];
globalThis.EVENTS = EVENTS; // TODO: Remove
const LISTENERS = [];


/*
 * Listener class
 */
class Listener {
	constructor(package_info, fn, freeze=true) {
		this.package_info = package_info;
		this.fn = fn;

		if(freeze)
			Object.freeze(this);
	}

	on(ev) {
		return this.fn(ev);
	}
}


/*
 * Methods
 */
function emit_to_listeners(ev, listeners) {
	for(listener of listeners) {
		if(!(listener instanceof Listener))
			throw new EventViewerInternalError(`Invalid listener '${listener}'.`);

		if(!listener.on(ev))
			return true;
	}

	return false;
}


export function emit_event_to_listeners(ev) {
	// Validate
	if(!(ev instanceof Event))
		throw new EventViewerInternalError(`Invalid event '${ev}'.`);

	// Freeze event
	ev._freeze();

	// Emit to source listeners
	let ignored = emit_to_listeners(ev, ev.source._listeners);

	// Emit to global listeners
	if(!ignored)
		ignored = emit_to_listeners(ev, LISTENERS);

	// Push to master event list
	if(!ignored)
		EVENTS.push(ev);

	// Done
	return !ignored;
}