/*
/*
 * ABQLSetPluckCore
 *
 * An ABQLSetPluck can process a set (array) of data and puck out a specified
 * field to then make an array of values that only contain that field.
 *
 */

import ABQL from "../../platform/ql/ABQL.js";
// const ABQLSet = require("./ABQLSet.js");

const ParameterDefinitions = [
   {
      type: "objectFields",
      name: "fieldID",
   },
];

class ABQLSetPluckCore extends ABQL {
   constructor(attributes, prevOP, task, AB) {
      super(attributes, ParameterDefinitions, prevOP, task, AB);
   }

   ///
   /// Instance Methods
   ///

   fromAttributes(attributes) {
      // #Hack! : when an Operation provides the same .NextQlOps that it
      // was defined in, we can't require it again ==> circular dependency.
      // so we manually set it here from the operation that created us:
      this.constructor.NextQLOps = this.prevOP.constructor.NextQLOps;

      // we need to gather our .field and .objectOut before we
      // allow our base class to continue forward:

      this.fieldID = attributes.fieldID;
      this.field = this.object?.fieldByID(this.fieldID);

      //// TODO: figure out how to dynamically update the next row of options
      //// based upon the current choice of field.
      // // based upon the type of field, we now configure what next steps
      // // are available.
      // if (this.field) {
      //    // if connected, then we can stay with same .NextQLOps
      //    // so we can just leave what we did above.

      //    // if a discreet value, then we need to remove SetPluck
      //    if (!this.field.isConnection) {
      //       this.constructor.NextQLOps = [
      //          ...this.prevOP.constructor.NextQLOps,
      //       ].filter((o) => o.key != this.constructor.key);
      //    }
      // }

      if (attributes.objectOutID)
         this.objectOut = this.objectLookup(attributes.objectOutID);

      super.fromAttributes(attributes);
   }

   toObj() {
      const obj = super.toObj();

      if (this.fieldID) {
         obj.fieldID = this.fieldID;

         if (this.objectOut) obj.objectOutID = this.objectOut.id;
      } else {
         obj.fieldID = this.params.field || null;

         const field = this.object.fieldByID(obj.fieldID);

         if (field?.isConnection) obj.objectOutID = field.datasourceLink.id;
      }

      return obj;
   }
}

ABQLSetPluckCore.key = "set_pluck";
ABQLSetPluckCore.label = "Read the value from the field";
ABQLSetPluckCore.NextQLOps = [];

export default ABQLSetPluckCore;
