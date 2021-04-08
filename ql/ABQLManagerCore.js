/*
 * ABQLManagerCore
 *
 * An interface for managing the different ABQL Operations available in our
 * AppBuilder.
 *
 */

const QLObject = require("../../platform/ql/ABQLRootObject.js");
var QLOps = [QLObject];

var ABQLManagerCore = {
   /**
    * @method fromAttributes()
    * return an {ABQL} object that represents the given attributes that
    * were saved from the previous .toObj()
    * @param {object} attributes
    *		  the values returned from the previous .toObj() call
    * @param {ABProcessTask} task
    *		  the current ABProcessTaskServiceQuery that contains this QL
    * @param {ABApplication} application
    *		  the current ABApplication we are operating under.
    * @return {ABQL} | null
    */
   fromAttributes: function(attributes, task, application) {
      if (!attributes) {
         return null;
      }
      var matchingOPs = [];
      ABQLManagerCore.QLOps.forEach((Op) => {
         if (Op.key == attributes.key) {
            matchingOPs.push(Op);
         }
      });
      if (matchingOPs.length == 1) {
         // let this Operation initialize and return the last OP
         // in the chain
         var qlOP = new matchingOPs[0](attributes, task, application);
         return qlOP;
      } else {
         return null;
      }
   },

   /**
    * @array QLOps
    * An array of the root QL Operations.
    */
   QLOps: QLOps
};
module.exports = ABQLManagerCore;
