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

module.exports = class ABModelCore {
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

   request(method, params) {
      console.error(
         "!!! ABModelCore.request() should be overridden by platform."
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
            resolve(numberOfRows);
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
               "Model.staleRefresh(): could not resolve ." + PK
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
      var cond = { where: {} };
      cond.where[PK] = [];

      console.log(
         "Model.staleRefreshProcess(): buffered " +
            currentEntries.length +
            " requests"
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
                     responseHash
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
                  " entries with no responses. "
            );
         }
         allKeys.forEach((key) => {
            var resolve = responseHash[key].resolve;
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
         this.findAll({ where: cond, includeRelativeData: true })
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
                        fields[0].replace(/[^a-z0-9\.]/gi, "") + "__relation"
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
                     myObj[colName.replace(/[^a-z0-9\.]/gi, "") + "__relation"];
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
                  d[relationName].translations
               );
            }

            // set .id to relation columns
            let objectLink = c.datasourceLink;
            if (
               objectLink &&
               objectLink.PK() != "id" &&
               d[relationName] &&
               !d[relationName].id
            ) {
               // is array
               if (d[relationName].forEach) {
                  d[relationName].forEach((subData) => {
                     if (subData[objectLink.PK()])
                        subData.id = subData[objectLink.PK()];
                  });
               } else if (d[relationName][objectLink.PK()]) {
                  d[relationName].id = d[relationName][objectLink.PK()];
               }
            }

            var relatedMlFields = objectLink.multilingualFields();
            if (relatedMlFields.length) {
               objectLink.translate(
                  d[relationName],
                  d[relationName],
                  relatedMlFields
               );
            }

            // Change property name of connected field
            if (!d[c.columnName]) d[c.columnName] = d[relationName];
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
                     d[date.columnName] = this.AB.toDate(d[date.columnName], {
                        format: "MM/DD/YYYY",
                        ignoreTime: true,
                     });
                  } else {
                     // Convert UTC to Date
                     d[date.columnName] = this.AB.toDate(d[date.columnName]);
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
};
