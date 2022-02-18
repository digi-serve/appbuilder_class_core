/*
 * ABFieldFormula
 *
 * An ABFieldFormula are used to run calculations on connected (child) records
 * and store the total of that calculation in the parent.
 *
 */

import ABField from "../../platform/dataFields/ABField";
import RowFilter from "../../platform/RowFilter";

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
   compatibleMysqlTypes: [],
};

var defaultValues = {
   field: "", // id of ABField : NOTE - store our connect field to support when there are multi - linked columns
   objectLink: "", // id of ABObject
   fieldLink: "", // id of ABField
   type: "sum", // "sum", "average", "max", "min", "count"
   where: "",
};

export default class ABFieldFormulaCore extends ABField {
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

   static rowFilter(App, idBase, AB) {
      return new RowFilter(App, idBase, AB);
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
   format(rowData, reCalculate = false) {
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
      if (rowData[this.columnName] != null && !reCalculate) {
         // reformat data
         return reformat(rowData[this.columnName]);
      }

      if (!fieldLink) return 0;

      var fieldBase = this.fieldBase();
      if (!fieldBase) return 0;

      var data = rowData[fieldBase.relationName()] || [];
      if (!Array.isArray(data)) data = [data];

      // Filter
      if (
         data &&
         data.length &&
         this.settings &&
         this.settings.where &&
         this.settings.where.rules &&
         this.settings.where.rules.length
      ) {
         this.filterHelper.setValue(this.settings.where);
         data = data.filter((item) => this.filterHelper.isValid(item));
      }

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

      // get the decimal size of the numbers being calculated
      var decimalSize = fieldLink.getDecimalSize();

      // calculate
      switch (this.settings.type) {
         case "sum":
            if (numberList.length > 0) {
               // get power of 10 to the number of decimal places this number
               // is formated to require
               var multiplier = Math.pow(10, decimalSize);
               // multiply values by muliplyier and add them to pervious value
               // because in javascript adding number with decimals can cause issues
               // ex: 9.11 + 222.11 = 231.22000000000003
               var sum = 0;
               numberList.forEach((val) => {
                  sum += val * multiplier || 0;
               });
               // divide result by multiplier to get actual value
               result = sum / multiplier;
            }
            break;

         case "average":
            if (numberList.length > 0) {
               // get power of 10 to the number of decimal places this number
               // is formated to require
               const multiplier = Math.pow(10, decimalSize);
               // multiply values by muliplyier and add them to pervious value
               // because in javascript adding number with decimals can cause issues
               // ex: 9.11 + 222.11 = 231.22000000000003
               let sum = 0;
               numberList.forEach((val) => {
                  sum += val * multiplier || 0;
               });
               // divide result by multiplier to get actual value
               // and divide by length to get the average
               result = sum / multiplier / numberList.length;
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

      rowData[this.columnName] = result;

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
      var obj = this.object.AB.objects(
         (obj) => obj.id == this.settings.object
      )[0];
      if (!obj) return null;

      var field = obj.fields((f) => f.id == this.settings.fieldLink)[0];
      if (!field) return null;

      return field;
   }

   get filterHelper() {
      if (this._rowFilter == null) {
         this._rowFilter = new RowFilter();

         this._rowFilter.applicationLoad(this.object.application);

         if (this.fieldLink && this.fieldLink.object) {
            this._rowFilter.fieldsLoad(this.fieldLink.object.fields());
            this._rowFilter.setValue(this.settings.where);
         }
      }

      return this._rowFilter;
   }
}
