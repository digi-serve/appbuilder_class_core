import Import_ABMobilePage from "../platform/mobile/ABMobilePage.js";
import Import_ABMobileView from "../platform/mobile/ABMobileView.js";
import Import_ABMobileViewCustom from "../platform/mobile/ABMobileViewCustom.js";
import Import_ABMobileViewForm from "../platform/mobile/ABMobileViewForm.js";
import Import_ABMobileViewFormButton from "../platform/mobile/ABMobileViewFormButton.js";
import Import_ABMobileViewFormCheckbox from "../platform/mobile/ABMobileViewFormCheckbox.js";
import Import_ABMobileViewFormConnect from "../platform/mobile/ABMobileViewFormConnect.js";
import Import_ABMobileViewFormDate from "../platform/mobile/ABMobileViewFormDate.js";
import Import_ABMobileViewFormDatetime from "../platform/mobile/ABMobileViewFormDatetime.js";
import Import_ABMobileViewFormEmail from "../platform/mobile/ABMobileViewFormEmail.js";
import Import_ABMobileViewFormFile from "../platform/mobile/ABMobileViewFormFile.js";
import Import_ABMobileViewFormFormula from "../platform/mobile/ABMobileViewFormFormula.js";
import Import_ABMobileViewFormImage from "../platform/mobile/ABMobileViewFormImage.js";
import Import_ABMobileViewFormNumber from "../platform/mobile/ABMobileViewFormNumber.js";
import Import_ABMobileViewFormReadonly from "../platform/mobile/ABMobileViewFormReadonly.js";
import Import_ABMobileViewFormSelectMultiple from "../platform/mobile/ABMobileViewFormSelectMultiple.js";
import Import_ABMobileViewFormSelectSingle from "../platform/mobile/ABMobileViewFormSelectSingle.js";
import Import_ABMobileViewFormTextbox from "../platform/mobile/ABMobileViewFormTextbox.js";
import Import_ABMobileViewLabel from "../platform/mobile/ABMobileViewLabel.js";
import Import_ABMobileViewList from "../platform/mobile/ABMobileViewList.js";
import Import_ABMobileViewTimeline from "../platform/mobile/ABMobileViewTimeline.js";

/*
 * ABViewManagerMobile
 *
 * An interface for managing the different ABViews available in our AppBuilder.
 *
 */

/*
 * Views
 * A name => ABView  hash of the different ABViews available.
 */
var Views = {};
[
   Import_ABMobilePage,
   Import_ABMobileView,
   Import_ABMobileViewCustom,
   Import_ABMobileViewForm,
   Import_ABMobileViewFormButton,
   Import_ABMobileViewFormCheckbox,
   Import_ABMobileViewFormConnect,
   Import_ABMobileViewFormDate,
   Import_ABMobileViewFormDatetime,
   Import_ABMobileViewFormEmail,
   Import_ABMobileViewFormFile,
   Import_ABMobileViewFormFormula,
   Import_ABMobileViewFormImage,
   Import_ABMobileViewFormNumber,
   Import_ABMobileViewFormReadonly,
   Import_ABMobileViewFormSelectMultiple,
   Import_ABMobileViewFormSelectSingle,
   Import_ABMobileViewFormTextbox,
   Import_ABMobileViewLabel,
   Import_ABMobileViewList,
   Import_ABMobileViewTimeline,
].forEach((v) => {
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
            console.error(
               "!! View[" +
                  values.key +
                  "] not yet defined.  Have an ABView instead:",
            );
            return new Views["mobile-view"](values, application, parent);
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
}
