/*
 * ABFieldCombine
 *
 * An ABFieldCombine defines a combined field type.
 *
 */

const ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

const ABFieldCombinedDefaults = {
   key: "combined",
   // unique key to reference this specific DataField

   description: "Combined Value",
   // description: what gets displayed in the Editor description.
   // NOTE: this will be displayed using a Label: L(description)

   icon: "key",
   // font-awesome icon reference.  (without the 'fa-').  so 'key'  to
   // reference 'fa-key'

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

   menuName: "Combined Field",
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

// defaultValues: the keys must match a .name of your elements to set it's default value.
const defaultValues = {
   combinedFields: "",
   // {string} "field's uuid1, field's uuid2, field's uuid3, ..."
   // This tells us what fields will be combined.
   // if we don't have this, the old value which we filled out won't be cleared when we do "Add field" this type again.

   delimiter: "plus", // plus, space, dash, period
};

module.exports = class ABFieldCombineCore extends ABField {
   constructor(values, object) {
      super(values, object, ABFieldCombinedDefaults);
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldCombinedDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

   fromValues(values) {
      super.fromValues(values);

      this.settings.delimiter =
         values.settings.delimiter || defaultValues.delimiter;
   }

   /**
    * @method defaultValue
    * insert a key=>value pair that represent the default value
    * for this field.
    * @param {obj} values a key=>value hash of the current values.
    */
   defaultValue(values) {
      // Remove every values, then we will use AUTO_INCREMENT of MySQL
      delete values[this.columnName];
   }
};
