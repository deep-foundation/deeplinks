import { ApolloClient, ApolloQueryResult } from "@apollo/client";
import { inherits } from "util";
import { GLOBAL_ID_CONTAIN, GLOBAL_ID_PACKAGE } from "./global-ids";
import { deleteMutation, generateQuery, generateQueryData, generateSerial, insertMutation, updateMutation } from "./gql";
import { Link, minilinks, MinilinksInstance, MinilinksResult } from "./minilinks";
import { awaitPromise } from "./promise";
import { reserve } from "./reserve";

export interface DeepClientOptions<L = Link<number>> {
  apolloClient: ApolloClient<any>;
  minilinks?: MinilinksResult<L>;
  table?: string;
  returning?: string;

  selectReturning?: string;
  insertReturning?: string;
  updateReturning?: string;
  deleteReturning?: string;

  defaultSelectName?: string;
  defaultInsertName?: string;
  defaultUpdateName?: string;
  defaultDeleteName?: string;
}

export interface DeepClientResult<R> extends ApolloQueryResult<R> {}

export type DeepClientPackageSelector = string;
export type DeepClientPackageContain = string;
export type DeepClientLinkId = number;
// export type DeepClientBoolExp = number;
export type DeepClientStartItem = DeepClientPackageSelector | DeepClientLinkId;
export type DeepClientPathItem = DeepClientPackageContain;

export interface DeepClientInstance<L = Link<number>> {
  apolloClient?: ApolloClient<any>;
  minilinks?: MinilinksResult<L>;
  table?: string;
  returning?: string;

  selectReturning?: string;
  insertReturning?: string;
  updateReturning?: string;
  deleteReturning?: string;

  defaultSelectName?: string;
  defaultInsertName?: string;
  defaultUpdateName?: string;
  defaultDeleteName?: string;

  select<LL = L>(exp: any, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }): Promise<DeepClientResult<LL[]>>;

  insert<LL = L>(objects: Partial<LL> | Partial<LL>[], options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }):Promise<DeepClientResult<{ id }[]>>;

  update(exp: any, value: any, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }):Promise<DeepClientResult<{ id }[]>>;

  delete(exp: any, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }):Promise<DeepClientResult<{ returning: { id }[] }>>;

  reserve<LL = L>(count: number): Promise<number[]>;

  await(id: number): Promise<boolean>;

  id(start: DeepClientStartItem, ...path: DeepClientPathItem[]): Promise<number>;
}

export class DeepClient<L = Link<number>> implements DeepClientInstance<L> {
  apolloClient?: ApolloClient<any>;
  minilinks?: MinilinksResult<L>;
  table?: string;
  returning?: string;

  selectReturning?: string;
  insertReturning?: string;
  updateReturning?: string;
  deleteReturning?: string;

  defaultSelectName?: string;
  defaultInsertName?: string;
  defaultUpdateName?: string;
  defaultDeleteName?: string;

  constructor(options: DeepClientOptions<L>) {
    // @ts-ignore
    this.minilinks = options.minilinks || minilinks([]);
    this.apolloClient = options.apolloClient;
    this.table = options.table || 'links';

    this.selectReturning = options.selectReturning || 'id type_id from_id to_id value';
    this.insertReturning = options.insertReturning || 'id';
    this.updateReturning = options.updateReturning || 'id';
    this.deleteReturning = options.deleteReturning || 'id';

    this.defaultSelectName = options.defaultSelectName || 'SELECT';
    this.defaultInsertName = options.defaultInsertName || 'INSERT';
    this.defaultUpdateName = options.defaultUpdateName || 'UPDATE';
    this.defaultDeleteName = options.defaultDeleteName || 'DELETE';
  }

  async select<LL = L>(exp: any, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }): Promise<DeepClientResult<LL[]>> {
    const where = typeof(exp) === 'object' ? Object.prototype.toString.call(exp) === '[object Array]' ? { id: { _in: exp } } : exp : { id: { _eq: exp } };
    const table = options?.table || this.table;
    const returning = options?.returning || this.selectReturning;
    const variables = options?.variables;
    const name = options?.name || this.defaultSelectName;
    const q = await this.apolloClient.query(generateQuery({
      queries: [
        generateQueryData({
          tableName: table,
          returning,
          variables: {
            ...variables,
            where,
          } }),
      ],
      name: name,
    }));
    // @ts-ignore
    return { ...q, data: (q)?.data?.q0 };
  };

  async insert<LL = L>(objects: Partial<LL> | Partial<LL>[] = {}, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }):Promise<DeepClientResult<{ id }[]>> {
    const _objects = Object.prototype.toString.call(objects) === '[object Array]' ? objects : [objects];
    const table = options?.table || this.table;
    const returning = options?.returning || this.insertReturning;
    const variables = options?.variables;
    const name = options?.name || this.defaultInsertName;
    const q = await this.apolloClient.mutate(generateSerial({
      actions: [insertMutation(table, { ...variables, objects: objects }, { tableName: table, operation: 'insert', returning })],
      name: name,
    }));
    // @ts-ignore
    return { ...q, data: (q)?.data?.m0?.returning };
  };

  async update(exp: any, value: any, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }):Promise<DeepClientResult<{ id }[]>> {
    const where = typeof(exp) === 'object' ? Object.prototype.toString.call(exp) === '[object Array]' ? { id: { _in: exp } } : exp : { id: { _eq: exp } };
    const table = options?.table || this.table;
    const returning = options?.returning || this.updateReturning;
    const variables = options?.variables;
    const name = options?.name || this.defaultUpdateName;
    const q = await this.apolloClient.mutate(generateSerial({
      actions: [updateMutation(table, { ...variables, where: exp, _set: value }, { tableName: table, operation: 'update', returning })],
      name: name,
    }));
    // @ts-ignore
    return { ...q, data: (q)?.data?.m0?.returning };
  };

  async delete(exp: any, options?: {
    table?: string;
    returning?: string;
    variables?: any;
    name?: string;
  }):Promise<DeepClientResult<{ returning: { id }[] }>> {
    const where = typeof(exp) === 'object' ? Object.prototype.toString.call(exp) === '[object Array]' ? { id: { _in: exp } } : exp : { id: { _eq: exp } };
    const table = options?.table || this.table;
    const returning = options?.returning || this.deleteReturning;
    const variables = options?.variables;
    const name = options?.name || this.defaultDeleteName;
    const q = await this.apolloClient.mutate(generateSerial({
      actions: [deleteMutation(table, { ...variables, where: exp, returning }, { tableName: table, operation: 'delete', returning })],
      name: name,
    }));
    // @ts-ignore
    return { ...q, data: (q)?.data?.m0?.returning };
  };

  reserve<LL = L>(count: number): Promise<number[]> {
    return reserve({ count, client: this.apolloClient });
  };

  await(id: number): Promise<boolean> {
    return awaitPromise({ id, client: this.apolloClient });
  };

  idFieldNames: string[] = ['id','from_id','to_id','type_id'];
  valueFieldName: string = 'value';
  valueRelationNames: { string: string; number: string; } = {
    string: 'string',
    number: 'number',
  };

  /**
   * Id, type_id, from_id, to_id fields can be writed without { _eq: number }, just number.
   * { field: number } to { field: { _eq: number } }
   * Value number and string can be writed just as string|number, without { _eq }
   * { value: number } to { number: { value: { _eq: number } } }
   * { value: string } to { string: { value: { _eq: string } } }
   * Every Hasura standard comparasion expressions supported directly if you know value type.
   * { string: comp_exp }
   * { number: comp_exp }
   * { object: comp_exp }
   */
  boolExpSerialize(exp: any): any {
    if (Object.prototype.toString.call(exp) === '[object Array]') return exp.map(this.boolExpSerialize);
    else if (typeof(exp) === 'object') {
      const keys = Object.keys(exp);
      const result = {};
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        if (this.idFieldNames.includes(key)) {
          if (typeof(exp[key]) === 'number') result[key] = { _eq: exp[key] };
          else result[key] = exp[key];
        } else if (key === this.valueFieldName || this.valueRelationNames[typeof(exp[key])]) {
          return result[key] = { [this.valueRelationNames[typeof(exp[key])]]: { _eq: exp[key] } };
        } else result[key] = exp[key];
      }
      // console.log(exp, keys, result);
      return result;
    } else return exp;
  };

  async id(start: DeepClientStartItem, ...path: DeepClientPathItem[]): Promise<number> {
    const pckg = { type_id: { _eq: GLOBAL_ID_PACKAGE } };
    let where = pckg;
    for (let p = 0; p < path.length; p++) {
      const item = path[p];
      where = { type_id: { _eq: GLOBAL_ID_CONTAIN },  };
    }
    const q = this.select({ type: { _eq: GLOBAL_ID_CONTAIN },  });
    return 0;
  };
}

