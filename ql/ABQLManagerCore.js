/*
 * ABQLManagerCore
 *
 * An interface for managing the different ABQL Operations available in our
 * AppBuilder.
 *
 */

import QLObject from "../../platform/ql/ABQLRootObject.js";
const QLOps = [QLObject];

const ABQLManagerCore = {
   /**
    * @method fromAttributes()
    * return an {ABQL} object that represents the given attributes that
    * were saved from the previous .toObj()
    * @param {object} attributes
    *		  the values returned from the previous .toObj() call
    * @param {ABProcessTask***} task
    *		  the current ABProcessTaskServiceQuery that contains this QL
    * @param {ABFactory} AB
    *		  the current ABFactory we are operating under.
    * @return {ABQL} | null
    */
   fromAttributes: function (attributes, task, AB) {
      if (!attributes) return null;

      const matchingOPs = [];

      ABQLManagerCore.QLOps.forEach((Op) => {
         if (Op.key === attributes.key) matchingOPs.push(Op);
      });

      if (matchingOPs.length === 1) {
         // let this Operation initialize and return the last OP
         // in the chain
         const qlOP = new matchingOPs[0](attributes, task, AB);

         return qlOP;
      } else return null;
   },

   /**
    * @array QLOps
    * An array of the root QL Operations.
    */
   QLOps: QLOps,
};
export default ABQLManagerCore;
