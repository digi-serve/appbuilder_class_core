/*
 * ABFieldCalculate
 *
 * An ABFieldCalculate defines a calculate field type.
 *
 */

const ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

/** Private methods */
function AGE(dateString) {
   // validate
   if (!dateString) return 0;
   const dataDate = new Date(dateString);
   if (!dataDate) return 0;

   const today = new Date();
   const oneYear = 31536000000; // (24 * 60 * 60 * 1000) * 365;
   const diffYears = (today - dataDate) / oneYear;

   if (diffYears < 1) return Math.round(diffYears * 10) / 10;
   // float 2 digits
   else return Math.floor(diffYears); // no float digit

   // const today = new Date();
   // const age = today.getFullYear() - dataDate.getFullYear();
   // if (age < 1) {
   // 	const m = today.getMonth() - dataDate.getMonth();

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
   const dataDate = new Date(dateString);
   if (!dataDate) return 0;

   return dataDate.getFullYear();
}

function MONTH(dateString) {
   // validate
   if (!dateString) return 0;
   const dataDate = new Date(dateString);
   if (!dataDate) return 0;

   // Start at 0
   return dataDate.getMonth();
}

function DAY(dateString) {
   // validate
   if (!dateString) return 0;
   const dataDate = new Date(dateString);
   if (!dataDate) return 0;

   return dataDate.getDate();
}

function DATE(dateString) {
   // validate
   if (!dateString) return 0;
   const dataDate = new Date(dateString);
   if (!dataDate) return 0;

   // number of miliseconds in one day
   const oneDay = 86400000; // 1000 * 60 * 60 * 24

   // Convert back to days and return
   return Math.round(dataDate.getTime() / oneDay);
}

function HOUR(dateString) {
   // validate
   if (!dateString) return 0;
   const dataDate = new Date(dateString);
   if (!dataDate) return 0;

   // number of miliseconds in one hour
   const oneHour = 3600000; // 1000 * 60 * 60

   // Convert back to days and return
   return Math.round(dataDate.getTime() / oneHour);
}

function MINUTE(dateString) {
   // validate
   if (!dateString) return 0;
   const dataDate = new Date(dateString);
   if (!dataDate) return 0;

   // number of miliseconds in one hour
   const oneMinute = 60000; // 1000 * 60

   // Convert back to days and return
   return Math.round(dataDate.getTime() / oneMinute);
}

function MINUTE_TO_HOUR(mins) {
   const hours = mins / 60;
   const rhours = Math.floor(hours);
   const minutes = (hours - rhours) * 60;
   const rminutes = Math.round(minutes);

   return parseFloat(`${rhours}.${rminutes}`);
}

const ABFieldCalculateDefaults = {
   key: "calculate",
   // unique key to reference this specific DataField

   description: "Perform a calculation based upon existing values",
   // description: what gets displayed in the Editor description.
   // NOTE: this will be displayed using a Label: L(description)

   icon: "calculator",
   // font-awesome icon reference.  (without the 'fa-').  so 'calculator'  to
   // reference 'fa-calculator'

   isFilterable: (field) => {
      const unsupportedInFilter = ["MINUTE_TO_HOUR", "DATE", "HOUR", "MINUTE"];
      const unsupported = unsupportedInFilter.filter((item) =>
         field.settings.formula.includes(item)
      );
      return unsupported.length == 0;
   },
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

   menuName: "Calculate",
   // menuName: what gets displayed in the Editor drop list
   // NOTE: this will be displayed using a Label: L(menuName)

   supportRequire: false,
   // {bool}
   // does this ABField support the Required setting?

   supportUnique: false,
   // {bool}
   // does this ABField support the Unique setting?

   useAsLabel: true,
   // {bool} / {fn}
   // determines if this ABField can be used in the display of an ABObject's
   // label.

   compatibleOrmTypes: ["number"],
   // {array}
   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options

   compatibleMysqlTypes: [
      "tinyint",
      "smallint",
      "mediumint",
      "int",
      "integer",
      "bigint",
      "decimal",
      "dec",
      "numeric",
      "fixed",
      "float",
      "real",
   ],
   // {array}
   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
};

const defaultValues = {
   formula: "",
   decimalSign: "none", // "none", "comma", "period", "space"
   decimalPlaces: 0, // 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
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
    * @param {string} alias [Optional]
    */
   static convertToJs(object, formula, rowData, place, alias = null) {
      if (!formula) return "";

      // replace with current date
      formula = formula.replace(/\(CURRENT\)/g, "(new Date())");

      object.fields().forEach((f) => {
         let colName = f.columnName;
         if (colName.indexOf(".") > -1)
            // QUERY: get only column name
            colName = colName.split(".")[1];

         // if template does not contain, then should skip
         if (formula.indexOf("{" + colName + "}") < 0) return;

         const data =
            rowData[`${object.alias ?? alias}.${f.columnName}`] ??
            rowData[f.columnName];

         // number fields
         if (f.key == "number") {
            const numberVal = `(${data || 0})`; // (number) - NOTE : (-5) to support negative number
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

            calVal = `(${calVal})`;

            formula = formula.replace(
               new RegExp("{" + colName + "}", "g"),
               calVal
            );
         }
         // date fields
         else if (f.key == "date") {
            const dateVal = `"${data || ""}"`; // "date"
            formula = formula.replace(
               new RegExp("{" + colName + "}", "g"),
               dateVal
            );
         }
         // boolean fields
         else if (f.key == "boolean") {
            const booleanVal = `(${data || 0})`; // show 1 or 0 for boolean
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
            place,
            this.alias
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

