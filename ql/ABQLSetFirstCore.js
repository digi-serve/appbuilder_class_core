/*
/*
 * ABQLSetFirstCore
 *
 * An ABQLFind depends on a BASE QL object (Object, Datacollection, Query)
 * and can perform a DB query based upon that BASE object.
 *
 */

const ABQL = require("../../platform/ql/ABQL.js");
const ABQLRow = require("./ABQLRow.js");

class ABQLSetFirstCore extends ABQL {
   constructor(attributes, prevOP, task, application) {
      super(attributes, [], prevOP, task, application);
   }

   ///
   /// Instance Methods
   ///
}

ABQLSetFirstCore.key = "first";
ABQLSetFirstCore.label = "first";
ABQLSetFirstCore.NextQLOps = ABQLRow;

module.exports = ABQLSetFirstCore;
