const ABViewFormComponent = require("../../platform/views/ABViewFormComponent");

const ABViewFormDatepickerPropertyComponentDefaults = {
   timepicker: false
};

const ABViewFormDatepickerDefaults = {
   key: "datepicker", // {string} unique key for this view
   icon: "calendar", // {string} fa-[icon] reference for this view
   labelKey: "ab.components.datepicker" // {string} the multilingual label key for the class label
};

module.exports = class ABViewFormDatepickerCore extends ABViewFormComponent {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABViewFormDatepickerDefaults
      );
   }

   static common() {
      return ABViewFormDatepickerDefaults;
   }

   static defaultValues() {
      return ABViewFormDatepickerPropertyComponentDefaults;
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

      // convert from "0" => 0
      this.settings.timepicker = parseInt(this.settings.timepicker);
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }
};
