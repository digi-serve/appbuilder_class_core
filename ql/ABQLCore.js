/*
 * ABQL
 *
 * An ABQL defines the base class for our AB Query Language Objects.
 * These classes share a common way to
 *   - parse input strings for commands
 *
 *
 */

class ABQLCore {
   constructor(attributes, parameterDefinitions, prevOP, task, application) {
      // manage the incoming Parameter Definitions
      if (!Array.isArray(parameterDefinitions)) {
         parameterDefinitions = [parameterDefinitions];
      }
      this.parameterDefinitions = parameterDefinitions;

      this.object = prevOP ? prevOP.object : null;

      this.prevOP = prevOP;
      this.task = task;
      this.application = application;
      this.next = null;

      this.fromAttributes(attributes);
   }

   ///
   /// Instance Methods
   ///

   initObject(attributes) {}

   fromAttributes(attributes) {
      /*
        {
            id: uuid(),
            name: 'name',
            type: 'xxxxx',
            json: "{json}"
        }
        */

      // super.fromValues(attributes);

      // this.entryComplete = attributes.entryComplete || false;
      this.params = attributes.params || null;
      // this.currQuery = attributes.currQuery || null;
      // this.queryValid = attributes.queryValid || false;
      this.objectID = attributes.objectID || null;
      // be sure to do a hard lookup if an objectID was saved:
      if (this.objectID) {
         this.object = this.objectLookup(this.objectID);
      }

      this.initObject(attributes);

      if (attributes.next) {
         var nextOP = null;
         this.constructor.NextQLOps.forEach((OP) => {
            if (OP.key == attributes.next.key) {
               nextOP = OP;
            }
         });
         if (nextOP) {
            // exact match, so add next:
            var qlOP = new nextOP(
               attributes.next,
               this,
               this.task,
               this.application
            );
            this.next = qlOP;
         }
      }
   }

   /**
    * @method objectLookup()
    * return a matching {ABObject} that is represented by the given id.
    * NOTE: we will try to match on: our initial .objectID first, then
    * the given objID.
    * NOTE: this will match an object.id as well as object.label
    * @param {string} objID
    */
   objectLookup(objID) {
      return this.application.objects((o) => {
         var quotedLabel = `"${o.label}"`;
         return (
            o.id == this.objectID ||
            o.id == objID ||
            quotedLabel.indexOf(objID) == 0
         );
      })[0];
   }

   /**
    * @method availableProcessDataFieldsHash()
    * return a { "field.key" => {processFieldDef} } hash of the currently
    * available fields in the process.
    * @return {obj}
    */
   availableProcessDataFieldsHash() {
      var availableProcessDataFields = this.task.process.processDataFields(
         this.task
      ) || [];
      var hashFieldIDs = {};
      availableProcessDataFields.forEach((f) => {
         if (f.field) {
            hashFieldIDs[f.field.id] = f;
         } else {
            hashFieldIDs[f.key] = f;
         }
      });
      return hashFieldIDs;
   }

   /*
    * @method paramChanged()
    * respond to an update to the given parameter.
    * NOTE: the value will ALREADY be saved in this.params[pDef.name].
    * @param {obj} pDef
    *        the this.parameterDefinition entry of the parameter that was
    *        changed.
    */
   paramChanged(pDef) {}

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
      // OP.Multilingual.unTranslate(this, this, ["label"]);

      // var result = super.toObj();

      var obj = {
         key: this.constructor.key,
         // entryComplete: this.entryComplete,
         params: this.params,
         // currQuery: this.currQuery,
         // queryValid: this.queryValid,
         objectID: this.object ? this.object.id : null
      };

      if (this.next) {
         obj.next = this.next.toObj();
      }

      return obj;
   }
}

module.exports = ABQLCore;
