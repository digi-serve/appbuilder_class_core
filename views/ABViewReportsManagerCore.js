const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewReportManagerPropertyComponentDefaults = {
   moduleList: [],
   queryList: [],
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

      this.settings.moduleList =
         this.settings.moduleList ||
         ABViewReportManagerPropertyComponentDefaults.moduleList;

      this.settings.queryList =
         this.settings.queryList ||
         ABViewReportManagerPropertyComponentDefaults.queryList;
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

   /**
    * @property datacollection
    * return data source
    * NOTE: this view doesn't track a DataCollection.
    * @return {ABDataCollection}
    */
   get datacollection() {
      return null;
   }
};
