const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewReportManagerPropertyComponentDefaults = {
   dataviewID: "",
   dataviewFields: {
      name: "", // id of a String field
      text: "", // id of a LongText field
      queries: "", // id of a json field
   },
   datacollectionIDs: [],
   editMode: 0,
   hideCommonTab: 0,
   hideDataTab: 0,
   hideViewTab: 0,
};

const ABViewDefaults = {
   key: "reportsManager", // {string} unique key for this view
   icon: "wpforms", // {string} fa-[icon] reference for this view
   labelKey: "Reports Manager", // {string} the multilingual label key for the class label
};

module.exports = class ABViewReportsManagerCore extends ABViewWidget {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewReportManagerPropertyComponentDefaults;
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

      const parsedSettings = {};

      Object.keys(ABViewReportManagerPropertyComponentDefaults).forEach(
         (key1) => {
            if (
               typeof ABViewReportManagerPropertyComponentDefaults[key1] ===
                  "object" &&
               !Array.isArray(
                  ABViewReportManagerPropertyComponentDefaults[key1]
               )
            ) {
               parsedSettings[key1] = {};

               Object.keys(
                  ABViewReportManagerPropertyComponentDefaults[key1]
               ).forEach((key2) => {
                  parsedSettings[key1][key2] =
                     this.settings[key1]?.[key2] ??
                     ABViewReportManagerPropertyComponentDefaults[key1][key2];
               });

               return;
            }

            parsedSettings[key1] =
               this.settings[key1] ??
               ABViewReportManagerPropertyComponentDefaults[key1];
         }
      );

      this.settings = parsedSettings;
   }

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABViewLabel instance
    * into the values needed for saving.
    *
    * @return {json}
    */
   toObj() {
      var obj = super.toObj();

      obj.settings = obj.settings || {};

      return obj;
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }
};
