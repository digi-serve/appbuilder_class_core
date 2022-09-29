const ABView = require("../../platform/views/ABView");

const ABViewFormFieldPropertyComponentDefaults = {
   required: 0,
   disable: 0,
};

module.exports = class ABViewFormComponentCore extends ABView {
   // constructor(values, application, parent, defaultValues) {
   //    super(values, application, parent, defaultValues);
   // }

   static defaultValues() {
      return ABViewFormFieldPropertyComponentDefaults;
   }

   field() {
      if (this.settings.objectId) {
         let object = this.AB.objectByID(this.settings.objectId);
         if (!object) return null;

         return object.fieldByID(this.settings.fieldId);
      } else {
         let form = this.parentFormComponent();
         if (form == null) return null;

         let object;
         if (form._currentObject) {
            object = form._currentObject;
         } else {
            let datacollection = form.datacollection;
            if (datacollection == null) return null;

            object = datacollection.datasource;
         }

         if (object == null) return null;

         let field = object.fieldByID(this.settings.fieldId);
         return field;
      }
   }
};

