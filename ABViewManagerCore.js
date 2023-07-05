/*
 * ABViewManager
 *
 * An interface for managing the different ABViews available in our AppBuilder.
 *
 */

var AllViews = [
   require("../platform/views/ABView"),
   require("../platform/views/ABViewCarousel"),
   require("../platform/views/ABViewChart"),
   require("../platform/views/ABViewChartArea"),
   require("../platform/views/ABViewChartBar"),
   require("../platform/views/ABViewChartLine"),
   require("../platform/views/ABViewChartPie"),
   require("../platform/views/ABViewComment"),
   require("../platform/views/ABViewConditionalContainer"),
   require("../platform/views/ABViewConnectDataFilter"),
   require("../platform/views/ABViewContainer"),
   require("../platform/views/ABViewCSVExporter"),
   require("../platform/views/ABViewCSVImporter"),
   require("../platform/views/ABViewDataFilter"),
   require("../platform/views/ABViewDataview"),
   require("../platform/views/ABViewDocxBuilder"),
   require("../platform/views/ABViewGrid"),
   require("../platform/views/ABViewImage"),
   require("../platform/views/ABViewLabel"),
   require("../platform/views/ABViewLayout"),
   require("../platform/views/ABViewList"),
   require("../platform/views/ABViewMenu"),
   require("../platform/views/ABViewPage"),
   require("../platform/views/ABViewPivot"),
   require("../platform/views/ABViewTab"),
   require("../platform/views/ABViewText"),

   //
   // Special Editors
   //
   require("../platform/views/ABViewGantt"),
   require("../platform/views/ABViewKanban"),
   require("../platform/views/ABViewReportsManager"),
   require("../platform/views/ABViewScheduler"),

   //
   // Detail Components
   //
   require("../platform/views/ABViewDetail"),
   require("../platform/views/ABViewDetailCheckbox"),
   require("../platform/views/ABViewDetailConnect"),
   require("../platform/views/ABViewDetailCustom"),
   require("../platform/views/ABViewDetailImage"),
   // require("../platform/views/ABViewDetailSelectivity"),
   require("../platform/views/ABViewDetailText"),
   require("../platform/views/ABViewDetailTree"),

   //
   // Form Components
   //
   require("../platform/views/ABViewForm"),
   require("../platform/views/ABViewFormButton"),
   require("../platform/views/ABViewFormCheckbox"),
   require("../platform/views/ABViewFormConnect"),
   require("../platform/views/ABViewFormCustom"),
   require("../platform/views/ABViewFormDatepicker"),
   require("../platform/views/ABViewFormJson"),
   require("../platform/views/ABViewFormNumber"),
   require("../platform/views/ABViewFormReadonly"),
   require("../platform/views/ABViewFormSelectMultiple"),
   require("../platform/views/ABViewFormSelectSingle"),
   require("../platform/views/ABViewFormTextbox"),
   require("../platform/views/ABViewFormTree"),
];

/*
 * Views
 * A name => ABView  hash of the different ABViews available.
 */
var Views = {};
AllViews.forEach((v) => {
   if (v.default?.common) {
      v = v.default;
   }
   Views[v.common().key] = v;
});

module.exports = class ABViewManagerCore {
   /**
    * @function allViews
    * return all the currently defined ABViews in an array.
    * @return [{ABView},...]
    */
   static allViews(fn = () => true) {
      var views = [];
      for (var v in Views) {
         var V = Views[v];
         if (fn(V)) {
            views.push(V);
         }
      }
      return views;
   }

   /**
    * @function newView
    * return an instance of an ABView based upon the values.key value.
    * @return {ABView}
    */
   static newView(values, application, parent) {
      parent = parent || null;

      if (values.key == "detailselectivity") {
         values.key = "detailconnect";
      }

      //		if ((values.key) && (Views[values.key])) {
      if (values.key) {
         if (!Views[values.key]) {
            console.error(
               "!! View[" +
                  values.key +
                  "] not yet defined.  Have an ABView instead:"
            );
            return new Views["view"](values, application, parent);
         }

         return new Views[values.key](values, application, parent);
      } else {
         var err = new Error(`Unknown view key [${values.key}]`);
         console.error(err); // show the stack.
         console.error({
            error: err,
            values: values,
            application: application,
         });
         return null;
      }
   }

   static viewClass(key) {
      if (Views[key]) {
         return Views[key];
      }
      console.error(`Unknown View Key[${key}]`);
      return;
   }
};
