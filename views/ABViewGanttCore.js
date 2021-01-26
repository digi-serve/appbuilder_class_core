const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewGanttPropertyComponentDefaults = {
   dataviewID: "", // uuid of ABDatacollection
   titleFieldID: "",
   startDateFieldID: "",
   endDateFieldID: "",
   durationFieldID: "",
   progressFieldID: "",
   notesFieldID: ""
};

const ABViewDefaults = {
   key: "gantt", // {string} unique key for this view
   icon: "tasks", // {string} fa-[icon] reference for this view
   labelKey: "ab.components.gantt" // {string} the multilingual label key for the class label
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

      this.settings.dataviewID =
         this.settings.dataviewID ||
         ABViewGanttPropertyComponentDefaults.dataviewID;

      this.settings.titleFieldID =
         this.settings.titleFieldID ||
         ABViewGanttPropertyComponentDefaults.titleFieldID;

      this.settings.startDateFieldID =
         this.settings.startDateFieldID ||
         ABViewGanttPropertyComponentDefaults.startDateFieldID;

      this.settings.endDateFieldID =
         this.settings.endDateFieldID ||
         ABViewGanttPropertyComponentDefaults.endDateFieldID;

      this.settings.durationFieldID =
         this.settings.durationFieldID ||
         ABViewGanttPropertyComponentDefaults.durationFieldID;

      this.settings.progressFieldID =
         this.settings.progressFieldID ||
         ABViewGanttPropertyComponentDefaults.progressFieldID;

      this.settings.notesFieldID =
         this.settings.notesFieldID ||
         ABViewGanttPropertyComponentDefaults.notesFieldID;
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }
};

