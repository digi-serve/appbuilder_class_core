// import ABApplication from "./ABApplication"

var ABMLClass = require("../platform/ABMLClass");
const _concat = require("lodash/concat");

module.exports = class ABProcessCore extends ABMLClass {
   constructor(attributes, AB) {
      super(["label"], AB);

      this.fromValues(attributes);

      // indicate we are ready.
      // this.elements().forEach((e) => {
      //    e.onProcessReady();
      // });
   }

   ///
   /// Static Methods
   ///
   /// Available to the Class level object.  These methods are not dependent
   /// on the instance values of the Application.
   ///

   fromValues(attributes) {
      /*
    {
      id: uuid(),
      name: 'name',
      type: 'xxxxx',
      json: "{json}"
    }
    */
      this.id = attributes.id;
      this.name = attributes.name || "";
      this.type = attributes.type || "process";
      // this.xmlDefinition = attributes.xmlDefinition || null;

      this.json = attributes.json || null;

      super.fromValues(attributes); // perform translation on this object.
      // NOTE: keep this at the end of .fromValues();

      if (!this.label) {
         this.label = this.name;
      }
   }

   /**
    * @method toObj()
    * properly compile the current state of this ABProcess instance
    * into the values needed for saving to the DB.
    * @return {json}
    */
   toObj() {
      // default label value
      if (!this.label) {
         this.label = this.name;
      }

      // OP.Multilingual.unTranslate(this, this, ["label"]);
      var data = super.toObj();

      var fieldsToSave = ["id", "name", "json"];
      fieldsToSave.forEach((f) => {
         data[f] = this[f];
      });

      return data;
   }
};
