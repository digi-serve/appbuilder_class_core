const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewCommentPropertyComponentDefaults = {
   dataviewID: null,
   columnUser: null,
   columnComment: null,
   columnDate: null,
   height: 300,
   label: "", // label is required and you can add more if the component needs them
   // format:0  	// 0 - normal, 1 - title, 2 - description
};

const ABViewDefaults = {
   key: "comment", // {string} unique key for this view
   icon: "comments", // {string} fa-[icon] reference for this view
   labelKey: "ab.components.comment", // {string} the multilingual label key for the class label
};

module.exports = class ABViewCommentCore extends ABViewWidget {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewCommentPropertyComponentDefaults;
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      // convert from "0" => 0
      // this.settings.format = parseInt(this.settings.format);
      // if this is being instantiated on a read from the Property UI,
      this.settings.height = parseInt(this.settings.height || 0);
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }

   getUserField() {
      var dv = this.datacollection;
      if (!dv) return null;

      var obj = dv.datasource;
      if (!obj) return null;

      return obj.fields((f) => f.id == this.settings.columnUser)[0];
   }

   getCommentField() {
      var dv = this.datacollection;
      if (!dv) return null;

      var obj = dv.datasource;
      if (!obj) return null;

      return obj.fields((f) => f.id == this.settings.columnComment)[0];
   }

   getDateField() {
      var dv = this.datacollection;
      if (!dv) return null;

      var obj = dv.datasource;
      if (!obj) return null;

      return obj.fields((f) => f.id == this.settings.columnDate)[0];
   }

   getUserData() {
      var userObject = this.getUsers();
      var userList = [];

      if (!userObject) return;

      userObject.forEach((item, index) => {
         var imageURL = "";
         if (item.image) {
            imageURL = "/opsportal/image/UserProfile/" + item.image;
         }
         var user = { id: index + 1, value: item.value, image: imageURL };
         userList.push(user);
      });
      return userList;
   }

   model() {
      let dv = this.datacollection;
      if (!dv) return null; // already notified in this.datacollection.

      // get ABModel
      let model = dv.model; // already notified
      if (!model) return null;

      return model;
   }
};
