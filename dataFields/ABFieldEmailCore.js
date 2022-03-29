/*
 * ABFieldEmail
 *
 * An ABFieldEmail defines a boolean field type.
 *
 */

const ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

const ABFieldEmailDefaults = {
   key: "email",
   // unique key to reference this specific DataField

   description: "Email fields are used to store email addresses.",
   // description: what gets displayed in the Editor description.
   // NOTE: this will be displayed using a Label: L(description)

   icon: "envelope",
   // font-awesome icon reference.  (without the 'fa-').  so 'envelope'  to
   // reference 'fa-envelope'

   isFilterable: true,
   // {bool} / {fn}
   // determines if the current ABField can be used to filter (FilterComplex
   // or Query) data.
   // if a {fn} is provided, it will be called with the ABField as a parameter:
   //  (field) => field.setting.something == true

   isSortable: false,
   // {bool} / {fn}
   // determines if the current ABField can be used to Sort data.
   // if a {fn} is provided, it will be called with the ABField as a parameter:
   //  (field) => true/false

   menuName: "Email",
   // menuName: what gets displayed in the Editor drop list
   // NOTE: this will be displayed using a Label: L(menuName)

   supportRequire: true,
   // {bool}
   // does this ABField support the Required setting?

   supportUnique: true,
   // {bool}
   // does this ABField support the Unique setting?

   useAsLabel: false,
   // {bool} / {fn}
   // determines if this ABField can be used in the display of an ABObject's
   // label.

   compatibleOrmTypes: ["string"],
   // {array}
   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options

   compatibleMysqlTypes: ["char", "varchar", "tinytext"],
   // {array}
   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
};

const defaultValues = {
   default: "",
   defaultCheckbox: 0,
};

module.exports = class ABFieldEmailCore extends ABField {
   constructor(values, object) {
      super(values, object, ABFieldEmailDefaults);
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldEmailDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

   ///
   /// Instance Methods
   ///

   fromValues(values) {
      super.fromValues(values);

      this.settings.default = values.settings.default || "";
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
      // if no default value is set, then don't insert a value.
      if (!values[this.columnName]) {
         // Set default string
         if (this.settings.default) {
            values[this.columnName] = this.settings.default;
         }
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
      if (data[this.columnName]) {
         const Reg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

         let value = data[this.columnName];
         value = String(value).toLowerCase();
         if (!Reg.test(value)) {
            validator.addError(this.columnName, "Invalid email");
         }
      }
   }
};
