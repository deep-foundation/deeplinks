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
import { HasuraApi } from '@deep-foundation/hasura/api.js';
import { DeepClient } from "../imports/client";
import { assert } from 'chai';
import { insertHandler, deleteHandler } from "../imports/handlers";
import { delay } from "../imports/promise";
export const api = new HasuraApi({
    path: process.env.DEEPLINKS_HASURA_PATH,
    ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
    secret: process.env.DEEPLINKS_HASURA_SECRET,
});
const apolloClient = generateApolloClient({
    path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
    ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
    secret: process.env.DEEPLINKS_HASURA_SECRET,
});
const deep = new DeepClient({ apolloClient });
describe('tree', () => {
    it(`promiseTree`, () => __awaiter(void 0, void 0, void 0, function* () {
        let linksToDelete = [];
        const typeTypeLinkId = yield deep.id("@deep-foundation/core", "Type");
        const handleInsertTypeLinkId = yield deep.id("@deep-foundation/core", "HandleInsert");
        const { data: [{ id: customTypeLinkId }] } = yield deep.insert({
            type_id: typeTypeLinkId,
        });
        linksToDelete.push(customTypeLinkId);
        const handler = yield insertHandler(handleInsertTypeLinkId, customTypeLinkId, `async () => {}`);
        const { data: [{ id: customLinkId }] } = yield deep.insert({
            type_id: customTypeLinkId
        });
        linksToDelete.push(customLinkId);
        yield delay(5000);
        try {
            const { data: promiseTreeLinksDownToCustomLink } = yield deep.select({
                up: {
                    parent_id: { _eq: customLinkId },
                    tree_id: { _eq: yield deep.id("@deep-foundation/core", "promiseTree") }
                }
            });
            console.log({ promiseTreeLinksDownToCustomLink });
            linksToDelete = [...linksToDelete, ...promiseTreeLinksDownToCustomLink.map(link => link.id)];
            const thenTypeLinkId = yield deep.id("@deep-foundation/core", "Then");
            const thenLinkId = promiseTreeLinksDownToCustomLink.find(link => link.type_id === thenTypeLinkId);
            assert.notEqual(thenLinkId, undefined);
            const promiseTypeLinkId = yield deep.id("@deep-foundation/core", "Promise");
            const promiseLinkId = promiseTreeLinksDownToCustomLink.find(link => link.type_id === promiseTypeLinkId);
            assert.notEqual(promiseLinkId, undefined);
            const resolvedTypeLinkId = yield deep.id("@deep-foundation/core", "Resolved");
            const resolvedLinkId = promiseTreeLinksDownToCustomLink.find(link => link.type_id === resolvedTypeLinkId);
            assert.notEqual(resolvedLinkId, undefined);
        }
        finally {
            yield deleteHandler(handler);
            yield deep.delete(linksToDelete);
        }
    }));
});
//# sourceMappingURL=tree.js.map