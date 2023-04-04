const ABProcessElement = require("../../../platform/process/tasks/ABProcessElement.js");

let InsertRecordDefaults = {
   category: null,
   // category: {string} | null
   // if this Element should show up on one of the popup replace menus, then
   // specify one of the categories of elements it should be an option for.
   // Available choices: [ "start", "gateway", "task", "end" ].
   //
   // if it shouldn't show up under the popup menu, then leave this null

   icon: "plus-circle", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'
   // icon: {string}
   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   instanceValues: [],
   // instanceValues: {array}
   // a list of values this element tracks as it is operating in a process.

   key: "InsertRecord",
   // key: {string}
   // unique key to reference this specific Task

   settings: [
      "objectID",
      "fieldValues",
      "isRepeat",
      "repeatMode",
      "repeatColumn",
   ],
};

module.exports = class InsertRecordCore extends ABProcessElement {
   constructor(attributes, process, AB) {
      attributes.type = attributes.type || "process.task.service.insertRecord";
      super(attributes, process, AB, InsertRecordDefaults);

      // listen
   }

   // return the default values for this DataField
   static defaults() {
      return InsertRecordDefaults;
   }

   static DiagramReplace() {
      return null;
   }

   fromValues(attributes) {
      super.fromValues(attributes);

      this.isRepeat = JSON.parse(attributes.isRepeat || false);
   }

   get startElement() {
      let startElem = null;
      let currProcess = this.process;

      // Find the start (trigger) task
      while (!startElem && currProcess) {
         startElem = currProcess.elements(
            (elem) => elem?.defaults?.category == "start"
         )[0];

         // If .currProcess is a sub task, then go to the parent process for get the start task
         currProcess = currProcess.process;
      }

      return startElem;
   }

   get previousElement() {
      return this.process.connectionPreviousTask(this)[0];
   }

   get objectOfStartElement() {
      let startElem = this.startElement;
      if (!startElem) return null;

      let startElemObj = this.AB.objectByID(startElem.objectID);
      return startElemObj;
   }

   get objectOfPrevElement() {
      let prevElem = this.previousElement;
      if (!prevElem) return null;

      let objectID;
      switch (prevElem.type) {
         case "process.task.service.query":
            objectID = prevElem.qlObj ? prevElem.qlObj.objectID : null;
            break;
         case "process.task.service.insertRecord":
         default:
            objectID = prevElem.objectID;
            break;
      }

      return this.AB.objectByID(objectID);
   }

   get fieldRepeat() {
      let obj = this.objectOfStartElement;
      if (!obj) return null;

      return obj.fields((f) => f.id == this.repeatColumn)[0];
   }

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABApplication instance
    * into the values needed for saving to the DB.
    *
    * Most of the instance data is stored in .json field, so be sure to
    * update that from all the current values of our child fields.
    *
    * @return {json}
    */
   /*
     toObj() {
         var data = super.toObj();
 
         AccountingBatchProcessingDefaults.settings.forEach((f) => {
             data[f] = this[f];
         });
 
         return data;
     }
     */

   ////
   //// Process Instance Methods
   ////
};
