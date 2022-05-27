/*
 * ABViewContainerCore
 *
 * An ABViewContainerCore defines a UI display component.
 *
 * A container might have multiple columns of display info.
 *
 */

const ABView = require("../../platform/views/ABView");

// function L(key, altText) {
// 	return AD.lang.label.getLabel(key) || altText;
// }

const ABViewDefaults = {
   key: "viewcontainer", // {string} unique key for this view
   icon: "braille", // {string} fa-[icon] reference for this view
   labelKey: "Container", // {string} the multilingual label key for the class label
};

const ABPropertyComponentDefaults = {
   columns: 1,
   gravity: 1,
};

module.exports = class ABViewContainerCore extends ABView {
   /**
    * @param {obj} values  key=>value hash of ABView values
    * @param {ABApplication} application the application object this view is under
    * @param {ABView} parent the ABView this view is a child of. (can be null)
    * @param {obj} defaultValues special sub class defined default values.
    */
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABPropertyComponentDefaults;
   }

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      // convert from "0" => 0
      this.settings.columns = parseInt(
         this.settings.columns || ABPropertyComponentDefaults.columns
      );

      if (typeof this.settings.gravity != "undefined") {
         this.settings.gravity.map(function (gravity) {
            return parseInt(gravity);
         });
      }

      if (this.settings.removable != null) {
         this.settings.removable = JSON.parse(this.settings.removable); // convert to boolean
      } else {
         this.settings.removable = true;
      }

      if (this.settings.movable != null) {
         this.settings.movable = JSON.parse(this.settings.movable); // convert to boolean
      } else {
         this.settings.movable = true;
      }
   }

   viewsSortByPosition() {
      // Sort views from y, x positions
      return this.views().sort((a, b) => {
         if (a.position.y == b.position.y) return a.position.x - b.position.x;
         else return a.position.y - b.position.y;
      });
   }

   // saveReorder() {
   //    return this.application.viewReorder(this);
   // }
};
