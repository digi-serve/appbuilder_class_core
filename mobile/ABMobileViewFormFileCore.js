const ABMobileViewFormItem = require("../../platform/mobile/ABMobileViewFormItem");

const ABViewFormFilePropertyComponentDefaults = {};

const ABViewFormFileDefaults = {
   key: "mobile-file",
   // {string} unique key for this view
   icon: "file",
   // {string} fa-[icon] reference for this view
   labelKey: "file",
   // {string} the multilingual label key for the class label
};

module.exports = class ABMobileViewFormFileCore extends ABMobileViewFormItem {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABViewFormFileDefaults
      );
   }

   static common() {
      return ABViewFormFileDefaults;
   }

   static defaultValues() {
      return ABViewFormFilePropertyComponentDefaults;
   }
};
