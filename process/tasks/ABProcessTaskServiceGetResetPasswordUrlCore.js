// import ABApplication from "./ABApplication"
// const ABApplication = require("./ABApplication"); // NOTE: change to require()
const ABProcessElement = require("../../../platform/process/tasks/ABProcessElement.js");

const ABProcessTaskGetResetPasswordUrlDefaults = {
   category: null,
   // category: {string} | null
   // if this Element should show up on one of the popup replace menus, then
   // specify one of the categories of elements it should be an option for.
   // Available choices: [ "start", "gateway", "task", "end" ].
   //
   // if it shouldn't show up under the popup menu, then leave this null

   icon: "plus-circle", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'
   // icon: {string}
   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   instanceValues: [],
   // instanceValues: {array}
   // a list of values this element tracks as it is operating in a process.

   key: "GetResetPasswordUrl",
   // key: {string}
   // unique key to reference this specific Task

   settings: ["email"],
   // settings: {array}
   // a list of internal setting values this Element tracks. These are the
   // values set by the platform .propertiesStash()
};

module.exports = class ABProcessTaskGetResetPasswordUrlCore extends (
   ABProcessElement
) {
   constructor(attributes, process, AB) {
      attributes.type =
         attributes.type || "process.task.service.getResetPasswordUrl";
      super(attributes, process, AB, ABProcessTaskGetResetPasswordUrlDefaults);

      // listen
   }

   // return the default values for this DataField
   static defaults() {
      return ABProcessTaskGetResetPasswordUrlDefaults;
   }

   static DiagramReplace() {
      return null;
   }

   fromValues(attributes) {
      /*
        {
            id: uuid(),
            name: 'name',
            type: 'xxxxx',
            json: "{json}"
        }
        */

      super.fromValues(attributes);

      if (!this.email) {
         this.warningMessage("is missing the email address.");
      }
   }

   onProcessReady() {
      const processData = (this.process.processDataFields(this) ?? [])
         .filter((item) => item.field?.key == "email")
         .map((item) => {
            return {
               id: item.key,
               value: item.label,
            };
         });

      if (processData.length == 0) {
         this.warningMessage(
            "this process has no previous tasks exporting email fields."
         );
      }
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
         key: `${this.id}.url`,
         label: `${this.label}->URL`,
      };
   }
};
