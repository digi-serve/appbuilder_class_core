/*
 * ABFieldConnect
 *
 * An ABFieldConnect defines a connect to other object field type.
 *
 */

var ABField = require("../../platform/dataFields/ABField");

// function L(key, altText) {
//    // TODO:
//    return altText; // AD.lang.label.getLabel(key) || altText;
// }

const ABFieldConnectDefaults = {
   key: "connectObject",
   // unique key to reference this specific DataField

   description: "Connect two data objects together",
   // description: what gets displayed in the Editor description.
   // NOTE: this will be displayed using a Label: L(description)

   icon: "external-link",
   // font-awesome icon reference.  (without the 'fa-').  so 'external-link'  to
   // reference 'fa-external-link'

   isFilterable: true,
   // {bool} / {fn}
   // determines if the current ABField can be used to filter (FilterComplex
   // or Query) data.
   // if a {fn} is provided, it will be called with the ABField as a parameter:
   //  (field) => field.setting.something == true

   isSortable: (field) => {
      const linkType = `${field?.settings?.linkType}:${field?.settings?.linkViaType}`;
      return ["one:many", "one:one"].indexOf(linkType) > -1;
   },
   // {bool} / {fn}
   // determines if the current ABField can be used to Sort data.
   // if a {fn} is provided, it will be called with the ABField as a parameter:
   //  (field) => true/false

   menuName: "Connect to another record",
   // menuName: what gets displayed in the Editor drop list
   // NOTE: this will be displayed using a Label: L(menuName)

   supportRequire: false,
   // {bool}
   // does this ABField support the Required setting?

   supportUnique: false,
   // {bool}
   // does this ABField support the Unique setting?

   useAsLabel: false,
   // {bool} / {fn}
   // determines if this ABField can be used in the display of an ABObject's
   // label.

   compatibleOrmTypes: ["string"],
   // {array}
   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options

   compatibleMysqlTypes: ["char", "varchar", "tinytext"],
   // {array}
   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
};

const defaultValues = {
   linkObject: "", // ABObject.id
   // the .id of the ABObject we are connected to

   linkType: "one", // [one, many]
   // 'one' : this object can have only 1 of our linkObject
   // 'many': this object can have MANY of our linkObject

   linkViaType: "many", // [one, many]
   // 'one' : the linkedObject can only have 1 of me
   // 'many' : the linkedObject can have many of me

   linkColumn: "", // ABField.id
   // the .id of the field in the linkedObject that is our
   // connected field.

   isSource: null, // bit : 1,0
   // isSource indicates that this object is the source of the connection:
   // if linkType==one, and isSource=1, then the value in this object's field
   // 		is the connected object's id
   // if linkType == one, and isSource = 0, then the linkObject has this obj.id
   //  	in it's connected field (linkColumn)

   // the next 3 Fields are concerning how we connect to other ABObjects when
   // we are NOT using the .uuid as the connecting Value. Instead, there is an
   // ABIndex setting we are connecting with.
   isCustomFK: 0,
   // {bool} truthy [0,1, etc...]
   // indicates that this connection is using 1 or more custom foreign keys
   // for the data it is storing in it's relationship.

   indexField: "", // ABField.id
   // {string} {ABField.id}
   // In a Connection defined between A --> B, this field represents the ABField
   // that is used for the data being stored.
   // In 1:1,  1:M  or M:1  relationships, .indexField always refers to the
   //       field we are pulling the Data FROM.
   // In M:N relationships:  this will refer to the A.Field.id that is a custom
   //       key (if any).

   indexField2: "", // ABField.id
   // {string}  {ABField.id}
   // In the M:N relationship: this field refers to the B.Field.id that is a
   //       custom Key for the data we are storing.
};

module.exports = class ABFieldConnectCore extends ABField {
   constructor(values, object, fieldDefaults = ABFieldConnectDefaults) {
      super(values, object, fieldDefaults);

      this.isConnection = true;
      // {bool}
      // is this an ABFieldConnect type of field.
      // this is a simplified helper to identify if an ABField is a type
      // of connect field.  Since this is the only place it is defined,
      // all other field types will be falsy

      // // text to Int:
      // this.settings.isSource = parseInt(this.settings.isSource || 0);
      // this.settings.isCustomFK = parseInt(this.settings.isCustomFK || 0);
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldConnectDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

   ///
   /// Instance Methods
   ///

   fromValues(values) {
      super.fromValues(values);

      // text to Int:
      this.settings.isSource = parseInt(this.settings.isSource || 0);
      this.settings.isCustomFK = parseInt(this.settings.isCustomFK || 0);
   }

   ///
   /// Working with Actual Object Values:
   ///

   /**
    * @method defaultValue
    * insert a key=>value pair that represent the default value
    * for this field.
    * @param {obj} values a key=>value hash of the current values.
    */
   defaultValue(/* values */) {}

   /**
    * @method isValidData
    * Parse through the given data and return an error if this field's
    * data seems invalid.
    * @param {obj} data  a key=>value hash of the inputs to parse.
    * @param {OPValidator} validator  provided Validator fn
    * @return {array}
    */
   isValidData(data, validator) {
      super.isValidData(data, validator);
   }

   relationName() {
      // there is object name - {objectName}.{columnName}
      if (this.columnName.indexOf(".") > -1) {
         const names = this.columnName.split(".");
         return `${names[0]}.${this.AB.rules.toFieldRelationFormat(names[1])}`;
      } else {
         return this.AB.rules.toFieldRelationFormat(this.columnName);
      }
   }

   /**
    * @method datasourceLink
    * return the ABObject that this field connection links to
    * @return {ABObject}
    */
   get datasourceLink() {
      const linkObj = this.AB.objectByID(this.settings.linkObject);
      if (!linkObj) {
         const configError = new Error(
            `ConnectField[${this.label}][${this.id}] unable to find linkObject[${this.settings.linkObject}]`
         );
         this.AB.notify.builder(configError, {
            field: this,
            linkObject: this.settings.linkObject,
         });
      }
      return linkObj;
   }

   /**
    * @method fieldLink
    * return the ABField that we are linked to.
    * @return {ABDataField}  or undefined if not found.
    */
   get fieldLink() {
      const objectLink = this.datasourceLink;
      if (!objectLink) return null; // note: already Notified

      const linkColumn = objectLink.fieldByID(this.settings.linkColumn);
      if (!linkColumn) {
         const configError = new Error(
            `ConnectField[${this.label}][${this.id}] unable to find linkColumn[${this.settings.linkColumn}]`
         );
         this.AB.notify.builder(configError, {
            field: this,
            linkColumn: this.settings.linkColumn,
         });
      }
      return linkColumn;
   }

   /**
    * @method pullRelationValues
    * Return the data values for this field entry in the provided data row.
    * @param {*} row
    * @return {array}
    */
   pullRelationValues(row) {
      let selectedData;

      // Get linked object
      const linkedObject = this.datasourceLink;

      let data = this.dataValue(row);
      if (data && linkedObject) {
         // convert to JSON
         if (typeof data == "string") {
            try {
               data = JSON.parse(data);
            } catch (e) {
               // must be a UUID
               // so just set that to selectedData:
               selectedData = data;
            }
         }

         selectedData = data;
      }

      return selectedData;
   }

   dataValue(rowData) {
      if (rowData == null) return "";

      const propName = `${this.object.name}.${this.relationName()}`;

      return (
         rowData[this.relationName()] ||
         rowData[propName] ||
         rowData[this.columnName] ||
         ""
      );
   }

   format(rowData) {
      const val = this.pullRelationValues(rowData);
      const linkedObject = this.datasourceLink;

      // array
      if (Array.isArray(val))
         return val
            .map((v) => {
               if (v.text == null) return linkedObject.displayData(v) || "";
               else return v.text || "";
            })
            .join(", ");
      // string
      else if (val) {
         if (val.text == null) return linkedObject.displayData(rowData) || "";
         else if (val.text) return val.text || "";
      }
      // empty string
      else return "";
   }

   /**
    * @method linkType
    * return the type of connection we have to our connected object
    * @return {string}
    */
   linkType() {
      return this.settings.linkType;
   }

   /**
    * @method linkType
    * return the type of connection we have to our connected object
    * @return {string}
    */
   linkViaType() {
      return this.settings.linkViaType;
   }

   /**
    * @method isSource
    * does this object contain the .id of the remote object (in case of linkType : one )
    * @return {bool}
    */
   isSource() {
      return this.settings.isSource;
   }

   /**
    * @property indexField
    * @return {ABField}
    */
   get indexField() {
      if (!this.settings.isCustomFK || !this.settings.indexField) {
         return null;
      }
      const linkType = `${this.settings.linkType}:${this.settings.linkViaType}`;
      // 1:M
      if (linkType === "one:many") {
         return this.datasourceLink.fieldByID(this.settings.indexField);
      }
      // 1:1
      else if (linkType === "one:one") {
         if (this.settings.isSource) {
            return this.datasourceLink.fieldByID(this.settings.indexField);
         } else {
            return this.object.fieldByID(this.settings.indexField);
         }
      }
      // M:1
      else if (linkType === "many:one") {
         return this.object.fieldByID(this.settings.indexField);
      }
      // M:N
      else if (linkType === "many:many") {
         let indexField = this.object.fieldByID(this.settings.indexField);

         if (indexField == null)
            indexField = this.datasourceLink.fieldByID(
               this.settings.indexField
            );

         return indexField;
      }

      return null;
   }

   /**
    * @property indexField2
    * @return {ABField}
    */
   get indexField2() {
      if (!this.settings.isCustomFK || !this.settings.indexField2) {
         return null;
      }

      let indexField;

      // M:N only
      if (
         this.settings.linkType == "many" &&
         this.settings.linkViaType == "many"
      ) {
         indexField = this.object.fieldByID(this.settings.indexField2);

         if (indexField == null)
            indexField = this.datasourceLink.fieldByID(
               this.settings.indexField2
            );
      }

      return indexField;
   }

   /**
    * @method getRelationValue
    * pull values for update connect data
    * @param {Object} rowData
    * @param {Object} options - {
    *                               forUpdate: boolean
    *                           }
    * @return {Object}
    */
   getRelationValue(rowData, options = {}) {
      if (rowData == null) return;
      let colName;
      const indexField = this.indexField;
      const datasourceLink = this.datasourceLink;

      const linkType = `${this.settings.linkType}:${this.settings.linkViaType}`;

      // custom index
      // M:N
      if (linkType === "many:many") {
         const indexField2 = this.indexField2;

         if (indexField && indexField.object.id == datasourceLink.id) {
            colName = indexField.columnName;
         } else if (indexField2 && indexField2.object.id == datasourceLink.id) {
            colName = indexField2.columnName;
         }
      }
      // 1:M, 1:1 isSource = true
      else if (
         indexField &&
         (linkType === "one:many" ||
            (linkType === "one:one" && this.settings.isSource))
      ) {
         colName = indexField.columnName;
      }
      // M:1
      else if (linkType === "many:one") {
         // NOTE: M:1 has special case
         // it uses different value for search and update.
         // UPDATE uses row id
         // SEARCH uses custom index value
         if (options.forUpdate) {
            colName = datasourceLink.PK();
         } else {
            colName = indexField
               ? indexField.columnName
               : this.fieldLink.columnName;
         }
      }
      // NO CUSTOM INDEX
      else if (datasourceLink) {
         colName = datasourceLink.PK();
      }

      let result = rowData[colName] || rowData.id || rowData;

      if (colName == "id") {
         result = parseInt(result);
      }

      return result;
   }
};
