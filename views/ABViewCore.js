/*
 * ABViewCore
 *
 * ABViewCore defines the common ABView structure that is shared between
 * the client and the server.  Mostly how it manages it's internal data, and
 * how it is related to the ABView classes.
 *
 */

var ABEmitter = require("../../platform/ABEmitter");

var ABViewDefaults = {
    key: "view", // {string} unique key for this view
    icon: "window-maximize", // {string} fa-[icon] reference for this view
    labelKey: "ab.components.view" // {string} the multilingual label key for the class label
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
        return application.viewNew(
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
            views.push(this.application.viewNew(child, this.application, this));
        });
        this._views = views;
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
     * @return {array} 	array of ABViews
     */
    views(filter) {
        filter =
            filter ||
            function() {
                return true;
            };

        return this._views.filter(filter);
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
};
