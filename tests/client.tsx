import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient, SerialOperation, useDeepSubscription } from "../imports/client";
import { assert } from 'chai';
import { BoolExpLink, MutationInputLink } from "../imports/client_types";
import { inspect} from 'util'
import { createSerialOperation } from "../imports/gql";
import {render, screen, waitFor} from '@testing-library/react'
import { DeepProvider } from '../imports/client';
import React, { useEffect } from "react";
import { ApolloClient, ApolloProvider} from '@apollo/client/index.js';
import '@testing-library/jest-dom';
import { useDeep } from '../imports/client';
import { IApolloClientGeneratorOptions } from '@deep-foundation/hasura/client';
import {ApolloClientTokenizedProvider } from '@deep-foundation/react-hasura/apollo-client-tokenized-provider'
import { TokenProvider } from '../imports/react-token';
import { LocalStoreProvider } from '@deep-foundation/store/local';
import { QueryStoreProvider } from '@deep-foundation/store/query';

function Main ({options}: {options: IApolloClientGeneratorOptions}): JSX.Element {
  return <ApolloClientTokenizedProvider options={options}>
    <div></div>
  </ApolloClientTokenizedProvider>
}

const graphQlPath = `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`;
const ssl = !!+process.env.DEEPLINKS_HASURA_SSL;
const secret = process.env.DEEPLINKS_HASURA_SECRET;
const ws = true;

let apolloClient: ApolloClient<any>;
let deepClient: DeepClient;

beforeAll(async () => {
  apolloClient = generateApolloClient({
    path: graphQlPath,
    ssl,
    secret,
    ws
  });
  deepClient = new DeepClient({ apolloClient });
})

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
  it('name', async () => {
    const containTypeLinkId = await deepClient.id("@deep-foundation/core", "Contain");
    const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
    const typeName = "MyTypeName"
    const reservedLinkIds = await deepClient.reserve(2);
    const newTypeLinkId = reservedLinkIds.pop()!;
    const containLinkId = reservedLinkIds.pop()!;  
    await deepClient.serial({
      operations: [
        {
          type: 'insert',
          table: 'links',
          objects: {
            id: newTypeLinkId,
            type_id: typeTypeLinkId,
          }
        },
        {
          type: 'insert',
          table: 'links',
          objects: {
            id: containLinkId,
            type_id: containTypeLinkId,
            from_id: await deepClient.id('deep', 'admin'),
            to_id: newTypeLinkId,
          }
        },
        {
          type: 'insert',
          table: 'strings',
          objects: {
            link_id: containLinkId,
            value: typeName
          }
        }
      ]
    });
    assert.equal(await deepClient.name(newTypeLinkId), typeName);
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
      const packageLinkId = deepClient.idLocal(packageName);
      assert.equal(packageLinkId, packageLink.id)
      const newTypeTypeLinkId = deepClient.idLocal(packageName, "Type");
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
  it('deepClient token must not be undefined when secret is passed to apolloClient', async () => {
    const apolloClient = generateApolloClient({
      path: graphQlPath,
      ssl: true,
      ws: true,
      secret
    });
    const deep = new DeepClient({ apolloClient });
    assert.notEqual(deep.token, undefined)
  })
  describe('react', () => {
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
      it('rerender with loading:true must occur only once', async () => {
        let renderCount = 0;
        let loadingCount = 0;
      
        function TestComponent() {
          const deepSubscriptionResult = useDeepSubscription({
            id: {
              _id: ['@deep-foundation/core']
            }
          });
      
          renderCount += 1;
          
          if (deepSubscriptionResult.loading) {
            loadingCount += 1;
          }
      
          return null;
        }
      
        render(
          <ApolloProvider client={deepClient.apolloClient}>
            <DeepProvider>
              <TestComponent />
            </DeepProvider>
          </ApolloProvider>
        );
      
        await waitFor(() => {
          assert(renderCount > 1, 'TestComponent must be rerendered more than once');
          assert(loadingCount === 1, 'loading:true must occur only once');
        });
      });
      it('rerender with loading:false must occur only once', async () => {
        let renderCount = 0;
        let loadingCount = 0;
      
        function TestComponent() {
          const deepSubscriptionResult = useDeepSubscription({
            id: {
              _id: ['@deep-foundation/core']
            }
          });
      
          renderCount += 1;
          
          if (!deepSubscriptionResult.loading) {
            loadingCount += 1;
          }
      
          return null;
        }
      
        render(
          <ApolloProvider client={deepClient.apolloClient}>
            <DeepProvider>
              <TestComponent />
            </DeepProvider>
          </ApolloProvider>
        );
      
        await waitFor(() => {
          assert(renderCount > 1, 'TestComponent must be rerendered more than once');
          assert(loadingCount === 1, 'loading:false must occur only once');
        });
      });
    })
    describe('login', () => {
      it('login with token', async () => {
        const apolloClient = generateApolloClient({
          path: graphQlPath,
          ssl: ssl,
        });
        const unloginedDeep = new DeepClient({ apolloClient });
        const guest = await unloginedDeep.guest();
        const guestDeep = new DeepClient({ deep: unloginedDeep, ...guest });
        const admin = await guestDeep.login({
          linkId: await guestDeep.id('deep', 'admin'),
        });
        const deep = new DeepClient({ deep: guestDeep, ...admin });
        let deepInComponent: DeepClient;
        
          function TestComponent() {
            deepInComponent = useDeep();
            useEffect(() => {
              deepInComponent.login({
                token: deep.token
              })
              // deepInComponent.whoami(); // ApolloError: Int cannot represent non-integer value: NaN
            }, [])
        
            return null;
          }
        
          render(
            <ApolloProvider client={deepClient.apolloClient}>
              <DeepProvider>
                <TestComponent />
              </DeepProvider>
            </ApolloProvider>
          );
        
          await waitFor(() => {
            assert(deepInComponent.linkId !== 0, 'deep.linkId is 0. Failed to login');
          });
      })
      it('login with token in apollo client', async () => {
        // await deepClient.whoami(); // ApolloError: Int cannot represent non-integer value: NaN
        const unloginedDeep = new DeepClient({ apolloClient });
        const guest = await unloginedDeep.guest();
        const guestDeep = new DeepClient({ deep: unloginedDeep, ...guest });
        const admin = await guestDeep.login({
          linkId: await guestDeep.id('deep', 'admin'),
        });
        const deepClient = new DeepClient({ deep: guestDeep, ...admin });
        assert.isTrue(!!deepClient.token)
        let deepInComponent: DeepClient;
        
          function TestComponent() {
            deepInComponent = useDeep();
       
            return null;
          }
        
        render(
          <QueryStoreProvider>
            <LocalStoreProvider>
              <ApolloClientTokenizedProvider options={{
                path: graphQlPath,
                ssl: ssl,
                token: deepClient.token
              }}>
                <TokenProvider>
                  <DeepProvider>
                    <TestComponent />
                  </DeepProvider>
                </TokenProvider>
              </ApolloClientTokenizedProvider>
            </LocalStoreProvider>
          </QueryStoreProvider>
        );
        
          await waitFor(() => {
            assert(deepInComponent.linkId !== 0, 'deep.linkId is 0. Failed to login');
          });
      })
    })
  });
  describe('short value insert', () => {
    it('insert string', async () => {
      const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
      const {data: [newLink]} = await deepClient.insert({
        type_id: typeTypeLinkId,
        string: 'helloBugFixers'
      });
      const stringRow = await deepClient.select({
        link_id: {_eq: newLink.id}
      }, { table: 'strings' });
      if (newLink?.id) deepClient.delete(newLink.id);
      assert.equal(stringRow?.data?.[0]?.value , 'helloBugFixers');
    });
    it('insert number', async () => {
      const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
      const {data: [newLink]} = await deepClient.insert({
        type_id: typeTypeLinkId,
        number: 0
      });
      const numberRow = await deepClient.select({
        link_id: {_eq: newLink.id}
      }, { table: 'numbers' });
      if (newLink?.id) deepClient.delete(newLink.id);
      assert.equal(numberRow?.data?.[0]?.value , 0);
    });
    it('insert object', async () => {
      const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
      const {data: [newLink]} = await deepClient.insert({
        type_id: typeTypeLinkId,
        object: { message: 'helloBugFixers'}
      });
      const objectRow = await deepClient.select({
        link_id: {_eq: newLink.id}
      }, { table: 'objects' });
      if (newLink?.id) deepClient.delete(newLink.id);
      assert.deepEqual(objectRow?.data?.[0]?.value , { message: 'helloBugFixers'});
    });
    it('insert inherited links with values', async () => {
      const typeTypeLinkId = await deepClient.id("@deep-foundation/core", "Type");
      const {data: [typeLink]} = await deepClient.insert({ type_id: typeTypeLinkId });
      
      const {data: [newLink]} = await deepClient.insert({
        type_id: typeTypeLinkId,
        string: 'helloBugFixers',
        from: { 
          type_id: typeTypeLinkId,
          number: 0,
          in: {
            type_id: typeTypeLinkId,
            from_id: typeLink.id,
            number: 1
          }
        },
        to: { 
          type_id: typeTypeLinkId,
          object: { string: 'goodbyeBugFixers'},
          out: {
            type_id: typeTypeLinkId,
            to_id: typeLink.id,
            number: 2
          }
        }
      });
      const {data: [selected]} = await deepClient.select(newLink.id);
      const {data: [selectedFrom]} = await deepClient.select(selected.from_id);
      const {data: [selectedTo]} = await deepClient.select(selected.to_id);
      const {data: [selectedIn]} = await deepClient.select({to_id: selected.from_id });
      const {data: [selectedOut]} = await deepClient.select({from_id: selected.to_id });
      if (selected?.id) deepClient.delete(selected.id);
      if (selected?.from_id) deepClient.delete(selected.from_id);
      if (selectedIn?.id) deepClient.delete(selectedIn.id);
      if (selectedOut?.id) deepClient.delete(selectedOut.id);
      if (selectedOut?.id) deepClient.delete(typeLink.id);
      assert.equal(selected?.value?.value , 'helloBugFixers');
      assert.equal(selectedFrom?.value?.value , 0);
      assert.equal(selectedTo?.value?.value?.string , 'goodbyeBugFixers');
      assert.equal(selectedIn?.value?.value , 1);
      assert.equal(selectedOut?.value?.value , 2);
    });
  });
});