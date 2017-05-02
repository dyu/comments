import svelte from 'rollup-plugin-svelte';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import buble from 'rollup-plugin-buble';
import closure from 'rollup-plugin-closure-compiler-js';
import filesize from 'rollup-plugin-filesize';

// you can use UglifyJS instead of Closure — the result will be ~3.3kb
// import uglify from 'rollup-plugin-uglify';

const plugins = [ nodeResolve(), commonjs(), svelte({ css: true }) ];
if ( process.env.production ) {
	plugins.push(
		buble(),
		closure({
			compilationLevel: 'ADVANCED'
		}),
		filesize()
	);
}

export default {
	entry: 'src/main.js',
	dest: 'dist/build.js',
	format: 'iife',
	plugins,
	sourceMap: true
};
