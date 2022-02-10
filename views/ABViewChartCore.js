const ABViewContainer = require("../../platform/views/ABViewContainer");

const ABViewChartPropertyComponentDefaults = {
   dataviewID: null,
   columnValue: null,
   columnLabel: null,
   columnValue2: null,
   isPercentage: true,
   showLabel: true,
   labelPosition: "left",
   labelWidth: 120,
   height: 200,
   multipleSeries: false,
};

const ABViewChartDefaults = {
   key: "chart", // {string} unique key for this view
   icon: "bar-chart", // {string} fa-[icon] reference for this view
   labelKey: "ab.components.chart", // {string} the multilingual label key for the class label
};

module.exports = class ABViewChartCore extends ABViewContainer {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewChartDefaults);
   }

   static common() {
      return ABViewChartDefaults;
   }

   static defaultValues() {
      return ABViewChartPropertyComponentDefaults;
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      this.settings.isPercentage = JSON.parse(
         this.settings.isPercentage ||
            ABViewChartPropertyComponentDefaults.isPercentage
      );

      this.settings.labelPosition =
         this.settings.labelPosition ||
         ABViewChartPropertyComponentDefaults.labelPosition;

      // convert from "0" => true/false
      this.settings.showLabel = JSON.parse(
         this.settings.showLabel != null
            ? this.settings.showLabel
            : ABViewChartPropertyComponentDefaults.showLabel
      );
      this.settings.multipleSeries = JSON.parse(
         this.settings.multipleSeries != null
            ? this.settings.multipleSeries
            : ABViewChartPropertyComponentDefaults.multipleSeries
      );

      // convert from "0" => 0
      this.settings.labelWidth = parseInt(
         this.settings.labelWidth ||
            ABViewChartPropertyComponentDefaults.labelWidth
      );
      this.settings.height = parseInt(
         this.settings.height || ABViewChartPropertyComponentDefaults.height
      );

      this.translate(this, this, ["chartLabel"]);
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      var viewsToAllow = ["label", "pie", "bar", "line", "area"],
         allComponents = this.application.viewAll(); // ABViewManager.allViews();

      var ret = allComponents.filter((c) => {
         return viewsToAllow.indexOf(c.common().key) > -1;
      });
      return ret;
   }

   labelField() {
      var dc = this.datacollection;
      if (!dc) return null;

      var obj = dc.datasource;
      if (!obj) return null;

      return obj.fields((f) => f.id == this.settings.columnLabel)[0];
   }

   valueField() {
      var dc = this.datacollection;
      if (!dc) return null;

      var obj = dc.datasource;
      if (!obj) return null;

      return obj.fields((f) => f.id == this.settings.columnValue)[0];
   }

   valueField2() {
      var dc = this.datacollection;
      if (!dc) return null;

      var obj = dc.datasource;
      if (!obj) return null;

      return obj.fields((f) => f.id == this.settings.columnValue2)[0];
   }
};
