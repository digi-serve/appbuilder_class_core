import ABMobileView from "../../platform/mobile/ABMobileView.js";

const ABViewTimelinePropertyComponentDefaults = {
   dataviewID: null,
   field: null,
   height: 0,
   hideTitle: 0,
   hideTabs: 0,
};

const ABViewDefaults = {
   key: "mobile-timeline", // {string} unique key for this view
   icon: "timeline", // {string} fa-[icon] reference for this view
   labelKey: "Timeline", // {string} the multilingual label key for the class label
};

export default class ABViewTimelineCore extends ABMobileView {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewTimelinePropertyComponentDefaults;
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }

   field() {
      var dv = this.datacollection;
      if (!dv) return null;

      var object = dv.datasource;
      if (!object) return null;

      return object.fieldByID(this.settings.field);
   }

   /**
    * @method wantsAdd()
    * Some widgets can indicate to their containing ABMobilePage that
    * it wants to provide an [Add] feature.
    * @return {bool}
    */
   get wantsAdd() {
      // we do if we have a setting for linkPageAdd
      return this.settings.linkPageAdd != "";
   }
}
