const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewKanbanPropertyComponentDefaults = {
   dataviewID: null,
   // {uuid}
   // The ABDataCollection.uuid that we are using to store the data.
   // NOTE: we actually use the DC to get the ABObject it is connected to.

   editFields: [],
   // {array}
   // An array of {ABField.id} that determines which fields should show up
   // in the editor.

   verticalGroupingField: "",
   // {ABField.id}
   // the .id of the ABField instance that determines the Vertical Grouping
   // of the Kanban.

   horizontalGroupingField: "",
   // {ABField.id}
   // the .id of the ABField instance that determines the horizontal Grouping
   // of the Kanban.

   ownerField: "",
   // {ABFieldUser.id}
   // the .id of the ABFieldUser instance that determines the owner of the
   // entries.

   template: "",
   // {json}
   // The {ABViewText} definition used to display the template for this KanBan.
   //
   // A display template used for displaying the information in each Card. The
   // template is a basic string with special placeholders:  {field.id}
   // Given a row of data, the current object will scan the template for any
   // placeholders matching one of it's fields, and then update it with the
   // current value.
};

const ABViewDefaults = {
   key: "kanban",
   // {string}
   // unique key identifier for this ABViewForm

   icon: "columns",
   // {string}
   // font-awesome icon reference: (without 'fa-' )

   labelKey: "Kanban",
   // {string}
   // the multilingual label key
   // NOTE: will be used as L(labelKey)
};

module.exports = class ABViewKanbanCore extends ABViewWidget {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   fromValues(values) {
      super.fromValues(values);

      // set a default .template value
      if (!this.settings.template) {
         this.settings.template = { id: `${this.id}_template`, key: "text" };
         this.settings.template.text = this.settings.textTemplate;
      }

      this.TextTemplate = this.AB.viewNewDetatched(this.settings.template);
   }

   toObj() {
      var obj = super.toObj();
      obj.settings.template = this.TextTemplate.toObj();
      return obj;
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewKanbanPropertyComponentDefaults;
   }
};
