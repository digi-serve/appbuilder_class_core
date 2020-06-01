/*
 * ABViewPage
 *
 * An ABView that represents a "Page" in the system.
 *
 * Pages are
 *	- allowed to be displayed in the interface list
 *	- return a full list of components that can be added to the view editor
 *
 *
 */

const ABViewContainer = require("../../platform/views/ABViewContainer");
// var ABViewManager = require("../ABViewManager");

// function L(key, altText) {
//     return AD.lang.label.getLabel(key) || altText;
// }

const ABViewDefaults = {
   key: "page", // unique key identifier for this ABView
   icon: "file" // icon reference: (without 'fa-' )
};

const ABPropertyComponentDefaults = {
   type: "page", // 'page', 'popup' or 'reportPage'
   popupWidth: 700,
   popupHeight: 450,
   pageWidth: null,
   fixedPageWidth: 0,
   pageBackground: "ab-background-default"
};

module.exports = class ABViewPageCore extends ABViewContainer {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);

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
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABPropertyComponentDefaults;
   }

   static getPageActionKey(view) {
      return [
         "opstools",
         "AB_" + String(view.application.name).replace(/[^a-z0-9]/gi, ""),
         String(view.name)
            .replace(/[^a-z0-9]/gi, "")
            .toLowerCase(),
         "view"
      ].join(".");
   }

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABViewPage instance
    * into the values needed for saving to the DB.
    *
    * @return {json}
    */
   toObj() {
      var obj = super.toObj();

      obj.name = this.name;

      // icon of popup page
      if (this.settings.type == "popup") obj.icon = "clone";

      // set label of the page
      if (!this.label || this.label == "?label?") obj.label = obj.name;

      // compile our pages
      var pages = [];
      this._pages.forEach((page) => {
         pages.push(page.toObj());
      });
      obj.pages = pages;

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

      // icon of popup page
      if (values.settings.type == "popup") this.icon = "clone";

      // set label of the page
      if (!this.label || this.label == "?label?") this.label = this.name;

      // now properly handle our sub pages.
      var pages = [];
      (values.pages || []).forEach((child) => {
         pages.push(this.pageNew(child)); // ABViewManager.newView(child, this.application, this));
      });
      this._pages = pages;

      // the default columns of ABView is 1
      this.settings.columns = this.settings.columns || 1;
      this.settings.gravity = this.settings.gravity || [1];

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
      return new Promise((resolve, reject) => {
         // verify we have been .save() before:
         if (this.id) {
            this.application
               .viewDestroy(this)
               .then(() => {
                  // remove the page in list
                  var parent = this.parent || this.application;
                  var remainingPages = parent.pages((p) => {
                     return p.id != this.id;
                  });
                  parent._pages = remainingPages;

                  resolve();
               })
               .catch(reject);
         } else {
            resolve(); // nothing to do really
         }
      });
   }

   /**
    * @method save()
    *
    * persist this instance of ABViewPage with it's parent
    *
    * @param includeSubViews {Boolean}
    *
    * @return {Promise}
    *         .resolve( {this} )
    */
   save(includeSubViews = false) {
      return new Promise((resolve, reject) => {
         // if this is our initial save()
         if (!this.id) {
            //// TODO: OP.*  code should be move to platform version of code.
            this.id = OP.Util.uuid(); // setup default .id
            this.name = this.name + "_" + this.id.split("-")[1]; // add a unique string to the name so it doesnt collide with a previous page name
         }

         // if name is empty
         if (!this.name) {
            this.name = this.label + "_" + this.id.split("-")[1];
         }

         this.application
            .viewSave(this, includeSubViews)
            .then(() => {
               // persist the current ABViewPage in our list of ._pages.
               var parent = this.parent || this.application;
               var isIncluded =
                  parent.pages((p) => {
                     return p.id == this.id;
                  }).length > 0;
               if (!isIncluded) {
                  parent._pages.push(this);
               }

               resolve();
            })
            .catch(reject);
      });
   }

   ///
   /// Pages
   ///

   /**
    * @method pages()
    *
    * return an array of all the ABViewPages for this ABViewPage.
    *
    * @param {fn} filter		a filter fn to return a set of ABViewPages that this fn
    *							returns true for.
    * @param {boolean} deep	flag to find in sub pages
    *
    * @return {array}			array of ABViewPages
    */
   pages(filter, deep) {
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
         filter =
            filter ||
            function() {
               return true;
            };

         result = this._pages.filter(filter);
      }

      return result;
   }

   /**
    * @method pageNew()
    *
    * return an instance of a new (unsaved) ABViewPage that is tied to this
    * ABViewPage.
    *
    * NOTE: this new page is not included in our this.pages until a .save()
    * is performed on the page.
    *
    * @return {ABViewPage}
    */
   pageNew(values) {
      // make sure this is an ABViewPage description
      values.key = ABViewDefaults.key;

      // NOTE: this returns a new ABView component.
      // when creating a new page, the 3rd param should be null, to signify
      // the top level component.
      var page = this.application.viewNew(values, this.application, null);
      page.parent = this;
      return page;
   }

   /**
    * @method viewDestroy()
    *
    * remove the current ABViewPage from our list of ._pages or ._views.
    *
    * @param {ABView} view
    * @return {Promise}
    */
   viewDestroy(view) {
      var remainingPages = this.pages(function(p) {
         return p.id != view.id;
      });
      this._pages = remainingPages;
      return this.save();
   }

   /**
    * @method urlView()
    * return the url pointer for views in this application.
    * @return {string}
    */
   urlPage() {
      return this.urlPointer() + "/_pages/";
   }

   /**
    * @method urlPointer()
    * return the url pointer that references this view.  This url pointer
    * should be able to be used by this.application.urlResolve() to return
    * this view object.
    * @return {string}
    */
   urlPointer() {
      if (this.parent) {
         return this.parent.urlPage() + this.id;
      } else {
         return this.application.urlPage() + this.id;
      }
   }

   updateIcon(obj) {
      // icon of page
      if (obj.settings.type == "popup") {
         obj.icon = "clone";
      } else {
         obj.icon = ABViewDefaults.icon;
      }
      return obj;
   }

   copy(lookUpIds, parent) {
      // initial new ids of pages and components
      if (lookUpIds == null) {
         lookUpIds = {};

         //// TODO: OP.*  code should not be in *Core.js version of code
         let mapNewIdFn = (currView) => {
            if (!lookUpIds[currView.id])
               lookUpIds[currView.id] = OP.Util.uuid();

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
      let result = super.copy(lookUpIds, parent);

      // page's name should not be duplicate
      result.name = null;

      return result;
   }
};
