const ABMobileViewFormCustom = require("../../platform/mobile/ABMobileViewFormCustom");

const ABMobileViewFormReadonlyPropertyComponentDefaults = {};

const ABMobileViewFormReadonlyDefaults = {
   key: "mobile-fieldreadonly", // {string} unique key for this view
   icon: "calculator", // {string} fa-[icon] reference for this view
   labelKey: "readonly", // {string} the multilingual label key for the class label
};

module.exports = class ABMobileViewFormReadonly extends ABMobileViewFormCustom {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABMobileViewFormReadonlyDefaults
      );
   }

   static common() {
      return ABMobileViewFormReadonlyDefaults;
   }

   static defaultValues() {
      return ABMobileViewFormReadonlyPropertyComponentDefaults;
   }
};
