const ABMobileViewFormItem = require("../../platform/mobile/ABMobileViewFormItem");

const ABMobileViewFormDatetimePropertyComponentDefaults = {
   timepicker: false,
};

const ABMobileViewFormDatetimeDefaults = {
   key: "mobile-datetime", // {string} unique key for this view
   icon: "calendar", // {string} fa-[icon] reference for this view
   labelKey: "Date and Time", // {string} the multilingual label key for the class label
};

module.exports = class ABMobileViewFormDatetimeCore extends (
   ABMobileViewFormItem
) {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABMobileViewFormDatetimeDefaults
      );
   }

   static common() {
      return ABMobileViewFormDatetimeDefaults;
   }

   static defaultValues() {
      return ABMobileViewFormDatetimePropertyComponentDefaults;
   }

   ///
   /// Instance Methods
   ///
};
