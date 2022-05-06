/*
/*
 * ABQLRowPluckCore
 *
 * An ABQLRowPluckCore can process a value of data and puck out a specified
 * field to then make an object of values that only contain that field.
 *
 */

const ABQLValue = require("./ABQLValue.js");
// const ABQLSet = require("./ABQLSet.js");
const ABQLSetPluck = require("../../platform/ql/ABQLSetPluck.js");

class ABQLRowPluckCore extends ABQLSetPluck {
   // Dynamic NextQLOps
   get NextQLOps() {
      let nextQLOps = [];
      let field = this.field;
      if (field == null) {
         field = this.object?.fields((f) => f.id == this.fieldID)[0];
      }

      // Update .NextQLOps WARN: update to static it affects to every ABQLRowPluck instances.
      if (field) {
         // M:1 M:N connect field, then set ABQLSet to next steps
         if (field.key == "connectObject") {
            if (field.settings.linkType == "many") {
               // NOTE: Could not require("./ABQLSet.js") on the top. It returns an empty object. Why ><
               const ABQLSet = require("./ABQLSet.js");
               nextQLOps = ABQLSet;
            } else {
               // return ABQLRow.js
               nextQLOps = this.prevOP.constructor.NextQLOps;
            }
         }
         // Normal field
         else {
            nextQLOps = ABQLValue;
         }
      } else if (this.fieldID == "_PK") {
         nextQLOps = ABQLValue;
      }

      return nextQLOps;
   }
}

ABQLRowPluckCore.key = "row_pluck";
ABQLRowPluckCore.label = "pluck";
ABQLRowPluckCore.NextQLOps = []; // Static NextQLOps

module.exports = ABQLRowPluckCore;
