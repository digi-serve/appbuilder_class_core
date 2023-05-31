/*
 * ABQLRowUpdateCore
 *
 * An ABQLRow Update allows you to update the values on the current
 * Row of data.
 *
 */

import ABQL from "../../platform/ql/ABQL.js";
// const ABQLRow = require("./ABQLRow.js");

const ParameterDefinitions = [
   {
      type: "objectValues",
      name: "values",
   },
];

class ABQLRowUpdateCore extends ABQL {
   constructor(attributes, prevOP, task, AB) {
      super(attributes, ParameterDefinitions, prevOP, task, AB);

      // #Hack! : when an Operation provides the same .NextQlOps that it
      // was defined in, we can't require it again ==> circular dependency.
      // so we manually set it here from the operation that created us:
      this.constructor.NextQLOps = prevOP.constructor.NextQLOps;
   }

   ///
   /// Instance Methods
   ///
}

ABQLRowUpdateCore.key = "update";
ABQLRowUpdateCore.label = "Update this record";
ABQLRowUpdateCore.NextQLOps = [];
// NOTE: .NextQLOps => see the #Hack in the constructor

export default ABQLRowUpdateCore;
