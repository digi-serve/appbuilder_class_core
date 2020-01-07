module.exports = class ABRoleCore {

	constructor(values, application) {

		this.application = application;
		this._scopes = [];

		this.fromValues(values);

	}

	fromValues(values = {}) {

		this.id = values.id;
		this.name = values.name;
		this.description = values.description;
		this.translations = values.translations;

	}

	toObj() {

		return {
			id: this.id,
			translations: this.translations
		};

	}

	///
	/// Scopes
	///

	/**
	 * @method scopes()
	 *
	 * return an array of all the ABScope for this ABApplication.
	 *
	 * @param {fn} filter  	a filter fn to return a set of ABScope that
	 *						this fn returns true for.
	 * @return {array} 	array of ABScope
	 */
	scopes(filter) {
		filter =
			filter ||
			function () {
				return true;
			};

		return (this._scopes || []).filter(filter);
	}


}