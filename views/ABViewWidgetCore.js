const ABView = require("../../platform/views/ABView");

const ABViewDefaults = {
	key: 'viewwidget',		// {string} unique key for this view
	icon: 'circle-o-notch ',		// {string} fa-[icon] reference for this view
	labelKey: 'ab.components.widget' // {string} the multilingual label key for the class label
}

const ABPropertyComponentDefaults = {
	columnSpan: 1,
	rowSpan: 1
}

module.exports = class ABViewWidgetCore extends ABView {

	/**
	 * @param {obj} values  key=>value hash of ABView values
	 * @param {ABApplication} application the application object this view is under
	 * @param {ABView} parent the ABView this view is a child of. (can be null)
	 * @param {obj} defaultValues special sub class defined default values.
	 */
	constructor(values, application, parent, defaultValues) {
		super(values, application, parent, defaultValues || ABViewDefaults);
	}

	static common() {
		return ABViewDefaults;
	}

	static defaultValues() {
		return ABPropertyComponentDefaults;
	}

	/**
	 * @method fromValues()
	 *
	 * initialze this object with the given set of values.
	 * @param {obj} values
	 */
	fromValues(values) {

		super.fromValues(values);

		// convert from "0" => 0
		this.settings.columnSpan = parseInt(this.settings.columnSpan || ABPropertyComponentDefaults.columnSpan);
		this.settings.rowSpan = parseInt(this.settings.rowSpan || ABPropertyComponentDefaults.rowSpan);

	}


};