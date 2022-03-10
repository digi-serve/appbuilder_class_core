/*
 * ABFieldImageCore
 *
 * An ABFieldImage defines a Image field type.
 *
 */

const ABField = require("../../platform/dataFields/ABField");

const ABFieldImageDefaults = {
   key: "image",
   // unique key to reference this specific DataField

   description: "Attach an image to this object.",
   // description: what gets displayed in the Editor description.
   // NOTE: this will be displayed using a Label: L(description)

   icon: "file-image-o",
   // font-awesome icon reference.  (without the 'fa-').  so 'file-image-o'  to
   // reference 'fa-file-image-o'

   isFilterable: false,
   // {bool} / {fn}
   // determines if the current ABField can be used to filter (FilterComplex
   // or Query) data.
   // if a {fn} is provided, it will be called with the ABField as a parameter:
   //  (field) => field.setting.something == true

   isSortable: false,
   // {bool} / {fn}
   // determines if the current ABField can be used to Sort data.
   // if a {fn} is provided, it will be called with the ABField as a parameter:
   //  (field) => true/false

   menuName: "Image Attachment",
   // menuName: what gets displayed in the Editor drop list
   // NOTE: this will be displayed using a Label: L(menuName)

   supportRequire: false,
   // {bool}
   // does this ABField support the Required setting?

   supportUnique: false,
   // {bool}
   // does this ABField support the Unique setting?

   useAsLabel: false,
   // {bool} / {fn}
   // determines if this ABField can be used in the display of an ABObject's
   // label.

   compatibleOrmTypes: ["string"],
   // {array}
   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options

   compatibleMysqlTypes: ["char", "varchar", "tinytext"],
   // {array}
   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
};

const defaultValues = {
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
         const L = this.AB.Label();
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
