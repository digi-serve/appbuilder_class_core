/*
 * ABFieldFile
 *
 * An ABFieldFile defines a File field type.
 *
 */

const ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

const ABFieldFileDefaults = {
   key: "file",
   // unique key to reference this specific DataField

   description: "Attach a File to this object.",
   // description: what gets displayed in the Editor description.
   // NOTE: this will be displayed using a Label: L(description)

   icon: "file",
   // font-awesome icon reference.  (without the 'fa-').  so 'file'  to
   // reference 'fa-file'

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

   menuName: "File Attachment",
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

const defaultValues = {
   removeExistingData: 0,
   fileSize: 0,
   fileType: "",
};

module.exports = class ABFieldFileCore extends ABField {
   constructor(values, object) {
      super(values, object, ABFieldFileDefaults);
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldFileDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

   ///
   /// Instance Methods
   ///

   fromValues(values) {
      super.fromValues(values);

      // text to Int:
      this.settings.fileSize = parseInt(this.settings.fileSize);
      this.settings.limitFileSize = parseInt(this.settings.limitFileSize);
      this.settings.limitFileType = parseInt(this.settings.limitFileType);
      this.settings.removeExistingData = parseInt(
         this.settings.removeExistingData
      );
   }

   /**
    * @method dataValue
    * return the file data stored as part of this field.
    *
    * An ABFieldFile column contains a json structure that contains
    *  .uuid : {string} a file uuid reference
    *  .filename : {string} the name of the file that was uploaded.
    *
    * This will return the json object.
    * @param {obj} values a key=>value hash of the current values.
    * @return {obj} { uuid, filename }, or {} if empty.
    */
   dataValue(rowData) {
      const propName = `${this.alias || this.object.name}.${this.columnName}`;

      let result = rowData[this.columnName] || rowData[propName] || {};
      if (typeof result == "string") {
         try {
            result = JSON.parse(result);
         } catch (err) {
            // ignore error
         }
      }

      return result;
   }

   /**
    * @method defaultValue
    * insert a key=>value pair that represent the default value
    * for this field.
    *
    * An ABFieldFile expects a json structure that contains
    *  .uuid : {string} a file uuid reference
    *  .filename : {string} the name of the file that was uploaded.
    *
    * For a default value, we return an empty json object: "{}"
    * @param {obj} values a key=>value hash of the current values.
    */
   defaultValue(values) {
      values[this.columnName] = "{}";
   }

   format(rowData) {
      let result = this.dataValue(rowData);
      if (result) {
         if (typeof result == "string") {
            try {
               result = JSON.parse(result);
            } catch (err) {
               // ignore error.
            }
         }

         // return file name
         return result ? result.filename || "" : "";
      } else {
         return "";
      }
   }

   /**
    * @method requestParam
    * return the entry in the given input that relates to this field.
    * @param {obj} allParameters  a key=>value hash of the inputs to parse.
    * @return {obj} or undefined
    */
   requestParam(allParameters) {
      const myParameter = super.requestParam(allParameters);

      // if we have our default empty object, then remove the entry
      // and let the DB insert a null value.
      let val = myParameter?.[this.columnName];
      if (val == "{}" || val == "") {
         delete myParameter[this.columnName];
      }
      if ("string" === typeof val) {
         try {
            myParameter[this.columnName] = JSON.parse(val);
         } catch (e) {}
      }

      return myParameter;
   }
};
