import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "data/**"] },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["scripts/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
