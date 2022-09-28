const ABViewContainer = require("../../platform/views/ABViewContainer");

const ABViewPropertyDefaults = {
   dataviewID: null,
   filterConditions: {},
};

const ABViewDefaults = {
   key: "conditionalcontainer", // unique key identifier for this ABView
   icon: "shield", // icon reference: (without 'fa-' )
   labelKey: "Conditional Container", // {string} the multilingual label key for the class label
};

module.exports = class ABViewConditionalContainerCore extends ABViewContainer {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);

      const L = (...params) => this.AB.Multilingual.label(...params);

      // the conditional container always has 'If' and 'Else' panels
      if (this.views((v) => v instanceof ABViewContainer).length < 2) {
         this._views = [];

         // 'If' panel
         const ifPanel = application.viewNew(
            {
               key: ABViewContainer.common().key,
               label: L("If"),
               settings: {
                  removable: false,
               },
            },
            application,
            this
         );
         this._views.push(ifPanel);

         // 'Else' panel
         const elsePanel = application.viewNew(
            {
               key: ABViewContainer.common().key,
               label: L("Else"),
               settings: {
                  removable: false,
               },
            },
            application,
            this
         );
         this._views.push(elsePanel);
      }
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewPropertyDefaults;
   }
};

