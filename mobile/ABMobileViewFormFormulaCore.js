import ABMobileViewFormItem from "../../platform/mobile/ABMobileViewFormItem";

const ABViewFormFormulaPropertyComponentDefaults = {};

const ABViewFormFormulaDefaults = {
   key: "mobile-formula",
   // {string} unique key for this view
   icon: "circle-o-notch",
   // {string} fa-[icon] reference for this view
   labelKey: "Formula",
   // {string} the multilingual label key for the class label
};

export default class ABMobileViewFormFormulaCore extends ABMobileViewFormItem {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABViewFormFormulaDefaults
      );
   }

   static common() {
      return ABViewFormFormulaDefaults;
   }

   static defaultValues() {
      return ABViewFormFormulaPropertyComponentDefaults;
   }
}
