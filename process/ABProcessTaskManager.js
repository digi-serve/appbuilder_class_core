import Import_ABProcessEnd from "../../platform/process/tasks/ABProcessEnd.js";
import Import_ABProcessGatewayExclusive from "../../platform/process/tasks/ABProcessGatewayExclusive.js";
import Import_ABProcessTaskEmail from "../../platform/process/tasks/ABProcessTaskEmail.js";
import Import_ABProcessTaskService from "../../platform/process/tasks/ABProcessTaskService.js";
import Import_ABProcessTaskServiceAccountingBatchProcessing from "../../platform/process/tasks/ABProcessTaskServiceAccountingBatchProcessing.js";
import Import_ABProcessTaskServiceAccountingFPClose from "../../platform/process/tasks/ABProcessTaskServiceAccountingFPClose.js";
import Import_ABProcessTaskServiceAccountingFPYearClose from "../../platform/process/tasks/ABProcessTaskServiceAccountingFPYearClose.js";
import Import_ABProcessTaskServiceAccountingJEArchive from "../../platform/process/tasks/ABProcessTaskServiceAccountingJEArchive.js";
import Import_ABProcessTaskServiceApi from "../../platform/process/tasks/ABProcessTaskServiceApi.js";
import Import_ABProcessTaskServiceCalculate from "../../platform/process/tasks/ABProcessTaskServiceCalculate.js";
import Import_ABProcessTaskServiceInsertRecord from "../../platform/process/tasks/ABProcessTaskServiceInsertRecord.js";
import Import_ABProcessTaskServiceQuery from "../../platform/process/tasks/ABProcessTaskServiceQuery.js";
import Import_ABProcessTaskServiceGetResetPasswordUrl from "../../platform/process/tasks/ABProcessTaskServiceGetResetPasswordUrl.js";
import Import_ABProcessTaskSubProcess from "../../platform/process/tasks/ABProcessTaskSubProcess.js";
import Import_ABProcessTaskUser from "../../platform/process/tasks/ABProcessTaskUser.js";
import Import_ABProcessTaskUserApproval from "../../platform/process/tasks/ABProcessTaskUserApproval.js";
import Import_ABProcessTaskUserExternal from "../../platform/process/tasks/ABProcessTaskUserExternal.js";
import Import_ABProcessTaskUserForm from "../../platform/process/tasks/ABProcessTaskUserForm.js";
import Import_ABProcessTrigger from "../../platform/process/tasks/ABProcessTrigger.js";
import Import_ABProcessTriggerLifecycle from "../../platform/process/tasks/ABProcessTriggerLifecycle.js";
import Import_ABProcessTriggerTimer from "../../platform/process/tasks/ABProcessTriggerTimer.js";

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
   Import_ABProcessEnd,
   Import_ABProcessGatewayExclusive,
   Import_ABProcessTaskEmail,
   Import_ABProcessTaskService,
   Import_ABProcessTaskServiceAccountingBatchProcessing,
   Import_ABProcessTaskServiceAccountingFPClose,
   Import_ABProcessTaskServiceAccountingFPYearClose,
   Import_ABProcessTaskServiceAccountingJEArchive,
   Import_ABProcessTaskServiceApi,
   Import_ABProcessTaskServiceCalculate,
   Import_ABProcessTaskServiceInsertRecord,
   Import_ABProcessTaskServiceQuery,
   Import_ABProcessTaskServiceGetResetPasswordUrl,
   Import_ABProcessTaskSubProcess,
   Import_ABProcessTaskUser,
   Import_ABProcessTaskUserApproval,
   Import_ABProcessTaskUserExternal,
   Import_ABProcessTaskUserForm,
   Import_ABProcessTrigger,
   Import_ABProcessTriggerLifecycle,
   Import_ABProcessTriggerTimer,
];

AllProcessElements.forEach((ELEMENT) => {
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
