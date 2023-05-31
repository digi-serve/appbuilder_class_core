/*
/*
 * ABQLSetFirstCore
 *
 * An ABQLFind depends on a BASE QL object (Object, Datacollection, Query)
 * and can perform a DB query based upon that BASE object.
 *
 */

import ABQL from "../../platform/ql/ABQL.js";
import ABQLRow from "./ABQLRow.js";
// {array} of {ABQLxxx} options
// this is an array of what possible next Operations can come after an
// ABQLSetFirst task is complete.  In this case the {ABQLRow} operations come
// next.  {ABQLRow} operations work on a single row of data.

class ABQLSetFirstCore extends ABQL {
   constructor(attributes, prevOP, task, AB) {
      super(attributes, [], prevOP, task, AB);
   }

   ///
   /// Instance Methods
   ///
}

ABQLSetFirstCore.key = "first";
ABQLSetFirstCore.label = "Select the first record";
ABQLSetFirstCore.NextQLOps = ABQLRow;

export default ABQLSetFirstCore;
