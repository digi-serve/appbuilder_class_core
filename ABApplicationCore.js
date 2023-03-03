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
const ABViewManager = require("../platform/ABViewManager");
var ABMLClass = require("../platform/ABMLClass");

function toBool(val) {
   if (typeof val == "undefined") {
      return false;
   }

   if (val === "" || val === "false" || val === "0") {
      return false;
   }

   if (val === "true" || val === "1") {
      return true;
   }

   return val;
}

module.exports = class ABApplicationCore extends ABMLClass {
   constructor(attributes, AB) {
      super(["label", "description"], AB);

      // attributes should be in format:
      // {
      //    id:##,
      //    json:{},
      //    name:"XYZ"
      // }
      attributes.json = attributes.json || {};

      // ABApplication Attributes
      this.id = attributes.id;
      // {string} uuid

      this.type = attributes.type || "application";
      // {string} .type
      // the ABDefinition.type of this object.

      this.json = attributes.json;
      if (typeof this.json == "string") this.json = JSON.parse(this.json);
      // {obj} .json
      // the full settings of this ABApplication

      this.name = attributes.name || this.json.name || "";
      // {string} .name
      // the hard coded name of this ABDefinition Object, not to be confused
      // with the .label.  The .name is created at design time and is a text
      // reference for this object.

      this.icon = attributes.icon || "fa-rocket";
      // {string} .icon
      // this is a reference to a font awesome icon including the `fa-`
      // example `fa-child` should be stored for the `child` icon to be used
      // if user wants to get creative they can add more to this field following
      // these examples https://fontawesome.com/v4/examples/

      this.isSystemObject = toBool(attributes.isSystemObject);
      // {bool} .isSystemObject
      // is this one of the integrated System Objects used by our framework?
      // Some ABApplications and ABObjects are central to the running of the
      // AppBuilder site.  They are marked with .isSystemObject = true;  It
      // requires the role "System Designer" in order to edit/modify them.

      this.roleAccess = attributes.roleAccess || [];
      if (!Array.isArray(this.roleAccess)) {
         this.roleAccess = [this.roleAccess];
      }
      this.roleAccess = this.roleAccess.filter((r) => r);
      // {array}
      // the {ABSiteRole.id}s of the roles allowed to work with this
      // ABApplication. (see .isAccessManaged for more info)

      this.isAccessManaged = JSON.parse(attributes.isAccessManaged || false);
      // {bool} .isAccessManaged
      // does this Application imploy the more sophisticated  Access
      // permissions, or the simpler Role access permissions.
      // {true} : allows an administrator to set which role can View|Edit|Delete
      //          elements of an application.
      // {false}: indicates users having one of the .roleAccess values can have
      //          full access to this application

      this.accessManagers = attributes.accessManagers;
      if (typeof this.accessManagers == "string")
         this.accessManagers = JSON.parse(this.accessManagers);
      // {??} .accessManagers
      // if .isAccessManaged == true, then .accessManagers contain the definitions
      // of the detailed access permissions.

      this.isTranslationManaged = JSON.parse(
         attributes.isTranslationManaged || false
      );
      this.translationManagers = attributes.translationManagers;
      if (typeof this.translationManagers == "string")
         this.translationManagers = JSON.parse(this.translationManagers);

      this.objectIDs = attributes.json.objectIDs || [];
      // {array} .objectIDs
      // All the {ABObject.id} values that have been pulled into this
      // ABApplication for use in it's design environment.  This is how we
      // determine which {ABObject}s are included or excluded from this app.

      this.queryIDs = attributes.json.queryIDs || [];
      // {array} .queryIDs
      // All the {ABObjectQuery.id} values that have been pulled into this
      // ABApplication for use in it's design environment.  This is how we
      // determine which {ABObjectQueries}s are included or excluded from
      // this app.

      this.datacollectionIDs = attributes.json.datacollectionIDs || [];
      // {array} .datacollectionIDs
      // All the {ABDataCollection.id} values that have been pulled into this
      // ABApplication for use in it's design environment.  This is how we
      // determine which {ABDataCollection}s are included or excluded from
      // this app.

      // import all our {ABViewPage}s
      let newPages = [];
      (attributes.json.pageIDs || []).forEach((id) => {
         var def = this.AB.definitionByID(id);
         if (def) {
            newPages.push(this.pageNew(def));
         } else {
            this.emit(
               "warning",
               `App[${this.id}] is referenceing an unknown Page[${id}]`,
               {
                  appID: this.id,
                  pageID: id,
               }
            );
            // console.error(
            //    `App[${this.id}] is referenceing an unknown Page[${id}]`
            // );
         }
      });
      this._pages = newPages;
      // {array} ._pages
      // an array of all the {ABViewPages} this ABApplication offers as
      // interfaces for working with our Data.
      // ABViewPages operate within the confines of an ABApplication so
      // they are created/stored/accessed from within an ABApplication

      (attributes.json.processIDs || []).forEach((pID) => {
         var p = this.AB.processByID(pID);
         if (!p) {
            this.emit(
               "warning",
               `Application is referencing an unknown process.`,
               { appID: this.id, processID: pID }
            );
         }
      });

      this.processIDs = attributes.json.processIDs || [];
      // {array} .processIDs
      // an array of all the {ABProcess.id}s referenced by this Application.

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

   ///
   /// Instance Methods
   ///

   /// ABApplication data methods
   /**
    * @method isAccessibleForRoles()
    * return true/false if this ABApplication is accessible for one of the
    * passed in ABRoles.
    * @param {array[ABRole]} roles
    *        an array of {ABRole} instances.
    * @return {bool}
    */
   isAccessibleForRoles(roles) {
      var foundRole = false;

      // if we are on the basic Role assignments:
      if (!this.isAccessManaged) {
         (roles || []).forEach((r) => {
            if (this.roleAccess.indexOf(r.uuid || r) > -1) {
               foundRole = true;
            }
         });
         return foundRole;
      }

      // isAccessManaged has been set, so 2 kinds of ppl can
      // see this App
      // 1) an AccessManager
      if (parseInt(this.accessManagers.useRole)) {
         (roles || []).forEach((r) => {
            if (this.accessManagers.role.indexOf(r.uuid || r) > -1) {
               foundRole = true;
            }
         });
      }

      // stop here if found.
      if (foundRole) return foundRole;

      // 2) someone who has a role that can see one of it's pages.
      // scan each Page of this Application
      (this.pages() || []).forEach((p) => {
         // check to see if that page.isAccessibleForRoles()
         if (p.isAccessibleForRoles(roles)) {
            foundRole = true;
         }
      });
      return foundRole;
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
      // MLClass translation
      this.json = super.toObj();

      this.json.name = this.name;

      this.json.version = this.version;

      this.json.objectIDs = this.objectIDs;

      this.json.objectListSettings = this.objectListSettings;

      this.json.queryIDs = this.queryIDs;

      this.json.datacollectionIDs = this.datacollectionIDs;

      this.json.pageIDs = (this._pages || []).map((p) => p.id);

      this.json.processIDs = this.processIDs || [];

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
         version: this.version,
         icon: this.icon,
         isSystemObject: this.isSystemObject,
         json: this.json,
         roleAccess: this.roleAccess,
         translations: this.json.translations,
         isAccessManaged: this.isAccessManaged,
         isTranslationManaged: this.isTranslationManaged,
         accessManagers: this.accessManagers,
         translationManagers: this.translationManagers,
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

   datacollectionsExcluded(filter = () => true) {
      return this.AB.datacollections((o) => {
         return this.datacollectionIDs.indexOf(o.id) == -1;
      }).filter(filter);
   }

   datacollectionsIncluded(filter = () => true, sort) {
      // by default sort by label
      const sortFn = sort ?? ((a, b) => a.label.localeCompare(b.label));
      return this.AB.datacollections((o) => {
         return this.datacollectionIDs.indexOf(o.id) > -1;
      })
         .filter(filter)
         .sort(sortFn);
   }

   ///
   /// Objects
   ///

   objectsExcluded(filter = () => true) {
      return this.AB.objects((o) => {
         return this.objectIDs.indexOf(o.id) == -1;
      }).filter(filter);
   }

   objectsIncluded(filter = () => true, sort) {
      // by default sort by label
      const sortFn = sort ?? ((a, b) => a.label.localeCompare(b.label));
      return this.AB.objects((o) => {
         return this.objectIDs.indexOf(o.id) > -1;
      })
         .filter(filter)
         .sort(sortFn);
   }

   /**
    * @method connectedObjects()
    *
    * return an array of all the connected ABObjects for a given ABObject.
    *
    * @param {string} id
    *        an ID of an ABObject
    * @return {array}   array of options for webix select
    *         [ {id, value}, ... ]
    */
   connectedObjects(id) {
      console.error(
         "ABApplicationCore.connectedObjects(): who is calling this?"
      );

      if (id == "") return [];

      // Determine the object from the ID
      var myObj = this.AB.objectByID(id);

      // Get all the connected Fields for that object
      var connectedFields = myObj.connectFields();
      // Store the related fields associatively inside their related Objects ID
      var connectedObj = {};
      connectedFields.forEach((f) => {
         connectedObj[f.settings.linkObject] = this.AB.objectByID(
            f.settings.linkObject
         );
      });
      // Look up the objects by their ID and push them in an options array
      var linkedObjects = [];
      Object.keys(connectedObj).forEach(function (key /*, index */) {
         linkedObjects.push({
            id: this[key].id,
            value: this[key].label,
         });
      }, connectedObj /* = this. inside fn */);

      return linkedObjects;
   }

   /**
    * @method connectedFields()
    * return an array of all the connected ABFields for a given ABObject
    * @param {string} currObjID
    *        an ID of the current ABObject
    * @param {string} linkedObjectID
    *        an ID of the linked ABObject
    * @return {array}
    *        array of options for webix select
    */
   connectedFields(currObjID, linkedObjectID) {
      console.error("!!! Who is calling this?");

      // Determine the object from the currObjID
      var myObj = this.AB.objectByID(currObjID);

      // Get all the connected Fields for our object that match the linkedObjectID
      var connectedFields = myObj.connectFields(
         (f) => f.settings.linkObject == linkedObjectID
      );
      // Build an arry of options for the webix select
      var linkedFields = [];
      connectedFields.forEach((f) => {
         linkedFields.push({ id: f.columnName, value: f.label });
      });

      return linkedFields;
   }

   ///
   /// Pages
   ///

   /**
    * @method pages()
    * return an array of all the ABViewPages for this ABApplication.
    * @param {fn} filter
    *        a filter fn to return a set of ABViewPages that this fn
    *        returns true for.
    * @param {boolean} deep
    *        flag to search in sub pages
    * @return {array}
    *        array of ABViewPages
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
    * return an array of all the ABProcesses for this ABApplication.
    * @param {fn} filter
    *        a filter fn to return a set of ABProcesses that
    *        this fn returns true for.
    * @return {array}
    *        array of ABProcesses
    */
   processes(filter = () => true) {
      return this.AB.processes((p) => {
         return this.processIDs.indexOf(p.id) > -1;
      }).filter(filter);
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
    * return an array of all the Views for this ABApplication.
    * @param {fn} filter
    *        a filter fn to return a set of Views that this fn
    *        returns true for.
    * @return {array}
    *        array of Views
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
                  var subViews = v.views(() => true, true);
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
                  var pageViews = p.views(() => true, true);
                  if (pageViews && pageViews.length) {
                     views = views.concat(pageViews);
                  }
                  // grab all subpages on this page
                  var subPages = p.pages(() => true, true);
                  if (subPages && subPages.length) {
                     pages = pages.concat(subPages);
                     subPages.forEach((sub) => {
                        var subViews = sub.views(() => true, true);
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

   /**
    * @method viewAll()
    * return a list of all the {ABViewxxx} classes available.
    * @return {array} of ABView objects
    */
   viewAll(fn = () => true) {
      return ABViewManager.allViews(fn);
   }

   ///
   /// Queries
   ///

   /**
    * queriesExcluded()
    * return a list of ABObjectQuery(s) that are not included in this
    * ABApplication.
    * @param {fn} filter
    *        a filter fn to further reduce which queries to return.
    * @return {array}
    */
   queriesExcluded(filter = () => true) {
      return this.AB.queries((q) => {
         return this.queryIDs.indexOf(q.id) == -1;
      }).filter(filter);
   }

   /**
    * queriesIncluded()
    * return a list of ABObjectQuery(s) that are included in this
    * ABApplication.
    * @param {fn} filter
    *        a filter fn to further reduce which queries to return.
    * @param {fn} [sort] function to sort by, default is .label
    * @return {array}
    */
   queriesIncluded(filter = () => true, sort) {
      // by default sort by label
      const sortFn = sort ?? ((a, b) => a.label.localeCompare(b.label));
      return this.AB.queries((q) => {
         return this.queryIDs.indexOf(q.id) > -1;
      })
         .filter(filter)
         .sort(sortFn);
   }

   ///
   /// Roles
   ///

   /**
    * @method roles()
    * return an array of all the ABRole for this ABApplication.
    * @param {fn} filter
    *        a filter fn to further reduce which roles to return.
    * @return {array}   array of ABRole
    */
   // roles(filter = () => true) {
   //    return (this.role || []).filter(filter);
   // }

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
            obj = obj.filter(function (o) {
               return o.id == key;
            })[0];
            return parseStep(obj, steps);
         }

         // otherwise obj should be an {} and key a property:
         if (obj && obj[key]) {
            return parseStep(obj[key], steps);
         }

         if (key == "_objects") {
            console.error(new Error("REFACTOR: old objectBy url reference:"));

            // This can be gotten from our AB
            var id = steps.shift();
            return parseStep(this.AB.objectByID(id), steps);
         }

         // if we got here, there is an error!
         // console.error('!!! failed to lookup url:'+pointer);
         console.error("!!! failed to lookup url:" + pointer);
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
    * @method pageByID()
    * return pages from the given {id}
    * @param {string} id
    *        the uuid of the page to return.
    * @return {ABViewPage}
    */
   pageByID(id) {
      return this.pages((f) => f.id == id)[0];
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

   ///
   /// Utilities
   ///

   cloneDeep(/* object */) {
      var errorDepreciated = new Error(
         "ABApplicationCore.cloneDeep(): Depreciated!  Use AB.cloneDeep() instead."
      );
      throw errorDepreciated;

      // return JSON.parse(JSON.stringify(object));
   }
};
