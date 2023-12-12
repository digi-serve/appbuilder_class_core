import ABMobileViewFormItem from "../../platform/mobile/ABMobileViewFormItem";

const ABMobileViewFormSelectSinglePropertyComponentDefaults = {
   type: "richselect", // 'richselect' or 'radio'
};

const ABMobileViewFormSelectSingleDefaults = {
   key: "mobile-selectsingle", // {string} unique key for this view
   icon: "list-ul", // {string} fa-[icon] reference for this view
   labelKey: "selectsingle", // {string} the multilingual label key for the class label
};

export default class ABMobileViewFormSelectSingleCore extends ABMobileViewFormItem {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABMobileViewFormSelectSingleDefaults
      );
   }

   static common() {
      return ABMobileViewFormSelectSingleDefaults;
   }

   static defaultValues() {
      return ABMobileViewFormSelectSinglePropertyComponentDefaults;
   }
}
