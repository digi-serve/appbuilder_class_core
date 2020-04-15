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
   require("../../platform/process/tasks/ABProcessEnd"),
   require("../../platform/process/tasks/ABProcessGatewayExclusive"),
   require("../../platform/process/tasks/ABProcessTaskEmail"),
   require("../../platform/process/tasks/ABProcessTaskService"),
   require("../../platform/process/tasks/ABProcessTaskServiceQuery"),
   require("../../platform/process/tasks/ABProcessTaskUser"),
   require("../../platform/process/tasks/ABProcessTaskUserApproval"),
   require("../../platform/process/tasks/ABProcessTrigger"),
   require("../../platform/process/tasks/ABProcessTriggerLifecycle")
];

AllProcessElements.forEach((ELEMENT) => {
   Tasks[ELEMENT.defaults().key] = ELEMENT;

   switch (ELEMENT.defaults().category) {
      case "start":
      case "end":
         DEFINITIONTYPES[
            ELEMENT.DiagramReplace().target.eventDefinitionType
         ] = ELEMENT.defaults();
         break;

      case "gateway":
      case "task":
         DEFINITIONTYPES[
            ELEMENT.DiagramReplace().target.type
         ] = ELEMENT.defaults();
         break;
   }
});

module.exports = {
   /*
    * @function allTasks
    * return all the currently defined ABProcessTasks in an array.
    * @return [{ABProcessTask},...]
    */
   allTasks: function() {
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
   newTask: function(values, object, application) {
      if (values.key) {
         return new Tasks[values.key](values, object, application);
      } else {
         //// TODO: what to do here?
      }
   },

   DiagramReplaceDefinitionsForType: function(type) {
      var definitions = AllProcessElements.filter((e) => {
         return e.defaults().category == type;
      }).map((e) => {
         return e.DiagramReplace();
      });
      return definitions;
   },

   StartEvents: function() {
      return this.DiagramReplaceDefinitionsForType("start");
   },

   Gateways: function() {
      return this.DiagramReplaceDefinitionsForType("gateway");
   },

   Tasks: function() {
      return this.DiagramReplaceDefinitionsForType("task");
   },

   EndEvents: function() {
      return this.DiagramReplaceDefinitionsForType("end");
   },

   definitionForElement: function(element) {
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
   }
};
