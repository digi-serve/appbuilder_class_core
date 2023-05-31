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
   await import("../platform/dataFields/ABFieldString"),
   await import("../platform/dataFields/ABFieldLongText"),
   await import("../platform/dataFields/ABFieldNumber"),
   await import("../platform/dataFields/ABFieldDate"),
   await import("../platform/dataFields/ABFieldDateTime"),
   await import("../platform/dataFields/ABFieldBoolean"),
   await import("../platform/dataFields/ABFieldList"),
   await import("../platform/dataFields/ABFieldTree"),
   await import("../platform/dataFields/ABFieldEmail"),
   await import("../platform/dataFields/ABFieldFile"),
   await import("../platform/dataFields/ABFieldImage"),
   await import("../platform/dataFields/ABFieldUser"),
   await import("../platform/dataFields/ABFieldConnect"),
   await import("../platform/dataFields/ABFieldCalculate"),
   await import("../platform/dataFields/ABFieldTextFormula"),
   await import("../platform/dataFields/ABFieldFormula"),
   await import("../platform/dataFields/ABFieldAutoIndex"),
   await import("../platform/dataFields/ABFieldJson"),
   await import("../platform/dataFields/ABFieldCombine"),
   await import("../platform/dataFields/ABFieldSelectivity"),
];

AllFieldClasses.forEach((FIELD) => {
   FIELD = FIELD.default;
   Fields[FIELD.defaults().key] = FIELD;
});

export default class ABFieldManager {
   /*
    * @function allFields
    * return all the currently defined ABFields in an array.
    * @return [{ABField},...]
    */
   static allFields() {
      var fields = [];
      for (var f in Fields) {
         fields.push(Fields[f]);
      }
      return fields;
   }

   /**
    * @function fieldByKey()
    * Return a specific ABField that matches the given key
    * @param {string} key
    *        The ABField.key value we are looking for.
    * @return {ABFieldXXX || undefined}
    */
   static fieldByKey(key) {
      return Fields[key];
   }

   /*
    * @function newField
    * return an instance of an ABField based upon the values.key value.
    * @return {ABField}
    */
   static newField(values, object) {
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
   }
}
