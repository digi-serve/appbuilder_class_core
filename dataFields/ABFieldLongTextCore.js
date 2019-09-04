/*
 * ABFieldLongText
 *
 * An ABFieldLongText defines a LongText field type.
 *
 */

var ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
    // TODO:
    return altText; // AD.lang.label.getLabel(key) || altText;
}

var ABFieldLongTextDefaults = {
    key: "LongText", // unique key to reference this specific DataField
    type: "longtext",
    icon: "align-right", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

    // menuName: what gets displayed in the Editor drop list
    menuName: L("ab.dataField.LongText.menuName", "*Long text"),

    // description: what gets displayed in the Editor description.
    description: L(
        "ab.dataField.LongText.description",
        "*Multiple lines of text"
    ),

    supportRequire: true
};

// defaultValues: the keys must match a .name of your elements to set it's default value.
var defaultValues = {
    default: "",
    supportMultilingual: 0
};

module.exports = class ABFieldLongText extends ABField {
    constructor(values, object) {
        super(values, object, ABFieldLongTextDefaults);

        /*
    	{
			settings: {
				default: 'string',
				supportMultilingual: 1/0
			}
    	}
    	*/

        // we're responsible for setting up our specific settings:
        for (var dv in defaultValues) {
            this.settings[dv] = values.settings[dv] || defaultValues[dv];
        }

        // // text to Int:
        this.settings.supportMultilingual = parseInt(
            this.settings.supportMultilingual
        );
    }

    // return the default values for this DataField
    static defaults() {
        return ABFieldLongTextDefaults;
    }

    ///
    /// Instance Methods
    ///

    /*
     * @property isMultilingual
     * does this field represent multilingual data?
     * @return {bool}
     */
    get isMultilingual() {
        return this.settings.supportMultilingual == 1;
    }

    /**
     * @method defaultValue
     * insert a key=>value pair that represent the default value
     * for this field.
     * @param {obj} values a key=>value hash of the current values.
     */
    defaultValue(values) {
        if (values[this.columnName] == null) {
            if (typeof this.settings.default == "string") {
                values[this.columnName] = this.settings.default;
            } else {
                values[this.columnName] = "";
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

        if (data && data[this.columnName]) {
            var max_length = 5000;

            if (data[this.columnName].length > max_length) {
                validator.addError(
                    this.columnName,
                    "should NOT be longer than {max} characters".replace(
                        "{max}",
                        max_length
                    )
                );
            }
        }
    }
};
