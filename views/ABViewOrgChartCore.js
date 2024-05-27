const ABViewContainer = require("../../platform/views/ABViewContainer");

const ABViewOrgChartPropertyComponentDefaults = {
   dataviewID: "",
   columnValue: "",
   columnLabel: "",
   columnValue2: "",
   isPercentage: 1,
   showLabel: 1,
   labelPosition: "left",
   labelWidth: 120,
   height: 200,
   multipleSeries: 0,
};

const ABViewOrgChartDefaults = {
   key: "orgchart", // {string} unique key for this view
   icon: "sitemap", // {string} fa-[icon] reference for this view
   labelKey: "OrgChart", // {string} the multilingual label key for the class label
};

module.exports = class ABViewOrgChartCore extends ABViewContainer {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABViewOrgChartDefaults
      );
   }

   static common() {
      return ABViewOrgChartDefaults;
   }

   static defaultValues() {
      return ABViewOrgChartPropertyComponentDefaults;
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

      this.settings.dataviewID =
         this.settings.dataviewID ??
         ABViewOrgChartPropertyComponentDefaults.dataviewID;

      this.settings.columnValue =
         this.settings.columnValue ??
         ABViewOrgChartPropertyComponentDefaults.columnValue;

      this.settings.columnLabel =
         this.settings.columnLabel ??
         ABViewOrgChartPropertyComponentDefaults.columnLabel;

      this.settings.columnValue2 =
         this.settings.columnValue2 ??
         ABViewOrgChartPropertyComponentDefaults.columnValue2;

      this.settings.isPercentage = parseInt(
         this.settings.isPercentage ??
            ABViewOrgChartPropertyComponentDefaults.isPercentage
      );

      this.settings.showLabel = parseInt(
         this.settings.showLabel ??
            ABViewOrgChartPropertyComponentDefaults.showLabel
      );

      this.settings.labelPosition =
         this.settings.labelPosition ||
         ABViewOrgChartPropertyComponentDefaults.labelPosition;

      this.settings.labelWidth = parseInt(
         this.settings.labelWidth ??
            ABViewOrgChartPropertyComponentDefaults.labelWidth
      );

      this.settings.height = parseInt(
         this.settings.height ?? ABViewOrgChartPropertyComponentDefaults.height
      );

      this.settings.multipleSeries = parseInt(
         this.settings.multipleSeries ??
            ABViewOrgChartPropertyComponentDefaults.multipleSeries
      );

      this.translate(this, this, ["chartLabel"]);
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      const viewsToAllow = ["label", "pie", "bar", "line", "area"];
      return this.application.viewAll((c) => {
         return viewsToAllow.indexOf(c.common().key) > -1;
      });
   }

   labelField() {
      const dc = this.datacollection;
      if (!dc) return null;

      const obj = dc.datasource;
      if (!obj) return null;

      return obj.fieldByID(this.settings.columnLabel);
   }

   valueField() {
      const dc = this.datacollection;
      if (!dc) return null;

      const obj = dc.datasource;
      if (!obj) return null;

      return obj.fieldByID(this.settings.columnValue);
   }

   valueField2() {
      const dc = this.datacollection;
      if (!dc) return null;

      const obj = dc.datasource;
      if (!obj) return null;

      return obj.fieldByID(this.settings.columnValue2);
   }
};
