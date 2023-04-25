const ABViewChartContainer = require("../../platform/views/ABViewChartContainer");

const ABViewChartAreaPropertyComponentDefaults = {
   areaType: "area",
   isLegend: 1,
   // chartWidth: 600,
   chartHeight: 200,
   labelFontSize: 12,
   stepValue: 20,
   maxValue: 100,
};

const ABViewDefaults = {
   key: "area", // {string} unique key for this view
   icon: "area-chart", // {string} fa-[icon] reference for this view
   labelKey: "Area", // {string} the multilingual label key for the class label
};

module.exports = class ABViewChartAreaCore extends ABViewChartContainer {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewChartAreaPropertyComponentDefaults;
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

      this.settings.areaType =
         this.settings.areaType ||
         ABViewChartAreaPropertyComponentDefaults.areaType;

      this.settings.isLegend = parseInt(
         this.settings.isLegend ??
            ABViewChartAreaPropertyComponentDefaults.isLegend
      );

      // this.settings.chartWidth = parseInt(this.settings.chartWidth || ABViewChartAreaPropertyComponentDefaults.chartWidth);
      this.settings.chartHeight = parseInt(
         this.settings.chartHeight ??
            ABViewChartAreaPropertyComponentDefaults.chartHeight
      );

      this.settings.labelFontSize = parseInt(
         this.settings.labelFontSize ??
            ABViewChartAreaPropertyComponentDefaults.labelFontSize
      );
      this.settings.stepValue = parseInt(
         this.settings.stepValue ??
            ABViewChartAreaPropertyComponentDefaults.stepValue
      );
      this.settings.maxValue = parseInt(
         this.settings.maxValue ??
            ABViewChartAreaPropertyComponentDefaults.maxValue
      );

      this.translate(this, this, ["areaLabel"]);
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }
};
