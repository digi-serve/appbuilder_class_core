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

   detailsPage: null, // uuid
   detailsTab: null, // uuid
   editPage: null, // uuid
   editTab: null // uuid
};

const ABViewDefaults = {
   key: "carousel", // {string} unique key for this view
   icon: "clone", // {string} fa-[icon] reference for this view
   labelKey: "ab.components.carousel" // {string} the multilingual label key for the class label
};

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

      // convert from "0" => 0
      if (typeof this.settings.width != "undefined") {
         this.settings.width = parseInt(this.settings.width);
      } else {
         this.settings.width = ABViewCarouselPropertyComponentDefaults.width;
      }
      if (typeof this.settings.height != "undefined") {
         this.settings.height = parseInt(this.settings.height);
      } else {
         this.settings.height = ABViewCarouselPropertyComponentDefaults.height;
      }
      try {
         this.settings.showLabel = JSON.parse(this.settings.showLabel);
      } catch (e) {
         this.settings.showLabel =
            ABViewCarouselPropertyComponentDefaults.showLabel;
      }
      try {
         this.settings.hideItem = JSON.parse(this.settings.hideItem);
      } catch (e) {
         this.settings.hideItem =
            ABViewCarouselPropertyComponentDefaults.hideItem;
      }
      try {
         this.settings.hideButton = JSON.parse(this.settings.hideButton);
      } catch (e) {
         this.settings.hideButton =
            ABViewCarouselPropertyComponentDefaults.hideButton;
      }
      this.settings.navigationType =
         this.settings.navigationType ||
         ABViewCarouselPropertyComponentDefaults.navigationType;
   }

   get imageField() {
      let dc = this.datacollection;
      if (!dc) return null;

      let obj = dc.datasource;
      if (!obj) return null;

      return obj.fields((f) => f.id == this.settings.field)[0];
   }
};
