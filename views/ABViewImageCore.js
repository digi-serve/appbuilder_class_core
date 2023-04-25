const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewImagePropertyComponentDefaults = {
   filename: "",
   width: 200,
   height: 100,
};

const ABViewDefaults = {
   key: "image", // {string} unique key for this view
   icon: "picture-o", // {string} fa-[icon] reference for this view
   labelKey: "Image", // {string} the multilingual label key for the class label
};

module.exports = class ABViewImageCore extends ABViewWidget {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewImagePropertyComponentDefaults;
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }

   /**
    * @property datacollection
    * return data source
    * NOTE: this view doesn't track a DataCollection.
    * @return {ABDataCollection}
    */
   get datacollection() {
      return null;
   }

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
         this.settings.width || ABViewImagePropertyComponentDefaults.width
      );
      this.settings.height = parseInt(
         this.settings.height || ABViewImagePropertyComponentDefaults.height
      );
   }
};
