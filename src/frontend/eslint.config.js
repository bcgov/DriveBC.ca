import js from "@eslint/js";
import globals from "globals";
import eslintReact from "@eslint-react/eslint-plugin";
import prettierConfig from "eslint-config-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    extends: [eslintReact.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node, 
      },
    },
    rules: {
      "@eslint-react/no-nested-component-definitions": "warn",
      "@eslint-react/rules-of-hooks": "warn",
      "@eslint-react/static-components": "warn",
      "no-unused-vars": "off",
    },
  },

  prettierConfig,
  
  {
    ignores: ["build/**", "dist/**", "node_modules/**"],
  }
]);