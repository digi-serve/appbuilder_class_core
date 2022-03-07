/*
 * ABFieldAutoIndex
 *
 * An ABFieldAutoIndex defines a AutoIndex field type.
 *
 */

const ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

const ABFieldAutoIndexDefaults = {
   key: "AutoIndex",
   // unique key to reference this specific DataField

   description: "Auto Increment Value",
   // description: what gets displayed in the Editor description.
   // NOTE: this will be displayed using a Label: L(description)

   icon: "key",
   // font-awesome icon reference.  (without the 'fa-').  so 'key'  to
   // reference 'fa-key'

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

   menuName: "Auto Index",
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

   compatibleMysqlTypes: ["char", "varchar", "tinytext"],
   // {array}
   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
};

// defaultValues: the keys must match a .name of your elements to set it's default value.
const defaultValues = {
   prefix: "",
   delimiter: "none",
   displayLength: 4,
   previewText: "0000",
};

module.exports = class ABFieldAutoIndexCore extends ABField {
   constructor(values, object) {
      super(values, object, ABFieldAutoIndexDefaults);
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldAutoIndexDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

   static getDelimiterSign(text) {
      const delimiterItem = this.delimiterList().filter((item) => {
         return item.id == text;
      })[0];

      return delimiterItem ? delimiterItem.sign : "";
   }

   static delimiterList() {
      return [
         { id: "none", value: L("None"), sign: "" },
         { id: "comma", value: L("Comma"), sign: ", " },
         { id: "slash", value: L("Slash"), sign: "/" },
         { id: "space", value: L("Space"), sign: " " },
         { id: "dash", value: L("Dash"), sign: "-" },
         { id: "colon", value: L("Colon"), sign: ":" },
      ];
   }

   static setValueToIndex(prefix, delimiter, displayLength, displayNumber) {
      const resultIndex =
         prefix +
         this.getDelimiterSign(delimiter) +
         ("0000000000" + displayNumber).slice(-parseInt(displayLength));

      return resultIndex;
   }

   fromValues(values) {
      super.fromValues(values);

      // text to Int:
      this.settings.displayLength = parseInt(this.settings.displayLength);
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

   format(rowData) {
      if (!rowData[this.columnName]) return "";

      try {
         const resultAutoIndex = this.constructor.setValueToIndex(
            this.settings.prefix,
            this.settings.delimiter,
            this.settings.displayLength,
            rowData[this.columnName]
         );

         return resultAutoIndex;
      } catch (err) {
         return "";
      }
   }
};
