import ABMobileViewFormItem from "../../platform/mobile/ABMobileViewFormItem";

const ABMobileViewFormCheckboxPropertyComponentDefaults = {};

const ABMobileViewFormCheckboxDefaults = {
   key: "mobile-checkbox", // {string} unique key for this view
   icon: "check-square-o", // {string} fa-[icon] reference for this view
   labelKey: "checkbox", // {string} the multilingual label key for the class label
};

export default class ABMobileViewFormCheckboxCore extends ABMobileViewFormItem {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABMobileViewFormCheckboxDefaults
      );
   }

   static common() {
      return ABMobileViewFormCheckboxDefaults;
   }

   static defaultValues() {
      return ABMobileViewFormCheckboxPropertyComponentDefaults;
   }
}
