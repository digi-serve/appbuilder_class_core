/*
 * ABFieldNumber
 *
 * An ABFieldNumber defines a Number field type.
 *
 */

var ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

var ABFieldNumberDefaults = {
   key: "number", // unique key to reference this specific DataField

   icon: "hashtag", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   // menuName: what gets displayed in the Editor drop list
   menuName: L("ab.dataField.number.menuName", "*Number"),

   // description: what gets displayed in the Editor description.
   description: L(
      "ab.dataField.number.description",
      "*A Float or Integer Value"
   ),

   supportRequire: true,
   supportUnique: true,

   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
   compatibleOrmTypes: ["integer", "float"],

   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
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
      "real"
   ]
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
   validateMaximum: ""
};

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
         { id: "none", value: L("ab.dataField.number.none", "*None") },
         {
            id: "dollar",
            value: L("ab.dataField.number.format.dollar", "$"),
            sign: "$",
            position: "prefix"
         },
         {
            id: "yen",
            value: L("ab.dataField.number.format.yen", "¥"),
            sign: "¥",
            position: "prefix"
         },
         {
            id: "pound",
            value: L("ab.dataField.number.format.pound", "£"),
            sign: "£",
            position: "prefix"
         },
         {
            id: "euroBefore",
            value: L("ab.dataField.number.format.euroBefore", "€ (before)"),
            sign: "€",
            position: "prefix"
         },
         {
            id: "euroAfter",
            value: L("ab.dataField.number.format.euroAfter", "€ (after)"),
            sign: "€",
            position: "postfix"
         },
         {
            id: "percent",
            value: L("ab.dataField.number.format.percent", "%"),
            sign: "%",
            position: "postfix"
         }
      ];
   }

   static delimiterList() {
      return [
         { id: "none", value: L("ab.dataField.number.none", "*None") },
         {
            id: "comma",
            value: L("ab.dataField.number.comma", "*Comma"),
            sign: ","
         },
         {
            id: "period",
            value: L("ab.dataField.number.period", "*Period"),
            sign: "."
         },
         {
            id: "space",
            value: L("ab.dataField.number.space", "*Space"),
            sign: " "
         }
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
            validator.addError(this.columnName, "invalid number");
         }

         // validate Minimum
         if (
            this.settings.validation == true &&
            this.settings.validateMinimum != null &&
            this.settings.validateMinimum > value
         ) {
            var errMessage = "should be greater than {min}".replace(
               "{min}",
               this.settings.validateMinimum
            );

            validator.addError(this.columnName, errMessage);
         }

         // validate Maximum
         if (
            this.settings.validation == true &&
            this.settings.validateMaximum != null &&
            this.settings.validateMaximum < value
         ) {
            var errMessage = "should be less than {max}".replace(
               "{max}",
               this.settings.validateMaximum
            );

            validator.addError(this.columnName, errMessage);
         }
      }
   }

   format(rowData) {
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

      //// TODO: refactor to remove webix.* reference!
      //// webix is a platform dependent ability: maybe try:  this.formatNumber(data, options)

      return "{prefix} {number} {postfix}"
         .replace("{prefix}", prefix)
         .replace("{postfix}", postfix)
         .replace(
            "{number}",
            webix.Number.format(data, {
               groupDelimiter: thousandsSign,
               groupSize: 3,
               decimalDelimiter: decimalSign,
               decimalSize: decimalPlaces
            })
         );
   }
};
