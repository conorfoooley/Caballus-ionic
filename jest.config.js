module.exports = {
    testMatch: ['**/+(*.)+(spec|test).+(ts)?(x)'],
    transform: {
        "^.+\\.(ts|js|mjs|html|svg)$": "ts-jest",
    },
    transformIgnorePatterns: [
        "node_modules/(?!@ionic-native|@ionic)"
    ],
    resolver: '@nrwl/jest/plugins/resolver',
    moduleFileExtensions: ['ts', 'js', 'html'],
    collectCoverage: true,
    coverageReporters: ['html'],
    "moduleNameMapper": {
        "^lodash-es$": "lodash"
    }
};
