/*
 * ABQLRootObjectCore
 *
 * An ABQL defines a Query Language Operation. A QL Operation
 * is intended to be evaluated at run time and return a value that can be
 * assigned to form value or an object.
 *
 *
 */
import ABQL from "../../platform/ql/ABQL.js";

// Define the Operations that can be performed off of a RootObject.
// Each Root Object might have a different set of Operations, so we
// define them here.
import QLFind from "../../platform/ql/ABQLFind.js";
const NextQLOps = [QLFind];

const ParameterDefinitions = [
   {
      type: "objectName",
      name: "name",
   },
];

class ABQLObjectCore extends ABQL {
   constructor(attributes, task, AB) {
      // NOTE: keep this so we can insert the prevOp == null
      super(attributes, ParameterDefinitions, null, task, AB);
   }

   ///
   /// Instance Methods
   ///
   initObject(attributes) {
      if (!this.object && this.params) {
         const objNameDef = this.parameterDefinitions.find((pDef) => {
            return pDef.type === "objectName";
         });

         if (objNameDef) {
            this.objectID = this.params[objNameDef.name];
            this.object = this.objectLookup(this.objectID);
         }

         if (!this.object) {
            this.warningMessage("has no object set.", {
               objectID: this.objectID,
            });
         }
      }
   }

   toObj() {
      const obj = super.toObj();

      // if we don't have an objectID, but we have an objectName parameter
      // definition then save that as our objectID
      if (!obj.objectID && this.params) {
         const objNameDef = this.parameterDefinitions.find((pDef) => {
            return pDef.type === "objectName";
         });

         if (objNameDef) obj.objectID = this.params[objNameDef.name];
      }

      return obj;
   }
}

ABQLObjectCore.key = "object";
ABQLObjectCore.label = "object";
ABQLObjectCore.NextQLOps = NextQLOps;

export default ABQLObjectCore;
