const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABRecordRule = require("../../rules/ABViewRuleListFormRecordRules");

const ABViewCSVImporterDefaults = {
   key: "csvImporter",
   // {string}
   // unique key identifier for this ABViewForm

   icon: "upload",
   // {string}
   // font-awesome icon reference: (without 'fa-' )

   labelKey: "ab.components.csvImporter",
   // {string}
   // the multilingual label key for the class label
};

const ABViewCSVImporterPropertyComponentDefaults = {
   dataviewID: null,
   // {uuid}
   // The ABDataCollection.uuid that we are using to store the data.
   // NOTE: we actually use the DC to get the ABObject it is connected to.

   availableFieldIds: [],
   //{array}
   // A list of ABField.ids that are allowed to be imported using this widget.

   buttonLabel: "Upload CSV",
   // {string}
   // The Label(key) to display on the initial button

   width: 0,
   // {integer}
   // Width of the Popup.

   recordRules: [],
   // {array}  [ {RecordRule}, ... ]
   // A list of ABViewRuleListFormRecordRules that should be performed upon
   // each row of data imported.
   // The Array should look like:
   // [{
   //    action: {string},
   //    when: [
   //       {
   //          fieldId: {UUID},
   //          comparer: {string},
   //          value: {string}
   //       }
   //    ],
   //    values: [
   //       {
   //          fieldId: {UUID},
   //          value: {object}
   //       }
   //    ]
   // }]
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

   /**
    * @method common()
    * Provides the default settings for an instance of an ABViewCSVImporter
    * @return {json}
    */
   static common() {
      return ABViewCSVImporterDefaults;
   }

   /**
    * @method defaultValues()
    * Provides the default settings for an instance of an ABViewCSVImporter
    * Component that is displayed on the UI.
    * @return {json}
    */
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

   get RecordRule() {
      let object = this.datacollection?.datasource;
      if (!object) return;

      if (this._recordRule == null) {
         this._recordRule = new ABRecordRule();
      }

      this._recordRule.formLoad(this);
      this._recordRule.fromSettings(this.settings.recordRules);
      this._recordRule.objectLoad(object);

      return this._recordRule;
   }

   doRecordRulesPre(rowDatas) {
      if (rowDatas && !Array.isArray(rowDatas)) {
         rowDatas = [rowDatas];
      }

      rowDatas.forEach((row) => {
         this.RecordRule?.processPre({ data: row.data || row, form: this });
      });
   }

   doRecordRules(rowDatas) {
      if (rowDatas && !Array.isArray(rowDatas)) {
         rowDatas = [rowDatas];
      }

      if (!this.RecordRule) return Promise.resolve();

      let tasks = [];

      rowDatas.forEach((row) => {
         tasks.push(
            this.RecordRule.process({ data: row.data || row, form: this })
         );
      });

      return Promise.all(tasks);
   }
};
