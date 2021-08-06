// SPDX-License-Identifier: LGPL-3.0-or-later
// Copyright © 2021 fvtt-event-viewer Rui Pinheiro

'use strict';

import {
	MAJOR_VERSION, MINOR_VERSION, PATCH_VERSION, SUFFIX_VERSION, META_VERSION,
	VERSION, GIT_VERSION, VERSION_WITH_GIT, parse_manifest_version, version_at_least
} from '../shared/version.js';

import {
	PACKAGE_ID, PACKAGE_TITLE, HOOKS_SCOPE, IS_UNITTEST, DEBUG, setDebug
} from '../consts.js';



// Internal variables
let event_viewer_ready = false;



// Publicly exposed class
export class EventViewer {
	// Properties
	/**
	 * Get Event Viewer version
	 * @returns {string}  Event Viewer version in string form, i.e. "<MAJOR>.<MINOR>.<PATCH>.<SUFFIX><META>"
	 */
	static get version() { return VERSION; }

	/**
	 * Get Event Viewer version
	 * @returns {[number,number,number,number,string]}  Event Viewer version in array form, i.e. [<MAJOR>, <MINOR>, <PATCH>, <SUFFIX>, <META>]
	 */
	static get versions() { return [MAJOR_VERSION, MINOR_VERSION, PATCH_VERSION, SUFFIX_VERSION, META_VERSION]; }

	/**
	 * Get the Git version identifier.
	 * @returns {string}  Git version identifier, usually 'HEAD' or the commit hash.
	 */
	static get git_version() { return GIT_VERSION };


	/**
	 * @returns {boolean}  Whether Event Viewer is in debug mode.
	 */
	static get debug() { return DEBUG; }
	/**
	 * @param {boolean} value  Whether to enable or disable Event Viewer debug mode.
	 */
	static set debug(value) { setDebug(value) }

	// Errors
	// TODO


	// Methods
	/**
	 * Test for a minimum Event Viewer version.
	 * First introduced in v1.4.0.0.
	 *
	 * @param {number} major   Minimum major version
	 * @param {number} minor   [Optional] Minimum minor version. Default is 0.
	 * @param {number} patch   [Optional] Minimum patch version. Default is 0.
	 * @param {number} suffix  [Optional] Minimum suffix version. Default is 0.
	 * @returns {boolean}      Returns true if the libWrapper version is at least the queried version, otherwise false.
	 */
	static get version_at_least() { return version_at_least; };
};
Object.freeze(EventViewer);



// Define as property so that it can't be deleted
// TODO: Use different scope?
delete globalThis.EventViewer;
Object.defineProperty(globalThis, 'EventViewer', {
	get: () => EventViewer,
	set: (value) => { throw `${PACKAGE_TITLE}: Not allowed to re-assign the global instance of the Event Viewer API` },
	configurable: false
});


// Setup unhandled error listeners
// TODO
//init_error_listeners();

// Initialize Event Viewer right before the 'init' hook. Unit tests just initialize immediately
{
	// Initialization function
	const initFnName = "EventViewerInit";
	const obj = {
		[initFnName]: function(wrapped, ...args) {
			// Initialization steps
			event_viewer_ready = true;

			parse_manifest_version();

			// Notify everyone the library has loaded and is ready to start registering wrappers
			console.info(`${PACKAGE_TITLE} ${VERSION_WITH_GIT}: Ready.`);
			Hooks.callAll(`${HOOKS_SCOPE}.Ready`, EventViewer);

			return wrapped(...args);
		}
	};
	const initFn = obj[initFnName];

	// Initialize
	if(!IS_UNITTEST) {
		// TODO: libWrapper ?
		const oldInitialize = Game.prototype.initialize;
		Game.prototype.initialize = function(...args) { return initFn.call(this, oldInitialize.bind(this), ...args); };
		//libWrapper.register(PACKAGE_ID, 'Game.prototype.initialize', initFn, 'WRAPPER', {perf_mode: 'FAST'});
	}
	else
		initFn(()=>{});
}