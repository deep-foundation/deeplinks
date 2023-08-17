import { DeepClient, Table } from "../client";
import { MutationInputLink } from "../client_types";
import { deleteMutation, generateSerial, IGenerateMutationBuilder, insertMutation, ISerialOptions, updateMutation } from "../gql";
import { Link } from "../minilinks";

export class SerialTransitionsBuilder {
  private deep: DeepClient;
  private serialActions: Array<SerialAction>;
  private defaultTable: Table<'insert'|'update'|'delete'>;
  private executeOptions: ExecuteOptions;
  private resultType: ResultType;

    constructor(options: SerialTransitionsBuilderOptions) {
        this.deep = options.deep;
        this.serialActions = [];
        this.defaultTable = options.defaultTable;
        this.executeOptions = options.executeOptions ?? {};
        this.resultType = options.returnType ?? 'alias';
    }

    public append(options: AppendTransitionOptions) {
      const {table = this.defaultTable,transition} = options;
      const transitionType = this.getTransitionType(transition)
      const index = this.serialActions.length
      let serialAction: SerialAction;
      switch (transitionType) {
        case 'insert':
          serialAction = {
            mutation: insertMutation(table, {objects: transition[1]}),
            index,
            transitionType
          }
          break;
        case 'update':
          serialAction = {
            mutation: updateMutation(table, {exp: transition[0], value: transition[1]}),
            index,
            transitionType
          }
          break;
        case 'delete':
          serialAction = {
            mutation: deleteMutation(table, {exp: transition[0]}),
            index,
            transitionType
          }
        default:
            throw new Error('Invalid transition type. If you want to insert link - the first element must be null and the second must be link. If you want to update link - the first and second elements must be links. If you want to delete link - the first element must be link and second must be null')
      }
      if(this.resultType === 'array' && options.alias) {
        throw new Error('You cannot set alias if result type is array')
      } else if (this.resultType === 'alias') {
        serialAction.alias = options.alias ?? `${transitionType}_${table}_${index}`;
      }
      this.serialActions.push(serialAction)
      return this;
    }

    public clear() {
      this.serialActions = [];
      return this;
    }

    public async execute(options: ExecuteOptions = this.executeOptions) {
      const result = await this.deep.apolloClient.mutate(generateSerial({
        actions: this.serialActions,
        ...options
      }))
      if(this.resultType === 'alias') {
        const data = result.data;
        for (const serialAction of this.serialActions) {
          const oldKey = data[`m${serialAction.index}`];
          data[serialAction.alias] = oldKey;
          delete data[`m${serialAction.index}`]
        }
        return {
          ...result,
          data
        }
      } else {
        return {
          ...result,
          data: this.serialActions.map((serialAction) => result.data[`m${serialAction.index}`])
        };
      }
    }

    public actions() {
      return this.actions;
    }

    public getTransitionType(transition: Transition): TransitionType {
      if(transition[0] === null) {
        return 'insert'
      } else if (transition[1] === null) {
        return 'delete'
      } else if (transition[0] !== null && transition[1] !== null) {
        return 'update'
      } else {
        throw new Error('Invalid transition')
      }
    }

    public setDefaultTable(table: Table<'insert'|'update'|'delete'>) {
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

    public getResultType() {
      return this.resultType
    }

    public setResultType(resultType: ResultType) {
      if(this.serialActions.length > 0) {
        throw new Error(`You cannot change result type because there are ${this.serialActions.length} actions added. You can change result type before first append or after clear()`)
      }
      this.resultType = resultType;
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

export type TransitionType = 'insert'|'update'|'delete';
export type TransitionItem = MutationInputLink | null;
export type Transition = Array<TransitionItem>;

export type ExecuteOptions = Omit<ISerialOptions,'actions'>

export type SerialTransitionsBuilderOptions = {
  deep: DeepClient;
  defaultTable?: Table<'insert'|'update'|'delete'>;
  executeOptions?: ExecuteOptions;
  returnType?: ResultType;
}

type SerialAction = {
  mutation: IGenerateMutationBuilder,
  alias?: string;
  index: number;
  transitionType: TransitionType
}

type ResultType = 'alias' | 'array'