/*
 * ABQLObject
 *
 * An ABQLObject defines a set of ABQL operations for a single object value.
 *
 */

var ABQL = require("./ABQL");

var ABQLObjectDefaults = {
    key: "qlobject" // {string} unique key for this view
};

module.exports = class ABQLObject extends ABQL {
    /**
     * @param {obj} values  key=>value hash of ABView values
     * @param {ABApplication} application the application object this view is under
     * @param {ABView} parent the ABView this view is a child of. (can be null)
     * @param {obj} defaultValues special sub class defined default values.
     */
    constructor(values, application, parent, defaultValues) {
        super(values, application, parent, defaultValues || ABQLObjectDefaults);

        // values:
        // {
        //  key:'qlarray',
        //  dc: "DataCollectionKey" || {ABViewDataCollection}
        //  data: null || [ {obj1}, {obj2}, ... ]
        // }
    }

    static common() {
        return ABQLObjectDefaults;
    }

    ///
    /// Instance Methods
    ///

    ///
    /// Array type methods do not make sense on an ABQLObject, so overwrite them
    /// to just return this instance, and mark an Error.
    ///

    /**
     * first()
     * doesn't make sense in this context:
     * @return {ABQLSingle}
     */
    first() {
        console.log("ABQLObject: .first() being called on an object element.");
        return this;
    }

    ///
    /// Object values
    ///

    /**
     * connected()
     * switch to working with the values of a connected field.
     * This returns either an {ABQLObject} or {ABQL} object depending on the
     * current value of the connected field.
     * @return {ABQLObject} or {ABQL}
     */
    connected(field) {
        // skip if we are working with null values
        if (!this.data) {
            return this.nullValue();
        }

        // start with the Datacollection->object
        var object = this.datacollection.datasource;

        // find the field definition related to the passed in field (id, or name)
        var field = object.connectFields().find((f) => {
            return f.id == field || f.columnName == field;
        });
        if (!field) {
            return this.nullValue();
        }

        // look at my current data associated with this field
        var value = this.data[field.relationName()];
        if (!value) {
            // TODO: if there is no relation data, try to resolve the ID field.

            return this.nullValue();
        }

        var param = {
            key: "qlbase",
            dc: this.datacollection.id,
            data: value
        };

        // if an array, return an ABQL() with this data
        if (Array.isArray(value)) {
            return new ABQL(param, this.application, this);
        } else {
            // else return ABQLObject() with this data.
            return new ABQLObject(param, this.application, this);
        }
    }

    /**
     * nullValue
     * return a null ABQLObject
     * @return {ABQLObject}
     */
    nullValue() {
        return super.nullValue(ABQLObject);
    }

    /**
     * value
     * return the current value of this QL object.
     * make sure we are not returning an array, but a single element.
     * @return {obj}
     */
    value() {
        var val = super.value();

        // we are a single object Query Element, so make sure we are
        // not returning an Array
        if (Array.isArray(val)) {
            if (val.length == 0) {
                // if the data collection is empty it returns an empty Array
                // lets just return null since we are asking for a value
                val = null;
            } else {
                // if we did get an array, then default to 1st element.
                val = val[0];
            }
        }

        return val || null;
    }
};
