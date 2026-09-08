// import { isArray } from "lodash";

//
// ABModelCore
//
// Represents the Data interface for an ABObject data.
//
// to use an ABModel to load a DataTable:
// Method 1:
//  gather all the data externally and send to the DataTable
//    Model.findAll()
//    .then((data)=>{
//      DataTable.parse(data);
//    })
//

export default class ABModelCore {
   constructor(object) {
      // link me to my ABObject
      this.object = object;
      this.AB = object.AB;

      this._where = null;
      this._sort = null;
      this._skip = null;
      this._limit = null;

      this.staleRefreshInProcess = false;
      this.staleRefreshMap = {
         /* id : Promise */
      };
      this.staleRefreshPending = [];
      this.staleRefreshTimerID = null;

      // include this
      this.responseContext = { key: "--", context: {} };
   }

   ///
   /// Static Methods
   ///
   /// Available to the Class level object.  These methods are not dependent
   /// on the instance values of the Application.
   ///

   ///
   /// Instance Methods
   ///

   contextKey(key) {
      this.responseContext.key = key || "--";
   }

   contextValues(values) {
      this.responseContext.context = values || {};
   }

   // Prepare multilingual fields to be untranslated
   // Before untranslating we need to ensure that values.translations is set.
   prepareMultilingualData(values) {
      // if this object has some multilingual fields, translate the data:
      var mlFields = this.object.multilingualFields();
      // if mlFields are inside of the values saved we want to translate otherwise do not because it will reset the translation field and you may loose unchanged translations
      var shouldTranslate = false;
      if (mlFields.length) {
         mlFields.forEach(function (field) {
            if (values[field] != null) {
               shouldTranslate = true;
            }
         });
      }
      if (shouldTranslate) {
         if (
            values.translations == null ||
            typeof values.translations == "undefined" ||
            values.translations == ""
         ) {
            values.translations = [];
         }
         this.object.unTranslate(values, values, mlFields);
      }
   }

   request(/* method, params */) {
      console.error(
         "!!! ABModelCore.request() should be overridden by platform.",
      );
      return Promise.resolve();
   }

   // /**
   //  * @method create
   //  * update model values on the server.
   //  */
   // create(values) {

   //   this.prepareMultilingualData(values);

   //   var params = {
   //     url: this.object.urlRest(),
   //     params: values
   //   }
   //   return this.request('post', params)
   //     .then((data) => {

   //       this.normalizeData(data);

   //       return data;

   //       // FIX: now with sockets, the triggers are fired from socket updates.
   //       // trigger a create event
   //       // triggerEvent('create', this.object, data);

   //     })
   //     .catch(reject);

   // }

   /**
    * @method delete
    * remove this model instance from the server
    * @param {integer} id  the .id of the instance to remove.
    * @return {Promise}
    */
   // delete(id) {

   //   var params = {
   //     url: this.object.urlRestItem(id)
   //   }
   //   return this.request('delete', params)
   //     .then((data) => {

   //       return data;

   //       // FIX: now with sockets, the triggers are fired from socket updates.
   //       // trigger a delete event
   //       // triggerEvent('delete', this.object, id);

   //     })
   // }

   /**
    * @method findAll
    * performs a data find with the provided condition.
    */
   //   findAll(cond) {

   //     cond = cond || {};

   //     var params = {
   //       url: this.object.urlRest(),
   //       params: cond
   //     }
   //     return this.request('get', params)
   //       .then((data) => {

   //         this.normalizeData(data.data);

   //         resolve(data);
   //       })
   //       .catch((err) => {
   // /// TODO: this should be done in platform/ABModel:
   //         // if (err && err.code) {
   //         //  switch(err.code) {
   //         //    case "ER_PARSE_ERROR":
   //         //      OP.Error.log('AppBuilder:ABModel:findAll(): Parse Error with provided condition', { error: err, condition:cond })
   //         //      break;

   //         //    default:
   //         //      OP.Error.log('AppBuilder:ABModel:findAll(): Unknown Error with provided condition', { error: err, condition:cond })
   //         //      break;
   //         //  }

   //         // }
   // console.error(err);
   //       })

   //   }

   urlParamsCreate(values) {
      return {
         url: this.object.urlRest(),
         params: values,
      };
   }

   urlParamsDelete(id) {
      return {
         url: this.object.urlRestItem(id),
      };
   }

   urlParamsFind(cond) {
      return {
         url: this.object.urlRest(),
         params: cond || {},
      };
   }

   urlParamsUpdate(id, values) {
      return {
         url: this.object.urlRestItem(id),
         params: values,
      };
   }

   /**
    * @method count
    * count a data find with the provided condition.
    */
   count(cond) {
      cond = cond || {};

      var params = {
         url: this.object.urlRestCount(),
         params: cond,
      };
      return this.request("get", params)
         .then((numberOfRows) => {
            // resolve(numberOfRows);
            return numberOfRows;
         })
         .catch((err) => {
            // TODO: this should be done in platform/ABModel

            // OP.Error.log('AppBuilder:ABModel:count(): Parse Error with provided condition', { error: err, condition:cond })

            // reject(err);
            console.error(err);
         });
   }

   /**
    * @method staleRefresh
    * Process a request to refresh the data for a given entry.
    * This method is called from a ABDataview when it receives
    * a 'ab.datacollection.stale' message.
    * This method will try to queue similar reqeusts and then issue 1 large
    * request, rather than numerous individual ones.
    * @param {obj} cond  the condition of the entry we are requesting.
    * @return {Promise}
    */
   staleRefresh(cond) {
      // cond should be { where:{ id: X } } format.
      var PK = this.object.PK();

      var currID = cond[PK]; // just in case we get a { id: X }
      if (cond.where) {
         currID = cond.where[PK];
      }

      return new Promise((resolve, reject) => {
         if (!currID) {
            var Err = new Error(
               "Model.staleRefresh(): could not resolve ." + PK,
            );
            Err.cond = cond;
            reject(Err);
            return;
         }

         // convert to PK : Promise object:
         var entry = {
            resolve: resolve,
            reject: reject,
         };
         entry[PK] = currID;

         // queue up refresh condition
         this.staleRefreshPending.push(entry);

         // if ! staleRefreshInProcess
         if (!this.staleRefreshInProcess) {
            // set timeout to another 200ms wait after LAST staleRefresh()
            if (this.staleRefreshTimerID) {
               clearTimeout(this.staleRefreshTimerID);
            }
            this.staleRefreshTimerID = setTimeout(() => {
               this.staleRefreshProcess();
            }, 200);
         }
      });
   }

   /**
    * @method staleRefreshProcess
    * Actually process the current pending requests.
    */
   staleRefreshProcess() {
      this.staleRefreshInProcess = true;
      var currentEntries = this.staleRefreshPending;
      this.staleRefreshPending = [];
      var PK = this.object.PK();

      var responseHash = {
         /* id : [{entry}] */
      };
      var cond = { where: {}, populate: true };
      cond.where[PK] = [];

      console.log(
         "Model.staleRefreshProcess(): buffered " +
            currentEntries.length +
            " requests",
      );
      currentEntries.forEach((e) => {
         responseHash[e[PK]] = responseHash[e[PK]] || [];
         responseHash[e[PK]].push(e);
      });

      cond.where[PK] = Object.keys(responseHash);

      this.findAll(cond).then((res) => {
         // for each entry we got back
         if (Array.isArray(res.data) && res.data.length) {
            res.data.forEach((data) => {
               // find it's matching request:
               if (responseHash[data[PK]]) {
                  // respond to the pending promise
                  // and remove these entries from responseHash
                  var entries = responseHash[data[PK]];
                  entries.forEach((entry) => {
                     var resolve = entry.resolve;
                     resolve({ data: [data] });
                  });

                  delete responseHash[data[PK]];
               } else {
                  console.error(
                     "Model.staleRefreshProcess(): returned entry was not in our responseHash:",
                     data,
                     responseHash,
                  );
               }
            });
         }

         // now if there are any entries left in responseHash,
         // respond with an empty entry:
         var allKeys = Object.keys(responseHash);
         if (allKeys.length > 0) {
            console.warn(
               "Model.staleRefreshProcess(): " +
                  allKeys.length +
                  " entries with no responses. ",
            );
         }
         allKeys.forEach((key) => {
            let entry = responseHash[key];
            let resolve;
            if (Array.isArray(entry)) {
               resolve = entry[0].resolve;
            } else {
               resolve = entry.resolve;
            }
            resolve({ data: [] });
            delete responseHash[key];
         });

         // now check to see if there are any more pending requests:
         if (this.staleRefreshPending.length > 0) {
            // process them:
            this.staleRefreshProcess();
         } else {
            // mark we are no longer processing stale requests.
            this.staleRefreshInProcess = false;
         }
      });
   }

   /**
     * @method findConnected
     * return the connected data associated with an instance of this model.
     *
     * to limit the result to only a single connected column:
     *    model.findConnected( 'col1', {data})
     *    then ((data) => {
     *      // data = [{obj1}, {obj2}, ... {objN}]
     *    })
     *
     * To find >1 connected field data:
     *    model.findConnected( ['col1', 'col2'], {data} )
     *    .then((data) =>{
     *    
     *      // data = {
     *      //     col1 : [{obj1}, {obj2}, ... {objN}],
     *      //     col2 : [{obj1}, {obj2}, ... {objN}]
     *      // }
     *    })
     *
     * To find all connected field data:
     *    model.findConnected( {data} )
     *    .then((data) =>{
     *    
     *      // data = {
     *      //     connectedColName1 : [{obj1}, {obj2}, ... {objN}],
     *      //     connectedColName2 : [{obj1}, {obj2}, ... {objN}],
     *      //    ...
     *      //     connectedColNameN : [{obj1}, {obj2}, ... {objN}]
     *      // }
     *    })

     * @param {string/array} fields  [optional] an array of connected fields you want to return.
     * @param {obj} data  the current object instance (data) to lookup
     * @return {Promise}
     */
   findConnected(fields, data) {
      if (typeof data == "undefined") {
         if (!Array.isArray(fields) && typeof fields == "object") {
            data = fields;
            fields = []; // return all fields
         }
      }

      if (typeof fields == "string") {
         fields = [fields]; // convert to an array of values
      }

      return new Promise((resolve, reject) => {
         // sanity checking:
         if (!data.id) {
            // I can't find any connected items, if I can't find this one:
            resolve(null);
            return;
         }

         let cond = {};
         cond[this.object.PK()] = data.id;
         this.findAll({ where: cond, populate: true })
            .then((results) => {
               if (
                  !results.data ||
                  !Array.isArray(results.data) ||
                  results.data.length == 0
               ) {
                  resolve([]); // no data to return.
                  return;
               }

               // work with the first object.
               var myObj = results.data[0];

               // if only 1 field requested, then return that
               if (fields.length == 1) {
                  let data =
                     myObj[
                        fields[0].replace(/[^a-z0-9.]/gi, "") + "__relation"
                     ];
                  if (!data) return resolve([]);

                  if (!Array.isArray(data)) data = [data];

                  resolve(data);
                  return;
               }

               // if no fields requested, return them all:
               if (fields.length == 0) {
                  var allFields = this.object.fields((f) => {
                     return f.settings.linkType;
                  });
                  allFields.forEach((f) => {
                     fields.push(f.columnName);
                  });
               }

               var returnData = {};
               fields.forEach((colName) => {
                  returnData[colName] =
                     myObj[colName.replace(/[^a-z0-9.]/gi, "") + "__relation"];
               });

               resolve(returnData);
            })
            .catch((err) => {
               console.error("!!! error with findConnected() attempt:", err);
               reject(err);
            });
      });
   }

   // /**
   //  * @method loadInto
   //  * loads the current values into the provided Webix DataTable
   //  * @param {DataTable} DT  A Webix component that can dynamically load data.
   //  */
   // loadInto(DT) {

   //   // if a limit was applied, then this component should be loading dynamically
   //   if (this._limit) {

   //     DT.define('datafetch', this._limit);
   //     DT.define('datathrottle', 250);  // 250ms???

   //     // catch the event where data is requested:
   //     // here we will do our own findAll() so we can persist
   //     // the provided .where condition.

   //     // oh yeah, and make sure to remove any existing event handler when we
   //     // perform a new .loadInto()
   //     DT.___AD = DT.___AD || {};
   //     if (DT.___AD.onDataRequestEvent) {
   //       DT.detachEvent(DT.___AD.onDataRequestEvent);
   //     }
   //     DT.___AD.onDataRequestEvent = DT.attachEvent("onDataRequest", (start, count) => {

   //       var cond = {
   //         where: this._where,
   //         sort: this._sort,
   //         limit: count,
   //         skip: start
   //       }

   //       if (DT.showProgress)
   //         DT.showProgress({ type: "icon" });

   //       this.findAll(cond)
   //         .then((data) => {
   //           data.data.forEach((item) => {
   //             if (item.properties != null && item.properties.height != "undefined" && parseInt(item.properties.height) > 0) {
   //               item.$height = parseInt(item.properties.height);
   //             } else if (parseInt(this._where.height) > 0) {
   //               item.$height = parseInt(this._where.height)
   //             }
   //           });
   //           DT.parse(data);

   //           if (DT.hideProgress)
   //             DT.hideProgress();

   //         })

   //       return false; // <-- prevent the default "onDataRequest"
   //     });

   //     DT.refresh();
   //   }

   //   // else just load it all at once:
   //   var cond = {};
   //   if (this._where) cond.where = this._where;
   //   if (this._sort) cond.sort = this._sort;
   //   if (this._limit != null) cond.limit = this._limit;
   //   if (this._skip != null) cond.skip = this._skip;

   //   if (DT.showProgress)
   //     DT.showProgress({ type: "icon" });

   //   this.findAll(cond)
   //     .then((data) => {
   //       data.data.forEach((item) => {
   //         if (item.properties != null && item.properties.height != "undefined" && parseInt(item.properties.height) > 0) {
   //           item.$height = parseInt(item.properties.height);
   //         } else if (parseInt(this._where.height) > 0) {
   //           item.$height = parseInt(this._where.height)
   //         }
   //       });
   //       DT.parse(data);

   //       if (DT.hideProgress)
   //         DT.hideProgress();

   //     })
   //     .catch((err) => {
   //       console.error('!!!!!', err);
   //     })

   // }

   // /**
   //  * @method limit
   //  * set the limit value for this set of data
   //  * @param {integer} limit  the number or elements to return in this call
   //  * @return {ABModel} this object that is chainable.
   //  */
   // limit(limit) {
   //   this._limit = limit;
   //   return this;
   // }

   // /**
   //  * @method skip
   //  * set the skip value for this set of data
   //  * @param {integer} skip  the number or elements to skip
   //  * @return {ABModel} this object that is chainable.
   //  */
   // skip(skip) {
   //   this._skip = skip;
   //   return this;
   // }

   //   /**
   //    * @method update
   //    * update model values on the server.
   //    */
   //   update(id, values) {

   //     this.prepareMultilingualData(values);

   //     // remove empty properties
   //     for (var key in values) {
   //       if (values[key] == null)
   //         delete values[key];
   //     }

   //     var params = {
   //       url: this.object.urlRestItem(id),
   //       params: values
   //     }
   //     return this.request('put', params)
   //       .then((data) => {

   //         // .data is an empty object ??

   //         this.normalizeData(data);

   //         return data;

   //         // FIX: now with sockets, the triggers are fired from socket updates.
   //         // trigger a update event
   //         // triggerEvent('update', this.object, data);

   //       })
   //       .catch((err)=>{
   // console.error(err);
   //       });

   //   }

   /**
    * @method upsert
    * upsert model values on the server.
    */
   upsert(values) {
      this.prepareMultilingualData(values);

      // remove empty properties
      for (var key in values) {
         if (values[key] == null) delete values[key];
      }

      var params = {
         url: this.object.urlRest(),
         params: values,
      };
      return this.request("put", params)
         .then((data) => {
            // .data is an empty object ??

            this.normalizeData(data);

            return data;

            // FIX: now with sockets, the triggers are fired from socket updates.
            // trigger a update event
            // triggerEvent('update', this.object, data);
         })
         .catch((err) => {
            console.error(err);
         });
   }

   /**
    * @method where
    * set the where condition for the data being loaded.
    * @param {json} cond  the json condition statement.
    * @return {ABModel} this object that is chainable.
    */
   where(cond) {
      this._where = cond;
      return this;
   }

   /**
    * @method where
    * set the sort condition for the data being loaded.
    * @param {json} cond  the json condition statement.
    * @return {ABModel} this object that is chainable.
    */
   sort(cond) {
      this._sort = cond;
      return this;
   }

   /**
    * @method refresh
    * refresh model definition on the server.
    */
   refresh() {
      console.error("!!! Depreciated: where is this being called from?");
      return Promise.resolve();

      // var params = {
      //    url: this.object.urlRestRefresh(),
      // };
      // return this.request("put", params);
   }

   /**
    * @method isCsvPacked
    * check if the data is packed in a csv format
    * @param {json} data  the json condition statement.
    * @return {boolean} true if the data is packed in a csv format
    *                   false if the data is not packed in a csv format
    */
   isCsvPacked(data) {
      if (data.csv_packed) {
         return true;
      }
      return false;
   }

   csvPackPrepareFirstRow(myObject, content) {
      const firstRow = content[0];

      // Note: CSV will refer to the columns at the first row in a list to generate CSV columns.
      // if the first row were missing somecolumns and the next rows has those columns.
      // they will lost those columns and values
      if (firstRow) {
         const columnNames = Object.keys(firstRow);
         for (const missingField of myObject.fields(
            (f) => columnNames.indexOf(f.columnName) === -1,
         ))
            firstRow[missingField.columnName] = undefined;
      }
   }

   csvPackStringifyFields(myObject, content) {
      // stringify any potential json data
      // starting with List data
      let keys = ["list", "json", "file"];
      let stringifyFields = myObject.fields((f) => keys.indexOf(f.key) > -1);
      stringifyFields.forEach((f) => {
         for (let I = 0; I < content.length; I++) {
            let row = content[I];
            if (row[f.columnName]) {
               row[f.columnName] = JSON.stringify(row[f.columnName]);
            }
         }
      });
   }

   csvPackMergeRelations(relations, id, connHash) {
      relations[id] = this.AB.defaultsDeep(relations[id] || {}, connHash);
   }

   csvPackGetRelations(myObject, content, visited = new Set()) {
      let relations = {
         /* objectID: { row.id: entryJSON} */
      };

      // Check for circular reference
      if (visited.has(myObject.id)) {
         console.warn(`Circular reference detected for object ${myObject.id}`);
         return relations;
      }
      visited.add(myObject.id);

      // break out and compact the connected data
      let connections = myObject.connectFields();
      connections.forEach((connField) => {
         let connHash = {};
         let relationName = connField.relationName();

         // gather all the connected data for this field
         for (let I = 0; I < content.length; I++) {
            let row = content[I];
            if (row[relationName]) {
               if (Array.isArray(row[relationName])) {
                  row[relationName].forEach((r) => {
                     let rval = connField.getRelationValue(r);
                     if (rval != null && !connHash[rval]) {
                        connHash[rval] = r;
                     }
                  });
               } else {
                  let r = row[relationName];
                  let rval = connField.getRelationValue(r);
                  if (rval != null && !connHash[rval]) {
                     connHash[rval] = r;
                  }
               }
            }
         }

         let connObject = connField.datasourceLink;
         let values = Object.values(connHash);
         if (values.length > 0) {
            this.csvPackMergeRelations(relations, connObject.id, connHash);

            let connRelations = this.csvPackGetRelations(
               connObject,
               values,
               visited,
            );

            // merge these into my relations
            Object.keys(connRelations).forEach((id) => {
               this.csvPackMergeRelations(relations, id, connRelations[id]);
            });
         }
      });
      visited.delete(myObject.id);
      return relations;
   }

   csvPackReIndexRelations(relations) {
      Object.keys(relations).forEach((id) => {
         Object.keys(relations[id]).forEach((cid, indx) => {
            relations[id][cid]._csvID = indx;
         });
      });
   }

   csvPackReEncodeRelations(relations, myObject, content) {
      let connections = myObject.connectFields();
      connections.forEach((connField) => {
         let relationName = connField.relationName();
         let connObject = connField.datasourceLink;
         let connHash = relations[connObject.id];

         // now reencode the connection data to reference the new _csvID
         for (let I = 0; I < content.length; I++) {
            let row = content[I];
            let ids = [];
            let hasRelationData = false;
            if (row[relationName]) {
               hasRelationData = true;
               if (Array.isArray(row[relationName])) {
                  row[relationName].forEach((r) => {
                     let rval = connField.getRelationValue(r);
                     if (
                        rval != null &&
                        connHash[rval] &&
                        connHash[rval]._csvID != null
                     ) {
                        ids.push(connHash[rval]._csvID);
                     }
                  });
               } else {
                  let r = row[relationName];
                  let rval = connField.getRelationValue(r);
                  if (
                     rval != null &&
                     connHash[rval] &&
                     connHash[rval]._csvID != null
                  ) {
                     ids.push(connHash[rval]._csvID);
                  }
               }
            }
            // only make an update if it did have relation data
            if (hasRelationData) {
               row[connField.columnName] = JSON.stringify(ids);
               delete row[relationName];
            }
         }
      });
   }

   csvPackFinalModifications(myObject, content) {
      let connPK = myObject.PK();
      const isPKID = connPK === "id";
      content.forEach((c) => {
         if (!isPKID && c.id == c[connPK]) {
            delete c.id;
         }

         // if translations are present return them to an object
         if (c.translations && typeof c.translations != "string") {
            c.translations = JSON.stringify(c.translations);
         }
      });
   }

   /**
    * @method csvPack
    * pack the data into a csv format
    * @param {json} data
    *               The original data format.
    *              {
    *                data: [{obj1}, {obj2}, ... {objN}],
    *                total_bytes:xx,
    *              }
    * @return {json} the csv packed data
    *                {
    *                  csv_packed:{
    *                    data: "<csv data>",
    *                    relations: {
    *                      {connectionID}: "<csv data>",
    *                      {connectionID}: "<csv data>",
    *                      ...
    *                    },
    *                  },
    *                  total_bytes:xx,
    *                }
    */
   async csvPack(data, batchSize = 10000, jobID) {
      // data should be the original json data packet we want to send
      // {
      //   data: [{obj1}, {obj2}, ... {objN}],
      //   total_bytes:xx,
      // }
      // we want to convert this to:
      // {
      //   csv_packed:{
      //     data: "csv data",
      //     relations: {
      //       {connectionID}: "csv data", // each entry has entry._csvID, that is the lookup
      //       {connectionID}: "csv data",
      //       ...
      //   }
      //   total_bytes:xx,
      // }

      if (!data || typeof data !== "object") {
         throw new Error("csvPack: Invalid data parameter");
      }
      if (data.data === undefined) {
         throw new Error("csvPack: data.data is required");
      }

      let packedData = { data: "", relations: {} };
      let myObject = this.object;

      let content = data.data;
      if (!content || (Array.isArray(content) && content.length === 0)) {
         // Return the original data if there is no content to pack
         // existing code will handle this fine.
         return data;
      }
      this.csvPackPrepareFirstRow(myObject, content);

      let returnType = "array";
      if (!Array.isArray(content)) {
         returnType = "single";
         content = [content];
      }
      content = content.filter((row) => !this.AB.isNil(row));

      this.csvPackStringifyFields(myObject, content);

      let relations = this.csvPackGetRelations(myObject, content);
      // { objectID: { row.id: entryJSON}}

      this.csvPackReIndexRelations(relations);

      // now reencode the connection data to reference the new _csvID
      // do this for the main content
      this.csvPackReEncodeRelations(relations, myObject, content);
      this.csvPackFinalModifications(myObject, content);

      // do this for the relations as well
      let allIds = Object.keys(relations);
      for (let i = 0; i < allIds.length; i++) {
         let id = allIds[i];
         let relatedObj = this.AB.objectByID(id);
         if (relatedObj) {
            let values = Object.values(relations[id]);
            this.csvPackReEncodeRelations(relations, relatedObj, values);
            this.csvPackFinalModifications(relatedObj, values);
            packedData.relations[id] = await this.AB.jsonToCsvBatched(
               values,
               batchSize,
               jobID,
            );
         }
      }

      // now convert the data to CSV
      packedData.data = await this.AB.jsonToCsvBatched(
         content,
         batchSize,
         jobID,
      );
      packedData.type = returnType; // single or array

      let newData = {};
      Object.keys(data).forEach((key) => {
         if (key != "data") {
            newData[key] = data[key];
         }
      });
      newData.csv_packed = packedData;
      return newData;
   }

   csvUnpackUnstringifyFields(myObject, data) {
      let connPK = myObject.PK();
      let keyFields = ["list", "boolean", "number", "json", "file"];
      let parseFields = myObject.fields((f) => keyFields.indexOf(f.key) > -1);
      data.forEach((row) => {
         // unstringify any list,bool,number,file fields
         parseFields.forEach((f) => {
            let val = row[f.columnName];
            if (val && typeof val == "string") {
               try {
                  row[f.columnName] = JSON.parse(val);
               } catch (e) {
                  // sometimes "list" fields are not JSON parseable
                  if (f.key != "list" && val !== "[object Object]") {
                     console.error(
                        "Error parsing JSON data for column: " + f.columnName,
                        val,
                        e,
                     );
                  }
               }
            }
         });

         // if translations are present return them to an object
         if (row.translations) {
            try {
               row.translations = JSON.parse(row.translations);
            } catch (e) {
               // just leave it as it is
            }
         }

         // readd .id to the row
         if (!row.id) {
            if (row[connPK]) {
               row.id = row[connPK];
            }
         }
      });
   }

   csvUnpackReconnectRelations(relations, myObject, data) {
      let connections = myObject.connectFields();
      connections.forEach((connField) => {
         let relationName = connField.relationName();

         let relationObject = connField.datasourceLink;
         let connHash = relations[relationObject.id];
         if (connHash) {
            data.forEach((row) => {
               let ids = [];
               let populatedData = [];
               let entries = [];
               if (typeof row[connField.columnName] !== "undefined") {
                  try {
                     // ok, we know this is a possibility, so just skip it
                     if (row[connField.columnName] !== "") {
                        entries = JSON.parse(row[connField.columnName]);
                     }
                  } catch (e) {
                     if (row[connField.columnName] == "") {
                        // not a problem, just no data
                     } else {
                        // this might be a situation on the server where
                        // row[columnName] has a value, but row[relationName] is empty.
                        if (typeof row[relationName] == "undefined") {
                           row[relationName] = null;
                        }
                        // console.error(
                        //    "Error parsing JSON data for column: " +
                        //       connField.columnName,
                        //    e
                        // );
                     }
                  }
                  if (!Array.isArray(entries)) {
                     entries = [entries];
                  }
                  entries.forEach((id) => {
                     if (id != null && connHash[id]) {
                        let connEntry = connHash[id];
                        ids.push(connField.getRelationValue(connEntry));
                        // Alternatively, we could remove the row[columnName] and let
                        // normalizeData() repopulate it.
                        populatedData.push(connEntry);
                     } else if (id != null) {
                        console.warn(
                           `Missing relation entry for _csvID: ${id}`,
                        );
                     }
                  });
                  if (connField.linkType() == "many") {
                     row[connField.columnName] = ids;
                     row[connField.relationName()] = populatedData;
                  } else {
                     row[connField.columnName] = ids[0] ?? null;
                     row[connField.relationName()] = populatedData[0] ?? null;
                  }
               }
            });
         }
      });

      // final pass to clear up stringified relation data
      data.forEach((row) => {
         connections.forEach((connField) => {
            // many connections must be an array, not "[]"
            if (connField.linkType() == "many") {
               let val = row[connField.columnName];
               if (val && typeof val == "string") {
                  row[connField.columnName] = JSON.parse(val);
               }
            }
         });
      });
   }

   csvUnpackClearCSVID(relations) {
      Object.keys(relations).forEach((id) => {
         Object.keys(relations[id]).forEach((cid) => {
            delete relations[id][cid]._csvID;
         });
      });
   }

   /**
    * @method csvUnpack
    * unpack the data from our csv format
    * @param {json} data
    *              The csv packed data format.
    * @return {json} the unpacked data
    */
   csvUnpack(data) {
      // data should be a data packet returned from the server
      // {
      //   csv_packed:{
      //     data: "csv data",
      //     relations: {
      //       {connectionID}: "csv data", // each entry has entry._csvID, that is the lookup
      //       {connectionID}: "csv data",
      //       ...
      //   }
      //   total_bytes:xx,
      // }
      // we want to convert this to:
      // {
      //   data: [{obj1}, {obj2}, ... {objN}],
      //   total_bytes:xx,
      // }
      if (!data || !data.csv_packed) {
         throw new Error("csvUnpack: Invalid data format - csv_packed missing");
      }
      if (typeof data.csv_packed.data !== "string") {
         throw new Error("csvUnpack: Invalid csv_packed.data format");
      }

      let myObject = this.object;
      let parseResult = this.AB.csvToJson(data.csv_packed.data);
      // parseResult = { data: [], errors:[], meta:{}}

      let returnType = data.csv_packed.type;

      if (parseResult.errors?.length) {
         // ignore common error when .data is ""
         if (data.csv_packed.data !== "") {
            console.error("Error parsing CSV data:", parseResult.errors);
            console.error("Original CSV data:");
            console.error(data.csv_packed.data);
            console.error("result:");
            console.error(parseResult.data);
         }
      }
      let jsonData = parseResult.data;

      let relations = {};
      Object.keys(data.csv_packed.relations).forEach((id) => {
         relations[id] = this.AB.csvToJson(data.csv_packed.relations[id]).data;
      });

      this.csvUnpackUnstringifyFields(myObject, jsonData);
      Object.keys(relations).forEach((id) => {
         let relatedObj = this.AB.objectByID(id);
         if (relatedObj) {
            this.csvUnpackUnstringifyFields(relatedObj, relations[id]);
            // to hash by _csvID
            let hash = {};
            relations[id].forEach((c) => {
               hash[c._csvID] = c;
            });
            relations[id] = hash;
         }
      });

      // now reconnect the data
      Object.keys(relations).forEach((id) => {
         let relatedObj = this.AB.objectByID(id);
         if (relatedObj) {
            let values = Object.values(relations[id]);
            this.csvUnpackReconnectRelations(relations, relatedObj, values);
         }
      });

      this.csvUnpackReconnectRelations(relations, myObject, jsonData);

      this.csvUnpackClearCSVID(relations);

      let returnData = {};
      Object.keys(data).forEach((key) => {
         if (key != "csv_packed") {
            returnData[key] = data[key];
         }
      });
      returnData.data = jsonData;

      if (returnType == "single" && Array.isArray(returnData.data)) {
         returnData.data = returnData.data[0];
      }
      return returnData;
   }

   normalizeData(data) {
      // convert to array
      if (!(data instanceof Array)) data = [data];

      // find all connected fields
      var connectedFields = this.object.connectFields();

      // if this object has some multilingual fields, translate the data:
      var mlFields = this.object.multilingualFields();

      // if this object has some date fields, convert the data to date object:
      var dateFields =
         this.object.fields(function (f) {
            return f.key == "date" || f.key == "datetime";
         }) || [];

      // calculate fields
      var calculatedFields = this.object.fields((f) => f.key == "calculate");

      data.forEach((d) => {
         if (d == null) return;

         // various PK name
         if (!d.id && this.object.PK() != "id") d.id = d[this.object.PK()];

         // loop through data's connected fields
         connectedFields.forEach((c) => {
            // get the relation name so we can change the original object
            var relationName = c.relationName();

            // if (d[c.columnName] == null)
            //  d[c.columnName] = '';

            // Our client side tools need to know that this value is null if it
            // isn't provided:
            if (
               typeof d[relationName] == "undefined" &&
               typeof d[c.columnName] == "undefined"
            ) {
               d[relationName] = null;
               d[c.columnName] = null;
               return;
            }

            // if there is no data we can exit now
            if (d[relationName] == null) return;

            // if relation data is still a string and isn't empty
            if (
               typeof d[relationName] == "string" &&
               d[relationName].length > 0
            ) {
               // parse the string into an object
               d[relationName] = JSON.parse(d[relationName]);
            }

            // if the data is an array we need to loop through it
            if (Array.isArray(d[relationName])) {
               d[relationName].forEach((r) => {
                  // if translations are present and they are still a string
                  if (r.translations && typeof r.translations == "string") {
                     // parse the string into an object
                     r.translations = JSON.parse(r.translations);
                  }
               });
               // if the data is not an array it is a single item...check that has translations and it is a string
            } else if (
               d[relationName].translations &&
               typeof d[relationName].translations == "string"
            ) {
               // if so parse the string into an object
               d[relationName].translations = JSON.parse(
                  d[relationName].translations,
               );
            }

            // set .id to relation columns
            let objectLink = c.datasourceLink;

            // if we didn't get the linked object, just return.
            if (!objectLink) return;

            let olPK = objectLink.PK();
            var relatedMlFields = objectLink.multilingualFields();

            if (Array.isArray(d[relationName])) {
               d[relationName].forEach((subData) => {
                  // update .id values
                  // if (olPK != "id" && subData[olPK]) subData.id = subData[olPK];
                  const relationValue = c.getRelationValue(subData);
                  if (olPK != "id") subData.id = relationValue;

                  // perform Translation
                  if (relatedMlFields.length) {
                     objectLink.translate(subData, subData, relatedMlFields);
                  }
               });
            } else {
               // update .id value
               // if (d[relationName][olPK]) {
               //    d[relationName].id = d[relationName][olPK];
               // }
               const relationValue = c.getRelationValue(d[relationName]);
               if (relationValue) {
                  d[relationName].id = relationValue;
               }

               // perform Translation
               if (relatedMlFields.length) {
                  objectLink.translate(
                     d[relationName],
                     d[relationName],
                     relatedMlFields,
                  );
               }
            }

            // if (
            //    objectLink &&
            //    olPK != "id" &&
            //    d[relationName] &&
            //    !d[relationName].id
            // ) {
            //    // is array
            //    if (d[relationName].forEach) {
            //       d[relationName].forEach((subData) => {
            //          if (subData[olPK]) subData.id = subData[olPK];
            //       });
            //    } else if (d[relationName][olPK]) {
            //       d[relationName].id = d[relationName][olPK];
            //    }
            // }

            // if (relatedMlFields.length) {
            //    d[relationName];
            //    objectLink.translate(
            //       d[relationName],
            //       d[relationName],
            //       relatedMlFields
            //    );
            // }

            // Change property name of connected field
            if (!d[c.columnName]) {
               if (c.linkType() == "one") {
                  if (d[relationName]) {
                     // d[c.columnName] = d[relationName][olPK];
                     d[c.columnName] = c.getRelationValue(d[relationName]);
                  } else {
                     d[c.columnName] = null;
                  }
               } else {
                  if (d[relationName]) {
                     if (Array.isArray(d[relationName])) {
                        try {
                           d[c.columnName] = (d[relationName] || []).map(
                              // (i) => i[olPK]
                              (i) => c.getRelationValue(i),
                           );
                        } catch (e) {
                           console.log("+++++++++++++++");
                           console.log(`ID:[${c.id}]`);
                           console.log(`ColumnName:[${c.label}]`);
                           console.log(`relationName:[${relationName}]`);
                           console.log(`linkType:[${c.linkType()}]`);
                           console.log("data:");
                           console.log(JSON.stringify(d[relationName]));
                           console.log("+++++++++++++++");
                        }
                     } else {
                        // this is strange: supposed to be "many" but coming in
                        // as "one"
                        console.log("+++++++++++++++");
                        console.log(`ID:[${c.id}]`);
                        console.log(`ColumnName:[${c.label}]`);
                        console.log(`relationName:[${relationName}]`);
                        console.log(`linkType:[${c.linkType()}]`);
                        console.log("data:");
                        console.log(JSON.stringify(d[relationName]));
                        console.log("+++++++++++++++");
                        // d[c.columnName] = [d[relationName][olPK]];
                        d[c.columnName] = [c.getRelationValue(d[relationName])];
                     }
                  } else {
                     d[c.columnName] = [];
                  }
               }
            }
         });

         if (mlFields.length) {
            this.object.translate(d, d, mlFields);
         }

         // convert the data to date object
         dateFields.forEach((date) => {
            if (d && d[date.columnName] != null) {
               // check to see if data has already been converted to a date object
               if (typeof d[date.columnName] == "string") {
                  if (date.key == "date") {
                     // if we are ignoring the time it means we ignore timezone as well
                     // so lets trim that off when creating the date so it can be a simple date
                     d[date.columnName] = this.AB.rules.toDate(
                        d[date.columnName],
                        {
                           format: "MM/DD/YYYY",
                           ignoreTime: true,
                        },
                     );
                  } else {
                     // Convert UTC to Date
                     d[date.columnName] = this.AB.rules.toDate(
                        d[date.columnName],
                     );
                     // d[date.columnName] = new Date(moment(d[date.columnName]));
                  }
               }
            }
         });

         calculatedFields.forEach((calField) => {
            d[calField.columnName] = calField.format(d);
         });
      });
   }
}
