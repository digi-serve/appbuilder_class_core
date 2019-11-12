const ABView = require("../../platform/views/ABView");

const ABViewFormFieldPropertyComponentDefaults = {
	required: 0,
	disable: 0
}

module.exports = class ABViewFormComponentCore extends ABView {

	constructor(values, application, parent, defaultValues) {

		super(values, application, parent, defaultValues);

	}

	static defaultValues() {
		return ABViewFormFieldPropertyComponentDefaults;
	}

	field() {

		let form = this.parentFormComponent();
		if (form == null) return null;

		let object;
		if (form._currentObject) {
			object = form._currentObject;
		}
		else {

			let dataview = form.dataview;
			if (dataview == null) return null;

			object = dataview.datasource;
		}

		if (object == null) return null;

		let field = object.fields((v) => v.id == this.settings.fieldId, true)[0];
		return field;
	}

}