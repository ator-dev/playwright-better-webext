import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  ...tseslint.config({
    files: [ "**/*.ts", "**/*.tsx" ],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      {
        languageOptions: {
          parserOptions: {
            projectService: {
              allowDefaultProject: [ "tests/*.test.ts" ],
            },
            tsconfigRootDir: import.meta.dirname,
          },
          globals: {
            ...globals.node,
            ...globals.browser,
            ...globals.webextensions,
          },
        },
      },
    ],
  }),
  {
    files: [ "**/*.ts", "**/*.tsx" ],
    plugins: {
      tseslint: tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": [ "error", { "argsIgnorePattern": "^_" } ],
    },
  },
  {
    ignores: [ "./dist/**/*" ],
  },
];
