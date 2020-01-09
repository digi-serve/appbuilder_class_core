/*
 * ABViewCore
 *
 * ABViewCore defines the common ABView structure that is shared between
 * the client and the server.  Mostly how it manages it's internal data, and
 * how it is related to the ABView classes.
 *
 */

const ABEmitter = require("../../platform/ABEmitter");

const ABViewDefaults = {
    key: "view", // {string} unique key for this view
    icon: "window-maximize", // {string} fa-[icon] reference for this view
    labelKey: "ab.components.view", // {string} the multilingual label key for the class label
    tabicon: "" // no default tab icons
};

const ABViewPropertyComponentDefaults = {
    label: ""
};

module.exports = class ABViewCore extends ABEmitter {
    /**
     * @param {obj} values  key=>value hash of ABView values
     * @param {ABApplication} application the application object this view is under
     * @param {ABView} parent the ABView this view is a child of. (can be null)
     */
    constructor(values, application, parent, defaultValues) {
        super();

        this.__events = [];
        // keep track of any event listeners attached to this ABView object

        this.defaults = defaultValues || ABViewDefaults;

        this.application = application;

        this.parent = parent || null;

        this.fromValues(values);
    }

    static common() {
        return ABViewDefaults;
    }

    static defaultValues() {
        return ABViewPropertyComponentDefaults;
    }

    /**
     * @method newInstance()
     * return a new instance of this ABView.
     * @param {ABApplication} application  	: the root ABApplication this view is under
     * @param {ABView/ABApplication} parent	: the parent object of this ABView.
     * @return {ABView}
     */
    static newInstance(application, parent) {
        console.error("!!! where is this being called???");
        // return a new instance from ABViewManager:
        return ABViewCore.viewNew(
            { key: this.common().key },
            application,
            parent
        ); // ABViewManager.newView({ key: this.common().key }, application, parent);
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
        // NOTE: ensure we have a uuid() set:
        if (!this.id) {
            this.id = this.application.uuid();
        }

        this.application.unTranslate(this, this, ["label"]);

        var result = {
            id: this.id,
            key: this.key,
            icon: this.icon,
            tabicon: this.tabicon,

            name: this.name,
            // parent: this.parent,

            settings: this.application.cloneDeep(this.settings || {}),
            translations: this.translations || []
        };

        // // for each Object: compile to json
        var views = [];
        this._views.forEach((view) => {
            views.push(view.toObj());
        });
        result.views = views;

        if (this.position)
            result.position = this.position;

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
        this.key = values.key || this.viewKey();
        this.icon = values.icon || this.viewIcon();
        this.tabicon = values.tabicon || this.tabIcon();

        // this.parent = values.parent || null;

        this.name = values.name;

        // if this is being instantiated on a read from the Property UI,
        // .label is coming in under .settings.label
        values.settings = values.settings || {};
        this.label = values.label || values.settings.label || "?label?";

        this.translations = values.translations || [];

        this.settings = values.settings || {};

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

        // label is a multilingual value:
        this.application.translate(this, this, ["label"]);

        // default value for our label
        if (this.label == "?label?") {
            if (this.parent) {
                this.label = this.parent.label + "." + this.defaults.key;
            }
        }

        var views = [];
        (values.views || []).forEach((child) => {
            views.push(this.viewNew(child, this.application, this));
        });
        this._views = views;

        // convert from "0" => 0
        this.position = values.position || {};

        if (this.position.x != null)
            this.position.x = parseInt(this.position.x);

        if (this.position.y != null)
            this.position.y = parseInt(this.position.y);

        this.position.dx = parseInt(this.position.dx || 1);
        this.position.dy = parseInt(this.position.dy || 1);
    }

    isRoot() {
        return this.parent == null;
    }

    /**
     * @method allParents()
     *
     * return an flatten array of all the ABViews parents
     *
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
     * @method parentFormComponent
     * return the closest form object this component is on.
     */
    parentFormComponent() {
        var form = null;

        var curr = this;
        while (curr.key != "form" && !curr.isRoot() && curr.parent) {
            curr = curr.parent;
        }

        if (curr.key == "form") {
            form = curr;
        }

        return form;
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
            (parentPage.key != "page" || !filterFn(parentPage))
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
     * @method urlPointer()
     * return the url pointer that references this view.  This url pointer
     * should be able to be used by this.application.urlResolve() to return
     * this view object.
     * @return {string}
     */
    urlPointer() {
        if (this.parent) {
            return this.parent.urlView() + this.id;
        } else {
            return this.application.urlPage() + this.id;
        }
    }

    /**
     * @method urlView
     * return a string pointer to this object's views.
     * @return {string}
     */
    urlView() {
        return this.urlPointer() + "/_views/";
    }

    /**
     * @property datacollection
     * return data source
     *
     * @return {ABDataCollection}
     */
    get datacollection() {
        let dataviewID = (this.settings || {}).dataviewID;
        if (!dataviewID) return null;

        return this.application.datacollections((dc) => dc.id == dataviewID)[0];
    }

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
    views(filter, deep) {
        var result = [];

        if (!this._views || this._views.length < 1) return result;

        // find into recursively
        if (filter && deep) {
            result = result.concat(this._views.filter(filter));

            this._views.forEach((v) => {
                var subViews = v.views(filter, deep);
                if (subViews && subViews.length > 0) {
                    result = result.concat(subViews);
                }
            });
        } else {
            filter =
                filter ||
                function() {
                    return true;
                };

            result = this._views.filter(filter);
        }

        return result;
    }

    /**
     * @method viewNew()
     *
     *
     * @return {ABView}
     */
    viewNew(values) {
        return this.application.viewNew(values, this.application, this);
    }

    /**
     * @method viewDestroy()
     *
     * remove the current ABView from our list of ._views.
     *
     * @param {ABView} view
     * @return {Promise}
     */
    viewDestroy(view) {
        var remainingViews = this.views(function(v) {
            return v.id != view.id;
        });
        this._views = remainingViews;

        return this.save();
    }

    /**
     * @method viewSave()
     *
     * persist the current ABView in our list of ._views.
     *
     * @param {ABView} object
     * @return {Promise}
     */
    viewSave(view) {
        var isIncluded =
            this.views(function(v) {
                return v.id == view.id;
            }).length > 0;
        if (!isIncluded) {
            this._views.push(view);
        }

        return this.save();
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
        return this.save();
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
        return new Promise((resolve, reject) => {
            // unsubscribe events
            this.eventClear(true);

            // verify we have been .save() before:
            if (this.id) {
                this.application
                    .viewDestroy(this)
                    .then(() => {
                        // remove the page in list
                        let parent = this.parent;
                        if (parent) {
                            let remainingPages = parent.views(
                                (v) => v.id != this.id
                            );
                            parent._views = remainingPages;
                        }

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
     * persist this instance of ABView with it's parent
     *
     * @param includeSubViews {Boolean}
     *
     * @return {Promise}
     *						.resolve( {this} )
     */
    save(includeSubViews = false) {
        return new Promise((resolve, reject) => {
            // // if this is our initial save()
            // if (!this.id) {
            // 	this.id = OP.Util.uuid();	// setup default .id
            // }

            // // if this is not a child of another view then tell it's
            // // application to save this view.
            //  var parent = this.parent;
            // if (!parent) parent = this.application;

            // parent.viewSave(this)
            // 	.then(resolve)
            // 	.catch(reject)

            // if this is our initial save()
            if (!this.id) {
                this.id = OP.Util.uuid(); // setup default .id
            }

            this.application
                .viewSave(this, includeSubViews)
                .then(() => {
                    // persist the current ABViewPage in our list of ._pages.
                    let parent = this.parent || this.application;
                    let isIncluded =
                        parent.views((v) => v.id == this.id).length > 0;
                    if (!isIncluded) {
                        parent._views.push(this);
                    }

                    resolve();
                })
                .catch(reject);
        });
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
                listener: evt.listener
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

    copy(lookUpIds, parent) {
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
        result.id = lookUpIds[result.id] || OP.Util.uuid();

        // copy sub pages
        if (this.pages) {
            result._pages = [];
            this.pages().forEach((p) => {
                let copiedSubPage = p.copy(lookUpIds, result);
                copiedSubPage.parent = result;

                result._pages.push(copiedSubPage);
            });
        }

        // copy sub views
        if (this.views) {
            result._views = [];
            this.views().forEach((v) => {
                let copiedView = v.copy(lookUpIds, result);

                result._views.push(copiedView);
            });
        }

        return result;
    }
};
