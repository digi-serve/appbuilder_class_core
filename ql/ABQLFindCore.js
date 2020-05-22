/*
 * ABQLFindCore
 *
 * An ABQLFind depends on a BASE QL object (Object, Datacollection, Query)
 * and can perform a DB query based upon that BASE object.
 *
 */

const ABQL = require("../../platform/ql/ABQL.js");
const NextQLOps = require("./ABQLSet.js");

var ParameterDefinitions = [
   {
      type: "objectConditions",
      name: "cond"
   }
];

class ABQLFindCore extends ABQL {
   constructor(attributes, prevOP, task, application) {
      super(attributes, ParameterDefinitions, prevOP, task, application);
   }

   ///
   /// Instance Methods
   ///
}

ABQLFindCore.key = "find";
ABQLFindCore.label = "find";
ABQLFindCore.NextQLOps = NextQLOps;

module.exports = ABQLFindCore;
