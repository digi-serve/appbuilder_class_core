const ABViewChartContainer = require("../../platform/views/ABViewChartContainer");

const ABViewChartPiePropertyComponentDefaults = {
   pieType: "pie",
   isLegend: 1,
   // chartWidth: 600,
   height: 200,
   innerFontSize: 12,
   labelFontSize: 12,
};

const ABViewDefaults = {
   key: "pie", // {string} unique key for this view
   icon: "pie-chart", // {string} fa-[icon] reference for this view
   labelKey: "Pie", // {string} the multilingual label key for the class label
};

module.exports = class ABViewChartPieCore extends ABViewChartContainer {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewChartPiePropertyComponentDefaults;
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

      this.settings.pieType =
         this.settings.pieType ||
         ABViewChartPiePropertyComponentDefaults.pieType;

      this.settings.isLegend = parseInt(
         this.settings.isLegend ??
            ABViewChartPiePropertyComponentDefaults.isLegend
      );

      // this.settings.chartWidth = parseInt(this.settings.chartWidth || ABViewChartPiePropertyComponentDefaults.chartWidth);
      this.settings.height = parseInt(
         this.settings.height ?? ABViewChartPiePropertyComponentDefaults.height
      );

      this.settings.innerFontSize = parseInt(
         this.settings.innerFontSize ??
            ABViewChartPiePropertyComponentDefaults.innerFontSize
      );
      this.settings.labelFontSize = parseInt(
         this.settings.labelFontSize ??
            ABViewChartPiePropertyComponentDefaults.labelFontSize
      );

      this.translate(this, this, ["pieLabel"]);
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }
};
