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

    }

    // return the default values for this DataField
    static defaults() {
        return ABFieldBooleanDefaults;
    }

    static defaultValues() {
        return defaultValues;
    }

    ///
    /// Instance Methods
    ///

    /**
	 * @method fromValues()
	 *
	 * initialze this object with the given set of values.
	 * @param {obj} values
	 */
	fromValues(values) {

		super.fromValues(values);

		if (this.settings.default != null)
			this.settings.default = parseInt(this.settings.default);

	}

    /**
     * @method defaultValue
     * insert a key=>value pair that represent the default value
     * for this field.
     * @param {obj} values a key=>value hash of the current values.
     */
    defaultValue(values) {
        if (values[this.columnName] == null && this.settings.default != null) {
            values[this.columnName] = this.settings.default;
        }
    }
};
