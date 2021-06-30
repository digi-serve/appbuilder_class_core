const ABComponent = require("../platform/ABComponent");

/**
 *  support get data from objects and queries
 */
function getFieldVal(rowData, field) {
   if (!field) return null;
   if (!field.columnName) return null;
   // if rowData is an array, then pull the first element to get value
   if (rowData && rowData[0]) rowData = rowData[0];

   let columnId = field.id;
   let columnName = field.columnName;

   let value = null;
   if (columnName.indexOf(".") > -1) {
      let colName = columnName.split(".")[1];
      value = rowData[columnName] || rowData[colName] || rowData[columnId];
   } else {
      value = rowData[columnName] || rowData[columnId];
   }

   if (value) {
      return value;
   }

   // otherwise, this might be a process check where the rowData keys have
   // '[diagramID].[field.id]'
   for (var k in rowData) {
      var key = k.split(".")[1];
      if (key && key == field.id) {
         value = rowData[k];
      }
   }
   return value;
}

module.exports = class RowFilter extends ABComponent {
   constructor(App, idBase) {
      idBase = idBase || "ab_row_filter";

      super(App, idBase);

      this.Account = { username: "??" };
      this._settings = {};
      this.config_settings = {};
      // var batchName; // we need to revert to this default when switching away from a in/by query field

      this._QueryFields = [];
      this._Fields;

      // internal business logic
      var _logic = (this._logic = {
         callbacks: {
            onChange: () => {}
         },

         /**
          * @method getValue
          *
          * @return {JSON} -
          * {
          * 		glue: '', // 'and', 'or'
          *		rules: [
          *			{
          *				key:	'column name',
          *				rule:	'rule',
          *				value:	'value'
          *			}
          *		]
          * }
          */
         getValue: () => {
            return this.config_settings;
         },

         removeHtmlTags: function(text) {
            let result = "";
            try {
               let div = document.createElement("div");
               div.innerHTML = text;

               result = div.textContent || div.innerText || "";
            } catch (err) {
               result = (text || "").replace(/(<([^>]+)>)/gi, "");
            }

            return result;
         },

         textValid: function(rowData, field, rule, compareValue) {
            var result = false;

            var value = getFieldVal(rowData, field);
            if (value == null) value = "";

            value = value.trim().toLowerCase();
            value = _logic.removeHtmlTags(value); // remove html tags - rich text editor

            compareValue = compareValue
               .trim()
               .toLowerCase()
               .replace(/  +/g, " ");

            // support "john smith" => "john" OR/AND "smith"
            var compareArray = compareValue.split(" ");

            switch (rule) {
               case "contains":
                  compareArray.forEach((val) => {
                     if (result == false)
                        // OR
                        result = value.indexOf(val) > -1;
                  });
                  break;
               case "not_contains":
                  result = true;
                  compareArray.forEach((val) => {
                     if (result == true)
                        // AND
                        result = value.indexOf(val) < 0;
                  });
                  break;
               case "equals":
                  compareArray.forEach((val) => {
                     if (result == false)
                        // OR
                        result = value == val;
                  });
                  break;
               case "not_equal":
                  result = true;
                  compareArray.forEach((val) => {
                     if (result == true)
                        // AND
                        result = value != val;
                  });
                  break;
               case "is_empty":
                  result = value == null || value == "";
                  break;
               case "is_not_empty":
                  result = value != null && value != "";
                  break;
               default:
                  result = _logic.queryValid(rowData, rule, compareValue);
                  break;
            }

            return result;
         },

         dateValid: function(rowData, field, rule, compareValue) {
            var result = false;

            var value = getFieldVal(rowData, field);
            if (!(value instanceof Date)) value = new Date(value);

            if (!(compareValue instanceof Date))
               compareValue = new Date(compareValue);

            switch (rule) {
               case "equals":
                  result = value == compareValue;
                  break;
               case "not_equal":
                  result = value != compareValue;
                  break;
               case "less":
                  result = value < compareValue;
                  break;
               case "greater":
                  result = value > compareValue;
                  break;
               case "less_or_equal":
                  result = value <= compareValue;
                  break;
               case "greater_or_equal":
                  result = value >= compareValue;
                  break;
               default:
                  result = _logic.queryValid(rowData, rule, compareValue);
                  break;
            }

            return result;
         },

         numberValid: function(rowData, field, rule, compareValue) {
            var result = false;

            var value = getFieldVal(rowData, field);
            value = Number(value);
            compareValue = Number(compareValue);

            switch (rule) {
               case "equals":
                  result = value == compareValue;
                  break;
               case "not_equal":
                  result = value != compareValue;
                  break;
               case "less":
                  result = value < compareValue;
                  break;
               case "greater":
                  result = value > compareValue;
                  break;
               case "less_or_equal":
                  result = value <= compareValue;
                  break;
               case "greater_or_equal":
                  result = value >= compareValue;
                  break;
               default:
                  result = _logic.queryValid(rowData, rule, compareValue);
                  break;
            }

            return result;
         },

         listValid: function(rowData, field, rule, compareValue) {
            var result = false;

            var value = getFieldVal(rowData, field);
            if (value && value.toLowerCase) value = value.toLowerCase();

            compareValue = compareValue.toLowerCase();

            if (!Array.isArray(compareValue)) compareValue = [compareValue];

            switch (rule) {
               case "equals":
                  if (value) result = compareValue.indexOf(value) > -1;
                  break;
               case "not_equal":
                  if (value) result = compareValue.indexOf(value) < 0;
                  else result = true;
                  break;
               default:
                  result = _logic.queryValid(rowData, rule, compareValue);
                  break;
            }

            return result;
         },

         booleanValid: function(rowData, field, rule, compareValue) {
            var result = false;

            var value = getFieldVal(rowData, field);

            switch (rule) {
               case "equals":
                  result = value == compareValue;
                  break;
               case "not_equal":
                  result = value != compareValue;
                  break;
               default:
                  result = _logic.queryValid(rowData, rule, compareValue);
                  break;
            }

            return result;
         },

         userValid: (rowData, field, rule, compareValue) => {
            var result = false;

            var value = getFieldVal(rowData, field);

            // if (Array.isArray(value)) value = [value];

            switch (rule) {
               case "is_current_user":
                  result = value == this.Account.username;
                  break;
               case "is_not_current_user":
                  result = value != this.Account.username;
                  break;
               case "contain_current_user":
                  if (!value) {
                     result = false;
                     break;
                  }
                  if (!Array.isArray(value)) value = [value];

                  result =
                     (value || []).filter((v) => {
                        if (v) {
                           return (v.username || v) == this.Account.username;
                        } else {
                           return false;
                        }
                     }).length > 0;
                  break;
               case "not_contain_current_user":
                  if (!value) {
                     result = false;
                     break;
                  }
                  if (!Array.isArray(value)) value = [value];

                  result =
                     (value || []).filter((v) => {
                        if (v) {
                           return (v.username || v) == this.Account.username;
                        } else {
                           return false;
                        }
                     }).length == 0;
                  break;
               case "equals":
                  result = value.indexOf(compareValue) > -1;
                  break;
               case "not_equal":
                  result = value.indexOf(compareValue) < 0;
                  break;
               default:
                  result = _logic.queryValid(rowData, rule, compareValue);
                  break;
            }

            return result;
         },

         queryValid: (rowData, rule, compareValue) => {
            var result = false;

            if (!this._Application || !compareValue) return result;

            // queryId:fieldId
            var queryId = compareValue.split(":")[0],
               fieldId = compareValue.split(":")[1];

            // if no query
            var query = this.queries((q) => q.id == queryId)[0];
            if (!query) return result;

            // if no field
            var field = query.fields((f) => f.id == fieldId)[0];
            if (!field) return result;

            let qIdBase = "{idBase}-query-field-{id}"
                  .replace("{idBase}", idBase)
                  .replace("{id}", query.id),
               inQueryFieldFilter = new RowFilter(this.App, qIdBase);
            inQueryFieldFilter.Account = this.Account;
            inQueryFieldFilter.applicationLoad(this._Application);
            inQueryFieldFilter.fieldsLoad(query.fields());
            inQueryFieldFilter.setValue(query.workspaceFilterConditions);

            switch (rule) {
               case "in_query_field":
                  result = inQueryFieldFilter.isValid(rowData);
                  break;
               case "not_in_query_field":
                  result = !inQueryFieldFilter.isValid(rowData);
                  break;
            }

            return result;
         },

         inQueryValid: (rowData, columnName, rule, compareValue) => {
            let result = false;

            if (columnName) {
               rowData = rowData[columnName] || {};
            }

            if (!compareValue || !this._Application) return result;

            // if no query
            let query = this.queries((q) => q.id == compareValue)[0];
            if (!query) return result;

            let qIdBase = "{idBase}-query-{id}"
                  .replace("{idBase}", idBase)
                  .replace("{id}", query.id),
               inQueryFilter = new RowFilter(this.App, qIdBase);
            inQueryFilter.Account = this.Account;
            inQueryFilter.applicationLoad(this._Application);
            inQueryFilter.fieldsLoad(query.fields());
            inQueryFilter.setValue(query.workspaceFilterConditions);

            switch (rule) {
               case "in_query":
                  result = inQueryFilter.isValid(rowData);
                  break;
               case "not_in_query":
                  result = !inQueryFilter.isValid(rowData);
                  break;
            }

            return result;
         },

         dataCollectionValid: (rowData, columnName, rule, compareValue) => {
            var result = false;

            if (!compareValue || !this._Application) return result;

            if (columnName) {
               rowData = rowData[columnName] || {};
            }

            let dc = this._Application.datacollections(
               (d) => d.id == compareValue
            )[0];

            switch (rule) {
               case "in_data_collection":
                  if (!dc) return false;

                  result =
                     dc.getData(
                        (d) => (d.id || d.uuid) == (rowData.id || rowData.uuid)
                     ).length > 0;
                  break;
               case "not_in_data_collection":
                  if (!dc) return true;

                  result =
                     dc.getData(
                        (d) => (d.id || d.uuid) == (rowData.id || rowData.uuid)
                     ).length < 1;
                  break;
            }

            return result;
         },

         connectFieldValid: function(rowData, field, rule, compareValue) {
            let relationName = field.relationName();
            let columnName = field.columnName;

            let connectedVal = "";

            if (rowData) {
               if (rowData[relationName]) {
                  connectedVal = (
                     (field.indexField
                        ? rowData[relationName][field.indexField.columnName]
                        : false) || // custom index
                     (field.indexField2
                        ? rowData[relationName][field.indexField2.columnName]
                        : false) || // custom index 2
                     rowData[relationName].id ||
                     rowData[relationName]
                  )
                     .toString()
                     .toLowerCase();
               } else if (rowData[columnName] != null) {
                  connectedVal = rowData[columnName];
               }
            }

            let compareValueLowercase = (compareValue || "").toLowerCase();

            switch (rule) {
               case "contains":
                  return (
                     connectedVal.toString().indexOf(compareValueLowercase) > -1
                  );
               case "not_contains":
                  return (
                     connectedVal.toString().indexOf(compareValueLowercase) ==
                     -1
                  );
               case "equals":
                  return connectedVal == compareValueLowercase;
               case "not_equal":
                  return connectedVal != compareValueLowercase;
               case "in_query":
               case "not_in_query":
                  return _logic.inQueryValid(
                     rowData,
                     relationName,
                     rule,
                     compareValue
                  );
               case "is_current_user":
               case "is_not_current_user":
               case "contain_current_user":
               case "not_contain_current_user":
                  return _logic.userValid(rowData, field, rule, compareValue);
               case "is_empty":
                  return (
                     rowData[relationName] == null ||
                     rowData[relationName].length < 1 ||
                     rowData[relationName] == ""
                  );
               case "is_not_empty":
                  return (
                     rowData[relationName] != null &&
                     ((Array.isArray(rowData[relationName]) &&
                        rowData[relationName].length > 0) ||
                        rowData[relationName] != "")
                  );
               case "in_data_collection":
               case "not_in_data_collection":
                  return _logic.dataCollectionValid(
                     rowData,
                     relationName,
                     rule,
                     compareValue
                  );
            }
         },

         thisObjectValid: (rowData, rule, compareValue) => {
            let result = false;

            switch (rule) {
               // if in_query condition
               case "in_query":
               case "not_in_query":
                  if (!this._Application || !this._Object) return result;

                  // if > 1 copy of this object in query ==> Error!
                  let query = this.queries((q) => q.id == compareValue)[0];
                  if (!query) return result;

                  var listThisObjects = query.objects((o) => {
                     return o.id == this._Object.id;
                  });
                  if (listThisObjects.length > 1) {
                     // Alternative: choose the 1st instance of this object in the query, and make the compare on that.
                     // Be sure to warn the developer of the limitiations of an "this_object" "in_query"  when query has > 1 copy of
                     // this object as part of the query.

                     console.error(
                        "HEY!  Can't compare this_object to a query that has > 1 copy of that object!"
                     );
                     return true;
                  }

                  // get this object's alias from the query
                  var alias = query.objectAlias(this._Object.id);

                  // make sure all my columns in rowData are prefixed by "alias".columnName
                  var newRowData = {};
                  Object.keys(rowData).forEach((key) => {
                     newRowData[`${alias}.${key}`] = rowData[key];
                  });

                  // then pass this on to the _logic.queryValid();
                  return _logic.inQueryValid(
                     newRowData,
                     null,
                     rule,
                     compareValue
                  );
                  break;

               // if in_datacollection condition
               case "in_data_collection":
               case "not_in_data_collection":
                  // send rowData, null to datacollectionValid()
                  return _logic.dataCollectionValid(
                     rowData,
                     null,
                     rule,
                     compareValue
                  );
                  break;
            }
         }
      });

      // Interface methods for parent component:
      // this.objectLoad = _logic.objectLoad;
      // this.viewLoad = _logic.viewLoad;
      this.getValue = _logic.getValue;
      // this.setValue = _logic.setValue;
      // this.isValid = _logic.isValid;
   }

   init(options) {
      if (options.showObjectName) {
         this._settings.showObjectName = options.showObjectName;
      }
   }

   /**
    * @method isValid
    * validate the row data is valid filter condition
    *
    * @param rowData {Object} - data row
    */
   isValid(rowData) {
      var config_settings = this.config_settings;
      var _logic = this._logic;

      // If no conditions, then return true
      if (
         config_settings == null ||
         config_settings.rules == null ||
         config_settings.rules.length == 0
      )
         return true;

      if (rowData == null) return false;

      var result = config_settings.glue === "and" ? true : false;

      config_settings.rules.forEach((filter) => {
         if (!filter.key || !filter.rule) return;

         var fieldInfo = this._Fields.filter((f) => f.id == filter.key)[0];
         if (!fieldInfo) return;

         var condResult;

         // Filters that have "this_object" don't have a fieldInfo.key, so in that case,
         // define a special .key == "this_object"
         var ruleFieldType = fieldInfo.key;
         if (typeof fieldInfo.key == "undefined") {
            if (fieldInfo.id != "this_object") {
               fieldInfo.key = "connectField"; // if you are looking at the parent object it won't have a key to analyze
               ruleFieldType = fieldInfo.key;
            } else ruleFieldType = "this_object";
         }

         switch (ruleFieldType) {
            case "string":
            case "LongText":
            case "email":
               condResult = _logic.textValid(
                  rowData,
                  fieldInfo,
                  filter.rule,
                  filter.value
               );
               break;
            case "date":
            case "datetime":
               condResult = _logic.dateValid(
                  rowData,
                  fieldInfo,
                  filter.rule,
                  filter.value
               );
               break;
            case "number":
               condResult = _logic.numberValid(
                  rowData,
                  fieldInfo,
                  filter.rule,
                  filter.value
               );
               break;
            case "list":
               condResult = _logic.listValid(
                  rowData,
                  fieldInfo,
                  filter.rule,
                  filter.value
               );
               break;
            case "boolean":
               condResult = _logic.booleanValid(
                  rowData,
                  fieldInfo,
                  filter.rule,
                  filter.value
               );
               break;
            case "user":
               condResult = _logic.userValid(
                  rowData,
                  fieldInfo,
                  filter.rule,
                  filter.value
               );
               break;
            case "connectField":
            case "connectObject":
               condResult = _logic.connectFieldValid(
                  rowData,
                  fieldInfo,
                  filter.rule,
                  filter.value
               );
               break;
            case "this_object":
               condResult = _logic.thisObjectValid(
                  rowData,
                  filter.rule,
                  filter.value
               );
               break;
         }

         if (config_settings.glue === "and") {
            result = result && condResult;
         } else {
            result = result || condResult;
         }
      });

      return result;
   }

   /**
    * @method applicationLoad
    * set application
    *
    * @param application {ABApplication}
    */
   applicationLoad(application) {
      this._Application = application;
   }

   /**
    * @method fieldsLoad
    * set fields
    *
    * @param array {ABField}
    * @param object {ABObject} [optional]
    */
   fieldsLoad(fields = [], object = null) {
      this._Fields = fields.filter((f) => f && f.fieldIsFilterable());
      this._QueryFields = this._Fields
         ? this._Fields.filter((f) => f && f.key == "connectObject")
         : [];

      // insert our 'this object' entry if an Object was given.
      if (object) {
         this._Object = object;

         let thisObjOption = {
            id: "this_object",
            label: object.label
         };

         // If object is query ,then should define default alias: "BASE_OBJECT"
         if (object.viewName) {
            thisObjOption.alias = "BASE_OBJECT";
         }

         this._Fields.unshift(thisObjOption);
      } else {
         delete this._Object;
      }
   }

   queriesLoad(queries = []) {
      this._Queries = queries;
   }

   /**
    * @method queries()
    *
    * return an array of all the ABObjectQuery.
    *
    * @param filter {Object}
    *
    * @return {array}
    */
   queries(filter) {
      filter =
         filter ||
         function() {
            return true;
         };

      let result = [];

      if (this._Application) {
         result = result.concat(this._Application.queries(filter));
      }

      if (this._Queries) {
         result = result.concat(
            (this._Queries || []).filter(
               (q) => filter(q) && result.filter((r) => r.id == q.id).length < 1
            )
         );
      }

      return result;
   }

   setValue(settings) {
      this.config_settings = settings || {};

      this.config_settings.rules = this.config_settings.rules || [];
   }
};

