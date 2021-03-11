/*
 * ABFieldDateTime
 *
 * An ABFieldDateTime defines a datetime field type.
 *
 */

const ABFieldDateCore = require("./ABFieldDateCore");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

const ABFieldDateDefaults = {
   key: "datetime", // unique key to reference this specific DataField

   icon: "clock-o", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   // menuName: what gets displayed in the Editor drop list
   menuName: L("ab.dataField.datetime.menuName", "*Date & Time"),

   // description: what gets displayed in the Editor description.
   description: L(
      "ab.dataField.datetime.description",
      "*Pick one from date & time."
   ),

   supportRequire: true,

   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
   compatibleOrmTypes: ["datetime"],

   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
   compatibleMysqlTypes: ["datetime"]
};

const defaultValues = {
   timeFormat: 2, // 1 (Ignore time), 2, 3
   defaultTime: 1, // 1 (None), 2 (Current Time), 3 (Specific Time)
   defaultTimeValue: null // {Date}
};

module.exports = class ABFieldDateTimeCore extends ABFieldDateCore {
   constructor(values, object) {
      super(values, object, ABFieldDateDefaults);
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldDateDefaults;
   }

   static defaultValues() {
      let baseDefault = super.defaultValues();
      return Object.assign(baseDefault, defaultValues);
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
      if (values[this.columnName] != null) return;

      super.defaultValue(values);

      let dateResult;

      // From default value of ABFieldDateCore
      if (values[this.columnName]) {
         dateResult = this.object.application.toDate(values[this.columnName]);
         // let momentVal = this.convertToMoment(values[this.columnName]);
         // if (momentVal.isValid()) {
         //    dateResult = new Date(momentVal);
         // }
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

      // if no default value is set, then don't insert a value.
      if (dateResult != null)
         values[this.columnName] = dateResult.toISOString();
   }

   getFormat() {
      let dateFormatString = super.getFormat();

      let timeFormat = this.getTimeFormat();
      if (timeFormat) dateFormatString += ` ${timeFormat}`;

      return dateFormatString;
   }

   format(rowData) {
      this.settings = this.settings || {};
      if (this.settings.dateFormat == 1) {
         var d = this.dataValue(rowData);
         if (d == "" || d == null) {
            return "";
         }

         // pull format from settings.
         let dateObj = this.object.application.toDate(d);
         let timeFormat = this.getTimeFormat();
         return webix.Date.dateToStr(timeFormat)(dateObj);
      } else {
         return super.format(rowData);
      }
   }

   getTimeFormat() {
      this.settings = this.settings || {};
      switch (this.settings.timeFormat) {
         case 2:
            return " %h:%i %A";
         case 3:
            return " %H:%i";
         default:
            return "";
      }
   }

   /**
    * @method exportValue
    * @param {Date} date
    * @return {string}
    */
   exportValue(date) {
      return date.toISOString();
   }
};

