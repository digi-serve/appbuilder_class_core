const ABProcessElement = require("../../../platform/process/tasks/ABProcessElement.js");

var ABProcessTaskEndDefaults = {
   category: "end",
   // category: {string} | null
   // if this Element should show up on one of the popup replace menus, then
   // specify one of the categories of elements it should be an option for.
   // Available choices: [ "start", "gateway", "task", "end" ].
   //
   // if it shouldn't show up under the popup menu, then leave this null

   fields: [],
   // fields: {array}
   // a list of internal setting values this Element tracks

   icon: "stop", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'
   // icon: {string}
   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   key: "End"
   // key: {string}
   // unique key to reference this specific Task
};

module.exports = class ABProcessTaskEndCore extends ABProcessElement {
   constructor(attributes, process, application) {
      attributes.type = attributes.type || "process.task.end";
      super(attributes, process, application, ABProcessTaskEndDefaults);

      // listen
   }

   // return the default values for this DataField
   static defaults() {
      return ABProcessTaskEndDefaults;
   }

   static DiagramReplace() {
      return {
         label: "Terminate End Event",
         actionName: "replace-with-terminate-end",
         className: "bpmn-icon-end-event-terminate",
         target: {
            type: "bpmn:EndEvent",
            eventDefinitionType: "bpmn:TerminateEventDefinition"
         }
      };
   }

   /**
    * do()
    * this method actually performs the action for this task.
    * @param {obj} instance  the instance data of the running process
    * @return {Promise}
    *      resolve(true/false) : true if the task is completed.
    *                            false if task is still waiting
    */
   // do(instance) {
   //     return new Promise((resolve, reject) => {
   //         // An End Event doesn't perform any other actions
   //         // than to signal it has successfully completed.
   //         // But it provides no Additional Tasks to work on.
   //         // for testing:
   //         this.stateCompleted(instance);
   //         this.log(instance, "End Event Reached");
   //         resolve(true);
   //     });
   // }

   /**
    * initState()
    * setup this task's initial state variables
    * @param {obj} context  the context data of the process instance
    * @param {obj} val  any values to override the default state
    */
   initState(context, val) {
      var myDefaults = {
         triggered: false
      };

      super.initState(context, myDefaults, val);
   }

   /**
    * nextTasks()
    * return the next tasks to be run after this task is complete.
    * @param {obj} instance  the instance data of the running process
    * @return {Promise}
    *      resolve([])
    */
   nextTasks(instance) {
      // I'm an End Event.  There are no nextTasks()
      return [];
   }
};
