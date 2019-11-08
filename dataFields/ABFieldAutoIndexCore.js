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

var ABFieldAutoIndexDefaults = {
	key: 'AutoIndex', // unique key to reference this specific DataField
	icon: 'key',   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'		

	// menuName: what gets displayed in the Editor drop list
	menuName: L('ab.dataField.AutoIndex.menuName', '*Auto Index'),

	// description: what gets displayed in the Editor description.
	description: L('ab.dataField.AutoIndex.description', '*Auto Increment Value'),

};

// defaultValues: the keys must match a .name of your elements to set it's default value.
var defaultValues = {
	displayLength: 4
}

/**
 * 
 * Private methods 
 * 
 */
function getDelimiterSign(text) {
	var delimiterItem = ABFieldAutoIndexCore.delimiterList().filter((item) => {
		return item.id == text;
	})[0];

	return delimiterItem ? delimiterItem.sign : '';
}

module.exports = class ABFieldAutoIndexCore extends ABField {

	constructor(values, object) {
		super(values, object, ABFieldAutoIndexDefaults);

	}

	// return the default values for this DataField
	static defaults() {
		return ABFieldAutoIndexDefaults;
	}

	static defaultValues() {
		return defaultValues;
	}

	static delimiterList() {
		return [
			{ id: 'comma', value: "Comma", sign: ", " },
			{ id: 'slash', value: "Slash", sign: "/" },
			{ id: 'space', value: "Space", sign: " " },
			{ id: 'dash', value: "Dash", sign: "-" },
			{ id: 'colon', value: "Colon", sign: ":" },
		];
	}

	static setValueToIndex(prefix, delimiter, displayLength, displayNumber) {
		var resultIndex = prefix + getDelimiterSign(delimiter) + ("0000000000" + displayNumber).slice(-parseInt(displayLength));

		return resultIndex;
	}


	fromValues(values) {

		super.fromValues(values);

		// text to Int:
		this.settings.displayLength = parseInt(this.settings.displayLength);

	}

	/**
	 * @method defaultValue
	 * insert a key=>value pair that represent the default value
	 * for this field.
	 * @param {obj} values a key=>value hash of the current values.
	 */
	defaultValue(values) {
		// Remove every values, then we will use AUTO_INCREMENT of MySQL
		delete values[this.columnName];
	}

	format(rowData) {

		if (!rowData[this.columnName])
			return "";

		try {
			var resultAutoIndex = ABFieldAutoIndexCore.setValueToIndex(this.settings.prefix, this.settings.delimiter, this.settings.displayLength, rowData[this.columnName]);

			return resultAutoIndex;
		}
		catch (err) {
			return "";
		}

	}

}