const ABMobileViewFormItem = require("../../platform/mobile/ABMobileViewFormItem");

const ABMobileViewFormDatepickerPropertyComponentDefaults = {
   timepicker: false,
};

const ABMobileViewFormDatepickerDefaults = {
   key: "mobile-date", // {string} unique key for this view
   icon: "calendar", // {string} fa-[icon] reference for this view
   labelKey: "datepicker", // {string} the multilingual label key for the class label
};

module.exports = class ABMobileViewFormDatepickerCore extends (
   ABMobileViewFormItem
) {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABMobileViewFormDatepickerDefaults
      );
   }

   static common() {
      return ABMobileViewFormDatepickerDefaults;
   }

   static defaultValues() {
      return ABMobileViewFormDatepickerPropertyComponentDefaults;
   }

   ///
   /// Instance Methods
   ///
};
