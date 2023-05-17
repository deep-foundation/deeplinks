import { generateApolloClient } from "@deep-foundation/hasura/client";
import { DeepClient, SerialOperation, useDeepSubscription } from "../imports/client";
import { assert } from 'chai';
import { BoolExpLink, MutationInputLink } from "../imports/client_types";
import { inspect} from 'util'
import { createSerialOperation } from "../imports/gql";
import {render, screen, waitFor} from '@testing-library/react'
import { DeepProvider } from '../imports/client';
import React, { useEffect } from "react";
import { ApolloProvider } from "@apollo/client";
import '@testing-library/jest-dom';


const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
  ws: true
});

const deepClient = new DeepClient({ apolloClient });

describe('client', () => {
  it(`deep.linkId guest and login`, async () => {
    assert.equal(deepClient.linkId, undefined);
    assert.notEqual(deepClient.linkId, 0);
    const guest = await deepClient.guest();
    const guestDeep = new DeepClient({ deep: deepClient, ...guest });
    assert.notEqual(guestDeep.linkId, undefined);
    assert.notEqual(guestDeep.linkId, 0);
    const guestId = guestDeep.linkId;
    const adminId = await deepClient.id('deep', 'admin');
    const admin = await deepClient.login({ linkId: adminId });
    const deep = new DeepClient({ deep: deepClient, ...admin });
    assert.notEqual(deep.linkId, undefined);
    assert.notEqual(deep.linkId, 0);
    assert.notEqual(deep.linkId, guestId);
  });
  it(`{ id: 5 }`, () => {
    assert.deepEqual(deepClient.serializeWhere({ id: 5 }), { id: { _eq: 5 } });
  });
  it(`{ id: { _eq: 5 } }`, () => {
    assert.deepEqual(deepClient.serializeWhere({ id: { _eq: 5 } }), { id: { _eq: 5 } });
  });
  it(`{ value: 5 }`, () => {
    assert.deepEqual(deepClient.serializeWhere({ value: 5 }), { number: { value: { _eq: 5 } } });
  });
  it(`{ value: 'a' }`, () => {
    assert.deepEqual(deepClient.serializeWhere({ value: 'a' }), { string: { value: { _eq: 'a' } } });
  });
  it(`{ number: 5 }`, () => {
    assert.deepEqual(deepClient.serializeWhere({ number: 5 }), { number: { value: { _eq: 5 } } });
  });
  it(`{ string: 'a' }`, () => {
    assert.deepEqual(deepClient.serializeWhere({ string: 'a' }), { string: { value: { _eq: 'a' } } });
  });
  it(`{ number: { value: { _eq: 5 } } }`, () => {
    assert.deepEqual(deepClient.serializeWhere({ number: { value: { _eq: 5 } } }), { number: { value: { _eq: 5 } } });
  });
  it(`{ string: { value: { _eq: 'a' } } }`, () => {
    assert.deepEqual(deepClient.serializeWhere({ string: { value: { _eq: 'a' } } }), { string: { value: { _eq: 'a' } } });
  });
  it(`{ object: { value: { _contains: { a: 'b' } } } }`, () => {
    assert.deepEqual(deepClient.serializeWhere({ object: { value: { _contains: { a: 'b' } } } }), { object: { value: { _contains: { a: 'b' } } } });
  });
  it(`{ from: { value: 5 } }`, () => {
    assert.deepEqual(deepClient.serializeWhere({ from: { value: 5 } }), { from: { number: { value: { _eq: 5 } } } });
  });
  it(`{ out: { type_id: Contain, value: item, from: where } }`, async () => {
    assert.deepEqual(deepClient.serializeWhere(
      {
        out: {
          type_id: await deepClient.id('@deep-foundation/core', 'Contain'),
          value: 'b',
          from: {
            type_id: await deepClient.id('@deep-foundation/core', 'Package'),
            value: 'a',
          },
        },
      }
    ), {
      out: {
        type_id: { _eq: await deepClient.id('@deep-foundation/core', 'Contain') },
        string: { value: { _eq: 'b' } },
        from: {
          type_id: { _eq: await deepClient.id('@deep-foundation/core', 'Package') },
          string: { value: { _eq: 'a' } },
        },
      }
    });
  });
  it(`{ value: 5, link: { type_id: 7 } }`, () => {
    assert.deepEqual(deepClient.serializeWhere(
      { value: 5, link: { type_id: 7 } },
      'value'
    ), {
      value: { _eq: 5 },
      link: {
        type_id: { _eq: 7 }
      },
    });
  });
  it(`{ type: ['@deep-foundation/core', 'Value'] }`, () => {
    assert.deepEqual(
      deepClient.serializeWhere({
        type: ["@deep-foundation/core", "Value"],
      }),
      {
        type: {
          in: {
            from: {
              string: { value: { _eq: "@deep-foundation/core" } },
              type_id: { _eq: 2 },
            },
            string: { value: { _eq: "Value" } },
            type_id: { _eq: 3 },
          },
        },
      },
    );
  });
  it(`{ type: ['@deep-foundation/core', 'Value'] }`, () => {
    assert.deepEqual(
      deepClient.serializeWhere({
        _or: [{
          type: ["@deep-foundation/core", "Value"],
        }, {
          type: ["@deep-foundation/core", "User"],
        }]
      }),
      {
        _or: [{
          type: {
            in: {
              from: {
                string: { value: { _eq: "@deep-foundation/core" } },
                type_id: { _eq: 2 },
              },
              string: { value: { _eq: "Value" } },
              type_id: { _eq: 3 },
            },
          },
        },{
          type: {
            in: {
              from: {
                string: { value: { _eq: "@deep-foundation/core" } },
                type_id: { _eq: 2 },
              },
              string: { value: { _eq: "User" } },
              type_id: { _eq: 3 },
            },
          },
        }]
      },
    );
  });
  it(`id(packageName,contain)`, async () => {
    const id = await deepClient.id('@deep-foundation/core', 'Value');
    assert.equal(id, 4);
  });
  it(`{ type_id: { _type_of: 25 } }`, () => {
    assert.deepEqual(deepClient.serializeWhere({ type_id: { _type_of: 25 } }), { type: { _by_item: { path_item_id: { _eq: 25 }, group_id: { _eq: 0 } } } });
  });
  it(`{ from_id: { _type_of: 25 } }`, () => {
    assert.deepEqual(deepClient.serializeWhere({ from_id: { _type_of: 25 } }), { from: { _by_item: { path_item_id: { _eq: 25 }, group_id: { _eq: 0 } } } });
  });
  it(`{ to_id: { _type_of: 25 } }`, () => {
    assert.deepEqual(deepClient.serializeWhere({ to_id: { _type_of: 25 } }), { to: { _by_item: { path_item_id: { _eq: 25 }, group_id: { _eq: 0 } } } });
  });
  it(`{ id: { _id: ['@deep-foundation/core', 'Package'] } }`, async () => {
    assert.deepEqual((await deepClient.select({ id: { _id: ['@deep-foundation/core', 'Package'] } }))?.data?.[0]?.id, 2);
  });
  it(`{ type_id: { _id: ['@deep-foundation/core', 'Package'] } }`, async () => {
    const packageId = await deepClient.id('@deep-foundation/core');
    assert.isTrue(!!(await deepClient.select({ type_id: { _id: ['@deep-foundation/core', 'Package'] } }))?.data?.find(p => p.id === packageId));
  });
  it(`{ up: { parent_id: { _id: ['@deep-foundation/core', 'Package'] } } }`, async () => {
    const packageId = await deepClient.id('@deep-foundation/core');
    assert.isTrue(!!(await deepClient.select({ up: { parent_id: { _id: ['@deep-foundation/core', 'Package'] } } }))?.data?.find(p => p.id === packageId));
  });
  it(`idLocal get from minilinks`, async () => {
    const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
    const containTypeLinkId = await deepClient.id("@deep-foundation/core", "Contain");
    const packageTypeLinkId = await deepClient.id("@deep-foundation/core", "Package");
    const packageName = "idLocal get from minilinks package";
    const {data: [packageLink]} = await deepClient.insert({
      type_id: packageTypeLinkId,
      string: {
        data: {
          value: packageName
        }
      }
    }, {returning: deepClient.selectReturning});
    const {data: [newTypeTypeLink]} = await deepClient.insert({
      type_id: typeTypeLinkId,
    }, {returning: deepClient.selectReturning});
    const {data: [containLink]} = await deepClient.insert({
      type_id: containTypeLinkId,
      from_id: packageLink.id,
      to_id: newTypeTypeLink.id,
      string: {
        data: {
          value: "Type"
        }
      }
    }, {returning: deepClient.selectReturning});
    deepClient.minilinks.apply([packageLink,containLink,newTypeTypeLink]);
    try {
      const newTypeTypeLinkId = deepClient.idLocal(packageName, "Type");
      assert.notEqual(newTypeTypeLinkId, 0);
      assert.equal(newTypeTypeLinkId, newTypeTypeLink.id);
    } finally {
      await deepClient.delete([packageLink.id, newTypeTypeLink.id, containLink.id])
    }
  })
  it(`insert link with reserved id and string value`, async () => {
    const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
    const reservedIds = await deepClient.reserve(1);
    try {
      await deepClient.insert({
        id: reservedIds[0],
        type_id: typeTypeLinkId,
        string: {
          data: {
            value: 'stringValue'
          }
        }
      });
    } finally {
      await deepClient.delete(reservedIds[0]);
    }
  })
  describe(`serial`, () => {
    describe('insert', () => {
      it('one insert', async () => {
        let linkIdsToDelete = [];
        const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
        const operation = createSerialOperation({
          table: 'links',
          type: 'insert',
          objects: {
            type_id: typeTypeLinkId
          }
        })
        try {
          const result = await deepClient.serial({
            operations: [
              operation,
            ]
          });
          assert.equal(result.error, undefined);
          assert.notEqual(result.data, undefined);
          linkIdsToDelete = [...linkIdsToDelete, ...result.data.map(link => link.id)];
          assert.strictEqual(result.data.length, 1);
        } finally {
          await deepClient.delete(linkIdsToDelete)
        }
      })
      it('multiple inserts in one operation', async () => {
        let linkIdsToDelete = [];
        const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
        const operation = createSerialOperation({
          table: 'links',
          type: 'insert',
          objects: {
            type_id: typeTypeLinkId
          }
        })
        try {
          const result = await deepClient.serial({
            operations: [
              operation,
              operation
            ]
          });
          assert.equal(result.error, undefined);
          assert.notEqual(result.data, undefined);
          linkIdsToDelete = [...linkIdsToDelete, ...result.data.map(link => link.id)];
          assert.strictEqual(result.data.length, 2);
        } finally {
          await deepClient.delete(linkIdsToDelete)
        }
      })
      it('multiple inserts ine multiple operations', async () => {
        let linkIdsToDelete = [];
        const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
        const operation = createSerialOperation({
          table: 'links',
          type: 'insert',
          objects: {
            type_id: typeTypeLinkId
          }
        })
        try {
          const result = await deepClient.serial({
            operations: [
              operation,
              operation
            ]
          });
          inspect(result);
          assert.equal(result.error, undefined);
          assert.notEqual(result.data, undefined);
          linkIdsToDelete = [...linkIdsToDelete, ...result.data.map(link => link.id)];
          assert.strictEqual(result.data.length, 2);
        } finally {
          await deepClient.delete(linkIdsToDelete)
        }
      })
    })
    describe('update', () => {
      it('one update', async () => {
        let linkIdsToDelete = [];
        const expectedValue = 'newStringValue';
        const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
        try {
          const insertResult = await deepClient.insert({
            type_id: typeTypeLinkId,
            string: {
              data: {
                value: "stringValue"
              }
            }
          })
          assert.equal(insertResult.error, undefined);
          assert.notEqual(insertResult.data, undefined);
          assert.strictEqual(insertResult.data.length, 1);
          const newLinkId = insertResult.data[0].id;
          linkIdsToDelete.push(newLinkId);
          const operation = createSerialOperation({
            table: 'strings',
            type: 'update',
              exp: {
                link_id: newLinkId,
              },
              value: {
                value: expectedValue
              }
          });
          const updateResult = await deepClient.serial({
            operations: [
              operation
            ]
          });
          assert.equal(updateResult.error, undefined);
          assert.notEqual(updateResult.data, undefined);
          assert.strictEqual(updateResult.data.length, 1);
          const { data: [newLink] } = await deepClient.select({
            id: newLinkId
          })
          assert.strictEqual(newLink.value.value, expectedValue)
        } finally {
          await deepClient.delete(linkIdsToDelete)
        }
      })
      it('multiple updates in one operation', async () => {
        let linkIdsToDelete = [];
        const expectedValue = 'newStringValue';
        const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
        try {
          const insertResult = await deepClient.insert({
            type_id: typeTypeLinkId,
            string: {
              data: {
                value: "stringValue"
              }
            }
          })
          assert.equal(insertResult.error, undefined);
          assert.notEqual(insertResult.data, undefined);
          assert.strictEqual(insertResult.data.length, 1);
          const newLinkId = insertResult.data[0].id;
          linkIdsToDelete.push(newLinkId);
          const operation = createSerialOperation({
            table: 'strings',
            type: 'update',
              exp: {
                link_id: newLinkId,
              },
              value: {
                value: expectedValue
              }
          });
          const updateResult = await deepClient.serial({
            operations: [
              operation,
              operation
            ]
          });
          assert.equal(updateResult.error, undefined);
          assert.notEqual(updateResult.data, undefined);
          assert.strictEqual(updateResult.data.length, 2);
          const { data: [newLink] } = await deepClient.select({
            id: newLinkId
          })
          assert.strictEqual(newLink.value.value, expectedValue)
        } finally {
          await deepClient.delete(linkIdsToDelete)
        }
      })
      it('multiple updates in multiple operations', async () => {
        let linkIdsToDelete = [];
        const expectedValue = 'newStringValue';
        const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
        try {
          const insertResult = await deepClient.insert({
            type_id: typeTypeLinkId,
            string: {
              data: {
                value: "stringValue"
              }
            }
          })
          assert.equal(insertResult.error, undefined);
          assert.notEqual(insertResult.data, undefined);
          assert.strictEqual(insertResult.data.length, 1);
          const newLinkId = insertResult.data[0].id;
          linkIdsToDelete.push(newLinkId);
          const operation = createSerialOperation({
            table: 'strings',
            type: 'update',
              exp: {
                link_id: newLinkId,
              },
              value: {
                value: expectedValue
              }
          });
          const updateResult = await deepClient.serial({
            operations: [
              operation,
              operation
            ]
          });
          assert.equal(updateResult.error, undefined);
          assert.notEqual(updateResult.data, undefined);
          assert.strictEqual(updateResult.data.length, 2);
          const { data: [newLink] } = await deepClient.select({
            id: newLinkId
          })
          assert.strictEqual(newLink.value.value, expectedValue)
        } finally {
          await deepClient.delete(linkIdsToDelete)
        }
      })
    })
    describe('delete', () => {
      it('one delete', async () => {
        let linkIdsToDelete = [];
        const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
        try {
          const { data: [{ id: newLinkId }] } = await deepClient.insert({
            type_id: typeTypeLinkId,
            string: {
              data: {
                value: "stringValue"
              }
            }
          })
          linkIdsToDelete.push(newLinkId);
          const operation = createSerialOperation({
            table: 'links',
            type: 'delete',
            exp: {
              id: newLinkId
            }
          });
          const result = await deepClient.serial({
            operations: [
              operation,
            ]
          });
          assert.equal(result.error, undefined);
          assert.notEqual(result.data, undefined);
          assert.strictEqual(result.data.length, 1);
          const { data: [newLink] } = await deepClient.select(newLinkId);
          assert.equal(newLink, undefined);
        } finally {
          await deepClient.delete(linkIdsToDelete)
        }
      })
      it('multiple deletes in one operation', async () => {
        let linkIdsToDelete = [];
        try {
          const reservedLinkIds = await deepClient.reserve(2);
          linkIdsToDelete = [...linkIdsToDelete, ...reservedLinkIds];
          const result = await deepClient.serial({
            operations: [
              {
                table: 'links',
                type: 'delete',
                exp: {
                  id: reservedLinkIds[0]
                }
              },
              {
                table: 'links',
                type: 'delete',
                exp: {
                  id: reservedLinkIds[1]
                }
              }
            ]
          });
          assert.equal(result.error, undefined);
          assert.notEqual(result.data, undefined);
          assert.strictEqual(result.data.length, 2);
          const { data } = await deepClient.select(reservedLinkIds);
          assert.equal(data.length, 0);
        } finally {
          await deepClient.delete(linkIdsToDelete)
        }
      })
      it('multiple deletes in multiple operations', async () => {
        let linkIdsToDelete = [];
        try {
          const reservedLinkIds = await deepClient.reserve(2);
          linkIdsToDelete = [...linkIdsToDelete, ...reservedLinkIds];
          const result = await deepClient.serial({
            operations: [
              {
                table: 'links',
                type: 'delete',
                exp: {
                  id: reservedLinkIds[0]
                }
              },
              {
                table: 'links',
                type: 'delete',
                exp: {
                  id: reservedLinkIds[1]
                }
              }
            ]
          });
          assert.equal(result.error, undefined);
          assert.notEqual(result.data, undefined);
          assert.strictEqual(result.data.length, 2);
          const { data } = await deepClient.select(reservedLinkIds);
          assert.equal(data.length, 0);
        } finally {
          await deepClient.delete(linkIdsToDelete)
        }
      })
    })
  })
  it('select string table', async () => {
    const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
    const {data: [newLink]} = await deepClient.insert({
      type_id: typeTypeLinkId,
      string: {
        data: {
          value: "stringValue"
        }
      }
    })
    await deepClient.select({
      link_id: {_eq: newLink.id}
    },
    {
      table: 'strings'
    })
  })
  describe(`useDeepSubscription`, () => {
    it(`type`, async () => {
      await setup();
  
      expect(screen.getByText('Loading...')).toBeInTheDocument();
  
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
  
      expect(screen.queryByText(/^Error:/)).not.toBeInTheDocument();

      await waitFor(() => {
        const dataLengthText = screen.getByText(/items loaded$/);
        expect(dataLengthText).toBeInTheDocument();
        const dataLength = parseInt(dataLengthText.textContent);
         expect(dataLength).toBeGreaterThan(0);
      }, {timeout: 10000});

      

      async function setup() {
        const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
      
        function TestHookComponent() {
          const { loading, data, error } = useDeepSubscription({
            type_id: typeTypeLinkId,
          });
          if (loading) {
            return <div>Loading...</div>;
          }

          if(error) {
            return <div>Error: {error.message}</div>
          }
      
          return <div>{data.length} items loaded</div>;
        }
      
        render(
          <ApolloProvider client={deepClient.apolloClient}>
            <DeepProvider>
              <TestHookComponent />
            </DeepProvider>
          </ApolloProvider>
        );
      }
    })
  })
});