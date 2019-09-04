/*
 * ABQLManager
 *
 * An interface for managing the different ABQL Operations available in our
 * AppBuilder.
 *
 */

var ABQL = require("./ql/ABQL");
var ABQLObject = require("./ql/ABQLObject");

/*
 * Views
 * A name => ABView  hash of the different ABViews available.
 */
var QLOps = {};
QLOps[ABQL.common().key] = ABQL;
QLOps[ABQLObject.common().key] = ABQLObject;

module.exports = {
    /*
     * @function allOps
     * return all the currently defined ABQL operations in an array.
     * @return [{ABQL},...]
     */
    allOPs: function(fn) {
        fn =
            fn ||
            function() {
                return true;
            };

        var ops = [];
        for (var o in QLOps) {
            var OP = QLOps[o];
            if (fn(OP)) {
                ops.push(OP);
            }
        }
        return ops;
    },

    /*
     * @function newOP
     * return an instance of an ABQL operation based upon the values.key value.
     * @param {obj} values any initial settings for the Operation
     *				.key {string} the ABQLOperation key
     * @param {ABApplication} application the link to this ABApplication
     * @param {ABQLOperation} parent the parent object this operation is
     *				tied to.
     * @return {ABQLOperation}
     */
    newOP: function(values, application, parent) {
        parent = parent || null;

        if (values.key && QLOps[values.key]) {
            return new QLOps[values.key](values, application, parent);
        } else {
            var err = new Error("unknown QL key");
            OP.Error.log("Unknown QL key [" + values.key + "]:", {
                error: err,
                values: values,
                application: application
            });
            return null;
        }
    }
};
