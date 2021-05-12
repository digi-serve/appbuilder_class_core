const ABProcessTrigger = require("../../../platform/process/tasks/ABProcessTrigger.js");

var ABProcessTaskTriggerLifecycleDefaults = {
   category: "start",
   // category: {string} | null
   // if this Element should show up on one of the popup replace menus, then
   // specify one of the categories of elements it should be an option for.
   // Available choices: [ "start", "gateway", "task", "end" ].
   //
   // if it shouldn't show up under the popup menu, then leave this null

   fields: [
      "repeatEvery",
      "repeatTime",
      "repeatDaily",
      "repeatWeekly",
      "repeatMonthly",
      "isEnabled"
   ],
   // fields: {array}
   // a list of internal setting values this Element tracks

   icon: "clock-o", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'
   // icon: {string}
   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   key: "TimerStartEvent",
   // key: {string}
   // unique key to reference this specific Task

   repeatEvery: "daily",
   repeatTime: "01:00",
   repeatDaily: "day",
   repeatWeekly: "FRI",
   repeatMonthly: "last",
   isEnabled: true
};

module.exports = class ABProcessTriggerTimer extends ABProcessTrigger {
   constructor(attributes, process, application) {
      attributes.type = attributes.type || "trigger";
      super(
         attributes,
         process,
         application,
         ABProcessTaskTriggerLifecycleDefaults
      );
   }

   // return the default values for this DataField
   static defaults() {
      return ABProcessTaskTriggerLifecycleDefaults;
   }

   static DiagramReplace() {
      return {
         label: "Timer Start Event",
         actionName: "replace-with-signal-timer-start",
         // type: {string} a unique key to reference this element
         className: "bpmn-icon-start-event-timer",
         target: {
            type: "bpmn:StartEvent",
            // type: {string} the general bpmn category
            //      "StartEvent", "Task", "EndEvent", "ExclusiveGateway"
            eventDefinitionType: "ab:SignalTriggerTimer"
         }
      };
   }

   fromValues(attributes) {
      super.fromValues(attributes);

      this.repeatEvery =
         attributes.repeatEvery ||
         ABProcessTaskTriggerLifecycleDefaults.repeatEvery;

      this.repeatDaily =
         attributes.repeatDaily ||
         ABProcessTaskTriggerLifecycleDefaults.repeatDaily;

      this.repeatWeekly =
         attributes.repeatWeekly ||
         ABProcessTaskTriggerLifecycleDefaults.repeatWeekly;

      this.repeatMonthly =
         attributes.repeatMonthly ||
         ABProcessTaskTriggerLifecycleDefaults.repeatMonthly;

      // Convert UTC to local time
      if (attributes.repeatTime) {
         let timeVals = attributes.repeatTime.split(":");
         let currDate = new Date();
         currDate.setUTCHours(timeVals[0]);
         currDate.setUTCMinutes(timeVals[1]);
         this.repeatTime = `${currDate.getHours()}:${currDate.getMinutes()}`;
      } else {
         this.repeatTime = ABProcessTaskTriggerLifecycleDefaults.repeatTime;
      }

      this.isEnabled = JSON.parse(
         attributes.isEnabled || ABProcessTaskTriggerLifecycleDefaults.isEnabled
      );
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

      data.repeatEvery = this.repeatEvery;
      data.repeatDaily = this.repeatDaily;
      data.repeatWeekly = this.repeatWeekly;
      data.repeatMonthly = this.repeatMonthly;

      // Convert local time to UTC
      data.repeatTime = this.repeatTime;
      if (data.repeatTime && data.repeatTime instanceof Date) {
         data.repeatTime = `${data.repeatTime.getUTCHours()}:${data.repeatTime.getMinutes()}`;
      }

      data.isEnabled = this.isEnabled;

      return data;
   }

   getCronExpression() {
      let timeVals = this.repeatTime.split(":");
      let hour = timeVals[0];
      let minute = timeVals[1];
      let day;
      let month;
      let dayWeek;

      switch (this.repeatEvery) {
         case "daily":
            day = "*";
            month = "*";
            dayWeek = this.repeatDaily == "weekday" ? "1-5" : "*";
            break;
         case "weekly":
            day = "*";
            month = "*";
            dayWeek = this.repeatWeekly;
            break;
         case "monthly":
            day = "*";
            month = "*";
            dayWeek = this.repeatMonthly;
            break;
      }

      return `${minute} ${hour} ${day} ${month} ${dayWeek}`;
   }
};

