// import ABApplication from "./ABApplication"

module.exports = class ABDefinitionCore {
   constructor(attributes, AB) {
      this.AB = AB;
      this.fromValues(attributes);
   }

   ///
   /// Static Methods
   ///
   /// Available to the Class level object.  These methods are not dependent
   /// on the instance values of the Application.
   ///

   fromValues(attributes) {
      /*
		{
			id: uuid(),
			name: 'name',
			type: 'xxxxx',
			json: "{json}"
		}
		*/
      if (attributes.id) {
         this.id = attributes.id;
      }
      this.name =
         attributes.name || attributes.json.name || attributes.json.label || "";
      this.type = attributes.type || attributes.json.type || "";
      this.json = attributes.json || null;
   }

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABApplication instance
    * into the values needed for saving to the DB.
    *
    * Most of the instance data is stored in .json field, so be sure to
    * update that from all the current values of our child fields.
    *
    * @return {json}
    */
   toObj() {
      return {
         id: this.id,
         name: this.name,
         type: this.type,
         json: this.json,
      };
   }

   /**
    * @method destroy()
    * destroy the current instance of ABDefinition
    * Also remove it from our parent application
    * @return {Promise}
    */
   destroy() {
      return this.AB.definitionDestroy(this.id);
   }

   /**
    * @method save()
    * persist this instance of ABObject with it's parent ABApplication
    * @return {Promise}
    *         .resolve( {this} )
    */
   save() {
      if (this.id) {
         return this.AB.definitionUpdate(this.id, this.toObj());
      } else {
         return this.AB.definitionCreate(this.toObj());
      }
   }
};
