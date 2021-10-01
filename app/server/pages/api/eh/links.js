(function() {
var exports = {};
exports.id = 931;
exports.ids = [931];
exports.modules = {

/***/ 6595:
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "api": function() { return /* binding */ api; },
  "default": function() { return /* binding */ links; }
});

// EXTERNAL MODULE: external "cors"
var external_cors_ = __webpack_require__(479);
var external_cors_default = /*#__PURE__*/__webpack_require__.n(external_cors_);
// EXTERNAL MODULE: external "@deepcase/hasura/client"
var client_ = __webpack_require__(4406);
// EXTERNAL MODULE: external "@deepcase/hasura/cors-middleware"
var cors_middleware_ = __webpack_require__(1703);
// EXTERNAL MODULE: external "@deepcase/hasura/api"
var api_ = __webpack_require__(6143);
;// CONCATENATED MODULE: external "apollo-boost"
var external_apollo_boost_namespaceObject = require("apollo-boost");;
;// CONCATENATED MODULE: external "vm"
var external_vm_namespaceObject = require("vm");;
var external_vm_default = /*#__PURE__*/__webpack_require__.n(external_vm_namespaceObject);
;// CONCATENATED MODULE: ./pages/api/eh/links.ts






const api = new api_.HasuraApi({
  path: process.env.MIGRATIONS_HASURA_PATH,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET
});
const client = (0,client_.generateApolloClient)({
  path: `${process.env.MIGRATIONS_HASURA_PATH}/v1/graphql`,
  ssl: !!+process.env.MIGRATIONS_HASURA_SSL,
  secret: process.env.MIGRATIONS_HASURA_SECRET
});
const cors = external_cors_default()({
  methods: ['GET', 'HEAD', 'POST']
});
/* harmony default export */ var links = (async (req, res) => {
  await (0,cors_middleware_.corsMiddleware)(req, res, cors);

  try {
    var _req$body;

    const event = req === null || req === void 0 ? void 0 : (_req$body = req.body) === null || _req$body === void 0 ? void 0 : _req$body.event;
    const operation = event === null || event === void 0 ? void 0 : event.op;

    if (operation === 'INSERT' || operation === 'UPDATE' || operation === 'DELETE') {
      var _event$data, _event$data2, _handleStringResult$d, _handleStringResult$d2, _handleStringResult$d3;

      const oldRow = event === null || event === void 0 ? void 0 : (_event$data = event.data) === null || _event$data === void 0 ? void 0 : _event$data.old;
      const newRow = event === null || event === void 0 ? void 0 : (_event$data2 = event.data) === null || _event$data2 === void 0 ? void 0 : _event$data2.new;
      const typeId = operation === 'DELETE' ? oldRow.type_id : newRow.type_id;
      const handleStringResult = await client.query({
        query: external_apollo_boost_namespaceObject.gql`query SELECT_STRING_HANDLE($typeId: bigint) { string(where: {
        link: {
          type_id: { _eq: 20 },
          to_id: { _eq: 16 },
          from_id: { _eq: $typeId }
        },
      }) {
        id
        value
      } }`,
        variables: {
          typeId
        }
      });
      const handleStringValue = handleStringResult === null || handleStringResult === void 0 ? void 0 : (_handleStringResult$d = handleStringResult.data) === null || _handleStringResult$d === void 0 ? void 0 : (_handleStringResult$d2 = _handleStringResult$d.string) === null || _handleStringResult$d2 === void 0 ? void 0 : (_handleStringResult$d3 = _handleStringResult$d2[0]) === null || _handleStringResult$d3 === void 0 ? void 0 : _handleStringResult$d3.value;

      try {
        external_vm_default().runInNewContext(handleStringValue, {
          console,
          Error,
          oldRow,
          newRow
        });
      } catch (error) {
        console.log(error);
      }

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
var __webpack_exports__ = (__webpack_exec__(6595));
module.exports = __webpack_exports__;

})();