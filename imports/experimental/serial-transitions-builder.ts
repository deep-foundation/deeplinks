import { AsyncSerialParams, DeepClient, InsertTable, OperationType, SerialOperation, Table } from "../client";
import { createSerialOperation } from "../gql";
import { Link } from "../minilinks";



export class SerialTransitionsBuilder {
  public deep: DeepClient;

    constructor(param) {
        this.deep = param.deep;
    }

    public appendTransition(options: AppendTransitionOptions) {
      const {table,transition} = options;
      const transitionType = this.getTransitionType(transition)
      let serialOperation: SerialOperation;
      switch (transitionType) {
        case 'insert':
          serialOperation = createSerialOperation({
            type: transitionType,
            table: table,
          })
          break;
      
        default:
          break;
      }
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
}

export interface AppendTransitionOptions<TTransition extends Transition> {
  transition: TTransition;
  table: Table<TTransition[0] extends null ? 'insert' : TTransition[1] extends null ? 'delete' : 'update'>;
}

export type TransitionType = Exclude<OperationType, 'select'>;
export type TransitionItem = Link<number> | null;
export type Transition = Array<TransitionItem>