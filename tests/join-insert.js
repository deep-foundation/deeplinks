var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient } from "../imports/client";
import { assert } from 'chai';
const apolloClient = generateApolloClient({
    path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
    ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
    secret: process.env.DEEPLINKS_HASURA_SECRET,
});
const deep = new DeepClient({ apolloClient });
describe('join-insert', () => {
    it(`{ type_id: 1, string: { data: { value: 'abc' } }, from: { data: { type_id: 1 } }, to: { data: { type_id: 1 } } }`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const r = yield deep.insert({ type_id: 1, string: { data: { value: 'abc' } }, from: { data: { type_id: 1 } }, to: { data: { type_id: 1 } } }, { returning: `id type_id value from_id from { id type_id } to_id to { id type_id }` });
        const rId = (_b = (_a = r === null || r === void 0 ? void 0 : r.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id;
        const vId = (_e = (_d = (_c = r === null || r === void 0 ? void 0 : r.data) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.value) === null || _e === void 0 ? void 0 : _e.id;
        assert.equal(r === null || r === void 0 ? void 0 : r.data, [{
                id: rId, type_id: 1,
                value: { id: vId, link_id: rId, value: 'abc' },
                from_id: rId - 1, from: { id: rId - 1, type_id: 1, __typename: 'links' },
                to_id: rId - 2, to: { id: rId - 2, type_id: 1, __typename: 'links' },
            }]);
    }));
});
//# sourceMappingURL=join-insert.js.map