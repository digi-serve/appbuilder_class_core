/*
 * ABFieldJson
 *
 * An ABFieldJson defines a JSON field type.
 *
 */

const ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

const ABFieldJsonDefaults = {
   key: "json", // unique key to reference this specific DataField
   icon: "font", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   // menuName: what gets displayed in the Editor drop list
   menuName: L("ab.dataField.json.menuName", "*JSON"),

   // description: what gets displayed in the Editor description.
   description: L("ab.dataField.json.description", "*JSON value"),

   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
   compatibleOrmTypes: ["json"],

   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
   compatibleMysqlTypes: ["json"],
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
