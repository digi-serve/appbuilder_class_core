/*
 * ABFieldBoolean
 *
 * An ABFieldBoolean defines a boolean field type.
 *
 */

var ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
    // TODO:
    return altText; // AD.lang.label.getLabel(key) || altText;
}

var ABFieldBooleanDefaults = {
    key: "boolean", // unique key to reference this specific DataField

    icon: "check-square-o", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

    // menuName: what gets displayed in the Editor drop list
    menuName: L("ab.dataField.boolean.menuName", "*Checkbox"),

    // description: what gets displayed in the Editor description.
    description: L(
        "ab.dataField.boolean.description",
        "*A single checkbox that can be checked or unchecked."
    ),

    supportRequire: true
};

var defaultValues = {
    default: 0
};

module.exports = class ABFieldBooleanCore extends ABField {
    constructor(values, object) {
        super(values, object, ABFieldBooleanDefaults);

        // we're responsible for setting up our specific settings:
        for (var dv in defaultValues) {
            this.settings[dv] = values.settings[dv] || defaultValues[dv];
        }

        if (this.settings.default != null)
            this.settings.default = parseInt(this.settings.default);
    }

    // return the default values for this DataField
    static defaults() {
        return ABFieldBooleanDefaults;
    }

    ///
    /// Instance Methods
    ///

    /**
     * @method defaultValue
     * insert a key=>value pair that represent the default value
     * for this field.
     * @param {obj} values a key=>value hash of the current values.
     */
    defaultValue(values) {
        if (values[this.columnName] == null) {
            values[this.columnName] = this.settings.default;
        }
    }
};
