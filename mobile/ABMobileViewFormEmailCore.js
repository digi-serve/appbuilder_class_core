import ABMobileViewFormItem from "../../platform/mobile/ABMobileViewFormItem";

const ABMobileViewFormEmailPropertyComponentDefaults = {
   timepicker: false,
};

const ABMobileViewFormEmailDefaults = {
   key: "mobile-email", // {string} unique key for this view
   icon: "envelope", // {string} fa-[icon] reference for this view
   labelKey: "Email", // {string} the multilingual label key for the class label
};

export default class ABMobileViewFormEmailCore extends ABMobileViewFormItem {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABMobileViewFormEmailDefaults
      );
   }

   static common() {
      return ABMobileViewFormEmailDefaults;
   }

   static defaultValues() {
      return ABMobileViewFormEmailPropertyComponentDefaults;
   }

   ///
   /// Instance Methods
   ///
}
