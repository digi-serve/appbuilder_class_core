const ABProcessElement = require("../../../platform/process/tasks/ABProcessElement.js");

const ABQLManager = require("../../../platform/ql/ABQLManager.js");

const ABProcessTaskServiceQueryDefaults = {
   category: null,
   // category: {string} | null
   // if this Element should show up on one of the popup replace menus, then
   // specify one of the categories of elements it should be an option for.
   // Available choices: [ "start", "gateway", "task", "end" ].
   //
   // if it shouldn't show up under the popup menu, then leave this null

   icon: "check-circle", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'
   // icon: {string}
   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   instanceValues: [],
   // instanceValues: {array}
   // a list of values this element tracks as it is operating in a process.

   key: "TaskServiceQuery",
   // key: {string}
   // unique key to reference this specific Task

   settings: ["qlObj"],
   // settings: {array}
   // a list of internal setting values this Element tracks. These are the
   // values set by the platform .propertiesStash()
};

module.exports = class ABProcessTaskServiceQueryCore extends ABProcessElement {
   constructor(attributes, process, AB) {
      attributes.type = attributes.type || "process.task.service.query";
      super(attributes, process, AB, ABProcessTaskServiceQueryDefaults);

      // listen
   }

   // return the default values for this DataField
   static defaults() {
      return ABProcessTaskServiceQueryDefaults;
   }

   static DiagramReplace() {
      return null;
   }

   fromValues(attributes) {
      super.fromValues(attributes);

      // Before we make instances of qlObj:
      this._datasources = [];

      // comvert our qlObj into an ABQLxxx instance.
      if (this.qlObj) {
         this.qlObj = ABQLManager.fromAttributes(this.qlObj, this, this.AB);
      }
   }

   /**
    * @method toObj()
    * properly compile the current state of this object instance
    * into the values needed for saving to the DB.
    * @return {json}
    */
   toObj() {
      const data = super.toObj();

      // convert qlObj into obj format:
      if (this.qlObj) {
         data.qlObj = this.qlObj.toObj();
      }

      return data;
   }

   registerDatasource(obj) {
      this._datasources.push(obj);
   }

   ////
   //// Process Instance Methods
   ////

   /**
    * initState()
    * setup this task's initial state variables
    * @param {obj} context  the context data of the process instance
    * @param {obj} val  any values to override the default state
    */
   /*
    initState(context, val) {
        const myDefaults = {
            instanceVariable1: null,
            instanceVariable2: null
        };

        super.initState(context, myDefaults, val);
    }
    */

   /**
    * processDataFields()
    * return an array of avaiable data fields that this element
    * can provide to other ProcessElements.
    * Different Process Elements can make data available to other
    * process Elements.
    * @return {array} | null
    */
   processDataFields() {
      // in this Task, we can return the Response to the UserForm
      let fields = null;

      if (this._datasources.length > 0) {
         fields = [];

         this._datasources.forEach((s) => {
            const param = s.processDataField(this.id, this.label);

            if (param) {
               fields.push(param);
            }
         });
      }

      return fields;
   }

   /**
    * processData()
    * return the current value requested for the given data key.
    * @param {obj} instance
    * @return {mixed} | null
    */
   processData(instance, key) {
      const parts = key.split(".");
      if (parts[0] == this.id) {
         const myState = this.myState(instance);
         return myState[parts[1]];
      }
      return null;
   }
};
