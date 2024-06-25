const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewOrgChartPropertyComponentDefaults = {
   datacollectionID: "",
   columnValue: "",
   columnDescription: "",
   direction: "t2b",
   depth: 2,
   // visibleLevel: 2,
   pan: 1,
   zoom: 1,
   height: 0,
   export: 0,
   exportFilename: "",
};

const ABViewOrgChartDefaults = {
   key: "orgchart", // {string} unique key for this view
   icon: "sitemap", // {string} fa-[icon] reference for this view
   labelKey: "OrgChart", // {string} the multilingual label key for the class label
};

module.exports = class ABViewOrgChartCore extends ABViewWidget {
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

      this.settings.datacollectionID =
         this.settings.datacollectionID ??
         ABViewOrgChartPropertyComponentDefaults.datacollectionID;

      this.settings.columnValue =
         this.settings.columnValue ??
         ABViewOrgChartPropertyComponentDefaults.columnValue;

      this.settings.direction =
         this.settings.direction ??
         ABViewOrgChartPropertyComponentDefaults.direction;

      this.settings.depth = parseInt(
         this.settings.depth ?? ABViewOrgChartPropertyComponentDefaults.depth
      );

      this.settings.pan = JSON.parse(
         this.settings.pan ?? ABViewOrgChartPropertyComponentDefaults.pan
      );

      this.settings.zoom = JSON.parse(
         this.settings.zoom ?? ABViewOrgChartPropertyComponentDefaults.zoom
      );

      this.settings.height = parseInt(
         this.settings.height ?? ABViewOrgChartPropertyComponentDefaults.height
      );

      this.settings.export = JSON.parse(
         this.settings.export ?? ABViewOrgChartPropertyComponentDefaults.export
      );

      this.settings.exportFilename =
         this.settings.exportFilename ??
         ABViewOrgChartPropertyComponentDefaults.exportFilename;
   }

   get datacollection() {
      const datacollectionID = (this.settings || {}).datacollectionID;

      return this.AB.datacollectionByID(datacollectionID);
   }

   get connectFields() {
      const dc = this.datacollection;

      return (
         dc?.datasource?.connectFields(
            (f) => f.linkType() == "many" && f.linkViaType() == "one"
         ) ?? []
      );
   }

   valueField() {
      return this.datacollection?.datasource?.fieldByID?.(
         this.settings.columnValue
      );
   }

   descriptionField() {
      return this.valueField()?.datasourceLink?.fieldByID?.(
         this.settings.columnDescription
      );
   }
};
