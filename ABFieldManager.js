/*
 * ABFieldManager
 *
 * An interface for managing the different ABFields available in our AppBuilder.
 *
 */

import ABFieldString from "../platform/dataFields/ABFieldString.js";
import ABFieldLongText from "../platform/dataFields/ABFieldLongText.js";
import ABFieldNumber from "../platform/dataFields/ABFieldNumber.js";
import ABFieldDate from "../platform/dataFields/ABFieldDate.js";
import ABFieldDateTime from "../platform/dataFields/ABFieldDateTime.js";
import ABFieldBoolean from "../platform/dataFields/ABFieldBoolean.js";
import ABFieldList from "../platform/dataFields/ABFieldList.js";
import ABFieldTree from "../platform/dataFields/ABFieldTree.js";
import ABFieldEmail from "../platform/dataFields/ABFieldEmail.js";
import ABFieldFile from "../platform/dataFields/ABFieldFile.js";
import ABFieldImage from "../platform/dataFields/ABFieldImage.js";
import ABFieldUser from "../platform/dataFields/ABFieldUser.js";
import ABFieldConnect from "../platform/dataFields/ABFieldConnect.js";
import ABFieldCalculate from "../platform/dataFields/ABFieldCalculate.js";
import ABFieldTextFormula from "../platform/dataFields/ABFieldTextFormula.js";
import ABFieldFormula from "../platform/dataFields/ABFieldFormula.js";
import ABFieldAutoIndex from "../platform/dataFields/ABFieldAutoIndex.js";
import ABFieldJson from "../platform/dataFields/ABFieldJson.js";
import ABFieldCombine from "../platform/dataFields/ABFieldCombine.js";
import ABFieldSelectivity from "../platform/dataFields/ABFieldSelectivity.js";

/*
 * Fields
 * A name => ABField  hash of the different ABFields available.
 */
var Fields = {};

var AllFieldClasses = [
   ABFieldString,
   ABFieldLongText,
   ABFieldNumber,
   ABFieldDate,
   ABFieldDateTime,
   ABFieldBoolean,
   ABFieldList,
   ABFieldTree,
   ABFieldEmail,
   ABFieldFile,
   ABFieldImage,
   ABFieldUser,
   ABFieldConnect,
   ABFieldCalculate,
   ABFieldTextFormula,
   ABFieldFormula,
   ABFieldAutoIndex,
   ABFieldJson,
   ABFieldCombine,
   ABFieldSelectivity,
];

AllFieldClasses.forEach((FIELD) => {
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
            `ABFieldManager.newField(): Unknown Field Key [${values.name}][${values.key}] for object[${object.name}]`,
         );
         //// TODO: what to do here?
      }
   }
}
