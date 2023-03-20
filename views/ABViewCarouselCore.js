const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewCarouselPropertyComponentDefaults = {
   dataviewID: null, // uuid of ABDatacollection
   field: null, // uuid

   width: 460,
   height: 275,
   showLabel: true,
   hideItem: false,
   hideButton: false,
   navigationType: "corner", // "corner" || "side"
   filterByCursor: false,

   detailsPage: null, // uuid
   detailsTab: null, // uuid
   editPage: null, // uuid
   editTab: null, // uuid
};

const ABViewDefaults = {
   key: "carousel", // {string} unique key for this view
   icon: "clone", // {string} fa-[icon] reference for this view
   labelKey: "Carousel", // {string} the multilingual label key for the class label
};

function parseIntOrDefault(_this, key) {
   if (typeof _this.settings[key] != "undefined") {
      _this.settings[key] = parseInt(_this.settings[key]);
   } else {
      _this.settings[key] = ABViewCarouselPropertyComponentDefaults[key];
   }
}

function parseOrDefault(_this, key) {
   try {
      _this.settings[key] = JSON.parse(_this.settings[key]);
   } catch (e) {
      _this.settings[key] = ABViewCarouselPropertyComponentDefaults[key];
   }
}

module.exports = class ABViewCarouselCore extends ABViewWidget {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewCarouselPropertyComponentDefaults;
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

      debugger;

      // convert from "0" => 0
      parseIntOrDefault(this, "width");
      parseIntOrDefault(this, "height");

      // json
      parseOrDefault(this, "showLabel");
      parseOrDefault(this, "hideItem");
      parseOrDefault(this, "hideButton");

      this.settings.navigationType =
         this.settings.navigationType ||
         ABViewCarouselPropertyComponentDefaults.navigationType;

      parseOrDefault(this, "filterByCursor");
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }

   get imageField() {
      let dc = this.datacollection;
      if (!dc) return null;

      let obj = dc.datasource;
      if (!obj) return null;

      return obj.fieldByID(this.settings.field);
   }
};
