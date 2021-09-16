/*
 * ABFieldCalculate
 *
 * An ABFieldCalculate defines a calculate field type.
 *
 */

var ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   return altText; // AD.lang.label.getLabel(key) || altText;
}

/** Private methods */
function AGE(dateString) {
   // validate
   if (!dateString) return 0;
   var dataDate = new Date(dateString);
   if (!dataDate) return 0;

   var today = new Date();
   var oneYear = 31536000000; // (24 * 60 * 60 * 1000) * 365;
   var diffYears = (today - dataDate) / oneYear;

   if (diffYears < 1) return Math.round(diffYears * 10) / 10;
   // float 2 digits
   else return Math.floor(diffYears); // no float digit

   // var today = new Date();
   // var age = today.getFullYear() - dataDate.getFullYear();
   // if (age < 1) {
   // 	var m = today.getMonth() - dataDate.getMonth();

   // 	age = parseFloat("0." + m);

   // 	// if (m < 0 || (m === 0 && today.getDate() < dataDate.getDate())) {
   // 	// 	age--;
   // 	// }
   // }
   // return age;
}

function YEAR(dateString) {
   // validate
   if (!dateString) return 0;
   var dataDate = new Date(dateString);
   if (!dataDate) return 0;

   return dataDate.getFullYear();
}

function MONTH(dateString) {
   // validate
   if (!dateString) return 0;
   var dataDate = new Date(dateString);
   if (!dataDate) return 0;

   // Start at 0
   return dataDate.getMonth();
}

function DAY(dateString) {
   // validate
   if (!dateString) return 0;
   var dataDate = new Date(dateString);
   if (!dataDate) return 0;

   return dataDate.getDate();
}

function DATE(dateString) {
   // validate
   if (!dateString) return 0;
   let dataDate = new Date(dateString);
   if (!dataDate) return 0;

   // number of miliseconds in one day
   let oneDay = 86400000; // 1000 * 60 * 60 * 24

   // Convert back to days and return
   return Math.round(dataDate.getTime() / oneDay);
}

function HOUR(dateString) {
   // validate
   if (!dateString) return 0;
   let dataDate = new Date(dateString);
   if (!dataDate) return 0;

   // number of miliseconds in one hour
   let oneHour = 3600000; // 1000 * 60 * 60

   // Convert back to days and return
   return Math.round(dataDate.getTime() / oneHour);
}

function MINUTE(dateString) {
   // validate
   if (!dateString) return 0;
   let dataDate = new Date(dateString);
   if (!dataDate) return 0;

   // number of miliseconds in one hour
   let oneMinute = 60000; // 1000 * 60

   // Convert back to days and return
   return Math.round(dataDate.getTime() / oneMinute);
}

function MINUTE_TO_HOUR(mins) {
   var hours = mins / 60;
   var rhours = Math.floor(hours);
   var minutes = (hours - rhours) * 60;
   var rminutes = Math.round(minutes);

   return parseFloat(`${rhours}.${rminutes}`);
}

var ABFieldCalculateDefaults = {
   key: "calculate", // unique key to reference this specific DataField

   icon: "calculator", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   // menuName: what gets displayed in the Editor drop list
   menuName: L("ab.dataField.calculate.menuName", "*Calculate"),

   // description: what gets displayed in the Editor description.
   description: L("ab.dataField.calculate.description", "*"),

   isSortable: false,
   isFilterable: false, // this field does not support filter on server side

   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
   compatibleOrmTypes: [],

   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
   compatibleMysqlTypes: []
};

var defaultValues = {
   formula: "",
   decimalSign: "none", // "none", "comma", "period", "space"
   decimalPlaces: "none" // "none", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
};

module.exports = class ABFieldCalculateCore extends ABField {
   constructor(values, object) {
      super(values, object, ABFieldCalculateDefaults);
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldCalculateDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

   /**
    * @method convertToJs
    *
    * @param {ABOBject} object
    * @param {string} formula
    * @param {object} rowData
    * @param {integer} place
    */
   static convertToJs(object, formula, rowData, place) {
      if (!formula) return "";

      // replace with current date
      formula = formula.replace(/\(CURRENT\)/g, "(new Date())");

      object.fields().forEach((f) => {
         var colName = f.columnName;
         if (colName.indexOf(".") > -1)
            // QUERY: get only column name
            colName = colName.split(".")[1];

         // if template does not contain, then should skip
         if (formula.indexOf("{" + colName + "}") < 0) return;

         let data =
            rowData[`${object.alias}.${f.columnName}`] || rowData[f.columnName];

         // number fields
         if (f.key == "number") {
            let numberVal = "(#numberVal#)".replace("#numberVal#", data || 0); // (number) - NOTE : (-5) to support negative number
            formula = formula.replace(
               new RegExp("{" + colName + "}", "g"),
               numberVal
            );
         }
         // calculate and formula fields
         else if (f.key == "calculate" || f.key == "formula") {
            let calVal = f.format(rowData) || 0;

            // pull number only
            if (typeof calVal == "string")
               calVal = calVal.replace(/[^-0-9.]/g, "");

            calVal = "(#calVal#)".replace("#calVal#", calVal);

            formula = formula.replace(
               new RegExp("{" + colName + "}", "g"),
               calVal
            );
         }
         // date fields
         else if (f.key == "date") {
            let dateVal = '"#dataVal#"'.replace("#dataVal#", data ? data : ""); // "date"
            formula = formula.replace(
               new RegExp("{" + colName + "}", "g"),
               dateVal
            );
         }
         // boolean fields
         else if (f.key == "boolean") {
            let booleanVal = "(#booleanVal#)".replace(
               "#booleanVal#",
               data || 0
            ); // show 1 or 0 for boolean
            formula = formula.replace(
               new RegExp("{" + colName + "}", "g"),
               booleanVal
            );
         }
      });

      // decimal places - toFixed()
      // FIX: floating number calculation
      // https://randomascii.wordpress.com/2012/02/25/comparing-floating-point-numbers-2012-edition/
      return eval(formula).toFixed(place || 0);
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

   format(rowData) {
      let place = 0;
      if (this.settings.decimalSign != "none") {
         place = this.settings.decimalPlaces;
      }

      try {
         let result = this.constructor.convertToJs(
            this.object,
            this.settings.formula,
            rowData,
            place
         );

         switch (this.settings.decimalSign) {
            case "comma":
               result = result.replace(".", ",");
               break;
            case "space":
               result = result.replace(".", " ");
               break;
         }

         return result;
      } catch (err) {
         return "";
      }
   }
};

