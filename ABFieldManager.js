/*
 * ABFieldManager
 *
 * An interface for managing the different ABFields available in our AppBuilder.
 *
 */

/*
 * Fields
 * A name => ABField  hash of the different ABFields available.
 */
var Fields = {};

var AllFieldClasses = [
   require("../platform/dataFields/ABFieldString"),
   require("../platform/dataFields/ABFieldLongText"),
   require("../platform/dataFields/ABFieldNumber"),
   require("../platform/dataFields/ABFieldDate"),
   require("../platform/dataFields/ABFieldDateTime"),
   require("../platform/dataFields/ABFieldBoolean"),
   require("../platform/dataFields/ABFieldList"),
   require("../platform/dataFields/ABFieldTree"),
   require("../platform/dataFields/ABFieldEmail"),
   require("../platform/dataFields/ABFieldFile"),
   require("../platform/dataFields/ABFieldImage"),
   require("../platform/dataFields/ABFieldUser"),
   require("../platform/dataFields/ABFieldConnect"),
   require("../platform/dataFields/ABFieldCalculate"),
   require("../platform/dataFields/ABFieldTextFormula"),
   require("../platform/dataFields/ABFieldFormula"),
   require("../platform/dataFields/ABFieldAutoIndex"),
   require("../platform/dataFields/ABFieldJson"),
   require("../platform/dataFields/ABFieldCombine"),
];

AllFieldClasses.forEach((FIELD) => {
   Fields[FIELD.defaults().key] = FIELD;
});

module.exports = {
   /*
    * @function allFields
    * return all the currently defined ABFields in an array.
    * @return [{ABField},...]
    */
   allFields: function () {
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
   newField: function (values, object) {
      if (values.key) {
         try {
            return new Fields[values.key](values, object);
         } catch (err) {
            console.log("Error", err);
            console.log("Available fields", Fields);
            console.log("Requested field", values.key);
         }
      } else {
         console.log("-------");
         console.log("values:");
         console.error(values);
         console.log();
         console.error("object:");
         console.error(object);
         console.log("-------");
         throw new Error(
            `ABFieldManager.newField(): Unknown Field Key [${values.name}][${values.key}] for object[${object.name}]`
         );
         //// TODO: what to do here?
      }
   },
};
