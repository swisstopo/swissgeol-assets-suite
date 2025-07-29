const baseConfig = require('../../eslint.config.js');

module.exports = baseConfig.map((entry) => {
  if (entry.rules) {
    return {
      ...entry,
      rules: {
        ...entry.rules,
        '@angular-eslint/prefer-inject': 'off',
      },
    };
  }
  return entry;
});
