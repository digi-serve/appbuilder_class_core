/*
/*
 * ABQLRowPluckCore
 *
 * An ABQLRowPluckCore can process a value of data and puck out a specified
 * field to then make an object of values that only contain that field.
 *
 */

// const ABQLValue = require("./ABQLValue.js");
// const ABQLSet = require("./ABQLSet.js");
// import ABQLSet from "./ABQLSet";
import ABQLSetPluck from "../../platform/ql/ABQLSetPluck.js";
import ABQLRowUpdate from "../../platform/ql/ABQLRowUpdate.js";
import ABQLRowSave from "../../platform/ql/ABQLRowSave.js";

class ABQLRowPluckCore extends ABQLSetPluck {
   // Dynamic NextQLOps
   get NextQLOps() {
      let nextQLOps = [];

      const field = this.field ?? this.object.fieldByID(this.fieldID) ?? null;

      // Update .NextQLOps WARN: update to static it affects to every ABQLRowPluck instances.
      switch (field?.key) {
         // M:1 M:N connect field, then set ABQLSet to next steps
         case "connectObject":
            if (field.settings.linkType === "many") {
               // NOTE: Could not require("./ABQLSet.js") on the top. It returns an empty object. Why ><
               const ABQLSet = require("./ABQLSet.js");

               nextQLOps = ABQLSet;

               break;
            }

            // return ABQLRow.js
            nextQLOps = this.prevOP.constructor.NextQLOps.filter(
               (NextQLOp) =>
                  NextQLOp.key === this.constructor.key ||
                  NextQLOp.key === ABQLRowUpdate.key
            );

            break;

         case "user":
            // TODO set this up corectlys
            if (
               field.settings.linkType === "many" ||
               field.settings.isMultiple // may be unnessicary
            ) {
               // NOTE: Could not require("./ABQLSet.js") on the top. It returns an empty object. Why ><
               const ABQLSet = require("./ABQLSet.js");

               nextQLOps = ABQLSet;

               break;
            }

            // default
            nextQLOps = this.prevOP.constructor.NextQLOps.filter(
               (NextQLOp) =>
                  NextQLOp.key === this.constructor.key ||
                  NextQLOp.key === ABQLRowUpdate.key
            );

            break;

         default:
            // Normal field and _PK
            nextQLOps = this.prevOP.constructor.NextQLOps.filter(
               (NextQLOp) => NextQLOp.key === ABQLRowSave.key
            );

            break;
      }

      return nextQLOps;
   }
}

ABQLRowPluckCore.key = "row_pluck";
ABQLRowPluckCore.label = "Read the value from the field";
ABQLRowPluckCore.NextQLOps = []; // Static NextQLOps

export default ABQLRowPluckCore;
