// SPDX-License-Identifier: LGPL-3.0-or-later
// Copyright © 2021 fvtt-event-viewer Rui Pinheiro

'use strict';

import { EventViewerPackageError } from '../errors/base_errors.js';
import { Event } from '../events/event.js';
import { emit_event_to_listeners } from '../listeners/listener.js';


/*
 * Constants and variables
 */
const VALID_SOURCE_ID_REGEX = new RegExp("^[a-z0-9_-]+$", "i");
const SOURCES = new Map();


/*
 * Utility methods
 */
function _validate_source_id(id) {
	// Validate name
	if(typeof id !== "string")
		throw EventViewerPackageError("Source id must be a string.");

	if(!VALID_SOURCE_ID_REGEX.test(id))
		throw EventViewerPackageError(`Invalid source name '${id}'.`);
}


/*
 * Source class
 */
class Source {
	constructor(id, name, description, freeze=true) {
		this.id = id;
		this.name = name;
		this.description = description;
		this._listeners = [];

		if(freeze)
			Object.freeze(this);
	}

	emit(...args) {
		const ev = new Event(this, ...args);
		return emit_event_to_listeners(ev);
	}
}
Object.freeze(Source);



/*
 * Public API methods
 */
export function get_source(id) {
	_validate_source_id(id);

	// Grab source
	const src = SOURCES.get(id);
	if(src === undefined)
		throw EventViewerPackageError(`Source with ID '${id}' does not exist.`);

	// Done
	return src;
}


export function register_source(id, name, description) {
	// Validate arguments
	_validate_source_id(id);

	if(typeof name !== "string")
		throw EventViewerPackageError("A source's name must be a string.");

	if(typeof description !== "string")
		throw EventViewerPackageError("A source's description must be a string.");

	// Find source if it already exists
	let src = SOURCES.get(id);
	if(src) {
		// Fail if the source has a different name/description
		if(src.name != name && src.description != description)
			throw EventViewerPackageError(`Source '${id}' already exists.`);

		// Otherwise, we can simply return it
		return src;
	}

	// Create source
	src = new Source(id, name, description);
	SOURCES.set(id, src);

	// Done
	return src;
}