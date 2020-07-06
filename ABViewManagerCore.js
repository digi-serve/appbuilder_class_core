/*
 * ABViewManager
 *
 * An interface for managing the different ABViews available in our AppBuilder.
 *
 */

var AllViews = [];
AllViews.push(require("../platform/views/ABView"));
AllViews.push(require("../platform/views/ABViewCarousel"));
AllViews.push(require("../platform/views/ABViewChart"));
AllViews.push(require("../platform/views/ABViewChartPie"));
AllViews.push(require("../platform/views/ABViewChartBar"));
AllViews.push(require("../platform/views/ABViewChartLine"));
AllViews.push(require("../platform/views/ABViewChartArea"));
AllViews.push(require("../platform/views/ABViewComment"));
AllViews.push(require("../platform/views/ABViewConditionalContainer"));
AllViews.push(require("../platform/views/ABViewContainer"));
AllViews.push(require("../platform/views/ABViewCSVImporter"));
AllViews.push(require("../platform/views/ABViewDataview"));
AllViews.push(require("../platform/views/ABViewDocxBuilder"));
AllViews.push(require("../platform/views/ABViewPage"));
AllViews.push(require("../platform/views/ABViewPivot"));
AllViews.push(require("../platform/views/ABViewLabel"));
AllViews.push(require("../platform/views/ABViewLayout"));
AllViews.push(require("../platform/views/ABViewList"));
AllViews.push(require("../platform/views/ABViewMenu"));
AllViews.push(require("../platform/views/ABViewGrid"));
AllViews.push(require("../platform/views/ABViewImage"));
AllViews.push(require("../platform/views/ABViewTab"));
AllViews.push(require("../platform/views/ABViewText"));
AllViews.push(require("../platform/views/ABViewKanban"));

AllViews.push(require("../platform/views/ABViewDetail"));
AllViews.push(require("../platform/views/ABViewDetailCheckbox"));
AllViews.push(require("../platform/views/ABViewDetailCustom"));
AllViews.push(require("../platform/views/ABViewDetailConnect"));
AllViews.push(require("../platform/views/ABViewDetailImage"));
AllViews.push(require("../platform/views/ABViewDetailSelectivity"));
AllViews.push(require("../platform/views/ABViewDetailText"));
AllViews.push(require("../platform/views/ABViewDetailTree"));

AllViews.push(require("../platform/views/ABViewForm"));
AllViews.push(require("../platform/views/ABViewFormButton"));
AllViews.push(require("../platform/views/ABViewFormCheckbox"));
AllViews.push(require("../platform/views/ABViewFormConnect"));
AllViews.push(require("../platform/views/ABViewFormCustom"));
AllViews.push(require("../platform/views/ABViewFormDatepicker"));
AllViews.push(require("../platform/views/ABViewFormNumber"));
//AllViews.push(require("../platform/views/ABViewFormSelectMultiple"));
AllViews.push(require("../platform/views/ABViewFormSelectSingle"));
AllViews.push(require("../platform/views/ABViewFormReadonly"));
AllViews.push(require("../platform/views/ABViewFormTextbox"));
AllViews.push(require("../platform/views/ABViewFormTree"));

/*
 * Views
 * A name => ABView  hash of the different ABViews available.
 */
var Views = {};
AllViews.forEach((v) => {
   Views[v.common().key] = v;
});

/*
Views[ABViewCarousel.common().key] = ABViewCarousel;
Views[ABViewChart.common().key] = ABViewChart;
Views[ABViewChartPie.common().key] = ABViewChartPie;
Views[ABViewChartBar.common().key] = ABViewChartBar;
Views[ABViewChartLine.common().key] = ABViewChartLine;
Views[ABViewChartArea.common().key] = ABViewChartArea;

Views[ABViewComment.common().key] = ABViewComment;
Views[ABViewConditionalContainer.common().key] = ABViewConditionalContainer;
Views[ABViewContainer.common().key] = ABViewContainer;
Views[ABViewCSVImporter.common().key] = ABViewCSVImporter;
Views[ABViewDataview.common().key] = ABViewDataview;
Views[ABViewDocxBuilder.common().key] = ABViewDocxBuilder;
Views[ABViewPage.common().key] = ABViewPage;
Views[ABViewPivot.common().key] = ABViewPivot;
Views[ABViewLabel.common().key] = ABViewLabel;
Views[ABViewLayout.common().key] = ABViewLayout;
Views[ABViewList.common().key] = ABViewList;
Views[ABViewMenu.common().key] = ABViewMenu;
Views[ABViewGrid.common().key] = ABViewGrid;
Views[ABViewImage.common().key] = ABViewImage;
Views[ABViewTab.common().key] = ABViewTab;
Views[ABViewText.common().key] = ABViewText;
Views[ABViewKanban.common().key] = ABViewKanban;

Views[ABViewDetail.common().key] = ABViewDetail;
Views[ABViewDetailCheckbox.common().key] = ABViewDetailCheckbox;
Views[ABViewDetailCustom.common().key] = ABViewDetailCustom;
Views[ABViewDetailConnect.common().key] = ABViewDetailConnect;
Views[ABViewDetailImage.common().key] = ABViewDetailImage;
Views[ABViewDetailSelectivity.common().key] = ABViewDetailSelectivity;
Views[ABViewDetailText.common().key] = ABViewDetailText;
Views[ABViewDetailTree.common().key] = ABViewDetailTree;

Views[ABViewForm.common().key] = ABViewForm;
Views[ABViewFormButton.common().key] = ABViewFormButton;
Views[ABViewFormCheckbox.common().key] = ABViewFormCheckbox;
Views[ABViewFormConnect.common().key] = ABViewFormConnect;
Views[ABViewFormCustom.common().key] = ABViewFormCustom;
Views[ABViewFormDatepicker.common().key] = ABViewFormDatepicker;
Views[ABViewFormNumber.common().key] = ABViewFormNumber;
//Views[ABViewFormSelectMultiple.common().key] = ABViewFormSelectMultiple;
Views[ABViewFormSelectSingle.common().key] = ABViewFormSelectSingle;
Views[ABViewFormReadonly.common().key] = ABViewFormReadonly;
Views[ABViewFormTextbox.common().key] = ABViewFormTextbox;
Views[ABViewFormTree.common().key] = ABViewFormTree;
*/
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
         var err = new Error("unknown view key");
         OP.Error.log("Unknown view key [" + values.key + "]:", {
            error: err,
            values: values,
            application: application
         });
         return null;
      }
   }
};
