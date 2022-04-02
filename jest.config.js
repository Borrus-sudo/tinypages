/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    "preset": "ts-jest/presets/default-esm",
    "globals": {
      "ts-jest": {
        "useESM": true
      }
    },
    testEnvironment: "node",
    rootDir: "packages/",
    testMatch: ["<rootDir>/**/test/*.ts"],
    coveragePathIgnorePatterns: ["/node_modules/"],
};
