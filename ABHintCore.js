// import ABApplication from "./ABApplication"

var ABMLClass = require("../platform/ABMLClass");
const _concat = require("lodash/concat");

module.exports = class ABHintCore extends ABMLClass {
   constructor(attributes, AB) {
      super(["label", "description"], AB);

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
      type: 'xxxxx',
      json: "{json}"
    }
    */
      this.id = attributes.id;
      this.name = attributes.name || "";
      this.type = attributes.type || "hint";
      // this.xmlDefinition = attributes.xmlDefinition || null;

      this.json = attributes.json || null;

      let currSteps = this._steps || {};
      this._steps = {};
      (attributes.steps || []).forEach((sID) => {
         var ele = this.AB.stepNew(sID, this);
         if (ele) {
            this._steps[sID] = ele;
         } else {
            // current sID isn't one of our definitions yet, so might be
            // a temporary .diagramID from an unsaved task:
            if (currElements[sID]) {
               this._steps[sID] = currElements[sID];
            } else {
               this.emit(
                  "warning",
                  `H[${this.name}] is referencing an unknown step id[${sID}]`,
                  { hint: this.id, sID }
               );
            }
         }
      });
      super.fromValues(attributes); // perform translation on this object.
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

      var fieldsToSave = ["id", "name", "json"];
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
      return this._step[id] ?? null;
   }

   /**
    * stepRemove()
    * remove a step from being displayed by this hint.
    * @param {obj|ABStep} def
    *        a definition of, or full Object instance of the ABStep
    *        to remove.
    */
   stepRemove(def) {
      delete this._steps[def.id];
   }
};
