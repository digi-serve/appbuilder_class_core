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
   require("../platform/mobile/ABMobilePage"),
   require("../platform/mobile/ABMobileView"),
   require("../platform/mobile/ABMobileViewForm"),
   require("../platform/mobile/ABMobileViewFormButton"),
   require("../platform/mobile/ABMobileViewFormCheckbox"),
   require("../platform/mobile/ABMobileViewFormReadonly"),
   require("../platform/mobile/ABMobileViewFormTextbox"),
   require("../platform/mobile/ABMobileViewLabel"),
   require("../platform/mobile/ABMobileViewList"),
].forEach((v) => {
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
};
