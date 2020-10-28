// https://facebook.github.io/jest/docs/en/configuration.html
module.exports = {
  coverageDirectory: '<rootDir>/tests/__coverage__/',
  preset: 'ts-jest',
  rootDir: '.',
  roots: ['<rootDir>/src/', '<rootDir>/tests/'],
  transform: { '\\.ts$': ['ts-jest'] },
  transformIgnorePatterns: ['/node_modules/'],
  testEnvironment: 'node',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/tests/__mocks__/fileMock.js',
    '\\.(css|scss|less)$': '<rootDir>/tests/__mocks__/styleMock.js',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  globals: {
    'ts-jest': {
      tsConfig: {
        allowJs: true // allow js in typescript
      }
    }
  }
}
