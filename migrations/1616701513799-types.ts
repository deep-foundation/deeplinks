import { gql } from '@apollo/client';
import { generateApolloClient } from '@deepcase/hasura/client';
import Debug from 'debug';
import { generateMutation, generateSerial } from '../imports/gql';
import { TABLE_NAME as LINKS_TABLE_NAME } from './1616701513782-links';

const debug = Debug('deepcase:deepgraph:migrations:type-type');

const client = generateApolloClient({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET,
});

export const up = async () => {
  debug('up');
  const mutateResult = await client.mutate(generateSerial({
    actions: [
      generateMutation({ // type type
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 1, type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({ // type string
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 2, type_id: 1, from_id: 0, to_id: 0 } },
      }),
      generateMutation({ // type name
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 3, type_id: 1, from_id: 1, to_id: 2 } },
      }),
      generateMutation({ // name type string
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 4, type_id: 2, from_id: 0, to_id: 0 } },
      }),
      generateMutation({ // name type link
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 5, type_id: 3, from_id: 1, to_id: 4 } },
      }),
      generateMutation({ // name string string
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 6, type_id: 2, from_id: 0, to_id: 0 } },
      }),
      generateMutation({ // name string link
        tableName: LINKS_TABLE_NAME, operation: 'insert',
        variables: { objects: { id: 7, type_id: 3, from_id: 2, to_id: 6 } },
      }),
    ],
    name: 'INSERT_TYPE_TYPE',
  }));
};

export const down = async () => {
  debug('down');
  const mutateResult = await client.mutate(generateSerial({
    actions: [
      generateMutation({
        tableName: LINKS_TABLE_NAME, operation: 'delete',
        variables: { where: { id: { _in: [1,2,3,4,5,6,7] } } },
      }),
    ],
    name: 'DELETE_TYPE_TYPE'
  }));
};