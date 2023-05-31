/**
 * ABProcessLane
 * manages the lanes in a Process Diagram.
 *
 * Lanes manage users in the system, and provide a way to lookup a SiteUser.
 */
import ABProcessParticipant from "../../platform/process/ABProcessParticipant";

const ABProcessLaneDefaults = {
   type: "process.lane",
   // {string} .type
   // unique key to reference this specific object

   // icon: "key"
   // {string} .icon
   // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'
};

export default class ABProcessLaneCore extends ABProcessParticipant {
   constructor(attributes, process, AB) {
      super(attributes, process, AB);

      //// Runtime Values
      //// these are not stored in the Definition, but rather
      //// loaded and used from a running process instance.
   }

   static defaults() {
      return ABProcessLaneDefaults;
   }

   fromValues(attributes) {
      /*
        {
            id: uuid(),
            name: 'name',
            type: 'xxxxx',
            json: "{json}"
        }
        */
      super.fromValues(attributes);

      this.type = attributes.type || ABProcessLaneDefaults.type;
   }

   /**
    * @method toObj()
    * properly compile the current state of this object instance
    * into the values needed for saving to the DB.
    * @return {json}
    */
   // toObj() {
   //     // default label value
   //     if (!this.label && this.name && this.name != "") {
   //         this.label = this.name;
   //     }

   //     // untranslate this object:
   //     var data = super.toObj();

   //     var fieldsToSave = [
   //         "id",
   //         "name",
   //         "type",
   //         "processID",
   //         "diagramID",
   //         "where"
   //     ];
   //     fieldsToSave.forEach((f) => {
   //         data[f] = this[f];
   //     });

   //     return data;
   // }
}
