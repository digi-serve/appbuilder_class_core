/*
 * ABFactoryCore
 * an object that contains the definitions and references for a single tenant.
 * It is expected that an instance of this should be returned from an
 * ABBootstrap.init(req).then((AB)=>{}) call.
 */

// const _ = require("lodash");
// const uuidv4 = require("uuid");

const ABApplication = require("../platform/ABApplication");
const ABDefinition = require("../platform/ABDefinition");

const ABComponent = require("../platform/ABComponent");

const ABFieldManager = require("./ABFieldManager");

const ABIndex = require("../platform/ABIndex");
const ABObject = require("../platform/ABObject");
const ABObjectExternal = require("../platform/ABObjectExternal");
const ABObjectImport = require("../platform/ABObjectImport");
const ABDataCollection = require("../platform/ABDataCollection");
const ABObjectQuery = require("../platform/ABObjectQuery");

const ABProcess = require("../platform/ABProcess");

const ABProcessParticipant = require("../platform/process/ABProcessParticipant");
const ABProcessLane = require("../platform/process/ABProcessLane");
const ABProcessTaskManager = require("./process/ABProcessTaskManager");

const RowFilter = require("../platform/RowFilter");

const EventEmitter = require("../platform/ABEmitter");

class ABFactory extends EventEmitter {
   constructor(definitions) {
      /**
       * @param {hash} definitions
       *        { ABDefinition.id : {ABDefinition} }
       *        of all the definitions defined for the current Tenant
       */

      super();
      this.setMaxListeners(0);

      this._definitions = definitions || {};
      // {hash}  { ABDefinition.id : {ABDefinition} }
      // ensure ._definitions is a HASH{ ID : {ABDefinition}}
      if (Array.isArray(definitions)) {
         var hash = {};
         definitions.forEach((d) => {
            hash[d.id] = d;
         });
         this._definitions = hash;
      }

      //
      //
      // Manage our working objects
      //

      this._allApplications = [];
      // {array} of all the ABApplication(s) in our site.

      this._allObjects = [];
      // {array} of all the ABObject(s) in our site.

      this._allProcesses = [];
      // {array} of all the ABProcess(s) in our site.

      this._allQueries = [];
      // {array} of all the ABObjectQuery(s) in our site.

      this._allDatacollections = [];
      // {array} of all the ABDataCollection(s) in our site.

      //
      // Class References
      //
      this.Class = {
         ABComponent,
         ABDefinition,
         ABObject,
         ABObjectExternal,
         ABObjectImport,
         ABObjectQuery,
         // ABRole      // Do we need this anymore?
      };
   }

   init() {
      let allDefinitions = Object.keys(this._definitions).map(
         (k) => this._definitions[k]
      );
      // {array} all our definitions in an Array format.

      // make sure our definitions.json field is an {} and not string
      allDefinitions.forEach((d) => {
         if (typeof d.json == "string") {
            try {
               d.json = JSON.parse(d.json);
            } catch (e) {
               console.log(e);
            }
         }
      });

      //
      // Prepare our Objects
      //
      let allObjects = allDefinitions.filter((def) => {
         return def.type == "object";
      });
      (allObjects || []).forEach((defObj) => {
         this._allObjects.push(this.objectNew(defObj.json));
      });

      //
      // Prepare our Queries
      //
      let allQueries = allDefinitions.filter((def) => {
         return def.type == "query";
      });
      (allQueries || []).forEach((defQry) => {
         this._allQueries.push(this.queryNew(defQry.json));
      });

      //
      // Prepare our DataCollections
      //
      let allDCs = allDefinitions.filter((def) => {
         return def.type == "datacollection";
      });
      (allDCs || []).forEach((def) => {
         this._allDatacollections.push(this.datacollectionNew(def.json));
      });

      //
      // Prepare our Processes
      //
      let allProcesses = allDefinitions.filter((def) => {
         return def.type == "process";
      });
      (allProcesses || []).forEach((def) => {
         this._allProcesses.push(this.processNew(def.json));
      });

      //
      // Prepare our Applications
      //
      let appDefs = allDefinitions.filter((def) => {
         return def.type == "application";
      });
      appDefs.forEach((app) => {
         this._allApplications.push(this.applicationNew(app.json));
      });

      return Promise.resolve();
   }

   //
   // Definitions
   //
   definition(id) {
      var errDepreciated = new Error(
         "ABFactoryCore.definition() is Depreciated.  Use .definitionByID() instead."
      );
      console.error(errDepreciated);

      return this.definitionByID(id);
   }

   /**
    * definitionByID(id)
    * return an ABDefinition.json value ready for our objects to use.
    * @param {string} id
    *        the uuid of the ABDefinition to delete
    * @param {bool} isRaw
    *        indicates if we want the full ABDefinition, or the .json param
    *        true : returns full ABDefinition value.
    *        false: returns the .json parameter used by most ABObjects.
    * @return {Promise}
    */
   definitionByID(id, isRaw = false) {
      if (this._definitions[id]) {
         if (isRaw) {
            return this._definitions[id];
         } else {
            return this._definitions[id].json;
         }
      }
      return null;
   }

   definitionForID(id, isRaw = false) {
      console.error(
         "ABFactoryCore.definitionForID() depreciated! Use .definitionByID() instead."
      );
      return this.definitionByID(id, isRaw);
   }

   /**
    * definitionNew(values)
    * return an ABDefinition object tied to this Tenant.
    * @param {obj} values
    *        The value hash of the ABDefinition object to create.
    * @return {ABDefinition}
    */
   definitionNew(values) {
      return new ABDefinition(values, this);
   }

   //
   // ABObjects
   //
   applications(fn = () => true) {
      return (this._allApplications || []).filter(fn);
   }

   applicationNew(values) {
      return new ABApplication(values, this);
   }

   /**
    * @method datacollections()
    * return an array of all the ABDataCollection for this ABApplication.
    * @param {fn} filter
    *        a filter fn to return a set of ABDataCollection that
    *        this fn returns true for.
    * @return {array}
    *        array of ABDataCollection
    */
   datacollections(filter = () => true) {
      return (this._allDatacollections || []).filter(filter);
   }

   /**
    * @method datacollectionByID()
    * returns a single ABDatacollection that matches the given ID.
    * @param {string} ID
    *        the .id/.name/.label of the ABDatacollection we are searching
    *        for.
    * @return {ABDatacollection}
    *        the matching ABDatacollection object if found
    *        {null} if not found.
    */
   datacollectionByID(ID) {
      // an undefined or null ID should not match any DC.
      if (!ID) return null;

      return this.datacollections((dc) => {
         return dc.id == ID || dc.name == ID || dc.label == ID;
      })[0];
   }

   /**
    * @method datacollectionNew()
    * create a new instance of ABDataCollection
    * @param {obj} values
    *        the initial values for the DC
    * @return {ABDatacollection}
    */
   datacollectionNew(values) {
      var dc = new ABDataCollection(values, this);
      dc.on("destroyed", () => {
         // make sure it is no longer in our internal list
         this._allDatacollections = this._allDatacollections.filter(
            (d) => d.id != dc.id
         );
      });
      return dc;
   }

   /**
    * @method fieldNew()
    * return an instance of a new (unsaved) ABField that is tied to a given
    * ABObject.
    * NOTE: this new field is not included in our this.fields until a .save()
    * is performed on the field.
    * @param {obj} values  the initial values for this field.
    *                - { key:'{string}'} is required
    * @param {ABObject} object  the parent object this field belongs to.
    * @return {ABField}
    */
   fieldNew(values, object) {
      // NOTE: ABFieldManager returns the proper ABFieldXXXX instance.
      return ABFieldManager.newField(values, object);
   }

   /**
    * @method indexNew()
    * return an instance of a new (unsaved) ABIndex.
    * @return {ABIndex}
    */
   indexNew(values, object) {
      return new ABIndex(values, object);
   }

   /**
    * @method objects()
    * return an array of all the ABObjects for this ABApplication.
    * @param {fn} filter
    *        a filter fn to return a set of ABObjects that this fn
    *        returns true for.
    * @return {array}
    *        array of ABObject
    */
   objects(filter = () => true) {
      return (this._allObjects || []).filter(filter);
   }

   /**
    * @method objectByID()
    * return the specific object requested by the provided id.
    * @param {string} ID
    * @return {obj}
    */
   objectByID(ID) {
      return this.objects((o) => {
         return o.id == ID || o.name == ID || o.label == ID;
      })[0];
   }

   /**
    * @method objectNew()
    * return an instance of a new (unsaved) ABObject that is tied to this
    * ABApplication.
    * NOTE: this new object is not included in our this.objects until a .save()
    * is performed on the object.
    * @return {ABObject}
    */
   objectNew(values) {
      var newObj = null;

      if (values.isExternal == true)
         newObj = new ABObjectExternal(values, this);
      else if (values.isImported == true)
         newObj = new ABObjectImport(values, this);
      else newObj = new ABObject(values, this);

      /*
      // IS THIS CORRECT?
      newObj.on("destroyed", () => {
         // make sure it is no longer in our internal list
         this._allObjects = this._allObjects.filter((o) => o.id != newObj.id);
      });
      */

      return newObj;
   }

   objectRole() {
      return this.objectByID("c33692f3-26b7-4af3-a02e-139fb519296d");
   }

   objectScope() {
      return this.objectByID("af10e37c-9b3a-4dc6-a52a-85d52320b659");
   }

   objectUser() {
      return this.objectByID("228e3d91-5e42-49ec-b37c-59323ae433a1");
   }

   processes(filter = () => true) {
      return (this._allProcesses || []).filter(filter);
   }

   processNew(id) {
      var processDef = this.definitionByID(id);
      if (processDef) {
         return new ABProcess(processDef, this);
      }
      return null;
   }

   /**
    * @method processElementNew(id)
    * return an instance of a new ABProcessOBJ that is tied to a given
    * ABProcess.
    * @param {string} id
    *        the ABDefinition.id of the element we are creating
    * @param {ABProcess} process
    *        the process this task is a part of.
    * @return {ABProcessTask}
    */
   processElementNew(id, process) {
      var taskDef = this.definitionByID(id);
      if (taskDef) {
         switch (taskDef.type) {
            case ABProcessParticipant.defaults().type:
               return new ABProcessParticipant(taskDef, process, this);
            // break;

            case ABProcessLane.defaults().type:
               return new ABProcessLane(taskDef, process, this);
            // break;

            default:
               // default to a Task
               return ABProcessTaskManager.newTask(taskDef, process, this);
            // break;
         }
      }
      return null;
   }

   /**
    * @method processElementNewForModelDefinition(def)
    *
    * return an instance of a new ABProcess[OBJ] that is tied to the given
    * BPMI:Element definition.
    *
    * @param {BPMI:Element} element the element definition from our BPMI
    *              modler.
    * @return {ABProcess[OBJ]}
    */
   processElementNewForModelDefinition(element, process) {
      var newElement = null;

      switch (element.type) {
         case "bpmn:Participant":
            newElement = new ABProcessParticipant({}, process, this);
            break;

         case "bpmn:Lane":
            newElement = new ABProcessLane({}, process, this);
            break;

         default:
            var defaultDef = ABProcessTaskManager.definitionForElement(element);
            if (defaultDef) {
               newElement = ABProcessTaskManager.newTask(
                  defaultDef,
                  process,
                  this
               );
            }
            break;
      }

      // now make sure this new Obj pulls any relevant info from the
      // diagram element
      if (newElement) {
         newElement.fromElement(element);
      }
      return newElement;
   }

   /**
    * @method queries()
    * return an array of all the ABObjectQuery(s).
    * @param {fn} filter
    *        a filter fn to return a set of ABObjectQuery(s) that this fn
    *        returns true for.
    * @return {array}
    *        array of ABObjectQuery
    */
   queries(filter = () => true) {
      return (this._allQueries || []).filter(filter);
   }
   queriesAll() {
      console.error(
         "ABFactory.queriesAll() Depreciated! Use .queries() instead. "
      );
      return this.queries();
   }

   /**
    * @method queryByID()
    * return the specific query requested by the provided id.
    * NOTE: this method has been extended to allow .name and .label
    * as possible lookup values.
    * @param {string} ID
    * @return {ABObjectQuery}
    */
   queryByID(ID) {
      return this.queries((q) => {
         return q.id == ID || q.name == ID || q.label == ID;
      })[0];
   }

   /**
    * @method queryNew()
    * return an instance of a new (unsaved) ABObjectQuery that is tied to this
    * ABFactory.
    * @return {ABObjectQuery}
    */
   queryNew(values) {
      return new ABObjectQuery(values, this);
   }

   /**
    * @method rowfilterNew()
    * return an instance of a new RowFilter that is tied to this
    * ABFactory.
    * @return {RowFilter}
    */
   rowfilterNew(App, idBase) {
      return new RowFilter(App, idBase, this);
   }

   //
   // Utilities
   //

   // cloneDeep(value) {
   //    return _.cloneDeep(value);
   // }

   // error(message) {
   //    console.error(`ABFactory[${this.req.tenantID()}]:${message.toString()}`);
   //    if (message instanceof Error) {
   //       console.error(message);
   //    }
   //    this.emit("error", message);
   // }

   // uuid() {
   //    return uuidv4();
   // }
}

module.exports = ABFactory;
