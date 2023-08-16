import { DeepClient, Table } from "../client";
import { MutationInputLink } from "../client_types";
import { deleteMutation, generateSerial, IGenerateMutationBuilder, insertMutation, ISerialOptions, updateMutation } from "../gql";
import { Link } from "../minilinks";

export class SerialTransitionsBuilder {
  private deep: DeepClient;
  private serialActions: Array<IGenerateMutationBuilder>;
  private defaultTable: Table<'insert'|'update'|'delete'>;
  private executeOptions: ExecuteOptions;

    constructor(options: SerialTransitionsBuilderOptions) {
        this.deep = options.deep;
        this.serialActions = new Array<IGenerateMutationBuilder>();
        this.defaultTable = options.defaultTable;
        this.executeOptions = options.executeOptions ?? {};
    }

    public append(options: AppendTransitionOptions) {
      const {table = this.defaultTable,transition} = options;
      const transitionType = this.getTransitionType(transition)
      let serialAction: IGenerateMutationBuilder;
      switch (transitionType) {
        case 'insert':
          serialAction = insertMutation(table, {objects: transition[1]})
          break;
        case 'update':
          serialAction = updateMutation(table, {exp: transition[0], value: transition[1]})
          break;
        case 'delete':
          serialAction = deleteMutation(table, {exp: transition[0]})
        default:
            throw new Error('Invalid transition type. If you want to insert link - the first element must be null and the second must be link. If you want to update link - the first and second elements must be links. If you want to delete link - the first element must be link and second must be null')
      }
      this.serialActions.push(serialAction)
      return this;
    }

    public clear() {
      this.serialActions = new Array<IGenerateMutationBuilder>();
      return this;
    }

    public async execute(options: ExecuteOptions = this.executeOptions) {
      return await this.deep.apolloClient.mutate(generateSerial({
        actions: this.serialActions,
        ...options
      }))
    }

    public actions() {
      return this.serialActions;
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
}

export type TransitionType = 'insert'|'update'|'delete';
export type TransitionItem = MutationInputLink | null;
export type Transition = Array<TransitionItem>;

export type ExecuteOptions = Omit<ISerialOptions,'actions'>

export type SerialTransitionsBuilderOptions = {
  deep: DeepClient;
  defaultTable?: Table<'insert'|'update'|'delete'>;
  executeOptions?: ExecuteOptions;
}