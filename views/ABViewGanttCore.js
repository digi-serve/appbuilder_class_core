const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewGanttPropertyComponentDefaults = {
   dataviewID: "",
   // {string}
   // {ABDatacollection.id} of the datacollection that contains the data for
   // the Gantt chart.

   titleFieldID: "",
   // {string}
   // {ABFieldXXX.id} of the field that contains the value of the title
   // ABFieldString, ABFieldLongText

   startDateFieldID: "",
   // {string}
   // {ABFieldDate.id} of the field that contains the start date

   endDateFieldID: "",
   // {string}
   // {ABFieldDate.id} of the field that contains the end date

   durationFieldID: "",
   // {string}
   // {ABFieldNumber.id} of the field that contains the duration

   progressFieldID: "",
   // {string}
   // {ABFieldNumber.id} of the field that marks the progress

   notesFieldID: "",
   // {string}
   // {ABFieldXXX.id} of the field that contains the value of the title
   // ABFieldString, ABFieldLongText
};

const ABViewDefaults = {
   key: "gantt", // {string} unique key for this view
   icon: "tasks", // {string} fa-[icon] reference for this view
   labelKey: "ab.components.gantt", // {string} the multilingual label key for the class label
};

module.exports = class ABViewGanttCore extends ABViewWidget {
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
      return ABViewGanttPropertyComponentDefaults;
   }

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      Object.keys(ABViewGanttPropertyComponentDefaults).forEach((k) => {
         this.settings[k] =
            this.settings[k] || ABViewGanttPropertyComponentDefaults[k];
      });
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }
};
