const ABViewFormComponent = require("../../platform/views/ABViewFormComponent");

const ABViewFormJsonPropertyComponentDefaults = {
   type: "string" // 'string', 'systemObjects' or 'filter'
};

const ABViewFormJsonDefaults = {
   key: "json", // {string} unique key for this view
   icon: "i-cursor", // {string} fa-[icon] reference for this view
   labelKey: "ab.components.textbox" // {string} the multilingual label key for the class label
};

module.exports = class ABViewFormJsonCore extends ABViewFormComponent {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABViewFormJsonDefaults
      );
   }

   static common() {
      return ABViewFormJsonDefaults;
   }

   static defaultValues() {
      return ABViewFormJsonPropertyComponentDefaults;
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }
};
