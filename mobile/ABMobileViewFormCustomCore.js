import ABMobileViewFormItem from "../../platform/mobile/ABMobileViewFormItem";

const ABViewFormCustomPropertyComponentDefaults = {};

const ABViewFormCustomDefaults = {
   key: "mobile-fieldcustom",
   // {string} unique key for this view
   icon: "object-group",
   // {string} fa-[icon] reference for this view
   labelKey: "custom",
   // {string} the multilingual label key for the class label
};

export default class ABMobileViewFormCustomCore extends ABMobileViewFormItem {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABViewFormCustomDefaults
      );
   }

   static common() {
      return ABViewFormCustomDefaults;
   }

   static defaultValues() {
      return ABViewFormCustomPropertyComponentDefaults;
   }
}
