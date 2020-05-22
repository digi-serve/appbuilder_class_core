let ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

var ABFieldCustomIndexDefaults = {
   key: "customIndex", // unique key to reference this specific DataField
   icon: "key", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   // menuName: what gets displayed in the Editor drop list
   menuName: L("ab.dataField.CustomIndex.menuName", "*Custom Index"),

   // description: what gets displayed in the Editor description.
   description: L("ab.dataField.CustomIndex.description", "*Custom Value")
};

// defaultValues: the keys must match a .name of your elements to set it's default value.
var defaultValues = {};

module.exports = class ABFieldCustomIndexCore extends ABField {
   constructor(values, object) {
      super(values, object, ABFieldCustomIndexDefaults);
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldCustomIndexDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

   fromValues(values) {
      super.fromValues(values);
   }

   /**
    * @method defaultValue
    * insert a key=>value pair that represent the default value
    * for this field.
    * @param {obj} values a key=>value hash of the current values.
    */
   defaultValue(values) {
      // Remove every values, then we will use AUTO_INCREMENT of MySQL
      delete values[this.columnName];
   }
};
