import Import_ABView from "../platform/views/ABView.js";
// import Import_ABViewCarousel from "../platform/views/ABViewCarousel.js";
// import Import_ABViewChart from "../platform/views/ABViewChart.js";
// import Import_ABViewChartArea from "../platform/views/ABViewChartArea.js";
// import Import_ABViewChartBar from "../platform/views/ABViewChartBar.js";
// import Import_ABViewChartLine from "../platform/views/ABViewChartLine.js";
// import Import_ABViewChartPie from "../platform/views/ABViewChartPie.js";
// import Import_ABViewComment from "../platform/views/ABViewComment.js";
import Import_ABViewConditionalContainer from "../platform/views/ABViewConditionalContainer.js";
import Import_ABViewConnectDataFilter from "../platform/views/ABViewConnectDataFilter.js";
import Import_ABViewContainer from "../platform/views/ABViewContainer.js";
// import Import_ABViewCSVExporter from "../platform/views/ABViewCSVExporter.js";
// import Import_ABViewCSVImporter from "../platform/views/ABViewCSVImporter.js";
import Import_ABViewDataFilter from "../platform/views/ABViewDataFilter.js";
// import Import_ABViewDataSelect from "../platform/views/ABViewDataSelect.js";
// import Import_ABViewDataview from "../platform/views/ABViewDataview.js";
// import Import_ABViewDocxBuilder from "../platform/views/ABViewDocxBuilder.js";
// import Import_ABViewGrid from "../platform/views/ABViewGrid.js";
// import Import_ABViewImage from "../platform/views/ABViewImage.js";
// import Import_ABViewLabel from "../platform/views/ABViewLabel.js";
// import Import_ABViewLayout from "../platform/views/ABViewLayout.js";
// import Import_ABViewList from "../platform/views/ABViewList.js";
import Import_ABViewMenu from "../platform/views/ABViewMenu.js";
import Import_ABViewPage from "../platform/views/ABViewPage.js";
// import Import_ABViewPDFImporter from "../platform/views/ABViewPDFImporter.js";
// import Import_ABViewPivot from "../platform/views/ABViewPivot.js";
// import Import_ABViewTab from "../platform/views/ABViewTab.js";
// import Import_ABViewText from "../platform/views/ABViewText.js";
// import Import_ABViewGantt from "../platform/views/ABViewGantt.js";
// import Import_ABViewKanban from "../platform/views/ABViewKanban.js";
import Import_ABViewReportsManager from "../platform/views/ABViewReportsManager.js";
import Import_ABViewScheduler from "../platform/views/ABViewScheduler.js";
// import Import_ABViewDetail from "../platform/views/ABViewDetail.js";
// import Import_ABViewDetailCheckbox from "../platform/views/ABViewDetailCheckbox.js";
// import Import_ABViewDetailConnect from "../platform/views/ABViewDetailConnect.js";
// import Import_ABViewDetailCustom from "../platform/views/ABViewDetailCustom.js";
// import Import_ABViewDetailImage from "../platform/views/ABViewDetailImage.js";
// import Import_ABViewDetailSelectivity from "../platform/views/ABViewDetailSelectivity.js";
// import Import_ABViewDetailText from "../platform/views/ABViewDetailText.js";
// import Import_ABViewDetailTree from "../platform/views/ABViewDetailTree.js";
// import Import_ABViewForm from "../platform/views/ABViewForm.js";
// import Import_ABViewFormButton from "../platform/views/ABViewFormButton.js";
// import Import_ABViewFormCheckbox from "../platform/views/ABViewFormCheckbox.js";
// import Import_ABViewFormConnect from "../platform/views/ABViewFormConnect.js";
// import Import_ABViewFormCustom from "../platform/views/ABViewFormCustom.js";
// import Import_ABViewFormDatepicker from "../platform/views/ABViewFormDatepicker.js";
// import Import_ABViewFormJson from "../platform/views/ABViewFormJson.js";
// import Import_ABViewFormNumber from "../platform/views/ABViewFormNumber.js";
// import Import_ABViewFormReadonly from "../platform/views/ABViewFormReadonly.js";
// import Import_ABViewFormSelectMultiple from "../platform/views/ABViewFormSelectMultiple.js";
// import Import_ABViewFormSelectSingle from "../platform/views/ABViewFormSelectSingle.js";
// import Import_ABViewFormTextbox from "../platform/views/ABViewFormTextbox.js";
// import Import_ABViewFormTree from "../platform/views/ABViewFormTree.js";
// import Import_ABViewFormURL from "../platform/views/ABViewFormURL.js";

/*
 * ABViewManager
 *
 * An interface for managing the different ABViews available in our AppBuilder.
 *
 */

var AllViews = [
   Import_ABView,
   // Import_ABViewCarousel,
   // Import_ABViewChart,
   // Import_ABViewChartArea,
   // Import_ABViewChartBar,
   // Import_ABViewChartLine,
   // Import_ABViewChartPie,
   // Import_ABViewComment,
   Import_ABViewConditionalContainer,
   Import_ABViewConnectDataFilter,
   Import_ABViewContainer,
   // Import_ABViewCSVExporter,
   // Import_ABViewCSVImporter,
   Import_ABViewDataFilter,
   // Import_ABViewDataSelect,
   // Import_ABViewDataview,
   // Import_ABViewDocxBuilder,
   // Import_ABViewGrid,
   // Import_ABViewImage,
   // Import_ABViewLabel,
   // Import_ABViewLayout,
   // Import_ABViewList,
   Import_ABViewMenu,
   Import_ABViewPage,
   // Import_ABViewPDFImporter,
   // Import_ABViewPivot,
   // Import_ABViewTab,
   // Import_ABViewText,

   //
   // Special Editors
   //
   // Import_ABViewGantt,
   // Import_ABViewKanban,
   Import_ABViewReportsManager,
   Import_ABViewScheduler,

   // //
   // // Detail Components
   // //
   // Import_ABViewDetail,
   // Import_ABViewDetailCheckbox,
   // Import_ABViewDetailConnect,
   // Import_ABViewDetailCustom,
   // Import_ABViewDetailImage,
   // Import_ABViewDetailSelectivity,
   // Import_ABViewDetailText,
   // Import_ABViewDetailTree,

   // //
   // // Form Components
   // //
   // Import_ABViewForm,
   // Import_ABViewFormButton,
   // Import_ABViewFormCheckbox,
   // Import_ABViewFormConnect,
   // Import_ABViewFormCustom,
   // Import_ABViewFormDatepicker,
   // Import_ABViewFormJson,
   // Import_ABViewFormNumber,
   // Import_ABViewFormReadonly,
   // Import_ABViewFormSelectMultiple,
   // Import_ABViewFormSelectSingle,
   // Import_ABViewFormTextbox,
   // Import_ABViewFormTree,
   // Import_ABViewFormURL,
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

export default class ABViewManagerCore {
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
            if (!isPlugin(values.key)) {
               console.error(
                  "!! View[" +
                     values.key +
                     " (" +
                     values.name +
                     ")" +
                     "] not yet defined.  Have an ABView instead:"
               );
            }
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

   static addViewClass(View) {
      Views[View.common().key] = View;
   }
}

/**
 * Check if the key starts with plugin_
 */
function isPlugin(key) {
   return key.split("_")[0] === "plugin";
}
