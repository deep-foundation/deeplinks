import { generateApolloClient } from '@deep-foundation/hasura/client.js';
import { DeepClient } from "../imports/client";
import { assert } from 'chai';
import { gql } from '@apollo/client/index.js';
import { PackageItem, Packager, sort } from "../imports/packager";
import type { Package } from "../imports/packager";
import { minilinks } from "../imports/minilinks";
import { packagerInstallCore, packagerPublishCore } from "../imports/router/packager";
import Debug from 'debug';

const debug = Debug('deeplinks:tests:packager');
const log = debug.extend('log');
const error = debug.extend('error');
// Force enable this file errors output
const namespaces = Debug.disable();
Debug.enable(`${namespaces ? `${namespaces},` : ``}${error.namespace}`);

const GIST_URL = process.env.GIST_URL;

const apolloClient = generateApolloClient({
  path: `${process.env.DEEPLINKS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.DEEPLINKS_HASURA_SSL,
  secret: process.env.DEEPLINKS_HASURA_SECRET,
});

const deep = new DeepClient({ apolloClient });

describe('packager', () => {
  describe('class', () => {
    it('export import', async () => {
      const packager = new Packager(deep);
      const namespace = await deep.select({
        type_id: await deep.id('@deep-foundation/core','PackageNamespace'),
        string: { value: { _eq: '@deep-foundation/test' } },
      });
      const { data: [{ id: packageId }] } = await deep.insert({
        type_id: await deep.id('@deep-foundation/core', 'Package'),
        string: { data: { value: '@deep-foundation/test' } },
        in: { data: {
          type_id: await deep.id('@deep-foundation/core', 'PackageVersion'),
          string: { data: { value: '0.0.0' } },
          ...(
            namespace?.data?.[0]
            ? {
              from_id: namespace?.data?.[0]?.id,
            }
            : {
              from: { data: {
                type_id: await deep.id('@deep-foundation/core', 'PackageNamespace'),
                string: { data: { value: '@deep-foundation/test' } },
              } },
            }
          ),
        } },
        out: { data: [
          {
            type_id: await deep.id('@deep-foundation/core', 'Contain'),
            string: { data: { value: 'item' } },
            to: { data: {
              type_id: await deep.id('@deep-foundation/core', 'Type'),
              from_id: await deep.id('@deep-foundation/core', 'Any'),
              to_id: await deep.id('@deep-foundation/core', 'SyncTextFile'),
            } },
          },
        ] },
      });
      assert(!!packageId, '!packageId');
      const exported = await packager.export({ packageLinkId: packageId });
      assert(!exported.errors?.length, '!!exported.errors.length');
      const imported = await packager.import(exported);
      assert(!imported.errors?.length, '!!imported.errors.length');
      const results = await deep.select({ id: { _in: imported?.ids } });
      const ml = minilinks(results.data);
      assert(+ml.links.length === +imported.ids.length, 'ml.links.length !== imported.ids.length');
      // TODO best valid checker
    });
  });
  describe('sorting', () => {
    const references = {
      id: 'id',
      from: 'from',
      to: 'to',
      type: 'type',
    };
    it.skip('strict mode: no sorting', () => {
      const data: PackageItem[] = [
        { id: 3, value: { value: 'three' }  },
        { id: 1, value: { value: 'one' } },
        { id: 2, value: { value: 'two' } },
      ];
      const pckg: Package = { package: { name: 'test'}, data, strict: true };
  
      const expectedResult = [
        { id: 3, value: { value: 'three' } },
        { id: 1, value: { value: 'one' } },
        { id: 2, value: { value: 'two' } },
      ];
  
      const result = sort(pckg, data, [], references);
      expect(result.sorted).toEqual(expectedResult);
    });
    it.skip('sorting with package, value, and dependencies', () => {
      const data: PackageItem[] = [
        { id: 1, package: { dependencyId: 1, containValue: "1" } },
        { id: 2, value: { value: 'two' } },
        { id: 3, from: 2, to: 4 },
        { id: 4, value: { value: 'four' } },
        { id: 5, type: 3 },
        { id: 6, package: { dependencyId: 2, containValue: "2" } },
      ];
      const pckg: Package = { package: { name: 'test'}, data, strict: true };
      const expectedResult = [
        { id: 6, package: { dependencyId: 2, containValue: "2" } },
        { id: 1, package: { dependencyId: 1, containValue: "1" } },
        { id: 2, value: { value: 'two' } },
        { id: 4, value: { value: 'four' } },
        { id: 3, from: 2, to: 4 },
        { id: 5, type: 3 },
      ];
  
      const result = sort(pckg, data, [], references);
      expect(result.sorted).toEqual(expectedResult);
    });
    it.skip('sorting existing package', () => {
      const data: PackageItem[] = [
        {
          "package": {
            "dependencyId": 0,
            "containValue": "SyncTextFile"
          },
          "id": 1
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "Handler"
          },
          "id": 2
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "clientSupportsJs"
          },
          "id": 3
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "HandleClient"
          },
          "id": 4
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "PackageQuery"
          },
          "id": 5
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "Query"
          },
          "id": 6
        },
        {
          "package": {
            "dependencyId": 1,
            "containValue": "TSX"
          },
          "id": 7
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "Join"
          },
          "id": 8
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "Type"
          },
          "id": 9
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "Any"
          },
          "id": 10
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "Symbol"
          },
          "id": 11
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "GeneratedFrom"
          },
          "id": 12
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "Contain"
          },
          "id": 13
        },
        {
          "id": "stringClientHandlerGenerated",
          "type": 1,
          "value": {
            "value": "var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\n({ deep, require }) => {\n    const React = require('react');\n    const { useState, useEffect } = React;\n    const json5 = require('json5');\n    const { Input, useColorModeValue } = require('@chakra-ui/react');\n    const { useHotkeys } = require('react-hotkeys-hook');\n    const { useDebounceCallback } = require('@react-hook/debounce');\n    const { useContainer } = require('@deep-foundation/deepcase');\n    return ({ fillSize, style, link, onClose }) => {\n        var _a;\n        const currentValue = deep.stringify((_a = link === null || link === void 0 ? void 0 : link.value) === null || _a === void 0 ? void 0 : _a.value) || '';\n        const [value, setValue] = useState(currentValue);\n        const save = (value) => __awaiter(void 0, void 0, void 0, function* () {\n            if (!link.value)\n                yield deep.insert({\n                    link_id: link.id, value: value,\n                }, { table: 'strings' });\n            deep.update({ link_id: link.id }, { value: value }, { table: 'strings' });\n        });\n        const ref = useHotkeys('enter', () => __awaiter(void 0, void 0, void 0, function* () {\n            yield save(value);\n            onClose && onClose();\n        }), { enableOnTags: [\"INPUT\"] });\n        const setValuesDebounced = useDebounceCallback((value) => __awaiter(void 0, void 0, void 0, function* () { yield save(value); }), 500);\n        useEffect(() => {\n            setValuesDebounced(value);\n        }, [value]);\n        const bg = useColorModeValue('#eeeeee', '#434343');\n        const hover = useColorModeValue('white', '#1e1e1e');\n        const borderColor = useColorModeValue('#434343', '#eeeeee');\n        const color = useColorModeValue('#1e1e1e', 'white');\n        return React.createElement(\"div\", { style: Object.assign(Object.assign({ width: 300 }, style), { position: 'relative' }) },\n            React.createElement(Input, { ref: ref, autoFocus: true, type: \"text\", variant: 'filled', variant: 'filled', bg: bg, color: color, borderWidth: 'thin', borderColor: borderColor, _hover: { bg: hover }, _focus: { bg: bg }, sx: {\n                    width: '100%',\n                }, onChange: (e) => setValue(e.target.value), value: value }));\n    };\n};\n//# sourceMappingURL=module.js.map"
          }
        },
        {
          "id": "stringHandler",
          "type": 2,
          "from": 3,
          "to": "stringClientHandlerGenerated",
          "value": {
            "value": ""
          }
        },
        {
          "id": "stringPackageQueryHandleClient",
          "type": 4,
          "from": 5,
          "to": "stringHandler",
          "value": {
            "value": ""
          }
        },
        {
          "id": "queryHandleClient",
          "type": 4,
          "from": 6,
          "to": "queryHandler",
          "value": {
            "value": ""
          }
        },
        {
          "id": "stringClientHandler",
          "type": 7,
          "value": {
            "value": "({ deep, require }) => {\n      const React = require('react');\n    const { useState, useEffect } = React;\n    const json5 = require('json5');\n    const { Input, useColorModeValue } = require('@chakra-ui/react');\n    const { useHotkeys } = require('react-hotkeys-hook');\n    const { useDebounceCallback } = require('@react-hook/debounce');\n    const { useContainer } = require('@deep-foundation/deepcase');\n    // Only string editor.\n    return ({ fillSize, style, link, onClose }) => {\n      \n      \n      const currentValue = deep.stringify(link?.value?.value) || '';\n      const [value, setValue] = useState(currentValue);\n      const save = async (value) => {\n          if (!link.value) await deep.insert({\n            link_id: link.id, value: value,\n        }, { table: 'strings' });\n        deep.update({ link_id: link.id }, { value: value }, { table: 'strings' });\n        \n      };\n      const ref = useHotkeys('enter', async () => {\n        await save(value);\n        onClose && onClose();\n      }, { enableOnTags: [\"INPUT\"] });\n      \n      const setValuesDebounced = useDebounceCallback(async(value) => {await save(value)}, 500);\n\n      useEffect(() => {\n        setValuesDebounced(value);\n      }, [value])\n\n      const bg = useColorModeValue('#eeeeee', '#434343');\n      const hover = useColorModeValue('white', '#1e1e1e');\n      const borderColor = useColorModeValue('#434343', '#eeeeee');\n      const color = useColorModeValue('#1e1e1e', 'white');\n\n    return <div\n        style={{\n          width: 300,\n          ...style,\n          position: 'relative', \n          // background: 'red'\n        }}\n      >\n        <Input\n          ref={ref}\n          autoFocus\n          type=\"text\"\n          variant='filled'\n          variant='filled'\n          bg={bg}\n          color={color}\n          borderWidth='thin'\n          borderColor={borderColor}\n          _hover={{bg: hover}}\n          _focus={{bg: bg}}\n          sx={{\n            width: '100%',\n          }}\n          onChange={(e) => setValue(e.target.value)}\n          value={value}\n        />\n      </div>;\n    }\n  }"
          }
        },
        {
          "id": "stringJoinHandleClient",
          "type": 4,
          "from": 8,
          "to": "stringHandler",
          "value": {
            "value": ""
          }
        },
        {
          "id": "editorClientHandlerGenerated",
          "type": 1,
          "value": {
            "value": "({ deep, require }) => {\n    const React = require('react');\n    const { useState } = React;\n    const json5 = require('json5');\n    const { useContainer, CytoEditorPreview } = require('@deep-foundation/deepcase');\n    const { Box, SimpleGrid } = require('@chakra-ui/react');\n    return ({ fillSize, style, link }) => {\n        var _a;\n        const currentValue = deep.stringify((_a = link === null || link === void 0 ? void 0 : link.value) === null || _a === void 0 ? void 0 : _a.value) || '';\n        const [value, setValue] = useState(currentValue);\n        const isSaved = value == currentValue;\n        const [container] = useContainer();\n        const { data } = deep.useDeepSubscription({\n            type_id: { _in: [\n                    deep.idLocal('@deep-foundation/core', 'Active'),\n                    deep.idLocal('@deep-foundation/core', 'Contain'),\n                ] },\n            to_id: { _eq: link.id },\n        });\n        const contain = data === null || data === void 0 ? void 0 : data.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Contain'));\n        const active = data === null || data === void 0 ? void 0 : data.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Active'));\n        return React.createElement(\"div\", { style: Object.assign(Object.assign({ width: 600, height: 600 }, style), { position: 'relative' }) },\n            React.createElement(CytoEditorPreview, { link: link, compact: true }));\n    };\n};\n//# sourceMappingURL=module.js.map"
          }
        },
        {
          "id": "editorHandler",
          "type": 2,
          "from": 3,
          "to": "editorClientHandlerGenerated",
          "value": {
            "value": ""
          }
        },
        {
          "id": "editorHandleClientSyncTextFile",
          "type": 4,
          "from": 7,
          "to": "editorHandler",
          "value": {
            "value": ""
          }
        },
        {
          "id": "editorHandleClientTSX",
          "type": 4,
          "from": 1,
          "to": "editorHandler",
          "value": {
            "value": ""
          }
        },
        {
          "id": "Traveler3",
          "type": 9,
          "from": 10,
          "to": 6
        },
        {
          "id": "travelerSymbol",
          "type": 11,
          "from": "Traveler3",
          "to": "Traveler3",
          "value": {
            "value": "🧳"
          }
        },
        {
          "id": "queryClientHandlerGenerated",
          "type": 1,
          "value": {
            "value": "var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\n({ deep, require }) => {\n    const React = require('react');\n    const { useState, useEffect } = React;\n    const json5 = require('json5');\n    const { useContainer, Resize, CustomizableIcon } = require('@deep-foundation/deepcase');\n    const MonacoEditor = require('@monaco-editor/react');\n    const { Box, IconButton, useColorModeValue, useColorMode } = require('@chakra-ui/react');\n    const { BsCheck2, BsLightbulbFill, BsLightbulbOff } = require('react-icons/bs');\n    const { motion, useAnimation } = require('framer-motion');\n    const variants = {\n        view: {\n            opacity: 1,\n            scale: 1,\n            transition: {\n                duration: 1,\n                delay: 0.3,\n                scale: { delay: 0.5, }\n            }\n        },\n        hide: {\n            opacity: 0,\n            scale: 0,\n            transition: {\n                type: 'spring'\n            }\n        },\n        initial: {\n            originX: 1,\n            opacity: 1,\n            scale: 1,\n        }\n    };\n    const stackVariants = {\n        outside: {\n            x: '0%',\n            opacity: 1,\n            scale: 1,\n            originX: 0,\n            transition: {\n                type: 'spring',\n                duration: 0.5,\n                delay: 0.2,\n                scale: { delay: 0.3, }\n            }\n        },\n        nested: {\n            x: '-100%',\n            opacity: 1,\n            scale: 1,\n            originX: 1,\n            transition: {\n                type: 'spring',\n                duration: 0.5,\n                delay: 0.2,\n                scale: { delay: 0.3, }\n            }\n        },\n        initial: {\n            x: '0%',\n            opacity: 0,\n            scale: 0,\n        }\n    };\n    return ({ fillSize, style, link }) => {\n        var _a;\n        const currentValue = deep.stringify((_a = link === null || link === void 0 ? void 0 : link.value) === null || _a === void 0 ? void 0 : _a.value) || '';\n        const [value, setValue] = useState(currentValue);\n        const isSaved = value == currentValue;\n        const [container] = useContainer();\n        const { data } = deep.useDeepSubscription({\n            type_id: { _in: [\n                    deep.idLocal('@deep-foundation/core', 'Active'),\n                    deep.idLocal('@deep-foundation/core', 'Contain'),\n                ] },\n            to_id: { _eq: link.id },\n        });\n        const contain = data === null || data === void 0 ? void 0 : data.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Contain'));\n        const active = data === null || data === void 0 ? void 0 : data.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Active'));\n        const [viewSize, setViewSize] = useState({ width: 300, height: 300 });\n        const terminalBorderWidth = viewSize.width - 1;\n        const terminalBorderHeight = viewSize.height - 1;\n        const control = useAnimation();\n        const controlStack = useAnimation();\n        useEffect(() => {\n            if (value) {\n                control.start('view');\n            }\n            else {\n                control.start('hide');\n            }\n            ;\n            if (fillSize === true) {\n                controlStack.start('nested');\n            }\n            else {\n                controlStack.start('outside');\n            }\n            ;\n        }, [control, controlStack, value, fillSize]);\n        const { colorMode } = useColorMode();\n        const body = React.createElement(\"div\", { style: Object.assign(Object.assign({ width: 300, height: 300 }, style), { position: 'relative' }) },\n            React.createElement(Box, { position: 'relative', display: 'grid', gridTemplateColumns: '1fr max-content', height: 'inherit' },\n                React.createElement(Box, { position: 'relative', overflow: 'hidden', sx: { borderRadius: 5 }, border: '1px dashed #605c60' },\n                    React.createElement(MonacoEditor, { options: {\n                            minimap: {\n                                enabled: false\n                            },\n                            lineNumbers: 'off',\n                            wordWrap: true,\n                        }, height: \"100%\", width: \"100%\", theme: colorMode === 'light' ? 'light' : \"vs-dark\", defaultLanguage: \"json\", defaultValue: value || '', onChange: (value) => setValue(value) })),\n                React.createElement(Box, { as: motion.div, animate: controlStack, variants: stackVariants, initial: 'initial', height: fillSize ? '100%' : 300, display: 'flex', justifyContent: 'space-between', flexDirection: 'column', ml: fillSize ? 0 : '0.2rem' },\n                    React.createElement(IconButton, { as: motion.div, variants: variants, initial: 'initial', animate: 'view', \"aria-label\": 'activate/inactivate button', bg: active && colorMode === 'dark' ? 'gray.700' : 'blue.50', _hover: {\n                            bg: 'blue.100'\n                        }, isRound: true, variant: 'outline', sx: { borderColor: active ? '#111' : 'rgb(0, 128, 255)' }, mr: fillSize ? '0.2rem' : 0, mt: fillSize ? '0.2rem' : 0, size: 'xs', onClick: () => __awaiter(void 0, void 0, void 0, function* () {\n                            if (active) {\n                                yield deep.delete({\n                                    _or: [{\n                                            id: { _eq: active === null || active === void 0 ? void 0 : active.id },\n                                        }, {\n                                            type_id: deep.idLocal('@deep-foundation/core', 'Contain'),\n                                            from_id: link.id,\n                                            to_id: active.id,\n                                        }],\n                                });\n                            }\n                            else {\n                                yield deep.insert({\n                                    type_id: deep.idLocal('@deep-foundation/core', 'Active'),\n                                    from_id: contain.from_id,\n                                    to_id: contain.to_id,\n                                    in: { data: {\n                                            type_id: deep.idLocal('@deep-foundation/core', 'Contain'),\n                                            from_id: link.id,\n                                        } },\n                                });\n                            }\n                        }), icon: active ? React.createElement(BsLightbulbOff, null) : React.createElement(CustomizableIcon, { Component: BsLightbulbFill, value: { color: 'rgb(0, 128, 255)' } }) }),\n                    React.createElement(IconButton, { as: motion.div, variants: variants, initial: 'initial', animate: control, whileInView: 'view', \"aria-label\": 'save button', isRound: true, bg: 'blue.50', _hover: {\n                            bg: 'blue.100'\n                        }, variant: 'outline', sx: { borderColor: 'rgb(0, 128, 255)' }, mr: fillSize ? '0.2rem' : 0, mb: fillSize ? '0.2rem' : 0, size: 'xs', icon: React.createElement(CustomizableIcon, { Component: BsCheck2, value: { color: 'rgb(0, 128, 255)' } }), onClick: () => {\n                            try {\n                                const _value = json5.parse(value);\n                                if (!link.value)\n                                    deep.insert({\n                                        link_id: link.id, value: _value,\n                                    }, { table: 'objects' });\n                                deep.update({ link_id: link.id }, { value: _value }, { table: 'objects' });\n                            }\n                            catch (error) { }\n                        } }))));\n        return React.createElement(React.Fragment, null, fillSize\n            ? body\n            : React.createElement(Resize, { onChangeSize: (viewSize) => setViewSize(viewSize), style: {\n                    borderRadius: 5,\n                    border: 'none',\n                } }, body));\n    };\n};\n//# sourceMappingURL=module.js.map"
          }
        },
        {
          "id": "queryHandler",
          "type": 2,
          "from": 3,
          "to": "queryClientHandlerGenerated",
          "value": {
            "value": ""
          }
        },
        {
          "id": "editorClientHandler",
          "type": 7,
          "value": {
            "value": "({ deep, require }) => {\n  const React = require('react');\n  const { useState } = React;\n  const json5 = require('json5');\n  const { useContainer, CytoEditorPreview } = require('@deep-foundation/deepcase');\n  const { Box, SimpleGrid } = require('@chakra-ui/react');\n  // Only objects editor.\n  return ({ fillSize, style, link }) => {\n    const currentValue = deep.stringify(link?.value?.value) || '';\n    const [value, setValue] = useState(currentValue);\n    const isSaved = value == currentValue;\n    const [container] = useContainer();\n    const { data } = deep.useDeepSubscription({\n      type_id: { _in: [\n        deep.idLocal('@deep-foundation/core', 'Active'),\n        deep.idLocal('@deep-foundation/core', 'Contain'),\n      ] },\n      to_id: { _eq: link.id },\n    });\n    const contain = data?.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Contain'))\n    const active = data?.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Active'))\n    return <div\n      style={{\n        width: 600,\n        height: 600,\n        ...style,\n        position: 'relative',\n      }}\n    >\n      <CytoEditorPreview link={link} compact/>\n    </div>;\n  }\n}"
          }
        },
        {
          "id": "editorClientHandlerGeneratedFrom",
          "type": 12,
          "from": "editorClientHandlerGenerated",
          "to": "editorClientHandler"
        },
        {
          "id": "queryClientHandler",
          "type": 7,
          "value": {
            "value": "({ deep, require }) => {\n    const React = require('react');\n    const { useState, useEffect } = React;\n    const json5 = require('json5');\n    const { useContainer, Resize, CustomizableIcon } = require('@deep-foundation/deepcase');\n    const MonacoEditor = require('@monaco-editor/react');\n    const { Box, IconButton, useColorModeValue, useColorMode } = require('@chakra-ui/react');\n    const { BsCheck2, BsLightbulbFill, BsLightbulbOff } = require('react-icons/bs');\n    const { motion, useAnimation } = require('framer-motion');\n\n    const variants = {\n      view: {\n        opacity: 1,\n        scale: 1,\n        transition: {\n          duration: 1,\n          delay: 0.3,\n          scale: { delay: 0.5, } \n        }\n      },\n      hide: {\n        opacity: 0, \n        scale: 0,\n        transition: {\n          type: 'spring'\n        }\n      },\n      initial: {\n        originX: 1,\n        opacity: 1,\n        scale: 1,\n      }\n    };\n\n    const stackVariants = {\n      outside: {\n        x: '0%',\n        opacity: 1,\n        scale: 1,\n        originX: 0,\n        transition: {\n          type: 'spring',\n\n          duration: 0.5,\n          delay: 0.2,\n          scale: { delay: 0.3, }\n        }\n      },\n      nested: {\n        x: '-100%',\n        opacity: 1,\n        scale: 1,\n        originX: 1,\n        transition: {\n          type: 'spring',\n          duration: 0.5,\n          delay: 0.2,\n          scale: { delay: 0.3, }\n        }\n      },\n      initial: {\n        x: '0%',\n        opacity: 0,\n        scale: 0,\n      }\n    };\n    \n    // Only objects editor.\n    return ({ fillSize, style, link }) => {\n      const currentValue = deep.stringify(link?.value?.value) || '';\n      const [value, setValue] = useState(currentValue);\n      const isSaved = value == currentValue;\n      const [container] = useContainer();\n      const { data } = deep.useDeepSubscription({\n        type_id: { _in: [\n          deep.idLocal('@deep-foundation/core', 'Active'),\n          deep.idLocal('@deep-foundation/core', 'Contain'),\n        ] },\n        to_id: { _eq: link.id },\n      });\n      const contain = data?.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Contain'))\n      const active = data?.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Active'))\n\n      const [viewSize, setViewSize] = useState({width: 300, height: 300});\n      const terminalBorderWidth = viewSize.width - 1;\n      const terminalBorderHeight = viewSize.height - 1;\n\n      const control = useAnimation();\n      const controlStack = useAnimation();\n\n      useEffect(() => {\n        if (value) {\n          control.start('view')\n        } else {\n          control.start('hide')\n        };\n        if (fillSize === true) {\n          controlStack.start('nested')\n        } else {\n          // controlStack.start('initial')\n          controlStack.start('outside')\n        };\n\n      }, [control, controlStack, value, fillSize])\n\n      const { colorMode } = useColorMode();\n\n      const body = <div\n          style={{\n            width: 300,\n            height: 300,\n            ...style,\n            position: 'relative',\n          }}\n        >\n          <Box \n            position='relative'\n            display='grid' \n            gridTemplateColumns='1fr max-content' \n            height='inherit'\n          >\n            <Box\n              position='relative'\n              overflow='hidden' sx={{ borderRadius: 5 }}\n              border='1px dashed #605c60'\n            > \n              <MonacoEditor\n                options={{\n                  minimap: {\n                    enabled: false\n                  },\n                  lineNumbers: 'off',\n                  wordWrap: true,\n                }}\n                height=\"100%\"\n                width=\"100%\"\n                theme={colorMode === 'light' ? 'light' : \"vs-dark\"}\n                defaultLanguage=\"json\"\n                defaultValue={value || ''}\n                onChange={(value) => setValue(value)}\n                // onMount={handleEditorDidMount}\n              />\n            </Box>\n            <Box\n              as={motion.div}\n              animate={controlStack}\n              variants={stackVariants}\n              initial='initial'\n              // height={stackHeight}\n              height={fillSize ? '100%' : 300}\n              display='flex'\n              justifyContent='space-between'\n              flexDirection='column'\n              ml={fillSize ? 0 : '0.2rem'}\n            >\n              <IconButton \n                as={motion.div}\n                variants={variants}\n                initial='initial'\n                // whileInView='view'\n                animate='view'\n                aria-label='activate/inactivate button' \n                bg={active && colorMode === 'dark' ? 'gray.700' : 'blue.50'}\n                _hover={{\n                  bg: 'blue.100'\n                }}\n                isRound\n                variant='outline'\n                sx={{ borderColor: active ? '#111' : 'rgb(0, 128, 255)' }}\n                mr={fillSize ? '0.2rem' : 0}\n                mt={fillSize ? '0.2rem' : 0}\n                size='xs'\n                onClick={async () => {\n                    if (active) {\n                      await deep.delete({\n                        _or: [{\n                          id: { _eq: active?.id },\n                      }, {\n                          type_id: deep.idLocal('@deep-foundation/core', 'Contain'),\n                        from_id: link.id,\n                        to_id: active.id,\n                      }],\n                    });\n                  } else {\n                      await deep.insert({\n                        type_id: deep.idLocal('@deep-foundation/core', 'Active'),\n                      from_id: contain.from_id,\n                      to_id: contain.to_id,\n                      in: { data: {\n                          type_id: deep.idLocal('@deep-foundation/core', 'Contain'),\n                        from_id: link.id,\n                      } },\n                    });\n                  }\n                }}\n                icon={active ? <BsLightbulbOff /> : <CustomizableIcon Component={BsLightbulbFill} value={{ color: 'rgb(0, 128, 255)' }} />}\n              />\n              <IconButton \n                as={motion.div}\n                variants={variants}\n                initial='initial'\n                animate={control}\n                whileInView='view'\n                // isDisabled={isSaved}\n                aria-label='save button' \n                isRound\n                bg='blue.50'\n                _hover={{\n                  bg: 'blue.100'\n                }}\n                variant='outline'\n                sx={{ borderColor: 'rgb(0, 128, 255)' }}\n                mr={fillSize ? '0.2rem' : 0}\n                mb={fillSize ? '0.2rem' : 0}\n                // isLoading={!isSaved}\n                size='xs'\n                icon={<CustomizableIcon Component={BsCheck2} value={{ color: 'rgb(0, 128, 255)' }} />}\n                onClick={() => {\n                  try {\n                    const _value = json5.parse(value);\n                    if (!link.value) deep.insert({\n                      link_id: link.id, value: _value,\n                    }, { table: 'objects' });\n                    deep.update({ link_id: link.id }, { value: _value }, { table: 'objects' });\n                  } catch(error) {}\n                }}\n              />\n            </Box>\n          </Box>\n        </div>;\n\n      return  <>\n        {fillSize \n        ? body \n        : <Resize\n            onChangeSize={(viewSize) => setViewSize(viewSize)} \n            style={{\n            // position: 'relative',\n            // overflow: nested ? 'hidden' : 'inherit',\n            borderRadius: 5,\n            border: 'none',\n          }}\n        >{body}</Resize>}</>;\n    }\n  }\n"
          }
        },
        {
          "id": "queryClientHandlerGeneratedFrom",
          "type": 12,
          "from": "queryClientHandlerGenerated",
          "to": "queryClientHandler"
        },
        {
          "id": "stringClientHandlerGeneratedFrom",
          "type": 12,
          "from": "stringClientHandlerGenerated",
          "to": "stringClientHandler"
        },
        {
          "id": "stringContainHandleClient",
          "type": 4,
          "from": 13,
          "to": "stringHandler",
          "value": {
            "value": ""
          }
        }
      ];
      const pckg: Package = { package: { name: 'test'}, data, strict: true };
      const expectedResult = [
        {
          "package": {
            "dependencyId": 0,
            "containValue": "SyncTextFile"
          },
          "id": 1
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "Handler"
          },
          "id": 2
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "clientSupportsJs"
          },
          "id": 3
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "HandleClient"
          },
          "id": 4
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "PackageQuery"
          },
          "id": 5
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "Query"
          },
          "id": 6
        },
        {
          "package": {
            "dependencyId": 1,
            "containValue": "TSX"
          },
          "id": 7
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "Join"
          },
          "id": 8
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "Type"
          },
          "id": 9
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "Any"
          },
          "id": 10
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "Symbol"
          },
          "id": 11
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "GeneratedFrom"
          },
          "id": 12
        },
        {
          "package": {
            "dependencyId": 0,
            "containValue": "Contain"
          },
          "id": 13
        },
        {
          "id": "stringClientHandlerGenerated",
          "type": 1,
          "value": {
            "value": "var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\n({ deep, require }) => {\n    const React = require('react');\n    const { useState, useEffect } = React;\n    const json5 = require('json5');\n    const { Input, useColorModeValue } = require('@chakra-ui/react');\n    const { useHotkeys } = require('react-hotkeys-hook');\n    const { useDebounceCallback } = require('@react-hook/debounce');\n    const { useContainer } = require('@deep-foundation/deepcase');\n    return ({ fillSize, style, link, onClose }) => {\n        var _a;\n        const currentValue = deep.stringify((_a = link === null || link === void 0 ? void 0 : link.value) === null || _a === void 0 ? void 0 : _a.value) || '';\n        const [value, setValue] = useState(currentValue);\n        const save = (value) => __awaiter(void 0, void 0, void 0, function* () {\n            if (!link.value)\n                yield deep.insert({\n                    link_id: link.id, value: value,\n                }, { table: 'strings' });\n            deep.update({ link_id: link.id }, { value: value }, { table: 'strings' });\n        });\n        const ref = useHotkeys('enter', () => __awaiter(void 0, void 0, void 0, function* () {\n            yield save(value);\n            onClose && onClose();\n        }), { enableOnTags: [\"INPUT\"] });\n        const setValuesDebounced = useDebounceCallback((value) => __awaiter(void 0, void 0, void 0, function* () { yield save(value); }), 500);\n        useEffect(() => {\n            setValuesDebounced(value);\n        }, [value]);\n        const bg = useColorModeValue('#eeeeee', '#434343');\n        const hover = useColorModeValue('white', '#1e1e1e');\n        const borderColor = useColorModeValue('#434343', '#eeeeee');\n        const color = useColorModeValue('#1e1e1e', 'white');\n        return React.createElement(\"div\", { style: Object.assign(Object.assign({ width: 300 }, style), { position: 'relative' }) },\n            React.createElement(Input, { ref: ref, autoFocus: true, type: \"text\", variant: 'filled', variant: 'filled', bg: bg, color: color, borderWidth: 'thin', borderColor: borderColor, _hover: { bg: hover }, _focus: { bg: bg }, sx: {\n                    width: '100%',\n                }, onChange: (e) => setValue(e.target.value), value: value }));\n    };\n};\n//# sourceMappingURL=module.js.map"
          }
        },
        {
          "id": "stringHandler",
          "type": 2,
          "from": 3,
          "to": "stringClientHandlerGenerated",
          "value": {
            "value": ""
          }
        },
        {
          "id": "stringPackageQueryHandleClient",
          "type": 4,
          "from": 5,
          "to": "stringHandler",
          "value": {
            "value": ""
          }
        },
        {
          "id": "queryClientHandlerGenerated",
          "type": 1,
          "value": {
            "value": "var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\n({ deep, require }) => {\n    const React = require('react');\n    const { useState, useEffect } = React;\n    const json5 = require('json5');\n    const { useContainer, Resize, CustomizableIcon } = require('@deep-foundation/deepcase');\n    const MonacoEditor = require('@monaco-editor/react');\n    const { Box, IconButton, useColorModeValue, useColorMode } = require('@chakra-ui/react');\n    const { BsCheck2, BsLightbulbFill, BsLightbulbOff } = require('react-icons/bs');\n    const { motion, useAnimation } = require('framer-motion');\n    const variants = {\n        view: {\n            opacity: 1,\n            scale: 1,\n            transition: {\n                duration: 1,\n                delay: 0.3,\n                scale: { delay: 0.5, }\n            }\n        },\n        hide: {\n            opacity: 0,\n            scale: 0,\n            transition: {\n                type: 'spring'\n            }\n        },\n        initial: {\n            originX: 1,\n            opacity: 1,\n            scale: 1,\n        }\n    };\n    const stackVariants = {\n        outside: {\n            x: '0%',\n            opacity: 1,\n            scale: 1,\n            originX: 0,\n            transition: {\n                type: 'spring',\n                duration: 0.5,\n                delay: 0.2,\n                scale: { delay: 0.3, }\n            }\n        },\n        nested: {\n            x: '-100%',\n            opacity: 1,\n            scale: 1,\n            originX: 1,\n            transition: {\n                type: 'spring',\n                duration: 0.5,\n                delay: 0.2,\n                scale: { delay: 0.3, }\n            }\n        },\n        initial: {\n            x: '0%',\n            opacity: 0,\n            scale: 0,\n        }\n    };\n    return ({ fillSize, style, link }) => {\n        var _a;\n        const currentValue = deep.stringify((_a = link === null || link === void 0 ? void 0 : link.value) === null || _a === void 0 ? void 0 : _a.value) || '';\n        const [value, setValue] = useState(currentValue);\n        const isSaved = value == currentValue;\n        const [container] = useContainer();\n        const { data } = deep.useDeepSubscription({\n            type_id: { _in: [\n                    deep.idLocal('@deep-foundation/core', 'Active'),\n                    deep.idLocal('@deep-foundation/core', 'Contain'),\n                ] },\n            to_id: { _eq: link.id },\n        });\n        const contain = data === null || data === void 0 ? void 0 : data.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Contain'));\n        const active = data === null || data === void 0 ? void 0 : data.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Active'));\n        const [viewSize, setViewSize] = useState({ width: 300, height: 300 });\n        const terminalBorderWidth = viewSize.width - 1;\n        const terminalBorderHeight = viewSize.height - 1;\n        const control = useAnimation();\n        const controlStack = useAnimation();\n        useEffect(() => {\n            if (value) {\n                control.start('view');\n            }\n            else {\n                control.start('hide');\n            }\n            ;\n            if (fillSize === true) {\n                controlStack.start('nested');\n            }\n            else {\n                controlStack.start('outside');\n            }\n            ;\n        }, [control, controlStack, value, fillSize]);\n        const { colorMode } = useColorMode();\n        const body = React.createElement(\"div\", { style: Object.assign(Object.assign({ width: 300, height: 300 }, style), { position: 'relative' }) },\n            React.createElement(Box, { position: 'relative', display: 'grid', gridTemplateColumns: '1fr max-content', height: 'inherit' },\n                React.createElement(Box, { position: 'relative', overflow: 'hidden', sx: { borderRadius: 5 }, border: '1px dashed #605c60' },\n                    React.createElement(MonacoEditor, { options: {\n                            minimap: {\n                                enabled: false\n                            },\n                            lineNumbers: 'off',\n                            wordWrap: true,\n                        }, height: \"100%\", width: \"100%\", theme: colorMode === 'light' ? 'light' : \"vs-dark\", defaultLanguage: \"json\", defaultValue: value || '', onChange: (value) => setValue(value) })),\n                React.createElement(Box, { as: motion.div, animate: controlStack, variants: stackVariants, initial: 'initial', height: fillSize ? '100%' : 300, display: 'flex', justifyContent: 'space-between', flexDirection: 'column', ml: fillSize ? 0 : '0.2rem' },\n                    React.createElement(IconButton, { as: motion.div, variants: variants, initial: 'initial', animate: 'view', \"aria-label\": 'activate/inactivate button', bg: active && colorMode === 'dark' ? 'gray.700' : 'blue.50', _hover: {\n                            bg: 'blue.100'\n                        }, isRound: true, variant: 'outline', sx: { borderColor: active ? '#111' : 'rgb(0, 128, 255)' }, mr: fillSize ? '0.2rem' : 0, mt: fillSize ? '0.2rem' : 0, size: 'xs', onClick: () => __awaiter(void 0, void 0, void 0, function* () {\n                            if (active) {\n                                yield deep.delete({\n                                    _or: [{\n                                            id: { _eq: active === null || active === void 0 ? void 0 : active.id },\n                                        }, {\n                                            type_id: deep.idLocal('@deep-foundation/core', 'Contain'),\n                                            from_id: link.id,\n                                            to_id: active.id,\n                                        }],\n                                });\n                            }\n                            else {\n                                yield deep.insert({\n                                    type_id: deep.idLocal('@deep-foundation/core', 'Active'),\n                                    from_id: contain.from_id,\n                                    to_id: contain.to_id,\n                                    in: { data: {\n                                            type_id: deep.idLocal('@deep-foundation/core', 'Contain'),\n                                            from_id: link.id,\n                                        } },\n                                });\n                            }\n                        }), icon: active ? React.createElement(BsLightbulbOff, null) : React.createElement(CustomizableIcon, { Component: BsLightbulbFill, value: { color: 'rgb(0, 128, 255)' } }) }),\n                    React.createElement(IconButton, { as: motion.div, variants: variants, initial: 'initial', animate: control, whileInView: 'view', \"aria-label\": 'save button', isRound: true, bg: 'blue.50', _hover: {\n                            bg: 'blue.100'\n                        }, variant: 'outline', sx: { borderColor: 'rgb(0, 128, 255)' }, mr: fillSize ? '0.2rem' : 0, mb: fillSize ? '0.2rem' : 0, size: 'xs', icon: React.createElement(CustomizableIcon, { Component: BsCheck2, value: { color: 'rgb(0, 128, 255)' } }), onClick: () => {\n                            try {\n                                const _value = json5.parse(value);\n                                if (!link.value)\n                                    deep.insert({\n                                        link_id: link.id, value: _value,\n                                    }, { table: 'objects' });\n                                deep.update({ link_id: link.id }, { value: _value }, { table: 'objects' });\n                            }\n                            catch (error) { }\n                        } }))));\n        return React.createElement(React.Fragment, null, fillSize\n            ? body\n            : React.createElement(Resize, { onChangeSize: (viewSize) => setViewSize(viewSize), style: {\n                    borderRadius: 5,\n                    border: 'none',\n                } }, body));\n    };\n};\n//# sourceMappingURL=module.js.map"
          }
        },
        {
          "id": "queryHandler",
          "type": 2,
          "from": 3,
          "to": "queryClientHandlerGenerated",
          "value": {
            "value": ""
          }
        },
        {
          "id": "queryHandleClient",
          "type": 4,
          "from": 6,
          "to": "queryHandler",
          "value": {
            "value": ""
          }
        },
        {
          "id": "stringClientHandler",
          "type": 7,
          "value": {
            "value": "({ deep, require }) => {\n      const React = require('react');\n    const { useState, useEffect } = React;\n    const json5 = require('json5');\n    const { Input, useColorModeValue } = require('@chakra-ui/react');\n    const { useHotkeys } = require('react-hotkeys-hook');\n    const { useDebounceCallback } = require('@react-hook/debounce');\n    const { useContainer } = require('@deep-foundation/deepcase');\n    // Only string editor.\n    return ({ fillSize, style, link, onClose }) => {\n      \n      \n      const currentValue = deep.stringify(link?.value?.value) || '';\n      const [value, setValue] = useState(currentValue);\n      const save = async (value) => {\n          if (!link.value) await deep.insert({\n            link_id: link.id, value: value,\n        }, { table: 'strings' });\n        deep.update({ link_id: link.id }, { value: value }, { table: 'strings' });\n        \n      };\n      const ref = useHotkeys('enter', async () => {\n        await save(value);\n        onClose && onClose();\n      }, { enableOnTags: [\"INPUT\"] });\n      \n      const setValuesDebounced = useDebounceCallback(async(value) => {await save(value)}, 500);\n\n      useEffect(() => {\n        setValuesDebounced(value);\n      }, [value])\n\n      const bg = useColorModeValue('#eeeeee', '#434343');\n      const hover = useColorModeValue('white', '#1e1e1e');\n      const borderColor = useColorModeValue('#434343', '#eeeeee');\n      const color = useColorModeValue('#1e1e1e', 'white');\n\n    return <div\n        style={{\n          width: 300,\n          ...style,\n          position: 'relative', \n          // background: 'red'\n        }}\n      >\n        <Input\n          ref={ref}\n          autoFocus\n          type=\"text\"\n          variant='filled'\n          variant='filled'\n          bg={bg}\n          color={color}\n          borderWidth='thin'\n          borderColor={borderColor}\n          _hover={{bg: hover}}\n          _focus={{bg: bg}}\n          sx={{\n            width: '100%',\n          }}\n          onChange={(e) => setValue(e.target.value)}\n          value={value}\n        />\n      </div>;\n    }\n  }"
          }
        },
        {
          "id": "stringJoinHandleClient",
          "type": 4,
          "from": 8,
          "to": "stringHandler",
          "value": {
            "value": ""
          }
        },
        {
          "id": "editorClientHandlerGenerated",
          "type": 1,
          "value": {
            "value": "({ deep, require }) => {\n    const React = require('react');\n    const { useState } = React;\n    const json5 = require('json5');\n    const { useContainer, CytoEditorPreview } = require('@deep-foundation/deepcase');\n    const { Box, SimpleGrid } = require('@chakra-ui/react');\n    return ({ fillSize, style, link }) => {\n        var _a;\n        const currentValue = deep.stringify((_a = link === null || link === void 0 ? void 0 : link.value) === null || _a === void 0 ? void 0 : _a.value) || '';\n        const [value, setValue] = useState(currentValue);\n        const isSaved = value == currentValue;\n        const [container] = useContainer();\n        const { data } = deep.useDeepSubscription({\n            type_id: { _in: [\n                    deep.idLocal('@deep-foundation/core', 'Active'),\n                    deep.idLocal('@deep-foundation/core', 'Contain'),\n                ] },\n            to_id: { _eq: link.id },\n        });\n        const contain = data === null || data === void 0 ? void 0 : data.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Contain'));\n        const active = data === null || data === void 0 ? void 0 : data.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Active'));\n        return React.createElement(\"div\", { style: Object.assign(Object.assign({ width: 600, height: 600 }, style), { position: 'relative' }) },\n            React.createElement(CytoEditorPreview, { link: link, compact: true }));\n    };\n};\n//# sourceMappingURL=module.js.map"
          }
        },
        {
          "id": "editorHandler",
          "type": 2,
          "from": 3,
          "to": "editorClientHandlerGenerated",
          "value": {
            "value": ""
          }
        },
        {
          "id": "editorHandleClientSyncTextFile",
          "type": 4,
          "from": 7,
          "to": "editorHandler",
          "value": {
            "value": ""
          }
        },
        {
          "id": "editorHandleClientTSX",
          "type": 4,
          "from": 1,
          "to": "editorHandler",
          "value": {
            "value": ""
          }
        },
        {
          "id": "Traveler",
          "type": 9,
          "from": 10,
          "to": 6
        },
        {
          "id": "travelerSymbol",
          "type": 11,
          "from": "Traveler",
          "to": "Traveler",
          "value": {
            "value": "🧳"
          }
        },
        {
          "id": "editorClientHandler",
          "type": 7,
          "value": {
            "value": "({ deep, require }) => {\n  const React = require('react');\n  const { useState } = React;\n  const json5 = require('json5');\n  const { useContainer, CytoEditorPreview } = require('@deep-foundation/deepcase');\n  const { Box, SimpleGrid } = require('@chakra-ui/react');\n  // Only objects editor.\n  return ({ fillSize, style, link }) => {\n    const currentValue = deep.stringify(link?.value?.value) || '';\n    const [value, setValue] = useState(currentValue);\n    const isSaved = value == currentValue;\n    const [container] = useContainer();\n    const { data } = deep.useDeepSubscription({\n      type_id: { _in: [\n        deep.idLocal('@deep-foundation/core', 'Active'),\n        deep.idLocal('@deep-foundation/core', 'Contain'),\n      ] },\n      to_id: { _eq: link.id },\n    });\n    const contain = data?.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Contain'))\n    const active = data?.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Active'))\n    return <div\n      style={{\n        width: 600,\n        height: 600,\n        ...style,\n        position: 'relative',\n      }}\n    >\n      <CytoEditorPreview link={link} compact/>\n    </div>;\n  }\n}"
          }
        },
        {
          "id": "editorClientHandlerGeneratedFrom",
          "type": 12,
          "from": "editorClientHandlerGenerated",
          "to": "editorClientHandler"
        },
        {
          "id": "queryClientHandler",
          "type": 7,
          "value": {
            "value": "({ deep, require }) => {\n    const React = require('react');\n    const { useState, useEffect } = React;\n    const json5 = require('json5');\n    const { useContainer, Resize, CustomizableIcon } = require('@deep-foundation/deepcase');\n    const MonacoEditor = require('@monaco-editor/react');\n    const { Box, IconButton, useColorModeValue, useColorMode } = require('@chakra-ui/react');\n    const { BsCheck2, BsLightbulbFill, BsLightbulbOff } = require('react-icons/bs');\n    const { motion, useAnimation } = require('framer-motion');\n\n    const variants = {\n      view: {\n        opacity: 1,\n        scale: 1,\n        transition: {\n          duration: 1,\n          delay: 0.3,\n          scale: { delay: 0.5, } \n        }\n      },\n      hide: {\n        opacity: 0, \n        scale: 0,\n        transition: {\n          type: 'spring'\n        }\n      },\n      initial: {\n        originX: 1,\n        opacity: 1,\n        scale: 1,\n      }\n    };\n\n    const stackVariants = {\n      outside: {\n        x: '0%',\n        opacity: 1,\n        scale: 1,\n        originX: 0,\n        transition: {\n          type: 'spring',\n\n          duration: 0.5,\n          delay: 0.2,\n          scale: { delay: 0.3, }\n        }\n      },\n      nested: {\n        x: '-100%',\n        opacity: 1,\n        scale: 1,\n        originX: 1,\n        transition: {\n          type: 'spring',\n          duration: 0.5,\n          delay: 0.2,\n          scale: { delay: 0.3, }\n        }\n      },\n      initial: {\n        x: '0%',\n        opacity: 0,\n        scale: 0,\n      }\n    };\n    \n    // Only objects editor.\n    return ({ fillSize, style, link }) => {\n      const currentValue = deep.stringify(link?.value?.value) || '';\n      const [value, setValue] = useState(currentValue);\n      const isSaved = value == currentValue;\n      const [container] = useContainer();\n      const { data } = deep.useDeepSubscription({\n        type_id: { _in: [\n          deep.idLocal('@deep-foundation/core', 'Active'),\n          deep.idLocal('@deep-foundation/core', 'Contain'),\n        ] },\n        to_id: { _eq: link.id },\n      });\n      const contain = data?.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Contain'))\n      const active = data?.find(l => l.type_id === deep.idLocal('@deep-foundation/core', 'Active'))\n\n      const [viewSize, setViewSize] = useState({width: 300, height: 300});\n      const terminalBorderWidth = viewSize.width - 1;\n      const terminalBorderHeight = viewSize.height - 1;\n\n      const control = useAnimation();\n      const controlStack = useAnimation();\n\n      useEffect(() => {\n        if (value) {\n          control.start('view')\n        } else {\n          control.start('hide')\n        };\n        if (fillSize === true) {\n          controlStack.start('nested')\n        } else {\n          // controlStack.start('initial')\n          controlStack.start('outside')\n        };\n\n      }, [control, controlStack, value, fillSize])\n\n      const { colorMode } = useColorMode();\n\n      const body = <div\n          style={{\n            width: 300,\n            height: 300,\n            ...style,\n            position: 'relative',\n          }}\n        >\n          <Box \n            position='relative'\n            display='grid' \n            gridTemplateColumns='1fr max-content' \n            height='inherit'\n          >\n            <Box\n              position='relative'\n              overflow='hidden' sx={{ borderRadius: 5 }}\n              border='1px dashed #605c60'\n            > \n              <MonacoEditor\n                options={{\n                  minimap: {\n                    enabled: false\n                  },\n                  lineNumbers: 'off',\n                  wordWrap: true,\n                }}\n                height=\"100%\"\n                width=\"100%\"\n                theme={colorMode === 'light' ? 'light' : \"vs-dark\"}\n                defaultLanguage=\"json\"\n                defaultValue={value || ''}\n                onChange={(value) => setValue(value)}\n                // onMount={handleEditorDidMount}\n              />\n            </Box>\n            <Box\n              as={motion.div}\n              animate={controlStack}\n              variants={stackVariants}\n              initial='initial'\n              // height={stackHeight}\n              height={fillSize ? '100%' : 300}\n              display='flex'\n              justifyContent='space-between'\n              flexDirection='column'\n              ml={fillSize ? 0 : '0.2rem'}\n            >\n              <IconButton \n                as={motion.div}\n                variants={variants}\n                initial='initial'\n                // whileInView='view'\n                animate='view'\n                aria-label='activate/inactivate button' \n                bg={active && colorMode === 'dark' ? 'gray.700' : 'blue.50'}\n                _hover={{\n                  bg: 'blue.100'\n                }}\n                isRound\n                variant='outline'\n                sx={{ borderColor: active ? '#111' : 'rgb(0, 128, 255)' }}\n                mr={fillSize ? '0.2rem' : 0}\n                mt={fillSize ? '0.2rem' : 0}\n                size='xs'\n                onClick={async () => {\n                    if (active) {\n                      await deep.delete({\n                        _or: [{\n                          id: { _eq: active?.id },\n                      }, {\n                          type_id: deep.idLocal('@deep-foundation/core', 'Contain'),\n                        from_id: link.id,\n                        to_id: active.id,\n                      }],\n                    });\n                  } else {\n                      await deep.insert({\n                        type_id: deep.idLocal('@deep-foundation/core', 'Active'),\n                      from_id: contain.from_id,\n                      to_id: contain.to_id,\n                      in: { data: {\n                          type_id: deep.idLocal('@deep-foundation/core', 'Contain'),\n                        from_id: link.id,\n                      } },\n                    });\n                  }\n                }}\n                icon={active ? <BsLightbulbOff /> : <CustomizableIcon Component={BsLightbulbFill} value={{ color: 'rgb(0, 128, 255)' }} />}\n              />\n              <IconButton \n                as={motion.div}\n                variants={variants}\n                initial='initial'\n                animate={control}\n                whileInView='view'\n                // isDisabled={isSaved}\n                aria-label='save button' \n                isRound\n                bg='blue.50'\n                _hover={{\n                  bg: 'blue.100'\n                }}\n                variant='outline'\n                sx={{ borderColor: 'rgb(0, 128, 255)' }}\n                mr={fillSize ? '0.2rem' : 0}\n                mb={fillSize ? '0.2rem' : 0}\n                // isLoading={!isSaved}\n                size='xs'\n                icon={<CustomizableIcon Component={BsCheck2} value={{ color: 'rgb(0, 128, 255)' }} />}\n                onClick={() => {\n                  try {\n                    const _value = json5.parse(value);\n                    if (!link.value) deep.insert({\n                      link_id: link.id, value: _value,\n                    }, { table: 'objects' });\n                    deep.update({ link_id: link.id }, { value: _value }, { table: 'objects' });\n                  } catch(error) {}\n                }}\n              />\n            </Box>\n          </Box>\n        </div>;\n\n      return  <>\n        {fillSize \n        ? body \n        : <Resize\n            onChangeSize={(viewSize) => setViewSize(viewSize)} \n            style={{\n            // position: 'relative',\n            // overflow: nested ? 'hidden' : 'inherit',\n            borderRadius: 5,\n            border: 'none',\n          }}\n        >{body}</Resize>}</>;\n    }\n  }\n"
          }
        },
        {
          "id": "queryClientHandlerGeneratedFrom",
          "type": 12,
          "from": "queryClientHandlerGenerated",
          "to": "queryClientHandler"
        },
        {
          "id": "stringClientHandlerGeneratedFrom",
          "type": 12,
          "from": "stringClientHandlerGenerated",
          "to": "stringClientHandler"
        },
        {
          "id": "stringContainHandleClient",
          "type": 4,
          "from": 13,
          "to": "stringHandler",
          "value": {
            "value": ""
          }
        }
      ];
  
      const result = sort(pckg, data, [], references);
      console.log(result);
      expect(result.sorted).toEqual(expectedResult);
    });
  });
  if (GIST_URL) {
    describe('links', () => {
      it(`install and publish`, async () => {
        const { linkId, token } = await deep.jwt({ linkId: await deep.id('deep', 'admin') });
        const admin = new DeepClient({ deep, token, linkId });

        // insert query
        const { data: [{ id: packageQueryId1 }] } = await admin.insert({
          type_id: await admin.id('@deep-foundation/core', 'PackageQuery'),
          string: { data: { value: GIST_URL } },
        });
        // initiate installation
        const { data: [{ id: packageInstallId1 }] } = await admin.insert({
          type_id: await admin.id('@deep-foundation/core', 'PackageInstall'),
          from_id: admin.linkId, // actual user only can be here
          to_id: packageQueryId1,
        });
        // you can await promise of all operations about this link
        await admin.await(packageInstallId1);

        const { data: [{ id: packageId }] } = await admin.select({
          type_id: await admin.id('@deep-foundation/core', 'Package'),
          in: {
            type_id: await admin.id('@deep-foundation/core', 'PromiseOut'),
            from: {
              in: {
                type_id: await admin.id('@deep-foundation/core', 'Then'),
                from_id: packageInstallId1,
              }
            },
          },
        });

        // insert query
        const { data: [{ id: packageQueryId2 }] } = await admin.insert({
          type_id: await admin.id('@deep-foundation/core', 'PackageQuery'),
          string: { data: { value: GIST_URL } },
        });
        // initiate installation
        const { data: [{ id: packagePublishId }] } = await admin.insert({
          type_id: await admin.id('@deep-foundation/core', 'PackagePublish'),
          from_id: packageId,
          to_id: packageQueryId2,
        });
        // you can await promise of all operations about this link
        await admin.await(packagePublishId);
      });
    });
    describe('core', () => {
      it(`install then publish old`, async () => {
        // insert query
        const imported = await packagerInstallCore([], GIST_URL);
        if (imported.errors?.length) {
          log(JSON.stringify(imported, null, 2));
          throw new Error('!!errors?.length');
        }
        // insert query
        const exported = await packagerPublishCore([], GIST_URL, imported.packageId);
        if (exported?.errors?.length) {
          log(JSON.stringify(exported, null, 2));
          throw new Error('!!exported.data.errors');
        }
      });
      it(`install then publish new`, async () => {
        // insert query
        const address = GIST_URL.split('/').slice(0, -1).join('/');
        const imported = await packagerInstallCore([], GIST_URL);
        if (imported?.errors?.length) {
          log(JSON.stringify(imported, null, 2));
          throw new Error('!!imported.data.errors');
        }
        const exported = await packagerPublishCore([], address, imported.packageId);
        if (exported?.errors?.length) {
          log(JSON.stringify(exported, null, 2));
          throw new Error('!!exported.data.errors');
        }
      });
    });
    describe('gql', () => {
      it(`install then publish old`, async () => {
        // insert query
        const { data: { packager_install: imported } } = await deep.apolloClient.query({
          query: gql`query PACKAGE_INSTALL($address: String!) {
            packager_install(input: { address: $address }) {
              ids
              packageId
              errors
            }
          }`,
          variables: {
            address: GIST_URL
          },
        });
        if (imported.errors?.length) {
          log(JSON.stringify(imported, null, 2));
          throw new Error('!!errors?.length');
        }
        // insert query
        // const exported = await packagerPublishCore([], GIST_URL, imported.packageId);
        const { data: { packager_publish: exported } } = await deep.apolloClient.query({
          query: gql`query PACKAGE_PUBLISH($address: String!, $id: Int) {
            packager_publish(input: { address: $address, id: $id }) {
              address
              errors
            }
          }`,
          variables: {
            address: GIST_URL,
            id: imported?.packageId,
          },
        });
        if (exported?.errors?.length) {
          log(JSON.stringify(exported, null, 2));
          throw new Error('!!exported.data.errors');
        }
      });
      it(`install then publish new`, async () => {
        // insert query
        const address = GIST_URL.split('/').slice(0, -1).join('/');
        // const imported = await packagerInstallCore([], GIST_URL);
        // insert query
        const { data: { packager_install: imported } } = await deep.apolloClient.query({
          query: gql`query PACKAGE_INSTALL($address: String!) {
            packager_install(input: { address: $address }) {
              ids
              packageId
              errors
            }
          }`,
          variables: {
            address: GIST_URL
          },
        });
        if (imported?.errors?.length) {
          log(JSON.stringify(imported, null, 2));
          throw new Error('!!imported.data.errors');
        }
        // const exported = await packagerPublishCore([], address, imported.packageId);
        // insert query
        const { data: { packager_publish: exported } } = await deep.apolloClient.query({
          query: gql`query PACKAGE_PUBLISH($address: String!, $id: Int) {
            packager_publish(input: { address: $address, id: $id }) {
              address
              errors
            }
          }`,
          variables: {
            address: address,
            id: imported?.packageId,
          },
        });
        if (exported?.errors?.length) {
          log(JSON.stringify(exported, null, 2));
          throw new Error('!!exported.data.errors');
        }
      });
    });
  }
});