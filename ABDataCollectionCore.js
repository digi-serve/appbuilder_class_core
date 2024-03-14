/*
 * ABDataCollection
 * Defines a set of data that other parts of the Application can work with.
 * it can point to either an ABObject, or ABObjectQuery, and can have an
 * filter, and sorts defined.
 *
 *
 *
 */
// const ABEmitter = require("../platform/ABEmitter");
const ABMLClass = require("../platform/ABMLClass");

// const ABObject = require("../platform/ABObject");
// const ABObjectQuery = require("../platform/ABObjectQuery");
// const RowFilter = require("../platform/RowFilter");

var DefaultValues = {
   id: "uuid",
   label: "", // label
   object: {}, // json of ABObject
   query: {}, // json of ABObjectQuery
   settings: {
      datasourceID: "", // id of ABObject or ABObjectQuery
      linkDatacollectionID: "", // id of ABDatacollection
      linkFieldID: "", // id of ABField
      followDatacollectionID: "", // id of ABDatacollection
      objectWorkspace: {
         filterConditions: {
            // array of filters to apply to the data table
            glue: "and",
            rules: [],
         },
         sortFields: [], // array of columns with their sort configurations
      },
      loadAll: false,
      // preventPopulate: false, depreciating in favour of populate
      populate: true, // true/false or array of columns to populate.
      isQuery: false, // if true it is a query, otherwise it is a object.

      fixSelect: "", // _CurrentUser, _FirstRecord, _FirstRecordDefault or row id

      syncType: 1, // 1 (Server), 2 (Client)
   },
};

const QueuedOperations = [];
// {array} of operations that we want to perform but allow some space
// between operations.
var _queueTimer = null;

function runQueue() {
   // if (!_queueTimer) {
   //    _queueTimer = setInterval(() => {
   //       runQueue();
   //    }, 20);
   // }
   if (QueuedOperations.length == 0) {
      // stop
      // clearInterval(_queueTimer);
      _queueTimer = null;
      return;
   }
   var op = QueuedOperations.shift();
   op.fn();
   _queueTimer = setTimeout(runQueue, op.timeout);
}
function queueOperation(fn, timeout = 20) {
   QueuedOperations.push({ fn, timeout });
   if (!_queueTimer) {
      runQueue();
   }
}

module.exports = class ABDataCollectionCore extends ABMLClass {
   constructor(attributes, AB) {
      super(["label"], AB);

      attributes = attributes || {};

      // this.application = application;

      this.fromValues(attributes);

      this.__dataCollection = this._dataCollectionNew([]);
      // {DataCollection}
      // This is a working instance of a DataCollection, not an {ABDatacCollection}
      // On web/mobile this is a webix component.  So keep the creation as part of
      // the platform/ABDataCollection implementation.

      // Set filter value
      this.refreshFilterConditions();

      this.__bindComponentIds = [];
      this.__flexComponentIds = [];

      // refresh a data collection
      // this.init();

      // mark data status does not be initialized
      this._dataStatus = this.dataStatusFlag.notInitial;

      this.__filterCond = null;
      // {QueryCondition}
      // A passed in Query Condition for filtering our DataCollection.
      // This value is ANDed with our normal filter conditions.
   }

   /**
    * contextKey()
    *
    * return a unique key that represents data from/for this type of object.
    *
    * used when creating Network jobs and needing to be notified when a job
    * is complete.  We send a contextKey() to the Network job and then listen
    * for it to know when it is complete.
    * @return {string}
    */
   static contextKey() {
      return "datacollection";
   }

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      this.id = values.id;
      // {string} .id
      // the uuid of this ABDataCollection Definition.

      this.name = values.name || null;
      // {string} .name
      // the unchanging name of this ABDataCollection

      this.type = values.type || "datacollection";
      // {string} .type
      // the type of ABDefinition this is.

      values.settings = values.settings || {};
      this.settings = this.settings || {};
      // {obj} .settings
      // the specific operation values for this ABDataCollection

      this.settings.linkDatacollectionID =
         values.settings.linkDatacollectionID ||
         DefaultValues.settings.linkDatacollectionID;
      // {string} .settings.linkDaacollectionID
      // the uuid of another ABDataCollection that provides the link/trigger
      // for filtering the values of this ABDataCollection.

      this.settings.linkFieldID =
         values.settings.linkFieldID || DefaultValues.settings.linkFieldID;
      // {string} .settings.linkFieldID
      // the uuid of the ABDataField of the .linkDatacollection ABObject
      // whose value is the trigger value for this ABDataCollection

      this.settings.followDatacollectionID =
         values.settings.followDatacollectionID ||
         DefaultValues.settings.followDatacollectionID;
      // {string} .settings.followDatacollectionID
      // the uuid of another ABDataCollection that provides the follow cursor data collection

      this.settings.objectWorkspace = values.settings.objectWorkspace || {
         filterConditions:
            DefaultValues.settings.objectWorkspace.filterConditions,
         sortFields: DefaultValues.settings.objectWorkspace.sortFields,
      };
      // {obj} .settings.objectWorkspace
      // the default settings for what is shown in the AppBuilder's
      // DataCollection workspace

      this.settings.fixSelect = values.settings.fixSelect;

      // Convert to boolean
      this.settings.loadAll = JSON.parse(
         values.settings.loadAll || DefaultValues.settings.loadAll
      );
      // {bool} .settings.loadAll
      // do we load all the data at one time? false == load by pages.

      this.settings.isQuery = JSON.parse(
         values.settings.isQuery || DefaultValues.settings.isQuery
      );
      // {bool} .settings.isQuery
      // is the data source for this ABDataCollection based upon an
      // ABObjectQuery?

      this.settings.populate = (() => {
         // First check .populate
         if (values.settings.populate != undefined) {
            return values.settings.populate;
            // Then check legacy .preventPopulate
         } else if (
            values.settings.preventPopulate == true ||
            values.settings.preventPopulate == "1"
         ) {
            return false;
         } else return DefaultValues.settings.populate;
      })();
      // {bool | array} populate
      // Control whcih related connections to populate. Default, true, populates
      // all connections. False loads no connnections. Also accepts an array of
      // column names to load specefic connections.

      // Convert to number
      this.settings.syncType = parseInt(
         values.settings.syncType || DefaultValues.settings.syncType
      );
      // {int} .settings.syncType
      // how is the data between this ABDataCollection and it's
      // .datasource synced?

      this.__datasource = null;
      // {obj} .__datasource
      // the reference to the ABObject/ABObjectQuery that this ABDataCollection
      // is based off of.

      this.settings.datasourceID =
         values.settings.datasourceID || DefaultValues.settings.datasourceID;
      // {string} .settings.datasourceID
      // the uuid of the .__datasource object to use

      // now lookup and reference the proper datasource
      if (this.settings.datasourceID) {
         // check for an ABObject
         var obj = this.AB.objectByID(this.settings.datasourceID);
         if (!obj) {
            // this must be an ABObjectQuery then ...
            obj = this.AB.queryByID(this.settings.datasourceID);
         }

         if (obj) {
            this.__datasource = obj;
            this.settings.isQuery = obj.type === "query";
            if (this.settings.isQuery) {
               if (this.__datasource.isGroup) {
                  if (!this.__treeCollection)
                     this.__treeCollection = this._treeCollectionNew();
                  // {TreeCollection}
                  // This is a webix TreeCollection (or similar)
                  // keep it's implementation as part of the platform

                  this.__isGroup = true;
               }
            }
         } else {
            console.error(
               `ABDataCollection[${this.name}][${this.id}] unable to find datasource [${this.settings.datasourceID}]`
            );
         }
      }

      // // Populate data source: ABObject or ABObjectQuery
      // if (values.query && values.query[0]) {
      //    this.__datasource = new ABObjectQuery(
      //       values.query[0],
      //       this.application
      //    );
      //    this.settings.isQuery = true;

      //    if (this.__datasource.isGroup) {
      //       if (!this.__treeCollection)
      //          this.__treeCollection = this._treeCollectionNew();

      //       this.__isGroup = true;
      //    }
      // } else if (values.object && values.object[0]) {
      //    this.__datasource = new ABObject(values.object[0], this.application);
      //    this.settings.isQuery = false;
      // }

      // let the MLClass now process the translations:
      super.fromValues(values);
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
      var obj = super.toObj(); // untranslate the object

      return {
         id: this.id,
         name: this.name || this.label,
         type: this.type || "datacollection",
         settings: this.AB.cloneDeep(this.settings || {}),
         translations: obj.translations,
      };
   }

   /**
    * @method save()
    *
    * persist this instance of ABDatacollection with it's parent
    *
    *
    * @return {Promise}
    *      .resolve( {this} )
    */
   async save() {
      if (!this.id) {
         this.label = this.label || this.name;
      }
      await super.save();
      return this;
   }

   /**
    * @method destroy()
    *
    * destroy the current instance of ABDatacollection
    *
    * also remove it from our parent application
    *
    * @return {Promise}
    */
   destroy() {
      var removeFromApplications = () => {
         return new Promise((next, err) => {
            // this.AB.applications().then((apps) => {

            const apps = this.AB.applications();
            // NOTE: apps is a webix datacollection

            var allRemoves = [];

            var appsWithObject = apps.filter((a) => {
               return a.datacollectionsIncluded((o) => o.id == this.id);
            });
            appsWithObject.forEach((app) => {
               allRemoves.push(app.datacollectionRemove(this));
            });

            return Promise.all(allRemoves).then(next).catch(err);
            // });
         });
      };

      return Promise.resolve()
         .then(() => {
            return removeFromApplications();
         })
         .then(() => {
            return super.destroy();
         })
         .then(() => {
            this.emit("destroyed");
         });
   }

   /**
    * @property $dc
    * return the underlying webix datacollection
    * @return {webix.datacollection}
    */
   get $dc() {
      return this.__dataCollection;
   }

   /**
    * @property datasource
    * return a object of this component.
    *
    * @return {ABObject|ABObjectQuery}
    */
   get datasource() {
      if (!this.__datasource) {
         if (this.id && this.name) {
            // occassionally we have blank DCs (without .id or .name)
            // and I don't want to see errors for those
            var err = new Error(
               `DataCollection[${this.name}][${this.id}] missing reference datasource`
            );
            this.AB.notify("builder", err, { datacollection: this.toObj() });
         }
         return null;
      }
      var obj = this.AB.objectByID(this.__datasource.id);
      if (!obj) {
         obj = this.AB.queryByID(this.__datasource.id);
      }
      return obj;
   }

   /**
    * @property datasource
    * set a object to data collection
    *
    * @param {ABObject|ABObjectQuery} object
    */
   set datasource(object) {
      this.__datasource = object;

      this.refreshFilterConditions();
   }

   /**
    * @property sourceType
    * return type of source.
    *
    * @return {string} - 'object' or 'query'
    */
   get sourceType() {
      return this.settings.isQuery ? "query" : "object";
   }

   /**
    * @method datacollectionLink
    * return a ABDatacollection that link of this.
    *
    * @return {ABDatacollection}
    */
   get datacollectionLink() {
      if (!this.AB) return null;

      return this.AB.datacollectionByID(this.settings.linkDatacollectionID);
   }

   /**
    * @property fieldLink
    * return a ABFieldConnect field that link of this.
    *
    * @return {ABFieldConnect}
    */
   get fieldLink() {
      let object = this.datasource;
      if (!object) return null;

      return object.fieldByID(this.settings.linkFieldID);
   }

   /**
    * @property model
    * return a source model
    *
    * @return ABModel
    */
   get model() {
      let object = this.datasource; // already notified

      return object ? object.model() : null;
   }

   get dataStatusFlag() {
      return {
         notInitial: 0,
         initializing: 1,
         initialized: 2,
      };
   }

   get dataStatus() {
      return this._dataStatus;
   }

   ///
   /// Cursor
   ///

   setCursor(itemId) {
      // If the static cursor is set, then this DC could not set cursor to other rows
      if (
         this.settings.fixSelect &&
         (this.settings.fixSelect != "_FirstRecordDefault" ||
            this.settings.fixSelect == itemId)
      )
         return;

      if (this.__treeCollection) {
         // set cursor of tree collection
         this.setCursorTree(itemId);

         // pull current row id
         let currTreeId = this.__treeCollection.getCursor();
         if (currTreeId) {
            let currTreeItem = this.__treeCollection.getItem(currTreeId);
            if (currTreeItem) itemId = currTreeItem._itemId;
         }
      }

      let dc = this.__dataCollection;
      if (dc) {
         // Store the old cursor id
         this.__previousCursorId = dc.getCursor();

         // clear cursor
         if (itemId == null) {
            dc.setCursor(null);
         }
         // If set rowId equal current cursor, it will not trigger .onAfterCursorChange event
         else if (dc.getCursor() == itemId) {
            this.emit("changeCursor", this.getCursor());
         }
         // set new cursor
         else if (dc.exists(itemId)) {
            dc.setCursor(itemId);
         }
      }
   }

   /**
    *
    * @param {string|number} itemId - Id of item or Id of row data
    */
   setCursorTree(itemId) {
      let tc = this.__treeCollection;
      if (tc && tc.getCursor() != itemId) {
         // If it is id of tree collection, then find row id of data
         let treeCursor = tc.find({ id: itemId }, true);
         if (treeCursor) {
            tc.setCursor(itemId);
         }
         // If it is not id of tree collection, then find/set root of data
         else {
            let treeItem = tc.find({ _itemId: itemId, $parent: 0 }, true);
            if (treeItem) tc.setCursor(treeItem.id);
            else tc.setCursor(null);
         }
      }
   }

   getCursor(treeCursor = false) {
      // Cursor of tree collection
      if (treeCursor && this.__treeCollection) {
         let currId = this.__treeCollection.getCursor();
         if (currId) {
            let currItem = this.__treeCollection.getItem(currId);

            // filter current id for serialize
            this.__treeCollection.filter(
               (item) => item._itemId == currItem._itemId
            );

            // pull item with child items
            let currItemAndChilds =
               this.__treeCollection.serialize()[0] || null;

            // refresh filter
            this.refreshLinkCursor();

            return currItemAndChilds;
         }
      }

      let dc = this.__dataCollection;
      if (dc == null) return null;

      let currId = dc.getCursor();
      let currItem = dc.getItem(currId);

      return currItem;
   }

   getFirstRecord() {
      var dc = this.__dataCollection;
      if (dc == null) return null;

      var currId = dc.getFirstId();
      var currItem = dc.getItem(currId);

      return currItem;
   }

   getNextRecord(record) {
      var dc = this.__dataCollection;
      if (dc == null) return null;

      var currId = dc.getNextId(record.id);
      var currItem = dc.getItem(currId);

      return currItem;
   }

   /**
    * @method refreshLinkCursor
    *    If the data collection is bound to another and it is the child connection
    *    it finds it's parents current set cursor and then filters its data
    *    based off of the cursor.
    */
   refreshLinkCursor(force = false) {
      // our filter conditions need to know there was an updated cursor.
      // some of our filters are based upon our linked data.
      this.refreshFilterConditions();

      // NOTE: If DC does not set load all data, then it does not need to filter by the parent DC.
      // because it fetch data when the cursor of the parent DC changes.
      if (!this.settings.loadAll && !force) return;

      // do not set the filter unless this dc is initialized "dataStatusFlag==2"
      // if (this.dataStatus != this.dataStatusFlag.initialized) return;

      // filter the data in the data collection
      // using its parents current cursor because all the data in this child
      // data collection has been loaded and the frontend can decide what is
      // seen or not seen
      let linkCursor;
      let dvLink = this.datacollectionLink;
      if (dvLink) {
         linkCursor = dvLink.getCursor();
      }

      let filterData = (rowData) => {
         // This row is not loaded yet. It will be loaded when scrolling.
         if (rowData == null) return true;

         // if link dc cursor is null:
         // ... if there's no parent show all data
         // ... if we have a parent hide all data - address cases where user see
         //     unexpected data (ns_app#318) - should this be a DC setting?
         if (!linkCursor) return dvLink ? false : true;
         else return this.isParentFilterValid(rowData);
      };

      if (this.__dataCollection) this.__dataCollection.filter(filterData);
      if (this.__treeCollection) this.__treeCollection.filter(filterData);
   }

   setStaticCursor() {
      if (this.settings.fixSelect) {
         // set cursor to the current user
         if (this.settings.fixSelect == "_CurrentUser") {
            var username = this.currentUserUsername();
            var userFields = this.datasource.fields((f) => f.key == "user");

            // find a row that contains the current user
            var row = this.__dataCollection.find((r) => {
               var found = false;

               userFields.forEach((f) => {
                  if (found || r[f.columnName] == null) return;

                  if (r[f.columnName].filter) {
                     // Array - isMultiple
                     found =
                        r[f.columnName].filter((data) => data.id == username)
                           .length > 0;
                  } else if (r[f.columnName] == username) {
                     found = true;
                  }
               });

               return found;
            }, true);

            // set a first row of current user to cursor
            if (row) {
               this.__dataCollection.setCursor(row.id);

               this.setCursorTree(row.id);
            }
         } else if (
            this.settings.fixSelect == "_FirstRecord" ||
            this.settings.fixSelect == "_FirstRecordDefault"
         ) {
            // // find a row that contains the current user
            // var row = this.__dataCollection.find((r) => {

            //  var found = false;
            //  if (!found) {
            //    found = true;
            //    return true; // just give us the first record
            //  }

            // }, true);

            // // set a first row of current user to cursor
            // if (row)
            //  this.__dataCollection.setCursor(row.id);

            let currRowId = this.__dataCollection.getCursor();
            if (
               !currRowId ||
               (currRowId && !this.__dataCollection.exists(currRowId))
            ) {
               // If current cursor is filtered by parent DC, then select new cursor

               // set a first row to cursor
               let rowId = this.__dataCollection.getFirstId();
               // if (rowId) {
               this.__dataCollection.setCursor(rowId || null);

               this.setCursorTree(rowId);
               // }
            }
         } else {
            this.__dataCollection.setCursor(this.settings.fixSelect);

            this.setCursorTree(this.settings.fixSelect);
         }
      }

      // Set the cursor to the first row
      if (this.isCursorFollow) {
         const rowId = this.__dataCollection.getFirstId();
         this.setCursor(rowId || null);
         this.setCursorTree(rowId || null);

         // If no data but the parent DC set cursor, then this should be reload data.
         const dcFollow = this.datacollectionFollow;
         if (!rowId && dcFollow.getCursor()) {
            this.loadData();
         }
      }
   }

   ///
   /// Data
   ///

   /**
    * @method filterCondition()
    * Provide a temporary filter condition to modify the data we are returning.
    * Used by User search criterias.
    * @param {json} cond
    *        A valid QueryCondition to filter the response.
    */
   filterCondition(cond = null) {
      this.__filterCond = cond;
   }

   init() {
      // prevent initialize many times
      if (this.initialized) return;
      this.initialized = true;

      if (!this.__dataCollection.___AD.onAfterCursorChange) {
         this.__dataCollection.___AD.onAfterCursorChange =
            this.__dataCollection.attachEvent("onAfterCursorChange", () => {
               // debugger;
               var currData = this.getCursor();

               this.emit("changeCursor", currData);
            });
      }

      // relate data functions
      let isRelated = (relateData, rowId, PK = "id") => {
         if (Array.isArray(relateData)) {
            return relateData.filter((v) => (v[PK] || v) == rowId).length > 0;
         } else {
            return relateData && (relateData[PK] || relateData) == rowId;
         }
      };

      // events
      this.on("ab.datacollection.create", (data) => {
         // If this DC is following cursor for other DC, then it should not add the new item to their list.
         if (this.isCursorFollow) return;

         let obj = this.datasource;
         if (!obj) return;

         if (!data || !data.data) return;

         let needAdd = false;
         let updatedVals = [];

         Promise.resolve()
            .then(() => {
               return new Promise((next, bad) => {
                  // Query
                  if (obj instanceof this.AB.Class.ABObjectQuery) {
                     let objList =
                        obj.objects((o) => o.id == data.objectId) || [];

                     needAdd = objList.length > 0;

                     if (!needAdd) return next();

                     let where = {
                        glue: "or",
                        rules: [],
                     };

                     objList.forEach((o) => {
                        let newDataId = data.data[`${o.PK()}`];
                        if (!newDataId) return;

                        where.rules.push({
                           key: `${o.alias || obj.objectAlias(o.id)}.${o.PK()}`,
                           rule: "equals",
                           value: newDataId,
                        });
                     });

                     obj.model()
                        .findAll({
                           where: where,
                        })
                        .then((newQueryData) => {
                           updatedVals = newQueryData.data || [];
                           updatedVals.forEach((v) => {
                              delete v.id;
                           });

                           next();
                        })
                        .catch(bad);
                  }
                  // Object
                  else {
                     needAdd = obj.id == data.objectId;
                     updatedVals = [data.data];
                     next();
                  }
               });
            })
            .then(() => {
               if (needAdd) {
                  // normalize data before add to data collection
                  // var model = obj.model();

                  // UPDATE: this should already have happened in NetworkRestSocket
                  // when the initial data is received.
                  //model.normalizeData(updatedVals);

                  (updatedVals || []).forEach((updatedV) => {
                     // filter condition before add
                     if (!this.isValidData(updatedV)) return;

                     // filter the cursor of parent DC
                     const dcLink = this.datacollectionLink;
                     if (dcLink && !this.isParentFilterValid(updatedV)) return;

                     // check to see if item already exisits in data collection
                     // and check to see that we are not loading the data serverside from cursor
                     if (
                        !this.__dataCollection.exists(
                           updatedV[`${obj.PK()}`]
                        ) &&
                        !this.__reloadWheres
                     ) {
                        this.__dataCollection.add(updatedV, 0);
                        this.emit("create", updatedV);
                        // this.__dataCollection.setCursor(rowData.id);
                     } else if (
                        !this.__dataCollection.exists(
                           updatedV[`${obj.PK()}`]
                        ) &&
                        this.__reloadWheres
                     ) {
                        // debugger;
                        if (this.isParentFilterValid(updatedV)) {
                           // we track bound components and flexlayout components
                           var attachedComponents =
                              this.__bindComponentIds.concat(
                                 this.__flexComponentIds
                              );
                           attachedComponents.forEach((bcids) => {
                              // if the reload button already exisits move on
                              if ($$(bcids + "_reloadView")) {
                                 return false;
                              }

                              // find the position of the data view
                              var pos = 0;
                              var parent = $$(bcids).getParentView();
                              if ($$(bcids).getParentView().index) {
                                 pos = $$(bcids)
                                    .getParentView()
                                    .index($$(bcids));
                              } else if (
                                 $$(bcids).getParentView().getParentView().index
                              ) {
                                 // this is a data view and it is inside a
                                 // scroll view that is inside an accodion
                                 // so we need to go deeper to add the button
                                 parent = $$(bcids)
                                    .getParentView()
                                    .getParentView();
                                 pos = $$(bcids)
                                    .getParentView()
                                    .getParentView()
                                    .index($$(bcids).getParentView());
                              }

                              // store the datacollection so we can pass it to the button later
                              var DC = this;
                              // add a button that reloads the view when clicked
                              if (parent.addView) {
                                 var L = this.AB.Label();
                                 parent.addView(
                                    {
                                       id: bcids + "_reloadView",
                                       view: "button",
                                       value: L(
                                          "New data available. Click to reload."
                                       ),
                                       css: "webix_primary webix_warn",
                                       click: function (id, event) {
                                          DC.reloadData();
                                          $$(id).getParentView().removeView(id);
                                       },
                                    },
                                    pos
                                 );
                              }
                           });
                           // this.emit("create", updatedV);
                        }
                     }
                  });

                  if (
                     this.__treeCollection // && this.__treeCollection.exists(updatedVals.id)
                  ) {
                     this.parseTreeCollection({
                        data: updatedVals,
                     });
                  }
               }

               // ABObject only
               if (!(obj instanceof this.AB.Class.ABObjectQuery)) {
                  // if it is a linked object
                  let connectedFields = this.datasource.connectFields(
                     (f) =>
                        f.datasourceLink && f.datasourceLink.id == data.objectId
                  );

                  // It should always be only one item for ABObject
                  updatedVals = updatedVals[0];

                  // update relation data
                  if (
                     updatedVals &&
                     connectedFields &&
                     connectedFields.length > 0
                  ) {
                     // various PK name
                     let PK = connectedFields[0].object.PK();
                     if (!updatedVals.id && PK != "id")
                        updatedVals.id = updatedVals[PK];

                     this.__dataCollection.find({}).forEach((d) => {
                        let updateItemData = {};

                        connectedFields.forEach((f) => {
                           var updateRelateVal = {};
                           if (f && f.fieldLink) {
                              updateRelateVal =
                                 updatedVals[f.fieldLink.relationName()] || {};
                           }

                           let rowRelateVal = d[f.relationName()] || {};

                           let valIsRelated = isRelated(
                              updateRelateVal,
                              d.id,
                              PK
                           );

                           // Relate data
                           if (
                              Array.isArray(rowRelateVal) &&
                              rowRelateVal.filter(
                                 (v) =>
                                    v == updatedVals.id ||
                                    v.id == updatedVals.id ||
                                    v[PK] == updatedVals.id
                              ).length < 1 &&
                              valIsRelated
                           ) {
                              rowRelateVal.push(updatedVals);

                              updateItemData[f.relationName()] = rowRelateVal;
                              updateItemData[f.columnName] = updateItemData[
                                 f.relationName()
                              ].map((v) => v.id || v[PK] || v);
                           } else if (
                              !Array.isArray(rowRelateVal) &&
                              (rowRelateVal != updatedVals.id ||
                                 rowRelateVal.id != updatedVals.id ||
                                 rowRelateVal[PK] != updatedVals.id) &&
                              valIsRelated
                           ) {
                              updateItemData[f.relationName()] = updatedVals;
                              updateItemData[f.columnName] =
                                 updatedVals.id || updatedVals;
                           }
                        });

                        // If this item needs to update
                        if (Object.keys(updateItemData).length > 0) {
                           // normalize data before add to data collection
                           var model = obj.model();

                           // UPDATE: this should already have happened in NetworkRestSocket
                           // when the initial data is received.
                           // model.normalizeData(updateItemData);

                           this.__dataCollection.updateItem(
                              d.id,
                              updateItemData
                           );

                           if (this.__treeCollection)
                              this.__treeCollection.updateItem(
                                 d.id,
                                 updateItemData
                              );

                           this.emit(
                              "update",
                              this.__dataCollection.getItem(d.id)
                           );
                        }
                     });
                  }
               }

               this.updateRelationalDataFromLinkDC(data.objectId, data.data);
               // filter link data collection's cursor
               this.refreshLinkCursor();
               this.setStaticCursor();
            });
      });

      this.on("ab.datacollection.update", (data) => {
         // {json} data
         // incoming socket payload:
         // data.objectId {string} uuid of the ABObject's row that was updated
         // data.data {json} the new updated value of that row entry.

         // debugger;
         let obj = this.datasource;
         if (!obj) return;

         // updated values
         let values = data.data;
         if (!values) return;

         // DC who is following cursor should update only current cursor.
         if (
            // this.isCursorFollow &&
            this.getCursor()?.id != (values[obj.PK()] ?? values.id)
         ) {
            return;
         }

         let needUpdate = false;
         let isExists = false;
         let updatedIds = [];
         // {array}
         // an array of the row indexs in our DataCollection that have values
         // that need to be updated.

         let updatedTreeIds = [];
         let updatedVals = {};

         // Query
         if (obj instanceof this.AB.Class.ABObjectQuery) {
            let objList = obj.objects((o) => o.id == data.objectId) || [];
            needUpdate = objList.length > 0;
            if (needUpdate) {
               (objList || []).forEach((o) => {
                  updatedIds = updatedIds.concat(
                     this.__dataCollection
                        .find((item) => {
                           return (
                              item[
                                 `${this.datasource.objectAlias(
                                    o.id
                                 )}.${o.PK()}`
                              ] == (values[o.PK()] || values.id)
                           );
                        })
                        .map((o) => o.id) || []
                  );

                  // grouped queries
                  if (this.__treeCollection) {
                     updatedTreeIds = updatedTreeIds.concat(
                        this.__treeCollection
                           .find((item) => {
                              return (
                                 item[
                                    `${this.datasource.objectAlias(
                                       o.id
                                    )}.${o.PK()}`
                                 ] == (values[o.PK()] || values.id)
                              );
                           })
                           .map((o) => o.id) || []
                     );
                  }
               });

               isExists = updatedIds.length > 0;

               updatedVals = this._queryUpdateData(objList, values);
            }
         }
         // Object
         else {
            needUpdate = obj.id == data.objectId;
            if (needUpdate) {
               // various PK name
               if (!values.id && obj.PK() != "id") values.id = values[obj.PK()];

               updatedIds.push(values.id);

               isExists = this.__dataCollection.exists(values.id);
               updatedVals = values;
            }
         }

         // if it is the source object
         if (needUpdate) {
            if (isExists) {
               if (this.isValidData(updatedVals)) {
                  // NOTE: this is now done in NetworkRestSocket before
                  // we start the update events.
                  // normalize data before update data collection
                  // var model = obj.model();
                  // model.normalizeData(updatedVals);

                  if (this.__dataCollection) {
                     updatedIds = this.AB.uniq(updatedIds);
                     updatedIds.forEach((itemId) => {
                        this.__dataCollection.updateItem(itemId, updatedVals);
                     });
                  }

                  if (this.__treeCollection) {
                     // update data in tree
                     updatedTreeIds = this.AB.uniq(updatedTreeIds);
                     updatedTreeIds.forEach((itemId) => {
                        this.__treeCollection.updateItem(itemId, updatedVals);
                     });
                  }

                  this.emit("update", updatedVals);

                  // If the update item is current cursor, then should tell components to update.
                  let currData = this.getCursor();
                  if (currData && currData.id == updatedVals.id) {
                     this.emit("changeCursor", currData);
                  }
               } else {
                  // Johnny: Here we are simply removing the DataCollection Entries that are
                  // no longer valid.
                  // Just cycle through the collected updatedIds and remove them.
                  updatedIds.forEach((id) => {
                     // If the item is current cursor, then the current cursor should be cleared.
                     let currData = this.getCursor();
                     if (currData && currData.id == id)
                        this.emit("changeCursor", null);

                     this.__dataCollection.remove(id);

                     // TODO: update tree list
                     // if (this.__treeCollection) {
                     //  this.__treeCollection.remove(id);
                     // }

                     this.emit("delete", id);
                  });
               }
            }
            // filter before add new record
            else if (this.isValidData(updatedVals)) {
               // this means the updated record was not loaded yet so we are adding it to the top of the grid
               // the placement will probably change on the next load of the data
               this.__dataCollection.add(updatedVals, 0);

               if (this.__treeCollection)
                  this.parseTreeCollection({
                     data: [updatedVals],
                  });

               this.emit("create", updatedVals);
            }
         }

         // if it is a linked object
         let connectedFields = obj.connectFields(
            (f) => f.datasourceLink && f.datasourceLink.id == data.objectId
         );

         // update relation data
         if (
            obj instanceof this.AB.Class.ABObject &&
            connectedFields?.length > 0
         ) {
            // various PK name
            let PK = connectedFields[0].object.PK();
            if (!values.id && PK != "id") values.id = values[PK];

            if (this.__dataCollection.count() > 0) {
               this.__dataCollection.find({}).forEach((d) => {
                  let updateItemData = {
                     id: d.id,
                  };

                  connectedFields.forEach((f) => {
                     if (!f) return;

                     let updateRelateVal = {};
                     let rowRelateVal = d[f.relationName()] || {};

                     if (f.fieldLink)
                        updateRelateVal =
                           values[f.fieldLink.relationName()] || {};

                     let valIsRelated = isRelated(updateRelateVal, d.id, PK);

                     // Unrelate data
                     if (
                        Array.isArray(rowRelateVal) &&
                        rowRelateVal.filter(
                           (v) =>
                              v == values.id ||
                              v.id == values.id ||
                              v[PK] == values.id
                        ).length > 0 &&
                        !valIsRelated
                     ) {
                        updateItemData[f.relationName()] = rowRelateVal.filter(
                           (v) => (v.id || v[PK] || v) != values.id
                        );
                        updateItemData[f.columnName] = updateItemData[
                           f.relationName()
                        ].map((v) => v.id || v[PK] || v);
                     } else if (
                        !Array.isArray(rowRelateVal) &&
                        (rowRelateVal == values.id ||
                           rowRelateVal.id == values.id ||
                           rowRelateVal[PK] == values.id) &&
                        !valIsRelated
                     ) {
                        updateItemData[f.relationName()] = null;
                        updateItemData[f.columnName] = null;
                     }

                     // Relate data or Update
                     if (Array.isArray(rowRelateVal) && valIsRelated) {
                        // update relate data
                        if (
                           rowRelateVal.filter(
                              (v) =>
                                 v == values.id ||
                                 v.id == values.id ||
                                 v[PK] == values.id
                           ).length > 0
                        ) {
                           rowRelateVal.forEach((v, index) => {
                              if (
                                 v == values.id ||
                                 v.id == values.id ||
                                 v[PK] == values.id
                              )
                                 rowRelateVal[index] = values;
                           });
                        }
                        // add new relate
                        else {
                           rowRelateVal.push(values);
                        }

                        updateItemData[f.relationName()] = rowRelateVal;
                        updateItemData[f.columnName] = updateItemData[
                           f.relationName()
                        ].map((v) => v.id || v[PK] || v);
                     } else if (
                        !Array.isArray(rowRelateVal) &&
                        (rowRelateVal != values.id ||
                           rowRelateVal.id != values.id ||
                           rowRelateVal[PK] != values.id) &&
                        valIsRelated
                     ) {
                        updateItemData[f.relationName()] = values;
                        updateItemData[f.columnName] = values.id || values;
                     }
                  });

                  // If this item needs to update
                  if (Object.keys(updateItemData).length > 0) {
                     // normalize data before add to data collection
                     // UPDATE: this should already have happened in NetworkRestSocket
                     // when the initial data is received.

                     // NOTE: We could not normalize relational data because they are not full data
                     // Merge update data to exists data instead

                     if (this.__treeCollection?.exists(d.id)) {
                        const treeItem = Object.assign(
                           this.__treeCollection.getItem(d.id),
                           updateItemData
                        );
                        this.__treeCollection.updateItem(d.id, treeItem);
                     }

                     if (this.__dataCollection?.exists(d.id)) {
                        const dcItem = Object.assign(
                           this.__dataCollection.getItem(d.id),
                           updateItemData
                        );
                        this.__dataCollection.updateItem(d.id, dcItem);
                        this.emit(
                           "update",
                           this.__dataCollection.getItem(d.id)
                        );
                     }
                  }
               });
            }
         }

         this.updateRelationalDataFromLinkDC(data.objectId, values);
         this.refreshLinkCursor(true);
         this.setStaticCursor();
      });

      // We are subscribing to notifications from the server that an item may be stale and needs updating
      // We will improve this later and verify that it needs updating before attempting the update on the client side
      this.on("ab.datacollection.stale", (data) => {
         // debugger;
         // if we don't have a datasource or model, there is nothing we can do here:
         // Verify the datasource has the object we are listening for if not just stop here
         if (
            !this.datasource ||
            !this.model ||
            this.datasource.id != data.objectId
         ) {
            return;
         }

         // updated values
         var values = data.data;

         if (!values) return;

         // use the Object's defined Primary Key:
         var PK = this.model.object.PK();
         if (!values[PK]) {
            PK = "id";
         }

         // DC who is following cursor should update only current cursor.
         if (
            this.isCursorFollow &&
            this.getCursor()?.[PK] != (values[PK] ?? values.id)
         ) {
            return;
         }

         if (values) {
            if (this.__dataCollection.exists(values[PK])) {
               var cond = { where: {} };
               cond.where[PK] = values[PK];
               // this data collection has the record so we need to query the server to find out what it's latest data is so we can update all instances
               this.model.staleRefresh(cond).then((res) => {
                  // check to make sure there is data to work with
                  if (Array.isArray(res.data) && res.data.length) {
                     // debugger;
                     let obj = this.datasource;
                     if (!obj) return;
                     // normalize data before add to data collection

                     // UPDATE: this should already have happened in NetworkRestSocket
                     // when the initial data is received.
                     //var model = obj.model();
                     // model.normalizeData(res.data[0]);

                     // tell the webix data collection to update using their API with the row id (values.id) and content (res.data[0])
                     if (this.__dataCollection.exists(values[PK])) {
                        this.__dataCollection.updateItem(
                           values[PK],
                           res.data[0]
                        );
                     }

                     // If the update item is current cursor, then should tell components to update.
                     var currData = this.getCursor();
                     if (currData && currData[PK] == values[PK]) {
                        this.emit("changeCursor", currData);
                     }
                  } else {
                     // If there is no data in the object then it was deleted...lets clean things up
                     // If the deleted item is current cursor, then the current cursor should be cleared.
                     var currId = this.getCursor();
                     if (currId == values[PK]) this.emit("changeCursor", null);

                     this.__dataCollection.remove(values[PK]);
                     this.emit("delete", values[PK]);
                  }
               });
            }
         }

         // filter link data collection's cursor
         this.refreshLinkCursor();
         this.setStaticCursor();
      });

      this.on("ab.datacollection.delete", (data) => {
         // debugger;
         let obj = this.datasource;
         if (!obj) return;

         let deleteId = data.data;
         let needDelete = false;
         let deletedIds = [];
         let deletedTreeIds = [];

         // Query
         if (obj instanceof this.AB.Class.ABObjectQuery) {
            let objList = obj.objects((o) => o.id == data.objectId) || [];
            needDelete = objList.length > 0;
            if (needDelete) {
               (objList || []).forEach((o) => {
                  deletedIds =
                     this.__dataCollection
                        .find((item) => {
                           return item[`${o.alias}.${o.PK()}`] == deleteId;
                        })
                        .map((o) => o.id) || [];

                  // grouped queries
                  if (this.__treeCollection) {
                     deletedTreeIds =
                        this.__treeCollection
                           .find((item) => {
                              return item[`${o.alias}.${o.PK()}`] == deleteId;
                           })
                           .map((o) => o.id) || [];
                  }
               });
            }
         }
         // Object
         else {
            needDelete = obj.id == data.objectId;
            if (needDelete) {
               deletedIds.push(deleteId);
            }
         }

         // if it is the source object
         if (needDelete) {
            // If the deleted item is current cursor, then the current cursor should be cleared.
            var currData = this.getCursor();

            deletedIds.forEach((delId) => {
               if (currData && currData[obj.PK()] == delId)
                  this.emit("changeCursor", null);

               if (this.__dataCollection.exists(delId))
                  this.__dataCollection.remove(delId);
            });

            if (this.__treeCollection) {
               deletedTreeIds.forEach((delId) => {
                  if (this.__treeCollection.exists(delId))
                     this.__treeCollection.remove(delId);
               });
            }

            if (deletedIds[0]) this.emit("delete", deletedIds[0]);
         }

         // if it is a linked object
         let connectedFields = obj.connectFields(
            (f) => f.datasourceLink && f.datasourceLink.id == data.objectId
         );

         // update relation data
         if (
            obj instanceof this.AB.Class.ABObject &&
            connectedFields &&
            connectedFields.length > 0
         ) {
            // various PK name
            let PK = connectedFields[0].object.PK();

            this.__dataCollection.find({}).forEach((d) => {
               let updateRelateVals = {};

               connectedFields.forEach((f) => {
                  let relateVal = d[f.relationName()];
                  if (relateVal == null) return;

                  if (
                     Array.isArray(relateVal)
                     // JOHNNY: for speed improvements, don't make this check:
                     // just do it and that will reduce 1x through the array.
                     // &&
                     // relateVal.filter(
                     //    (v) =>
                     //       v == deleteId ||
                     //       v.id == deleteId ||
                     //       v[PK] == deleteId
                     // ).length > 0
                  ) {
                     updateRelateVals[f.relationName()] = relateVal.filter(
                        (v) => (v.id || v[PK] || v) != deleteId
                     );
                     updateRelateVals[f.columnName] = updateRelateVals[
                        f.relationName()
                     ].map((v) => v.id || v[PK] || v);
                  } else if (
                     relateVal == deleteId ||
                     relateVal.id == deleteId ||
                     relateVal[PK] == deleteId
                  ) {
                     updateRelateVals[f.relationName()] = null;
                     updateRelateVals[f.columnName] = null;
                  }
               });

               // If this item needs to update
               if (Object.keys(updateRelateVals).length > 0) {
                  // normalize data before add to data collection

                  // var model = obj.model();
                  // model.normalizeData(updateRelateVals);

                  this.__dataCollection.updateItem(d.id, updateRelateVals);

                  if (this.__treeCollection)
                     this.__treeCollection.updateItem(d.id, updateRelateVals);

                  this.emit("update", this.__dataCollection.getItem(d.id));
               }
            });
         }
      });

      // add listeners when cursor of link data collection is changed
      const linkDC = this.datacollectionLink;
      // if (linkDC && this.settings.loadAll) {
      if (linkDC) {
         this.eventAdd({
            emitter: linkDC,
            eventName: "changeCursor",
            listener: (currentCursor) => {
               // NOTE: we can clear data here to update UI display, then data will be fetched when webix.dataFeed event
               if (
                  !this.settings?.loadAll &&
                  currentCursor?.id != linkDC.previousCursorId
               )
                  this.clearAll();

               this.refreshLinkCursor();
               this.setStaticCursor();
            },
         });
      }

      // add listeners when cursor of the followed data collection is changed
      const followDC = this.datacollectionFollow;
      if (followDC) {
         this.eventAdd({
            emitter: followDC,
            eventName: "changeCursor",
            listener: () => {
               const followCursor = followDC.getCursor();
               const currentCursor = this.getCursor();

               // If the cursor is not the new, then it should not reload.
               if (
                  followCursor?.[followDC.datasource.PK()] ==
                  currentCursor?.[this.datasource.PK()]
               )
                  return;

               this.clearAll();
               this.loadData();
            },
         });
      }
   }

   /*
    * waitForDataCollectionToInitialize()
    * there are certain situations where this datacollection shouldn't
    * load until another one has loaded.  In those cases, the fn()
    * will wait for the required datacollection to emit "initializedData"
    * before continuing on.
    * @param {ABViewDataCollection} DC
    *      the DC this datacollection depends on.
    * @returns {Promise}
    */
   async waitForDataCollectionToInitialize(DC, msg) {
      DC.init();

      return new Promise((resolve, reject) => {
         switch (DC.dataStatus) {
            // if that DC hasn't started initializing yet, start it!
            case DC.dataStatusFlag.notInitial:
               DC.loadData().catch(reject);
            // no break;

            // once in the process of initializing
            /* eslint-disable no-fallthrough*/
            case DC.dataStatusFlag.initializing:
               /* eslint-enable no-fallthrough*/
               // listen for "initializedData" event from the DC
               // then we can continue.
               this.eventRemove("initializedData");
               this.eventAdd({
                  emitter: DC,
                  eventName: "initializedData",
                  listener: () => {
                     // go next
                     resolve();
                  },
               });
               break;

            // if it is already initialized, we can continue:
            case DC.dataStatusFlag.initialized:
               resolve();
               break;

            // just in case, if the status is not known, just continue
            default:
               resolve();
               break;
         }
      });
   }

   /**
    * @method whereCleanUp()
    * Parse through the current where condition and remove any null or
    * empty logical blocks.
    * @param {obj} curr
    *        1) The current where condition in ABQuery Format:
    *        {
    *           glue: [AND, OR],
    *           rules: [ {rule} ]
    *        }
    *        or 2) The current {rule} to validate
    *        {
    *          key:{string},
    *          rule:{string},
    *          vlaue:{mixed}
    *        }
    * @return {ABQuery.where} / { Rule }
    */
   whereCleanUp(curr) {
      if (curr) {
         if (curr.glue && curr.rules) {
            // this is a logical Block (AND, OR)
            // we need to filter the children
            let newValue = { glue: curr.glue, rules: [] };
            curr.rules.forEach((r) => {
               let cleanRule = this.whereCleanUp(r);
               // don't add values that didn't pass
               if (cleanRule) {
                  newValue.rules.push(cleanRule);
               }
            });

            // if we have a non empty block, then return it:
            if (newValue.rules.length > 0) {
               return newValue;
            }

            // this isn't really a valid conditional, so null
            return null;
         }

         // This is a specific rule, that isn't null so:
         return curr;
      }
      return null;
   }

   async loadData(start, limit) {
      // mark data status is initializing
      if (this._dataStatus == this.dataStatusFlag.notInitial) {
         this._dataStatus = this.dataStatusFlag.initializing;
         this.emit("initializingData", {});
      }

      var obj = this.datasource;
      if (obj == null) {
         this._dataStatus = this.dataStatusFlag.initialized;
         return Promise.resolve([]);
      }

      var model = obj.model();
      if (model == null) {
         this._dataStatus = this.dataStatusFlag.initialized;
         return Promise.resolve([]);
      }

      // pull the defined sort values
      var sorts = this.settings.objectWorkspace.sortFields || [];

      // pull filter conditions
      let wheres = this.AB.cloneDeep(
         this.settings.objectWorkspace.filterConditions ?? null
      );
      // if we pass new wheres with a reload use them instead
      if (this.__reloadWheres) {
         wheres = this.__reloadWheres;
      }

      const __additionalWheres = {
         glue: "and",
         rules: [],
      };

      if (this.__filterCond) {
         __additionalWheres.rules.push(this.__filterCond);
      }

      // Filter by a selected cursor of a link DC
      let linkRule = this.ruleLinkedData();
      if (!this.settings.loadAll && linkRule) {
         __additionalWheres.rules.push(linkRule);
      }
      // pull data rows following the follow data collection
      else if (this.datacollectionFollow) {
         const followCursor = this.datacollectionFollow.getCursor();
         // store the PK as a variable
         let PK = this.datasource.PK();
         // if the datacollection we are following is a query
         // add "BASE_OBJECT." to the PK so we can select the
         // right value to report the cursor change to
         if (this.datacollectionFollow.settings.isQuery) {
            PK = "BASE_OBJECT." + PK;
         }
         if (followCursor) {
            start = 0;
            limit = null;
            wheres = {
               glue: "and",
               rules: [
                  {
                     key: this.datasource.PK(),
                     rule: "equals",
                     value: followCursor[PK],
                  },
               ],
            };
         }
         // Set no return rows
         else {
            wheres = {
               glue: "and",
               rules: [
                  {
                     key: this.datasource.PK(),
                     rule: "equals",
                     value: "NO RESULT ROW",
                  },
               ],
            };
         }
      }

      // Combine setting & program filters
      if (__additionalWheres.rules.length) {
         if (wheres.rules.length) {
            __additionalWheres.rules.unshift(wheres);
         }
         wheres = __additionalWheres;
      }

      // remove any null in the .rules
      // if (wheres?.rules?.filter) wheres.rules = wheres.rules.filter((r) => r);
      wheres = this.whereCleanUp(wheres);

      // set query condition
      var cond = {
         where: wheres || {},
         // limit: limit || 20,
         skip: start || 0,
         sort: sorts,
         populate:
            this.settings.populate ??
            (this.settings.preventPopulate ? false : true),
      };

      //// NOTE: we no longer set a default limit on loadData() but
      //// require the platform.loadData() to pass in a default limit.
      if (limit != null) {
         cond.limit = limit;
      }

      // if settings specify loadAll, then remove the limit
      if (this.settings.loadAll && !this.isCursorFollow) {
         delete cond.limit;
      }

      //
      // Step 1: make sure any DataCollections we are linked to are
      // initialized first.  Then proceed with our initialization.
      //
      const parentDc = this.datacollectionLink ?? this.datacollectionFollow;
      // If we are linked to another datacollection then wait for it
      if (parentDc) {
         await this.waitForDataCollectionToInitialize(parentDc);
      }

      //
      // Step 2: if we have any filter rules that depend on other DataCollections,
      // then wait for them to be initialized first.
      // eg: "(not_)in_data_collection" rule filters
      if (wheres?.rules?.length) {
         const dcFilters = [];

         wheres.rules.forEach((rule) => {
            // if this collection is filtered by data collections we need to load them in case we need to validate from them later
            if (
               rule.rule == "in_data_collection" ||
               rule.rule == "not_in_data_collection"
            ) {
               const dv = this.AB.datacollectionByID(rule.value);
               if (dv) {
                  dcFilters.push(this.waitForDataCollectionToInitialize(dv));
               }
            }
         });

         await Promise.all(dcFilters);
      }

      //
      // Step 3: pull data to data collection
      // we will keep track of the resolve, reject for this
      // operation.
      // the actual resolve() should happen in the
      // .processIncomingData() after the  data is processed.
      return new Promise((resolve, reject) => {
         this._pendingLoadDataResolve = {
            resolve: resolve,
            reject: reject,
         };

         this.platformFind(model, cond).catch((err) => {
            reject(err);
         });
      });
   }

   platformFind(model, cond) {
      //// Core Migration Note:
      //// the ABViewDataCollectionCore now manages data in a different way:
      //// local data  vs  Remote Data
      //// this will need to be updated to reflect that management:
      //// (and also explains why we refactored things into .processIncomingData())
      return model.findAll(cond).then((data) => {
         return this.processIncomingData(data);
      });
   }

   /**
    * @method queuedParse()
    * This is an attempt at loading very large datasets into a Webix DC without locking up
    * the display.
    * @param {array} data
    *        The data to load into the __dataCollection
    * @param {callback} cb
    *        A callback to call when the data has been fully loaded.
    */
   async queuedParse(incomingData, cb) {
      const data = incomingData?.data || incomingData;
      if (!data?.length) {
         cb?.();
         return Promise.resolve();
      }

      const total_count = incomingData.total_count;

      let nextData;
      if (data.length > 250) {
         let pos = this.__dataCollection.count();
         let remain = data.splice(250);
         nextData = {
            data: remain,
            pos: pos + data.length,
            total_count,
         };
      }

      const parsedData = {
         data,
         pos: incomingData.pos,
         total_count,
      };
      this.__dataCollection.parse(parsedData);

      return new Promise((resolve) => {
         setTimeout(async () => {
            await this.queuedParse(nextData);
            cb?.();
            resolve();
         }, 15);
      });
   }

   /**
    * processIncomingData()
    * is called from loadData() once the data is returned.  This method
    * allows the platform to make adjustments to the data based upon any
    * platform defined criteria.
    * @param {obj} data  the data as it was returned from the Server
    *        which should be in following format:
    *        {
    *          status: "success", // or "error"
    *          data:[ {ABObjectData}, {ABObjectData}, ...]
    *        }
    */
   processIncomingData(data) {
      return Promise.resolve().then(() => {
         // store total count
         this.__totalCount = data.total_count;

         // Need to .parse at the first time
         if (!this.__dataCollection.find({}).length) {
            this.__dataCollection.clearAll();
            // this.__dataCollection.parse(data);
         }

         if (this.__throttleIncoming) clearTimeout(this.__throttleIncoming);
         this.__throttleIncoming = setTimeout(async () => {
            // using queuedParse() to responsively handle large datasets.
            await this.queuedParse(data);

            // In order to get the total_count updated I had to use .load()
            this.__dataCollection.load(async () => {
               setTimeout(() => {
                  this.refreshLinkCursor();
               }, 250);

               return {
                  // NOTE: return a empty array to prevent render items in DataTable twice. (Items are rendered in .queuedParse function)
                  data: [],
                  pos: data.pos,
                  total_count: data.total_count,
               };
            });

            // this does nothing???
            this.parseTreeCollection(data);

            // if we are linked, then refresh our cursor
            var linkDv = this.datacollectionLink;
            if (linkDv) {
               // filter data by match link data collection
               this.refreshLinkCursor();
               this.setStaticCursor();
            } else {
               // set static cursor
               this.setStaticCursor();
            }

            // now we close out our .loadData() promise.resolve() :
            if (this._pendingLoadDataResolve) {
               this._pendingLoadDataResolve.resolve();

               // after we call .resolve() stop tracking this:
               this._pendingLoadDataResolve = null;
            }

            // If dc set load all, then it will not trigger .loadData in dc at
            // .onAfterLoad event
            if (this.settings.loadAll) {
               this.emit("loadData", {});
            }

            // mark initialized data
            if (this._dataStatus != this.dataStatusFlag.initialized) {
               this._dataStatus = this.dataStatusFlag.initialized;
               this.emit("initializedData", {});
            }
         }, 100);
      });
   }

   /**
    * @method reloadData()
    * Trigger the DataCollection to reload its data from the server.
    * @param {int} start
    *        Start position of where we want the data to load.
    * @param {int} limit
    *        How many entries to load at a time.
    * @return {Promise}
    */
   reloadData(start, limit) {
      // var waitForDataCollectionToInitialize = (DC) => {
      //    return new Promise((resolve, reject) => {
      //       switch (DC.dataStatus) {
      //          // if that DC hasn't started initializing yet, start it!
      //          case DC.dataStatusFlag.notInitial:
      //             DC.loadData().catch(reject);
      //          // no break;

      //          // once in the process of initializing
      //          /* eslint-disable no-fallthrough*/
      //          case DC.dataStatusFlag.initializing:
      //             /* eslint-enable no-fallthrough*/
      //             // listen for "initializedData" event from the DC
      //             // then we can continue.
      //             this.eventAdd({
      //                emitter: DC,
      //                eventName: "initializedData",
      //                listener: () => {
      //                   // go next
      //                   resolve();
      //                },
      //             });
      //             break;

      //          // if it is already initialized, we can continue:
      //          case DC.dataStatusFlag.initialized:
      //             resolve();
      //             break;

      //          // just in case, if the status is not known, just continue
      //          default:
      //             resolve();
      //             break;
      //       }
      //    });
      // };

      return Promise.resolve().then(() => {
         // check if we are currently waiting for more data requests on this datacollection before continuing
         if (this.reloadTimer) {
            // if we are already waiting delete the current timer
            clearTimeout(this.reloadTimer);
            delete this.reloadTimer;
         }

         // return a promise
         if (!this.reloadPromise) {
            this.reloadPromise = new Promise((resolve, reject) => {
               this.reloadPromise__resolve = resolve;
               this.reloadPromise__reject = reject;
            });
         }

         // then create a new timeout to delete current timeout, clear data
         // and load new
         this.reloadTimer = setTimeout(() => {
            // clear the data from the dataCollection,
            this.clearAll();
            // then loads new data from the server
            return this.loadData(start, limit)
               .then(() => {
                  if (this.reloadPromise) {
                     this.reloadPromise__resolve();
                     delete this.reloadPromise;
                     delete this.reloadPromise__resolve;
                     delete this.reloadPromise__reject;
                  }

                  // delete the current setTimeout
                  clearTimeout(this.reloadTimer);
                  delete this.reloadTimer;
               })
               .catch((err) => {
                  if (this.reloadPromise) {
                     this.reloadPromise__reject(err);
                     delete this.reloadPromise;
                     delete this.reloadPromise__resolve;
                     delete this.reloadPromise__reject;
                  }
                  // delete the current setTimeout
                  clearTimeout(this.reloadTimer);
                  delete this.reloadTimer;
               });
         }, 50);
         // setting to 50ms because right now we do not see many
         // concurrent calls,  we need to increase this if we begin to

         return this.reloadPromise;
      });
   }

   /**
    * reloadWheres()
    * stores the child data collections filters for subsequent loads.
    * It is called from bindParentDc() when child data collections that are not
    * marked to load all data are initializing. To do this we use webix
    * server side binding by setting the param of "dataFeed".
    * @param {obj} wheres  the new filters for the data collection
    *        This is a combination of any exisiting filters the data collection
    *        alreay had as well as the filter for the current cursor set by the
    *        master data collection. We store this in __reloadWheres for when
    *        the data needs to be updated.
    *        The format of the wheres is our Query Builder Format
    *        ex: {
    *              "glue": "and",
    *              "rules": [{
    *                "key": "33ba8957-6b9c-4ddb-9533-c46b13878ae1",
    *                "rule": "contains",
    *                "value": "1594176994894"
    *              }]
    *            }
    */
   reloadWheres(wheres) {
      this.__reloadWheres = wheres;
   }

   getData(filter) {
      var dc = this.__dataCollection;
      if (dc) {
         return dc.find((row) => {
            let isValid = true;

            // data collection filter
            // isValid = this.isValidData(row);

            // NOTE: data are filtered from the server side (webix.dataFeed)
            // parent dc filter
            let linkDv = this.datacollectionLink;
            if (linkDv && this.settings.loadAll && isValid) {
               isValid = this.isParentFilterValid(row);
            }

            // addition filter
            if (isValid && filter) {
               isValid = filter(row);
            }

            return isValid;
         });
      } else {
         return [];
      }
   }

   isParentFilterValid(rowData) {
      // data is empty
      if (rowData == null) return false;

      var linkDv = this.datacollectionLink;
      if (linkDv == null) return true;

      const linkObj = linkDv.datasource;
      if (linkObj == null) return true;

      var fieldLink = this.fieldLink;
      if (fieldLink == null) return true;

      // if the parent's cursor is not set we have not filted this collection
      // yet so the data that comes back should be valid
      var linkCursor = linkDv.getCursor();
      if (linkCursor == null) {
         return true;
      }

      var linkVal = rowData[fieldLink.relationName()];
      if (linkVal == null) {
         // try to get relation value(id) again
         if (rowData[fieldLink.columnName]) {
            linkVal = rowData[fieldLink.columnName];
         } else {
            return false;
         }
      }

      let PK = fieldLink.object.PK();

      // array - 1:M , M:N
      if (linkVal.filter) {
         return (
            linkVal.filter(
               (val) =>
                  (val[PK] || val.id || val) ==
                  (linkCursor[linkObj.PK()] || linkCursor.id || linkCursor)
            ).length > 0
         );
      } else {
         return (
            (linkVal[PK] || linkVal.id || linkVal) ==
            (linkCursor[linkObj.PK()] || linkCursor.id || linkCursor)
         );
      }
   }

   clearAll() {
      if (this.__dataCollection) this.__dataCollection.clearAll();

      if (this.__treeCollection) this.__treeCollection.clearAll();

      this._dataStatus = this.dataStatusFlag.notInitial;
   }

   get totalCount() {
      return this.__totalCount || 0;
   }

   ///
   /// Components
   ///

   /**
    * @method bind
    * @param {Object} component - a webix element instance
    */
   bind(/* component */) {
      console.error("Platform.ABDataCollection.bind() Not implemented");
   }

   unbind(/* component */) {
      console.error("Platform.ABDataCollection.unbind() Not implemented");
   }

   removeComponent(comId) {
      // get index
      let index = this.__bindComponentIds.indexOf(comId);

      // delete
      this.__bindComponentIds.splice(index, 1);
   }

   /**
    * @method ruleLinkedData()
    * return a QueryFilter rule that also checks that incoming data is linked
    * to our .datacollectionLink (if it exists).
    * @return {obj} {QueryFilterRule}
    */
   ruleLinkedData() {
      let rule = null;
      const dataCollectionLink = this.datacollectionLink;
      const fieldLink = this.fieldLink;
      if (dataCollectionLink && fieldLink) {
         const linkCursorId = dataCollectionLink?.getCursor()?.id;
         if (linkCursorId) {
            rule = {
               alias: fieldLink.alias, // ABObjectQuery
               key: fieldLink.id,
               rule: fieldLink.alias ? "contains" : "equals", // NOTE: If object is query, then use "contains" because ABOBjectQuery return JSON
               value: fieldLink.getRelationValue(
                  dataCollectionLink.__dataCollection.getItem(linkCursorId)
               ),
            };
         }
      }
      return rule;
   }

   /**
    * @method refreshFilterConditions()
    * This is called in two primary cases:
    *    - on initialization of a DC to setup our filters.
    *    - in the operation of the ABDesigner when using a DC to display data
    *      in the Work_object_grid and the datacollection_work(?)
    * In the case of the ABDesigner, new temporary where conditions are provided
    * from the possible filters we can set, and those need to effect the data
    * we display.
    * @param {ABRowFilter.where} wheres
    *        The filter condition from the ABRowFilter values we are storing.
    */
   refreshFilterConditions(wheres = null) {
      // There are 3 Filters that help us know if our data is Valid:
      // 1) A filter for any ABObjectQuery we are managing.
      // 2) A filter for our own filter condition
      // 3) A filter that represents what our scopes allows

      // Set filter of ABObject
      if (this.__filterDatasource == null)
         this.__filterDatasource = this.AB.filterComplexNew(
            `${this.id}_filterDatasource`
         );

      if (this.datasource) {
         // this.__filterDatasource.applicationLoad(this.datasource.application);
         this.__filterDatasource.fieldsLoad(this.datasource.fields());

         let filterConditions;

         // Query
         if (this.datasource instanceof this.AB.Class.ABObjectQuery) {
            filterConditions = this.datasource.where;
         }
         // Apr 29, 2021 Removed this because we do not want Object filters to
         // effect validation of DataCollections
         // Object

         // else if (this.datasource instanceof ABObject) {
         //    let currentView = this.datasource.currentView();
         //    if (currentView && currentView.filterConditions)
         //       filterConditions = currentView.filterConditions;
         // }

         if (filterConditions)
            this.__filterDatasource.setValue(filterConditions);
         else this.__filterDatasource.setValue({});
      } else {
         this.__filterDatasource.fieldsLoad([]);
         this.__filterDatasource.setValue(
            DefaultValues.settings.objectWorkspace.filterConditions
         );
      }

      // Set filter of data view
      // Apr 29, 2021 Added this code back to validate with DataCollection Filters
      if (this.__filterDatacollection == null)
         this.__filterDatacollection = this.AB.filterComplexNew(
            `${this.id}_filterDatacollection`
         );

      // this.__filterDatacollection.applicationLoad(
      //    this.datasource ? this.datasource.application : null
      // );
      this.__filterDatacollection.fieldsLoad(
         this.datasource ? this.datasource.fields() : []
      );

      // if we pass in wheres, then Save that value to our internal .filterConditions
      if (wheres) this.settings.objectWorkspace.filterConditions = wheres;

      let filter = this.AB.cloneDeep(
         this.settings.objectWorkspace?.filterConditions ?? {
            glue: "and",
            rules: [],
         }
      );

      // if there is a linkRule, add it to filter
      let linkRule = this.ruleLinkedData(); // returns a rule if we are linked
      if (linkRule) {
         // NOTE: linkRule was originally designed to produce a rule for the
         // loadData() routine.  In SQL, our linkRule might have an "equals"
         // rule, to match.  But in this context if our linktype is "many"
         // we need to change the rule to "contains":
         if (this.fieldLink?.linkType() == "many") {
            linkRule.rule = "contains";
         }

         // if linkRule not already IN filter:
         let isAlreadyThere = false;
         let keys = Object.keys(linkRule);
         (filter.rules || []).forEach((r) => {
            if (isAlreadyThere) return;
            let allMatch = true;
            keys.forEach((k) => {
               if (r[k] != linkRule[k]) {
                  allMatch = false;
               }
            });
            isAlreadyThere = allMatch;
         });
         if (!isAlreadyThere) {
            // link Rule needs to be ANDed to our current Rules:
            if (filter.glue == "and") {
               filter.rules.push(linkRule);
            } else {
               filter = { glue: "and", rules: [filter, linkRule] };
            }
         }
      }

      if (filter.rules.length > 0) {
         this.__filterDatacollection.setValue(filter);
      } else {
         this.__filterDatacollection.setValue(
            DefaultValues.settings.objectWorkspace.filterConditions
         );
      }

      // Set filter of user's scope
      if (this.__filterScope == null)
         this.__filterScope = this.AB.filterComplexNew(
            `${this.id}_filterScope`
         );

      if (this.datasource) {
         let scopeList = (this.userScopes || []).filter(
            (s) =>
               !s.allowAll &&
               (s.objectIds || []).indexOf(this.datasource.id) > -1
         );
         if (scopeList && scopeList.length > 0) {
            // this.__filterScope.applicationLoad(this.datasource.application);
            this.__filterScope.fieldsLoad(this.datasource.fields() || []);

            // concat all rules of scopes
            let scopeRules = [];
            scopeList
               .filter(
                  (s) => s.filter && s.filter.rules && s.filter.rules.length
               )
               .forEach((s) => {
                  let sRules = (s.filter.rules || []).filter(
                     (r) =>
                        this.datasource.fields((f) => f.id == r.key).length > 0
                  );

                  scopeRules = scopeRules.concat(sRules);
               });

            let scopeWhere = {
               glue: "or",
               rules: scopeRules,
            };
            this.__filterScope.setValue(scopeWhere);
         }
      }
   }

   get isGroup() {
      return this.__isGroup || false;
   }

   ///
   /// Sync type
   ///

   get syncTypeFlag() {
      return {
         server: 1,
         client: 2,
      };
   }

   get syncType() {
      return this.settings.syncType || DefaultValues.syncType;
   }

   /** Private methods */

   /**
    * @method _dataCollectionNew
    * Get webix.DataCollection
    *
    * @return {webix.DataCollection}
    *
    * @param {Array} data - initial data
    */
   _dataCollectionNew(/*data*/) {
      var error = new Error(
         "the platform.ABDataCollection._dataCollectionNew() is expected to return a proper DataCollection!"
      );
      console.error(error);
      return null;
   }

   /**
    * @method _treeCollectionNew
    * Get webix.TreeCollection
    *
    * @return {webix.TreeCollection}
    *
    */
   _treeCollectionNew() {
      console.error(
         "the platform.ABDataCollection._treeCollectionNew() is expected to return a proper TreeCollection!"
      );
      return null;
   }

   parseTreeCollection(data = {}) {
      // TODO all this does is log "is missing?"
      if (data === {}) {
         console.log(
            "Platform.ABDataCollection.parseTreeCollection() missing!"
         );
      }
   }
   // parseTreeCollection(data = {}) {

   //  if (!(this.__datasource instanceof ABObjectQuery) ||
   //    !this.__datasource.isGroup ||
   //    !this.__treeCollection)
   //    return;

   //  let addRowToTree = (join = {}, parentAlias = null) => {

   //    let alias = join.alias;

   //    (data.data || []).forEach(row => {

   //      let dataId = row[`${alias}.uuid`] || row[`${alias}.id`];
   //      if (!dataId) return;

   //      // find parent nodes
   //      let parentItemIds = [];
   //      let parentId = row[`${parentAlias}.uuid`] || row[`${parentAlias}.id`];
   //      if (parentId) {
   //        parentItemIds = this.__treeCollection
   //          .find(item => item._alias == parentAlias && item._dataId == parentId)
   //          .map(item => item.id);
   //      }

   //      // check exists
   //      let exists = this.__treeCollection.find(item => {
   //        return item._alias == alias &&
   //          item._dataId == dataId &&
   //          (parentItemIds.length == 0 || parentItemIds.indexOf(item.$parent) > -1);
   //      }, true);
   //      if (exists) return;

   //      let treeNode = {};
   //      treeNode._alias = alias;
   //      treeNode._dataId = dataId;
   //      treeNode._itemId = row.id; // Keep row id for set cursor to data collection

   //      Object.keys(row).forEach(propName => {

   //        // Pull value from alias
   //        if (propName.indexOf(`${alias}.`) == 0) {
   //          treeNode[propName] = row[propName];
   //        }

   //      });

   //      if (row.translations)
   //        treeNode.translations = row.translations;

   //      // child nodes
   //      if (parentItemIds.length > 0)
   //        parentItemIds.forEach(parentItemId => {
   //          this.__treeCollection.add(treeNode, null, parentItemId);
   //        });
   //      // root node
   //      else
   //        this.__treeCollection.add(treeNode, null);

   //    });

   //    // Sub-joins
   //    (join.links || []).forEach(link => {
   //      addRowToTree(link, alias);
   //    });

   //  };

   //  // Show loading cursor
   //  (this.__bindComponentIds || []).forEach(comId => {

   //    let boundComp = $$(comId);
   //    if (boundComp &&
   //      boundComp.showProgress)
   //      boundComp.showProgress({ type: "icon" });

   //  });

   //  addRowToTree(this.__datasource.joins());

   //  // Hide loading cursor
   //  (this.__bindComponentIds || []).forEach(comId => {

   //    let boundComp = $$(comId);
   //    if (boundComp &&
   //      boundComp.hideProgress)
   //      boundComp.hideProgress();

   //  })
   // }

   /**
    * @method _queryUpdateData
    *
    * @param {Array} objList - List of ABObject
    * @param {Object} values
    */
   _queryUpdateData(objList, values) {
      let updatedVals = {};

      // Add alias to properties of update data
      Object.keys(values).forEach((key) => {
         objList.forEach((oItem) => {
            let alias = this.datasource.objectAlias(oItem.id);

            updatedVals[`${alias}.${key}`] = values[key];

            // Add alias to properties of .translations
            if (
               key == "translations" &&
               values["translations"] &&
               values["translations"].length
            ) {
               updatedVals.translations = [];

               values["translations"].forEach((tran) => {
                  let updatedTran = {};

                  Object.keys(tran).forEach((tranKey) => {
                     if (tranKey == "language_code")
                        updatedTran["language_code"] = tran["language_code"];
                     else updatedTran[`${alias}.${tranKey}`] = tran[tranKey];
                  });

                  updatedVals.translations.push(updatedTran);
               });
            }
         });
      });

      return updatedVals;
   }

   isValidData(rowData) {
      let result = true;

      // NOTE: should we use filter of the current view of object to filter
      //        if yes, update .wheres condition in .loadData too
      if (this.__filterDatasource)
         result = result && this.__filterDatasource.isValid(rowData);

      if (this.__filterDatacollection)
         result = result && this.__filterDatacollection.isValid(rowData);

      if (result && this.__filterScope)
         result = result && this.__filterScope.isValid(rowData);

      return result;
   }

   updateRelationalDataFromLinkDC(objectId, rowData) {
      const dcLink = this.datacollectionLink;
      const cursorLink = dcLink?.getCursor();

      // Add the new data that just relate to the Link DC
      if (
         dcLink?.datasource.id == objectId &&
         cursorLink &&
         cursorLink.id == rowData?.id
      ) {
         const obj = this.datasource;
         const linkedField = this.fieldLink;
         let relatedData = rowData[linkedField.fieldLink.relationName()];
         if (relatedData && !Array.isArray(relatedData))
            relatedData = [relatedData];

         (relatedData ?? []).forEach((item) => {
            if (item == null) return;

            if (!this.__dataCollection.exists(item[obj.PK()])) {
               // QUESTION: Should we .find to get fully info here ?
               const newItem = this.AB.cloneDeep(item);
               newItem[linkedField.relationName()] = [rowData];
               this.__dataCollection.add(newItem);
            }
         });

         // trigger to components to know there are updated data.
         this.emit("warnRefresh");
      }
   }

   // Clone

   clone(settings) {
      settings = settings || this.toObj();
      var clonedDatacollection = new this.constructor(settings, this.AB);
      clonedDatacollection.__datasource = this.__datasource;
      clonedDatacollection._dataStatus = this._dataStatus;

      // clonedDatacollection.__dataCollection = this.__dataCollection.copy();
      clonedDatacollection.__filterDatacollection.setValue(
         settings.settings.objectWorkspace.filterConditions
      );

      var parseMe = () => {
         if (clonedDatacollection.__dataCollection) {
            clonedDatacollection.__dataCollection.parse(
               this.__dataCollection
                  .find({})
                  .filter((row) =>
                     clonedDatacollection.__filterDatacollection.isValid(row)
                  )
            );
         }
         if (clonedDatacollection.__treeCollection) {
            clonedDatacollection.__treeCollection.parse(
               this.__treeCollection
                  .find({})
                  .filter((row) =>
                     clonedDatacollection.__filterDatacollection.isValid(row)
                  )
            );
         }
      };

      parseMe();

      // return new Promise((resolve, reject) => {
      //    // load the data
      //    clonedDatacollection
      //       .loadData()
      //       .then(() => {

      // set the cursor
      clonedDatacollection.setStaticCursor();

      var cursorID = this.getCursor();
      if (cursorID) {
         // NOTE: webix documentation issue: .getCursor() is supposed to return
         // the .id of the item.  However it seems to be returning the {obj}
         if (cursorID.id) cursorID = cursorID.id;

         clonedDatacollection.setCursor(cursorID);
      }

      return clonedDatacollection;

      // resolve(clonedDatacollection);
      //       })
      //       .catch(reject);
      // });
   }

   filteredClone(filters) {
      var obj = this.toObj();

      // check to see that filters are set (this is sometimes helpful to select the first record without doing so at the data collection level)
      if (filters?.rules?.length) {
         if (obj.settings.objectWorkspace.filterConditions?.rules?.length) {
            obj.settings.objectWorkspace.filterConditions.rules =
               obj.settings.objectWorkspace.filterConditions.rules.concat(
                  filters.rules
               );
         } else {
            obj.settings.objectWorkspace.filterConditions = filters;
         }
      }
      let clonedDC = this.clone(obj);
      return clonedDC; // new ABViewDataCollection(settings, this.application, this.parent);
   }

   //
   // Event handles
   //

   /**
    * @method eventAdd()
    *
    *
    *
    * @param {object} evt - {
    *              emitter: object,
    *              eventName: string,
    *              listener: function
    *            }
    */
   eventAdd(evt) {
      if (!evt || !evt.emitter || !evt.listener) return;

      this.__events = this.__events || [];

      let exists = this.__events.find((e) => {
         return e.emitter == evt.emitter && e.eventName == evt.eventName;
         // && e.listener == evt.listener;
      });

      if (!exists || exists.length < 1) {
         // add to array
         this.__events.push({
            emitter: evt.emitter,
            eventName: evt.eventName,
            listener: evt.listener,
         });

         // listening this event
         evt.emitter.on(evt.eventName, evt.listener);
      }
   }

   /**
    * @method eventClear()
    * unsubscribe all events.
    * should do it before destroy a component
    *
    */
   eventClear() {
      if (this.__events && this.__events.length > 0) {
         this.__events.forEach((e) => {
            e.emitter.removeListener(e.eventName, e.listener);
         });
      }
   }

   /**
    * @method eventRemove()
    * unsubscribe a event.
    *
    */
   eventRemove(eventName) {
      if (this.__events?.length > 0 && eventName) {
         this.__events.forEach((e) => {
            if (eventName == e.eventName)
               e.emitter.removeListener(e.eventName, e.listener);
         });

         this.__events = this.__events.filter((e) => e.eventName != eventName);
      }
   }

   get userScopes() {
      return [];
   }

   get isCursorFollow() {
      return (
         this.settings.followDatacollectionID &&
         (!this.settings.linkDatacollectionID || !this.settings.linkFieldID)
      );
   }

   get datacollectionFollow() {
      if (!this.isCursorFollow) return null;

      return (this.AB ?? AB).datacollectionByID(
         this.settings.followDatacollectionID
      );
   }

   get previousCursorId() {
      return this.__previousCursorId;
   }
};
