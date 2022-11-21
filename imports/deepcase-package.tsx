import { Packager, Package } from './packager';

export const deepcaseSymbolsPckg: Package = {
  "package": { "name": "@deep-foundation/deepcase", "version": "0.0.0" },
  "data": [
    { "package": { "dependencyId": 0, "containValue": "TSX" }, "id": 1 },
    { "package": { "dependencyId": 1, "containValue": "Handler" }, "id": 2 },
    { "package": { "dependencyId": 1, "containValue": "clientSupportsJs" }, "id": 3 },
    { "package": { "dependencyId": 1, "containValue": "Query" }, "id": 4 },
    { "package": { "dependencyId": 1, "containValue": "HandleClient" }, "id": 5 },
    { "package": { "dependencyId": 1, "containValue": "Contain" }, "id": 6 },
    { "package": { "dependencyId": 1, "containValue": "Type" }, "id": 7 },
    { "package": { "dependencyId": 1, "containValue": "Any" }, "id": 8 },
    { "package": { "dependencyId": 1, "containValue": "Query" }, "id": 9 },
    { "package": { "dependencyId": 1, "containValue": "Symbol" }, "id": 10 },
    { "id": "queryClientHandler", "type": 1, "value": { "value": `({ deep, require }) => {
      const React = require('react');
    const { useState } = React;
    const json5 = require('json5');
    const { useContainer } = require('@deep-foundation/deepcase');
    // Only objects editor.
    return ({ fillSize, style, link }) => {
        const currentValue = deep.stringify(link?.value?.value) || '';
      const [value, setValue] = useState(currentValue);
      const isSaved = value == currentValue;
      const [container] = useContainer();
      const { data } = deep.useDeepSubscription({
        type_id: { _in: [
          deep.idSync('@deep-foundation/core', 'Active'),
          deep.idSync('@deep-foundation/core', 'Contain'),
        ] },
        to_id: { _eq: link.id },
      });
      const contain = data?.find(l => l.type_id === deep.idSync('@deep-foundation/core', 'Contain'))
      const active = data?.find(l => l.type_id === deep.idSync('@deep-foundation/core', 'Active'))
      return <div
        style={{
          width: 300,
          height: 200,
          ...style,
          position: 'relative',
        }}
      >
        <textarea
          style={{
            width: '100%',
            height: '100%',
          }}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          value={value}
        />
        <button
          disabled={isSaved}
          style={{
            position: 'absolute',
            top: 0, right: 0,
            opacity: isSaved ? 0.2 : 1
          }}
          onClick={() => {
            try {
              const _value = json5.parse(value);
              if (!link.value) deep.insert({
                link_id: link.id, value: _value,
              }, { table: 'objects' });
              deep.update({ link_id: link.id }, { value: _value }, { table: 'objects' });
            } catch(error) {}
          }}
        >
          save
        </button>
        {!!contain && <button
          style={{
              position: 'absolute',
            bottom: 0, right: 0,
          }}
          onClick={async () => {
              if (active) {
                await deep.delete({
                  _or: [{
                    id: { _eq: active.id },
                }, {
                    type_id: deep.idSync('@deep-foundation/core', 'Contain'),
                  from_id: link.id,
                  to_id: active.id,
                }],
              });
            } else {
                await deep.insert({
                  type_id: deep.idSync('@deep-foundation/core', 'Active'),
                from_id: contain.from_id,
                to_id: contain.to_id,
                in: { data: {
                    type_id: deep.idSync('@deep-foundation/core', 'Contain'),
                  from_id: link.id,
                } },
              });
            }
          }}
        >
          {active ? 'deactive' : 'active'}
        </button>}
      </div>;
    }
  }` } },
  { "id": "containClientHandlerHandler", "type": 2, "from": 3, "to": 4 },
  { "id": "containClientHandlerHandleClient", "type": 5, "from": 6, "to": "containClientHandlerHandler" },
  { "id": "Traveler", "type": 7, "from": 8, "to": 9 },
  { "id": "travelerSymbol", "type": 10, "to": "Traveler", "from": "Traveler", "value": { "value": "🧳" } },
  { "id": "queryClientHandlerHandler", "type": 2, "from": 3, "to": 4 },
  { "id": "queryClientHandlerHandleClient", "type": 5, "from": 9, "to": "queryClientHandlerHandler" },
  { "id": "containClientHandler", "type": 1, "value": { "value": `({ deep, require }) => {
      const React = require('react');
    const { useState } = React;
    const json5 = require('json5');
    const { Input } = require('@chakra-ui/react');
    const { useHotkeys } = require('react-hotkeys-hook');
    const { useDebounceCallback } = require('@react-hook/debounce');
    const { useContainer } = require('@deep-foundation/deepcase');
    // Only string editor.
    return ({ fillSize, style, link, onClose }) => {
        const currentValue = deep.stringify(link?.value?.value) || '';
      const [value, setValue] = useState(currentValue);
      const ref = useHotkeys('enter', async e => {
          if (!link.value) await deep.insert({
            link_id: link.id, value: value,
        }, { table: 'strings' });
        deep.update({ link_id: link.id }, { value: value }, { table: 'strings' });
        onClose && onClose();
      }, { enableOnTags: [\"INPUT\"] });
      return <div
        style={{
            width: 300,
          ...style,
          position: 'relative',
        }}
      >
        <Input
          ref={ref}
          autoFocus
          type=\"text\"
          style={{
              width: '100%',
            bg: 'primary'
          }}
          onChange={(e) => {
              setValue(e.target.value);
          }}
          value={value}
        />
      </div>;
    }
  }` } }
], "errors": [], "dependencies": [{ "name": "@deep-foundation/tsx" }, { "name": "@deep-foundation/core" }] };