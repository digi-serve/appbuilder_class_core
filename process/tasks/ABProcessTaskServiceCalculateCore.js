const ABProcessElement = require("../../../platform/process/tasks/ABProcessElement.js");

let CalculateDefaults = {
   category: null,
   // category: {string} | null
   // if this Element should show up on one of the popup replace menus, then
   // specify one of the categories of elements it should be an option for.
   // Available choices: [ "start", "gateway", "task", "end" ].
   //
   // if it shouldn't show up under the popup menu, then leave this null

   icon: "calculator", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'
   // icon: {string}
   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   instanceValues: [],
   // instanceValues: {array}
   // a list of values this element tracks as it is operating in a process.

   key: "Calculate",
   // key: {string}
   // unique key to reference this specific Task

   settings: ["formulaText"]
};

module.exports = class CalculateTaskCore extends ABProcessElement {
   constructor(attributes, process, application) {
      attributes.type = attributes.type || "process.task.service.calculate";
      super(attributes, process, application, CalculateDefaults);

      // listen
   }

   // return the default values for this DataField
   static defaults() {
      return CalculateDefaults;
   }

   static DiagramReplace() {
      return null;
   }

   /**
    * processDataFields()
    * return an array of avaiable data fields that this element
    * can provide to other ProcessElements.
    * Different Process Elements can make data available to other
    * process Elements.
    * @return {array} | null
    */
   processDataFields() {
      return {
         key: `${this.id}.value`,
         label: `${this.label}->Value`
      };
   }
};
