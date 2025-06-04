import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'public/js/index.js',
  output: {
    file: 'public/js/bundle.js',
    format: 'iife',
    sourcemap: true,
  },
  plugins: [resolve(), commonjs(), terser()],
};
