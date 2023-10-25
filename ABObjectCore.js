/**
 * ABObjectCore
 *
 * Manage the loading of specific ABObject data into useable objects
 * that can instantiate themselves and provide field and model resources.
 */

var ABModel = require("../platform/ABModel");
var ABMLClass = require("../platform/ABMLClass");

const L = (...params) => AB.Multilingual.label(...params);

module.exports = class ABObjectCore extends ABMLClass {
   constructor(attributes, AB) {
      super(["label"], AB);

      /*
{
	id: uuid(),
	connName: 'string', // Sails DB connection name: 'appdev_default', 'legacy_hris', etc. Default is 'appBuilder'.
	name: 'name',
	labelFormat: 'xxxxx',
	labelSettings: Object,
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
            labelSettings: Object,
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

      this.labelSettings = attributes.labelSettings || {};
      // {Object} .labelSettings

      this.labelSettings.isNoLabelDisplay = parseInt(
         this.labelSettings.isNoLabelDisplay || 0
      );
      // {bool} .isNoLabelDisplay

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
         hiddenFields: [], // array of [ids] to add hidden:true to
      };
      // {obj} .objectWorkspace
      // When in the ABObject editor in the AppBuilder Designer, different
      // views of the information can be created.  These views are stored here
      // and are avaiable to other users in the Designer.

      // pull in field definitions:
      var fields = [];
      this.fieldIDs = attributes.fieldIDs || [];
      // {array}  [ ABField.id, ... ]
      // this is a collection of ALL the ABFields this object references.
      // This will include ABFields that were directly created for this object
      // and will include ABFields that were imported.

      this.importedFieldIDs = attributes.importedFieldIDs || [];
      // {array} [ ABField.id, ... ]
      // this is a collection of the ABFields in our .fieldIDs that were
      // IMPORTED.

      this._unknownFieldIDs = [];
      this.fieldIDs.forEach((id) => {
         if (!id) return;

         var def = this.AB.definitionByID(id);
         if (def) {
            fields.push(this.AB.fieldNew(def, this));
         } else {
            this._unknownFieldIDs.push(id);
            let err = new Error(
               `O[${this.name}] is referenceing an unknown field id[${id}]`
            );
            this.AB.notify.builder(err, {
               field: { id, object: { id: this.id, name: this.name } },
            });
         }
      });
      this._fields = fields;

      // pull in index definitions:
      this.importIndexes(attributes.indexIDs);

      // let the MLClass now process the translations:
      super.fromValues(attributes);
   }

   /**
    * @method importIndexes
    * instantiate a set of indexes from the given ids.
    * @param {array} indexIDs The different ABDefinition IDs for each index
    *        [ "uuid11", "uuid2", ... "uuidN" ]
    */
   importIndexes(indexIDs) {
      this._unknownIndex = [];
      var indexes = [];
      (indexIDs || []).forEach((id) => {
         var def = this.AB.definitionByID(id);
         if (def) {
            indexes.push(this.AB.indexNew(def, this));
         } else {
            this._unknownIndex.push(id);
            let err = new Error(
               `O[${this.name}] is referenceing an unknown index id[${id}]`
            );
            this.AB.notify.builder(err, {
               field: { id, object: { id: this.id, name: this.name } },
            });
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
      (this._unknownFieldIDs || []).forEach((id) => {
         fieldIDs.push(id);
      });
      // NOTE: we keep the ._unknownFieldIDs so a developer/builder
      // can come back and track down what happened to the missing
      // ids.

      // track the index .ids of our indexes
      var indexIDs = this.indexes().map((f) => f.id);
      (this._unknownIndex || []).forEach((id) => {
         indexIDs.push(id);
      });

      return {
         id: this.id,
         type: this.type || "object",
         connName: this.connName,
         name: this.name,
         labelFormat: this.labelFormat,
         labelSettings: this.labelSettings || {},
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
         importedFieldIDs: this.importedFieldIDs,
         indexIDs: indexIDs,
         createdInAppID: this.createdInAppID,
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
    * return an array of all the ABFields for this ABObject.
    * @param {fn} fn
    *        a filter function that returns {true} if a value should
    *        be included, or {false} otherwise.
    * @return {array[ABFieldxxx]}
    */
   fields(fn = () => true) {
      return this._fields.filter(fn);
   }

   /**
    * @method fieldByID()
    * return the object's field from the given {ABField.id}
    * @param {string} id
    *        the uuid of the field to return.
    * @return {ABFieldxxx}
    */
   fieldByID(id) {
      return this.fields((f) => f?.id == id)[0];
   }

   /**
    * @method connectFields()
    *
    * return an array of the ABFieldConnect that is connect object fields.
    * @param {fn} fn
    *        a filter function that returns {true} if a value should
    *        be included, or {false} otherwise.
    * @return {array}
    */
   connectFields(fn = () => true) {
      return this.fields((f) => f && f.isConnection).filter(fn);
   }

   /**
    * @method fieldImport
    * register the given ABField.id as an imported field for this ABObject.
    * The ABField definition should be available before making this call.
    * After this call, the ABField is included in the ABObject, but the ABObject
    * has NOT been saved.
    * @param {ABField} fieldID The ABDefinition.id for a field that is imported
    *        into this object.
    */
   fieldImport(id) {
      if (!id) return;

      if (this.importedFieldIDs.indexOf(id) == -1) {
         this.importedFieldIDs.push(id);
      }

      // just to be safe:
      var isThere = this._fields.find((f) => f.id == id);
      if (!isThere) {
         var def = this.AB.definitionByID(id);
         if (def) {
            this._fields.push(this.AB.fieldNew(def, this));
         } else {
            this._unknownFieldIDs = this._unknownFieldIDs || [];
            this._unknownFieldIDs.push(id);
            let err = new Error(
               `O[${this.name}] is importing an unknown field id[${id}]`
            );
            this.AB.notify.builder(err, {
               field: { id, object: { id: this.id, name: this.name } },
            });
         }
      }
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
      return this.AB.fieldNew(values, this);
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
      this._fields = this.fields(function (o) {
         return o.id != field.id;
      });

      // be sure to remove this from our imported ids if it was
      // listed there.
      this.importedFieldIDs = this.importedFieldIDs.filter(
         (fid) => fid != field.id
      );

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
      var isIncluded = this.fieldByID(field.id);
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
      var isIncluded = this.fieldByID(field.id);
      if (!isIncluded) {
         // if not already included, then add and save the Obj definition:
         this._fields.push(field);
         return this.save();
      }

      // Nothing was required so return
      return Promise.resolve();
   }

   /**
    * @method imageFields()
    *
    * return an array of the ABFieldImage fields this object has.
    * @param {fn} fn
    *        a filter function that returns {true} if a value should
    *        be included, or {false} otherwise.
    * @return {array}
    */
   imageFields(fn = () => true) {
      return this.fields((f) => f && f.key == "image").filter(fn);
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
    * @method indexByID()
    * return the object's index from the given {ABIndex.id}
    * @param {string} id
    *        the id of the ABIndex to return.
    * @return {ABIndex}
    */
   indexByID(id) {
      return this.indexes((f) => f.id == id)[0];
   }

   /**
    * @method indexRemove()
    * remove the given ABIndex from our ._indexes array and persist the current
    * values.
    * @param {ABIndex} index
    * @return {Promise}
    */
   indexRemove(index) {
      var origLen = this._indexes.length;
      this._indexes = this.indexes(function (idx) {
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
    * save the given ABIndex in our ._indexes array and persist the current
    * values.
    * @param {ABIndex} index
    * @return {Promise}
    */
   indexSave(index) {
      var isIncluded = this.indexByID(index.id);
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
      var model = new ABModel(this);

      // default the context of this model's operations to this object
      model.contextKey(ABObjectCore.contextKey());
      model.contextValues({ id: this.id });

      return model;
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
      return `/app_builder/model/${this.id}`;
   }

   /**
    * @method urlRestBatch
    * return the url to use for batch creates for this object
    * @return {string}
    */
   urlRestBatch() {
      return `/app_builder/batch/model/${this.id}`;
   }

   /**
    * @method urlRestItem
    * return the url to access the data for an instance of this object.
    * @return {string}
    */
   urlRestItem(id) {
      return `/app_builder/model/${this.id}/${id}`;
   }

   /**
    * @method urlRestLog
    * return the url to access the logs for this ABObject.
    * @return {string}
    */
   urlRestLog() {
      return `/app_builder/object/${this.id}/track`;
   }

   /**
    * @method urlRestRefresh
    * return the url to signal a refresh for this object.
    * @return {string}
    */
   urlRestRefresh() {
      return `/app_builder/model/refreshobject/${this.id}`;
   }

   /**
    * @method urlCount
    * return the url to count of data for this object.
    * @return {string}
    */
   urlRestCount() {
      return `/app_builder/model/count/${this.id}`;
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
      return this.isImported || this.isExternal || this.readonly;
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
      console.error("Who is calling this?");

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
      console.error("Who is calling this?");

      return this.urlPointer(acrossApp) + "/_fields/";
   }

   /**
    * @method PK
    * return a string of the primary column name
    *
    * @return {string}
    */
   PK() {
      return this.primaryColumnName || "uuid";
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

   /**
    * @method minRelationData()
    * return an array of ABField.columnNames that make up
    * the minimum fields required to display this objects __RELATION
    * data in our UI widgets.
    */
   minRelationData() {
      var fields = [this.PK()];

      if (this.multilingualFields().length > 0) {
         fields.push("translations");
      }

      var labelData = this.labelFormat || "";

      // get column ids in {colId} template
      // ['{colId1}', ..., '{colIdN}']
      var colIds = labelData.match(/\{[^}]+\}/g);

      if (colIds && colIds.forEach) {
         colIds.forEach((colId) => {
            var colIdNoBracket = colId.replace("{", "").replace("}", "");

            var field = this.fieldByID(colIdNoBracket);
            if (field == null) return;

            fields.push(field.columnName);
         });
      }

      // System requires to include number field values
      // because they are used on Formula/Calculate fields on client side
      fields = fields.concat(
         this.fields((f) => f.key == "number").map((f) => f.columnName)
      );

      return fields;
   }

   // Display data with label format of object
   displayData(rowData) {
      if (rowData == null) return "";

      // translate multilingual
      //// TODO: isn't this a MLObject??  use this.translate()
      var mlFields = this.multilingualFields();
      this.translate(rowData, rowData, mlFields);

      var labelData = this.labelFormat || "";

      // default label
      if (!labelData && this.fields().length > 0) {
         var defaultField = this.fields((f) => f.fieldUseAsLabel())[0];
         if (defaultField) labelData = "{" + defaultField.id + "}";
         else {
            // if label is empty, then show .id
            if (!labelData.trim()) {
               let labelSettings = this.labelSettings || {};
               if (labelSettings && labelSettings.isNoLabelDisplay) {
                  labelData = L(labelSettings.noLabelText || "[No Label]");
               } else {
                  // show id of row
                  labelData = `${
                     this.AB.rules.isUUID(rowData.id) ? "ID: " : ""
                  }${rowData.id}`;
               }
            }
         }
      }

      // get column ids in {colId} template
      // ['{colId1}', ..., '{colIdN}']
      var colIds = labelData.match(/\{[^}]+\}/g);

      if (colIds && colIds.forEach) {
         colIds.forEach((colId) => {
            var colIdNoBracket = colId.replace("{", "").replace("}", "");

            var field = this.fieldByID(colIdNoBracket);
            if (field == null) return;

            labelData = labelData.replace(colId, field.format(rowData) || "");
         });
      }

      // if label is empty, then show .id
      if (!labelData.trim()) {
         let labelSettings = this.labelSettings || {};
         if (labelSettings && labelSettings.isNoLabelDisplay) {
            labelData = L(labelSettings.noLabelText || "[No Label]");
         } else {
            // show id of row
            labelData = `${this.AB.rules.isUUID(rowData.id) ? "ID: " : ""}${
               rowData.id
            }`;
         }
      }

      return labelData;
   }
};

