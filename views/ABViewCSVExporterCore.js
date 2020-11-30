const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewCSVExporterDefaults = {
   key: "csvExporter", // unique key identifier for this ABViewForm
   icon: "download", // icon reference: (without 'fa-' )
   labelKey: "ab.components.csvExporter", // {string} the multilingual label key for the class label
};

const ABViewCSVExporterPropertyComponentDefaults = {
   dataviewID: null,
   where: null,
   buttonLabel: "Export CSV",
   filename: "exportCSV",
   hasHeader: true,
   width: 150,
};

module.exports = class ABViewCSVExporterCore extends ABViewWidget {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABViewCSVExporterDefaults
      );
   }

   static common() {
      return ABViewCSVExporterDefaults;
   }

   static defaultValues() {
      return ABViewCSVExporterPropertyComponentDefaults;
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

      // convert to boolean
      if (typeof values.settings.hasHeader == "string")
         this.settings.hasHeader = JSON.parse(values.settings.hasHeader);

      if (this.settings.hasHeader == null)
         this.settings.hasHeader =
            ABViewCSVExporterPropertyComponentDefaults.hasHeader;

      // convert from "0" => 0
      this.settings.width = parseInt(
         values.settings.width ||
            ABViewCSVExporterPropertyComponentDefaults.width
      );
   }
};
