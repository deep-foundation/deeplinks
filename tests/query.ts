import { assert, expect } from 'chai';
import { MinilinkCollection, MinilinksGeneratorOptionsDefault } from '../imports/minilinks.js';
import { generateQuery, generateQueryData } from '../imports/gql/query.js';
import { serializeQuery } from '../imports/client.js';

describe('generateQuery', () => {
  it(`generateQueryData`, async () => {
    const name = 'SELECT';
    const exp = { return: { abc: { relation: 'out', type_id: 123, return: { qwe: { relation: 'in', type_id: 234, }, xyz: { relation: 'to' } } } } };
    const query = serializeQuery(exp, 'links');
    const variables = {};
    const queryDataInput = {
      tableName: 'links',
      tableNamePostfix: '',
      returning: `id type_id from_id to_id value`,
      variables: {
        ...variables,
        ...query,
      },
    };
    const queryData = generateQueryData(queryDataInput);
    const generatedQuery = generateQuery({
      queries: [
        queryData
      ],
      name: name,
    });
    const _queryData = queryData('q', 0);
    // console.log(JSON.stringify(_queryData.resultVariables, null, 2), _queryData, generatedQuery); // DEBUG
    expect(generatedQuery.queryString).to.be.equal(`query SELECT ($distinct_on0: [links_select_column!],$limit0: Int,$offset0: Int,$order_by0: [links_order_by!],$where0: links_bool_exp!,$distinct_on0_abc_qwe: [links_select_column!],$limit0_abc_qwe: Int,$offset0_abc_qwe: Int,$order_by0_abc_qwe: [links_order_by!],$where0_abc_qwe: links_bool_exp!,$distinct_on0_abc: [links_select_column!],$limit0_abc: Int,$offset0_abc: Int,$order_by0_abc: [links_order_by!],$where0_abc: links_bool_exp!) { q0: links(distinct_on: $distinct_on0,limit: $limit0,offset: $offset0,order_by: $order_by0,where: $where0) { id type_id from_id to_id value abc: out(distinct_on: $distinct_on0_abc,limit: $limit0_abc,offset: $offset0_abc,order_by: $order_by0_abc,where: $where0_abc) { id type_id from_id to_id value  qwe: in(distinct_on: $distinct_on0_abc_qwe,limit: $limit0_abc_qwe,offset: $offset0_abc_qwe,order_by: $order_by0_abc_qwe,where: $where0_abc_qwe) { id type_id from_id to_id value  } } } }`);
    expect(_queryData.resultVariables).to.be.deep.equal({
      "where0": {},
      "where0_abc_qwe": {
        "type_id": {
          "_eq": 234
        }
      },
      "where0_abc": {
        "type_id": {
          "_eq": 123
        }
      }
    });
  });
});