/*
 * ABFieldManager
 *
 * An interface for managing the different ABFields available in our AppBuilder.
 *
 */

var ABFieldString = require("../platform/dataFields/ABFieldString");
var ABFieldLongText = require("../platform/dataFields/ABFieldLongText");
var ABFieldNumber = require("../platform/dataFields/ABFieldNumber");
var ABFieldDate = require("../platform/dataFields/ABFieldDate");
var ABFieldBoolean = require("../platform/dataFields/ABFieldBoolean");
var ABFieldList = require("../platform/dataFields/ABFieldList");
var ABFieldTree = require("../platform/dataFields/ABFieldTree");
var ABFieldEmail = require("../platform/dataFields/ABFieldEmail");
var ABFieldFile = require("../platform/dataFields/ABFieldFile");
var ABFieldImage = require("../platform/dataFields/ABFieldImage");
var ABFieldUser = require("../platform/dataFields/ABFieldUser");
var ABFieldConnect = require("../platform/dataFields/ABFieldConnect");
var ABFieldCalculate = require("../platform/dataFields/ABFieldCalculate");
var ABFieldTextFormula = require("../platform/dataFields/ABFieldTextFormula");
var ABFieldFormula = require("../platform/dataFields/ABFieldFormula");

/*
 * Fields
 * A name => ABField  hash of the different ABFields available.
 */
var Fields = {};
Fields[ABFieldString.defaults().key] = ABFieldString;
Fields[ABFieldLongText.defaults().key] = ABFieldLongText;
Fields[ABFieldNumber.defaults().key] = ABFieldNumber;
Fields[ABFieldDate.defaults().key] = ABFieldDate;
Fields[ABFieldBoolean.defaults().key] = ABFieldBoolean;
Fields[ABFieldList.defaults().key] = ABFieldList;
Fields[ABFieldTree.defaults().key] = ABFieldTree;
Fields[ABFieldEmail.defaults().key] = ABFieldEmail;
Fields[ABFieldFile.defaults().key] = ABFieldFile;
Fields[ABFieldImage.defaults().key] = ABFieldImage;
Fields[ABFieldUser.defaults().key] = ABFieldUser;
Fields[ABFieldConnect.defaults().key] = ABFieldConnect;
Fields[ABFieldCalculate.defaults().key] = ABFieldCalculate;
Fields[ABFieldTextFormula.defaults().key] = ABFieldTextFormula;
Fields[ABFieldFormula.defaults().key] = ABFieldFormula;

module.exports = {
    /*
     * @function allFields
     * return all the currently defined ABFields in an array.
     * @return [{ABField},...]
     */
    allFields: function() {
        var fields = [];
        for (var f in Fields) {
            fields.push(Fields[f]);
        }
        return fields;
    },

    /*
     * @function newField
     * return an instance of an ABField based upon the values.key value.
     * @return {ABField}
     */
    newField: function(values, object) {
        if (values.key) {
            try {
                return new Fields[values.key](values, object);
            } catch (err) {
                console.log("Error", err);
                console.log("Available fields", Fields);
                console.log("Requested field", values.key);
            }
        } else {
            //// TODO: what to do here?
        }
    }
};
