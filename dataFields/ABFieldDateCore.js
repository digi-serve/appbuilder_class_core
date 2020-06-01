/*
 * ABFieldDate
 *
 * An ABFieldDate defines a date/datetime field type.
 *
 */

var ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

var ABFieldDateDefaults = {
   key: "date", // unique key to reference this specific DataField

   icon: "calendar", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   // menuName: what gets displayed in the Editor drop list
   menuName: L("ab.dataField.date.menuName", "*Date"),

   // description: what gets displayed in the Editor description.
   description: L(
      "ab.dataField.date.description",
      "*Pick one from a calendar."
   ),

   supportRequire: true,

   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
   compatibleOrmTypes: ["date", "datetime"],

   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
   compatibleMysqlTypes: ["date", "datetime"]
};

var defaultValues = {
   dateFormat: 1, // 1 (Ignore date), 2, 3, 4, 5
   defaultDate: 1, // 1 (None), 2 (Current Date), 3 (Specific Date)
   defaultDateValue: null, // {Date}
   timeFormat: 1, // 1 (Ignore time), 2, 3
   defaultTime: 1, // 1 (None), 2 (Current Time), 3 (Specific Time)
   defaultTimeValue: null, // {Date}
   validateCondition: "none",
   validateRangeUnit: "days",
   validateRangeBefore: 0,
   validateRangeAfter: 0,
   validateStartDate: null,
   validateEndDate: null
};

var delimiterList = [
   { id: "comma", value: "Comma", sign: ", " },
   { id: "slash", value: "Slash", sign: "/" },
   { id: "space", value: "Space", sign: " " },
   { id: "dash", value: "Dash", sign: "-" },
   { id: "colon", value: "Colon", sign: ":" }
];

/** Private methods **/
function getDelimiterSign(text) {
   var delimiterItem = delimiterList.filter((item) => {
      return item.id == text;
   })[0];

   return delimiterItem ? delimiterItem.sign : "";
}

function getDateFormat(setting) {
   var dateFormatString = "";

   // Date format
   // for (var i = 1; i <= 3; i++) {
   // 	if (setting.dayOrder == i) {
   // 		dateFormat += setting.dayFormat;
   // 		dateFormat += (i != 3) ? getDelimiterSign(setting.dayDelimiter) : '';
   // 	}
   // 	if (setting.monthOrder == i) {
   // 		dateFormat += setting.monthFormat;
   // 		dateFormat += (i != 3) ? getDelimiterSign(setting.monthDelimiter) : '';
   // 	}
   // 	if (setting.yearOrder == i) {
   // 		dateFormat += setting.yearFormat;
   // 		dateFormat += (i != 3) ? getDelimiterSign(setting.yearDelimiter) : '';
   // 	}
   // }

   // // Time format
   // if (setting.includeTime == true) {
   // 	dateFormat += (' {hour}{delimiter}{minute}{period}'
   // 		.replace('{hour}', setting.hourFormat)
   // 		.replace('{delimiter}', getDelimiterSign(setting.timeDelimiter))
   // 		.replace('{minute}', '%i')
   // 		.replace('{period}', setting.periodFormat != 'none' ? ' '+setting.periodFormat : '')
   // 	);
   // }

   var dateFormat = setting && setting.dateFormat ? setting.dateFormat : "";
   var timeFormat = setting && setting.timeFormat ? setting.timeFormat : "";

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

   switch (timeFormat) {
      case 2:
         {
            dateFormatString += " %h:%i %A";
         }
         break;
      case 3:
         {
            dateFormatString += " %H:%i";
         }
         break;
      default:
         {
            //Do not show time in format
         }
         break;
   }

   return dateFormatString;
}

function getDateDisplay(dateData, settings) {
   var dateFormat = getDateFormat(settings);

   return webix.Date.dateToStr(dateFormat)(dateData);
}

// function dateDisplayRefresh() {

// 	if ($$(ids.includeTime).getValue()) {
// 		//if user chooses an hour format for time that is 1-12 we need to force a "Period" format
// 		//a lowercase letter signifies that it will be lowercase so we just need to look for lowercase letters
// 		if ( /[a-z]/.test($$(ids.hourFormat).getValue()) ) {
// 			//only set if one hasn't been set already
// 			if ($$(ids.periodFormat).getValue() == "none") {
// 				$$(ids.periodFormat).setValue("%a"); // set to the first one
// 			}
// 		} else {
// 			//if user chooses an hour format for time that is 0-23 we need to remove the "Period" format
// 			$$(ids.periodFormat).setValue("none");
// 		}
// 	}

// 	var dateFormat = getDateFormat({
// 		dayOrder: $$(ids.dayOrder).getValue(),
// 		monthOrder: $$(ids.monthOrder).getValue(),
// 		yearOrder: $$(ids.yearOrder).getValue(),
// 		dayFormat: $$(ids.dayFormat).getValue(),
// 		monthFormat: $$(ids.monthFormat).getValue(),
// 		yearFormat: $$(ids.yearFormat).getValue(),
// 		dayDelimiter: $$(ids.dayDelimiter).getValue(),
// 		monthDelimiter: $$(ids.monthDelimiter).getValue(),
// 		yearDelimiter: $$(ids.yearDelimiter).getValue(),

// 		includeTime: $$(ids.includeTime).getValue(),
// 		hourFormat: $$(ids.hourFormat).getValue(),
// 		timeDelimiter: $$(ids.timeDelimiter).getValue(),
// 		periodFormat: $$(ids.periodFormat).getValue(),
// 	});

// 	var dateDisplay = webix.Date.dateToStr(dateFormat)(new Date());

// 	$$(ids.dateDisplay).setValue(dateDisplay);
// }

module.exports = class ABFieldDateCore extends ABField {
   constructor(values, object) {
      super(values, object, ABFieldDateDefaults);
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldDateDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

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
      this.settings.timeFormat = parseInt(this.settings.timeFormat);
      this.settings.defaultTime = parseInt(this.settings.defaultTime);
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
      if (values[this.columnName] == null) {
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

         // Set current time as default
         if (this.settings.defaultTime == 2) {
            let currDate = new Date();

            if (dateResult == null) dateResult = new Date();

            dateResult.setHours(currDate.getHours());
            dateResult.setMinutes(currDate.getMinutes());
            dateResult.setSeconds(currDate.getSeconds());
            dateResult.setMilliseconds(currDate.getMilliseconds());
         }
         // Set specific time as default
         else if (
            this.settings.defaultTime == 3 &&
            this.settings.defaultTimeValue
         ) {
            let defaultTime = new Date(this.settings.defaultTimeValue);

            if (dateResult == null) dateResult = new Date();

            dateResult.setHours(defaultTime.getHours());
            dateResult.setMinutes(defaultTime.getMinutes());
            dateResult.setSeconds(defaultTime.getSeconds());
            dateResult.setMilliseconds(defaultTime.getMilliseconds());
         }

         if (dateResult != null)
            values[this.columnName] = dateResult.toISOString();
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
         var value = data[this.columnName];

         if (!(value instanceof Date)) {
            value = new Date(this.convertToMoment(value));
         }

         // verify we didn't end up with an InValid Date result.
         if (
            Object.prototype.toString.call(value) === "[object Date]" &&
            isFinite(value)
         ) {
            var isValid = true;

            // Custom vaildate is here
            if (this.settings && this.settings.validateCondition) {
               var startDate = this.settings.validateStartDate
                     ? new Date(this.settings.validateStartDate)
                     : null,
                  endDate = this.settings.validateEndDate
                     ? new Date(this.settings.validateEndDate)
                     : null,
                  startDateDisplay = getDateDisplay(startDate, this.settings),
                  endDateDisplay = getDateDisplay(endDate, this.settings);

               switch (this.settings.validateCondition) {
                  case "dateRange":
                     var minDate = moment()
                        .subtract(
                           this.settings.validateRangeBefore,
                           this.settings.validateRangeUnit
                        )
                        .toDate();
                     var maxDate = moment()
                        .add(
                           this.settings.validateRangeAfter,
                           this.settings.validateRangeUnit
                        )
                        .toDate();

                     if (minDate < value && value < maxDate) isValid = true;
                     else {
                        isValid = false;
                        validator.addError(
                           this.columnName,
                           L(
                              "ab.dataField.date.error.dateRange",
                              "*Should be in between {startdate} and {enddate}"
                           )
                              .replace(
                                 "{startdate}",
                                 getDateDisplay(minDate, this.settings)
                              )
                              .replace(
                                 "{enddate}",
                                 getDateDisplay(maxDate, this.settings)
                              )
                        );
                     }

                     break;
                  case "between":
                     if (startDate < value && value < endDate) isValid = true;
                     else {
                        isValid = false;
                        validator.addError(
                           this.columnName,
                           L(
                              "ab.dataField.date.error.between",
                              "*Should be in between {startdate} and {enddate}"
                           )
                              .replace("{startdate}", startDateDisplay)
                              .replace("{enddate}", endDateDisplay)
                        );
                     }
                     break;
                  case "notBetween":
                     if (value < startDate && endDate < value) isValid = true;
                     else {
                        isValid = false;
                        validator.addError(
                           this.columnName,
                           L(
                              "ab.dataField.date.error.notBetween",
                              "*Should not be in between {startdate} and {enddate}"
                           )
                              .replace("{startdate}", startDateDisplay)
                              .replace("{enddate}", endDateDisplay)
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
                           L(
                              "ab.dataField.date.error.equal",
                              "*Should equal {startdate}"
                           ).replace("{startdate}", startDateDisplay)
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
                           L(
                              "ab.dataField.date.error.notEqual",
                              "*Should not equal {startdate}"
                           ).replace("{startdate}", startDateDisplay)
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
                           L(
                              "ab.dataField.date.error.after",
                              "*Should after {startdate}"
                           ).replace("{startdate}", startDateDisplay)
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
                           L(
                              "ab.dataField.date.error.before",
                              "*Should before {startdate}"
                           ).replace("{startdate}", startDateDisplay)
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
                           L(
                              "ab.dataField.date.error.afterOrEqual",
                              "*Should after or equal {startdate}"
                           ).replace("{startdate}", startDateDisplay)
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
                           L(
                              "ab.dataField.date.error.beforeOrEqual",
                              "*Should before or equal {startdate}"
                           ).replace("{startdate}", startDateDisplay)
                        );
                     break;
               }
            }

            if (isValid) {
               // all good, so store as ISO format string.
               if (this.settings.timeFormat == 1) {
                  data[this.columnName] = this.convertToMoment(value).format(
                     "YYYY-MM-DD 00:00:00"
                  );
               } else {
                  data[this.columnName] = this.convertToMoment(value).format(
                     "YYYY-MM-DD HH:mm:ss"
                  );
               }
               // console.log(data);
            }
         } else {
            // return a validation error
            validator.addError(this.columnName, "Should be a Date!");
         }
      }
   }

   format(rowData) {
      var d = this.dataValue(rowData);

      if (d == "" || d == null) {
         return "";
      }
      // convert ISO string -> Date() -> our formatted string

      // pull format from settings.
      let momentObj = this.convertToMoment(d);
      return getDateDisplay(new Date(momentObj), this.settings);
   }

   getFormat() {
      return getDateFormat(this.settings);
   }

   convertToMoment(string) {
      let result = moment(string);

      let supportFormats = [
         "DD/MM/YYYY",
         "MM/DD/YYYY",
         "DD-MM-YYYY",
         "MM-DD-YYYY"
      ];

      supportFormats.forEach((format) => {
         if (!result || !result.isValid()) result = moment(string, format);
      });

      return result;
   }
};

