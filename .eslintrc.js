module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2018
  },
  extends: [
    'sane-node'
  ],
  env: {
    es6: true
  },
  rules: {
  },
  overrides: [
    {
      files: ['test/**/*-test.js'],
      plugins: [
        'mocha'
      ],
      extends: [
        'plugin:mocha/recommended'
      ],
      env: {
        mocha: true
      },
      rules: {
        'mocha/no-setup-in-describe': 0,
        'mocha/no-hooks-for-single-case': 0
      }
    }
  ]
};
