/**
 * ABProcessTaskUserCore
 *
 * This defines the base User Task element that can be placed on a BPMN
 * diagram.  In our system, we will let the designer choose a sub class
 * to make active for this element.
 *
 * Currently a UserTask expects a human user to perform an action.  These
 * actions are in the possible forms:
 *  - confirm offline action
 *  - approve data
 *  - fill out a form
 *
 */

const ABProcessElement = require("../../../platform/process/tasks/ABProcessElement.js");

var ABProcessTaskUserDefaults = {
    category: "task",
    // category: {string} | null
    // if this Element should show up on one of the popup replace menus, then
    // specify one of the categories of elements it should be an option for.
    // Available choices: [ "start", "task", "end" ].
    //
    // if it shouldn't show up under the popup menu, then leave this null

    fields: [],
    // fields: {array}
    // a list of internal setting values this Element tracks

    icon: "user", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'
    // icon: {string}
    // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

    key: "TaskUser"
    // key: {string}
    // unique key to reference this specific Task
};

module.exports = class ABProcessTaskUserCore extends ABProcessElement {
    constructor(attributes, process, application) {
        attributes.type = attributes.type || "process.task.user";
        super(attributes, process, application, ABProcessTaskUserDefaults);

        // listen
    }

    // return the default values for this DataField
    static defaults() {
        return ABProcessTaskUserDefaults;
    }

    static DiagramReplace() {
        // taken from "bpmn-js/lib/features/replace/ReplaceOptions"
        return {
            label: "User Task",
            actionName: "replace-with-user-task",
            className: "bpmn-icon-user",
            target: {
                type: "bpmn:UserTask"
            }
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

        this.defaults.fields.forEach((f) => {
            this[f] = attributes[f];
        });
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

        this.defaults.fields.forEach((f) => {
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
            roles: [],
            ui: null
        };

        super.initState(context, myDefaults, val);
    }
};
