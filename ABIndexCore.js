const uuid = require("uuid/v4");

module.exports = class ABIndexCore {
   constructor(attributes, object) {
      this.object = object;

      this.fromValues(attributes);
   }

   fromValues(attributes) {
      /*
      {
        id: uuid(),
        name: 'name',
        fields:[
            {ABDataField}
        ]
      }
      */
      this.id = attributes.id;
      this.name = attributes.name;

      // Convert to an array
      if (attributes.fields && !Array.isArray(attributes.fields)) {
         attributes.fields = [attributes.fields];
      }

      this.fields = (attributes.fields || [])
         .map((f) => {
            // Convert to ABField
            if (typeof f == "string") {
               return this.object.fields((fld) => fld.id == f)[0];
            } else if (f) {
               return f;
            }
         })
         .filter((fId) => fId);
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
      let result = {};

      result.id = this.id || uuid();
      result.name = this.name;

      // Convert to an array
      if (this.fields && !Array.isArray(this.fields)) {
         this.fields = [this.fields];
      }

      result.fields = (this.fields || [])
         .map((f) => {
            // Convert to the id of field
            return f.id || f;
         })
         .filter((fId) => fId);

      return result;
   }

   get indexName() {
      let tableName = this.object.dbTableName();

      // Maximum 64 characters long
      return `${tableName}_${this.name}`.replace(/ /g, "").substring(0, 64);
   }
};

