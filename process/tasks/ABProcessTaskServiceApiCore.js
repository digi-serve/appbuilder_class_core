import ABProcessElement from "../../../platform/process/tasks/ABProcessElement.js";

let ApiDefaults = {
   category: null,
   // category: {string} | null
   // if this Element should show up on one of the popup replace menus, then
   // specify one of the categories of elements it should be an option for.
   // Available choices: [ "start", "gateway", "task", "end" ].
   //
   // if it shouldn't show up under the popup menu, then leave this null

   icon: "exchange", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'
   // icon: {string}
   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   instanceValues: [],
   // instanceValues: {array}
   // a list of values this element tracks as it is operating in a process.

   key: "Api",
   // key: {string}
   // unique key to reference this specific Task

   settings: [
      "url",
      "method",
      "headers",
      "body",
      "responseJson",
      "storedSecrets",
   ],
   responseJson: 1,
   headers: [],
};

export default class ApiTaskCore extends ABProcessElement {
   constructor(attributes, process, AB) {
      attributes.type = attributes.type || "process.task.service.api";
      super(attributes, process, AB, ApiDefaults);
   }

   // return the default values for this DataField
   static defaults() {
      return ApiDefaults;
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
      const label = `${this.label}->rawResponse`;
      if (!this._fakeField) {
         this._fakeObj = this.AB.objectNew({});
         this._fakeField = this.AB.fieldNew(
            { key: "string", name: label, label },
            this._fakeObj,
         );
      }
      return [
         {
            key: `${this.id}.rawResponse`,
            label,
            field: this._fakeField,
         },
      ];
   }
}
