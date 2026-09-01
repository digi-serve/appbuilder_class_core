import ABProcessElement from "../../../platform/process/tasks/ABProcessElement.js";

var ABProcessTriggerDefaults = {
   category: "start",
   // category: {string} | null
   // if this Element should show up on one of the popup replace menus, then
   // specify one of the categories of elements it should be an option for.
   // Available choices: [ "start", "gateway", "task", "end" ].
   //
   // if it shouldn't show up under the popup menu, then leave this null

   fields: [],
   // fields: {array}
   // a list of internal setting values this Element tracks

   icon: "key", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'
   // icon: {string}
   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   key: "Trigger",
   // key: {string}
   // unique key to reference this specific Task
};

export default class ABProcessTriggerCore extends ABProcessElement {
   constructor(attributes, process, AB) {
      attributes.type = attributes.type || "trigger";
      super(attributes, process, AB, ABProcessTriggerDefaults);

      // listen
   }

   // return the default values for this DataField
   static defaults() {
      return ABProcessTriggerDefaults;
   }

   static DiagramReplace() {
      return {
         label: "Signal Start Event",
         actionName: "replace-with-signal-start",
         className: "bpmn-icon-start-event-signal",
         target: {
            type: "bpmn:StartEvent",
            // type: {string} the general bpmn category
            //      "StartEvent", "Task", "EndEvent", "ExclusiveGateway"
            eventDefinitionType: "bpmn:SignalEventDefinition",
         },
      };
   }

   fromValues(attributes) {
      super.fromValues(attributes);

      this.triggerKey = attributes.triggerKey || "triggerKey.??";
   }

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABApplication instance
    * into the values needed for saving to the DB.
    *
    * Most of the instance data is stored in .json field, so be sure to
    * update that from all the current values of our child fields.
    *
    * @return {json}
    */
   toObj() {
      var data = super.toObj();

      data.triggerKey = this.triggerKey;

      return data;
   }
}
