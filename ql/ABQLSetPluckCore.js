/*
/*
 * ABQLSetPluckCore
 *
 * An ABQLSetPluck can process a set (array) of data and puck out a specified
 * field to then make an array of values that only contain that field.
 *
 */

const ABQL = require("../../platform/ql/ABQL.js");
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

      if (attributes.objectOutID) {
         this.objectOut = this.objectLookup(attributes.objectOutID);
      }

      super.fromAttributes(attributes);
   }

   toObj() {
      const obj = super.toObj();

      if (this.fieldID) {
         obj.fieldID = this.fieldID;
         if (this.objectOut) {
            obj.objectOutID = this.objectOut.id;
         }
      } else {
         obj.fieldID = this.params.field || null;
         const field = this.object.fieldByID(obj.fieldID);

         if (field?.isConnection) {
            obj.objectOutID = field.datasourceLink.id;
         }
      }
      return obj;
   }
}

ABQLSetPluckCore.key = "set_pluck";
ABQLSetPluckCore.label = "pluck";
ABQLSetPluckCore.NextQLOps = [];

module.exports = ABQLSetPluckCore;
