module.exports = class ABRoleCore {

	constructor(values, application) {

		this.application = application;

		this.fromValues(values);

	}

	fromValues(values = {}) {

		this.id = values.id;
		this.usernames = values.usernames || [];
		this.translations = values.translations;

	}

	toObj() {

		return {
			usernames: this.usernames || [],
			translations: this.translations
		};

	}


}