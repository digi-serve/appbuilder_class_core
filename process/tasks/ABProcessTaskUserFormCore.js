import ABProcessElement from "../../../platform/process/tasks/ABProcessElement.js";

const ABProcessTaskUserFormDefaults = {
   category: null,
   // category: {string} | null
   // if this Element should show up on one of the popup replace menus, then
   // specify one of the categories of elements it should be an option for.
   // Available choices: [ "start", "gateway", "task", "end" ].
   //
   // if it shouldn't show up under the popup menu, then leave this null

   icon: "form", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'
   // icon: {string}
   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   instanceValues: [""],
   // instanceValues: {array}
   // a list of values this element tracks as it is operating in a process.

   key: "Form",
   // key: {string}
   // unique key to reference this specific Task

   settings: ["formBuilder"],
   // settings: {array}
   // a list of internal setting values this Element tracks. These are the
   // values set by the platform .propertiesStash()
};

const settings = {};

export default class ABProcessTaskUserFormCore extends ABProcessElement {
   constructor(attributes, process, AB) {
      for (const key in settings)
         attributes[key] = attributes[key] ?? settings[key];
      super(
         Object.assign(
            {
               type: "process.task.service.form",
            },
            attributes,
         ),
         process,
         AB,
         ABProcessTaskUserFormDefaults,
      );

      // listen
   }

   // return the default values for this DataField
   static defaults() {
      return ABProcessTaskUserFormDefaults;
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
      return (this.formBuilder?.components ?? [])
         .filter((comp) => comp.type != "button")
         .map((comp) => {
            return {
               key: comp.key,
               label: `${this.label}->${comp.label}`,
            };
         });
   }

   /**
    * processData()
    * return the current value requested for the given data key.
    * @param {obj} instance
    * @return {mixed} | null
    */
   processData(instance, key) {
      if (!key) return null;

      const myState = this.myState(instance);

      return myState[key];
   }
}
