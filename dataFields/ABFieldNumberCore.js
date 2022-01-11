/*
 * ABFieldNumber
 *
 * An ABFieldNumber defines a Number field type.
 *
 */

var ABField = require("../../platform/dataFields/ABField");

var ABFieldNumberDefaults = {
   key: "number",
   // unique key to reference this specific DataField

   icon: "hashtag",
   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to
   // reference 'fa-user'

   menuName: "Number",
   // menuName: what gets displayed in the Editor drop list
   // this is a label key:  L(menuName)

   description: "A Float or Integer Value",
   // description: what gets displayed in the Editor description.
   // this is a label key:  L(menuName)

   supportRequire: true,
   // {bool}
   // does this ABField support the Required setting?

   supportUnique: true,
   // {bool}
   // does this ABField support the Unique setting?

   compatibleOrmTypes: ["integer", "float"],
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

var defaultValues = {
   // 'allowRequired': 0,
   default: "",
   typeFormat: "none",
   typeDecimals: "none",
   typeDecimalPlaces: "none",
   typeRounding: "none",
   typeThousands: "none",
   validation: 0,
   validateMinimum: "",
   validateMaximum: "",
};

var L = null; //AB.Label();

module.exports = class ABFieldNumberCore extends ABField {
   constructor(values, object) {
      super(values, object, ABFieldNumberDefaults);

      /*
    	{
			settings: {
				'allowRequired':0,
				'default':null,
				'typeFormat': 'none',
				'typeDecimals': 'none',
				'typeDecimalPlaces': 'none',
				'typeRounding' : 'none',
				'typeThousands': 'none',
				'validation':0,
				'validateMinimum':null,
				'validateMaximum':null
			}
    	}
    	*/
      if (!L) {
         L = this.AB.Label();
      }
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldNumberDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

   static formatList() {
      return [
         { id: "none", value: L("None") },
         {
            id: "dollar",
            value: L("$"),
            sign: "$",
            position: "prefix",
         },
         {
            id: "yen",
            value: L("¥"),
            sign: "¥",
            position: "prefix",
         },
         {
            id: "pound",
            value: L("£"),
            sign: "£",
            position: "prefix",
         },
         {
            id: "euroBefore",
            value: L("€ (before)"),
            sign: "€",
            position: "prefix",
         },
         {
            id: "euroAfter",
            value: L("€ (after)"),
            sign: "€",
            position: "postfix",
         },
         {
            id: "percent",
            value: L("%"),
            sign: "%",
            position: "postfix",
         },
      ];
   }

   static delimiterList() {
      return [
         { id: "none", value: L("None") },
         {
            id: "comma",
            value: L("Comma"),
            sign: ",",
         },
         {
            id: "period",
            value: L("Period"),
            sign: ".",
         },
         {
            id: "space",
            value: L("Space"),
            sign: " ",
         },
      ];
   }

   ///
   /// Instance Methods
   ///

   fromValues(values) {
      super.fromValues(values);

      // text to Int:
      // this.settings.allowRequired = parseInt(this.settings.allowRequired);
      this.settings.validation = parseInt(this.settings.validation);
   }

   ///
   /// Working with Actual Object Values:
   ///

   /**
    * @method defaultValue
    * insert a key=>value pair that represent the default value
    * for this field.
    * @param {obj} values a key=>value hash of the current values.
    */
   defaultValue(values) {
      // if no default value is set, then don't insert a value.
      if (this.settings.default != "") {
         values[this.columnName] = this.settings.default;
      }
   }

   /**
    * @method isValidData
    * Parse through the given data and return an error if this field's
    * data seems invalid.
    * @param {obj} data  a key=>value hash of the inputs to parse.
    * @param {OPValidator} validator  provided Validator fn
    * @return {array}
    */
   isValidData(data, validator) {
      super.isValidData(data, validator);

      // var L = this.AB.Label();

      if (data[this.columnName] != null && data[this.columnName] != "") {
         var value = data[this.columnName];

         // if this is an integer:
         if (this.settings.typeDecimals == "none") {
            value = parseInt(value);
         } else {
            var places = parseInt(this.settings.typeDecimalPlaces) || 2;
            value = parseFloat(parseFloat(value).toFixed(places));
         }

         var isNumeric = (n) => {
            return !Number.isNaN(parseFloat(n)) && Number.isFinite(n);
         };
         if (!isNumeric(value)) {
            validator.addError(this.columnName, L("invalid number"));
         }

         // validate Minimum
         if (
            this.settings.validation == true &&
            this.settings.validateMinimum != null &&
            this.settings.validateMinimum > value
         ) {
            let errMessage = L("should be greater than {0}", [
               this.settings.validateMinimum,
            ]);

            validator.addError(this.columnName, errMessage);
         }

         // validate Maximum
         if (
            this.settings.validation == true &&
            this.settings.validateMaximum != null &&
            this.settings.validateMaximum < value
         ) {
            let errMessage = L("should be less than {0}", [
               this.settings.validateMaximum,
            ]);

            validator.addError(this.columnName, errMessage);
         }
      }
   }

   format(rowData) {
      if (
         rowData[this.columnName] == null ||
         (rowData[this.columnName] != 0 && rowData[this.columnName] == "")
      )
         return "";

      let data = rowData[this.columnName] || 0;

      if (typeof data == "string") {
         data = data.replace(/,/g, "");
      }

      // Validate number
      if (isNaN(parseFloat(data))) data = 0;

      var formatSign = this.constructor
            .formatList()
            .filter((item) => item.id == this.settings.typeFormat)[0],
         thousandsSign = this.constructor
            .delimiterList()
            .filter((item) => item.id == this.settings.typeThousands)[0],
         decimalSign = this.constructor
            .delimiterList()
            .filter((item) => item.id == this.settings.typeDecimals)[0],
         decimalPlaces =
            this.settings.typeDecimalPlaces != "none"
               ? parseInt(this.settings.typeDecimalPlaces)
               : 0;

      var prefix = "",
         postfix = "";

      if (formatSign && formatSign.sign) {
         switch (formatSign.position) {
            case "prefix":
               prefix = formatSign.sign;
               break;
            case "postfix":
               postfix = formatSign.sign;
               break;
         }
      }

      decimalSign = decimalSign.sign || "";
      thousandsSign = thousandsSign.sign || "";

      // round number
      if (this.settings.typeRounding == "roundDown") {
         var digit = Math.pow(10, decimalPlaces);
         data = Math.floor(data * digit) / digit;
      }

      var number = this.formatNumber(data, {
         groupDelimiter: thousandsSign,
         groupSize: 3,
         decimalDelimiter: decimalSign,
         decimalSize: decimalPlaces,
      });

      return `${prefix} ${number} ${postfix}`;
   }

   formatNumber(data, options = {}) {
      if (data === "" || data == null) return data;

      data = parseFloat(data);
      let negativeSign = data < 0 ? "-" : "";
      data = Math.abs(data);

      let dataStr = data.toString();
      let integerStr = dataStr.split(".")[0];
      let decimalStr = dataStr.split(".")[1];

      let integerValue = "";

      // Thousands digit sign
      if (options.groupDelimiter) {
         let step = 3;
         let i = integerStr.length;

         do {
            i -= step;
            let chunk =
               i > 0
                  ? integerStr.substr(i, step)
                  : integerStr.substr(0, step + i);
            integerValue = `${chunk}${
               integerValue ? options.groupDelimiter + integerValue : ""
            }`;
         } while (i > 0);
      } else {
         integerValue = integerStr;
      }

      let result = "";

      // Decimal
      if (options.decimalDelimiter && options.decimalSize) {
         result = `${negativeSign}${integerValue}${
            decimalStr
               ? options.decimalDelimiter +
                 decimalStr.toString().substr(0, options.decimalSize)
               : ""
         }`;
      }
      // Integer
      else {
         result = `${negativeSign}${integerValue}`;
      }

      return result;
   }

   getDecimalSize() {
      if (this.settings.typeDecimalPlaces != "none") {
         return parseInt(this.settings.typeDecimalPlaces);
      } else {
         return 0;
      }
   }
};
