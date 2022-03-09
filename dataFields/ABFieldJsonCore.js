/*
 * ABFieldJson
 *
 * An ABFieldJson defines a JSON field type.
 *
 */

const ABField = require("../../platform/dataFields/ABField");

const ABFieldJsonDefaults = {
   key: "json",
   // unique key to reference this specific DataField

   description: "JSON value",
   // description: what gets displayed in the Editor description.
   // NOTE: this will be displayed using a Label: L(description)

   icon: "font",
   // font-awesome icon reference.  (without the 'fa-').  so 'font'  to
   // reference 'fa-font'

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

   menuName: "JSON",
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

   compatibleOrmTypes: ["json"],
   // {array}
   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options

   compatibleMysqlTypes: ["json"],
   // {array}
   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
};

const defaultValues = {};

module.exports = class ABFieldJsonCore extends ABField {
   constructor(values, object) {
      super(values, object, ABFieldJsonDefaults);
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldJsonDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

   /**
    * @method defaultValue
    * insert a key=>value pair that represent the default value
    * for this field.
    * @param {obj} values a key=>value hash of the current values.
    */
   defaultValue(values) {
      // in the case of a JSON data type, we should NOT insert a ""
      //
      // values[this.columnName] = "";
   }
};
