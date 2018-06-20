/*
 * ABViewContainerCore
 *
 * An ABViewContainerCore defines a UI display component.
 *
 * A container might have multiple columns of display info.
 *
 */

var ABView = require("../../platform/views/ABView");

// function L(key, altText) {
// 	return AD.lang.label.getLabel(key) || altText;
// }


var ABViewDefaults = {
	key: 'viewcontainer',	// {string} unique key for this view
	icon: 'braille',		// {string} fa-[icon] reference for this view
	labelKey: 'ab.components.container' // {string} the multilingual label key for the class label
}



module.exports =  class ABViewContainerCore extends ABView {

	/**
	 * @param {obj} values  key=>value hash of ABView values
	 * @param {ABApplication} application the application object this view is under
	 * @param {ABView} parent the ABView this view is a child of. (can be null)
	 * @param {obj} defaultValues special sub class defined default values.
	 */
	constructor(values, application, parent, defaultValues) {

		super(values, application, parent, (defaultValues || ABViewDefaults));

	}


	static common() {
		return ABViewDefaults;
	}


	/**
	 * @method toObj()
	 *
	 * properly compile the current state of this ABView instance
	 * into the values needed for saving to the DB.
	 *
	 * @return {json}
	 */
	// toObj() {

	// 	var obj = super.toObj();

	// 	return obj;

	// }



	/**
	 * @method fromValues()
	 *
	 * initialze this object with the given set of values.
	 * @param {obj} values
	 */
	fromValues(values) {

		super.fromValues(values);

		// convert from "0" => 0
		this.settings.columns = parseInt(this.settings.columns || ABPropertyComponentDefaults.columns);

		if (typeof this.settings.gravity != "undefined") {
			this.settings.gravity = this.settings.gravity.map(function(gravity) {
				return parseInt(gravity);
			});
		}

	}


}