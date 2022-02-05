import { assert, expect } from 'chai';
import { MinilinkCollection, MinilinksGeneratorOptionsDefault } from '../imports/minilinks';

describe('minilinks', () => {
  it(`add 1 3 5`, async () => {
    const mlc = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
    const { anomalies } = mlc.add([
      { id: 1, type_id: 3, },
      { id: 3, type_id: 3, from_id: 1, to_id: 2 },
      { id: 5, type_id: 3, from_id: 7, to_id: 3 },
    ]);
    const { errors } = mlc.add([
      { id: 1, type_id: 3, },
    ]);
    expect(mlc?.byId?.[3]?.from?.id).to.be.equal(1);
    expect(mlc?.byId?.[3]?.to).to.be.undefined;
    expect(mlc?.byId?.[5]?.from).to.be.undefined;
    expect(anomalies).to.have.lengthOf(2);
    expect(anomalies?.[0]?.message).to.be.equal(`3 link.to_id 2 not founded`);
    expect(anomalies?.[1]?.message).to.be.equal(`5 link.from_id 7 not founded`);
    expect(errors).to.have.lengthOf(1);
    expect(errors?.[0]?.message).to.be.equal(`1 can't add because already exists in collection`);
  });
  it(`add 2`, async () => {
    const mlc = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
    mlc.add([
      { id: 1, type_id: 3, from_id: 2 },
      { id: 3, type_id: 3, from_id: 1, to_id: 2 },
      { id: 5, type_id: 2, from_id: 7, to_id: 3 },
    ]);
    const { anomalies } = mlc.add([
      { id: 2, type_id: 1 },
    ]);
    expect(anomalies).to.have.lengthOf(0);
    expect(mlc?.byId?.[1]?.from?.id).to.be.equal(2);
    expect(mlc?.byId?.[3]?.to).to.not.be.undefined;
    expect(mlc?.byId?.[3]?.to?.id).to.be.equal(2);
    expect(mlc?.byId?.[5]?.type?.id).to.be.equal(2);
  });
  it(`remove 2`, async () => {
    const mlc = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
    mlc.add([
      { id: 1, type_id: 3, from_id: 2 },
      { id: 3, type_id: 3, from_id: 1, to_id: 2 },
      { id: 5, type_id: 2, from_id: 7, to_id: 3 },
    ]);
    mlc.add([
      { id: 2, type_id: 1 },
    ]);
    const { errors } = mlc.remove([2, 4]);
    expect(errors).to.have.lengthOf(1);
    expect(errors?.[0]?.message).to.be.equal(`4 can't delete because not exists in collection`);
    expect(mlc?.byId?.[1]?.from).to.be.undefined;
    expect(mlc?.byId?.[3]?.to).to.be.undefined;
    expect(mlc?.byId?.[5]?.type).to.be.undefined;
  });
  it(`apply`, async () => {
    const mlc = new MinilinkCollection(MinilinksGeneratorOptionsDefault);
    mlc.apply([
      { id: 1, type_id: 3, from_id: 2 },
      { id: 3, type_id: 3, from_id: 1, to_id: 2, value: { value: 123 } },
      { id: 5, type_id: 2, from_id: 7, to_id: 3 },
    ]);
    mlc.apply([
      { id: 1, type_id: 3, from_id: 2 },
      { id: 2, type_id: 1 },
      { id: 3, type_id: 1, from_id: 5, to_id: 2, value: { value: 234 } },
    ]);
    expect(mlc?.byId?.[2]?.type?.id).to.be.equal(1);
    expect(mlc?.byId?.[3]?.type?.id).to.be.equal(1);
    expect(mlc?.byId?.[3]?.from).to.be.undefined;
    expect(mlc?.byId?.[3]?.to?.id).to.be.equal(2);
    expect(mlc?.byId?.[3]?.value?.value).to.be.equal(234);
    expect(mlc?.byId?.[5]).to.be.undefined;
  });
  // TODO inByType outByType
});