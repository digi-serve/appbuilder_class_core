const ABViewWidget = require("../../platform/views/ABViewWidget");

module.exports = class ABViewDetailComponentCore extends ABViewWidget {

	constructor(values, application, parent, defaultValues) {
		super(values, application, parent, defaultValues);
	}

	detailComponent() {
		var detailView = null;

		var curr = this;
		while (!curr.isRoot() &&
			curr.parent &&
			curr.key != 'detail' &&
			curr.key != 'dataview') {

			curr = curr.parent;
		}

		if (curr.key == 'detail' || curr.key == 'dataview') {
			detailView = curr;
		}

		return detailView;
	}

	field() {

		let detailComponent = this.detailComponent();
		if (detailComponent == null) return null;

		let dataview = detailComponent.dataview;
		if (dataview == null) return null;

		let object = dataview.datasource;
		if (object == null) return null;

		let field = object.fields((v) => v.id == this.settings.fieldId, true)[0];

		// set .alias to support queries that contains alias name
		// [aliasName].[columnName]
		if (field && this.settings.alias) {
			field.alias = this.settings.alias;
		}

		return field;
	}


	getCurrentData() {

		var detailCom = this.detailComponent();
		if (!detailCom) return null;

		var dv = detailCom.dataview;
		if (!dv) return null;

		var field = this.field();
		if (!field) return null;

		var currData = dv.getCursor();
		if (currData)
			return currData[field.columnName];
		else
			return null;

	}

}