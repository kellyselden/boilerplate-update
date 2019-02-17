module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017
  },
  plugins: [
    'node',
    'json-files'
  ],
  extends: [
    'sane',
    'plugin:node/recommended'
  ],
  env: {
    es6: true,
    node: true
  },
  rules: {
    'json-files/no-branch-in-dependencies': ['error', { ignore: ['eslint-plugin-prefer-let'] }],
    'json-files/require-engines': 'error',
    'json-files/require-license': 'error'
  },
  overrides: [
    {
      files: ['test/**/*-test.js'],
      plugins: [
        'mocha'
      ],
      env: {
        mocha: true
      },
      rules: {
        'mocha/no-exclusive-tests': 'error'
      }
    }
  ]
};
