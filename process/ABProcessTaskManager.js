/*
 * ABProcessTaskManager
 *
 * An interface for managing the different ABProcessTasks in AppBuilder.
 *
 */

/*
 * Tasks
 * A name => ABProcessElement hash of the different ABProcessElements available.
 */
var Tasks = {};

/*
 * DEFINITIONTYPES
 * a hash of BPMN:Element.type to Default values
 * for each of our Process Objects.
 *
 * NOTE: For Tasks, the key should be target.type,
 * for Triggers or End elements, the key should be
 * the target.eventDefinitionType
 */
var DEFINITIONTYPES = {};

var AllProcessElements = [
   await import("../../platform/process/tasks/ABProcessEnd"),
   await import("../../platform/process/tasks/ABProcessGatewayExclusive"),
   await import("../../platform/process/tasks/ABProcessTaskEmail"),
   await import("../../platform/process/tasks/ABProcessTaskService"),
   await import("../../platform/process/tasks/ABProcessTaskServiceAccountingBatchProcessing"),
   await import("../../platform/process/tasks/ABProcessTaskServiceAccountingFPClose"),
   await import("../../platform/process/tasks/ABProcessTaskServiceAccountingFPYearClose"),
   await import("../../platform/process/tasks/ABProcessTaskServiceAccountingJEArchive"),
   await import("../../platform/process/tasks/ABProcessTaskServiceCalculate"),
   await import("../../platform/process/tasks/ABProcessTaskServiceInsertRecord"),
   await import("../../platform/process/tasks/ABProcessTaskServiceQuery"),
   await import("../../platform/process/tasks/ABProcessTaskServiceGetResetPasswordUrl"),
   await import("../../platform/process/tasks/ABProcessTaskSubProcess"),
   await import("../../platform/process/tasks/ABProcessTaskUser"),
   await import("../../platform/process/tasks/ABProcessTaskUserApproval"),
   await import("../../platform/process/tasks/ABProcessTaskUserExternal"),
   await import("../../platform/process/tasks/ABProcessTrigger"),
   await import("../../platform/process/tasks/ABProcessTriggerLifecycle"),
   await import("../../platform/process/tasks/ABProcessTriggerTimer"),
];

AllProcessElements.forEach((ELEMENT) => {
   ELEMENT = ELEMENT.default;
   Tasks[ELEMENT.defaults().key] = ELEMENT;

   switch (ELEMENT.defaults().category) {
      case "start":
      case "end":
         DEFINITIONTYPES[ELEMENT.DiagramReplace().target.eventDefinitionType] =
            ELEMENT.defaults();
         break;

      case "gateway":
      case "task":
         DEFINITIONTYPES[ELEMENT.DiagramReplace().target.type] =
            ELEMENT.defaults();
         break;
   }
});

export default {
   /*
    * @function allTasks
    * return all the currently defined ABProcessTasks in an array.
    * @return [{ABProcessTask},...]
    */
   allTasks: function () {
      var tasks = [];
      for (var t in Tasks) {
         tasks.push(Tasks[t]);
      }
      return tasks;
   },

   /*
    * @function newTask
    * return an instance of an ABProcessTask based upon the values.type value.
    * @return {ABProcessTask}
    */
   newTask: function (values, process, AB) {
      if (values.key) {
         return new Tasks[values.key](values, process, AB);
      } else {
         //// TODO: what to do here?
      }
   },

   DiagramReplaceDefinitionsForType: function (type) {
      var definitions = AllProcessElements.filter((e) => {
         return e.defaults().category == type;
      }).map((e) => {
         return e.DiagramReplace();
      });
      return definitions;
   },

   StartEvents: function () {
      return this.DiagramReplaceDefinitionsForType("start");
   },

   Gateways: function () {
      return this.DiagramReplaceDefinitionsForType("gateway");
   },

   Tasks: function () {
      return this.DiagramReplaceDefinitionsForType("task");
   },

   EndEvents: function () {
      return this.DiagramReplaceDefinitionsForType("end");
   },

   definitionForElement: function (element) {
      // pull the key from the embedded .eventDefinition
      // if there is one
      var key = null;
      if (element.businessObject.eventDefinitions) {
         var def = element.businessObject.eventDefinitions[0];
         if (def) {
            key = def.$type;
         }
      }

      // if not, then just use the base .type
      if (!key) {
         key = element.type;
      }

      return DEFINITIONTYPES[key];
   },
};
