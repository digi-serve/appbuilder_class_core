/*
 * ABViewCore
 *
 * ABViewCore defines the common ABView structure that is shared between
 * the client and the server.  Mostly how it manages it's internal data, and
 * how it is related to the ABView classes.
 *
 */

var ABMLClass = require("../../platform/ABMLClass");

const ABMobileViewDefaults = {
   key: "mobile-view", // {string} unique key for this view
   icon: "window-maximize", // {string} fa-[icon] reference for this view
   labelKey: "view", // {string} the multilingual label key for the class label
   tabicon: "", // no default tab icons
};

const ABViewPropertyComponentDefaults = {
   label: "",
};

module.exports = class ABMobileViewCore extends ABMLClass {
   /**
    * @param {obj} values  key=>value hash of ABView values
    * @param {ABApplication} application the application object this view is under
    * @param {ABView} parent the ABView this view is a child of. (can be null)
    */
   constructor(values, application, parent, defaultValues) {
      super(["label"], application.AB);

      this.__events = [];
      // keep track of any event listeners attached to this ABView object

      this.defaults = defaultValues || ABMobileViewDefaults;

      this.application = application;

      this.parent = parent || null;

      this.warningsSilent = false;
      // {bool}
      // Should we suppress our configuration warnings?

      this.__missingViews = [];
      // {array}
      // Any ABView.id we have stored that we can't find.

      this.fromValues(values);
   }

   static common() {
      return ABMobileViewDefaults;
   }

   static defaultValues() {
      return ABViewPropertyComponentDefaults;
   }

   /**
    * @method newInstance()
    * return a new instance of this ABView.  Most likely called from interfaces
    * that create new UI elements like the ABDesigner.
    * @param {ABApplication} application  	: the root ABApplication this view is under
    * @param {ABView/ABApplication} parent	: the parent object of this ABView.
    * @return {ABView}
    */
   static newInstance(application, parent) {
      // return a new instance from ABViewManager:
      return application.viewNew(
         { key: this.common().key },
         application,
         parent
      );
   }

   viewKey() {
      return this.defaults.key;
   }

   viewIcon() {
      return this.defaults.icon;
   }

   tabIcon() {
      return this.defaults.tabicon;
   }

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABView instance
    * into the values needed for saving to the DB.
    *
    * @return {json}
    */
   toObj() {
      // MLClass translation
      var obj = super.toObj();

      var result = {
         id: this.id,
         type: this.type || this.viewKey(),
         key: this.key,
         icon: this.icon,
         tabicon: this.tabicon,
         name: this.name,
         settings: this.AB.cloneDeep(this.settings || {}),
         // accessLevels: this.accessLevels,
         translations: obj.translations,
      };

      // encode our child view references
      result.viewIDs = (this._views || []).map((v) => v.id).filter((id) => id);
      result.viewIDs = result.viewIDs.concat(this.__missingViews);

      if (this.position) result.position = this.position;

      // encode our .isRoot() reference.
      // (NOTE: this is set so our server side code can distinguish) between a .view
      // and a root page:
      // NOTE: we intentionally do NOT pull this out in .fromValues()
      result.isRoot = this.isRoot();

      return result;
   }

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      this.id = values.id; // NOTE: only exists after .save()
      // {string} .id
      // the uuid of this ABObject Definition.

      this.type = values.type || this.viewKey();
      // {string} .type
      // the type of ABDefinition this is.

      this.key = values.key || this.viewKey();
      // {string} .key
      // the unique lookup key for our ABViewManager to create new
      // instances of this object.

      this.icon = values.icon || this.viewIcon();
      // {string} .icon
      // the font awesome icon reference for showing an icon for this
      // view in the AppBuilder interface builder.

      this.tabicon = values.tabicon || this.tabIcon();

      this.name = values.name;
      // {string} .name
      // A name reference for this ABView. This is a reference that isn't
      // translateable and will be used for lookups across languages.

      // if this is being instantiated on a read from the Property UI,
      // .label is coming in under .settings.label
      values.settings = values.settings || {};
      this.label = values.label || values.settings.label || "?label?";

      this.settings = values.settings || {};
      // {obj} .settings
      // the property settings for this ABView

      // make sure .settings.height is an int and not a string
      this.settings.height = parseInt(this.settings.height || 0);

      // this.accessLevels = values.accessLevels || {};
      // {obj} .accessLevels
      // Hash: { ABRole.id : accessLevel }
      // tracks the Role -> AccessLevel settings of this particular
      // view.
      // accessLevel: 0 : no access, 1 : view only, 2: full access

      // let the MLClass now process the translations:
      super.fromValues(values);

      // If the View / DataCollection does not have a .name already,
      // use the English label translation as the .name instead.
      if (!this.name && Array.isArray(this.translations)) {
         for (var i = 0; i < this.translations.length; i++) {
            if (i == 0) {
               // Use the first label found, in case there is no 'en'
               this.name = this.translations[i].label;
            }
            if (this.translations[i].language_code == "en") {
               // But the 'en' label will have final priority
               this.name = this.translations[i].label;
               break;
            }
         }
      }

      // default value for our label
      if (this.label == "?label?") {
         if (this.parent) {
            this.label =
               this.parent.label +
               "." +
               (this.field?.()?.columnName ?? this.defaults.key);
         }
      }

      var views = [];
      this.__missingViews = this.__missingViews || [];
      (values.viewIDs || []).forEach((id) => {
         var def = this.AB.definitionByID(id);
         if (def) {
            views.push(this.application.viewNew(def, this.application, this));
         } else {
            this.__missingViews.push(id);
         }
      });
      this._views = views;

      this.position = values.position || {};

      if (this.position.x != null) this.position.x = parseInt(this.position.x);
      if (this.position.y != null) this.position.y = parseInt(this.position.y);

      this.position.dx = parseInt(this.position.dx || 1);
      this.position.dy = parseInt(this.position.dy || 1);
   }

   isRoot() {
      return this.parent == null || this.parent == this.application;
   }

   /**
    * @method allParents()
    * return a flattened array of all the ABViews parents
    * @return {array}      array of ABViews
    */
   allParents() {
      var parents = [];
      var curView = this;

      // add current view to array
      parents.unshift(curView);

      while (!curView.isRoot() && curView.parent) {
         parents.unshift(curView.parent);

         curView = curView.parent;
      }

      return parents;
   }

   /**
    * @method isAccessibleForRoles()
    * return true/false if this ABViewPage is accessible for one of the
    * passed in ABRoles.
    * @param {array[ABRole]} roles
    *        an array of {ABRole} instances.
    * @return {bool}
    */
   // isAccessibleForRoles(roles) {
   //    var foundRole = false;

   //    var accessibleRoles = Object.keys(this.accessLevels) || [];
   //    (roles || []).forEach((r) => {
   //       if (accessibleRoles.indexOf(r.uuid || r) > -1) {
   //          foundRole = true;
   //       }
   //    });

   //    return foundRole;
   // }

   /**
    * @method getUserAccess()
    *
    * return the access level of the current user on the current view
    *
    * @return {integer}  // 0 = No Access // 1 = Read Only // 2 = Full Access
    */
   // getUserAccess() {
   //    // by default everyone has no access
   //    var accessLevel = 0;

   //    if (this.application.isAccessManaged) {
   //       // check to see if the current users is the access manager
   //       var isAccessManager = false;
   //       // first check if manager is defined by their role
   //       if (parseInt(this.application.accessManagers.useRole) == 1) {
   //          // if so check if any of the user's role match the managers
   //          this.AB.Account.roles().forEach((role) => {
   //             if (
   //                this.application.accessManagers.role.indexOf(
   //                   role.id || role.uuid
   //                ) > -1
   //             ) {
   //                // if so set the access level to full access
   //                isAccessManager = true;
   //                accessLevel = 2;
   //             }
   //          });
   //       }
   //       // if the user isn't already set as the manager and the manager is defined by their account
   //       if (
   //          !isAccessManager &&
   //          parseInt(this.application.accessManagers.useAccount) == 1
   //       ) {
   //          // check if the user's account matches the managers
   //          if (
   //             this.application.accessManagers.account.indexOf(
   //                this.AB.Account.uuid() + ""
   //             ) > -1
   //          ) {
   //             // if so set the access level to full access
   //             isAccessManager = true;
   //             accessLevel = 2;
   //          }
   //       }

   //       // if the user is not the manager check if the page has access levels defined for roles
   //       if (
   //          this.accessLevels &&
   //          Object.keys(this.accessLevels).length > 0 &&
   //          !isAccessManager
   //       ) {
   //          // check to see if the user's roles matches one of the roles defined
   //          this.AB.Account.roles().forEach((role) => {
   //             var currentRole = this.accessLevels[role.id || role.uuid];
   //             if (currentRole && parseInt(currentRole) > accessLevel)
   //                // if the access level is higher than a previous role set to the new level
   //                accessLevel = parseInt(currentRole);
   //          });
   //       }
   //    } else {
   //       accessLevel = 2;
   //    }

   //    return accessLevel;
   // }

   /**
    * @method parentFormComponent
    * return the closest form object this component is on.
    */
   parentFormComponent() {
      var form = null;

      var curr = this;
      while (curr.key != "mobile-form" && !curr.isRoot() && curr.parent) {
         curr = curr.parent;
      }

      if (curr.key == "mobile-form") {
         form = curr;
      }

      return form;
   }

   /**
    * @method parentDetailComponent
    * return the closest detail object that this component is on.
    * @returns {ABViewDetail} detail component
    */
   parentDetailComponent() {
      var detail = null;

      var curr = this;
      while (curr.key != "mobile-detail" && !curr.isRoot() && curr.parent) {
         curr = curr.parent;
      }

      if (curr.key == "mobile-detail") {
         detail = curr;
      }

      return detail;
   }

   pageParent(filterFn) {
      if (filterFn == null) filterFn = () => true;

      // if current page is the root page, then return itself.
      if (this.isRoot()) {
         return this;
      }

      var parentPage = this.parent;
      while (
         parentPage &&
         (parentPage.key != "mobile-page" || !filterFn(parentPage))
      ) {
         parentPage = parentPage.parent;
      }

      return parentPage;
   }

   pageRoot() {
      var rootPage = this.pageParent();

      while (!rootPage.isRoot()) {
         rootPage = rootPage.pageParent();
      }

      return rootPage;
   }

   /**
    * @property datacollection
    * return data source
    *
    * @return {ABDataCollection}
    */
   get datacollection() {
      let dataviewID = (this.settings || {}).dataviewID;
      if (!dataviewID) {
         if (
            [
               "mobile-form",
               "grid",
               "line",
               "area",
               "bar",
               "gantt",
               "kanban",
            ].indexOf(this.key) > -1
         ) {
            // NOTE: ignore kanban side forms where this is the case:
            if (this.key == "mobile-form" && this._currentObject) return null;

            if (this.warningsSilent) return null;

            var errNoDCID = new Error(
               `ABViewCore:get datacollection(): View[${this.key}] didn't define a dataviewID.`
            );
            this.AB.notify.builder(errNoDCID, {
               view: this,
               settings: this.settings,
            });
         } else {
            // These views shouldn't matter if they don't have a datacollection.
            if (
               [
                  "button",
                  "label",
                  "mobile-page",
                  "tab",
                  "viewcontainer",
               ].indexOf(this.key) == -1
            ) {
               console.warn(
                  `TODO: figure out which ABView* require a .dataviewID: ${this.key}?`
               );
            }
         }
         return null;
      }

      var dc = this.AB.datacollectionByID(dataviewID);
      if (!dc) {
         var errNoDC = new Error(
            `MobileView[${this.label}][${this.id}] is unable to find associated DataCollection`
         );
         this.AB.notify.builder(errNoDC, {
            view: this,
            dataviewID,
         });
      }
      return dc;
   }

   ///
   /// Update Access accessLevels
   ///

   /**
    * @method updateAccessLevels()
    *
    *
    * @param {string} roleId
    *
    * @param {string} accessLevel
    *
    * @return {Promise}
    *
    */
   // updateAccessLevels(roleId, accessLevel) {
   //    if (parseInt(accessLevel) == 0) {
   //       if (this.accessLevels[roleId]) delete this.accessLevels[roleId];
   //    } else {
   //       this.accessLevels[roleId] = accessLevel;
   //    }

   //    return this.save(false, false);
   // }

   ///
   /// Views
   ///

   /**
    * @method views()
    *
    * return an array of all the ABViews children
    *
    * @param {fn} filter  	a filter fn to return a set of ABViews that this fn
    *						returns true for.
    * @param {boolean} deep
    *
    * @return {array} 	array of ABViews
    */
   views(filter = () => true, deep = false) {
      var result = [];

      if (!this._views || this._views.length < 1) return result;

      // find into recursively
      if (filter && deep) {
         // result = result.concat(this._views.filter(filter));

         // this._views.forEach((v) => {
         //    var subViews = v.views(filter, deep);
         //    if (subViews && subViews.length > 0) {
         //       result = result.concat(subViews);
         //    }
         // });
         result = this.application._searchDeep(this, "_views", filter);
      } else {
         result = this._views.filter(filter);
      }

      return result;
   }

   /**
    * @method viewByID()
    *
    * return the specific View referenced by the given ID.
    *
    * @param {uuid} ID
    *        the {ABMobileView}.id of the child view we are requesting
    *
    * @return {ABMobileView || undefined}
    */
   viewByID(ID) {
      return this.views((v) => v.id == ID, true)[0];
   }

   /**
    * @method viewNew()
    * @return {ABView}
    */
   viewNew(values, application, parent) {
      return this.application.viewNew(
         values,
         application || this.application,
         parent || this
      );
   }

   /**
    * @method viewDestroy()
    *
    * remove the current ABView from our list of ._views.
    *
    * @param {ABView} view
    * @return {Promise}
    */
   // viewDestroy(view) {
   //    console.error("DEPRECIATED: where is this called?");
   //    return this.viewRemove(view);
   // }

   /**
    * @method viewRemove()
    *
    * remove the current ABView from our list of ._views.
    *
    * @param {ABView} view
    * @return {Promise}
    */
   viewRemove(view) {
      var origLen = this._views.length;
      this._views = this.views(function (v) {
         return v.id != view.id;
      });

      if (this._views.length < origLen) {
         return this.save();
      }

      return Promise.resolve();
   }

   /**
    * @method viewInsert()
    *
    * persist the current ABView in our list of ._views.
    *
    * @param {ABView} object
    * @return {Promise}
    */
   viewInsert(view) {
      var isIncluded =
         this.views(function (v) {
            return v.id == view.id;
         }).length > 0;
      if (!isIncluded) {
         this._views.push(view);
         return this.save();
      }

      return Promise.resolve();
   }

   /**
    * @method viewReorder()
    *
    * reorder the current ABView in our list of ._views.
    *
    * @param {string} viewId - id of the active view
    * @param {string} toPosition - 'to' postion
    * @return {Promise}
    */
   viewReorder(viewId, toPosition) {
      var from = this._views.findIndex((v) => v.id == viewId);
      if (from < 0) return;

      // move drag item to 'to' position
      this._views.splice(toPosition, 0, this._views.splice(from, 1)[0]);

      // save to database
      return this.save(true);
   }

   /// ABApplication data methods

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
      // unsubscribe events
      this.eventClear(true);

      return Promise.resolve()
         .then(() => {
            // When deleting an ABView
            // be sure to remove any of it's ABViews as well
            // This cleans out any dangling ABDefinitions

            var allViewDeletes = [];
            var allViews = this.views();
            this._views = [];
            // doing ._views = [] prevents any of my updates when
            // a sub-view is .destroy()ed

            allViews.forEach((v) => {
               allViewDeletes.push(v.destroy());
            });
            return Promise.all(allViewDeletes);
         })
         .then(() => {
            // NOTE: this should not happen on ABViewPage objects
            if (this.parent && !this.pages) {
               return this.parent.viewRemove(this);
            }
         })
         .then(() => {
            return super.destroy();
         })
         .then(() => {
            this.emit("destroyed");
         });
   }

   /**
    * @method save()
    * persist this instance of ABView
    * @return {Promise}
    *		.resolve( {this} )
    */
   save() {
      return Promise.resolve()
         .then(() => {
            // this creates our .id
            return super.save();
         })
         .then(() => {
            // NOTE: this should not happen on ABViewPage objects:
            if (this.parent && !this.pages) {
               // if we have a .parent, make sure we are included in our .parent's
               // viewIDs
               return this.parent.viewInsert(this);
            }
         })
         .then(() => {
            return this;
         });
   }

   /**
    * @method wantsAdd()
    * Some widgets can indicate to their containing ABMobilePage that
    * it wants to provide an [Add] feature.
    * @return {bool}
    */
   get wantsAdd() {
      // the default widget doesn't.
      // only those that actually do, should override this.
      return false;
   }

   ///
   /// Events
   ///

   /**
    * @method eventAdd()
    *
    *
    *
    * @param {object} evt - {
    * 							emitter: object,
    * 							eventName: string,
    * 							listener: function
    * 						}
    */
   eventAdd(evt) {
      if (!evt || !evt.emitter || !evt.listener) return;

      var exists = this.__events.find((e) => {
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
    * @param {bool} deep - clear events of child views
    */
   eventClear(deep) {
      if (deep) {
         this.views().forEach((v) => {
            v.eventClear(deep);
         });
      }

      if (this.__events && this.__events.length > 0) {
         this.__events.forEach((e) => {
            e.emitter.removeListener(e.eventName, e.listener);
         });
      }
   }

   /**
    * @method clone()
    * clone the definitions of this ABView object.
    * @param {obj} lookUpIds
    *        an { oldID : newID } lookup hash for converting ABView objects
    *        and their setting pointers.
    * @param {ABView*} parent
    *        Which ABView should be connected as the parent object of this
    *        copy.
    * @param {obj} options
    *        option settings for the copy command.
    *        options.ignoreSubPages {bool}
    *             set to true to skip copying any sub pages of this ABView.
    * @return {obj}
    *        obj defs of this ABView
    */
   clone(lookUpIds, parent, options = {}) {
      lookUpIds = lookUpIds || {};

      // get settings of the target
      let config = this.toObj();

      // remove sub-elements property
      ["pages", "views"].forEach((prop) => {
         delete config[prop];
      });

      // update id of linked components
      if (this.copyUpdateProperyList) {
         (this.copyUpdateProperyList() || []).forEach((prop) => {
            if (config && config.settings)
               config.settings[prop] = lookUpIds[config.settings[prop]];
         });
      }

      // copy from settings
      let result = this.viewNew(config, this.application, parent);

      // change id
      if (parent == null) {
         // the page is getting cloned to root: there is no parent, as parent is the application
         result.id = null;
      } else {
         result.id = lookUpIds[result.id] || this.AB.uuid();
      }

      // copy sub pages
      if (this.pages && !options.ignoreSubPages) {
         result._pages = [];
         this.pages().forEach((p) => {
            let copiedSubPage = p.clone(lookUpIds, result, options);
            copiedSubPage.parent = result;

            result._pages.push(copiedSubPage);
         });
      }

      // copy sub views
      if (this.views && !options.ignoreSubViews) {
         result._views = [];
         this.views().forEach((v) => {
            let copiedView = v.clone(lookUpIds, result, options);

            result._views.push(copiedView);
         });
      }

      return result;
   }

   /**
    * @method copy()
    * create a new copy of this ABView object. The resulting ABView should
    * be identical in settings and all sub pages/views, but each new object
    * is a unique view (different ids).
    * @param {obj} lookUpIds
    *        an { oldID : newID } lookup hash for converting ABView objects
    *        and their setting pointers.
    * @param {ABView*} parent
    *        Which ABView should be connected as the parent object of this
    *        copy.
    * @param {obj} options
    *        option settings for the copy command.
    *        options.ignoreSubPages {bool}
    *             set to true to skip copying any sub pages of this ABView.
    *        options.newName {string}
    *             new user determined name for page
    * @return {Promise}
    *        .resolved with the instance of the copied ABView
    */
   copy(lookUpIds, parent, options = {}) {
      lookUpIds = lookUpIds || {};

      // get settings of the target
      let config = this.toObj();

      // remove sub-elements property
      ["pageIDs", "viewIDs"].forEach((prop) => {
         delete config[prop];
      });

      // update id of linked components
      if (this.copyUpdateProperyList) {
         (this.copyUpdateProperyList() || []).forEach((prop) => {
            if (config && config.settings)
               config.settings[prop] = lookUpIds[config.settings[prop]];
         });
      }

      // copy from settings
      let result = this.application.viewNew(config, this.application, parent);

      // keep the parent
      result.parent = parent || this.parent;

      // change id
      if (parent == null) {
         // the page is getting cloned to root: there is no parent, as parent is the application.
         // pages with null parent ids default to getting put on root
         result.id = null;
      } else {
         result.id = lookUpIds[result.id] || this.AB.uuid();
      }

      // page's name should not be duplicate
      if (this.key == "mobile-page") {
         result.name =
            options?.newName ||
            `${result.name}_copied_${this.AB.uuid().slice(0, 3)}`;

         result.label = options?.newName || `${result.label} (copied)`;
      }

      return Promise.resolve()
         .then(() => {
            // copy sub pages
            var allSaves = [];

            if (this._pages && !options.ignoreSubPages) {
               result._pages = [];
               this.pages().forEach((p) => {
                  // this prevents result.save() from happening on each of these
                  // p.copy():
                  if (p.isRoot())
                     this.application._pages.push({ id: lookUpIds[p.id] });

                  allSaves.push(
                     p
                        .copy(lookUpIds, result, options)
                        .then((copiedSubPage) => {
                           copiedSubPage.parent = result;
                           // remove the temp {id:} entry above:
                           this.application._pages =
                              this.application._pages.filter(
                                 (p2) => p2.id != lookUpIds[p.id]
                              );

                           // now add the full copiedSubPage:
                           result._pages.push(copiedSubPage);
                        })
                  );
               });
            }

            return Promise.all(allSaves);
         })
         .then(() => {
            // copy sub views
            var allSaves = [];

            if (this._views && !options.ignoreSubViews) {
               result._views = [];
               this.views().forEach((v) => {
                  allSaves.push(
                     // send a null for parent, so that the .save() wont trigger
                     // a save of the parent.
                     v.copy(lookUpIds, result, options).then((copiedView) => {
                        // now patch up the parent connection:
                        // copiedView.parent = result;
                        if (
                           result._views.filter((vi) => vi.id == copiedView.id)
                              .length < 1
                        ) {
                           result._views.push(copiedView);
                        }
                     })
                  );
               });
            }

            return Promise.all(allSaves);
         })
         .then(() => {
            // now we do 1 save for all the views
            return result.save();
         })
         .then(() => {
            return result;
         });
   }
};
