import typescript from 'rollup-plugin-typescript2';
import { readFileSync } from 'fs';
import ts from 'typescript';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    'react',
    'react-dom',
  ],
  plugins: [
    typescript({
      typescript: ts,
      useTsconfigDeclarationDir: true,
    }),
  ],
};