const ABViewFormCustom = require("../../platform/views/ABViewFormCustom");

const ABViewFormConnectPropertyComponentDefaults = {
   formView: "", // id of form to add new data
   objectWorkspace: {
      filterConditions: {
         // array of filters to apply to the data table
         glue: "and",
         rules: [],
      },
   },
   popupWidth: 700,
   popupHeight: 450,
};

const ABViewFormConnectDefaults = {
   key: "connect", // {string} unique key for this view
   icon: "list-ul", // {string} fa-[icon] reference for this view
   labelKey: "ab.components.connect", // {string} the multilingual label key for the class label
};

module.exports = class ABViewFormConnectCore extends ABViewFormCustom {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABViewFormConnectDefaults
      );
   }

   static common() {
      return ABViewFormConnectDefaults;
   }

   static defaultValues() {
      return ABViewFormConnectPropertyComponentDefaults;
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      this.settings.objectWorkspace =
         this.settings.objectWorkspace ||
         ABViewFormConnectPropertyComponentDefaults.objectWorkspace;
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }
};
