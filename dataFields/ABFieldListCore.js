/*
 * ABFieldListCore
 *
 * An ABFieldList defines a select list field type.
 *
 */

// var ABFieldSelectivity = require("../../platform/dataFields/ABFieldSelectivity");
var ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

var ABFieldListDefaults = {
   key: "list", // unique key to reference this specific DataField

   icon: "th-list", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   // menuName: what gets displayed in the Editor drop list
   menuName: L("ab.dataField.list.menuName", "*Select list"),

   // description: what gets displayed in the Editor description.
   description: L(
      "ab.dataField.list.description",
      "*Select list allows you to select predefined options below from a dropdown."
   ),
   isSortable: (field) => {
      if (field.settings.isMultiple) {
         return false;
      } else {
         return true;
      }
   },
   isFilterable: (field) => {
      if (field.settings.isMultiple) {
         return false;
      } else {
         return true;
      }
   },
   hasColors: (field) => {
      if (field.settings.hasColors) {
         return true;
      } else {
         return false;
      }
   },

   supportRequire: true,

   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
   compatibleOrmTypes: []
};

var defaultValues = {
   isMultiple: 0,
   hasColors: 0,
   options: [],
   default: "none",
   multipleDefault: []
};

module.exports = class ABFieldListCore extends ABField {
   constructor(values, object) {
      super(values, object, ABFieldListDefaults);

      this.pendingDeletions = [];
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldListDefaults;
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
            this.object.translate(opt, opt, ["text"]);
         });
      }

      this.settings.isMultiple = parseInt(this.settings.isMultiple);
      this.settings.hasColors = parseInt(this.settings.hasColors);
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
      obj.settings.options.forEach((opt) => {
         this.object.unTranslate(opt, opt, ["text"]);
      });

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
   defaultValue(values) {
      // Multiple select list
      if (this.settings.isMultiple == true) {
         values[this.columnName] = this.settings.multipleDefault || [];
      }
      // Single select list
      else if (this.settings.default && this.settings.default != "") {
         values[this.columnName] = this.settings.default;
      }
   }

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

   /**
    * @method options
    * Return an array of [{ id, text }] options defined by this field.
    * @return {array}
    */
   options() {
      return this.settings.options.map((opt) => {
         return { id: opt.id, text: opt.text };
      });
   }

   format(rowData, options = {}) {
      var val = this.dataValue(rowData) || [];

      if (typeof val == "string") {
         try {
            val = JSON.parse(val);
         } catch (e) {}
      }

      // Convert to array
      if (!Array.isArray(val)) val = [val];

      var displayOpts = this.settings.options
         .filter((opt) => val.filter((v) => (v.id || v) == opt.id).length > 0)
         .map((opt) => {
            let text = opt.text;
            let languageCode = options.languageCode || "en";

            // Pull text of option with specify language code
            let optTran = (opt.translations || []).filter(
               (o) => o.language_code == languageCode
            )[0];
            if (optTran) text = optTran.text;

            return text;
         });

      return displayOpts.join(", ");
   }
};

