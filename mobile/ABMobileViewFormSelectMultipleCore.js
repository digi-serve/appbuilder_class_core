import ABMobileViewFormSelectSingle from "../../platform/mobile/ABMobileViewFormSelectSingle";

const ABMobileViewFormSelectMultiplePropertyComponentDefaults = {
   type: "richselect", // 'richselect' or 'radio'
};

const ABMobileViewFormSelectMultipleDefaults = {
   key: "mobile-selectmultiple", // {string} unique key for this view
   icon: "list-ul", // {string} fa-[icon] reference for this view
   labelKey: "selectmultiple", // {string} the multilingual label key for the class label
};

export default class ABMobileViewFormSelectMultipleCore extends ABMobileViewFormSelectSingle {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABMobileViewFormSelectMultipleDefaults
      );
   }

   static common() {
      return ABMobileViewFormSelectMultipleDefaults;
   }

   static defaultValues() {
      return ABMobileViewFormSelectMultiplePropertyComponentDefaults;
   }
}
