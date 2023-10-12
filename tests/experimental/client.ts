import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { ApolloClient} from '@apollo/client/index.js';
import '@testing-library/jest-dom';
import { SerialTransitionsBuilder, Transition } from '../../imports/experimental/serial-transitions-builder';
import { DeepClient, Table } from '../../imports/client';
import assert from 'assert';


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

  const {data: corePackageLinks} = await deepClient.select({
    up: {
      tree_id: {
        _id: ["@deep-foundation/core" ,"containTree"]
      },
      parent_id: {
        _id: ["@deep-foundation/core"]
      }
    }
  })
  deepClient.minilinks.apply(corePackageLinks)
})

describe('SerialTransitionsBuilder', () => {
  it('should instantiate correctly', () => {
    const builder = new SerialTransitionsBuilder({ deep: deepClient });
    expect(builder).toBeInstanceOf(SerialTransitionsBuilder);
  });

  it('should append insert transition', async () => {
    const builder = new SerialTransitionsBuilder({ deep: deepClient });
    const table = 'links';
    const transition = [null, {
      type_id: deepClient.idLocal("@deep-foundation/core", "Type")
    }];
    builder.append({ table, transition });
    expect(builder.actions().length).toBe(1);
  });

  it('should clear transitions', () => {
    const builder = new SerialTransitionsBuilder({ deep: deepClient });
    const table = 'links';
    const transition = [null, {
      type_id: deepClient.idLocal("@deep-foundation/core", "Type")
    }];
    builder.append({ table, transition });
    builder.clear();
    expect(builder.actions().length).toBe(0);
  });

  it('should get correct transition type for insert', () => {
    const builder = new SerialTransitionsBuilder({ deep: deepClient });
    const transition: Transition = [null, {
      type_id: deepClient.idLocal("@deep-foundation/core", "Type")
    }];
    const type = builder.getTransitionType(transition); 
    if(type !== 'insert') {
      throw new Error('Incorrect transition type');
    }
  });

  it('should get correct transition type for update', () => {
    const builder = new SerialTransitionsBuilder({ deep: deepClient });
    const transition: Transition = [{
      id: 0
    }, {
      id: 0
    }];
    const type = builder.getTransitionType(transition); 
    if(type !== 'update') {
      throw new Error('Incorrect transition type');
    }
  });

  it('should get correct transition type for delete', () => {
    const builder = new SerialTransitionsBuilder({ deep: deepClient });
    const transition: Transition = [{
      type_id: deepClient.idLocal("@deep-foundation/core", "Type")
    }, null];
    const type = builder.getTransitionType(transition); 
    if(type !== 'delete') {
      throw new Error('Incorrect transition type');
    }
  });

  it('should execute transition', async () => {
    const builder = new SerialTransitionsBuilder({ deep: deepClient });
    const transition = [null, {
      type_id: deepClient.idLocal("@deep-foundation/core", "Type")
    }];
    const result = await builder
    .append({ transition })
    .execute();

    assert.equal(Object.keys(result.data).length, 2)
  });

  it('should execute transitions', async () => {
    const builder = new SerialTransitionsBuilder({ deep: deepClient });
    const transition = [null, {
      type_id: deepClient.idLocal("@deep-foundation/core", "Type")
    }];
    const result = await builder
    .append({ transition })
    .append({ transition })
    .execute();
    assert.equal(Object.keys(result.data).length, 4)
  });

  it('should execute multiple transitions', async () => {
    const builder = new SerialTransitionsBuilder({ deep: deepClient });
    const transition = [null, {
      type_id: deepClient.idLocal("@deep-foundation/core", "Type")
    }];
    const result = await builder
    .appendMultiple([
      { transition },
      { transition }
    ])
    .execute();
    assert.equal(Object.keys(result.data).length, 4)
  });

  it('should execute transition and result link be accessible by both alias and index', async () => {
    const builder = new SerialTransitionsBuilder({ deep: deepClient });
    const transition = [null, {
      type_id: deepClient.idLocal("@deep-foundation/core", "Type")
    }];
    const alias = 'link';
    const {data} = await builder
    .append({ transition, alias })
    .execute();
    expect(data[alias]).toBeDefined();
    expect(data[0]).toBeDefined();
  });

  it('should execute transitions and result links be accessible by both alias and index', async () => {
    const builder = new SerialTransitionsBuilder({ deep: deepClient });
    const transition = [null, {
      type_id: deepClient.idLocal("@deep-foundation/core", "Type")
    }];
    const firstLinkAlias = 'link0';
    const secondLinkAlias = 'link1';
    const {data} = await builder
    .append({ transition, alias: firstLinkAlias })
    .append({ transition, alias: secondLinkAlias })
    .execute();
    expect(data[firstLinkAlias]).toBeDefined();
    expect(data[0]).toBeDefined();
    expect(data[secondLinkAlias]).toBeDefined();
    expect(data[1]).toBeDefined();
  });
});