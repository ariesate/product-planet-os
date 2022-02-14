/**
 * @type {import('eslint-define-config').EslintConfig}
 */
module.exports = {
  parser: '@babel/eslint-parser',
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'standard',
    'plugin:react/recommended'
  ],
  plugins: [
    'react'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    requireConfigFile: false,
    ecmaFeatures: {
      impliedStrict: true,
      jsx: true
    },
    babelOptions: {
      presets: ['@babel/preset-react']
    }
  },
  settings: {
    react: {
      pragma: 'createElement',
      version: '17'
    }
  },
  rules: {
    'no-unused-vars': 'warn',
    'react/prop-types': 'off',
    'dot-notation': 'off',
    'prefer-promise-reject-errors': 'warn',
    'react/display-name': 'off'
  }
}
