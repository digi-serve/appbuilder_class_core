/*
 * ABFieldImageCore
 *
 * An ABFieldImage defines a Image field type.
 *
 */

var ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

var ABFieldImageDefaults = {
   key: "image", // unique key to reference this specific DataField
   // type : 'string', // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
   icon: "file-image-o", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   // menuName: what gets displayed in the Editor drop list
   menuName: L("ab.dataField.image.menuName", "*Image Attachment"),

   // description: what gets displayed in the Editor description.
   description: L(
      "ab.dataField.image.description",
      "*Attach an image to this object."
   ),

   isSortable: false,
   isFilterable: false,
   useAsLabel: false,

   supportRequire: false,

   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
   compatibleOrmTypes: [],
};

var defaultValues = {
   useWidth: 0,
   imageWidth: "",
   useHeight: 0,
   imageHeight: "",
   removeExistingData: 0,
   useDefaultImage: false,
   defaultImageUrl: "",
};

module.exports = class ABFieldImageCore extends ABField {
   constructor(values, object) {
      super(values, object, ABFieldImageDefaults);

      // NOTE: our Labels are ready here:
      if (
         ABFieldImageDefaults.menuName == "*Image Attachment" &&
         this.AB.Label
      ) {
         var L = this.AB.Label();
         ABFieldImageDefaults.menuName = L(
            "ab.dataField.image.menuName",
            "*Image Attachment"
         );
         ABFieldImageDefaults.description = L(
            "ab.dataField.image.description",
            "*Attach an image to this object."
         );
      }

      /*
    	{
			settings: {
				'useWidth':0,
				'imageWidth':'',
				'useHeight': 0,
				'imageHeight': '',
				'removeExistingData': 0
			}
    	}
    	*/
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldImageDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

   ///
   /// Instance Methods
   ///

   fromValues(values) {
      super.fromValues(values);

      // text to Int:
      this.settings.useWidth = parseInt(this.settings.useWidth);
      this.settings.useHeight = parseInt(this.settings.useHeight);
      this.settings.imageWidth = parseInt(this.settings.imageWidth);
      this.settings.imageHeight = parseInt(this.settings.imageHeight);
      this.settings.useDefaultImage = parseInt(this.settings.useDefaultImage);
      this.settings.removeExistingData = parseInt(
         this.settings.removeExistingData
      );
   }

   /**
    * @method isValidData
    * Parse through the given data and return an error if this field's
    * data seems invalid.
    * @param {obj} data  a key=>value hash of the inputs to parse.
    * @param {OPValidator} validator  provided Validator fn
    * @return {array}
    */
   isValidData(data, validator) {
      super.isValidData(data, validator);
   }
};
