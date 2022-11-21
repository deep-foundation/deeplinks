import { Packager, Package } from './packager';

export const tsxPckg: Package = {
  "package": {
    "name": "@deep-foundation/tsx",
    "version": "0.0.2",
  },
  "data": [
    { "package": { "dependencyId": 0, "containValue": "Symbol" }, "id": 1 },
    { "package": { "dependencyId": 0, "containValue": "Type" }, "id": 2 },
    { "package": { "dependencyId": 0, "containValue": "SyncTextFile" }, "id": 3 },
    { "package": { "dependencyId": 0, "containValue": "Handler" }, "id": 4 },
    { "package": { "dependencyId": 0, "containValue": "dockerSupportsJs" }, "id": 5 },
    { "package": { "dependencyId": 0, "containValue": "HandleUpdate" }, "id": 6 },
    { "package": { "dependencyId": 0, "containValue": "HandleInsert" }, "id": 7 },
    { "package": { "dependencyId": 0, "containValue": "Value" }, "id": 8 },
    { "package": { "dependencyId": 0, "containValue": "String" }, "id": 9 },
    { "id": "tsxSymbol", "type": 1, "from": "TSX", "to": "TSX", "value": { "value": "📑" } },
    { "id": "TSX", "type": 2, "value": { "value": "TSX" } }, {
    "id": "compiler", "type": 3, "value": {
      "value": `
async ({ deep, require, gql, data: { newLink } }) => {
    const ts = require('typescript');
  const { data: [generatedFrom] } = await deep.select({
      type_id: await deep.id('@deep-foundation/core', 'GeneratedFrom'),
    to_id: newLink.id,
  });
  const value = newLink?.value?.value;
  let compiledString = '';
  if (value) {
      const result = ts.transpileModule(value, {
        "compilerOptions": {
          "allowSyntheticDefaultImports": true,
        "experimentalDecorators": true,
        "sourceMap": true,
        "noImplicitAny": false,
        "removeComments": true,
        "jsx": "react",
        "module": "commonjs",
        "moduleResolution": "node",
        "target": "es2015",
        "skipLibCheck": true,
        "resolveJsonModule": true,
        "esModuleInterop": true,
        "isolatedModules": true
      }
    });
    compiledString = result.outputText || '';
  }
  if (!generatedFrom) {
      await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'GeneratedFrom'),
      to_id: newLink.id,
      in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'Contain'),
        from_id: newLink.id,
      } },
      from: { data: {
          type_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
        string: { data: { value: compiledString } },
        in: { data: {
            type_id: await deep.id('@deep-foundation/core', 'Contain'),
          from_id: newLink.id,
          string: { data: { value: 'generated' } },
        } },
      } },
    });
  } else {
      await deep.update({
        link_id: { _eq: generatedFrom.from_id },
    }, {
        value: compiledString,
    }, { table: 'strings' });
  }
}
` }
  },
  { "id": "handler", "type": 4, "from": 5, "to": "compiler" },
  { "id": "handleUpdate", "type": 6, "from": "TSX", "to": "handler" },
  { "id": "handleInsert", "type": 7, "from": "TSX", "to": "handler" },
  { "id": "tsxValue", "type": 8, "from": "TSX", "to": 9 }], "errors": [], "dependencies": [{ "name": "@deep-foundation/core" }]
};