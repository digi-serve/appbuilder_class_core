const ABProcessElement = require("../../../platform/process/tasks/ABProcessElement.js");

var ABProcessGatewayExclusiveDefaults = {
   category: "gateway",
   // category: {string} | null
   // if this Element should show up on one of the popup replace menus, then
   // specify one of the categories of elements it should be an option for.
   // Available choices: [ "start", "gateway", "task", "end" ].
   //
   // if it shouldn't show up under the popup menu, then leave this null

   icon: "check-circle",
   // icon: {string}
   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to
   // reference 'fa-user'

   instanceValues: [],
   // instanceValues: {array}
   // a list of values this element tracks as it is operating in a process.

   key: "GatewayExclusive",
   // key: {string}
   // unique key to reference this specific Task

   settings: ["conditions"],
   // settings: {array}
   // a list of internal setting values this Element tracks. These are the
   // values set by the platform .propertiesStash()
};

module.exports = class ABProcessGatewayExclusiveCore extends ABProcessElement {
   constructor(attributes, process, AB) {
      attributes.type = attributes.type || "process.gateway.exclusive";
      super(attributes, process, AB, ABProcessGatewayExclusiveDefaults);

      // listen
   }

   // return the default values for this DataField
   static defaults() {
      return ABProcessGatewayExclusiveDefaults;
   }

   static DiagramReplace() {
      return {
         label: "Exclusive Gateway",
         actionName: "replace-with-exclusive-gateway",
         className: "bpmn-icon-gateway-xor",
         target: {
            type: "bpmn:ExclusiveGateway",
         },
      };
   }

   /*
   fromValues(attributes) {
      /*
        {
            id: uuid(),
            name: 'name',
            type: 'xxxxx',
            json: "{json}"
        }
        * /
      super.fromValues(attributes);
   }
   */

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
   /*
    toObj() {
        var data = super.toObj();

        ABProcessGatewayExclusiveDefaults.fields.forEach((f) => {
            data[f] = this[f];
        });

        return data;
    }
    */

   ////
   //// Process Instance Methods
   ////

   /**
    * onProcessReady()
    * Perform our warnings checks once the parent Process is ready
    */
   onProcessReady() {
      // make sure we have > 1 connection.
      const myOutgoingConnections = this.process.connectionsOutgoing(
         this.diagramID
      );
      if (myOutgoingConnections.length < 2) {
         this.emit(
            "warning",
            `Gateway[${this.name}] should have multiple outgoing connections`,
            { task: this.id }
         );
      }

      // make sure there is no more then 1 connection that doesn't have
      // a condition:
      let numCondWithOne = 0;
      myOutgoingConnections.forEach((c) => {
         if ((this.conditions[c.id]?.filterValue.rules?.length ?? 0) == 0) {
            numCondWithOne++;
         }
      });

      if (numCondWithOne > 1) {
         this.emit(
            "warning",
            `Gateway[${this.name}] should not have more than 1 unfiltered connection.`
         );
      }
   }

   /**
    * initState()
    * setup this task's initial state variables
    * @param {obj} context  the context data of the process instance
    * @param {obj} val  any values to override the default state
    */
   /*
    initState(context, val) {
        var myDefaults = {
            userFormID: null,
            userFormResponse: null
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
   /*
    processDataFields() {
        // in this Task, we can return the Response to the UserForm
        return [
            {
                key: `${this.id}.userFormResponse`,
                label: `${this.label}->Response`
            }
        ];
    }
    */

   /**
    * processData()
    * return the current value requested for the given data key.
    * @param {obj} instance
    * @return {mixed} | null
    */
   /*
    processData(instance, key) {
        var parts = key.split(".");
        if (parts[0] == this.id) {
            var myState = this.myState(instance);
            return myState[parts[1]];
        }
        return null;
    }
    */
};
