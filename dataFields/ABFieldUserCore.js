/*
 * ABFieldUser
 *
 * An ABFieldUser defines a user field type.
 *
 */

var ABField = require("../../platform/dataFields/ABField");
// import ABFieldSelectivity from "./ABFieldSelectivity"
// import ABFieldComponent from "./ABFieldComponent"

function L(key, altText) {
    // TODO:
    return altText; // AD.lang.label.getLabel(key) || altText;
}

var ABFieldUserDefaults = {
    key: "user", // unique key to reference this specific DataField
    icon: "user-o", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

    // menuName: what gets displayed in the Editor drop list
    menuName: L("ab.dataField.user.menuName", "*User"),

    // description: what gets displayed in the Editor description.
    description: L("ab.dataField.user.description", "*Add user/s to a record."),
    isSortable: (field) => {
        if (field.settings.isMultiple) {
            return false;
        } else {
            return true;
        }
    },
    isFilterable: (field) => {
        if (field.settings.isMultiple) {
            return false;
        } else {
            return true;
        }
    },

    supportRequire: false
};

var defaultValues = {
    editable: 1,
    isMultiple: 0,
    isCurrentUser: 0
};

module.exports = class ABFieldUserCore extends ABField {
    constructor(values, object) {
        super(values, object, ABFieldUserDefaults);

        // we're responsible for setting up our specific settings:
        for (var dv in defaultValues) {
            this.settings[dv] = values.settings[dv] || defaultValues[dv];
        }

        this.settings.editable = parseInt(this.settings.editable);
        this.settings.isMultiple = parseInt(this.settings.isMultiple);
        this.settings.isCurrentUser = parseInt(this.settings.isCurrentUser);
    }

    // return the default values for this DataField
    static defaults() {
        return ABFieldUserDefaults;
    }

    ///
    /// Instance Methods
    ///

    ///
    /// Working with Actual Object Values:
    ///

    /**
     * @method defaultValue
     * insert a key=>value pair that represent the default value
     * for this field.
     * @param {obj} values a key=>value hash of the current values.
     */
    defaultValue(values) {
        if (this.settings.isCurrentUser) {
            if (this.settings.isMultiple) {
                values[this.columnName] = [
                    {
                        id: OP.User.username(),
                        text: OP.User.username()
                    }
                ];
            } else {
                values[this.columnName] = OP.User.username();
            }
        }
    }

    /**
     * @method isValidData
     * Parse through the given data and return an error if this field's
     * data seems invalid.
     * @param {obj} data  a key=>value hash of the inputs to parse.
     * @param {OPValidator} validator  provided Validator fn
     * @return {array}
     */
    isValidData(data, validator) {
        super.isValidData(data, validator);
    }

    format(rowData) {
        var val = rowData[this.columnName] || [];

        if (!Array.isArray(val) || val) val = [val];

        return val.map((v) => v.text || v).join(", ");
    }
};
