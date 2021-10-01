exports.id = 350;
exports.ids = [350];
exports.modules = {

/***/ 5350:
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Graphiql": function() { return /* binding */ Graphiql; }
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5282);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var graphiql__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1903);
/* harmony import */ var graphiql__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(graphiql__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _graphiql_toolkit__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1282);
/* harmony import */ var _graphiql_toolkit__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_graphiql_toolkit__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _provider__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(4531);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(9297);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _deepcase_hasura_client__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(4406);
/* harmony import */ var _deepcase_hasura_client__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_deepcase_hasura_client__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _deepcase_react_hasura_token_context__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(8451);
/* harmony import */ var _deepcase_react_hasura_token_context__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_deepcase_react_hasura_token_context__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _material_ui_styles__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(4047);
/* harmony import */ var _material_ui_styles__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_material_ui_styles__WEBPACK_IMPORTED_MODULE_7__);










const useStyles = (0,_material_ui_styles__WEBPACK_IMPORTED_MODULE_7__.makeStyles)(() => ({
  root: {
    width: '100%',
    height: '100%',
    '& .topBar, & .docExplorerShow': {
      background: 'transparent !important',
      '& .title': {
        display: 'none !important'
      },
      '& .execute-button-wrap': {
        margin: 0,
        '& svg': {
          fill: '#fff !important'
        }
      },
      '& .execute-button': {
        background: 'transparent !important',
        color: '#fff !important',
        border: 0,
        boxShadow: 'none !important'
      },
      '& .toolbar-button': {
        background: 'transparent !important',
        color: '#fff !important',
        border: 0,
        boxShadow: 'none !important'
      }
    }
  }
}));
function Graphiql({
  defaultQuery,
  onVisualize
}) {
  const classes = useStyles();
  const token = (0,_deepcase_react_hasura_token_context__WEBPACK_IMPORTED_MODULE_6__.useToken)() || '';
  const fetcher = (0,react__WEBPACK_IMPORTED_MODULE_4__.useMemo)(() => {
    return (0,_graphiql_toolkit__WEBPACK_IMPORTED_MODULE_2__.createGraphiQLFetcher)({
      url: `http${_provider__WEBPACK_IMPORTED_MODULE_3__/* .GRAPHQL_SSL */ .Cp ? 's' : ''}://${_provider__WEBPACK_IMPORTED_MODULE_3__/* .GRAPHQL_PATH */ .ei}`
    });
  }, []);
  const {
    0: query,
    1: setQuery
  } = (0,react__WEBPACK_IMPORTED_MODULE_4__.useState)('');
  const {
    0: variables,
    1: setVariables
  } = (0,react__WEBPACK_IMPORTED_MODULE_4__.useState)({});
  return /*#__PURE__*/react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
    children: !!fetcher && /*#__PURE__*/react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
      className: classes.root,
      children: /*#__PURE__*/react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((graphiql__WEBPACK_IMPORTED_MODULE_1___default()), {
        query: defaultQuery,
        fetcher: fetcher,
        defaultVariableEditorOpen: false,
        editorTheme: 'material-darker',
        headers: JSON.stringify((0,_deepcase_hasura_client__WEBPACK_IMPORTED_MODULE_5__.generateHeaders)({
          token: token,
          client: 'deeplinks-graphiql'
        })),
        toolbar: {
          additionalContent: /*#__PURE__*/react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
            children: /*#__PURE__*/react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((graphiql__WEBPACK_IMPORTED_MODULE_1___default().Button), {
              title: "Draw",
              label: "Draw",
              onClick: () => onVisualize(query, variables)
            })
          })
        },
        onEditQuery: query => setQuery(query),
        onEditVariables: variables => {
          try {
            setVariables(JSON.parse(variables));
          } catch (error) {}
        }
      })
    })
  });
}

/***/ })

};
;