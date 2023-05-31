/*
 * ABFieldTreeCore
 *
 * An ABFieldTree defines a select list field type.
 *
 */

import ABFieldSelectivity from "../../platform/dataFields/ABFieldSelectivity";

const ABFieldTreeDefaults = {
   key: "tree",
   // unique key to reference this specific DataField

   description:
      "Data tree allows you to build a hierarchical set of selectable data. (ex: Categories and sub-categories)",
   // description: what gets displayed in the Editor description.
   // NOTE: this will be displayed using a Label: L(description)

   icon: "sitemap",
   // font-awesome icon reference.  (without the 'fa-').  so 'sitemap'  to
   // reference 'fa-sitemap'

   isFilterable: false,
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

   menuName: "Data Tree",
   // menuName: what gets displayed in the Editor drop list
   // NOTE: this will be displayed using a Label: L(menuName)

   supportRequire: false,
   // {bool}
   // does this ABField support the Required setting?

   supportUnique: false,
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

   compatibleMysqlTypes: ["text", "mediumtext", "longtext"],
   // {array}
   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
};

const defaultValues = {
   options: [],
};

export default class ABFieldTreeCore extends ABFieldSelectivity {
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
            this.translate(opt, opt, ["text"]);
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
      const obj = super.toObj();

      // Un-translate options list
      if (obj.settings.options && obj.settings.options.length > 0) {
         obj.settings.options.forEach((opt) => {
            this.unTranslate(opt, opt, ["text"]);
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
}
