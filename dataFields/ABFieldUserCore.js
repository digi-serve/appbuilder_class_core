/*
 * ABFieldUser
 *
 * An ABFieldUser defines a user field type.
 *
 */

var ABFieldConnect = require("../../platform/dataFields/ABFieldConnect");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

var ABFieldUserDefaults = {
   key: "user", // unique key to reference this specific DataField
   icon: "user-o", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

   // menuName: what gets displayed in the Editor drop list
   menuName: L("ab.dataField.user.menuName", "*User"),

   // description: what gets displayed in the Editor description.
   description: L("ab.dataField.user.description", "*Add user/s to a record."),
   isSortable: (field) => {
      if (field.settings.isMultiple) {
         return false;
      } else {
         return true;
      }
   },

   supportRequire: false,

   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options
   compatibleOrmTypes: [],

   USERNAME_FIELD_ID: "5760560b-c078-47ca-98bf-e18ac492a561",
   // {string} .uuid
   // the ABField.id of the SiteUser.username field.  This is what other
   // objects will link to in their ABFieldUser connections.
};

var defaultValues = {
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
      var val = this.dataValue(rowData) || [];

      if (val && !Array.isArray(val)) val = [val];
      if (!val) val = [];

      return val.map((v) => v.username || v).join(", ");
   }
};
