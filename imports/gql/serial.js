var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import Debug from 'debug';
import gql from 'graphql-tag';
const debug = Debug('deeplinks:gql:serial');
const log = debug.extend('log');
const error = debug.extend('error');
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);
;
;
export const generateSerial = (_a) => {
    var { actions = [], name = 'SERIAL', alias = 'm' } = _a, options = __rest(_a, ["actions", "name", "alias"]);
    log('generateSerial', { name, alias, actions });
    const calledActions = actions.map((m, i) => typeof (m) === 'function' ? m(alias, i) : m);
    const defs = calledActions.map(m => m.defs.join(',')).join(',');
    const mutationString = `mutation ${name} (${defs}) { ${calledActions.map(m => `${m.resultAlias}: ${m.queryName}(${m.args.join(',')}) { ${m.resultReturning} }`).join('')} }`;
    const mutation = gql `${mutationString}`;
    const variables = {};
    for (let a = 0; a < calledActions.length; a++) {
        const action = calledActions[a];
        for (const v in action.resultVariables) {
            if (Object.prototype.hasOwnProperty.call(action.resultVariables, v)) {
                const variable = action.resultVariables[v];
                variables[v] = variable;
            }
        }
    }
    const result = Object.assign({ mutation,
        variables,
        mutationString }, options);
    log('generateSerialResult', JSON.stringify({ mutation: mutationString, variables }, null, 2));
    return result;
};
export function createSerialOperation(params) {
    return params;
}
//# sourceMappingURL=serial.js.map