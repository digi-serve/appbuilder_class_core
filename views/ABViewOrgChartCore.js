const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewOrgChartPropertyComponentDefaults = {
   datacollectionID: "",
   fields: "",
   direction: "t2b",
   depth: 99,
   color: "#00BCD4",
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

      this.settings.fields =
         this.settings.fields ?? ABViewOrgChartPropertyComponentDefaults.fields;

      this.settings.direction =
         this.settings.direction ??
         ABViewOrgChartPropertyComponentDefaults.direction;

      this.settings.depth = parseInt(
         this.settings.depth ?? ABViewOrgChartPropertyComponentDefaults.depth
      );

      this.settings.color =
         this.settings.color ?? ABViewOrgChartPropertyComponentDefaults.color;

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

   getValueFields(object) {
      return (
         object?.connectFields(
            (f) => f.linkType() == "many" && f.linkViaType() == "one"
         ) ?? []
      );
   }

   valueFields() {
      let fieldValues = (this.settings?.fields ?? "").split(",");
      if (!Array.isArray(fieldValues)) fieldValues = [fieldValues];

      const result = [];

      let obj = this.datacollection?.datasource;
      fieldValues.forEach((fId) => {
         if (!fId) return;

         const field = obj?.fieldByID?.(fId);
         if (!field) return;

         result.push(field);
         obj = field.datasourceLink;
      });

      return result;
   }

   // descriptionField() {
   //    return this.valueField()?.datasourceLink?.fieldByID?.(
   //       this.settings.columnDescription
   //    );
   // }
};
