const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewSchedulerPropertyComponentDefaults = {
   readonly: 0,
   dataviewID: "",
   dataviewFields: {
      name: "", // id of a String field
      start: "", // id of a DateTime field
      end: "", // id of a DateTime field
      allDay: "", // id of a Checkbox field
      repeat: "", // id of a String field
      calendar: "", // id of a String field
      color: "", // id of a String field
      sectionID: "", // id of a String field
      unitID: "", // id of a String field
      notes: "", // id of a LongText field
      originID: "", // id of a LongText field
   },
   calendarDataviewID: "",
   calendarDataviewFields: {
      title: "", // id of a String field
      color: "", // id of a String field
      active: "", // id of a Checkbox field
   },
   timeline: {
      day: 1,
      week: 1,
      month: 1,
      year: 1,
      agenda: 1,
      timeline: 1,
      units: 1,
   },
   timelineSectionList: "",
   unitList: "",
   export: {
      excel: 0,
      csv: 0,
      pdf: 0,
   },
};

const ABViewDefaults = {
   key: "scheduler",
   // {string}
   // unique key for this view

   icon: "calendar",
   // {string}
   // fa-[icon] reference for this view

   labelKey: "Scheduler",
   // {string}
   // the multilingual label key for the class label
};

module.exports = class ABViewSchedulerCore extends ABViewWidget {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);

      this._object = null;
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewSchedulerPropertyComponentDefaults;
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABViewLabel instance
    * into the values needed for saving.
    *
    * @return {json}
    */
   toObj() {
      // NOTE: ABView auto translates/untranslates "label"
      // add in any additional fields here:
      this.unTranslate(this, this, ["scheduler"]);

      const obj = super.toObj();

      obj.views = [];

      return obj;
   }

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      this.settings = this.settings || {};
      this.settings.dataviewFields = this.settings.dataviewFields || {};
      this.settings.calendarDataviewFields =
         this.settings.calendarDataviewFields || {};
      this.settings.timeline = this.settings.timeline || {};
      this.settings.export = this.settings.export || {};

      const parsedSettings = {};

      Object.keys(ABViewSchedulerPropertyComponentDefaults).forEach((key1) => {
         if (
            typeof ABViewSchedulerPropertyComponentDefaults[key1] === "object"
         ) {
            parsedSettings[key1] = {};

            Object.keys(ABViewSchedulerPropertyComponentDefaults[key1]).forEach(
               (key2) => {
                  parsedSettings[key1][key2] =
                     this.settings[key1][key2] ??
                     ABViewSchedulerPropertyComponentDefaults[key1][key2];
               }
            );

            return;
         }

         parsedSettings[key1] =
            this.settings[key1] ??
            ABViewSchedulerPropertyComponentDefaults[key1];
      });

      this.settings = parsedSettings;

      // if this is being instantiated on a read from the Property UI,
      this.scheduler =
         values.scheduler || ABViewSchedulerPropertyComponentDefaults.scheduler;

      // NOTE: ABView auto translates/untranslates "label"
      // add in any additional fields here:
      this.translate(this, this, ["scheduler"]);
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }
};
