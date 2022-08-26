import { assert, expect } from 'chai';
import { MinilinkCollection, MinilinksGeneratorOptionsDefault } from '../imports/minilinks';

describe('minilinks-query', () => {
  it(`minilinks.query { id: { _gt: 2 } }`, async () => {
    const mlc = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
    mlc.add([
      { id: 1, type_id: 3, },
      { id: 3, type_id: 3, from_id: 1, to_id: 2 },
      { id: 5, type_id: 3, from_id: 7, to_id: 3 },
    ]);
    expect(mlc.query({ id: { _gt: 2 } })).to.have.lengthOf(2);
  });
  it(`minilinks.query { typed: { from_id: { _eq: 7 } } }`, async () => {
    const mlc = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
    mlc.add([
      { id: 1, type_id: 3, },
      { id: 3, type_id: 3, from_id: 1, to_id: 2 },
      { id: 5, type_id: 3, from_id: 7, to_id: 3 },
    ]);
    expect(mlc.query({ typed: { from_id: { _eq: 7 } } })).to.have.lengthOf(1);
  });
});