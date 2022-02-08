const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewKanbanPropertyComponentDefaults = {
   dataviewID: null,
   // {uuid}
   // The ABDataCollection.uuid that we are using to store the data.
   // NOTE: we actually use the DC to get the ABObject it is connected to.

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

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewKanbanPropertyComponentDefaults;
   }
};
