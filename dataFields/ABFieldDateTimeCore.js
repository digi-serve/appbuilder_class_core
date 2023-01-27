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
   key: "datetime",
   // unique key to reference this specific DataField

   description: "Pick one from date & time.",
   // description: what gets displayed in the Editor description.
   // NOTE: this will be displayed using a Label: L(description)

   icon: "clock-o",
   // font-awesome icon reference.  (without the 'fa-').  so 'clock-o'  to
   // reference 'clock-o'

   isFilterable: true,
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

   menuName: "Date & Time",
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

   compatibleOrmTypes: ["datetime"],
   // {array}
   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options

   compatibleMysqlTypes: ["datetime"],
   // {array}
   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
};

const defaultValues = {
   timeFormat: 2, // 1 (Ignore time), 2, 3
   defaultTime: 1, // 1 (None), 2 (Current Time), 3 (Specific Time)
   defaultTimeValue: null, // {Date}
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
      const baseDefault = super.defaultValues();
      return Object.assign(baseDefault, defaultValues);
   }

   // TODO: current webpack install fails here without babel-loader,
   // so swtich this to old JS method of Static Values (see bottom)
   // static RegEx = "^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$";

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
         dateResult = this.AB.rules.toDate(values[this.columnName]);
         // const momentVal = this.convertToMoment(values[this.columnName]);
         // if (momentVal.isValid()) {
         //    dateResult = new Date(momentVal);
         // }
      }

      // Set current time as default
      if (this.settings.defaultTime == 2) {
         const currDate = new Date();

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
         const defaultTime = new Date(this.settings.defaultTimeValue);

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
      const timeFormat = this.getTimeFormat();

      this.settings = this.settings || {};

      if (this.settings.dateFormat == 1) {
         return timeFormat;
      }

      const dateFormat = super.getFormat();

      return `${dateFormat} ${timeFormat}`;
   }

   format(rowData) {
      const datetimeFormat = this.getFormat();
      const d = this.dataValue(rowData);
      const dateObj = this.AB.rules.toDate(d);

      if (d == "" || d == null) {
         return "";
      }

      return webix.Date.dateToStr(datetimeFormat)(dateObj);
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
      return date?.toISOString?.() ?? "";
   }
};

// Transition Code:
// revert to static RegEx once babel-loader is working locally.
module.exports.RegEx =
   "^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$";
