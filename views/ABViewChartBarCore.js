const ABViewChartContainer = require("../../platform/views/ABViewChartContainer");

const ABViewChartBarPropertyComponentDefaults = {
   barType: "bar",
   barPreset: "column",
   isLegend: 1,
   // chartWidth: 600,
   height: 200,
   labelFontSize: 12,
   stepValue: 20,
   maxValue: 100,
};

const ABViewDefaults = {
   key: "bar", // {string} unique key for this view
   icon: "bar-chart", // {string} fa-[icon] reference for this view
   labelKey: "Bar", // {string} the multilingual label key for the class label
};

module.exports = class ABViewChartBarCore extends ABViewChartContainer {
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABViewDefaults);
   }

   static common() {
      return ABViewDefaults;
   }

   static defaultValues() {
      return ABViewChartBarPropertyComponentDefaults;
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

      this.settings.barType =
         this.settings.barType ||
         ABViewChartBarPropertyComponentDefaults.barType;

      this.settings.barPreset =
         this.settings.barPreset ||
         ABViewChartBarPropertyComponentDefaults.barPreset;

      this.settings.isLegend = parseInt(
         this.settings.isLegend ??
            ABViewChartBarPropertyComponentDefaults.isLegend
      );

      // this.settings.chartWidth = parseInt(this.settings.chartWidth || ABViewChartBarPropertyComponentDefaults.chartWidth);
      this.settings.height = parseInt(
         this.settings.height ?? ABViewChartBarPropertyComponentDefaults.height
      );

      this.settings.labelFontSize = parseInt(
         this.settings.labelFontSize ??
            ABViewChartBarPropertyComponentDefaults.labelFontSize
      );
      this.settings.stepValue = parseInt(
         this.settings.stepValue ??
            ABViewChartBarPropertyComponentDefaults.stepValue
      );
      this.settings.maxValue = parseInt(
         this.settings.maxValue ??
            ABViewChartBarPropertyComponentDefaults.maxValue
      );

      this.translate(this, this, ["barLabel"]);
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }
};
