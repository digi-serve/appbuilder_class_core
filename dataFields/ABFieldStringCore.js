/*
 * ABFieldString
 *
 * An ABFieldString defines a string field type.
 *
 */

var ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
    // TODO:
    return altText; // AD.lang.label.getLabel(key) || altText;
}

var ABFieldStringDefaults = {
    key: "string", // unique key to reference this specific DataField
    // type : 'string', // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
    icon: "font", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

    // menuName: what gets displayed in the Editor drop list
    menuName: L("ab.dataField.string.menuName", "*Single line text"),

    // description: what gets displayed in the Editor description.
    description: L("ab.dataField.string.description", "*short string value"),

    supportRequire: true
};

module.exports = class ABFieldStringCore extends ABField {
    constructor(values, object) {
        super(values, object, ABFieldStringDefaults);

        /*
    	{
			settings: {
				default: 'string',
				supportMultilingual: 1/0
			}
    	}
    	*/

        // we're responsible for setting up our specific settings:
        this.settings.default = values.settings.default || "";
        this.settings.supportMultilingual =
            values.settings.supportMultilingual + "" || "0";

        // text to Int:
        this.settings.supportMultilingual = parseInt(
            this.settings.supportMultilingual
        );
    }

    // return the default values for this DataField
    static defaults() {
        return ABFieldStringDefaults;
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
        // if no default value is set, then don't insert a value.
        if (!values[this.columnName]) {
            // Set default string
            if (this.settings.default) {
                values[this.columnName] = this.settings.default;
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
            var max_length = 255;

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

    /*
     * @property isMultilingual
     * does this field represent multilingual data?
     * @return {bool}
     */
    get isMultilingual() {
        return this.settings.supportMultilingual == 1;
    }
};
