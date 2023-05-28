import { assert, expect } from 'chai';
import { MinilinkCollection, MinilinksGeneratorOptionsDefault } from '../imports/minilinks.js';

describe('minilinks-query', () => {
  it(`minilinks.query { _or: [{ id: { _eq: 1 } }, { id: { _eq: 2 } }] }`, async () => {
    const mlc = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
    mlc.add([
      { id: 1, type_id: 1 },
      { id: 2, type_id: 1 },
      { id: 3, type_id: 1 },
    ]);
    expect(mlc.query({ _or: [{ id: { _eq: 1 } }, { id: { _eq: 2 } }] })).to.have.lengthOf(2);
  });
  it(`minilinks.query { _and: [{ type_id: { _eq: 1 } }, { id: { _eq: 2 } }] }`, async () => {
    const mlc = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
    mlc.add([
      { id: 1, type_id: 1 },
      { id: 2, type_id: 1 },
      { id: 3, type_id: 1 },
    ]);
    expect(mlc.query({ _and: [{ type_id: { _eq: 1 } }, { id: { _eq: 2 } }] })).to.have.lengthOf(1);
  });
  it(`minilinks.query { _not: { id: { _eq: 1 } } }`, async () => {
    const mlc = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
    mlc.add([
      { id: 1, type_id: 1 },
      { id: 2, type_id: 1 },
      { id: 3, type_id: 1 },
    ]);
    expect(mlc.query({ _not: { id: { _eq: 3 } } })).to.have.lengthOf(2);
  });
  it(`minilinks.query { id: { _in: [2] } }`, async () => {
    const mlc = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
    mlc.add([
      { id: 1, type_id: 1 },
      { id: 2, type_id: 1 },
      { id: 3, type_id: 1 },
    ]);
    expect(mlc.query({ id: { _in: [2] } })).to.have.lengthOf(1);
  });
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
  it(`minilinks.query { type_id: 3, to: { type_id: 2 } }`, async () => {
    const mlc = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
    mlc.add([
      { id: 1, type_id: 2, },
      { id: 3, type_id: 3, from_id: 4, to_id: 4 },
      { id: 6, type_id: 3, from_id: 1, to_id: 1 },
    ]);
    expect(mlc.query({
      type_id: 3,
      to: { type_id: 2 },
    })).to.have.lengthOf(1);
  });
  it(`minilinks.query { from_id: undefined }`, async () => {
    const mlc = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
    mlc.add([
      { id: 1, type_id: 2, },
    ]);
    assert.throws(() => {
      mlc.query({ from_id: undefined });
    }, 'from_id === undefined');
  });
  it(`minilinks.query { value: { value: { _eq: 'abc' } } }`, async () => {
    const mlc = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
    mlc.add([
      { id: 1, type_id: 2, },
      { id: 2, type_id: 2, string: { value: 'abc' } },
    ]);
    expect(mlc.query({
      string: { value: { _eq: 'abc' } }
    })).to.have.lengthOf(1);
  });
  it(`minilinks.query { value: { value: { _like: 'bc' } } }`, async () => {
    const mlc = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
    mlc.add([
      { id: 1, type_id: 2, },
      { id: 2, type_id: 2, value: { value: 'abc' } },
    ]);
    expect(mlc.query({
      value: { value: { _like: 'abc' } }
    })).to.have.lengthOf(1);
  });
  it(`minilinks.query { in: { id: 2 } }`, async () => {
    const mlc = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
    mlc.add([
      { id: 1, type_id: 2, },
      { id: 2, type_id: 2, to_id: 1, from_id: 1 },
    ]);
    expect(mlc.query({ in: { id: 2 } })).to.have.lengthOf(1);
  });
});