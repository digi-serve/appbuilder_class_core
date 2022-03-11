/*
 * ABFieldUser
 *
 * An ABFieldUser defines a user field type.
 *
 */

const ABFieldConnect = require("../../platform/dataFields/ABFieldConnect");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

const ABFieldUserDefaults = {
   key: "user",
   // unique key to reference this specific DataField

   description: "Add users to a record.",
   // description: what gets displayed in the Editor description.
   // NOTE: this will be displayed using a Label: L(description)

   icon: "user-o",
   // font-awesome icon reference.  (without the 'fa-').  so 'user-o'  to
   // reference 'fa-user-o'

   isFilterable: false,
   // {bool} / {fn}
   // determines if the current ABField can be used to filter (FilterComplex
   // or Query) data.
   // if a {fn} is provided, it will be called with the ABField as a parameter:
   //  (field) => field.setting.something == true

   isSortable: (field) => {
      if (field.settings.isMultiple) {
         return false;
      } else {
         return true;
      }
   },
   // {bool} / {fn}
   // determines if the current ABField can be used to Sort data.
   // if a {fn} is provided, it will be called with the ABField as a parameter:
   //  (field) => true/false

   menuName: "User",
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

   USERNAME_FIELD_ID: "5760560b-c078-47ca-98bf-e18ac492a561",
   // {string} .uuid
   // the ABField.id of the SiteUser.username field.  This is what other
   // objects will link to in their ABFieldUser connections.
};

const defaultValues = {
   editable: 1,
   isMultiple: 0,
   isCurrentUser: 0,
   isShowProfileImage: 0,
   isShowUsername: 1,
};

module.exports = class ABFieldUserCore extends ABFieldConnect {
   constructor(values, object) {
      super(values, object, ABFieldUserDefaults);
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldUserDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

   ///
   /// Instance Methods
   ///

   fromValues(values) {
      super.fromValues(values);

      this.settings.editable = parseInt(this.settings.editable);
      this.settings.isMultiple = parseInt(this.settings.isMultiple);
      this.settings.isCurrentUser = parseInt(this.settings.isCurrentUser);
      this.settings.isShowProfileImage = parseInt(
         this.settings.isShowProfileImage
      );
      this.settings.isShowUsername = parseInt(this.settings.isShowUsername);
   }

   ///
   /// Working with Actual Object Values:
   ///

   format(rowData) {
      let val = this.dataValue(rowData) || [];

      if (val && !Array.isArray(val)) val = [val];
      if (!val) val = [];

      return val.map((v) => v.username || v).join(", ");
   }
};
