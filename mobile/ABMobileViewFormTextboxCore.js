const ABMobileViewFormItem = require("../../platform/mobile/ABMobileViewFormItem");

const ABViewFormTextboxPropertyComponentDefaults = {
   type: "single", // 'single', 'multiple' or 'rich'
   placeholder: "", // default placeholder text
};

const ABViewFormTextboxDefaults = {
   key: "mobile-textbox", // {string} unique key for this view
   icon: "i-cursor", // {string} fa-[icon] reference for this view
   labelKey: "textbox", // {string} the multilingual label key for the class label
};

module.exports = class ABMobileViewFormTextboxCore extends (
   ABMobileViewFormItem
) {
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

   toObj() {
      // placeholder is a multilingual value:
      this.unTranslate(this.settings, this.settings, ["placeholder"]);

      return super.toObj();
   }

   fromValues(values) {
      super.fromValues(values);

      // placeholder is a multilingual value:
      this.unTranslate(this.settings, this.settings, ["placeholder"]);
   }
};
