const ABViewFormItem = require("../../platform/views/ABViewFormItem");

const ABViewFormCheckboxPropertyComponentDefaults = {};

const ABViewFormCheckboxDefaults = {
   key: "checkbox", // {string} unique key for this view
   icon: "check-square-o", // {string} fa-[icon] reference for this view
   labelKey: "ab.components.checkbox", // {string} the multilingual label key for the class label
};

module.exports = class ABViewFormCheckboxCore extends ABViewFormItem {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABViewFormCheckboxDefaults
      );
   }

   static common() {
      return ABViewFormCheckboxDefaults;
   }

   static defaultValues() {
      return ABViewFormCheckboxPropertyComponentDefaults;
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }
};
