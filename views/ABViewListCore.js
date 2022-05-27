const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewListPropertyComponentDefaults = {
   dataviewID: null,
   field: null,
   height: 0,
};

const ABViewDefaults = {
   key: "list", // {string} unique key for this view
   icon: "list-ul", // {string} fa-[icon] reference for this view
   labelKey: "List", // {string} the multilingual label key for the class label
};

module.exports = class ABViewLabelCore extends ABViewWidget {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewListPropertyComponentDefaults;
   }

   field() {
      var dv = this.datacollection;
      if (!dv) return null;

      var object = dv.datasource;
      if (!object) return null;

      return object.fields((f) => f.id == this.settings.field)[0];
   }
};
