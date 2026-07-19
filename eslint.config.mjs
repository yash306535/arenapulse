import js from "@eslint/js";
import importX from "eslint-plugin-import-x";
import jsxA11y from "eslint-plugin-jsx-a11y";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "coverage/**", "next-env.d.ts", "*.config.mjs"],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  jsxA11y.flatConfigs.recommended,
  sonarjs.configs.recommended,
  unicorn.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "import-x": importX,
    },
    rules: {
      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import-x/no-duplicates": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": "error",

      // Complexity budgets — keep functions small and shallow.
      complexity: ["error", 15],
      "max-depth": ["error", 4],
      "max-params": ["error", 5],
      "max-nested-callbacks": ["error", 4],
      "sonarjs/cognitive-complexity": ["error", 18],

      // Unicorn: keep the high-signal rules, disable the opinionated/noisy ones
      // that fight React, the DOM, and our deliberate style choices.
      "unicorn/prevent-abbreviations": "off",
      "unicorn/no-null": "off",
      "unicorn/filename-case": "off",
      "unicorn/no-array-reduce": "off",
      "unicorn/no-nested-ternary": "off",
      "unicorn/prefer-global-this": "off",
      "unicorn/prefer-top-level-await": "off",
      "unicorn/no-useless-undefined": "off",
      "unicorn/no-array-callback-reference": "off",
      "unicorn/prefer-string-replace-all": "off",
      "unicorn/switch-case-braces": "off",
      "unicorn/prefer-query-selector": "off",
      "unicorn/no-keyword-prefix": "off",
      // `[...x].sort()` is already non-mutating and clearer than `toSorted`.
      "unicorn/no-array-sort": "off",
      // Prettier owns number formatting (it lowercases hex); avoid the conflict.
      "unicorn/number-literal-case": "off",
      // Nested ternaries are used sparingly and read clearly in context.
      "sonarjs/no-nested-conditional": "off",
    },
  },
  {
    // The logger is the single sanctioned console consumer.
    files: ["src/lib/logger.ts"],
    rules: { "no-console": "off" },
  },
  {
    // Tests may repeat literals and mirror structures for clarity.
    files: ["**/*.test.{ts,tsx}", "src/test/**"],
    rules: {
      "sonarjs/no-duplicate-string": "off",
      "sonarjs/no-identical-functions": "off",
      "sonarjs/prefer-specific-assertions": "off",
      "sonarjs/no-element-overwrite": "off",
      "sonarjs/no-floating-point-equality": "off",
      "max-nested-callbacks": "off",
    },
  },
);
