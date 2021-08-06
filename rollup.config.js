import path from 'path';

import cleanup from 'rollup-plugin-cleanup';
//import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import { terser } from "rollup-plugin-terser";

export default {
	input: 'src/index.js',
	output: {
		file: 'dist/event-viewer.js',
		format: 'es',
		globals: {
			jquery: '$'
		},
		banner: "// SPDX-License-Identifier: LGPL-3.0-or-later\n// Copyright © 2021 fvtt-event-viewer Rui Pinheiro\n",
		compact: true,
		interop: false,
		sourcemap: 'dist/event-viewer.js.map',
		sourcemapPathTransform: (nm) => {
			const basename = path.basename(nm);
			if(basename == 'listeners.js')
				return nm;
			else
				return path.join(path.dirname(nm), 'EvtVwr-' + path.basename(nm));
		}
	},
	plugins: [
		cleanup({
			comments: 'jsdoc'
		}),
		/*getBabelOutputPlugin({
			plugins: [
			]
		}),*/
		terser({
			ecma: 2021,
			toplevel: true,
			module: true,
			/*mangle: {
				properties: {
					regex: /^_/
				}
			}*/
		})
	]
};