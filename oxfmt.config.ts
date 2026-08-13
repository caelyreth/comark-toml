import { defineConfig } from 'oxfmt'

export default defineConfig({
  ignorePatterns: ['test/fixtures/**'],
  printWidth: 76,
  semi: false,
  singleQuote: true,
  sortImports: true,
  quoteProps: 'consistent',
  sortPackageJson: true,
  jsdoc: {
    commentLineStrategy: 'multiline',
    preferCodeFences: true,
    separateReturnsFromParam: true,
  },
})
