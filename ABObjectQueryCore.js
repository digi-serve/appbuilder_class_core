//
// ABObjectQuery
//
// A type of Object in our system that is based upon a complex relationship of multiple
// existing Objects.
//
// In the QueryBuilder section of App Builder, a new Query Object can be created.
// An initial Object can be chosen from our current list of Objects. After that, additional Objects
// and a specified join type can be specified.
//
// A list of fields from each specified Object can also be included as the data to be returned.
//
// A where statement is also part of the definition.
//

var ABObject = require("../platform/ABObject");
var ABModel = require("../platform/ABModel");

module.exports = class ABObjectQueryCore extends ABObject {
   constructor(attributes, application) {
      super(attributes, application);
      /*
{
	id: uuid(),
	name: 'name',
	labelFormat: 'xxxxx',
	isImported: 1/0,
	urlPath:'string',
	importFromObject: 'string', // JSON Schema style reference:  '#[ABApplication.id]/objects/[ABObject.id]'
								// to get other object:  ABApplication.objectFromRef(obj.importFromObject);
	translations:[
		{}
	],



	// ABOBjectQuery Specific Changes
	// we store a list of fields by their urls:
	fields:[
		{
			alias: "",
			fieldURL:'#/url/to/field',
		}
	],


	// we store a list of joins:
	joins:{
		alias: "",							// the alias name of table - use in SQL command
		objectURL:"#/...",					// the base object of the join
		links: [
			{
				alias: "",							// the alias name of table - use in SQL command
				fieldID: "uuid",					// the connection field of the object we are joining with.
				type:[left, right, inner, outer]	// join type: these should match the names of the knex methods
						=> innerJoin, leftJoin, leftOuterJoin, rightJoin, rightOuterJoin, fullOuterJoin
				links: [
					...
				]
			}
		]

	},


	where: { QBWhere }
}
*/

      // this.fromValues(attributes);
   }

   ///
   /// Static Methods
   ///
   /// Available to the Class level object.  These methods are not dependent
   /// on the instance values of the Application.
   ///

   /**
    * contextKey()
    * returns a unique key that represents a query in
    * our networking job resolutions.
    * @return {string}
    */
   static contextKey() {
      return "query";
   }

   ///
   /// Instance Methods
   ///

   /// ABApplication data methods

   fromValues(attributes) {
      super.fromValues(attributes);

      this.type = "query";

      // populate connection objects
      // this._objects = {};
      // this.obj2Alias = attributes.obj2Alias || {};

      this.alias2Obj = {}; // this gets built in the .importJoins()
      // { "alias" : object.id }
      // this is a lookup hash of a referenced alias to the Object it
      // references.

      this.objectIDs = [];
      // {array}  of ABObject.id s that are referenced by this query.
      // this is how we limit our searches on objects.
      // this gets built in the .importJoins();

      this.viewName = attributes.viewName || "";
      // knex does not like .(dot) in table and column names
      // https://github.com/knex/knex/issues/2762
      this.viewName = this.viewName.replace(/[^a-zA-Z0-9_ ]/gi, "");

      // import all our ABObjects
      this.importJoins(attributes.joins || {});
      this.importFields(attributes.fields || []); // import after joins are imported

      // Import our Where condition
      this.where = attributes.where || {}; // .workspaceFilterConditions
      // Fix default where.glue value
      if (
         this.where &&
         !this.where.glue &&
         this.where.rules &&
         this.where.rules.length > 0
      )
         this.where.glue = "and";

      this._objectWorkspaceViews = attributes.objectWorkspaceViews || {};

      this.settings = this.settings || {};

      if (attributes && attributes.settings) {
         // convert from "0" => true/false
         this.settings.grouping = JSON.parse(
            attributes.settings.grouping || false
         );
         this.settings.hidePrefix = JSON.parse(
            attributes.settings.hidePrefix || false
         );
      }
   }

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABObjectQuery instance
    * into the values needed for saving to the DB.
    *
    * @return {json}
    */
   toObj() {
      var result = super.toObj();

      result.viewName = this.viewName;

      result.joins = this.exportJoins();
      result.fields = this.exportFields();
      result.where = this.where; // .workspaceFilterConditions

      result.settings = this.settings;

      return result;
   }

   ///
   /// Fields
   ///

   /**
    * @method importFields
    * instantiate a set of fields from the given attributes.
    * Our attributes are a set of field URLs That should already be created in their respective
    * ABObjects.
    * @param {array} fieldSettings The different field urls for each field
    *					{ }
    */
   importFields(fieldSettings) {
      var newFields = [];
      (fieldSettings || []).forEach((fieldInfo) => {
         if (fieldInfo == null) return;

         // pull object by alias name
         let object = this.objectByAlias(fieldInfo.alias);
         if (!object) return;

         let field = object.fields((f) => f.id == fieldInfo.fieldID, true)[0];

         // should be a field of base/join objects
         if (
            field &&
            this.canFilterField(field) &&
            // check duplicate
            newFields.filter(
               (f) =>
                  f.alias == fieldInfo.alias && f.field.id == fieldInfo.fieldID
            ).length < 1
         ) {
            // add alias to field
            // refactor _.clone() to actually return a new instance of this same ABDataField obj:
            var def = field.toObj();
            let clonedField = new field.constructor(def, field.object);

            clonedField.alias = fieldInfo.alias;

            let alias = fieldInfo.alias;
            if (Array.isArray(this.joins())) {
               // NOTE: query v1
               alias = field.object.name;
            }

            newFields.push({
               alias: alias,
               field: clonedField
            });
         }
      });
      this._fields = newFields;
   }

   /**
    * @method exportFields
    * convert our array of fields into a settings object for saving to disk.
    * @return {array}
    */
   exportFields() {
      var currFields = [];
      this._fields.forEach((fieldInfo) => {
         currFields.push({
            alias: fieldInfo.alias,
            objectID: fieldInfo.field.object.id,
            fieldID: fieldInfo.field.id
         });
      });
      return currFields;
   }

   /**
    * @method fields()
    *
    * Support the ABObject api by returning a list of fields relevant
    * to this ABObjectQuery.
    *
    * @return {array}
    */
   fields(fn = () => true) {
      return this._fields.map((f) => f.field).filter(fn);
   }

   ///
   /// Joins & Objects
   ///

   /**
    * @method joins()
    *
    * return an object of joins for this Query.
    *
    * @return {Object}
    */
   joins() {
      return this._joins || {};
   }

   /**
    * @method objects()
    *
    * return an array of all the relevant ABObjects for this Query.
    *
    * @return {array}
    */
   objects(fn = () => true) {
      // TODO: find the case where limiting to this.objectIDs was
      // problematic, and refactor the code making the call:

      // FOR proper expected operation, this fn must only return object
      // matches for which this ABQuery is managing objects:

      return this.application
         .objects((o) => this.objectIDs.indexOf(o.id) > -1)
         .filter(fn);
   }

   /**
    * @method objectAlias()
    *
    * return alias of of ABObjects.
    *
    * @return {string}
    */
   objectAlias(objectId) {
      let result = null;

      Object.keys(this.alias2Obj || {}).forEach((alias) => {
         if (!result && this.alias2Obj[alias] == objectId) {
            result = alias;
         }
      });

      return result;
   }

   /**
    * @method objectBase
    * return the origin object
    *
    * @return {ABObject}
    */
   objectBase() {
      if (!this._joins.objectID) return null;

      return (
         this.application.objects((obj) => obj.id == this._joins.objectID)[0] ||
         null
      );
   }

   /**
    * @method objectByAlias()
    * return ABObject search by alias name
    *
    * @param {string} - alias name
    * @return {ABClassObject}
    */
   objectByAlias(alias) {
      var objID = this.alias2Obj[alias];
      if (objID) {
         return this.objects((o) => o.id == objID)[0];
      }
      return null;
   }

   /**
    * @method links()
    *
    * return an array of links for this Query.
    *
    * @return {array}
    */
   links(filter = () => true) {
      return (this._links || []).filter(filter);
   }

   /**
    * @method importJoins
    * instantiate a set of joins from the given attributes.
    * Our joins contain a set of ABObject URLs that should already be created in our Application.
    * @param {Object} settings The different field urls for each field
    *					{ }
    */
   importJoins(settings) {
      // copy join settings
      this._joins = _.cloneDeep(settings);

      var uniqueObjectIDs = {};
      // { obj.id : obj.id }
      // a hash of object.ids for all the relevant ABObjects necessary for this
      // ABObjectQuery

      var newLinks = [];
      // {array} of link definitions
      // build the operating values for this._links

      let storeObject = (object, alias) => {
         if (!object) return;

         // var inThere = newObjects.filter(obj => obj.id == object.id && obj.alias == alias ).length > 0;
         // if (!inThere) {
         // newObjects[alias] = object;
         // this.obj2Alias[object.id] = alias;
         this.alias2Obj[alias] = object.id;
         uniqueObjectIDs[object.id] = object.id;
         // newObjects.push({
         // 	alias: alias,
         // 	object: object
         // });
         // }
      };

      let storeLinks = (links) => {
         (links || []).forEach((link) => {
            // var inThere = newLinks.filter(l => l.fieldID == link.fieldID).length > 0;
            // if (!inThere) {
            newLinks.push(link);
            // }
         });
      };

      let processJoin = (baseObject, joins) => {
         if (!baseObject) return;

         (joins || []).forEach((link) => {
            // Convert our saved settings:
            //	{
            //		alias: "",							// the alias name of table - use in SQL command
            //		objectID: "uuid",					// id of the connection object
            //		links: [
            //			{
            //				alias: "",							// the alias name of table - use in SQL command
            //				fieldID: "uuid",					// uhe connection field of the object we are joining with.
            //				type:[left, right, inner, outer]	// join type: these should match the names of the knex methods
            //						=> innerJoin, leftJoin, leftOuterJoin, rightJoin, rightOuterJoin, fullOuterJoin
            //				links: [
            //					...
            //				]
            //			}
            //		]
            //	},

            var linkField = baseObject.fields(
               (f) => f.id == link.fieldID,
               true
            )[0];
            if (!linkField) return;

            // track our linked object
            var linkObject = this.application.objects(
               (obj) => obj.id == linkField.settings.linkObject
            )[0];
            if (!linkObject) return;

            storeObject(linkObject, link.alias);

            storeLinks(link.links);

            processJoin(linkObject, link.links);
         });
      };

      // if (!this._joins.objectURL)
      // 	// TODO: this is old query version
      // 	return;

      // store the root object
      var rootObject = this.objectBase();
      if (!rootObject) {
         // this._objects = newObjects;
         return;
      }

      storeObject(rootObject, "BASE_OBJECT");

      storeLinks(settings.links);

      processJoin(rootObject, settings.links);

      // this._objects = newObjects;
      this._links = newLinks;
      this.objectIDs = Object.keys(uniqueObjectIDs);
   }

   /**
    * @method exportJoins
    * save our list of objects into our format for persisting on the server
    * @param {array} settings
    */
   exportJoins() {
      return _.cloneDeep(this._joins || {});
   }

   ///
   /// Working with Client Components:
   ///

   /**
    * @method model
    * return a Model object that will allow you to interact with the data for
    * this ABObjectQuery.
    */
   model() {
      // NOTE: now that a DataCollection overwrites the context of it's
      // object's model, it is no longer a good idea to only have a single
      // instance of this._model per ABObject.  We should provide a new
      // instance each time.

      // if (!this._model) {

      this._model = new ABModel(this);

      // default the context of this model's operations to this object
      this._model.contextKey(this.constructor.contextKey());
      this._model.contextValues({ id: this.id }); // the datacollection.id
      // }

      return this._model;
   }

   /**
    * @method canFilterObject
    * evaluate the provided object to see if it can directly be filtered by this
    * query.
    * @param {ABObject} object
    * @return {bool}
    */
   canFilterObject(object) {
      if (!object) return false;

      // I can filter this object if it is one of the objects in my joins
      return (
         this.objects((obj) => {
            return obj.id == object.id;
         }).length > 0
      );
   }

   /**
    * @method canFilterField
    * evaluate the provided field to see if it can be filtered by this
    * query.
    * @param {ABObject} object
    * @return {bool}
    */
   canFilterField(field) {
      if (!field) return false;

      // I can filter a field if it's object OR the object it links to can be filtered:
      let object = field.object;
      // Transition:
      // let linkedObject = this.objects(
      //    (obj) => obj.id == field.settings.linkObject
      // )[0];
      var linkedObject = field.datasourceLink;

      return this.canFilterObject(object) || this.canFilterObject(linkedObject);
   }

   /**
    * @method urlPointer()
    * return the url pointer that references this object. This url pointer
    * should be able to be used by this.application.urlResolve() to return
    * this object.
    *
    * @param {boolean} acrossApp - flag to include application id to url
    *
    * @return {string}
    */
   urlPointer(acrossApp) {
      return this.application.urlQuery(acrossApp) + this.id;
   }

   /**
    * @method isGroup
    *
    * @return {boolean}
    */
   get isGroup() {
      return this.settings.grouping || false;
   }

   /**
    * @method isReadOnly
    *
    * @return {boolean}
    */
   get isReadOnly() {
      return true;
   }

   /**
    * @method isDisabled()
    * check this contains removed objects or fields
    *
    * @return {boolean}
    */
   isDisabled() {
      return this.disabled || false;
   }

   get workspaceFilterConditions() {
      let filterConditions = super.workspaceFilterConditions;
      if (
         filterConditions == null ||
         filterConditions.rules == null ||
         !filterConditions.rules.length
      ) {
         filterConditions = this.where;
      }

      return filterConditions;
   }
};
