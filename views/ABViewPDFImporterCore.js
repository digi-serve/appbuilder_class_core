const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewPDFImporterPropertyComponentDefaults = {
   dataviewID: null,
   fieldID: null,
};

const ABViewDefaults = {
   key: "pdfImporter", // {string} unique key for this view
   icon: "file-pdf-o", // {string} fa-[icon] reference for this view
   labelKey: "PDF Importer", // {string} the multilingual label key for the class label
};

module.exports = class ABViewPDFImporterCore extends ABViewWidget {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewPDFImporterPropertyComponentDefaults;
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

      this.settings.dataviewID =
         this.settings.dataviewID ??
         ABViewPDFImporterPropertyComponentDefaults.dataviewID;

      this.settings.fieldID =
         this.settings.fieldID ??
         ABViewPDFImporterPropertyComponentDefaults.fieldID;

      // Convert to boolean
      //   this.settings.removeMissed = JSON.parse(
      //      this.settings.removeMissed ||
      //         ABViewPDFImporterPropertyComponentDefaults.removeMissed
      //   );

      // "0" -> 0
      //   this.settings.height = parseInt(
      //      this.settings.height ||
      //         ABViewPDFImporterPropertyComponentDefaults.height
      //   );
   }

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABViewLabel instance
    * into the values needed for saving.
    *
    * @return {json}
    */
   toObj() {
      var obj = super.toObj();

      obj.settings = obj.settings ?? {};

      return obj;
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }
};
