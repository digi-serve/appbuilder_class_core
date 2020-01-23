// import ABApplication from "./ABApplication"
// const ABApplication = require("./ABApplication"); // NOTE: change to require()
const ABProcessTrigger = require("../../../platform/process/tasks/ABProcessTrigger.js");

var ABProcessTaskTriggerLifecycleDefaults = {
    category: "start",
    // category: {string} | null
    // if this Element should show up on one of the popup replace menus, then
    // specify one of the categories of elements it should be an option for.
    // Available choices: [ "start", "task", "end" ].
    //
    // if it shouldn't show up under the popup menu, then leave this null

    fields: [
        "objectID",
        "lifecycleKey" /* , "triggerKey" is tracked in ABProcessTrigger */
    ],
    // fields: {array}
    // a list of internal setting values this Element tracks

    icon: "key", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'
    // icon: {string}
    // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

    key: "TriggerLifecycle"
    // key: {string}
    // unique key to reference this specific Task
};

module.exports = class ABProcessTriggerLifecycle extends ABProcessTrigger {
    constructor(attributes, process, application) {
        attributes.type = attributes.type || "trigger";
        super(
            attributes,
            process,
            application,
            ABProcessTaskTriggerLifecycleDefaults
        );

        // listen
    }

    // return the default values for this DataField
    static defaults() {
        return ABProcessTaskTriggerLifecycleDefaults;
    }

    static DiagramReplace() {
        return {
            label: "Object Lifecycle Trigger",
            actionName: "replace-with-signal-lifecycle-start",
            // type: {string} a unique key to reference this element
            className: "bpmn-icon-start-event-signal",
            target: {
                type: "bpmn:StartEvent",
                // type: {string} the general bpmn category
                //      "StartEvent", "Task", "EndEvent", "ExclusiveGateway"
                eventDefinitionType: "ab:SignalLifecycle"
            }
        };
    }

    fromValues(attributes) {
        super.fromValues(attributes);

        this.objectID = attributes.objectID || "objID.??";
        this.lifecycleKey = attributes.lifecycleKey || "lifecycle.key??";
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

        data.objectID = this.objectID;
        data.lifecycleKey = this.lifecycleKey;
        return data;
    }
};
