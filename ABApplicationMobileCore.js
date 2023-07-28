/**
 * ABApplicationMobileCore
 *
 * This is the core ABApplicationMobile class that manages the common operations
 * of a Mobile PWA ABApplication.
 */

// webpack can handle 'require()' statements, but node can't handle import
// so let's use require():
const ABViewManagerMobile = require("../platform/ABViewManager");
var ABApplication = require("../platform/ABApplication");

module.exports = class ABApplicationMobileCore extends ABApplication {
   constructor(attributes, AB) {
      super(attributes, AB);
      this.appType = "mobile"; // Just making sure.
      this.networkType = attributes.networkType;
   }

   ///
   /// Static Methods
   ///
   /// Available to the Class level object.  These methods are not dependent
   /// on the instance values of the Application.
   ///

   ///
   /// Instance Methods
   ///

   get ViewManager() {
      return ABViewManagerMobile;
   }

   pageNew(def) {
      console.error("TODO: pageNew for ApplicationMobile");
      return null;
   }

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABApplication instance
    * into the values needed for saving to the DB.
    *
    * Most of the instance data is stored in .json field, so be sure to
    * update that from all the current values of our child fields.
    *
    * @return {json}
    */
   toObj() {
      var json = super.toObj();
      json.appType = "mobile";
      json.networkType = this.networkType;

      return json;
   }
};
