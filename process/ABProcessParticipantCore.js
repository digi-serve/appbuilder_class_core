/**
 * ABProcessParticipant
 * manages the participant lanes in a Process Diagram.
 *
 * Participants manage users in the system, and provide a way to lookup a SiteUser.
 */
import ABMLClass from "../../platform/ABMLClass";

const ABProcessParticipantDefaults = {
   type: "process.participant",
   // {string} .type
   // unique key to reference this specific object

   // icon: "key" // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'
};

export default class ABProcessParticipantCore extends ABMLClass {
   constructor(attributes, process, AB) {
      super(["label"], AB);

      this.process = process;
      if (!this.processID) {
         this.processID = process.id;
      }

      this.fromValues(attributes);

      //// Runtime Values
      //// these are not stored in the Definition, but rather
      //// loaded and used from a running process instance.
   }

   static defaults() {
      return ABProcessParticipantDefaults;
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
      // These Values are needed By ABDefinition:
      this.id = attributes.id;
      this.name = attributes.name || "";
      this.type = attributes.type || ABProcessParticipantDefaults.type;
      this.key = attributes.key || ABProcessParticipantDefaults.type;

      // Process Values:
      this.processID = attributes.processID || null;
      this.diagramID = attributes.diagramID || "?diagramID?";
      this.laneIDs = attributes.laneIDs || [];
      this.stashed = false;
      if (attributes.stashed && attributes.stashed != "") {
         this.stashed = attributes.stashed;
      }

      function validChecker(attribute) {
         return typeof attribute != "undefined" && attribute != null;
      }

      this.useRole = 0;
      if (validChecker(attributes.useRole)) {
         this.useRole = parseInt(attributes.useRole);
      }

      this.role = 0;
      if (validChecker(attributes.role)) {
         this.role = attributes.role;
      }

      this.useAccount = 0;
      if (validChecker(attributes.useAccount)) {
         this.useAccount = parseInt(attributes.useAccount);
      }

      this.account = 0;
      if (validChecker(attributes.account)) {
         this.account = attributes.account;
      }

      this.useField = 0;
      if (validChecker(attributes.useField)) {
         this.useField = parseInt(attributes.useField);
      }

      this.userField = [];
      if (validChecker(attributes.userField)) {
         this.userField = attributes.userField;
      }

      // depreciated
      this.fields = [];
      if (validChecker(attributes.fields)) {
         this.fields = attributes.fields;
      }

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
      if (!this.label && this.name && this.name != "") {
         this.label = this.name;
      }

      // untranslate this object:
      var data = super.toObj();

      var fieldsToSave = [
         "id",
         "name",
         "type",
         "processID",
         "diagramID",
         "laneIDs",
         "where",
         "useRole",
         "role",
         "useAccount",
         "account",
         "useField",
         "userField",
         "fields",
         "stashed",
      ];
      fieldsToSave.forEach((f) => {
         data[f] = this[f];
      });

      return data;
   }

   /**
    * @method onProcessReady()
    * perform any tasks/checks necessary after the parent Process is
    * setup and ready.
    */
   onProcessReady() {}
}
