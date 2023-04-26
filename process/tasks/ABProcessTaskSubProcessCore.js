const ABProcessElement = require("../../../platform/process/tasks/ABProcessElement.js");

let SubProcessDefaults = {
   category: "task",
   // category: {string} | null
   // if this Element should show up on one of the popup replace menus, then
   // specify one of the categories of elements it should be an option for.
   // Available choices: [ "start", "gateway", "task", "end" ].
   //
   // if it shouldn't show up under the popup menu, then leave this null

   icon: "object-group", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'
   // icon: {string}
   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   instanceValues: [],
   // instanceValues: {array}
   // a list of values this element tracks as it is operating in a process.

   key: "SubProcess",
   // key: {string}
   // unique key to reference this specific Task

   settings: [
      "isEnable",
      "parameterId",
      "connectionAttrs",
      "elementIDs",
      "loopType",
   ],
};

const NOSPAM = {
   /*message : bool */
};
// prevent sending the same message over and over.

module.exports = class SubProcessCore extends ABProcessElement {
   constructor(attributes, process, AB) {
      attributes.type = attributes.type || "process.task.service.subProcess";
      super(attributes, process, AB, SubProcessDefaults);

      // listen
   }

   // return the default values for this DataField
   static defaults() {
      return SubProcessDefaults;
   }

   static DiagramReplace() {
      // taken from "bpmn-js/lib/features/replace/ReplaceOptions"
      return {
         label: "Sub Process",
         actionName: "replace-with-subprocess",
         className: "bpmn-icon-subprocess-expanded",
         target: {
            type: "bpmn:SubProcess",
            isExpanded: true,
         },
      };
   }

   fromValues(attributes) {
      super.fromValues(attributes);

      // Convert string to boolean
      this.isEnable = this.isEnable == null ? true : JSON.parse(this.isEnable);

      let currElements = this._elements || {};
      this._unknownElementIDs = [];
      this._elements = {};
      (attributes.elementIDs || []).forEach((eID) => {
         let ele = this.AB.processElementNew(eID, this);
         if (ele) {
            this._elements[eID] = ele;
         } else {
            // current eID isn't one of our definitions yet, so might be
            // a temporary .diagramID from an unsaved task:
            if (currElements[eID]) {
               this._elements[eID] = currElements[eID];
            } else {
               this._unknownElementIDs.push(eID);
            }
         }
      });

      this._unknownElementIDs.forEach((eID) => {
         let key = `Process[${this.processID}] Task[${this.label}] is referencing an unknown element id:[${eID}]`;
         if (!NOSPAM[key]) {
            let err = new Error(key);
            this.AB.notify.builder(err, { processTask: this.id, eID });
            NOSPAM[key] = true;
         }
      });

      this._connections = attributes.connectionAttrs || {};
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
   toObj() {
      let data = super.toObj();

      data.elementIDs = [];
      for (let e in this._elements) {
         data.elementIDs.push(this._elements[e].id);
      }

      data.connectionAttrs = this._connections;

      return data;
   }

   /**
    * @method processDataFields()
    * return an array of avaiable data fields that this element
    * can provide to other ProcessElements.
    * Different Process Elements can make data available to other
    * process Elements.
    * @param {ABProcessElement} currElement
    *        the ABProcessElement that is requesting the data.
    * @return {array} | null
    */
   processDataFields(currElement) {
      if (this.parameterId == null) return [];

      // only call processDataFields once, filter it to get the different queries
      let dataFieldsAll = this.process.processDataFields(this) || [];

      // get the subtask data
      let dataFieldOpt = dataFieldsAll.filter(
         (opt) => opt.key === this.parameterId
      )[0];

      // get data from insert tasks
      let dataFieldsAllInserted = dataFieldsAll.filter(
         (opt) => opt.field === "InsertedRecord"
      );

      if (dataFieldOpt == null) return [];

      let result = [];

      // Connect field type
      if (
         dataFieldOpt.field &&
         dataFieldOpt.field.key == "connectObject" &&
         dataFieldOpt.field.datasourceLink &&
         dataFieldOpt.field.datasourceLink.fields
      ) {
         result.push({
            key: `${this.id}.uuid`,
            label: `${this.label}->Repeat Data.ID`,
            object: dataFieldOpt.field.datasourceLink,
         });

         dataFieldOpt.field.datasourceLink.fields().forEach((f) => {
            result.push({
               key: `${this.id}.${f.id}`,
               label: `${this.label}->Repeat Data.${f.label}`,
               field: f,
               object: f.object,
            });
         });
      }
      // Other field types
      else {
         result.push({
            key: dataFieldOpt.field
               ? `${this.id}.${dataFieldOpt.field.id}`
               : `${this.id}.subProcess`,
            label: `${this.label}->Repeat Data`,
            field: dataFieldOpt.field,
            object: dataFieldOpt.object,
         });
      }

      dataFieldsAllInserted.forEach((opt) => {
         result.push({
            key: `${opt.key || opt.id}`,
            label: `Parent Process Data->${opt.label}`,
            field: opt.field,
            object: opt.object,
         });
      });

      // Get any tasks that exist inside the subprocess
      let previousFields = this.process.processDataFields.call(
         this,
         currElement
      );
      if (previousFields && previousFields.length > 0) {
         result = result.concat(previousFields);
      }

      return result;
   }

   /**
    * @method processData()
    * return an array of avaiable ABObjects that are represented
    * by the data previous ProcessElements are working with.
    * @param {ABProcessElement} currElement
    *        the ABProcessElement that is requesting the data.
    * @return {array} | null
    */
   processData(currElement, params) {
      let instance = params[0];
      let key = params[1];
      let data;

      if (instance && key?.startsWith?.(this.id)) {
         let fieldId = key.split(".")[1];
         let myState = this.myState(instance);
         let stateData = myState ? myState.data : null;
         data = stateData;

         if (stateData && fieldId) {
            let dataFieldOpt = (
               this.process.processDataFields(this) || []
            ).filter((opt) => opt.key == this.parameterId)[0];

            if (dataFieldOpt?.field?.key == "connectObject") {
               if (!Array.isArray(stateData)) stateData = [stateData];

               // Extract data
               data = stateData.map((item) => {
                  if (fieldId == "uuid" || fieldId == "id") {
                     return item.uuid || item.id;
                  } else if (dataFieldOpt.field.datasourceLink) {
                     let returnField = dataFieldOpt.field.datasourceLink.fields(
                        (f) => f.id == fieldId
                     )[0];
                     if (returnField) return item[returnField.columnName];
                     else return item;
                  }
               });
            }
         }
      }

      if (data == null)
         data = this.process.processData.call(this, currElement, params);

      if (data == null) data = this.process.processData(this, params);

      return data;
   }

   allPreviousTasks(...params) {
      return this.process.allPreviousTasks.call(this, ...params);
   }

   allPreviousConnectionsForElement(...params) {
      return this.process.allPreviousConnectionsForElement.call(
         this,
         ...params
      );
   }

   allPreviousConnectionsForConnection(...params) {
      return this.process.allPreviousConnectionsForConnection.call(
         this,
         ...params
      );
   }

   //
   // Diagram Elements
   //

   /**
    * @method connections()
    * return an array of connections that describe the relationships between
    * our process elements.
    * @param {fn} fn an iterator that returns true if the provided element
    *                should be returned.
    * @return [{SimpleConnectionObj}]
    */
   connections(fn) {
      return this.process.connections.call(this, fn);
   }

   /**
    * @method connectionForDiagramID()
    * return the connection for the given diagram id
    * @param {string} dID
    *        the bpmn:Element diagram id
    */
   connectionForDiagramID(dID) {
      if (!dID) return;

      return this.process.connectionForDiagramID.call(this, dID);
   }

   /**
    * @method connectionsIncoming()
    * return the connections that are entering this Element
    * @param {string} dID
    *        the bpmn:Element diagram id
    */
   connectionsIncoming(dID) {
      if (!dID) return;

      return this.process.connectionsIncoming.call(this, dID);
   }

   /**
    * @method connectionsOutgoing()
    * return the connections that are leaving this Element
    * @param {string} dID
    *        the bpmn:Element diagram id
    */
   connectionsOutgoing(dID) {
      if (!dID) return;

      return this.process.connectionsOutgoing.call(this, dID);
   }

   /**
    * @method connectionRemove()
    * remove the connection info for the given bpmn:element
    * @param {BMPNDiagramOBJ} element
    *        the {element} returned from the BPMN.io modeling library event.
    */
   connectionRemove(element) {
      if (!element) return;

      this.process.connectionRemove.call(this, element);
   }

   /**
    * @method connectionSimplyElement()
    * given a BPMN diagram element, return a simplified object that describes
    * the connection between two elements.
    * @param {BMPNDiagramOBJ} element
    *        the {element} returned from the BPMN.io modeling library event.
    * @return {SimpleConnectionObj}
    *        .id : {string} diagram id of the connection element
    *        .type : {string} the type of connection
    *        .from : {string} the diagram id of the source element
    *        .to : {string} the diagram id of the dest element
    */
   connectionSimplyElement(element) {
      if (!element) return;

      return this.process.connectionSimplyElement.call(this, element);
   }

   /**
    * @method connectionUpsert()
    * add or update the connection information for the given bpmn:element
    * @param {BMPNDiagramOBJ} element
    *        the {element} returned from the BPMN.io modeling library event.
    */
   connectionUpsert(element) {
      if (!element) return;

      this.process.connectionUpsert.call(this, element);
   }

   /**
    * @method connectionPreviousTask()
    * return the ABProcessElement(s) that was a previous Element
    * (eg connects to) this element.
    * @param {ABProcessElement} currElement
    * @return {array}
    */
   connectionPreviousTask(currElement) {
      if (!currElement) return;

      return this.process.connectionPreviousTask.call(this, currElement);
   }

   /**
    * @method elements()
    * return an array of elements that match the given filter (or all elements
    * if no filter is provided).
    * @param {fn} fn an iterator that returns true if the provided element
    *                should be returned.
    * @return {[ABProcessTask, ABProcessParticipant, etc...]}
    */
   elements(fn = () => true) {
      return this.process.elements.call(this, fn);
   }

   /**
    * @method elementAdd()
    * insert an element to be tracked by this process.
    * @param {ABProcessElement} element
    *        the full instance of an ABProcessElement to track.
    */
   elementAdd(element) {
      if (!element) return;

      this.process.elementAdd.call(this, element);
   }

   /**
    * @method elementForDiagramID()
    * return the object that is tied to the given xml diagram ID.
    * @param {string} dID the diagram ID
    * @return {ABProcess[OBJ]}
    */
   elementForDiagramID(dID) {
      if (!dID) return null;

      return this.process.elementForDiagramID.call(this, dID);
   }

   /**
    * @method elementRemove()
    * remove an element from being tracked by this process.
    * @param {obj|ABProcessElement} def
    *        a definition of, or full Object instance of the ABProcessElement
    *        to remove.
    */
   elementRemove(def) {
      if (!def) return;

      this.process.elementRemove.call(this, def);
   }
};
