const ABViewFormComponent = require("../../platform/views/ABViewFormComponent");

const ABViewFormReadonlyPropertyComponentDefaults = {
};

const ABViewFormReadonlyDefaults = {
	key: 'fieldreadonly',		// {string} unique key for this view
	icon: 'calculator',			// {string} fa-[icon] reference for this view
	labelKey: 'ab.components.readonly' // {string} the multilingual label key for the class label
};

module.exports = class ABViewFormReadonly extends ABViewFormComponent {

	constructor(values, application, parent, defaultValues) {

		super(values, application, parent, (defaultValues || ABViewFormReadonlyDefaults));

	}

	static common() {
		return ABViewFormReadonlyDefaults;
	}

	static defaultValues() {
		return ABViewFormReadonlyPropertyComponentDefaults;
	}

	/**
	 * @method componentList
	 * return the list of components available on this view to display in the editor.
	 */
	componentList() {
		return [];
	}

}