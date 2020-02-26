const ABApplication = require("../platform/ABApplication");

module.exports = class ABScopeCore {

	constructor(values) {

		// this.application = application;

		this.fromValues(values);

	}

	fromValues(values = {}) {

		this.id = values.id;
		this.name = values.name;
		this.description = values.description;
		this.translations = values.translations;

		// username
		this.createdBy = values.createdBy;

		// json
		this.filter = values.filter;

		// boolean
		this.allowAll = JSON.parse(values.allowAll || false);

		this._objects = [];
		if (values.objects) {
			let mockApp = new ABApplication({});
			(values.objects || []).forEach(o => {
				let obj = mockApp.objectNew(o);
				this._objects.push(obj);
			})
		}

		// multilingual fields: name, description
		// this.application.translate(this, this, ['name', 'description']);

	}

	toObj() {

		// this.application.unTranslate(this, this, ['name', 'description']);

		return {
			id: this.id,
			translations: this.translations,
			createdBy: this.createdBy,
			filter: this.filter,
			allowAll: this.allowAll || false,
			objectIds: this.objects().map(o => o.id)
		};

	}

	objects(filterFn) {

		if (filterFn == null)
			return (this._objects || []);
		else
			return (this._objects || []).filter(filterFn);
	}

};
