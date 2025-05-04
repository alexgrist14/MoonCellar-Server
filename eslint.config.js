// .eslintrc.js
import eslintPluginTs from '@typescript-eslint/eslint-plugin'
import parser from '@typescript-eslint/parser'

/** @type {import("eslint").Linter.Config} */
export default {
  parser,
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: process.cwd(),
    sourceType: 'module',
  },
  plugins: [eslintPluginTs],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    'prettier/prettier': 'off',
  },
}
