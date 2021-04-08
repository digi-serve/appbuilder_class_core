// import ABApplication from "./ABApplication"

var ABMLClass = require("../platform/ABMLClass");
const _concat = require("lodash/concat");

module.exports = class ABProcessCore extends ABMLClass {
   constructor(attributes, application) {
      super(/* ["label"] */);

      this.application = application;

      this.fromValues(attributes);
   }

   ///
   /// Static Methods
   ///
   /// Available to the Class level object.  These methods are not dependent
   /// on the instance values of the Application.
   ///

   fromValues(attributes) {
      /*
    {
      id: uuid(),
      name: 'name',
      type: 'xxxxx',
      json: "{json}"
    }
    */
      this.id = attributes.id;
      this.name = attributes.name || "";
      this.type = attributes.type || "process";
      this.xmlDefinition = attributes.xmlDefinition || null;

      // this.json = attributes.json || null;
      this._elements = {};
      (attributes.elementIDs || []).forEach((eID) => {
         var ele = this.application.processElementNew(eID, this);
         if (ele) {
            this._elements[eID] = ele;
         }
      });

      this._connections = attributes.connections || {};

      super.fromValues(attributes); // perform translation on this object.
      // NOTE: keep this at the end of .fromValues();

      if (!this.label) {
         this.label = this.name;
      }
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
      // default label value
      if (!this.label) {
         this.label = this.name;
      }

      // OP.Multilingual.unTranslate(this, this, ["label"]);
      var data = super.toObj();

      var fieldsToSave = ["id", "name", "xmlDefinition"];
      fieldsToSave.forEach((f) => {
         data[f] = this[f];
      });

      data.elementIDs = [];
      for (var e in this._elements) {
         data.elementIDs.push(this._elements[e].id);
      }

      data.connections = this._connections;

      // data.participantIDs = [];
      // for (var p in this._participants) {
      //     data.participantIDs.push(this._participants[p].id);
      // }

      return data;
   }

   //
   // XML Model
   //

   /**
    * modelDefinition()
    * return the current xml definition for this process
    * @return {string}
    */
   modelDefinition() {
      return this.xmlDefinition;
   }

   /**
    * modelNew()
    * initialze our xml definition to a new state.
    * @return {string}
    */
   modelNew() {
      this.xmlDefinition = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd" id="process-def-${this.id}" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="true">
    <bpmn2:startEvent id="StartEvent_1"/>
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

      //// TODO: create a default Start Task here??
   }

   /**
    * modelUpdate()
    * update our xml definition from the provided description.
    * @param {string} xml  bpmn2 xml definition from our modeler.
    * @return {string}
    */
   modelUpdate(xml) {
      this.xmlDefinition = xml;
   }

   //
   // Diagram Elements
   //

   /**
    * connections()
    * return an array of connections that describe the relationships between
    * our process elements.
    * @param {fn} fn an iterator that returns true if the provided element
    *                should be returned.
    * @return [{SimpleConnectionObj}]
    */
   connections(fn) {
      if (!fn)
         fn = () => {
            return true;
         };
      var allConnections = Object.keys(this._connections).map((e) => {
         return this._connections[e];
      });
      return allConnections.filter(fn);
   }

   /**
    * connectionForDiagramID()
    * return the connection for the given diagram id
    * @param {string} dID
    *        the bpmn:Element diagram id
    */
   connectionForDiagramID(dID) {
      return this.connections((t) => {
         return t.id == dID;
      })[0];
   }

   /**
    * connectionsIncoming()
    * return the connections that are entering this Element
    * @param {string} dID
    *        the bpmn:Element diagram id
    */
   connectionsIncoming(dID) {
      return this.connections((c) => {
         return c.to == dID;
      });
   }

   /**
    * connectionsOutgoing()
    * return the connections that are leaving this Element
    * @param {string} dID
    *        the bpmn:Element diagram id
    */
   connectionsOutgoing(dID) {
      return this.connections((c) => {
         return c.from == dID;
      });
   }

   /**
    * connectionRemove()
    * remove the connection info for the given bpmn:element
    * @param {BMPNDiagramOBJ} element
    *        the {element} returned from the BPMN.io modeling library event.
    */
   connectionRemove(element) {
      delete this._connections[element.id];
   }

   /**
    * connectionSimplyElement()
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
      var bo = element.businessObject;
      var from = null;
      if (bo.sourceRef) {
         from = bo.sourceRef.id;
      }

      var to = null;
      if (bo.targetRef) {
         to = bo.targetRef.id;
      }

      var connection = {
         id: element.id,
         type: element.type,
         from: from,
         to: to
      };
      return connection;
   }

   /**
    * connectionUpsert()
    * add or update the connection information for the given bpmn:element
    * @param {BMPNDiagramOBJ} element
    *        the {element} returned from the BPMN.io modeling library event.
    */
   connectionUpsert(element) {
      var simpleConn = this.connectionSimplyElement(element);
      if (simpleConn.from && simpleConn.to) {
         this._connections[simpleConn.id] = simpleConn;
      } else {
         // this connection is no longer connecting anything thing.
         // it is being removed.
         this.connectionRemove(element);
      }
   }

   /**
    * elements()
    * return an array of elements that match the given filter (or all elements
    * if no filter is provided).
    * @param {fn} fn an iterator that returns true if the provided element
    *                should be returned.
    * @return {Array<ABProcessTask | ABProcessParticipant>}
    */
   elements(fn = () => true) {
      var allElements = Object.keys(this._elements).map((e) => {
         return this._elements[e];
      });
      return allElements.filter(fn);
   }

   /**
    * elementAdd()
    * insert an element to be tracked by this process.
    * @param {ABProcessElement} element
    *        the full instance of an ABProcessElement to track.
    */
   elementAdd(element) {
      this._elements[element.id || element.diagramID] = element;
   }

   /**
    * elementForDiagramID()
    * return the object that is tied to the given xml diagram ID.
    * @param {string} dID the diagram ID
    * @return {obj} ABProcess[OBJ]
    */
   elementForDiagramID(dID) {
      return this.elements((t) => {
         return t.diagramID == dID;
      })[0];
   }

   /**
    * elementRemove()
    * remove an element from being tracked by this process.
    * @param {obj|ABProcessElement} def
    *        a definition of, or full Object instance of the ABProcessElement
    *        to remove.
    */
   elementRemove(def) {
      delete this._elements[def.id || def.diagramID];
   }

   /**
    * isTriggeredBy()
    * scan our tasks and see if we have a "trigger" task that responds to
    * the provided key.
    * @param {string} key the trigger key
    * @return {bool}
    */
   isTriggeredBy(key) {
      return this.taskForTriggerKey(key) != null;
   }

   /**
    * connectionPreviousTask()
    * return the ABProcessElement(s) that was a previous Element
    * (eg connects to) this element.
    * @param {ABProcessElement} currElement
    * @return {array}
    */
   connectionPreviousTask(currElement) {
      var elements = [];
      var prevConnections = this.connections((c) => {
         return c.to == currElement.diagramID;
      });
      prevConnections.forEach((c) => {
         var element = this.elements((e) => {
            return e.diagramID == c.from;
         })[0];
         if (element) {
            elements.push(element);
         }
      });
      return elements;
   }

   /**
    * processData()
    * return an array of avaiable ABObjects that are represented
    * by the data previous ProcessElements are working with.
    * @param {ABProcessElement} currElement
    *        the ABProcessElement that is requesting the data.
    * @return {array} | null
    */
   processData(currElement, params) {
      var tasksToAsk = this.connectionPreviousTask(currElement);
      var values = queryPreviousTasks(tasksToAsk, "processData", params, this);
      return values.length > 0
         ? values.length > 1
            ? values
            : values[0]
         : null;
   }

   /**
    * processDataFields()
    * return an array of avaiable data fields that this element
    * can request from other ProcessElements.
    * Different Process Elements can make data available to other
    * process Elements.
    * @param {ABProcessElement} currElement
    *        the ABProcessElement that is requesting the data.
    * @return {array} | null
    */
   processDataFields(currElement) {
      var tasksToAsk = this.connectionPreviousTask(currElement);
      var fields = queryPreviousTasks(
         tasksToAsk,
         "processDataFields",
         null,
         this
      );
      return fields.length > 0 ? fields : null;
   }

   /**
    * processDataObjects()
    * return an array of avaiable ABObjects that are represented
    * by the data previous ProcessElements are working with.
    * @param {ABProcessElement} currElement
    *        the ABProcessElement that is requesting the data.
    * @return {array} | null
    */
   processDataObjects(currElement) {
      var tasksToAsk = this.connectionPreviousTask(currElement);
      var fields = queryPreviousTasks(
         tasksToAsk,
         "processDataObjects",
         null,
         this
      );
      return fields.length > 0 ? fields : null;
   }

   /**
    * taskForTriggerKey()
    * return one or more tasks that respond to the given trigger key
    * @param {string} key a trigger key
    * @return {ABProcessTask[]}
    */
   taskForTriggerKey(key) {
      var trigger = this.elements((t) => {
         return t.triggerKey == key;
      })[0];
      if (trigger) {
         return trigger;
      } else {
         return null;
      }
   }

   //
   // Participants
   //

   // /**
   //  * participants()
   //  * return an array of participants that match the given filter (or all tasks
   //  * if no filter is provided).
   //  * @param {fn} fn an iterator that returns true if the provided participants
   //  *                should be returned.
   //  * @return {[ABProcessParticipant,...]}
   //  */
   // participants(fn) {
   //     if (!fn)
   //         fn = () => {
   //             return true;
   //         };
   //     var all = Object.keys(this._participants).map((p) => {
   //         return this._participants[p];
   //     });
   //     return all.filter(fn);
   // }

   // /**
   //  * participantsForDiagramID()
   //  * return the participant(s) that are tied to the given xml diagram ID.
   //  * @param {string} dID the diagram ID
   //  * @return {[ABProcessParticipant,...]}
   //  */
   // participantsForDiagramID(dID) {
   //     return this.participants((p) => {
   //         return p.diagramID == dID;
   //     });
   // }
};

var queryPreviousTasks = (
   list,
   method,
   param,
   process,
   responses,
   processedIDs
) => {
   // recursive fn() to step through our graph and compile
   // results.
   if (typeof responses == "undefined") {
      responses = [];
   }
   if (typeof processedIDs == "undefined") {
      processedIDs = [];
   }
   if (list.length == 0) {
      return responses;
   } else {
      // get next task
      var task = list.shift();

      // if we haven't already done task:
      if (processedIDs.indexOf(task.diagramID) == -1) {
         // mark this task as having been processed
         processedIDs.push(task.diagramID);

         // get any field's it provides
         var value = task[method].apply(task, param);
         if (value === null) value = [];
         responses = _concat(responses, value);

         // add any previous tasks to our list
         list = _concat(list, process.connectionPreviousTask(task));
      }

      // process next Task
      return queryPreviousTasks(
         list,
         method,
         param,
         process,
         responses,
         processedIDs
      );
   }
};
