/*
 * ABFieldTreeCore
 *
 * An ABFieldTree defines a select list field type.
 *
 */

var ABFieldSelectivity = require("../../platform/dataFields/ABFieldSelectivity");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

var ABFieldTreeDefaults = {
   key: "tree", // unique key to reference this specific DataField

   icon: "sitemap", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   // menuName: what gets displayed in the Editor drop list
   menuName: L("ab.dataField.tree.menuName", "*Data Tree"),

   // description: what gets displayed in the Editor description.
   description: L(
      "ab.dataField.tree.description",
      "*Data tree allows you to build a hierarchical set of selectable data. (ex: Categories and sub-categories)"
   ),
   isSortable: false,
   isFilterable: false,
   useAsLabel: false,

   supportRequire: false,

   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
   compatibleOrmTypes: []
};

var defaultValues = {
   options: []
};

module.exports = class ABFieldTreeCore extends ABFieldSelectivity {
   constructor(values, object) {
      super(values, object, ABFieldTreeDefaults);
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldTreeDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      // translate options list
      if (this.settings.options && this.settings.options.length > 0) {
         this.settings.options.forEach((opt) => {
            this.object.application.translate(opt, opt, ["text"]);
         });
      }
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
      var obj = super.toObj();

      // Un-translate options list
      if (obj.settings.options && obj.settings.options.length > 0) {
         obj.settings.options.forEach((opt) => {
            this.object.application.unTranslate(opt, opt, ["text"]);
         });
      }

      return obj;
   }

   ///
   /// Working with Actual Object Values:
   ///

   /**
    * @method defaultValue
    * insert a key=>value pair that represent the default value
    * for this field.
    * @param {obj} values a key=>value hash of the current values.
    */
   defaultValue(values) {}

   /**
    * @method isValidData
    * Parse through the given data and return an error if this field's
    * data seems invalid.
    * @param {obj} data  a key=>value hash of the inputs to parse.
    * @param {OPValidator} validator  provided Validator fn
    * @return {array}
    */
   isValidData(data, validator) {
      super.isValidData(data, validator);
   }
};
