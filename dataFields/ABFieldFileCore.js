/*
 * ABFieldFile
 *
 * An ABFieldFile defines a File field type.
 *
 */

var ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

var ABFieldFileDefaults = {
   key: "file", // unique key to reference this specific DataField
   // type : 'string', // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
   icon: "file", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   // menuName: what gets displayed in the Editor drop list
   menuName: L("ab.dataField.file.menuName", "*File Attachment"),

   // description: what gets displayed in the Editor description.
   description: L(
      "ab.dataField.file.description",
      "*Attach a File to this object."
   ),

   isSortable: false,
   isFilterable: false,
   useAsLabel: false,

   supportRequire: false,
};

var defaultValues = {
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

   dataValue(rowData) {
      let propName = "{objectName}.{columnName}"
         .replace("{objectName}", this.alias || this.object.name)
         .replace("{columnName}", this.columnName);

      let result = rowData[this.columnName] || rowData[propName] || {};
      if (typeof result == "string") {
         try {
            result = JSON.parse(result);
         } catch (err) {}
      }

      return result;
   }

   format(rowData) {
      let result = this.dataValue(rowData);
      if (result) {
         if (typeof result == "string") {
            try {
               result = JSON.parse(result);
            } catch (err) {}
         }

         // return file name
         return result ? result.filename || "" : "";
      } else {
         return "";
      }
   }
};
