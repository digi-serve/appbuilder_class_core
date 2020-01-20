module.exports = class ABScopeCore {

	constructor(values, application) {

		this.application = application;

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
		this.isGlobal = JSON.parse(values.isGlobal || false);

		this._objects = [];
		if (values.objects) {
			(values.objects || []).forEach(o => {
				let obj = this.application.objectNew(o);
				this._objects.push(obj);
			})
		}

		// multilingual fields: name, description
		this.application.translate(this, this, ['name', 'description']);

	}

	toObj() {

		this.application.unTranslate(this, this, ['name', 'description']);

		return {
			id: this.id,
			translations: this.translations,
			createdBy: this.createdBy,
			filter: this.filter,
			isGlobal: this.isGlobal,
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