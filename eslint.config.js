import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    ignores: ["node_modules/", "dist/", "build/"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      // Add custom rules if needed
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
