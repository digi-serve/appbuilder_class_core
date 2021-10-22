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
         ABApplication,
         ABComponent,
         ABDefinition,
         ABObject,
         ABObjectExternal,
         ABObjectImport,
         ABObjectQuery,
         ABProcessParticipant,
         // ABRole      // Do we need this anymore?
      };

      // Notify Helpers
      this.notify.builder = (...params) => {
         this.notify("builder", ...params);
      };

      this.notify.developer = (...params) => {
         this.notify("developer", ...params);
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
               console.error(` Error on definition id[${d.id}]`);
            }
         }
      });

      // perform these in order:
      ["object", "query", "datacollection", "process", "application"].forEach(
         (type) => {
            var objTypes = allDefinitions.filter((d) => d.type == type);
            objTypes.forEach((def) => {
               let { keyList, keyFn } = this.objectKeysByDef(def);
               if (keyList) {
                  this[keyList].push(this[keyFn](def.json));
               }
            });
         }
      );

      this.emit("init.objects_ready");
      return Promise.resolve();
   }

   /**
    * @method objectKeysByDef()
    * Analyze the provided ABDefinition json and return which set of list and
    * functions are used to create a new instance of this definition.
    * @param {json} def
    *        the ABDefinition json of the definition we are evaluating
    * @return { keyList, keyFn }
    *        keyList: {string}  which of our internal lists to store this new
    *                 object.
    *        keyFn: {string} which of our methods to call with the def.json
    *               as the param that will create the new object.
    *
    *        ex:  this[keyList].push( this[keyFn](def.json));
    *
    *        if this def is not one of the types we track,
    *        keyList = keyFn = null;
    */
   objectKeysByDef(def) {
      switch (def.type) {
         case "application":
            return { keyList: "_allApplications", keyFn: "applicationNew" };

         case "datacollection":
            return {
               keyList: "_allDatacollections",
               keyFn: "datacollectionNew",
            };

         case "object":
            return { keyList: "_allObjects", keyFn: "objectNew" };

         case "process":
            return { keyList: "_allProcesses", keyFn: "processNew" };

         case "query":
            return { keyList: "_allQueries", keyFn: "queryNew" };

         default:
            // we don't manage any other
            return { keyList: null, keyFn: null };
      }
   }

   //
   // Definitions
   //

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

   /**
    * definitionsParse()
    * include the incoming definitions into our ABFactory. These new
    * definitions will replace any existing ones with the same .id.
    * @param {array[ABDefinitioin]} defs
    *     the incoming array of ABDefinitions to parse.
    * @return {Promise}
    */
   definitionsParse(defs = []) {
      if (!Array.isArray(defs)) {
         defs = [defs];
      }

      // store/replace the incoming definitions
      defs.forEach((d) => {
         this._definitions[d.id] = d;
         this.definitionSync("updated", d.id, d);
      });

      return Promise.resolve();
   }

   /**
    * definitionSync()
    * Synchronize an individual definition into our repository of definitions.
    * @param {string} op
    *        the type of synchronization this is
    *        [ "created", "updated", "destroyed"]
    * @param {uuid} id
    *        the definition.id of the definition we are synchronizing
    * @param {json} def
    *        the ABDefinition attributes we are storing.
    */
   definitionSync(op, id, def) {
      var { keyList, keyFn } = this.objectKeysByDef(def);
      if (keyList) {
         var curr;
         switch (op) {
            case "created":
               this[keyList].push(this[keyFn](def.json));
               this.emit("definition.created", def.json);
               break;

            case "updated":
               // get the current object
               curr = this[keyList].find((d) => d.id == id);

               // remove from list
               this[keyList] = this[keyList].filter((d) => d.id != id);
               // add new one:
               this[keyList].push(this[keyFn](def.json));

               // signal this object needs to be updated:
               // NOTE: if this is one of the objects we are tracking,
               // we don't need to this.emit() the message.
               if (curr) {
                  curr?.emit?.("definition.updated", def.json);
               } else {
                  this.emit("definition.updated", def.json);
               }
               break;

            case "destroyed":
               // get the current object
               curr = this[keyList].find((d) => d.id == id);
               if (curr) {
                  // remove from list
                  this[keyList] = this[keyList].filter((d) => d.id != id);

                  // signal this object needs to be updated:
                  curr?.emit?.("definition.deleted", def.json);

                  this.emit("definition.deleted", def.json);
               }
               break;
         }
      }
   }

   //
   // ABObjects
   //
   /**
    * @method applications()
    * return all the ABApplications that match the provided filter.
    * @param {fn} fn
    *        A filter function to select specific ABApplications.
    *        Must return true to include the entry.
    * @return {array}
    */
   applications(fn = () => true) {
      return (this._allApplications || []).filter(fn);
   }

   /**
    * @method applicationByID()
    * returns a single ABApplication that matches the given ID.
    * @param {string} ID
    *        the .id/.name/.label of the ABApplication we are searching
    *        for.
    * @return {ABApplication}
    *        the matching ABApplication object if found
    *        {null} if not found.
    */
   applicationByID(ID) {
      return this.applications((a) => a.id == ID)[0];
   }

   /**
    * @method applicationNew()
    * Return a new instance of an ABApplication object.
    * @param {json} values
    *        the ABDefinition.json of the ABApplication object we are
    *        creating.
    * @return {ABApplication}
    */
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

   objectFile() {
      return this.objectByID("4a9d89c9-f4eb-41af-91e4-909eff389f3e");
   }

   objectProcessForm() {
      return this.objectByID("d36ae4c8-edef-48d8-bd9c-79a0edcaa067");
   }

   objectProcessInstance() {
      return this.objectByID("2ba85be0-78db-4eda-ba43-c2c4e3831849");
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

   //
   // Processes
   //
   /**
    * @method processes()
    * return all the ABProcess that match the provided filter.
    * @param {fn} fn
    *        A filter function to select specific ABProcess.
    *        Must return true to include the entry.
    * @return {array}
    */
   processes(filter = () => true) {
      return (this._allProcesses || []).filter(filter);
   }

   /**
    * @method processByID()
    * return the specific process requested by the provided id.
    * @param {string} ID
    * @return {obj}
    */
   processByID(ID) {
      return this.processes((p) => {
         return p.id == ID || p.name == ID || p.label == ID;
      })[0];
   }

   /**
    * @method processNew()
    * Return a new instance of an ABProcess object.
    * @param {json} values
    *        the ABDefinition.json of the ABProcess object we are
    *        creating.
    * @return {ABProcess}
    */
   processNew(values) {
      return new ABProcess(values, this);
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
   // queriesAll() {
   //    console.error(
   //       "ABFactory.queriesAll() Depreciated! Use .queries() instead. "
   //    );
   //    return this.queries();
   // }

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
      if (App) {
         console.error("!! Who is calling this with an App?");
      }
      return new RowFilter(App || this._App, idBase, this);
   }

   //
   // Utilities
   //

   /**
    * notify()
    * will send alerts to a group of people. These alerts are usually about
    * configuration errors, or software problems.
    * @param {string} domain
    *     which group of people we are sending a notification to.
    * @param {Error} error
    *     An error object generated at the point of issue.
    * @param {json} info
    *     Additional related information concerning the issue.
    */
   notify(/* ...params */) {
      console.error(
         "ABFactory.notify() is expected to be overwritten by the platform!"
      );
   }

   /**
    * notifyInfo()
    * a common routine to parse the info parameter provided to .notify() into
    * a more detailed set of data.
    * @param {json} info
    * @return {json}
    */
   _notifyInfo(info) {
      var moreInfo = {};

      Object.keys(info).forEach((k) => {
         switch (k) {
            case "field":
               moreInfo.objectID = info[k].object.id;
               moreInfo.objectName = info[k].object.name;
               moreInfo.fieldID = info[k].id;
               moreInfo.fieldName = info[k].label || info[k].name;
               break;

            case "object":
               moreInfo.objectID = info[k].id;
               moreInfo.objectName = info[k].name;
               break;

            case "datacollection":
               moreInfo.datacollectionID = info[k].id;
               moreInfo.datacollectionName = info[k].label || info[k].name;
               var ds = info[k].datasource;
               if (ds) {
                  moreInfo.datacollectionDSID = ds.id;
                  moreInfo.datacollectionDSName = ds.name;
               }
               break;

            case "process":
               moreInfo.processID = info[k].id;
               moreInfo.processName = info[k].label || info[k].name;
               break;

            case "req":
               moreInfo.req = {
                  jobID: info[k].jobID,
                  tenantID: info[k]._tenantID,
                  user: info[k]._user,
               };
               break;

            case "task":
               if (info[k].process) {
                  moreInfo.processID = info[k].process.id;
                  moreInfo.processName =
                     info[k].process.label || info[k].process.name;
               }
               moreInfo.taskID = info[k].id;
               moreInfo.taskName = info[k].label || info[k].name;
               break;

            case "view":
               if (info[k].application) {
                  moreInfo.applicationID = info[k].application.id;
                  moreInfo.applicationName =
                     info[k].application.label || info[k].application.name;
               }
               moreInfo.viewID = info[k].id;
               moreInfo.viewName = info[k].label || info[k].name;
               moreInfo.viewKey = info[k].key;
               break;
            default:
               moreInfo[k] = info[k];
               break;
         }
      });

      return moreInfo;
   }
}

module.exports = ABFactory;
