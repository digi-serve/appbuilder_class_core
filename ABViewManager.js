/*
 * ABViewManager
 *
 * An interface for managing the different ABViews available in our AppBuilder.
 *
 */

const ABView = require("../platform/views/ABView");
const ABViewCarousel = require("../platform/views/ABViewCarousel");
const ABViewChart = require("../platform/views/ABViewChart");
const ABViewChartPie = require("../platform/views/ABViewChartPie");
const ABViewChartBar = require("../platform/views/ABViewChartBar");
const ABViewChartLine = require("../platform/views/ABViewChartLine");
const ABViewChartArea = require("../platform/views/ABViewChartArea");
const ABViewComment = require("../platform/views/ABViewComment");
const ABViewConditionalContainer = require("../platform/views/ABViewConditionalContainer");
const ABViewContainer = require("../platform/views/ABViewContainer");
const ABViewDocxBuilder = require("../platform/views/ABViewDocxBuilder");
const ABViewPage = require("../platform/views/ABViewPage");
// const ABViewPivot = require("../platform/views/ABViewPivot");
const ABViewLabel = require("../platform/views/ABViewLabel");
const ABViewLayout = require("../platform/views/ABViewLayout");
// const ABViewList = require("../platform/views/ABViewList");
const ABViewMenu = require("../platform/views/ABViewMenu");
const ABViewGrid = require("../platform/views/ABViewGrid");
// const ABViewImage = require("../platform/views/ABViewImage");
const ABViewTab = require("../platform/views/ABViewTab");
// const ABViewText = require("../platform/views/ABViewText");
// const ABViewKanban = require("../platform/views/ABViewKanban");

const ABViewDetail = require("../platform/views/ABViewDetail");
const ABViewDetailCheckbox = require("../platform/views/ABViewDetailCheckbox");
const ABViewDetailCustom = require("../platform/views/ABViewDetailCustom");
const ABViewDetailImage = require("../platform/views/ABViewDetailImage");
const ABViewDetailSelectivity = require("../platform/views/ABViewDetailSelectivity");
const ABViewDetailText = require("../platform/views/ABViewDetailText");
const ABViewDetailTree = require("../platform/views/ABViewDetailTree");

const ABViewForm = require("../platform/views/ABViewForm");
const ABViewFormButton = require("../platform/views/ABViewFormButton");
const ABViewFormCheckbox = require("../platform/views/ABViewFormCheckbox");
const ABViewFormConnect = require("../platform/views/ABViewFormConnect");
const ABViewFormCustom = require("../platform/views/ABViewFormCustom");
const ABViewFormDatepicker = require("../platform/views/ABViewFormDatepicker");
const ABViewFormNumber = require("../platform/views/ABViewFormNumber");
const ABViewFormSelectSingle = require("../platform/views/ABViewFormSelectSingle");
// const ABViewFormReadonly = require("../platform/views/ABViewFormReadonly");
const ABViewFormTextbox = require("../platform/views/ABViewFormTextbox");
const ABViewFormTree = require("../platform/views/ABViewFormTree");

/*
 * Views
 * A name => ABView  hash of the different ABViews available.
 */
var Views = {};
Views[ABView.common().key] = ABView;

Views[ABViewCarousel.common().key] = ABViewCarousel;
Views[ABViewChart.common().key] = ABViewChart;
Views[ABViewChartPie.common().key] = ABViewChartPie;
Views[ABViewChartBar.common().key] = ABViewChartBar;
Views[ABViewChartLine.common().key] = ABViewChartLine;
Views[ABViewChartArea.common().key] = ABViewChartArea;

Views[ABViewComment.common().key] = ABViewComment;
Views[ABViewConditionalContainer.common().key] = ABViewConditionalContainer;
Views[ABViewContainer.common().key] = ABViewContainer;
Views[ABViewDocxBuilder.common().key] = ABViewDocxBuilder;
Views[ABViewPage.common().key] = ABViewPage;
// Views[ABViewPivot.common().key] = ABViewPivot;
Views[ABViewLabel.common().key] = ABViewLabel;
Views[ABViewLayout.common().key] = ABViewLayout;
// Views[ABViewList.common().key] = ABViewList;
Views[ABViewMenu.common().key] = ABViewMenu;
Views[ABViewGrid.common().key] = ABViewGrid;
Views[ABViewTab.common().key] = ABViewTab;
// Views[ABViewText.common().key] = ABViewText;
// Views[ABViewKanban.common().key] = ABViewKanban;

Views[ABViewDetail.common().key] = ABViewDetail;
Views[ABViewDetailCheckbox.common().key] = ABViewDetailCheckbox;
Views[ABViewDetailCustom.common().key] = ABViewDetailCustom;
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
Views[ABViewFormSelectSingle.common().key] = ABViewFormSelectSingle;
// Views[ABViewFormReadonly.common().key] = ABViewFormReadonly;
Views[ABViewFormTextbox.common().key] = ABViewFormTextbox;
Views[ABViewFormTree.common().key] = ABViewFormTree;

module.exports = {
    /**
     * @function allViews
     * return all the currently defined ABViews in an array.
     * @return [{ABView},...]
     */
    allViews: function(fn) {
        fn =
            fn ||
            function() {
                return true;
            };

        var views = [];
        for (var v in Views) {
            var V = Views[v];
            if (fn(V)) {
                views.push(V);
            }
        }
        return views;
    },

    /**
     * @function newView
     * return an instance of an ABView based upon the values.key value.
     * @return {ABView}
     */
    newView: function(values, application, parent) {
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
