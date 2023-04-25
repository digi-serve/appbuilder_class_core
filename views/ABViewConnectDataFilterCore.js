const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewConnectDataFilterPropertyComponentDefaults = {
   dataviewID: null, // uuid of ABDatacollection
   field: null, // uuid
};

const ABViewDefaults = {
   key: "connect-data-filter", // {string} unique key for this view
   icon: "filter", // {string} fa-[icon] reference for this view
   labelKey: "Connected Data Filter", // {string} the multilingual label key for the class label
};

module.exports = class ABViewConnectDataFilterCore extends ABViewWidget {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues ?? ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewConnectDataFilterPropertyComponentDefaults;
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }
};
