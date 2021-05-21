/*
 * ABFieldFormula
 *
 * An ABFieldFormula are used to run calculations on connected (child) records
 * and store the total of that calculation in the parent.
 *
 */

var ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   return altText; // AD.lang.label.getLabel(key) || altText;
}

var ABFieldFormulaDefaults = {
   key: "formula", // unique key to reference this specific DataField

   icon: "circle-o-notch", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   // menuName: what gets displayed in the Editor drop list
   menuName: L("ab.dataField.formula.menuName", "*Formula"),

   // description: what gets displayed in the Editor description.
   description: L("ab.dataField.formula.description", "*"),

   isSortable: false,
   isFilterable: true,
   useAsLabel: false,

   supportQuery: (field) => {
      let fieldLink = field.fieldLink;
      if (fieldLink == null) return false;

      // Not support calculate field in query
      return fieldLink.key !== "calculate";
   },

   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
   compatibleOrmTypes: [],

   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
   compatibleMysqlTypes: []
};

var defaultValues = {
   field: "", // id of ABField : NOTE - store our connect field to support when there are multi - linked columns
   objectLink: "", // id of ABObject
   fieldLink: "", // id of ABField
   type: "sum", // "sum", "average", "max", "min", "count"
   where: ""
};

module.exports = class ABFieldFormulaCore extends ABField {
   constructor(values, object) {
      super(values, object, ABFieldFormulaDefaults);
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldFormulaDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method defaultValue
    * insert a key=>value pair that represent the default value
    * for this field.
    * @param {obj} values a key=>value hash of the current values.
    */
   defaultValue(values) {
      // this field is read only
      delete values[this.columnName];
   }

   /**
    * @method format
    * both calculate and format the data input based of user settings
    * for this field.
    * @param {obj} rowData
    *        a key=>value hash of the current values.
    * @param {boolean} reCalculate
    *        a boolean that signals if we should force recalculation of values
    */
   format(rowData) {
      var fieldLink = this.fieldLink;

      let reformat = (numData) => {
         // ABFieldCalculate does not need to .format again
         if (!fieldLink || fieldLink.key == "calculate") {
            return numData;
         } else {
            let rowDataFormat = {};
            rowDataFormat[fieldLink.columnName] = numData;
            return fieldLink.format(rowDataFormat);
         }
      };

      // if data exists, then will not calculate on client side
      // unless we pass reCalculate=true to force the recalculation
      // if (rowData[this.columnName] != null && !reCalculate) {
      //    // reformat data
      //    return reformat(rowData[this.columnName]);
      // }

      if (!fieldLink) return 0;

      var fieldBase = this.fieldBase();
      if (!fieldBase) return 0;

      var data = rowData[fieldBase.relationName()] || [];
      if (!Array.isArray(data)) data = [data];

      var numberList = [];

      // pull number from data
      switch (fieldLink.key) {
         case "calculate":
            data.forEach((d) => {
               numberList.push(parseFloat(fieldLink.format(d) || 0));
            });
            break;
         case "number":
            numberList = data.map((d) => d[fieldLink.columnName] || 0);
            break;
      }

      var result = 0;

      // calculate
      switch (this.settings.type) {
         case "sum":
            if (numberList.length > 0) {
               result = numberList.reduce((sum, val) => sum + (val || 0));
            }
            break;

         case "average":
            if (numberList.length > 0) {
               let sum = numberList.reduce((sum, val) => sum + (val || 0)); // sum
               result = sum / numberList.length;
            }
            break;

         case "max":
            result = Math.max(...numberList) || 0;
            break;
         case "min":
            result = Math.min(...numberList) || 0;
            break;
         case "count":
            result = numberList.length;
            break;
      }

      // ABFieldCalculate does not need to .format again
      if (fieldLink.key == "calculate") {
         return result;
      } else {
         return reformat(result);
      }
   }

   fieldBase() {
      return this.object.fields((f) => f.id == this.settings.field)[0];
   }

   get fieldLink() {
      var obj = this.object.application.objects(
         (obj) => obj.id == this.settings.object
      )[0];
      if (!obj) return null;

      var field = obj.fields((f) => f.id == this.settings.fieldLink)[0];
      if (!field) return null;

      return field;
   }
};
