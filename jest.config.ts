export default {
  verbose: true,

  projects: [
    {
      displayName: 'dom',
      testEnvironment: 'jsdom',
      testMatch: [ '**/?(*.)+(react.test).[jt]s?(x)' ]
    },
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [ '**/?(*.)+(integration|unit).test.[jt]s?(x)' ],
    },
  ],
};