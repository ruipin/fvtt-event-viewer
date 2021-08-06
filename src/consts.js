// SPDX-License-Identifier: LGPL-3.0-or-later
// Copyright © 2021 fvtt-event-viewer Rui Pinheiro

'use strict';

//*********************
// Package information
export const PACKAGE_ID    = 'event-viewer';
export const PACKAGE_TITLE = 'Event Viewer';
export const HOOKS_SCOPE   = 'EventViewer';


//*********************
// Miscellaneous definitions
export const IS_UNITTEST = (typeof Game === 'undefined');
export const PROPERTIES_CONFIGURABLE = IS_UNITTEST ? true : false;


//*********************
// Debug
export let DEBUG = false;
export function setDebug(new_debug) { DEBUG = new_debug; };


//*********************
// Errors
export const InternalError = Error; // TODO: Customise this