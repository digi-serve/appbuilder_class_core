// import ABApplication from "./ABApplication"
// const ABApplication = require("./ABApplication"); // NOTE: change to require()
const ABProcessElement = require("../../../platform/process/tasks/ABProcessElement.js");

var ABProcessTaskEmailDefaults = {
   category: "task",
   // category: {string} | null
   // if this Element should show up on one of the popup replace menus, then
   // specify one of the categories of elements it should be an option for.
   // Available choices: [ "start", "gateway", "task", "end" ].
   //
   // if it shouldn't show up under the popup menu, then leave this null

   fields: [
      "to",
      "from",
      "subject",
      "message",
      "toCustom",
      "fromCustom",
      "toUsers",
      "fromUsers",
      "toCustomFields",
      "fromCustomFields",
   ],
   // fields: {array}
   // a list of internal setting values this Element tracks

   icon: "email", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'
   // icon: {string}
   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   key: "Email",
   // key: {string}
   // unique key to reference this specific Task
};

module.exports = class ABProcessTaskEmailCore extends ABProcessElement {
   constructor(attributes, process, AB) {
      attributes.type = attributes.type || "process.task.email";
      super(attributes, process, AB, ABProcessTaskEmailDefaults);

      // listen
   }

   // return the default values for this DataField
   static defaults() {
      return ABProcessTaskEmailDefaults;
   }

   static DiagramReplace() {
      return {
         label: "Send Task",
         actionName: "replace-with-send-task",
         className: "bpmn-icon-send",
         target: {
            type: "bpmn:SendTask",
         },
      };
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

      ABProcessTaskEmailDefaults.fields.forEach((f) => {
         this[f] = attributes[f];
      });

      // check for warnings:

      if (!this.subject) {
         this.warningMessage("is missing a subject");
      }

      if (!this.message) {
         this.warningMessage("is missing a message");
      }
   }

   /**
    * onProcessReady()
    * Perform our warnings checks once the parent Process is ready
    */
   onProcessReady() {
      this.verifySetting("to");
      this.verifySetting("from");
      this.verifyNextLane("to");
      if (this.from == "0") {
         let thisLane = this.myLane();
         if (!thisLane) {
            this.warningMessage(
               "can not resolve the lane participant for [.from] field."
            );
         }
      }
      this.verifyRoleAccount("to", "toUsers");
      this.verifyRoleAccount("from", "fromUsers");
   }

   /**
    * @method verifySetting()
    * make sure the given field key has a value assigned.
    * @param {string} key
    *        the property of this object to check. (to, from)
    */
   verifySetting(key) {
      if (this[key] == "") {
         this.warningMessage(`does not have a [${key}] setting.`);
      }
   }

   /**
    * @method verifyNextLane()
    * make sure we can access a Lane for the given property key.
    * The "to" field can reference the "Next Participant". This checks to
    * see if we can reference a lane for the next task.
    * @param {string} key
    *        the property that has the value for Next Participant. [to]
    */
   verifyNextLane(key) {
      if (this[key] === "0") {
         // Next Participant
         // we need to resolve our next task and see if we can pull the participant info from it.

         let nextTasks = this.process.connectionNextTask(this);
         let nextLanesResolved = true;
         nextTasks.forEach((t) => {
            let lane = t.myLane();
            if (!lane) {
               nextLanesResolved = false;
            }
         });
         if (!nextLanesResolved || nextTasks.length == 0) {
            this.warningMessage(
               `can not resolve next lane participant for [${key}] field.`
            );
         }
      }
   }

   /**
    * @method verifyRoleAccount()
    * Check to see if the provided property is set to use a Role/Account for
    * the email, and make sure there are values set for what is chosen.
    * @param {string} key
    *        the property we are currently validating.
    * @param {string} valKey
    *        the property that contains the specific value object.
    */
   verifyRoleAccount(key, valKey) {
      if (this[key] == "1") {
         if (this[valKey]) {
            if (this[valKey].useRole) {
               if (this[valKey].role.length == 0) {
                  this.warningMessage(`can not resolve [${key}] Role setting.`);
               }
            }
            if (this[valKey].useAccount) {
               if (this[valKey].account.length == 0) {
                  this.warningMessage(
                     `can not resolve [${key}] Account setting.`
                  );
               }
            }
            // TODO:
            // if (this[valKey].userFields.length > 0) {
            //    // how to know if this is a problem?
            // }
         }
      }
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

      ABProcessTaskEmailDefaults.fields.forEach((f) => {
         data[f] = this[f];
      });

      return data;
   }

   ////
   //// Process Instance Methods
   ////

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
   //         // for testing:
   //         var myState = this.myState(instance);
   //         myState.status = "completed";
   //         this.log(instance, "Email Sent successfully");
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
         to: [],
         from: [],
         subject: this.subject,
         message: this.message,
      };

      super.initState(context, myDefaults, val);
   }
};
