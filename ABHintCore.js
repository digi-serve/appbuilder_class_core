// import ABApplication from "./ABApplication"

var ABMLClass = require("../platform/ABMLClass");
const _concat = require("lodash/concat");

module.exports = class ABHintCore extends ABMLClass {
   constructor(attributes, AB) {
      super(["name", "description"], AB);

      this.fromValues(attributes);

      // indicate we are ready.
      // this.elements().forEach((e) => {
      //    e.onProcessReady();
      // });
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
      description: 'description',
      type: 'hint',
      settings: {
         active: {boolean},
         view: uuid
      }
    }
    */

      let active = attributes?.settings?.active ?? "1";

      this.id = attributes?.id || "";
      this.name = attributes?.name || "New Tutorial";
      this.description = attributes?.description || "";
      this.type = attributes?.type || "hint";
      this.settings = {};
      this.settings.active = active;
      this.settings.transition = attributes?.settings?.transition;
      this.settings.showIntroStep = attributes?.settings?.showIntroStep;
      this.settings.view = attributes?.settings?.view || "";
      this.stepIDs = attributes?.stepIDs || [];

      let currSteps = this?._steps || {};
      this._steps = {};
      (attributes?.stepIDs || []).forEach((sID) => {
         if (!sID) return;
         var ele = this.AB.stepNew(sID, this.id);
         if (ele) {
            this._steps[sID] = ele;
         }
      });
      if (attributes) super.fromValues(attributes); // perform translation on this object.
      // NOTE: keep this at the end of .fromValues();

      if (!this.label) {
         this.label = this.name;
      }
   }

   /**
    * @method toObj()
    * properly compile the current state of this ABProcess instance
    * into the values needed for saving to the DB.
    * @return {json}
    */
   toObj() {
      // default label value
      if (!this.label) {
         this.label = this.name;
      }

      // OP.Multilingual.unTranslate(this, this, ["label"]);
      var data = super.toObj();

      var fieldsToSave = ["type", "settings", "stepIDs", "id", "name"];
      fieldsToSave.forEach((f) => {
         data[f] = this[f];
      });

      return data;
   }

   /**
    * steps()
    * return an array of steps that match the given filter (or all steps
    * if no filter is provided).
    * @param {fn} fn an iterator that returns true if the provided element
    *                should be returned.
    * @return {[ABStep]}
    */
   steps(fn = () => true) {
      var allSteps = Object.keys(this._steps).map((e) => {
         return this._steps[e];
      });
      return allSteps.filter(fn);
   }

   /**
    * stepAdd()
    * insert a step to be added to this hint.
    * @param {ABStep} element
    *        the full instance of an ABStep to track.
    */
   stepAdd(step) {
      this._steps[step.id] = step;
   }

   /**
    * stepByID()
    * return the {ABStep} that has the given .id
    * @param {string} id
    * @return {ABStep[OBJ]}
    */
   stepByID(id) {
      return this._steps[id] ?? null;
   }

   /**
    * stepRemove()
    * remove a step from being displayed by this hint.
    * @param {id} ABStep ID
    *        an ID of a step
    *        to remove.
    */
   stepRemove(id) {
      // remove from stepIDs array
      let stepIndex = this.stepIDs.indexOf(id);
      if (stepIndex > -1) {
         this.stepIDs.splice(stepIndex, 1);
      }
      // remove from _steps definitions
      delete this._steps[id];
   }
};
