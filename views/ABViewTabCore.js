const ABViewWidget = require("../../platform/views/ABViewWidget");
const ABViewContainer = require("../../platform/views/ABViewContainer");

const ABViewTabPropertyComponentDefaults = {
	height: 0,
	minWidth: 0,
	stackTabs: 0, // use sidebar view instead of tabview
	darkTheme: 0, // set dark theme css or not
	sidebarWidth: 200, // width of sidebar menu when stacking tabs
	sidebarPos: "left", // the default position of sidebar
	iconOnTop: 0 // do you want to put the icon above the text label?
}

const ABViewTabDefaults = {
	key: 'tab',						// {string} unique key for this view
	icon: 'window-maximize',		// {string} fa-[icon] reference for this view
	labelKey: 'ab.components.tab'	// {string} the multilingual label key for the class label
}

module.exports = class ABViewTabCore extends ABViewWidget {

	/**
	 * @param {obj} values  key=>value hash of ABView values
	 * @param {ABApplication} application the application object this view is under
	 * @param {ABViewWidget} parent the ABViewWidget this view is a child of. (can be null)
	 */
	constructor(values, application, parent, defaultValues) {

		super(values, application, parent, defaultValues || ABViewTabDefaults);

	}

	static common() {
		return ABViewTabDefaults;
	}

	static defaultValues() {
		return ABViewTabPropertyComponentDefaults;
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

		// convert from "0" => 0
		this.settings.height = parseInt(this.settings.height);
		this.settings.minWidth = parseInt(this.settings.minWidth || 0);
		this.settings.stackTabs = parseInt(this.settings.stackTabs);
		this.settings.darkTheme = parseInt(this.settings.darkTheme);
		this.settings.sidebarWidth = parseInt(this.settings.sidebarWidth);
		this.settings.sidebarPos = this.settings.sidebarPos;
		this.settings.iconOnTop = parseInt(this.settings.iconOnTop);

	}

	addTab(tabName, tabIcon) {

		return this.application.viewNew({
			key: ABViewContainer.common().key,
			label: tabName,
			tabicon: tabIcon
		}, this.application, this).save();

	}


	/**
	 * @method componentList
	 * return the list of components available on this view to display in the editor.
	 */
	componentList() {
		return [];
	}

};