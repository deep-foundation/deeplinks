export type Query = BoolExpLink | number;

export interface QueryLink extends BoolExpLink {
  limit?: number;
  order_by?: { [key: string]: 'asc'|'desc' };
  offset?: number;
  distinct_on?: [string];
}

export interface BoolExp<T> {
  _and?: T[];
  _or?: T[];
  _not?: T;
}
export interface BoolExpLink extends BoolExp<BoolExpLink> {
  id?: ComparasionType<number>;
  from_id?: ComparasionType<number>;
  to_id?: ComparasionType<number>;
  type_id?: ComparasionType<number>;
  from?: BoolExpLink;
  to?: BoolExpLink;
  type?: BoolExpLink;
  /** Links related to current by to_id field */
  in?: BoolExpLink | BoolExpLink[];
  /** Links related to current by from_id field */
  out?: BoolExpLink | BoolExpLink[];
  /** Links related to current by type_id field */
  typed?: BoolExpLink | BoolExpLink[];
  /** Selected by this link as selector (usable only for Selector typed links) */
  selected?: BoolExpSelector | BoolExpSelector[];
  /** Selectors that select current link. */
  selectors?: BoolExpSelector | BoolExpSelector[];
  /** Value type number definition. */
  number?: BoolExpValue<number>;
  /** Value type string definition. */
  string?: BoolExpValue<string>;
  /** Value type object definition. */
  object?: BoolExpValue<object>;
  /** Value (number/string/object shortly). */
  value?: BoolExpValue<any>;
  /** Relation to current rule. */
  can_rule?: BoolExpCan;
  /** Relation to rules where current link used as action. */
  can_action?: BoolExpCan;
  /** Relation to rules where current link used as object. */
  can_object?: BoolExpCan;
  /** Relation to rules where current link used as subject. */
  can_subject?: BoolExpCan;
  /** Links down by all available trees. (Use link_id for search) */
  down?: BoolExpTree;
  /** Links up by all available trees. (Use parent_id for search) */
  up?: BoolExpTree;
  /** Links using this link as a tree. */
  tree?: BoolExpTree;
  /** Links using this link as a root. */
  root?: BoolExpTree;
}
export interface BoolExpValue<T> extends BoolExp<BoolExpValue<T>> {
  id?: ComparasionType<number>;
  /** If of link that contains this value. */
  link_id?: ComparasionType<number>;
  /** Relation to the link that contains this value. */
  link?: BoolExpLink;
  value?: ComparasionType<T>;
}
export interface BoolExpCan extends BoolExp<BoolExpCan> {
  /** Link of current rule. */
  rule_id?: ComparasionType<number>;
  /** Id of link symbolizing action, as AllowSelect/AllowInsertType/AllowUpdat e/AllowDelete...*/
  action_id?: ComparasionType<number>;
  /** Id of link symbolizing object to which the rule applies. */
  object_id?: ComparasionType<number>;
  /** Id of link for which, as an authorized link, the rule to action on the object i s granted.*/
  subject_id?: ComparasionType<number>;
  /** Relation to link symbolizing action, as AllowSelect/AllowInsertType/AllowUpdat e/AllowDelete...*/
  rule?: BoolExpLink;
  /** Relation to link symbolizing object to which the rule applies. */
  action?: BoolExpLink;
  /** Relation to link symbolizing object to which the rule applies. */
  object?: BoolExpLink;
  /** Relation to link for which, as an authorized link, the rule to action on th e object is granted.*/
  subject?: BoolExpLink;
}
export interface BoolExpSelector extends BoolExp<BoolExpCan> {
  /** Id of link item to be matched by the selector. */
  item_id?: ComparasionType<number>;
  /** Relation to link item to be matched by the selector. */
  item?: BoolExpLink;
  /** Id of link selector that the item includes. */
  selector_id?: ComparasionType<number>;
  /** Relation to link selector that the item includes. */
  selector?: BoolExpLink;
  /** Id of Query - boolean expression attached to a selector. */
  query_id?: ComparasionType<number>;
  /** Relation to Query - boolean expression attached to a selector. */
  query?: BoolExpLink;
  selector_include_id?: ComparasionType<number>;
}
export interface BoolExpTree extends BoolExp<BoolExpCan> {
  id?: ComparasionType<number>;
  /** Current link id. */
  link_id?: ComparasionType<number>;
  /** Id of link used as tree. */
  tree_id?: ComparasionType<number>;
  /** Root link id by current subtree. */
  root_id?: ComparasionType<number>;
  /** Each parent link id where founded upper from link_id */
  parent_id?: ComparasionType<number>;
  /** Depth in subtree of parent_id from root_id */
  depth?: ComparasionType<string>;
  /** Equal string for all parent_id in subtree from root_id to link_id. */
  position_id?: ComparasionType<string>;
  /** Relation to current link. */
  link?: BoolExpLink;
  /** Relation to link used as tree. */
  tree?: BoolExpLink;
  /** Relation to root link by current subtree. */
  root?: BoolExpLink;
  /** Relation to each parent link founded upper from link_id. */
  parent?: BoolExpLink;
  /** Relation to all tree rows with equal link_id. */
  by_link?: BoolExpTree;
  /** Relation to all tree rows with equal tree_id. */
  by_tree?: BoolExpTree;
  /** Relation to all tree rows with equal root_id. */
  by_root?: BoolExpTree;
  /** Relation to all tree rows with equal parent_id. */
  by_parent?: BoolExpTree;
  /** Relation to all tree rows with equal position_id. */
  by_position?: BoolExpTree;
}
export interface BoolExpHandler extends BoolExp<BoolExpCan> {
  /** Id of link with distribution version of executable handler content. */
  dist_id?: ComparasionType<number>;
  /** Relation to link with distribution version of executable handler content. */
  dist?: BoolExpLink;
  /** Id of link with source version of executable handler content. */
  src_id?: ComparasionType<number>;
  /** Relation to link with source version of executable handler content. */
  src?: BoolExpLink;
  /** Id of link ExecutionProvider. */
  execution_provider_id?: ComparasionType<number>;
  /** Relation to link ExecutionProvider. */
  execution_provider?: BoolExpLink;
  /** Id of link IsolationProvider. */
  isolation_provider_id?: ComparasionType<number>;
  /** Relation to link IsolationProvider. */
  isolation_provider?: BoolExpLink;
  /** Id of Handler link. */
  handler_id?: ComparasionType<number>;
  /** Relation to Handler link. */
  handler?: BoolExpLink;
}
export type ComparasionType<T> = ComparasionExp<T> | T;
export interface ComparasionExp<T> {
  _eq?: T;
  _neq?: T;
  _gt?: T;
  _gte?: T;
  _lt?: T;
  _lte?: T;
  _is_null?: boolean;
  _in?: T[];
  _nin?: T[];
  _type_of?: T;
  _id?: [any, ...any[]];
  _like?: string;
  _ilike?: string;
  _nlike?: string;
  _nilike?: string;
  _regex?: string;
  _nregex?: string;
  _iregex?: string;
  _niregex?: string;
}
export interface MutationInput {}
export interface MutationInputLinkPlain {
  id?: number;
  from_id?: number;
  to_id?: number;
  type_id?: number;
  from?: { data: MutationInputLink } | MutationInputLink;
  to?: { data: MutationInputLink } | MutationInputLink;
  out?: { data: MutationInputLink | MutationInputLink[] } | MutationInputLink | MutationInputLink[];
  in?: { data: MutationInputLink | MutationInputLink[] } | MutationInputLink | MutationInputLink[];
  number?: { data: MutationInputValue<number> } | number;
  string?: { data: MutationInputValue<string> } | string;
  object?: { data: MutationInputValue<any> } | any;
  typed?: { data: MutationInputLink | MutationInputLink[] };
}
export interface MutationInputLink extends MutationInputLinkPlain {
  from?: { data: MutationInputLink } | MutationInputLink;
  to?: { data: MutationInputLink } | MutationInputLink;
  out?: { data: MutationInputLink | MutationInputLink[] } | MutationInputLink | MutationInputLink[];
  in?: { data: MutationInputLink | MutationInputLink[] } | MutationInputLink | MutationInputLink[];
  number?: { data: MutationInputValue<number> } | number;
  string?: { data: MutationInputValue<string> } | string;
  object?: { data: MutationInputValue<any> } | any;
  typed?: { data: MutationInputLink | MutationInputLink[] };
}
export interface MutationInputValue<T> {
  link_id?: number;
  link?: { data: MutationInputLink };
  value?: T;
}