import ABMobileViewFormItem from "../../platform/mobile/ABMobileViewFormItem";

const ABViewFormTextboxPropertyComponentDefaults = {
   type: "single", // 'single', 'multiple' or 'rich'
};

const ABViewFormTextboxDefaults = {
   key: "mobile-textbox", // {string} unique key for this view
   icon: "i-cursor", // {string} fa-[icon] reference for this view
   labelKey: "textbox", // {string} the multilingual label key for the class label
};

export default class ABMobileViewFormTextboxCore extends ABMobileViewFormItem {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABViewFormTextboxDefaults
      );
   }

   static common() {
      return ABViewFormTextboxDefaults;
   }

   static defaultValues() {
      return ABViewFormTextboxPropertyComponentDefaults;
   }
}
