const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewKanbanPropertyComponentDefaults = {
	dataviewID: "", // uuid of ABDatacollection
	verticalGroupingField: "", // uuid of ABField
	horizontalGroupingField: "", // uuid of ABField
	ownerField: "", // uuid of ABField
};

const ABViewDefaults = {
	key: 'kanban',			// {string} unique key for this view
	icon: 'columns',			// {string} fa-[icon] reference for this view
	labelKey: 'ab.components.kanban' // {string} the multilingual label key for the class label
};

module.exports = class ABViewKanbanCore extends ABViewWidget {

	constructor(values, application, parent, defaultValues) {

		super(values, application, parent, defaultValues || ABViewDefaults);

	}

	static common() {
		return ABViewDefaults;
	}

	static defaultValues() {
		return ABViewKanbanPropertyComponentDefaults;
	}

}