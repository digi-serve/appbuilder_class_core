import ABMobileViewFormItem from "../../platform/mobile/ABMobileViewFormItem";

const ABMobileViewFormNumberPropertyComponentDefaults = {
   isStepper: 0,
};

const ABMobileViewFormNumberDefaults = {
   key: "mobile-numberbox", // {string} unique key for this view
   icon: "hashtag", // {string} fa-[icon] reference for this view
   labelKey: "number", // {string} the multilingual label key for the class label
};

export default class ABMobileViewFormNumberCore extends ABMobileViewFormItem {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABMobileViewFormNumberDefaults
      );
   }

   static common() {
      return ABMobileViewFormNumberDefaults;
   }

   static defaultValues() {
      return ABMobileViewFormNumberPropertyComponentDefaults;
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABViewFormText instance
    * into the values needed for saving.
    *
    * @return {json}
    */
   toObj() {
      this.unTranslate(this, this, ["label", "formLabel"]);

      var obj = super.toObj();
      obj.views = []; // no subviews
      return obj;
   }

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      // if this is being instantiated on a read from the Property UI,
      this.settings.isStepper =
         this.settings.isStepper ||
         ABMobileViewFormNumberPropertyComponentDefaults.isStepper;

      // convert from "0" => 0
      this.settings.isStepper = parseInt(this.settings.isStepper);
   }
}
