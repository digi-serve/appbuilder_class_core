/**
 * ABApplicationCore
 *
 * This is the core ABApplication class that manages the common operations
 * of an ABApplication across platforms.
 *
 * It's primary responsibility is to decode a given set of attributes into
 * a working instance of an ABApplication that can return instances of
 * it's defined sub objects.
 *
 * Platform Specific versions of those objects should be defined in a peer
 * directory named platform. These versions of the objects should override
 * these Core objects with platform specific methods of operation (like
 * .save()).
 *
 * Initially your target application should load your platform/ABApplication.js
 * file, which will include this file and sub class it.
 *
 * However, this file will include the remaining files from your platform/*
 * versions.
 */

// webpack can handle 'require()' statements, but node can't handle import
// so let's use require():
const ABObject = require("../platform/ABObject");
const ABQuery = require("../platform/ABObjectQuery");
const ABDataCollectionCore = require("./ABDataCollectionCore");
const ABFieldManager = require("./ABFieldManager");
const ABViewManager = require("../platform/ABViewManager");
const ABIndex = require("../platform/ABIndex");
const ABRole = require("../platform/ABRole");

// const ABViewPageCore = require("./views/ABViewPageCore");
// const ABQLManager = require("./ABQLManager");
var ABMLClass = require("../platform/ABMLClass");

module.exports = class ABApplicationCore extends ABMLClass {
   constructor(attributes) {
      super(ABApplicationCore.fieldsMultilingual());

      // attributes should be in format:
      // {
      //    id:##,
      //    json:{},
      //    name:"XYZ"
      // }
      attributes.json = attributes.json || {};

      // ABApplication Attributes
      this.id = attributes.id;
      this.type = attributes.type || "application";
      this.json = attributes.json;
      if (typeof this.json == "string") this.json = JSON.parse(this.json);
      this.name = attributes.name || this.json.name || "";
      this.role = attributes.role;
      this.class = {};
      this.class.ABRole = ABRole; // This is a temporary fix that we can remove when OpsPortal is removed
      this.isAdminApp = JSON.parse(attributes.json.isAdminApp || false);
      this.isAccessManaged = JSON.parse(attributes.isAccessManaged || false);
      this.accessManagers = attributes.accessManagers;
      if (typeof this.accessManagers == "string")
         this.accessManagers = JSON.parse(this.accessManagers);
      this.isTranslationManaged = JSON.parse(
         attributes.isTranslationManaged || false
      );
      this.translationManagers = attributes.translationManagers;
      if (typeof this.translationManagers == "string")
         this.translationManagers = JSON.parse(this.translationManagers);

      // import all our ABObjects
      // NOTE: we work with ABObjects on both the client and server sides.
      // So we provide object methods in the base class.  However, each
      // ABObject sub class (client and server) needs to implement it's own
      // .objectNew() method.
      //    var newObjects = [];
      //    (attributes.json.objects || []).forEach((obj) => {
      //       newObjects.push( this.objectNew(obj) );
      //    })
      this._objects = [];
      this.objectIDs = attributes.json.objectIDs || [];
      (this.objectsAll() || attributes.json.objects || []).forEach((obj) => {
         if (this.objectIDs.indexOf(obj.id) !== -1) {
            if (obj instanceof ABObject) {
               this._objects.push(obj);
            } else {
               this._objects.push(this.objectNew(obj));
            }
         }
      });

      // // NOTE: keep this after ABObjects are loaded
      // // import our ABObjectQueries
      // // just like the .objectNew() both ABApplication.js (client and server) need to
      // // implement .queryNew()
      // var newQueries = [];
      // (attributes.json.queries || []).forEach((query) => {
      //    // prevent processing of null values.
      //    if (query) {
      //       newQueries.push( this.queryNew(query) );
      //    }
      //    })

      // this._queries = [];
      this.queryIDs = attributes.json.queryIDs || [];
      (this.queriesAll() || attributes.json.queries || []).forEach((q) => {
         // The  Platform ABApplication manages all our live Query Objects
         // we no longer need to track them internally
         //// TODO: consider remove this.queriesAll() during our constructor.
         //// no need for it now since this.queries() already references it.
      });

      // Transition:
      // _datacollections, _objects, and _queries are now defined
      // globally.  And not part of the internal definition of an
      // ABApplication.
      // this._datacollections = [];
      this.datacollectionIDs = attributes.json.datacollectionIDs || [];
      (this.datacollectionsAll() || []).forEach((dc) => {
         // if (dc) {
         //    this._datacollections.push(this.datacollectionNew(dc));
         // }
      });

      // Transition:
      // _pages, and _mobileApps, are still included in the ABApplication
      // definition:

      // import all our ABViews
      let newPages = [];
      (attributes.json.pageIDs || []).forEach((id) => {
         var def = this.definitionForID(id);
         if (def) {
            newPages.push(this.pageNew(def));
         } else {
            console.error(
               `App[${this.id}] is referenceing an unknown Page[${id}]`
            );
         }
      });
      this._pages = newPages;

      this._roles = [];

      // // Mobile Apps
      // // an Application can have one or more Mobile Apps registered.
      // var newMobileApps = [];
      // (attributes.json.mobileApps || []).forEach((ma) => {
      //    // prevent processing of null values.
      //    if (ma) {
      //       newMobileApps.push( this.mobileAppNew(ma) );
      //    }
      //    })
      // this._mobileApps = [newMobileApps];

      var newProcesses = [];
      var removePIDs = [];
      (attributes.json.processIDs || []).forEach((pID) => {
         if (pID) {
            var p = this.processNew(pID);
            if (p) {
               newProcesses.push(p);
            } else {
               // remove pID from list
               removePIDs.push(pID);
            }
         }
      });
      if (attributes.json.processIDs) {
         // remove those missing pIDs.
         attributes.json.processIDs = attributes.json.processIDs.filter(
            (pr) => {
               return removePIDs.indexOf(pr) == -1;
            }
         );
      }

      this._processes = newProcesses;
      this.processIDs = attributes.json.processIDs || [];

      // Object List Settings
      attributes.json.objectListSettings =
         attributes.json.objectListSettings || {};
      this.objectListSettings = this.objectListSettings || {};
      this.objectListSettings.isOpen = JSON.parse(
         attributes.json.objectListSettings.isOpen || false
      );
      this.objectListSettings.searchText =
         attributes.json.objectListSettings.searchText || "";
      this.objectListSettings.sortDirection =
         attributes.json.objectListSettings.sortDirection || "asc";
      this.objectListSettings.isGroup = JSON.parse(
         attributes.json.objectListSettings.isGroup || false
      );

      // let the MLClass now process the translations:
      // transition issues:
      attributes.translations =
         attributes.translations || attributes.json.translations;

      super.fromValues(attributes);
   }

   ///
   /// Static Methods
   ///
   /// Available to the Class level object.  These methods are not dependent
   /// on the instance values of the Application.
   ///

   /**
    * @method fieldsMultilingual()
    *
    * return an array of fields that are considered Multilingual labels for
    * an ABApplication
    *
    * @return {array}
    */
   static fieldsMultilingual() {
      return ["label", "description"];
   }

   ///
   /// Instance Methods
   ///

   /// ABApplication data methods

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
      this.json = super.toObj();

      this.json.name = this.name;

      // for each Object: compile to json
      // var currObjects = [];
      // this._objects.forEach((obj) => {
      //     currObjects.push(obj.toObj());
      // });
      // this.json.objects = currObjects;
      this.json.objectIDs = this.objectIDs;

      this.json.objectListSettings = this.objectListSettings;

      this.json.queryIDs = this.queryIDs;

      this.json.datacollectionIDs = this.datacollectionIDs;

      // Save our processes.
      this.json.processIDs = (this._processes || []).map((p) => {
         return p.id;
      });

      // for each View: compile to json
      // var currPages = [];
      // this._pages.forEach((page) => {
      //    currPages.push(page.toObj());
      // });
      // this.json.pages = currPages;
      this.json.pageIDs = (this._pages || []).map((p) => p.id);

      // // for each MobileApp: compile to json
      // var currApps = [];
      // this._mobileApps.forEach((app) => {
      //    currApps.push(app.toObj())
      // })
      // this.json.mobileApps = currApps;

      return {
         id: this.id,
         type: this.type || "application",
         name: this.name,
         json: this.json,
         role: this.role,
         isAdminApp: this.isAdminApp,
         translations: this.json.translations,
         isAccessManaged: this.isAccessManaged,
         isTranslationManaged: this.isTranslationManaged,
         accessManagers: this.accessManagers,
         translationManagers: this.translationManagers
      };
   }

   ///
   /// Mobile Apps
   ///

   /**
    * @method mobileApps()
    *
    * return an array of all the ABObjectQueries for this ABApplication.
    *
    * @param {fn} filter   a filter fn to return a set of ABObjectQueries that
    *                this fn returns true for.
    * @return {array}   array of ABObjectQueries
    */
   mobileApps(filter = () => true) {
      return (this._mobileApps || []).filter(filter);
   }

   ///
   /// Datacollections
   ///

   ///
   /// Data collections
   ///

   // datacollectionNew(values) {
   //    return new ABDataCollectionCore(values, this);
   // }

   /**
    * @method datacollections()
    *
    * return an array of all the ABDataCollection for this ABApplication.
    *
    * @param {fn} filter   a filter fn to return a set of ABDataCollection that
    *        this fn returns true for.
    * @return {array}   array of ABDataCollection
    */
   datacollections(filter = () => true) {
      return (this.datacollectionsAll() || []).filter(filter);
   }

   /**
    * @method datacollectionByID()
    * returns a single ABDatacollection that matches the given ID.
    * @param {string} ID
    *        the .id/.name/.label of the ABDatacollection we are searching
    *        for.
    * @return {ABDatacollection}
    *        the matching ABDatacollection object if found
    *        {null} if not found.
    */
   datacollectionByID(ID) {
      // an undefined or null ID should not match any DC.
      if (!ID) return null;

      return this.datacollections((dc) => {
         return dc.id == ID || dc.name == ID || dc.label == ID;
      })[0];
   }

   datacollectionsExcluded(filter = () => true) {
      return this.datacollections((o) => {
         return this.datacollectionIDs.indexOf(o.id) == -1;
      }).filter(filter);
   }

   datacollectionsIncluded(filter = () => true) {
      return this.datacollections((o) => {
         return this.datacollectionIDs.indexOf(o.id) > -1;
      }).filter(filter);
   }

   ///
   /// Objects
   ///

   /**
    * @method objects()
    *
    * return an array of all the ABObjects for this ABApplication.
    *
    * @param {fn} filter   a filter fn to return a set of ABObjects that this fn
    *                returns true for.
    * @return {array}   array of ABObject
    */
   objects(filter = () => true) {
      return (this.objectsAll() || []).filter(filter);
   }

   objectsExcluded(filter = () => true) {
      return this.objects((o) => {
         return this.objectIDs.indexOf(o.id) == -1;
      }).filter(filter);
   }

   objectsIncluded(filter = () => true) {
      return this.objects((o) => {
         return this.objectIDs.indexOf(o.id) > -1;
      }).filter(filter);
   }

   /**
    * @method connectedObjects()
    *
    * return an array of all the connected ABObjects for this ABApplication.
    *
    * @param {id} id    an ID of an ABObject
    *
    * @return {array}   array of options for webix select
    */
   connectedObjects(obj) {
      if (obj == "") return [];

      // Determine the object from the ID
      var myObj = this.objects((o) => o.id == obj);

      // Get all the connected Fields for that object
      var connectedFields = myObj[0].fields((f) => f.key == "connectObject");
      // Store the related fields associatively inside their related Objects ID
      var connectedObj = [];
      connectedFields.forEach((f) => {
         connectedObj[f.settings.linkObject] = this.objects(
            (co) => co.id == f.settings.linkObject
         );
      });
      // Look up the objects by their ID and push them in an options array
      var linkedObjects = [];
      Object.keys(connectedObj).forEach(function(key, index) {
         linkedObjects.push({
            id: this[key][0].id,
            value: this[key][0].label
         });
      }, connectedObj);

      return linkedObjects;
   }

   /**
    * @method connectedFields()
    *
    * return an array of all the connected ABFields for a given ABObject
    *
    * @param {currObj} id     an ID of the current ABObject
    *
    * @param {linkedObject} id   an ID of the linked ABObject
    *
    * @return {array}         array of options for webix select
    */
   connectedFields(currObj, linkedObject) {
      // Determine the object from the currObj
      var myObj = this.objects((o) => o.id == currObj);

      // Get all the connected Fields for our object that match the linkedObject
      var connectedFields = myObj[0].fields(
         (f) =>
            f.key == "connectObject" && f.settings.linkObject == linkedObject
      );
      // Build an arry of options for the webix select
      var linkedFields = [];
      connectedFields.forEach((f) => {
         linkedFields.push({ id: f.columnName, value: f.label });
      });

      return linkedFields;
   }

   /**
    * @method objectByID()
    * return the specific object requested by the provided id.
    * @param {string} ID
    * @return {obj}
    */
   objectByID(ID) {
      return this.objects((o) => {
         return o.id == ID || o.name == ID || o.label == ID;
      })[0];
   }

   /**
    * @method objectNew()
    *
    * return an instance of a new (unsaved) ABObject that is tied to this
    * ABApplication.
    *
    * NOTE: this new object is not included in our this.objects until a .save()
    * is performed on the object.
    *
    * @return {ABObject}
    */
   objectNew(values) {
      return new ABObject(values, this);
   }

   ///
   /// Pages
   ///

   /**
    * @method pages()
    *
    * return an array of all the ABViewPages for this ABApplication.
    *
    * @param {fn} filter   a filter fn to return a set of ABViewPages that this fn
    *              returns true for.
    * @param {boolean} deep  flag to find in sub pages
    *
    * @return {array}      array of ABViewPages
    */
   pages(filter = () => true, deep = false) {
      var result = [];

      if (!this._pages || this._pages.length < 1) return result;

      // find into sub-pages recursively
      if (filter && deep) {
         result = this._pages.filter(filter);

         if (result.length < 1) {
            this._pages.forEach((p) => {
               var subPages = p.pages(filter, deep);
               if (subPages && subPages.length > 0) {
                  result = subPages;
               }
            });
         }
      }
      // find root pages
      else {
         result = (this._pages || []).filter(filter);
      }

      return result;
   }

   ///
   /// Processes
   ///

   /**
    * @method processes()
    *
    * return an array of all the ABProcesses for this ABApplication.
    *
    * @param {fn} filter   a filter fn to return a set of ABProcesses that
    *                      this fn returns true for.
    * @return {array}  array of ABProcesses
    */
   processes(filter = () => true) {
      return this._processes.filter(filter);
   }

   hasProcess(process) {
      if (process && process.id) {
         return this.processIDs.indexOf(process.id) > -1;
      } else {
         return false;
      }
   }

   ///
   /// Views
   ///

   /**
    * @method views()
    *
    * return an array of all the Views for this ABApplication.
    *
    * @param {fn} filter   a filter fn to return a set of Views that this fn
    *              returns true for.
    *
    * @return {array}      array of Views
    */
   views(filter) {
      var result = [];
      var views = [];
      var pages = [];

      if (
         (!this._pages || this._pages.length < 1) &&
         (!this._views || this._views.length < 1)
      )
         return result;

      // look at views recursively
      if (filter) {
         // look at views recursively (views can have subviews and so on)
         if (this._views) {
            views = this._views.filter(filter);

            if (views.length < 1) {
               this._views.forEach((v) => {
                  var subViews = v.views(filter, true);
                  if (subViews && subViews.length > 0) {
                     views = subViews;
                  }
               });
            }
         }

         function lookDeep(view) {
            if (view._pages && view._pages.length) {
               view._pages.forEach((p) => {
                  // check the page views recusively
                  var pageViews = p.views(filter, true);
                  // if there was a match store it
                  if (pageViews && pageViews.length > 0) {
                     result = pageViews;
                  }
                  // if no match move on to the subpages
                  if (result.length < 1) {
                     // loop through each subpage recursively
                     var subPages = p.pages(filter, true);
                     // if there was a match store it
                     if (subPages && subPages.length > 0) {
                        result = subPages;
                     }
                     if (result.length < 1) {
                        lookDeep(p);
                     }
                  }
               });
            }
         }

         // if no views of the root page match now look at the sub pages and their views
         if (views.length) {
            result = views;
         } else {
            // check the first level subpages
            result = this._pages.filter(filter);

            // if no match check each pages views and subpages
            if (result.length < 1) {
               // looping through pages
               lookDeep(this);
            }
         }
      }
      // find all views
      else {
         // recusively gather all views on this view
         if (this._views) {
            views = this._views;
            if (views.length) {
               views.forEach((v) => {
                  var subViews = v.views(function() {
                     return true;
                  }, true);
                  if (subViews && subViews.length) {
                     views = views.concat(subViews);
                  }
               });
            }
         }

         // recursively gather all pages and their views
         if (this._pages) {
            pages = this._pages;
            if (pages.length) {
               pages.forEach((p) => {
                  // grab all views on this page
                  var pageViews = p.views(function() {
                     return true;
                  }, true);
                  if (pageViews && pageViews.length) {
                     views = views.concat(pageViews);
                  }
                  // grab all subpages on this page
                  var subPages = p.pages(function() {
                     return true;
                  }, true);
                  if (subPages && subPages.length) {
                     pages = pages.concat(subPages);
                     subPages.forEach((sub) => {
                        var subViews = sub.views(function() {
                           return true;
                        }, true);
                        if (subViews && subViews.length) {
                           views = views.concat(subViews);
                        }
                     });
                  }
               });
            }
         }

         result = result.concat(pages, views);
      }

      return result;
   }

   ///
   /// Queries
   ///

   /**
    * @method queries()
    *
    * return an array of all the ABObjectQueries for this ABApplication.
    *
    * @param {fn} filter
    *        a filter fn to return a set of ABObjectQueries that this fn
    *        returns true for.
    * @return {array}
    *        array of ABObjectQueries
    */
   queries(filter = () => true) {
      return (this.queriesAll() || []).filter(filter);
   }

   queriesExcluded(filter = () => true) {
      return this.queries((q) => {
         return this.queryIDs.indexOf(q.id) == -1;
      }).filter(filter);
   }

   queriesIncluded(filter = () => true) {
      return this.queries((q) => {
         return this.queryIDs.indexOf(q.id) > -1;
      }).filter(filter);
   }

   /**
    * @method queryByID()
    * return the specific query requested by the provided id.
    * NOTE: this method has been extended to allow .name and .label
    * as possible lookup values.
    * @param {string} ID
    * @return {obj}
    */
   queryByID(ID) {
      return this.queries((q) => {
         return q.id == ID || q.name == ID || q.label == ID;
      })[0];
   }

   ///
   /// Roles
   ///

   /**
    * @method roles()
    *
    * return an array of all the ABRole for this ABApplication.
    *
    * @param {fn} filter   a filter fn to return a set of ABRole that
    *                this fn returns true for.
    * @return {array}   array of ABRole
    */
   roles(filter = () => true) {
      return (this._roles || []).filter(filter);
   }

   /**
    * @method urlResolve()
    * given an object pointer, return the specific object referenced.
    * pointer must start with a '#', use '/' as delimiters, and either
    * reference an object's .id, or an object's .property.
    * for example:
    * #/_objects   : resolves to the array of ._objects pointed to by this
    *               application.
    * #/_objects/[object.id] : reolved to a specific object
    * #/_objects/[object.id]/_fields/[field.id] : resolves to a specific data field
    *               refereced by object.id.
    *
    * @param {string} pointer : the string url referencing the object you want
    *                       to retrieve.
    * @return {obj}
    */
   urlResolve(pointer) {
      var parts = pointer.split("/");

      var parseStep = (obj, steps) => {
         // we're done.  obj is what we are looking for:
         if (steps.length == 0) {
            return obj;
         }

         // pull the next step key:
         var key = steps.shift();

         // special case, "#" makes sure we are talking about the
         // Application object
         if (key == "#") {
            return parseStep(this, steps);
         }

         // if obj is an [], then key should be an .id reference to
         // lookup:
         if (Array.isArray(obj)) {
            obj = obj.filter(function(o) {
               return o.id == key;
            })[0];
            return parseStep(obj, steps);
         }

         // otherwise obj should be an {} and key a property:
         if (obj && obj[key]) {
            return parseStep(obj[key], steps);
         }

         // if we got here, there is an error!
         // console.error('!!! failed to lookup url:'+pointer);
         console.warn("!!! failed to lookup url:" + pointer);
         return null;
      };

      return parseStep(this, parts);
   }

   /**
    * @method urlPointer()
    * return the url pointer for this application.
    *
    * @param {boolean} acrossApp - flag to include application id to url
    *
    * @return {string}
    */
   urlPointer(acrossApp) {
      // NOTE: if we need to expand this to search across
      // applications, then add in this application.id here:
      if (acrossApp) return "#/" + this.id + "/";
      else return "#/";
   }

   /**
    * @method urlObject()
    * return the url pointer for objects in this application.
    *
    * @param {boolean} acrossApp - flag to include application id to url
    *
    * @return {string}
    */
   urlObject(acrossApp) {
      return this.urlPointer(acrossApp) + "_objects/";
   }

   /**
    * @method urlView()
    * return the url pointer for pages in this application.
    *
    * @param {boolean} acrossApp - flag to include application id to url
    *
    * @return {string}
    */
   urlPage(acrossApp) {
      return this.urlPointer(acrossApp) + "_pages/";
   }

   /**
    * @method urlQuery()
    * return the url pointer for queries in this application.
    *
    * @param {boolean} acrossApp - flag to include application id to url
    *
    * @return {string}
    */
   urlQuery(acrossApp) {
      return this.urlPointer(acrossApp) + "_queries/";
   }

   ///
   ///   Object List Settings
   ///
   get objectlistIsOpen() {
      return this.objectListSettings.isOpen;
   }

   set objectlistIsOpen(isOpen) {
      this.objectListSettings.isOpen = isOpen;
   }

   get objectlistSearchText() {
      return this.objectListSettings.searchText;
   }

   set objectlistSearchText(searchText) {
      this.objectListSettings.searchText = searchText;
   }

   get objectlistSortDirection() {
      return this.objectListSettings.sortDirection;
   }

   set objectlistSortDirection(sortDirection) {
      this.objectListSettings.sortDirection = sortDirection;
   }

   get objectlistIsGroup() {
      return this.objectListSettings.isGroup;
   }

   set objectlistIsGroup(isGroup) {
      this.objectListSettings.isGroup = isGroup;
   }

   ///
   /// Instance generators
   ///

   /**
    * @method fieldNew()
    *
    * return an instance of a new (unsaved) ABField that is tied to a given
    * ABObject.
    *
    * NOTE: this new field is not included in our this.fields until a .save()
    * is performed on the field.
    *
    * @param {obj} values  the initial values for this field.
    *                { key:'{string}'} is required
    * @param {ABObject} object  the parent object this field belongs to.
    * @return {ABField}
    */
   fieldNew(values, object) {
      // NOTE: ABFieldManager returns the proper ABFieldXXXX instance.
      return ABFieldManager.newField(values, object);
   }

   /**
    * @method pageNew()
    *
    * return an instance of a new (unsaved) ABViewPage that is tied to this
    * ABApplication.
    *
    * NOTE: this new page is not included in our this.pages until a .save()
    * is performed on the page.
    *
    * @return {ABViewPage}
    */
   pageNew(values) {
      // make sure this is an ABViewPage description
      // values.key = ABViewPageCore.common().key;
      values.key = "page";

      return ABViewManager.newView(values, this, null);
   }

   /**
    * @method viewNew()
    *
    * return an instance of a new (unsaved) ABView.
    *
    * @return {ABView}
    */
   viewNew(values, application, parent) {
      return ABViewManager.newView(values, application, parent);
   }

   /**
    * @method viewNew()
    *
    * return an instance of a new (unsaved) ABView.
    *
    * @return {ABView}
    */
   qlopNew(values, application, parent) {
      console.error("!!!Where is this called?!!!");
      return ABQLManager.newOP(values, application || this, parent);
   }

   /**
    * @method indexNew()
    *
    * return an instance of a new (unsaved) ABIndex.
    *
    * @return {ABView}
    */
   indexNew(values, object) {
      return new ABIndex(values, object);
   }

   ///
   /// Utilities
   ///

   /**
    * @function OP.Multilingual.translate
    *
    * Given a set of json data, pull out any multilingual translations
    * and flatten those values to the base object.
    *
    * @param {obj} obj  The instance of the object being translated
    * @param {json} json The json data being used for translation.
    *                There should be json.translations = [ {transEntry}, ...]
    *                where transEntry = {
    *                   language_code:'en',
    *                   field1:'value',
    *                   ...
    *                }
    * @param {array} fields an Array of multilingual fields to pull to
    *                 the obj[field] value.
    *
    */
   /*
    translate(obj, json, fields, languageCode = null) {
        json = json || {};
        fields = fields || [];

        if (!json.translations) {
            json.translations = [];
        }

        if (typeof json.translations == "string") {
            json.translations = JSON.parse(json.translations);
        }

        var currLanguage = languageCode || this.languageDefault();

        if (fields && fields.length > 0) {
            // [fix] if no matching translation is in our json.translations
            //        object, then just use the 1st one.
            var first = null; // the first translation entry encountered
            var found = false; // did we find a matching translation?

            json.translations.forEach(function(t) {
                if (!first) first = t;

                // find the translation for the current language code
                if (t.language_code == currLanguage) {
                    found = true;

                    // copy each field to the root object
                    fields.forEach(function(f) {
                        if (t[f] != null) obj[f] = t[f];

                        obj[f] = t[f] || ""; // default to '' if not found.
                    });
                }
            });

            // if !found, then use the 1st entry we did find.  prepend desired
            // [language_code] to each of the fields.
            if (!found && first) {
                // copy each field to the root object
                fields.forEach(function(f) {
                    if (first[f] != null && first[f] != "")
                        obj[f] = `[${currLanguage}]${first[f]}`;
                    else obj[f] = ""; // default to '' if not found.
                });
            }
        }
    }
    */

   /**
    * @function OP.Multilingual.unTranslate
    *
    * Take the multilingual information in the base obj, and push that
    * down into the json.translations data.
    *
    * @param {obj} obj  The instance of the object with the translation
    * @param {json} json The json data being used for translation.
    *                There should be json.translations = [ {transEntry}, ...]
    *                where transEntry = {
    *                   language_code:'en',
    *                   field1:'value',
    *                   ...
    *                }
    * @param {array} fields an Array of multilingual fields to pull from
    *                 the obj[field] value.
    *
    */
   /*
    unTranslate(obj, json, fields) {
        json = json || {};
        fields = fields || [];

        if (!json.translations) {
            json.translations = [];
        }

        var currLanguage = this.languageDefault();

        if (fields && fields.length > 0) {
            var foundOne = false;

            json.translations.forEach(function(t) {
                // find the translation for the current language code
                if (t.language_code == currLanguage) {
                    // copy each field to the root object
                    fields.forEach(function(f) {
                        // verify obj[f] is defined
                        // --> DONT erase the existing translation
                        if (obj[f] != null) {
                            t[f] = obj[f];
                        }
                    });

                    foundOne = true;
                }
            });

         // if we didn't update an existing translation
         if (!foundOne) {
            // create a translation entry:
            var trans = {};

            // assume current languageCode:
            trans.language_code = currLanguage;

            fields.forEach(function(field) {
               if (obj[field] != null) {
                  trans[field] = obj[field];
               }
            });

                json.translations.push(trans);
            }
        }
    }
*/

   cloneDeep(object) {
      return JSON.parse(JSON.stringify(object));
   }

   /**
    * @method toDate
    *
    * @param {string} dateText
    * @param {Object} options - {
    *                               format: "string",
    *                               ignoreTime: boolean
    *                            }
    * @return {Date}
    */
   toDate(dateText = "", options = {}) {
      if (!dateText) return;
      return new Date(dateText);
   }

   /**
    * @method toDateFormat
    *
    * @param {Date} date
    * @param {Object} options - {
    *                               format: "string",
    *                               localeCode: "string"
    *                            }
    *
    * @return {string}
    */
   toDateFormat(date, options) {
      if (!date) return "";

      return date.toString();
   }

   subtractDate(date, number, unit) {
      throw new Error("This function does not implement");
   }

   addDate(date, number, unit) {
      throw new Error("This function does not implement");
   }
};
