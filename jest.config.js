/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    rootDir: "packages/",
    testMatch: ["<rootDir>/**/test/*.ts"],
    coveragePathIgnorePatterns: ["/node_modules/"],
};