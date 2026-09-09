import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

const noUnusedVars = [
  "error",
  {
    argsIgnorePattern: "^_",
    varsIgnorePattern: "^_",
    caughtErrorsIgnorePattern: "^_",
  },
];

export default [
  {
    ignores: [
      "node_modules/",
      "**/dist/",
      "build/",
      "coverage/",
      "*.tsbuildinfo",
      // Scaffolding templates are standalone mini-projects, not SDK source.
      "packages/template/",
      "packages/hardhat/",
      "packages/react-template/",
      "packages/vue-template/",
      ".env",
      ".env.example",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      "no-unused-vars": noUnusedVars,
    },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.{ts,mts,cts,tsx}"],
  })),
  {
    files: ["**/*.{ts,mts,cts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": noUnusedVars,
    },
  },
  prettierConfig,
];
