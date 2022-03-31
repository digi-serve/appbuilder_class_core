const ABMLClass = require("../platform/ABMLClass");

module.exports = class ABIndexCore extends ABMLClass {
   constructor(attributes, object) {
      super(["label"], object.AB);
      this.object = object;

      this.fromValues(attributes);
   }

   fromValues(attributes) {
      /*
      {
        id: uuid(),
        name: 'name',
        fields:[
            {ABDataField.id}
        ],
        unique: {boolean}
      }
      */
      this.id = attributes.id;
      this.type = "index";
      this.name = attributes.name;
      this.unique = JSON.parse(attributes.unique || false);

      // Convert to an array
      if (attributes.fieldIDs && !Array.isArray(attributes.fieldIDs)) {
         attributes.fieldIDs = [attributes.fieldIDs];
      }

      this.fields = (attributes.fieldIDs || [])
         .map((f) => {
            let field = this.object.fieldByID(f);
            if (!field) {
               this.emit(
                  "warning",
                  `Index[${this.name}][${this.id}] is referencing an unknown field[${f}]`,
                  {
                     index: this.id,
                     field: f,
                  }
               );
            }
            return field;
         })
         .filter((fId) => fId);

      if (this.fields.length == 0) {
         this.emit(
            "warning",
            `Index[${this.name}][${this.id}] is not referencing any fields`,
            {
               index: this.id,
               attributeFieldIDs: attributes.fieldIDs || [],
            }
         );
      }

      // let the MLClass process the Translations
      super.fromValues(attributes);
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
      let result = super.toObj();

      result.id = this.id;
      result.type = "index";
      result.name = this.name;
      result.unique = this.unique;

      // Convert to an array
      if (this.fields && !Array.isArray(this.fields)) {
         this.fields = [this.fields];
      }

      result.fieldIDs = (this.fields || [])
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

   get uniqueName() {
      let indexName = this.indexName.substring(0, 57);

      return `${indexName}_unique`;
   }
};
