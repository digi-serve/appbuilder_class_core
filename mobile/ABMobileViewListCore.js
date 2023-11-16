const ABMobileView = require("../../platform/mobile/ABMobileView");

const ABViewListPropertyComponentDefaults = {
   dataviewID: null,
   field: null,
   height: 0,
};

const ABViewDefaults = {
   key: "mobile-list", // {string} unique key for this view
   icon: "list-ul", // {string} fa-[icon] reference for this view
   labelKey: "List", // {string} the multilingual label key for the class label
};

module.exports = class ABViewLabelCore extends ABMobileView {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewListPropertyComponentDefaults;
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }

   field() {
      var dv = this.datacollection;
      if (!dv) return null;

      var object = dv.datasource;
      if (!object) return null;

      return object.fieldByID(this.settings.field);
   }
};
