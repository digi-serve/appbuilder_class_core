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
   key: "list",
   // unique key to reference this specific DataField

   description:
      "Select list allows you to select predefined options below from a dropdown.",
   // description: what gets displayed in the Editor description.
   // NOTE: this will be displayed using a Label: L(description)

   icon: "th-list",
   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to
   // reference 'fa-user'

   isFilterable: (field) => {
      if (field.settings.isMultiple) {
         return false;
      } else {
         return true;
      }
   },
   // {bool} / {fn}
   // determines if the current ABField can be used to filter (FilterComplex
   // or Query) data.
   // if a {fn} is provided, it will be called with the ABField as a parameter:
   //  (field) => field.setting.something == true

   isSortable: (field) => {
      if (field.settings.isMultiple) {
         return false;
      } else {
         return true;
      }
   },
   // {bool} / {fn}
   // determines if the current ABField can be used to Sort data.
   // if a {fn} is provided, it will be called with the ABField as a parameter:
   //  (field) => true/false

   menuName: "Select list",
   // menuName: what gets displayed in the Editor drop list
   // NOTE: this will be displayed using a Label: L(menuName)

   supportRequire: true,
   // {bool}
   // does this ABField support the Required setting?

   supportUnique: false,
   // {bool}
   // does this ABField support the Unique setting?

   useAsLabel: false,
   // {bool} / {fn}
   // determines if this ABField can be used in the display of an ABObject's
   // label.

   compatibleOrmTypes: [],
   // {array}
   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options

   compatibleMysqlTypes: [
      "char",
      "varchar",
      "tinytext" /* "text", "mediumtext" */,
   ],
   // {array}
   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php

   hasColors: (field) => {
      if (field.settings.hasColors) {
         return true;
      } else {
         return false;
      }
   },
};

var defaultValues = {
   isMultiple: 0,
   // {bool}
   // can multiple values be selected?

   hasColors: 0,
   // {bool}
   // are we to display our values in colors?

   options: [],
   // {array}
   // The options defined for this list:
   // [ { id, text, hex, translations },...]
   //    .id {string} a unique id for this value
   //    .text {string} the displayed text of this value
   //    .hex {string} a color hex definition for this value
   //    .translations {obj} the multilingual definitions for this value.

   default: "none",
   multipleDefault: [],
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
            this.translate(opt, opt, ["text"]);
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
         this.unTranslate(opt, opt, ["text"]);
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
         let defaultVals = [];
         this.settings.multipleDefault.forEach((def) => {
            this.settings.options.forEach((opt) => {
               if (opt.id == def.text) {
                  defaultVals.push(opt);
               }
            });
         });
         values[this.columnName] = defaultVals || [];
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
         return {
            id: opt.id,
            text: opt.text,
            hex: opt.hex ? opt.hex : "",
            translations: opt.translations ? opt.translations : "",
         };
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
