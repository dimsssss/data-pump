// lint-staged.config.js
export default {
  "*.{ts,tsx}": () => "pnpm -r run typecheck",
  "*.{ts,tsx,js,jsx,json,md,css}": "prettier --write",
  "*.{ts,tsx,js,jsx,mjs,cjs}": "eslint --fix",
};
