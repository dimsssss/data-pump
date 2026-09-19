import eslintConfig from "./packages/conventions/eslint.config.js";

export default [
  { ignores: ["**/dist/**", "**/out/**", "**/.vite/**", "**/release/**"] },
  ...eslintConfig.map((c) => ({
    ...c,
    files: ["packages/components/**/*.{ts,tsx}", "apps/electron/**/*.{ts,tsx}"],
  })),
];
