(function() {
var exports = {};
exports.id = 1;
exports.ids = [1];
exports.modules = {

/***/ 9035:
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "api": function() { return /* binding */ api; }
/* harmony export */ });
/* harmony import */ var cors__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(479);
/* harmony import */ var cors__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(cors__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _deepcase_hasura_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(4406);
/* harmony import */ var _deepcase_hasura_client__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_deepcase_hasura_client__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _deepcase_hasura_cors_middleware__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(1703);
/* harmony import */ var _deepcase_hasura_cors_middleware__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_deepcase_hasura_cors_middleware__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _deepcase_hasura_api__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(6143);
/* harmony import */ var _deepcase_hasura_api__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_deepcase_hasura_api__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _deepcase_deeplinks_imports_gql__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(8017);
/* harmony import */ var _deepcase_deeplinks_imports_gql__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_deepcase_deeplinks_imports_gql__WEBPACK_IMPORTED_MODULE_4__);





const api = new _deepcase_hasura_api__WEBPACK_IMPORTED_MODULE_3__.HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET
});
const client = (0,_deepcase_hasura_client__WEBPACK_IMPORTED_MODULE_1__.generateApolloClient)({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET
});
const cors = cors__WEBPACK_IMPORTED_MODULE_0___default()({
  methods: ['GET', 'HEAD', 'POST']
});
/* harmony default export */ __webpack_exports__["default"] = (async (req, res) => {
  await (0,_deepcase_hasura_cors_middleware__WEBPACK_IMPORTED_MODULE_2__.corsMiddleware)(req, res, cors);

  try {
    var _req$body, _event$data, _event$data2;

    const event = req === null || req === void 0 ? void 0 : (_req$body = req.body) === null || _req$body === void 0 ? void 0 : _req$body.event;
    const operation = event === null || event === void 0 ? void 0 : event.op;
    const oldRow = event === null || event === void 0 ? void 0 : (_event$data = event.data) === null || _event$data === void 0 ? void 0 : _event$data.old;
    const newRow = event === null || event === void 0 ? void 0 : (_event$data2 = event.data) === null || _event$data2 === void 0 ? void 0 : _event$data2.new;

    if (operation === 'INSERT' || operation === 'UPDATE') {
      var _explained$data, _explained$data$;

      const explained = await api.explain(`{ links(where: { _and: [{ id: { _eq: 777777777777 } }, ${newRow.gql}] }, limit: 1) { id } }`);
      const sql = explained === null || explained === void 0 ? void 0 : (_explained$data = explained.data) === null || _explained$data === void 0 ? void 0 : (_explained$data$ = _explained$data[0]) === null || _explained$data$ === void 0 ? void 0 : _explained$data$.sql;

      if (sql) {
        const convertedSql = `SELECT json_array_length("root") as "root" FROM (${sql}) as "root"`;
        const mutateResult = await client.mutate((0,_deepcase_deeplinks_imports_gql__WEBPACK_IMPORTED_MODULE_4__.generateSerial)({
          actions: [(0,_deepcase_deeplinks_imports_gql__WEBPACK_IMPORTED_MODULE_4__.generateMutation)({
            tableName: 'bool_exp',
            operation: 'update',
            variables: {
              where: {
                id: {
                  _eq: newRow.id
                }
              },
              _set: {
                sql: convertedSql
              }
            }
          })],
          name: 'INSERT_TYPE_TYPE'
        }));

        if (mutateResult !== null && mutateResult !== void 0 && mutateResult.errors) {
          return res.status(500).json({
            error: mutateResult === null || mutateResult === void 0 ? void 0 : mutateResult.errors
          });
        }

        return res.json({
          result: 'exaplained'
        });
      }

      console.log(explained);
      console.log(`{ links(where: { _and: [{ id: { _eq: 777777777777 } }, ${newRow.gql}] }, limit: 1) { id } }`);
      return res.status(500).json({
        error: 'notexplained'
      });
    }

    return res.status(500).json({
      error: 'operation can be only INSERT or UPDATE'
    });
  } catch (error) {
    return res.status(500).json({
      error: error.toString()
    });
  }
});

/***/ }),

/***/ 8017:
/***/ (function(module) {

"use strict";
module.exports = require("@deepcase/deeplinks/imports/gql");;

/***/ }),

/***/ 6143:
/***/ (function(module) {

"use strict";
module.exports = require("@deepcase/hasura/api");;

/***/ }),

/***/ 4406:
/***/ (function(module) {

"use strict";
module.exports = require("@deepcase/hasura/client");;

/***/ }),

/***/ 1703:
/***/ (function(module) {

"use strict";
module.exports = require("@deepcase/hasura/cors-middleware");;

/***/ }),

/***/ 479:
/***/ (function(module) {

"use strict";
module.exports = require("cors");;

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
var __webpack_exports__ = (__webpack_exec__(9035));
module.exports = __webpack_exports__;

})();