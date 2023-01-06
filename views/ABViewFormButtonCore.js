const ABView = require("../../platform/views/ABView");

const ABViewFormButtonPropertyComponentDefaults = {
   includeSave: 1,
   saveLabel: "",
   includeCancel: 0,
   cancelLabel: "",
   includeReset: 0,
   resetLabel: "",
   afterCancel: null,
   alignment: "right",
   isDefault: 0, // mark default button of form widget
};

const ABViewFormButtonDefaults = {
   key: "button",
   // {string} unique key for this view

   icon: "square",
   // {string} fa-[icon] reference for this view

   labelKey: "Button",
   // {string} the multilingual label key for the class label
};

module.exports = class ABViewFormButtonCore extends ABView {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABViewFormButtonDefaults
      );
   }

   static common() {
      return ABViewFormButtonDefaults;
   }

   static defaultValues() {
      return ABViewFormButtonPropertyComponentDefaults;
   }

   ///
   /// Instance Methods
   ///

   toObj() {
      // labels are multilingual values:
      let labels = [];

      if (this.settings.saveLabel) labels.push("saveLabel");

      if (this.settings.cancelLabel) labels.push("cancelLabel");

      if (this.settings.resetLabel) labels.push("resetLabel");

      this.unTranslate(this.settings, this.settings, labels);

      const result = super.toObj();

      return result;
   }

   fromValues(values) {
      super.fromValues(values);

      // labels are multilingual values:
      const labels = [];

      if (this.settings.saveLabel) labels.push("saveLabel");

      if (this.settings.cancelLabel) labels.push("cancelLabel");

      if (this.settings.resetLabel) labels.push("resetLabel");

      this.unTranslate(this.settings, this.settings, labels);

      this.settings.includeSave = parseInt(
         this.settings.includeSave ??
            ABViewFormButtonPropertyComponentDefaults.includeSave
      );
      this.settings.includeCancel = parseInt(
         this.settings.includeCancel ??
            ABViewFormButtonPropertyComponentDefaults.includeCancel
      );
      this.settings.includeReset = parseInt(
         this.settings.includeReset ??
            ABViewFormButtonPropertyComponentDefaults.includeReset
      );
      this.settings.isDefault = parseInt(
         this.settings.isDefault ??
            ABViewFormButtonPropertyComponentDefaults.isDefault
      );
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }
};
