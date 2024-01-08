const ABMobileViewFormItem = require("../../platform/mobile/ABMobileViewFormItem");

const ABMobileViewFormConnectPropertyComponentDefaults = {
   formView: "", // id of form to add new data
   filterConditions: {
      glue: "and",
      rules: [],
   },
   sortFields: [],
   popupWidth: 700,
   popupHeight: 450,
};

const ABMobileViewFormConnectDefaults = {
   key: "mobile-connect", // {string} unique key for this view
   icon: "list-ul", // {string} fa-[icon] reference for this view
   labelKey: "Connect", // {string} the multilingual label key for the class label
};

module.exports = class ABMobileViewFormConnectCore extends (
   ABMobileViewFormItem
) {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABMobileViewFormConnectDefaults
      );
   }

   static common() {
      return ABMobileViewFormConnectDefaults;
   }

   static defaultValues() {
      return ABMobileViewFormConnectPropertyComponentDefaults;
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

      this.settings.filterConditions =
         this.settings.filterConditions ||
         ABMobileViewFormConnectPropertyComponentDefaults.filterConditions;
   }
};
