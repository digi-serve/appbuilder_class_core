/*
 * ABFactoryCore
 * an object that contains the definitions and references for a single tenant.
 * It is expected that an instance of this should be returned from an
 * ABBootstrap.init(req).then((AB)=>{}) call.
 */

// const _ = require("lodash");
// const uuidv4 = require("uuid");

// const ABApplication = require("../platform/ABApplication");
import ABApplication from "../platform/ABApplication";

import ABApplicationMobile from "../platform/ABApplicationMobile";

// const ABDefinition = require("../platform/ABDefinition");
import ABDefinition from "../platform/ABDefinition";

// const ABComponent = require("../platform/ABComponent");
import ABComponent from "../platform/ABComponent";

// const ABFieldManager = require("./ABFieldManager");
import ABFieldManager from "./ABFieldManager";

// const ABIndex = require("../platform/ABIndex");
import ABIndex from "../platform/ABIndex";

// const ABObject = require("../platform/ABObject");
import ABObject from "../platform/ABObject";

// const ABObjectExternal = require("../platform/ABObjectExternal");
import ABObjectExternal from "../platform/ABObjectExternal";
// const ABObjectImport = require("../platform/ABObjectImport");
import ABObjectImport from "../platform/ABObjectImport";
// const ABObjectApi = require("../platform/ABObjectApi");
import ABObjectApi from "../platform/ABObjectApi";
// const ABDataCollection = require("../platform/ABDataCollection");
import ABDataCollection from "../platform/ABDataCollection";
// const ABObjectQuery = require("../platform/ABObjectQuery");
import ABObjectQuery from "../platform/ABObjectQuery";

// const ABHint = require("../platform/ABHint");
import ABHint from "../platform/ABHint";

// const ABProcess = require("../platform/ABProcess");
import ABProcess from "../platform/ABProcess";

// const ABProcessParticipant = require("../platform/process/ABProcessParticipant");
import ABProcessParticipant from "../platform/process/ABProcessParticipant";

// const ABProcessLane = require("../platform/process/ABProcessLane");
import ABProcessLane from "../platform/process/ABProcessLane";

// const ABProcessTaskManager = require("./process/ABProcessTaskManager");
import ABProcessTaskManager from "./process/ABProcessTaskManager";

// const ABStep = require("../platform/ABStep");
import ABStep from "../platform/ABStep";

// const ABViewDetailItem = require("../platform/views/ABViewDetailItem");
import ABViewDetailItem from "../platform/views/ABViewDetailItem";

// const ABViewFormItem = require("../platform/views/ABViewFormItem");
import ABViewFormItem from "../platform/views/ABViewFormItem";

// const ABMobileViewFormItem = require("../platform/mobile/ABMobileViewFormItem");
import ABMobileViewFormItem from "../platform/mobile/ABMobileViewFormItem";

// const ABObjectWorkspaceViewGrid = require("../platform/workspaceViews/ABObjectWorkspaceViewGrid");
// const ABObjectWorkspaceViewKanban = require("../platform/workspaceViews/ABObjectWorkspaceViewKanban");
// const ABObjectWorkspaceViewGantt = require("../platform/workspaceViews/ABObjectWorkspaceViewGantt");

// const RowFilter = require("../platform/RowFilter");
import RowFilter from "../platform/RowFilter";

// const FilterComplex = require("../platform/FilterComplex");
import FilterComplex from "../platform/FilterComplex";

// const ABMLClass = require("../platform/ABMLClass");
import ABMLClass from "../platform/ABMLClass";

// const EventEmitter = require("../platform/ABEmitter");
import EventEmitter from "../platform/ABEmitter";

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

      this._allHints = [];
      // {array} of all the ABHint(s) in our site.

      this._allProcesses = [];
      // {array} of all the ABProcess(s) in our site.

      this._allQueries = [];
      // {array} of all the ABObjectQuery(s) in our site.

      this._allSteps = [];
      // {array} of all the ABStep(s) in our site.

      this._allDatacollections = [];
      // {array} of all the ABDataCollection(s) in our site.

      //
      // Class References
      //
      this.Class = {
         ABApplication,
         ABComponent,
         ABDefinition,
         ABFieldManager,
         ABIndex,
         ABMLClass,
         ABObject,
         ABObjectExternal,
         ABObjectImport,
         ABObjectApi,
         ABObjectQuery,
         ABProcessParticipant,
         // ABRole      // Do we need this anymore?

         // ABObjectWorkspaceViewGrid,
         // ABObjectWorkspaceViewKanban,
         // ABObjectWorkspaceViewGantt,

         ABProcessTaskManager,

         ABViewDetailItem,
         ABViewFormItem,
         ABMobileViewFormItem,
      };

      //
      // Rules
      // These are a common set of "rules" for all platforms.
      //
      this.rules = {
         /**
          * @method AB.rules.isUUID
          * evaluate a given value to see if it matches the format of a uuid
          * @param {string} key
          * @return {boolean}
          */
         isUUID: function (key) {
            var checker = RegExp(
               "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
               "i"
            );
            return checker.test(key);
         },

         /**
          * @method AB.rules.nameFilter()
          * return a properly formatted name for an AppBuilder object.
          * @param {string} name
          *        The name of the object we are conditioning.
          * @return {string}
          */
         nameFilter: function (name) {
            return String(name).replace(/[^a-z0-9_.]/gi, "");
         },

         /**
          * @method AB.rules.toApplicationNameFormat()
          * return a properly formatted Application Name
          * @param {string} name
          *        The name of the Application we are conditioning.
          * @return {string}
          */
         toApplicationNameFormat: function (name) {
            return "AB_" + this.nameFilter(name);
         },

         /**
          * @method AB.rules.toFieldRelationFormat()
          * This function uses for define relation name of Knex Objection
          * return a relation name of column
          * @param {string} colName
          *        The name of the Column
          * @return {string}
          */
         toFieldRelationFormat: function (colName) {
            return this.nameFilter(colName) + "__relation";
         },

         /**
          * @method AB.rules.toJunctionTableFK()
          * return foriegnkey (FK) column name for a junction table name
          * @param {string} objectName
          *        The name of the Object with a connection
          * @param {string} columnName
          *        The name of the connection columnName.
          * @return {string}
          */
         toJunctionTableFK: function (objectName, columnName) {
            var fkName = objectName + "_" + columnName;

            if (fkName.length > 64) fkName = fkName.substring(0, 64);

            return fkName;
         },

         /**
          * @method AB.rules.toJunctionTableNameFormat()
          * return many-to-many junction table name
          * @param {string} appName
          *        The name of the Application for this object
          * @param {string} sourceTableName
          *        The name of the source object we are conditioning.
          * @param {string} targetTableName
          *        The name of the target object we are conditioning.
          * @param {string} colName
          * @return {string}
          */
         toJunctionTableNameFormat: function (
            appName,
            sourceTableName,
            targetTableName,
            colName
         ) {
            // The maximum length of a table name in MySql is 64 characters
            appName = this.toApplicationNameFormat(appName);
            if (appName.length > 17) appName = appName.substring(0, 17);

            if (sourceTableName.length > 15)
               sourceTableName = sourceTableName.substring(0, 15);

            if (targetTableName.length > 15)
               targetTableName = targetTableName.substring(0, 15);

            colName = this.nameFilter(colName);
            if (colName.length > 14) colName = colName.substring(0, 14);

            return "{appName}_{sourceName}_{targetName}_{colName}"
               .replace("{appName}", appName)
               .replace("{sourceName}", sourceTableName)
               .replace("{targetName}", targetTableName)
               .replace("{colName}", colName);
         },

         /**
          * @method AB.rules.toObjectNameFormat
          * return a properly formatted Object/Table Name
          * @param {string} objectName
          *        The {ABObject}.name of the Object we are conditioning.
          * @return {string}
          */
         toObjectNameFormat: function (objectName) {
            return `AB_${this.nameFilter(objectName)}`;
         },
      };

      // Notify Helpers
      this.notify.builder = (...params) => {
         this.notify("builder", ...params);
      };

      this.notify.developer = (...params) => {
         this.notify("developer", ...params);
      };
   }

   /**
    * @method definitionClean()
    * make sure the provided ABDefinition values are properly formatted
    * @param {ABDefinition} d
    *        The json settings of an ABDefinition object.
    */
   definitionClean(d) {
      if (typeof d.json == "string") {
         try {
            d.json = JSON.parse(d.json);
         } catch (e) {
            console.log(e);
            console.error(` Error on definition id[${d.id}]`);
         }
      }
   }

   init() {
      let allDefinitions = Object.keys(this._definitions).map(
         (k) => this._definitions[k]
      );
      // {array} all our definitions in an Array format.

      // make sure our definitions.json field is an {} and not string
      allDefinitions.forEach((d) => {
         this.definitionClean(d);
      });

      // perform these in order:
      [
         "object",
         "query",
         "datacollection",
         "process",
         "hint",
         "step",
         "application",
      ].forEach((type) => {
         var objTypes = allDefinitions.filter((d) => d.type == type);
         objTypes.forEach((def) => {
            let { keyList, keyFn } = this.objectKeysByDef(def);
            if (keyList) {
               this[keyList].push(this[keyFn](def.json));
            }
         });
      });

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

         case "hint":
            return { keyList: "_allHints", keyFn: "hintNew" };

         case "steps":
            return { keyList: "_allSteps", keyFn: "stepNew" };

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
      // 1st: insert ALL our definitions internally
      defs.forEach((d) => {
         this.definitionClean(d);
         this._definitions[d.id] = d;
      });
      // 2nd: Now we can then go through and signal the "updates"
      // and the related objects can find their dependent definitions.
      defs.forEach((d) => {
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
                  curr.emit("definition.updated", def.json);
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
                  curr.emit("definition.deleted", def.json);

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
      // just in case we got here by mistake:
      if (values.appType == "mobile") {
         return this.applicationMobileNew(values);
      }

      return new ABApplication(values, this);
   }

   /**
    * @method applicationMobileNew()
    * Return a new instance of an ABApplicationMobile object.
    * @param {json} values
    *        the ABDefinition.json of the ABApplicationMobile object we are
    *        creating.
    * @return {ABApplicationMobile}
    */
   applicationMobileNew(values) {
      return new ABApplicationMobile(values, this);
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
    * @method Label()
    * a simple label factory.
    * It is expected to be called like this:
    * @codestart
    *    var L = AB.Label();
    *    var outputText = L("Hello World");
    *    var o2 = L("I'm {0} years old", [5]);
    * @codeend
    * @return {fn}
    */
   Label() {
      return (key, altText, values = []) => {
         var label = key;
         if (altText) {
            if (Array.isArray(altText)) {
               values = altText;
            } else {
               label = altText;
            }
         }

         values.forEach((v, i) => {
            var sub = `{${i}}`;
            label = label.replaceAll(sub, v);
         });

         return label;
      };
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
      else if (values.isAPI == true) newObj = new ABObjectApi(values, this);
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

   objectLanguage() {
      return this.objectByID("d84cd351-d96c-490f-9afb-2a0b880ca0ec");
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

   objectToken() {
      return this.objectByID("08826ac7-4b33-4745-a3d7-f7831ca4ff59");
   }

   objectUser() {
      return this.objectByID("228e3d91-5e42-49ec-b37c-59323ae433a1");
   }

   objectKey() {
      return this.objectByID("d734fe8c-b615-446c-8a5f-793ddece19f9");
   }

   objectSecret() {
      return this.objectByID("db5b3b26-5300-4c92-bc73-8ce4f4696992");
   }

   //
   // Hints
   //
   /**
    * @method hints()
    * return all the ABHints that match the provided filter.
    * @param {fn} fn
    *        A filter function to select specific ABHints.
    *        Must return true to include the entry.
    * @return {array}
    */
   hints(filter = () => true) {
      return (this._allHints || []).filter(filter);
   }

   /**
    * @method hintByID()
    * return the specific hint requested by the provided id.
    * @param {string} ID
    * @return {obj}
    */
   hintID(ID) {
      return this.hints((h) => {
         return h.id == ID || h.name == ID || h.label == ID;
      })[0];
   }

   /**
    * @method hintNew()
    * return an instance of a new (unsaved) ABHint that is tied to this
    * ABApplication.
    * NOTE: this new hint is not included in our this.hints until a .save()
    * is performed on the object.
    * @return {ABHint}
    */
   hintNew(values) {
      var newHint = new ABHint(values, this);

      return newHint;
   }

   //
   // Steps
   //
   /**
    * @method steps()
    * return all the ABSteps that match the provided filter.
    * @param {fn} fn
    *        A filter function to select specific ABSteps.
    *        Must return true to include the entry.
    * @return {array}
    */
   steps(filter = () => true) {
      return (this._allSteps || []).filter(filter);
   }

   /**
    * @method stepByID()
    * return the specific step requested by the provided id.
    * @param {string} ID
    * @return {obj}
    */
   stepID(ID) {
      return this.steps((s) => {
         return s.id == ID || s.name == ID || s.label == ID;
      })[0];
   }

   /**
    * @method stepNew()
    * return an instance of a new (unsaved) ABStep that is tied to this
    * ABApplication.
    * NOTE: this new step is not included in our this.steps until a .save()
    * is performed on the object.
    * @return {ABHint}
    */
   stepNew(id, hintID) {
      var stepDef = this.definitionByID(id);
      if (stepDef) {
         var getStep = new ABStep(stepDef, this);
         return getStep;
      } else {
         var params = {
            settings: {
               hint: hintID,
            },
         };
         var newStep = new ABStep(params, this);
         return newStep;
      }
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

   /**
    * @method filterComplexNew()
    * return an instance of a new FilterComplex that is tied to this
    * ABFactory.
    * @return {FilterComplex}
    */
   filterComplexNew(idBase, options = {}) {
      return new FilterComplex(idBase, this, options);
   }

   /**
    * @method viewNewDetatched()
    * Return an instance of a View that is NOT attached to an ABApplication.
    * @return {ABViewXXX}
    */
   viewNewDetatched(values) {
      if (!this._mockApp) {
         this._mockApp = this.applicationNew({});
      }
      return this._mockApp.viewNew(values, this._mockApp);
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

      if (info) {
         Object.keys(info).forEach((k) => {
            switch (k) {
               case "field":
                  moreInfo.objectID = info[k].object?.id;
                  moreInfo.objectName = info[k].object?.name;
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
      }

      return moreInfo;
   }
}

export default ABFactory;
