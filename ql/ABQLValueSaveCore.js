/*
/*
 * ABQLRowValueCore
 *
 * An ABQLRowSave can store the current Data set into the Process Task it is
 * in, so that this data can be made available to other Process Tasks.
 *
 */

const ABQLSetSave = require("../../platform/ql/ABQLSetSave.js");

class ABQLValueSaveCore extends ABQLSetSave {
   ///
   /// Instance Methods
   ///

   fromAttributes(attributes) {
      super.fromAttributes(attributes);

      this.constructor.NextQLOps =
         this.prevOP.NextQLOps || this.prevOP.constructor.NextQLOps;
   }
}

ABQLValueSaveCore.key = "value_save";
ABQLValueSaveCore.label = "save";
ABQLValueSaveCore.NextQLOps = [];
// NOTE: currently, this is an ending step. but it doesn't have to be...

module.exports = ABQLValueSaveCore;

