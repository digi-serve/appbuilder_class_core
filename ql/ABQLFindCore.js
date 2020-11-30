/*
 * ABQLFindCore
 *
 * An ABQLFind depends on a BASE QL object (Object, Datacollection, Query)
 * and can perform a DB query based upon that BASE object.
 *
 */

const ABQL = require("../../platform/ql/ABQL.js");
const NextQLOps = require("./ABQLSet.js");
// {array} of {ABQLxxx} options
// this is an array of what possible next Operations can come after an
// ABQLFind task is complete.  In this case the {ABQLSet} operations come
// next.  {ABQLSet} operations work on a Set|{Array} or data results.

var ParameterDefinitions = [
   {
      type: "objectConditions",
      name: "cond",
   },
];

class ABQLFindCore extends ABQL {
   constructor(attributes, prevOP, task, AB) {
      super(attributes, ParameterDefinitions, prevOP, task, AB);
   }

   ///
   /// Instance Methods
   ///
}

ABQLFindCore.key = "find";
ABQLFindCore.label = "find";
ABQLFindCore.NextQLOps = NextQLOps;

module.exports = ABQLFindCore;
