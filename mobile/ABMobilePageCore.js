/*
 * ABMobilePageCore
 *
 * An view that represents a "Page" on the Mobile Device.
 *
 * Pages are
 *	- allowed to be displayed in the interface list
 *	- return a full list of components that can be added to the view editor
 *
 *
 */

import ABMobileView from "../../platform/mobile/ABMobileView";
// var ABViewManager = require("../ABViewManager");

// function L(key, altText) {
//     return AD.lang.label.getLabel(key) || altText;
// }

const ABMobilePageDefaults = {
   key: "mobile-page", // unique key identifier for this ABView
   icon: "file", // icon reference: (without 'fa-' )
};

const ABPropertyComponentDefaults = {
   type: "page",
   // {string}
   // What type of "Page" this is: ['page', 'popup', 'reportPage']
};

export default class ABMobilePageCore extends ABMobileView {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABMobilePageDefaults);

      // 	{
      // 		id:'uuid',					// uuid value for this obj
      // 		key:'viewKey',				// unique key for this View Type
      // 		icon:'font',				// fa-[icon] reference for an icon for this View Type

      //		name: '',					// unique page name

      // 		label:'',					// pulled from translation

      //		settings: {					// unique settings for the type of field
      //		},

      //		translations:[]
      // 	}

      this.parent = null; // will be set by the pageNew() that creates this obj.
      // {obj} .parent
      // this points to the ABView object that manages this object as a child.
      // this param is shared across ABViews as well as ABMobilePage, but has
      // different implications ... so we default an ABMobilePage.parent = null
      // and the place that Creates the Page must assign the .parent externally.
   }

   static common() {
      return ABMobilePageDefaults;
   }

   static defaultValues() {
      return ABPropertyComponentDefaults;
   }

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABMobilePage instance
    * into the values needed for saving to the DB.
    *
    * @return {json}
    */
   toObj() {
      var obj = super.toObj();

      obj.name = this.name;
      obj.route = this.route;

      obj.myAppID = this.myAppID;

      obj.menuType = this.menuType;

      // icon of popup page
      if (this.settings.type == "popup") obj.icon = "clone";

      // set label of the page
      if (!this.label || this.label == "?label?") obj.label = obj.name;

      // compile our pages
      obj.pageIDs = (this._pages || []).map((p) => p.id);

      return obj;
   }

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      this.route = values.route || this.name.replaceAll(" ", "_");

      // icon of popup page
      if (values.settings.type == "popup") this.icon = "clone";

      // set label of the page
      if (!this.label || this.label == "?label?") this.label = this.name;

      // track which application this Page belongs to:
      this.myAppID = values.myAppID;
      if (!this.myAppID && this.application) {
         this.myAppID = this.application.id;
      }

      this.menuType = values.menuType || "menu";
      // {string}  ["menu", "tab"]
      // indicates if this Page was added as a Mobile App's "menu" or "Tab"

      // now properly handle our sub pages.
      var pages = [];
      (values.pageIDs || []).forEach((id) => {
         var def = this.AB.definitionByID(id);
         if (def) {
            pages.push(this.pageNew(def));
         } else {
            this.AB.error(
               `App[${this.application.name}][${this.application.id}]->Page[${this.name}][${this.id}] referenced an unknown Page[${id}]`
            );
         }
      });
      this._pages = pages;

      // the default columns of ABView is 1
      // this.settings.columns = this.settings.columns || 1;
      // this.settings.gravity = this.settings.gravity || [1];

      // convert from "0" => 0
   }

   /**
    * @method destroy()
    *
    * destroy the current instance of ABApplication
    *
    * also remove it from our _AllApplications
    *
    * @return {Promise}
    */
   destroy() {
      return Promise.resolve()
         .then(() => {
            // When deleting an ABMobilePage
            // be sure to remove any of it's ABMobilePage as well
            // This cleans out any dangling ABDefinitions

            var allPageDeletes = [];
            var allPages = this.pages();
            this._pages = [];
            // doing ._pages = [] prevents any of my updates when
            // a sub-page is .destroy()ed

            allPages.forEach((p) => {
               allPageDeletes.push(p.destroy());
            });
            return Promise.all(allPageDeletes);
         })
         .then(() => {
            var parent = this.parent || this.application;

            return parent.pageRemove(this);
         })
         .then(() => {
            return super.destroy();
         });
   }

   /**
    * @method save()
    * persist this instance of ABMobilePage
    * @return {Promise}
    *         .resolve( {this} )
    */
   save() {
      return Promise.resolve()
         .then(() => {
            // this creates our .id
            return super.save();
         })
         .then(() => {
            // now we can persist ourself in our parent
            var parent = this.parent || this.application;

            return parent.pageInsert(this);
         })
         .then(() => {
            return this;
         });
   }

   ///
   /// Pages
   ///

   /**
    * @method pages()
    *
    * return an array of all the ABMobilePages for this ABMobilePage.
    *
    * @param {fn} filter		a filter fn to return a set of ABMobilePages that this fn
    *							returns true for.
    * @param {boolean} deep	flag to find in sub pages
    *
    * @return {array}			array of ABMobilePages
    */
   pages(filter = () => true, deep = false) {
      var result = [];

      // find into sub-pages recursively
      if (filter && deep) {
         if (this._pages && this._pages.length > 0) {
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
      }
      // find root pages
      else {
         result = this._pages.filter(filter);
      }

      return result;
   }

   /**
    * @method pageInsert()
    *
    * save the given ABMobilePage in our ._pages array and persist the current
    * values if they changed.
    *
    * @param {ABMobilePage} page The instance of the page to save.
    * @return {Promise}
    */
   pageInsert(page) {
      var isIncluded = this.pages((o) => o.id === page.id).length > 0;
      if (!isIncluded) {
         // if not already included, then add and save the Obj definition:
         this._pages.push(page);
         return this.save();
      }

      // Nothing was required so return
      return Promise.resolve();
   }

   /**
    * @method pageNew()
    *
    * return an instance of a new (unsaved) ABMobilePage that is tied to this
    * ABMobilePage.
    *
    * NOTE: this new page is not included in our this.pages until a .save()
    * is performed on the page.
    *
    * @return {ABMobilePage}
    */
   pageNew(values) {
      // make sure this is an ABMobilePage description
      values.key = ABMobilePageDefaults.key;

      // NOTE: this returns a new ABView component.
      // when creating a new page, the 3rd param should be null, to signify
      // the top level component.
      var page = this.application.viewNew(values, this.application, null);
      page.parent = this;
      return page;
   }

   /**
    * @method pageRemove()
    *
    * remove the given ABMobilePage from our ._pages array and persist the current
    * values.
    *
    * @param {ABMobilePage} page The instance of the page to remove.
    * @return {Promise}
    */
   pageRemove(page) {
      var origLen = this._pages.length;
      this._pages = this.pages((p) => p.id != page.id);

      if (this._pages.length < origLen) {
         return this.save();
      }

      // if we get here, then nothing changed so nothing to do.
      return Promise.resolve();
   }

   updateIcon(obj) {
      // icon of page
      if (obj.settings.type == "popup") {
         obj.icon = "clone";
      } else {
         obj.icon = ABMobilePageDefaults.icon;
      }
      return obj;
   }

   /**
    * @method clone()
    * clone the defintions of this ABMobilePage object.
    * @param {obj} lookUpIds
    *        an { oldID : newID } lookup hash for converting ABView objects
    *        and their setting pointers.
    * @param {ABView*} parent
    *        Which ABView should be connected as the parent object of this
    *        copy.
    * @return {obj}
    *        defs of the copied ABView
    */
   clone(lookUpIds, parent) {
      // initial new ids of pages and components
      if (lookUpIds == null) {
         // create a hash of { oldID : newID } of any sub Pages and Views.
         lookUpIds = {};

         let mapNewIdFn = (currView) => {
            if (!lookUpIds[currView.id])
               lookUpIds[currView.id] = this.AB.uuid();

            if (currView.pages) {
               currView.pages().forEach((p) => mapNewIdFn(p));
            }

            if (currView.views) {
               currView.views().forEach((v) => mapNewIdFn(v));
            }
         };

         // start map new ids
         mapNewIdFn(this);
      }

      // copy
      let result = super.clone(lookUpIds, parent);

      // page's name should not be duplicate
      result.name = null;

      return result;
   }

   /**
    * @method copy()
    * create a new copy of this ABMobilePage object. The resulting ABView should
    * be identical in settings and all sub pages/views, but each new object
    * is a unique view (different ids).
    * @param {obj} lookUpIds
    *        an { oldID : newID } lookup hash for converting ABView objects
    *        and their setting pointers.
    * @param {ABView*} parent
    *        Which ABView should be connected as the parent object of this
    *        copy.
    * @return {Promise}
    *        .resolved with the instance of the copied ABView
    */
   copy(lookUpIds, parent, options) {
      // initial new ids of pages and components
      if (lookUpIds == null) {
         // create a hash of { oldID : newID } of any sub Pages and Views.
         lookUpIds = {};

         let mapNewIdFn = (currView) => {
            if (!lookUpIds[currView.id])
               lookUpIds[currView.id] = this.AB.uuid();

            if (currView.pages) {
               currView.pages().forEach((p) => mapNewIdFn(p));
            }

            if (currView.views) {
               currView.views().forEach((v) => mapNewIdFn(v));
            }
         };

         // start map new ids
         mapNewIdFn(this);
      }

      // now continue with the default .copy()
      return super.copy(lookUpIds, parent, options);
   }
}
