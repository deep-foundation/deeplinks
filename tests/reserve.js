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
const root = new DeepClient({ apolloClient });
let adminToken;
let deep;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    const { linkId, token } = yield root.jwt({ linkId: yield root.id('deep', 'admin') });
    adminToken = token;
    deep = new DeepClient({ deep: root, token: adminToken, linkId });
}));
describe('reserve', () => {
    it(`root reserve`, () => __awaiter(void 0, void 0, void 0, function* () {
        const ids = yield root.reserve(3);
        assert.equal(ids.length, 3);
    }));
    it(`admin reserve`, () => __awaiter(void 0, void 0, void 0, function* () {
        const ids = yield deep.reserve(3);
        assert.equal(ids.length, 3);
    }));
});
//# sourceMappingURL=reserve.js.map