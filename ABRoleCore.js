module.exports = class ABRoleCore {
   constructor(values) {
      // this.application = application;
      this._scopes = [];

      this.fromValues(values);
   }

   fromValues(values = {}) {
      this.id = values.uuid || values.id;
      this.uuid = values.uuid || values.id;
      this.name = values.name;
      this.description = values.description;
      this.translations = values.translations;

      // multilingual fields: name, description
      // this.application.translate(this, this, ['name', 'description']);
   }

   toObj() {
      // this.application.unTranslate(this, this, ['name', 'description']);

      let scopes = [];
      (this._scopes || []).forEach((s) => {
         scopes.push(s.toObj());
      });

      return {
         id: this.uuid || this.id,
         uuid: this.uuid || this.id,
         name: this.name,
         description: this.description,
         translations: this.translations,
         scopes: scopes
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
         function() {
            return true;
         };

      return (this._scopes || []).filter(filter);
   }
};
