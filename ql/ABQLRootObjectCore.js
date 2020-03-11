/*
 * ABQLRootObjectCore
 *
 * An ABQL defines a Query Language Operation. A QL Operation
 * is intended to be evaluated at run time and return a value that can be
 * assigned to form value or an object.
 *
 *
 */

const ABQL = require("../../platform/ql/ABQL.js");

// Define the Operations that can be performed off of a RootObject.
// Each Root Object might have a different set of Operations, so we
// define them here.
const QLFind = require("../../platform/ql/ABQLFind.js");
var NextQLOps = [QLFind];

var ParameterDefinitions = [
    {
        type: "objectName",
        name: "name"
    }
];

class ABQLObjectCore extends ABQL {
    constructor(attributes, task, application) {
        // NOTE: keep this so we can insert the prevOp == null
        super(attributes, ParameterDefinitions, null, task, application);
    }

    ///
    /// Instance Methods
    ///
    initObject(attributes) {
        if (!this.object && this.params) {
            var objNameDef = this.parameterDefinitions.find((pDef) => {
                return pDef.type == "objectName";
            });
            if (objNameDef) {
                this.objectID = this.params[objNameDef.name];
                this.object = this.objectLookup(this.objectID);
            }
        }
    }

    toObj() {
        var obj = super.toObj();

        // if we don't have an objectID, but we have an objectName parameter
        // definition then save that as our objectID
        if (!obj.objectID && this.params) {
            var objNameDef = this.parameterDefinitions.find((pDef) => {
                return pDef.type == "objectName";
            });
            if (objNameDef) {
                obj.objectID = this.params[objNameDef.name];
            }
        }
        return obj;
    }

    /// ABApplication data methods

    // paramsValid(queryString) {
    //     if (super.paramsValid(queryString)) {
    //         this.object = this.objectLookup(this.params["name"]);
    //         return true;
    //     }
    //     return false;
    // }
}
ABQLObjectCore.key = "object";
ABQLObjectCore.label = "object";
ABQLObjectCore.NextQLOps = NextQLOps;

module.exports = ABQLObjectCore;
