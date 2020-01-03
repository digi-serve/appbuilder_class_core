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

		// uuid
		this.objectId = values.objectId;

	}

	toObj() {

		return {
			id: this.id,
			translations: this.translations,
			createdBy: this.createdBy,
			filter: this.filter,
			isGlobal: this.isGlobal,
			objectId: this.objectId
		};

	}

};