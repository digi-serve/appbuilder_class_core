const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewOrgChartTeamsPropertyComponentDefaults = {
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

const ABViewOrgChartTeamsDefaults = {
   key: "orgchart_teams", // {string} unique key for this view
   icon: "users", // {string} fa-[icon] reference for this view
   labelKey: "Teams", // {string} the multilingual label key for the class label
};

module.exports = class ABViewOrgChartTeamsCore extends ABViewWidget {
   constructor(values, application, parent, defaultValues) {
      super(
         values,
         application,
         parent,
         defaultValues || ABViewOrgChartTeamsDefaults
      );
   }

   static common() {
      return ABViewOrgChartTeamsDefaults;
   }

   static defaultValues() {
      return ABViewOrgChartTeamsPropertyComponentDefaults;
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
         ABViewOrgChartTeamsPropertyComponentDefaults.datacollectionID;

      this.settings.fields =
         this.settings.fields ??
         ABViewOrgChartTeamsPropertyComponentDefaults.fields;

      this.settings.direction =
         this.settings.direction ??
         ABViewOrgChartTeamsPropertyComponentDefaults.direction;

      this.settings.depth = parseInt(
         this.settings.depth ??
            ABViewOrgChartTeamsPropertyComponentDefaults.depth
      );

      this.settings.color =
         this.settings.color ??
         ABViewOrgChartTeamsPropertyComponentDefaults.color;

      this.settings.pan = JSON.parse(
         this.settings.pan ?? ABViewOrgChartTeamsPropertyComponentDefaults.pan
      );

      this.settings.zoom = JSON.parse(
         this.settings.zoom ?? ABViewOrgChartTeamsPropertyComponentDefaults.zoom
      );

      this.settings.height = parseInt(
         this.settings.height ??
            ABViewOrgChartTeamsPropertyComponentDefaults.height
      );

      this.settings.export = JSON.parse(
         this.settings.export ??
            ABViewOrgChartTeamsPropertyComponentDefaults.export
      );

      this.settings.exportFilename =
         this.settings.exportFilename ??
         ABViewOrgChartTeamsPropertyComponentDefaults.exportFilename;
   }

   get datacollection() {
      const datacollectionID = (this.settings || {}).datacollectionID;

      return this.AB.datacollectionByID(datacollectionID);
   }

   getValueFields(object) {
      // OrgChart supports only one parent node.
      return (
         object?.connectFields(
            (f) => f.linkType() == "many" && f.linkViaType() == "one"
         ) ?? []
      );
   }

   /**
    * @function valueFields()
    * Return IDs of connect field for each layer of OrgChart, starting from the top to the bottom.
    *
    * @return {Array}
    *
    */
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
