const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewTextPropertyComponentDefaults = {
   text: "",
   height: 0,
   dataviewID: null
};

const ABViewDefaults = {
   key: "text", // {string} unique key for this view
   icon: "font", // {string} fa-[icon] reference for this view
   labelKey: "ab.components.text" // {string} the multilingual label key for the class label
};

module.exports = class ABViewTextCore extends ABViewWidget {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewTextPropertyComponentDefaults;
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABViewLabel instance
    * into the values needed for saving.
    *
    * @return {json}
    */
   toObj() {
      this.application.unTranslate(this, this, ["text"]);

      var obj = super.toObj();
      obj.views = [];
      return obj;
   }

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      this.settings = this.settings || {};

      // convert from "0" => 0
      this.settings.height = parseInt(
         this.settings.height || ABViewTextPropertyComponentDefaults.height
      );

      // if this is being instantiated on a read from the Property UI,
      this.text = values.text || ABViewTextPropertyComponentDefaults.text;

      this.application.translate(this, this, ["text"]);
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }

   /**
    * @property datacollection
    * return ABDatacollection of this form
    *
    * @return {ABDatacollection}
    */
   get datacollection() {
      if (this.parent.key == "dataview") {
         return this.application.datacollections(
            (dv) => dv.id == this.parent.settings.dataviewID
         )[0];
      } else {
         return this.application.datacollections(
            (dv) => dv.id == this.settings.dataviewID
         )[0];
      }
   }

   displayText(val, componentID) {
      var result = this.text;

      let clearTemplateValue = (result) => {
         return result.replace(/{(.*?)}/g, "");
      };

      var dv = this.datacollection;
      if (!dv) return clearTemplateValue(result);

      var object = dv.datasource;
      if (!object) return clearTemplateValue(result);

      object.fields(null, true).forEach((f) => {
         var rowData = val || dv.getCursor() || {};

         var template = new RegExp("{" + f.label + "}", "g");
         var prepend = "";
         if (f.key == "image") {
            prepend = "/opsportal/image/" + this.application.name + "/";
         }
         var data = prepend + f.format(rowData) || "???"; // "???" default value

         if (
            data == prepend &&
            f.key == "image" &&
            f.settings.defaultImageUrl &&
            f.settings.useDefaultImage
         ) {
            data = prepend + f.settings.defaultImageUrl;
            result = result.replace(
               "img",
               'img onload=\'AD.comm.hub.publish("component.adjust", {"containerID": "' +
                  componentID +
                  "\"});' "
            );
         } else if (
            f.format(rowData) != "" &&
            f.key == "image" &&
            result.indexOf("onload") == -1 &&
            componentID
         ) {
            result = result.replace(
               "img",
               'img onload=\'AD.comm.hub.publish("component.adjust", {"containerID": "' +
                  componentID +
                  "\"});' "
            );
         } else if (f.key == "image") {
            result = result.replace(
               "img",
               "img onerror='this.parentNode.removeChild(this);' "
            );
         }

         result = result.replace(template, data);
      });

      return result;
   }
};

