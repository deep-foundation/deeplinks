import { DeepClient, DeepClientResult, Table } from "../client";
import { MutationInputLink } from "../client_types";
import { deleteMutation, generateSerial, IGenerateMutationBuilder, insertMutation, ISerialOptions, updateMutation } from "../gql";

/**
 * A class for building serial transitions
 * 
 * @example
```ts
const builder = new SerialTransitionsBuilder({ deep });
const table = 'links';
const transition = [null, {
  type_id: deep.id("@deep-foundation/core", "Type")
}];
const {data} = 
  builder
  .append({ table, transition, alias: firstLinkAlias })
  .append({ table, transition, alias: secondLinkAlias })
  .execute()
const firstLink = data[firstLinkAlias] // or data[0]
```
 */
export class SerialTransitionsBuilder {
  private deep: DeepClient;
  private serialActions: Array<SerialAction>;
  private defaultTable: Table<'insert' | 'update' | 'delete'>;
  private executeOptions: ExecuteOptions;

  constructor(options: SerialTransitionsBuilderOptions) {
    this.deep = options.deep;
    this.serialActions = [];
    this.defaultTable = options.defaultTable ?? 'links';
    this.executeOptions = options.executeOptions ?? {};
  }

  public append(options: AppendTransitionOptions) {
    this.appendMultiple([options])
    return this;
  }

  public appendMultiple(options: AppendTransitionOptions[]) {
    for (const optionsItem of options) {
      const { table = this.defaultTable, transition } = optionsItem;
      const transitionType = this.getTransitionType(transition)
      const index = this.serialActions.length
      let serialAction: SerialAction;
      switch (transitionType) {
        case 'insert':
          serialAction = {
            mutation: insertMutation(table, { objects: transition[1] }),
            index,
            transitionType,
            table
          }
          break;
        case 'update':
          serialAction = {
            mutation: updateMutation(table, { exp: transition[0], value: transition[1] }),
            index,
            transitionType,
            table
          }
          break;
        case 'delete':
          serialAction = {
            mutation: deleteMutation(table, { exp: transition[0] }),
            index,
            transitionType,
            table
          }
        default:
          throw new Error('Invalid transition type. If you want to insert link - the first element must be null and the second must be link. If you want to update link - the first and second elements must be links. If you want to delete link - the first element must be link and second must be null')
      }
      serialAction.alias = optionsItem.alias ?? `${transitionType}_${table}_${index}`;
      this.serialActions.push(serialAction)
    }
    return this;
  }

  public clear() {
    this.serialActions = [];
    return this;
  }

  public async execute(options: ExecuteOptions = this.executeOptions): Promise<DeepClientResult<Record<string, { id: number }>>> {
    const result = await this.deep.apolloClient.mutate(generateSerial({
      actions: this.serialActions.map(serialAction => serialAction.mutation),
      ...options
    }))
    const data = result.data;
    for (const serialAction of this.serialActions) {
      const oldKey = `m${serialAction.index}`;
      const newValue = {
        ...data[oldKey].returning,
        index: serialAction.index
      };
      data[serialAction.alias] = newValue;
      data[serialAction.index] = newValue;
      delete data[oldKey]
    }
    // @ts-ignore
    return {
      ...result,
      data,
    } as Record<string, DeepClientResult<{ id: number }>>

  }

  public actions() {
    return this.serialActions;
  }

  public getTransitionType(transition: Transition): TransitionType {
    if (transition[0] === null) {
      return 'insert'
    } else if (transition[1] === null) {
      return 'delete'
    } else if (transition[0] !== null && transition[1] !== null) {
      return 'update'
    } else {
      throw new Error('Invalid transition')
    }
  }

  public setDefaultTable(table: Table<'insert' | 'update' | 'delete'>) {
    this.defaultTable = table;
    return this;
  }

  public getDefaultTable() {
    return this.defaultTable;
  }

  public setDeep(deep: DeepClient) {
    this.deep = deep;
    return this;
  }

  public getDeep() {
    return this.deep;
  }

  public setExecuteOptions(options: ExecuteOptions) {
    this.executeOptions = options;
    return this;
  }

  public getExecuteOptions() {
    return this.executeOptions;
  }
}

export interface AppendTransitionOptions {
  /**
   * A transition to append
   * 
   * If you want to insert link - the first element must be null and the second must be link. If you want to update link - the first and second elements must be links. If you want to delete link - the first element must be link and second must be null
   */
  transition: Transition;
  /**
   * A table name where operation must be executed
   * 
   * @defaultValue 'links'
   */
  table?: Table<Transition[0] extends null ? 'insert' : Transition[1] extends null ? 'delete' : 'update'>;
  alias?: string;
}

export type TransitionType = 'insert' | 'update' | 'delete';
export type TransitionItem = MutationInputLink | null;
export type Transition = Array<TransitionItem>;

export type ExecuteOptions = Omit<ISerialOptions, 'actions'>

export type SerialTransitionsBuilderOptions = {
  deep: DeepClient;
  defaultTable?: Table<'insert' | 'update' | 'delete'>;
  executeOptions?: ExecuteOptions;
}

type SerialAction = {
  mutation: IGenerateMutationBuilder,
  alias?: string;
  index: number;
  transitionType: TransitionType,
  table: Table<'insert' | 'update' | 'delete'>;
}