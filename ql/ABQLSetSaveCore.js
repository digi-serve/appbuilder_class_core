/*
/*
 * ABQLSetSaveCore
 *
 * An ABQLSetSave can store the current Data set into the Process Task it is
 * in, so that this data can be made available to other Process Tasks.
 *
 */

const ABQL = require("../../platform/ql/ABQL.js");

var ParameterDefinitions = [
   {
      type: "taskParam",
      name: "task_param"
   }
];

class ABQLSetSaveCore extends ABQL {
   constructor(attributes, prevOP, task, application) {
      super(attributes, ParameterDefinitions, prevOP, task, application);

      // TODO: register with the task that we can provide data.
      task.registerDatasource(this);
   }

   ///
   /// Instance Methods
   ///

   fromAttributes(attributes) {
      // #Hack! : when an Operation provides the same .NextQlOps that it
      // was defined in, we can't require it again ==> circular dependency.
      // so we manually set it here from the operation that created us:
      this.constructor.NextQLOps = this.prevOP.constructor.NextQLOps;

      super.fromAttributes(attributes);
      this.taskParam = attributes.taskParam || this.params.task_param;
   }

   toObj() {
      var obj = super.toObj();

      obj.taskParam = this.taskParam || this.params.task_param;

      return obj;
   }

   processDataFieldReference() {
      return this.taskParam;
   }
}

ABQLSetSaveCore.key = "set_save";
ABQLSetSaveCore.label = "save";
ABQLSetSaveCore.NextQLOps = [];
// NOTE: currently, this is an ending step. but it doesn't have to be...

module.exports = ABQLSetSaveCore;
