const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABRecordRule = require("../../rules/ABViewRuleListFormRecordRules");

const ABViewCSVImporterDefaults = {
   key: "csvImporter", // unique key identifier for this ABViewForm
   icon: "upload", // icon reference: (without 'fa-' )
   labelKey: "ab.components.csvImporter" // {string} the multilingual label key for the class label
};

const ABViewCSVImporterPropertyComponentDefaults = {
   dataviewID: null,
   buttonLabel: "Upload CSV",
   width: 0,

   //	[{
   //		action: {string},
   //		when: [
   //			{
   //				fieldId: {UUID},
   //				comparer: {string},
   //				value: {string}
   //			}
   //		],
   //		values: [
   //			{
   //				fieldId: {UUID},
   //				value: {object}
   //			}
   //		]
   //	}]
   recordRules: []
};

module.exports = class ABViewCSVImporterCore extends ABViewWidget {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABViewCSVImporterDefaults
      );
   }

   static common() {
      return ABViewCSVImporterDefaults;
   }

   static defaultValues() {
      return ABViewCSVImporterPropertyComponentDefaults;
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
         this.settings.width || ABViewCSVImporterPropertyComponentDefaults.width
      );
   }

   doRecordRules(rowData) {
      let object = this.datacollection.datasource;

      let RecordRules = new ABRecordRule();
      RecordRules.formLoad(this);
      RecordRules.fromSettings(this.settings.recordRules);
      RecordRules.objectLoad(object);

      return RecordRules.process({ data: rowData, form: this });
   }
};

