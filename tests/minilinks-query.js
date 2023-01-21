"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const minilinks_1 = require("../imports/minilinks");
describe('minilinks-query', () => {
    it(`minilinks.query { _or: [{ id: { _eq: 1 } }, { id: { _eq: 2 } }] }`, () => __awaiter(void 0, void 0, void 0, function* () {
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        mlc.add([
            { id: 1, type_id: 1 },
            { id: 2, type_id: 1 },
            { id: 3, type_id: 1 },
        ]);
        (0, chai_1.expect)(mlc.query({ _or: [{ id: { _eq: 1 } }, { id: { _eq: 2 } }] })).to.have.lengthOf(2);
    }));
    it(`minilinks.query { _and: [{ type_id: { _eq: 1 } }, { id: { _eq: 2 } }] }`, () => __awaiter(void 0, void 0, void 0, function* () {
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        mlc.add([
            { id: 1, type_id: 1 },
            { id: 2, type_id: 1 },
            { id: 3, type_id: 1 },
        ]);
        (0, chai_1.expect)(mlc.query({ _and: [{ type_id: { _eq: 1 } }, { id: { _eq: 2 } }] })).to.have.lengthOf(1);
    }));
    it(`minilinks.query { _not: { id: { _eq: 1 } } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        mlc.add([
            { id: 1, type_id: 1 },
            { id: 2, type_id: 1 },
            { id: 3, type_id: 1 },
        ]);
        (0, chai_1.expect)(mlc.query({ _not: { id: { _eq: 3 } } })).to.have.lengthOf(2);
    }));
    it(`minilinks.query { id: { _in: [2] } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        mlc.add([
            { id: 1, type_id: 1 },
            { id: 2, type_id: 1 },
            { id: 3, type_id: 1 },
        ]);
        (0, chai_1.expect)(mlc.query({ id: { _in: [2] } })).to.have.lengthOf(1);
    }));
    it(`minilinks.query { id: { _gt: 2 } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        mlc.add([
            { id: 1, type_id: 3, },
            { id: 3, type_id: 3, from_id: 1, to_id: 2 },
            { id: 5, type_id: 3, from_id: 7, to_id: 3 },
        ]);
        (0, chai_1.expect)(mlc.query({ id: { _gt: 2 } })).to.have.lengthOf(2);
    }));
    it(`minilinks.query { typed: { from_id: { _eq: 7 } } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        mlc.add([
            { id: 1, type_id: 3, },
            { id: 3, type_id: 3, from_id: 1, to_id: 2 },
            { id: 5, type_id: 3, from_id: 7, to_id: 3 },
        ]);
        (0, chai_1.expect)(mlc.query({ typed: { from_id: { _eq: 7 } } })).to.have.lengthOf(1);
    }));
    it(`minilinks.query { type_id: 3, to: { type_id: 2 } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        mlc.add([
            { id: 1, type_id: 2, },
            { id: 3, type_id: 3, from_id: 4, to_id: 4 },
            { id: 6, type_id: 3, from_id: 1, to_id: 1 },
        ]);
        (0, chai_1.expect)(mlc.query({
            type_id: 3,
            to: { type_id: 2 },
        })).to.have.lengthOf(1);
    }));
    it(`minilinks.query { from_id: undefined }`, () => __awaiter(void 0, void 0, void 0, function* () {
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        mlc.add([
            { id: 1, type_id: 2, },
        ]);
        chai_1.assert.throws(() => {
            mlc.query({ from_id: undefined });
        }, 'from_id === undefined');
    }));
    it(`minilinks.query { value: { value: { _eq: 'abc' } } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        mlc.add([
            { id: 1, type_id: 2, },
            { id: 2, type_id: 2, string: { value: 'abc' } },
        ]);
        (0, chai_1.expect)(mlc.query({
            value: { value: { _eq: 'abc' } }
        })).to.have.lengthOf(1);
    }));
    it(`minilinks.query { value: { value: { _like: 'bc' } } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        mlc.add([
            { id: 1, type_id: 2, },
            { id: 2, type_id: 2, value: { value: 'abc' } },
        ]);
        (0, chai_1.expect)(mlc.query({
            value: { value: { _like: 'abc' } }
        })).to.have.lengthOf(1);
    }));
    it(`minilinks.query { in: { id: 2 } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        const mlc = new minilinks_1.MinilinkCollection(minilinks_1.MinilinksGeneratorOptionsDefault);
        mlc.add([
            { id: 1, type_id: 2, },
            { id: 2, type_id: 2, to_id: 1, from_id: 1 },
        ]);
        (0, chai_1.expect)(mlc.query({ in: { id: 2 } })).to.have.lengthOf(1);
    }));
});
//# sourceMappingURL=minilinks-query.js.map