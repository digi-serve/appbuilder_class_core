import ABMobileViewFormItem from "../../platform/mobile/ABMobileViewFormItem";

const ABViewFormImagePropertyComponentDefaults = {};

const ABViewImageFileDefaults = {
   key: "mobile-image",
   // {string} unique key for this view
   icon: "file-image-o",
   // {string} fa-[icon] reference for this view
   labelKey: "Image",
   // {string} the multilingual label key for the class label
};

export default class ABMobileViewFormImageCore extends ABMobileViewFormItem {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABViewImageFileDefaults
      );
   }

   static common() {
      return ABViewImageFileDefaults;
   }

   static defaultValues() {
      return ABViewFormImagePropertyComponentDefaults;
   }
}
