/*
 * ABFieldDate
 *
 * An ABFieldDate defines a date field type.
 *
 */

const ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

const ABFieldDateDefaults = {
   key: "date",
   // unique key to reference this specific DataField

   description: "Pick one from a calendar.",
   // description: what gets displayed in the Editor description.
   // NOTE: this will be displayed using a Label: L(description)

   icon: "calendar",
   // font-awesome icon reference.  (without the 'fa-').  so 'calendar'  to
   // reference 'fa-calendar'

   isFilterable: true,
   // {bool} / {fn}
   // determines if the current ABField can be used to filter (FilterComplex
   // or Query) data.
   // if a {fn} is provided, it will be called with the ABField as a parameter:
   //  (field) => field.setting.something == true

   isSortable: true,
   // {bool} / {fn}
   // determines if the current ABField can be used to Sort data.
   // if a {fn} is provided, it will be called with the ABField as a parameter:
   //  (field) => true/false

   menuName: "Date",
   // menuName: what gets displayed in the Editor drop list
   // NOTE: this will be displayed using a Label: L(menuName)

   supportRequire: true,
   // {bool}
   // does this ABField support the Required setting?

   supportUnique: false,
   // {bool}
   // does this ABField support the Unique setting?

   useAsLabel: true,
   // {bool} / {fn}
   // determines if this ABField can be used in the display of an ABObject's
   // label.

   compatibleOrmTypes: ["date"],
   // {array}
   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options

   compatibleMysqlTypes: ["date"],
   // {array}
   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
};

const defaultValues = {
   dateFormat: 2, // 1 (Ignore date), 2, 3, 4, 5
   defaultDate: 1, // 1 (None), 2 (Current Date), 3 (Specific Date)
   defaultDateValue: null, // {Date}
   validateCondition: "none",
   validateRangeUnit: "days",
   validateRangeBefore: 0,
   validateRangeAfter: 0,
   validateStartDate: null,
   validateEndDate: null,
};

module.exports = class ABFieldDateCore extends ABField {
   constructor(values, object, defaultValues = ABFieldDateDefaults) {
      super(values, object, defaultValues);
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldDateDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

   // TODO: current webpack install fails here without babel-loader,
   // so swtich this to old JS method of Static Values (see bottom)
   // static RegEx = "^[0-9]{4}-[0-9]{2}-[0-9]{2}$";

   ///
   /// Instance Methods
   ///

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      // text to Int:
      this.settings.dateFormat = parseInt(this.settings.dateFormat);
      this.settings.defaultDate = parseInt(this.settings.defaultDate);
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
      if (values[this.columnName] != null) return;

      let dateResult;

      // Set current date as default
      if (this.settings.defaultDate == 2) {
         dateResult = new Date();
      }
      // Set specific date as default
      else if (
         this.settings.defaultDate == 3 &&
         this.settings.defaultDateValue
      ) {
         dateResult = new Date(this.settings.defaultDateValue);
      }

      // if no default value is set, then don't insert a value.
      if (dateResult != null) {
         values[this.columnName] = this.AB.rules.toDateFormat(dateResult, {
            format: "YYYY-MM-DD",
         });
         // values[this.columnName] = moment(dateResult).format("YYYY-MM-DD");
      }
   }

   /**
    * @method isValidData
    * Parse through the given data and return an error if this field's
    * data seems invalid.
    * @param {obj} data  a key=>value hash of the inputs to parse.
    * @param {OPValidator} validator  provided Validator fn
    */
   isValidData(data, validator) {
      super.isValidData(data, validator);

      if (data[this.columnName]) {
         let value = data[this.columnName];

         if (!(value instanceof Date)) {
            value = this.AB.rules.toDate(value);
            // value = new Date(this.convertToMoment(value));
         }

         // verify we didn't end up with an InValid Date result.
         if (
            Object.prototype.toString.call(value) === "[object Date]" &&
            isFinite(value)
         ) {
            let isValid = true;

            // Custom vaildate is here
            if (this.settings && this.settings.validateCondition) {
               const startDate = this.settings.validateStartDate
                     ? new Date(this.settings.validateStartDate)
                     : null,
                  endDate = this.settings.validateEndDate
                     ? new Date(this.settings.validateEndDate)
                     : null,
                  startDateDisplay = this.getDateDisplay(startDate),
                  endDateDisplay = this.getDateDisplay(endDate);
               const minDate = this.AB.rules.subtractDate(
                  new Date(),
                  this.settings.validateRangeBefore,
                  this.settings.validateRangeUnit
               );
               const maxDate = this.AB.rules.addDate(
                  new Date(),
                  this.settings.validateRangeAfter,
                  this.settings.validateRangeUnit
               );
               switch (this.settings.validateCondition) {
                  case "dateRange":
                     if (minDate < value && value < maxDate) isValid = true;
                     else {
                        isValid = false;
                        validator.addError(
                           this.columnName,
                           L("Should be in between {0} and {1}", [
                              this.getDateDisplay(minDate),
                              this.getDateDisplay(maxDate),
                           ])
                        );
                     }

                     break;
                  case "between":
                     if (startDate < value && value < endDate) isValid = true;
                     else {
                        isValid = false;
                        validator.addError(
                           this.columnName,
                           L("Should be in between {0} and {1}", [
                              startDateDisplay,
                              endDateDisplay,
                           ])
                        );
                     }
                     break;
                  case "notBetween":
                     if (value < startDate && endDate < value) isValid = true;
                     else {
                        isValid = false;
                        validator.addError(
                           this.columnName,
                           L("Should not be in between {0} and {1}", [
                              startDateDisplay,
                              endDateDisplay,
                           ])
                        );
                     }
                     break;
                  case "=":
                     isValid =
                        value.getTime &&
                        startDate.getTime &&
                        value.getTime() == startDate.getTime();
                     if (!isValid)
                        validator.addError(
                           this.columnName,
                           L("Should equal {0}", [startDateDisplay])
                        );
                     break;
                  case "<>":
                     isValid =
                        value.getTime &&
                        startDate.getTime &&
                        value.getTime() != startDate.getTime();
                     if (!isValid)
                        validator.addError(
                           this.columnName,
                           L("Should not equal {0}", [startDateDisplay])
                        );
                     break;
                  case ">":
                     isValid =
                        value.getTime &&
                        startDate.getTime &&
                        value.getTime() > startDate.getTime();
                     if (!isValid)
                        validator.addError(
                           this.columnName,
                           L("Should after {0}", [startDateDisplay])
                        );
                     break;
                  case "<":
                     isValid =
                        value.getTime &&
                        startDate.getTime &&
                        value.getTime() < startDate.getTime();
                     if (!isValid)
                        validator.addError(
                           this.columnName,
                           L("Should before {0}", [startDateDisplay])
                        );
                     break;
                  case ">=":
                     isValid =
                        value.getTime &&
                        startDate.getTime &&
                        value.getTime() >= startDate.getTime();
                     if (!isValid)
                        validator.addError(
                           this.columnName,
                           L("Should after or equal {0}", [startDateDisplay])
                        );
                     break;
                  case "<=":
                     isValid =
                        value.getTime &&
                        startDate.getTime &&
                        value.getTime() <= startDate.getTime();
                     if (!isValid)
                        validator.addError(
                           this.columnName,
                           L("Should before or equal {0}", [startDateDisplay])
                        );
                     break;
               }
            }

            if (isValid) {
               // Reformat value to DB
               // NOTE: should we update here?
               data[this.columnName] = this.exportValue(value);
            }
         } else {
            // return a validation error
            validator.addError(this.columnName, "Should be a Date!");
         }
      }
   }

   format(rowData) {
      const d = this.dataValue(rowData);

      if (d == "" || d == null) {
         return "";
      }

      // pull format from settings.
      const dateObj = this.AB.rules.toDate(d);
      return this.getDateDisplay(dateObj);

      // const momentObj = this.convertToMoment(d);
      // return this.getDateDisplay(new Date(momentObj));
   }

   getFormat() {
      let dateFormatString = "";

      const dateFormat =
         this.settings && this.settings.dateFormat
            ? this.settings.dateFormat
            : "";

      switch (dateFormat) {
         //Ignore Date
         case (1, 2):
            {
               dateFormatString = "%d/%m/%Y";
            }
            break;
         //mm/dd/yyyy
         case 3:
            {
               dateFormatString = "%m/%d/%Y";
            }
            break;
         //M D, yyyy
         case 4:
            {
               dateFormatString = "%M %d, %Y";
            }
            break;
         //D M, yyyy
         case 5:
            {
               dateFormatString = "%d %M, %Y";
            }
            break;
         default:
            {
               dateFormatString = "%d/%m/%Y";
            }
            break;
      }

      return dateFormatString;
   }

   getDateDisplay(dateData) {
      const dateFormat = this.getFormat();

      return this.dateToString(dateFormat, dateData);
   }

   // convertToMoment(string) {
   //    const result = moment(string);

   //    const supportFormats = [
   //       "DD/MM/YYYY",
   //       "MM/DD/YYYY",
   //       "DD-MM-YYYY",
   //       "MM-DD-YYYY"
   //    ];

   //    supportFormats.forEach((format) => {
   //       if (!result || !result.isValid()) result = moment(string, format);
   //    });

   //    return result;
   // }

   exportValue(value) {
      return value
         ? this.AB.rules.toDateFormat(value, {
              format: "YYYY-MM-DD",
           })
         : "";
      // return this.convertToMoment(value).format("YYYY-MM-DD");
   }

   dateToString(dateFormat, dateData) {
      if (dateData && dateData.toString) return dateData.toString();
      else return "";
   }
};

// Transition Code:
// revert to static RegEx once babel-loader is working locally.
module.exports.RegEx = "^[0-9]{4}-[0-9]{2}-[0-9]{2}$";
