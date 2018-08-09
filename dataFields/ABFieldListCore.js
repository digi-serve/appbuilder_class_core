/*
 * ABFieldListCore
 *
 * An ABFieldList defines a select list field type.
 *
 */

var ABField = require("../../platform/dataFields/ABField");


function L(key, altText) {
// TODO:
	return altText;  // AD.lang.label.getLabel(key) || altText;
}


var ABFieldListDefaults = {
	key: 'list', // unique key to reference this specific DataField

	icon: 'th-list',   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

	// menuName: what gets displayed in the Editor drop list
	menuName: L('ab.dataField.list.menuName', '*Select list'),

	// description: what gets displayed in the Editor description.
	description: L('ab.dataField.list.description', '*Select list allows you to select predefined options below from a dropdown.'),
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
	hasColors: (field) => {
		if (field.settings.hasColors) {
			return true;
		} else {
			return false;
		}
	},

	supportRequire: true

};


var defaultValues = {
	isMultiple: 0,
	hasColors: 0,
	options: [],
	default: 'none',
	multipleDefault: []
};


var colors = [
	["#F44336", "#E91E63", "#9C27B0", "#673AB7"], 
	["#3F51B5", "#2196F3", "#03A9F4", "#00BCD4"], 
	["#009688", "#4CAF50", "#8BC34A", "#CDDC39"], 
	["#FFEB3B", "#FFC107", "#FF9800", "#FF5722"], 
	["#795548", "#9E9E9E", "#607D8B", "#000000"]
];





module.exports = class ABFieldListCore extends ABField {
	constructor(values, object) {

		super(values, object, ABFieldListDefaults);

		// we're responsible for setting up our specific settings:
		for (var dv in defaultValues) {
			this.settings[dv] = values.settings[dv] || defaultValues[dv];
		}

		this.pendingDeletions = [];

	}

	// return the default values for this DataField
	static defaults() {
		return ABFieldListDefaults;
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

		// translate options list
		if (this.settings.options && this.settings.options.length > 0) {
			this.settings.options.forEach((opt) => {
				this.object.application.translate(opt, opt, ["text"]);
			});
		}

		this.settings.isMultiple = parseInt(this.settings.isMultiple);
		this.settings.hasColors = parseInt(this.settings.hasColors);

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

		var obj = super.toObj();

		// Un-translate options list
		obj.settings.options.forEach(function (opt) {
			this.object.application.unTranslate(opt, opt, ["text"]);
		});

		return obj;
	}




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
		// Multiple select list
		if (this.settings.isMultiple == true) {
			values[this.columnName] = this.settings.multipleDefault || [];
		}
		// Single select list
		else if (this.settings.default && this.settings.default != '') {
			values[this.columnName] = this.settings.default;
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




	/**
	 * @method options
	 * Return an array of [{ id, text }] options defined by this field.
	 * @return {array} 
	 */
	options() {
		return this.settings.options.map((opt)=>{ return { id:opt.id, text: opt.text }});
	}


	format(rowData) {

		var val = rowData[this.columnName] || [];

		// Convert to array
		if (!Array.isArray(val))
			val = [val];

		var displayOpts = this.settings.options
							.filter(opt => val.filter(v => v == opt.id).length > 0)
							.map(opt => opt.text);

		return displayOpts.join(', ');

	}


}
