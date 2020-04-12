const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewDocxBuilderPropertyComponentDefaults = {
   buttonlabel: "Download DOCX",
   dataviewID: null,
   width: 0,
   filename: "", // uuid
   filelabel: "output.docx",
   language: "en", // en
   toolbarBackground: "ab-background-default",
   buttonPosition: "left"
};

const ABViewDefaults = {
   key: "docxBuilder", // {string} unique key for this view
   icon: "file-word-o", // {string} fa-[icon] reference for this view
   labelKey: "ab.components.docxBuilder" // {string} the multilingual label key for the class label
};

module.exports = class ABViewDocxBuilderCore extends ABViewWidget {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewDocxBuilderPropertyComponentDefaults;
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
      this.settings.width = parseInt(
         this.settings.width || ABViewDocxBuilderPropertyComponentDefaults.width
      );
   }

   uploadUrl() {
      let actionKey =
         "opstool.AB_" + this.application.name.replace("_", "") + ".view";

      return (
         "/" +
         ["opsportal", "file", this.application.name, actionKey, "1"].join("/")
      );
   }

   downloadUrl() {
      return `/opsportal/file/${this.application.name}/${this.settings.filename}`;
   }

   get languageCode() {
      return (
         this.settings.language ||
         ABViewDocxBuilderPropertyComponentDefaults.language
      );
   }

   get datacollections() {
      let dataviewID = (this.settings || {}).dataviewID;
      if (!dataviewID) return [];

      let dvList = dataviewID.split(",") || [];

      return (
         this.application.datacollections((dv) => dvList.indexOf(dv.id) > -1) ||
         []
      );
   }
};
