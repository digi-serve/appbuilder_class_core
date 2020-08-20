/**
 * ABObjectCore
 *
 * Manage the loading of specific ABObject data into useable objects
 * that can instantiate themselves and provide field and model resources.
 */

var ABModel = require("../platform/ABModel");
var ABDefinition = require("../platform/ABDefinition");
var ABMLClass = require("../platform/ABMLClass");

module.exports = class ABObjectCore extends ABMLClass {
   constructor(attributes, application) {
      super(["label"]);

      /*
{
	id: uuid(),
	connName: 'string', // Sails DB connection name: 'appdev_default', 'legacy_hris', etc. Default is 'appBuilder'.
	name: 'name',
	labelFormat: 'xxxxx',
	isImported: 1/0,
	isExternal: 1/0,
	tableName:'string',  // NOTE: store table name of import object to ignore async
	primaryColumnName: 'string', // NOTE: store column name of PK
	transColumnName: 'string', // NOTE: store column name of translations table
	urlPath:'string',
	importFromObject: 'string', // JSON Schema style reference:  '#[ABApplication.id]/objects/[ABObject.id]'
								// to get other object:	 ABApplication.objectFromRef(obj.importFromObject);
	translations:[
		{}
	],
	fields:[
		{ABDataField}
   ],
   indexes: [
      {ABIndex}
   ]
}
*/
      // link me to my parent ABApplication
      this.application = application;

      this.fromValues(attributes);
   }

   ///
   /// Static Methods
   ///
   /// Available to the Class level object. These methods are not dependent
   /// on the instance values of the Application.
   ///

   static contextKey() {
      return "object";
   }

   ///
   /// Instance Methods
   ///

   fromValues(attributes) {
      /*
        {
            id: uuid(),
            connName: 'string', // Sails DB connection name: 'appdev_default', 'legacy_hris', etc. Default is 'appBuilder'.
            name: 'name',
            labelFormat: 'xxxxx',
            isImported: 1/0,
            isExternal: 1/0,
            tableName:'string',  // NOTE: store table name of import object to ignore async
            primaryColumnName: 'string', // NOTE: store column name of PK
            transColumnName: 'string', // NOTE: store column name of translations table
            urlPath:'string',
            importFromObject: 'string', // JSON Schema style reference:  '#[ABApplication.id]/objects/[ABObject.id]'
                                        // to get other object:  ABApplication.objectFromRef(obj.importFromObject);
            translations:[
                {}
            ],
            fields:[
                {ABDataField}
            ],
            indexes: [
               {ABIndex}
            ]
        }
        */

      // ABApplication Attributes (or is it ABObject attributes?)
      this.id = attributes.id;
      // {string} .id
      // the uuid of this ABObject Definition.

      this.type = attributes.type || "object";
      // {string} .type
      // the type of ABDefinition this is.

      this.connName = attributes.connName || undefined; // undefined == 'appBuilder'
      // {string} .connName
      // the sails.config.connections[connName] configuration reference.
      // if not set ({undefined}), then our default "appBuilder" config is used

      this.name = attributes.name || "";
      // {string} .name
      // A name reference for this ABObject. This is a reference that isn't
      // translateable and will be used for lookups across languages.

      this.labelFormat = attributes.labelFormat || "";
      // {string} .labelFormat
      // A string template for how to display an entry for this ABObject in
      // common UI elements like grids, lists, etc...

      this.isImported = parseInt(attributes.isImported || 0);
      // {depreciated}
      // {bool} .isImported
      // previously used to mark ABObjects that were created in other
      // ABApplicaitons.  No longer relevant with Global ABObjects

      this.isExternal = parseInt(attributes.isExternal || 0);
      // {bool} .isExternal
      // Marks this ABObject as referencing a pre-existing table in the DB that
      // we are treating as an ABObject.
      // These objects are not allowed to create/update/destroy the db table
      // nor can we add/remove fields.
      // However we are able to customize the Field definitions to change the
      // column names, hidden attributes, Object label, etc...
      // We can update our Defintion attributes, but not any actual DB changes.

      this.tableName = attributes.tableName || ""; // NOTE: store table name of import object to ignore async
      // {string} .tableName
      // the `{database}.{tableName}` of the db table that this ABObject's data
      // is stored in.
      // knex does not like .(dot) in table and column names
      // https://github.com/knex/knex/issues/2762
      this.tableName = this.tableName.replace(/[^a-zA-Z0-9_ ]/gi, "");

      this.primaryColumnName = attributes.primaryColumnName || ""; // NOTE: store column name of PK
      // {string} .primaryColumnName
      // is the col_name of which key is the primary key.  By default it is
      // "uuid", but in some external objects this might be something else
      // ("id", "ren_id", etc...).

      this.transColumnName = attributes.transColumnName || ""; // NOTE: store column name of translations table
      // {string} .transColumnName
      // this is a workaround to include hris_ren_data and hris_ren_trans data

      this.urlPath = attributes.urlPath || "";

      // this.importFromObject = attributes.importFromObject || "";

      this.isSystemObject = attributes.isSystemObject;
      // {bool} .isSystemObject
      // We are now storing some of our System Required Data as ABObjects as well.
      // These Objects should not be allowed to be modified by typical AppBuilder
      // designer.  However we can enable a mode for AB Designer to then expand these
      // ABObjects, and eventually we can use the AppBuilder to Create the AppBuilder.
      if (
         typeof this.isSystemObject == "undefined" ||
         this.isSystemObject == "false"
      ) {
         this.isSystemObject = false;
      }

      this.createdInAppID = attributes.createdInAppID;
      // {string} .createdInAppID
      // the .id of the ABApplication that originally created this ABObject.

      // if attributes.objectWorkspace DOES exist, make sure it is fully
      // populated.
      if (typeof attributes.objectWorkspace != "undefined") {
         if (typeof attributes.objectWorkspace.sortFields == "undefined")
            attributes.objectWorkspace.sortFields = [];
         if (typeof attributes.objectWorkspace.filterConditions == "undefined")
            attributes.objectWorkspace.filterConditions = [];
         if (typeof attributes.objectWorkspace.frozenColumnID == "undefined")
            attributes.objectWorkspace.frozenColumnID = "";
         if (typeof attributes.objectWorkspace.hiddenFields == "undefined")
            attributes.objectWorkspace.hiddenFields = [];
      }
      this.objectWorkspace = attributes.objectWorkspace || {
         sortFields: [], // array of columns with their sort configurations
         filterConditions: [], // array of filters to apply to the data table
         frozenColumnID: "", // id of column you want to stop freezing
         hiddenFields: [] // array of [ids] to add hidden:true to
      };
      // {obj} .objectWorkspace
      // When in the ABObject editor in the AppBuilder Designer, different
      // views of the information can be created.  These views are stored here
      // and are avaiable to other users in the Designer.

      // pull in field definitions:
      var fields = [];
      (attributes.fieldIDs || []).forEach((id) => {
         var def = ABDefinition.definition(id);
         if (def) {
            fields.push(this.application.fieldNew(def, this));
         } else {
            console.error(
               "Object [" +
                  this.name +
                  "][" +
                  this.id +
                  "] referenced an unknown field id [" +
                  id +
                  "]"
            );
         }
      });
      this._fields = fields;

      // pull in index definitions:
      this.importIndexes(attributes.indexIDs);

      // let the MLClass now process the translations:
      super.fromValues(attributes);
   }

   /**
    * @method importFields
    * instantiate a set of fields from the given field ids.
    * @param {array} fieldIDs The different ABDefinition IDs for each field
    *	       [ "uuid11", "uuid2", ... "uuidN" ]
    */
   // importFields(fieldIDs) {}

   /**
    * @method importIndexes
    * instantiate a set of indexes from the given ids.
    * @param {array} indexIDs The different ABDefinition IDs for each index
    *        [ "uuid11", "uuid2", ... "uuidN" ]
    */
   importIndexes(indexIDs) {
      var indexes = [];
      (indexIDs || []).forEach((id) => {
         var def = ABDefinition.definition(id);
         if (def) {
            indexes.push(this.application.indexNew(def, this));
         } else {
            console.error(
               "Object [" +
                  this.name +
                  "][" +
                  this.id +
                  "] referenced an unknown index id [" +
                  id +
                  "]"
            );
         }
      });
      this._indexes = indexes;
   }

   /**
    * @method exportFields
    * convert our array of fields into a settings object for saving to disk.
    * @return {array}
    */
   // exportFields() {
   //     var currFields = [];
   //     this._fields.forEach((obj) => {
   //         currFields.push(obj.toObj());
   //     });
   //     return currFields;
   // }

   // /**
   //  * @method exportFields
   //  * convert our array of fields into a settings object for saving to disk.
   //  * @return {array}
   //  */
   // exportIndexes() {
   //    var currIndexes = [];
   //    this._indexes.forEach((idx) => {
   //       currIndexes.push(idx.toObj());
   //    });
   //    return currIndexes;
   // }

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
      // MLClass translation
      var obj = super.toObj();

      // track the field .ids of our fields
      var fieldIDs = this.fields().map((f) => f.id);

      // track the index .ids of our indexes
      var indexIDs = this.indexes().map((f) => f.id);

      return {
         id: this.id,
         type: this.type || "object",
         connName: this.connName,
         name: this.name,
         labelFormat: this.labelFormat,
         isImported: this.isImported,
         isExternal: this.isExternal,
         tableName: this.tableName,
         // NOTE: store table name of import object to ignore async
         primaryColumnName: this.primaryColumnName,
         // NOTE: store column name of PK
         transColumnName: this.transColumnName,
         // NOTE: store column name of translations table
         urlPath: this.urlPath,
         // importFromObject: this.importFromObject,
         objectWorkspace: this.objectWorkspace,
         isSystemObject: this.isSystemObject,

         translations: obj.translations,
         fieldIDs: fieldIDs,
         indexIDs: indexIDs,
         createdInAppID: this.createdInAppID
      };
   }

   ///
   /// Objects
   ///

   /**
    * @method objectLinks()
    *
    *  return an array of ABObject that's connected.
    *
    * @param {object} filter
    * @return {array} - An array of ABObject
    */
   objectLinks(/* filter */) {
      var connectFields = this.connectFields();

      return connectFields.map((f) => f.datasourceLink);
   }

   ///
   /// Fields
   ///

   /**
    * @method fields()
    *
    * return an array of all the ABFields for this ABObject.
    *
    * @param filter {Object}
    * @param getAll {Boolean} - [Optional]
    *
    * @return {array}
    */
   fields(filter = () => true, getAll = false) {
      // NOTE: keep this check here in case we pass in .fields(null, true);
      if (!filter) filter = () => true;
      let result = this._fields.filter(filter);

      // limit connectObject fields to only fields that connect to other
      // objects this application currently references ...
      if (this.application) {
         let availableConnectFn = (f) => {
            if (
               f &&
               f.key == "connectObject" &&
               this.application &&
               this.application.objectsIncluded(
                  (obj) => obj.id == f.settings.linkObject
               ).length < 1
            ) {
               return false;
            } else {
               return true;
            }
         };

         if (!getAll) {
            result = result.filter(availableConnectFn);
         }
      }

      return result;
   }

   /**
    * @method connectFields()
    *
    * return an array of the ABFieldConnect that is connect object fields.
    *
    * @return {array}
    */
   connectFields(getAll = false) {
      return this.fields((f) => f && f.key == "connectObject", getAll);
   }

   /**
    * @method fieldNew()
    *
    * return an instance of a new (unsaved) ABField that is tied to this
    * ABObject.
    *
    * NOTE: this new field is not included in our this.fields until a .save()
    * is performed on the field.
    *
    * @return {ABField}
    */
   fieldNew(values) {
      return this.application.fieldNew(values, this);
   }

   /**
    * @method fieldRemove()
    *
    * remove the given ABField from our ._fields array and persist the current
    * values.
    *
    * @param {ABField} field The instance of the field to remove.
    * @return {Promise}
    */
   fieldRemove(field) {
      var origLen = this._fields.length;
      this._fields = this.fields(function(o) {
         return o.id != field.id;
      });

      if (this._fields.length < origLen) {
         return this.save();
      }

      // if we get here, then nothing changed so nothing to do.
      return Promise.resolve();
   }

   /**
    * @method fieldReorder()
    *
    * reorder the fields in our object
    *
    * @param {ABField} field The instance of the field to remove.
    * @return {Promise}
    */
   fieldReorder(sourceId, targetId) {
      // We know what was moved and what item it has replaced/pushed forward
      // so first we want to splice the item moved out of the array of fields
      // and store it so we can put it somewhere else
      let itemMoved = null;
      let oPos = 0; // original position
      for (var i = 0; i < this._fields.length; i++) {
         if (this._fields[i].columnName == sourceId) {
            itemMoved = this._fields[i];
            this._fields.splice(i, 1);
            oPos = i;
            break;
         }
      }
      // once we have removed/stored it we can find where its new position
      // will be by looping back through the array and finding the item it
      // is going to push forward
      for (var j = 0; j < this._fields.length; j++) {
         if (this._fields[j].columnName == targetId) {
            // if the original position was before the new position we will
            // follow webix's logic that the drop should go after the item
            // it was placed on
            if (oPos <= j) {
               j++;
            }
            this._fields.splice(j, 0, itemMoved);
            break;
         }
      }

      return this.save();
   }

   /**
    * @method fieldSave()
    *
    * save the given ABField in our ._fields array and persist the current
    * values.
    *
    * @param {ABField} field The instance of the field to save.
    * @return {Promise}
    */
   fieldSave(field) {
      var isIncluded =
         this.fields(function(o) {
            return o.id == field.id;
         }).length > 0;
      if (!isIncluded) {
         this._fields.push(field);
         return this.save();
      }

      return Promise.resolve();
   }

   /**
    * @method fieldAdd()
    *
    * save the given ABField in our ._fields array and persist the current
    * values if they changed.
    *
    * @param {ABField} field The instance of the field to save.
    * @return {Promise}
    */
   fieldAdd(field) {
      var isIncluded =
         this.fields(function(o) {
            return o.id == field.id;
         }).length > 0;
      if (!isIncluded) {
         // if not already included, then add and save the Obj definition:
         this._fields.push(field);
         return this.save();
      }

      // Nothing was required so return
      return Promise.resolve();
   }

   /**
    * @method multilingualFields()
    *
    * return an array of columnnames that are multilingual.
    *
    * @return {array}
    */
   multilingualFields() {
      return this.fields((f) => f && f.isMultilingual).map((f) => f.columnName);
   }

   /**
    * @method indexes()
    *
    * return an array of all the ABIndex for this ABObject.
    *
    * @param filter {Object}
    *
    * @return {array}
    */
   indexes(filter = () => true) {
      return this._indexes.filter(filter);
   }

   /**
    * @method indexRemove()
    *
    * remove the given ABIndex from our ._indexes array and persist the current
    * values.
    *
    * @param {ABIndex}
    * @return {Promise}
    */
   indexRemove(index) {
      var origLen = this._indexes.length;
      this._indexes = this.indexes(function(idx) {
         return idx.id != index.id;
      });

      // persist our changes if something changed.
      if (origLen != this._indexes.length) {
         return this.save();
      }

      // nothing was removed, so continue on.
      return Promise.resolve();
   }

   /**
    * @method indexSave()
    *
    * save the given ABIndex in our ._indexes array and persist the current
    * values.
    *
    * @param {ABIndex}
    * @return {Promise}
    */
   indexSave(index) {
      var isIncluded =
         this.indexes(function(idx) {
            return idx.id == index.id;
         }).length > 0;
      if (!isIncluded) {
         this._indexes.push(index);
         return this.save();
      }

      return Promise.resolve();
   }

   ///
   /// Working with data from server
   ///

   /**
    * @method model
    * return a Model object that will allow you to interact with the data for
    * this ABObject.
    */
   model() {
      // NOTE: now that a DataCollection overwrites the context of it's
      // object's model, it is no longer a good idea to only have a single
      // instance of this._model per ABObject.  We should provide a new
      // instance each time.

      // if (!this._model) {

      //// TODO: what do we do with imported Objects?
      // if (this.isImported) {
      //     //// TODO:
      //     var obj = ABApplication.objectFromRef(this.importFromObject);
      //     this._model = new ABModel(obj);
      // } else {
      this._model = new ABModel(this);
      // }

      // default the context of this model's operations to this object
      this._model.contextKey(ABObjectCore.contextKey());
      this._model.contextValues({ id: this.id }); // the datacollection.id

      // }

      return this._model;
   }

   ///
   /// URL
   ///

   /**
    * @method urlRest
    * return the url to access the data for this object.
    * @return {string}
    */
   urlRest() {
      return "/app_builder/model/application/#appID#/object/#objID#"
         .replace("#appID#", this.application.id)
         .replace("#objID#", this.id);
   }

   /**
    * @method urlRestBatch
    * return the url to use for batch creates for this object
    * @return {string}
    */
   urlRestBatch() {
      return "/app_builder/model/application/#appID#/object/#objID#/batch"
         .replace("#appID#", this.application.id)
         .replace("#objID#", this.id);
   }

   /**
    * @method urlRestItem
    * return the url to access the data for an instance of this object.
    * @return {string}
    */
   urlRestItem(id) {
      return "/app_builder/model/application/#appID#/object/#objID#/#id#"
         .replace("#appID#", this.application.id)
         .replace("#objID#", this.id)
         .replace("#id#", id);
   }

   /**
    * @method urlRestRefresh
    * return the url to signal a refresh for this object.
    * @return {string}
    */
   urlRestRefresh() {
      return "/app_builder/model/application/#appID#/refreshobject/#objID#"
         .replace("#appID#", this.application.id)
         .replace("#objID#", this.id);
   }

   /**
    * @method urlCount
    * return the url to count of data for this object.
    * @return {string}
    */
   urlRestCount() {
      return "/app_builder/model/application/#appID#/count/#objID#"
         .replace("#appID#", this.application.id)
         .replace("#objID#", this.id);
   }

   ///
   ///	Object Workspace Settings
   ///
   get workspaceSortFields() {
      // new version
      if (this.workspaceViews) {
         let currView = this.workspaceViews.getCurrentView();
         if (currView) return currView.sortFields;
         else return null;
      }
      // old version
      else {
         return this.objectWorkspace.sortFields;
      }
   }

   set workspaceSortFields(fields) {
      // new version
      if (this.workspaceViews) {
         let currView = this.workspaceViews.getCurrentView();
         if (currView) currView.sortFields = fields;
      }
      // old version
      else {
         this.objectWorkspace.sortFields = fields;
      }
   }

   get workspaceFilterConditions() {
      // new version
      if (this.workspaceViews) {
         let currView = this.workspaceViews.getCurrentView();
         if (currView) return currView.filterConditions;
         else return null;
      }
      // old version
      else {
         return this.objectWorkspace.filterConditions;
      }
   }

   set workspaceFilterConditions(filterConditions) {
      // new version
      if (this.workspaceViews) {
         let currView = this.workspaceViews.getCurrentView();
         if (currView) currView.filterConditions = filterConditions;
      }
      // old version
      else {
         this.objectWorkspace.filterConditions = filterConditions;
      }
   }

   get workspaceFrozenColumnID() {
      return this.objectWorkspace.frozenColumnID;
   }

   set workspaceFrozenColumnID(id) {
      this.objectWorkspace.frozenColumnID = id;
   }

   get workspaceHiddenFields() {
      return this.objectWorkspace.hiddenFields || [];
   }

   set workspaceHiddenFields(fields) {
      this.objectWorkspace.hiddenFields = fields;
   }

   /**
    * @method isReadOnly
    *
    * @return {boolean}
    */
   get isReadOnly() {
      return this.isImported || this.isExternal;
   }

   /**
    * @method defaultValues
    * Collect a hash of key=>value pairs that represent the default values
    * from each of our fields.
    * @param {obj} data a key=>value hash of the inputs to parse.
    * @return {array}
    */
   defaultValues() {
      var values = {};
      this.fields().forEach((f) => {
         f.defaultValue(values);
      });

      return values;
   }

   /**
    * @method isValidData
    * Parse through the given data and return an array of any invalid
    * value errors.
    * @param {obj} data a key=>value hash of the inputs to parse.
    * @return {array}
    */
   isValidData(/* data */) {
      // NOTE: the platform needs to define a way to verify the data
      console.warn("Platform.ABObject.isValidData() missing");
      return true;
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
      if (this.application == null) return null;

      return this.application.urlObject(acrossApp) + this.id;
   }

   /**
    * @method urlField
    * return a string pointer to this object's fields
    *
    * @param {boolean} acrossApp - flag to include application id to url
    *
    * @return {string}
    */
   urlField(acrossApp) {
      return this.urlPointer(acrossApp) + "/_fields/";
   }

   /**
    * @method PK
    * return a string of the primary column name
    *
    * @return {string}
    */
   PK() {
      return this.primaryColumnName || "id";
   }

   remoteCreate(data) {
      console.log(
         "object[" + this.name + "] received a remoteCreate() with data:",
         data
      );
   }

   /**
    * @method clone
    * return a clone of ABObject
    *
    * @return {ABObjectBase}
    */
   clone() {
      // ignore properties who're spend much performance
      // NOTE: do not clone them. Just copy reference
      let ignoreProps = ["application", "_fields"];

      let cloneOne = JSON.parse(JSON.stringify(this));

      ignoreProps.forEach((prop) => {
         cloneOne[prop] = this[prop];
      });

      return cloneOne;
   }
};
