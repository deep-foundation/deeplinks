import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient } from "../imports/client";
import { assert } from 'chai';
import { stringify } from "querystring";

const adminToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsibGluayJdLCJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJsaW5rIiwieC1oYXN1cmEtdXNlci1pZCI6IjI0In0sImlhdCI6MTY0MDM5MDY1N30.l8BHkbl0ne3yshcF73rgPVR-Sskr0hHECr_ZsJyCdxA`;

const apolloClient = generateApolloClient({
  path: `${process.env.HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.HASURA_SSL,
  token: adminToken,
});

const deep = new DeepClient({ apolloClient });

describe('permissions', () => {
  describe('select', () => {
    it(`user contain range`, async () => {
      const a1 = await deep.guest({});
      const a2 = await deep.guest({});
      const d1 = new DeepClient({ deep, auth: a1 });
      const d2 = new DeepClient({ deep, auth: a2 });
      const { data: [{ id }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
        in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Contain'),
          from_id: a1.linkId,
        } }
      });
      const n1 = await d1.select({ id });
      assert.lengthOf(n1?.data, 1);
      const n2 = await d2.select({ id });
      assert.lengthOf(n2?.data, 0);
    });
    // it(`rule select 1 depth`, async () => {
    //   const a1 = await deep.guest({});
    //   const a2 = await deep.guest({});
    //   const a3 = await deep.guest({});
    //   const d1 = new DeepClient({ deep, auth: a1 });
    //   const d2 = new DeepClient({ deep, auth: a2 });
    //   const d3 = new DeepClient({ deep, auth: a3 });
    //   const { data: [{ id }] } = await deep.insert({
    //     type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
    //     in: { data: {
    //       type_id: await deep.id('@deep-foundation/core', 'Contain'),
    //       from_id: a1.linkId,
    //     } }
    //   });
    //   await deep.insert({
    //     type_id: await deep.id('@deep-foundation/core', 'Rule'),
    //     out: { data: [
    //       {
    //         type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
    //         to: { data: {
    //           type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //           out: { data: {
    //             type_id: await deep.id('@deep-foundation/core', 'Selection'),
    //             to_id: a2.linkId,
    //           } }
    //         } }
    //       },
    //       {
    //         type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
    //         to: { data: {
    //           type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //           out: { data: {
    //             type_id: await deep.id('@deep-foundation/core', 'Selection'),
    //             to_id: id
    //           } }
    //         } }
    //       },
    //       {
    //         type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
    //         to: { data: {
    //           type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //           out: { data: {
    //             type_id: await deep.id('@deep-foundation/core', 'Selection'),
    //             to_id: await deep.id('@deep-foundation/core', 'Select'),
    //           } }
    //         } }
    //       },
    //     ] },
    //   });
    //   const n1 = await d1.select({ id });
    //   assert.lengthOf(n1?.data, 1);
    //   const n2 = await d2.select({ id });
    //   assert.lengthOf(n2?.data, 1);
    //   const n3 = await d3.select({ id });
    //   assert.lengthOf(n3?.data, 0);
    // });
    // it(`rule select 2 depth`, async () => {
    //   const a1 = await deep.guest({});
    //   const a2 = await deep.guest({});
    //   const a3 = await deep.guest({});
    //   const d1 = new DeepClient({ deep, auth: a1 });
    //   const d2 = new DeepClient({ deep, auth: a2 });
    //   const d3 = new DeepClient({ deep, auth: a3 });
    //   const { data: [{ id }] } = await deep.insert({
    //     type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
    //     in: { data: {
    //       type_id: await deep.id('@deep-foundation/core', 'Contain'),
    //       from: { data: {
    //         type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
    //         in: { data: {
    //           type_id: await deep.id('@deep-foundation/core', 'Contain'),
    //           from_id: a1.linkId,
    //         } },
    //       } },
    //     } }
    //   });
    //   await deep.insert({
    //     type_id: await deep.id('@deep-foundation/core', 'Rule'),
    //     out: { data: [
    //       {
    //         type_id: await deep.id('@deep-foundation/core', 'RuleSubject'),
    //         to: { data: {
    //           type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //           out: { data: {
    //             type_id: await deep.id('@deep-foundation/core', 'Selection'),
    //             to_id: a2.linkId,
    //           } }
    //         } }
    //       },
    //       {
    //         type_id: await deep.id('@deep-foundation/core', 'RuleObject'),
    //         to: { data: {
    //           type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //           out: { data: {
    //             type_id: await deep.id('@deep-foundation/core', 'Selection'),
    //             to_id: id
    //           } }
    //         } }
    //       },
    //       {
    //         type_id: await deep.id('@deep-foundation/core', 'RuleAction'),
    //         to: { data: {
    //           type_id: await deep.id('@deep-foundation/core', 'Selector'),
    //           out: { data: {
    //             type_id: await deep.id('@deep-foundation/core', 'Selection'),
    //             to_id: await deep.id('@deep-foundation/core', 'Select'),
    //           } }
    //         } }
    //       },
    //     ] },
    //   });
    //   const n1 = await d1.select({ id });
    //   assert.lengthOf(n1?.data, 1);
    //   const n2 = await d2.select({ id });
    //   assert.lengthOf(n2?.data, 1);
    //   const n3 = await d3.select({ id });
    //   assert.lengthOf(n3?.data, 0);
    // });
  });
  describe('insert', () => {
    // it(`guest cant insert`, async () => {
    //   const a1 = await deep.guest({});
    //   const d1 = new DeepClient({ deep, auth: a1 });
    //   await deep.insert({
    //     type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
    //   });
    //   const n1 = await d1.select({ id });
    //   assert.lengthOf(n1?.data, 1);
    //   const n2 = await d2.select({ id });
    //   assert.lengthOf(n2?.data, 0);
    // });
  });
});