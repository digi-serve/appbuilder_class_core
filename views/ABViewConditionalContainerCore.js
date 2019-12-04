const ABViewContainer = require("../../platform/views/ABViewContainer");

const ABViewPropertyDefaults = {
	dataviewID: null,
	filterConditions: {}
}

const ABViewDefaults = {
	key: 'conditionalcontainer',	// unique key identifier for this ABView
	icon: 'shield',					// icon reference: (without 'fa-' )
	labelKey: 'ab.components.conditionalcontainer' // {string} the multilingual label key for the class label
}

module.exports = class ABViewConditionalContainerCore extends ABViewContainer {

	constructor(values, application, parent, defaultValues) {

		super(values, application, parent, (defaultValues || ABViewDefaults));

		// the conditional container always has 'If' and 'Else' panels
		if (this.views(v => v instanceof ABViewContainer).length < 2) {

			// 'If' panel
			var ifPanel = application.viewNew({
				key: ABViewContainer.common().key,
				label: 'If',
				settings: {
					removable: false
				}
			}, application, this);
			this._views.push(ifPanel);

			// 'Else' panel
			var elsePanel = application.viewNew({
				key: ABViewContainer.common().key,
				label: 'Else',
				settings: {
					removable: false
				}
			}, application, this);
			this._views.push(elsePanel);

		}

	}

	static common() {
		return ABViewDefaults;
	}

	static defaultValues() {
		return ABViewPropertyDefaults;
	}

}