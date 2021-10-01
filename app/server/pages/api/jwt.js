(function() {
var exports = {};
exports.id = 4;
exports.ids = [4];
exports.modules = {

/***/ 1834:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";


var _jsonwebtoken = _interopRequireDefault(__webpack_require__(9722));

var _graphqlTag = _interopRequireDefault(__webpack_require__(9875));

var _remoteSchema = __webpack_require__(500);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const JWT_SECRET = process.env.JWT_SECRET;
const typeDefs = (0, _graphqlTag.default)`
  type Query {
    jwt(input: JWTInput): JWTOutput
  }
  input JWTInput {
    linkId: Int
    role: String
  }
  type JWTOutput {
    token: String
    linkId: Int
    role: String
  }
`;
const resolvers = {
  Query: {
    jwt: async (source, args, context, info) => {
      const {
        linkId,
        role
      } = args.input;

      const token = _jsonwebtoken.default.sign({
        "https://hasura.io/jwt/claims": {
          "x-hasura-allowed-roles": [role],
          "x-hasura-default-role": role,
          "x-hasura-user-id": linkId.toString()
        }
      }, JWT_SECRET);

      return {
        token,
        linkId,
        role: role
      };
    }
  }
};

const context = ({
  req
}) => {
  return {
    headers: req.headers
  };
};

module.exports = (0, _remoteSchema.generateRemoteSchema)({
  typeDefs,
  resolvers,
  context,
  path: '/api/jwt'
});

/***/ }),

/***/ 500:
/***/ (function(module) {

"use strict";
module.exports = require("@deepcase/hasura/remote-schema");;

/***/ }),

/***/ 9875:
/***/ (function(module) {

"use strict";
module.exports = require("graphql-tag");;

/***/ }),

/***/ 9722:
/***/ (function(module) {

"use strict";
module.exports = require("jsonwebtoken");;

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = function(moduleId) { return __webpack_require__(__webpack_require__.s = moduleId); }
var __webpack_exports__ = (__webpack_exec__(1834));
module.exports = __webpack_exports__;

})();