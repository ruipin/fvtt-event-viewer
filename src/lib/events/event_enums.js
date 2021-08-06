// SPDX-License-Identifier: LGPL-3.0-or-later
// Copyright © 2021 fvtt-event-viewer Rui Pinheiro

'use strict';


import {Enum} from '../../shared/enums.js';


//*********************
// Severity
export const SEVERITIES = Enum('Severity', {
	'NOTSET'   :   0,
	'DEBUG'    : 100,
	'INFO'     : 200,
	'WARNING'  : 300,
	'ERROR'    : 400,
	'CRITICAL' : 500
});