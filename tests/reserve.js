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
const client_1 = require("@deep-foundation/hasura/client");
const client_2 = require("../imports/client");
const chai_1 = require("chai");
const apolloClient = (0, client_1.generateApolloClient)({
    path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
    ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
    secret: process.env.DEEPLINKS_HASURA_SECRET,
});
const root = new client_2.DeepClient({ apolloClient });
let adminToken;
let deep;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    const { linkId, token } = yield root.jwt({ linkId: yield root.id('deep', 'admin') });
    adminToken = token;
    deep = new client_2.DeepClient({ deep: root, token: adminToken, linkId });
}));
describe('reserve', () => {
    it(`root reserve`, () => __awaiter(void 0, void 0, void 0, function* () {
        const ids = yield root.reserve(3);
        chai_1.assert.equal(ids.length, 3);
    }));
    it(`admin reserve`, () => __awaiter(void 0, void 0, void 0, function* () {
        const ids = yield deep.reserve(3);
        chai_1.assert.equal(ids.length, 3);
    }));
});
//# sourceMappingURL=reserve.js.map