import { Packager, Package } from './packager';

export const deepcaseSymbolsPckg: Package = {
  package: {
    name: '@deep-foundation/deepcase',
    version: '0.0.0',
    uri: 'deep-foundation/deepcase',
    type: 'git',
  },
  dependencies: {
    1: {
      name: '@deep-foundation/core',
      version: '0.0.0',
    },
  },
  data: [
    { id: 'Type', package: { dependencyId: 1, containValue: 'Type' } },
    { id: 'Symbol', package: { dependencyId: 1, containValue: 'Symbol' } },
    { id: 'Query', package: { dependencyId: 1, containValue: 'Query' } },
    { id: 'Any', package: { dependencyId: 1, containValue: 'Any' } },

    { id: 'Traveler', type: 'Type', from: 'Any', to: 'Query' },
    { id: 'travelerSymbol', type: 'Symbol', from: 'package', to: 'Traveler', value: { value: '🧳' } },
  ],
  errors: [],
};