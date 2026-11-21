import { defineConfig } from 'oxfmt'

export default defineConfig({
  semi: false,
  printWidth: 120,
  singleQuote: true,
  trailingComma: 'es5',
  sortPackageJson: true,
  sortImports: {
    order: 'desc',
  },
})
