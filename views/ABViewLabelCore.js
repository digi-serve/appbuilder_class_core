const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewLabelPropertyComponentDefaults = {
   label: "",
   format: 0, // 0 - normal, 1 - title, 2 - description
   alignment: "left"
};

const ABViewDefaults = {
   key: "label", // {string} unique key for this view
   icon: "font", // {string} fa-[icon] reference for this view
   labelKey: "ab.components.label" // {string} the multilingual label key for the class label
};

module.exports = class ABViewLabelCore extends ABViewWidget {
   /**
    * @param {obj} values  key=>value hash of ABView values
    * @param {ABApplication} application the application object this view is under
    * @param {ABViewWidget} parent the ABViewWidget this view is a child of. (can be null)
    */
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewLabelPropertyComponentDefaults;
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABViewLabel instance
    * into the values needed for saving.
    *
    * @return {json}
    */
   toObj() {
      this.application.unTranslate(this, this, ["label", "text"]);

      var obj = super.toObj();
      obj.viewIDs = [];
      return obj;
   }

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values); // <-- this performs the translations

      // if this is being instantiated on a read from the Property UI,
      // .text is coming in under .settings.label
      this.text = values.text || values.settings.text || "*text";

      this.settings.format =
         this.settings.format || ABViewLabelPropertyComponentDefaults.format;
      this.settings.alignment =
         this.settings.alignment ||
         ABViewLabelPropertyComponentDefaults.alignment;

      // we are not allowed to have sub views:
      this._views = [];

      // convert from "0" => 0
      this.settings.format = parseInt(this.settings.format);
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }

   //// Allow external interface to manipulate our settings:

   /**
    * @method formatNormal
    * display text in the normal format.
    */
   formatNormal() {
      this.settings.format = 0;
   }

   /**
    * @method formatTitle
    * display text as a Title.
    */
   formatTitle() {
      this.settings.format = 1;
   }

   /**
    * @method formatDescription
    * display text as a description.
    */
   formatDescription() {
      this.settings.format = 2;
   }
};
