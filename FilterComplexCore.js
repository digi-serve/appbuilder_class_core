const ABComponent = require("../platform/ABComponent");
// const ABObjectQuery = require("../platform/ABObjectQuery");

/**
 *  support get data from objects and queries
 */
function getFieldVal(rowData, field) {
   if (!field) return null;
   if (!field.columnName) return null;
   const columnName = field.columnName;

   let value = null;

   if (columnName.indexOf(".") > -1) {
      let colName = columnName.split(".")[1];
      value = rowData[columnName] || rowData[colName];
   } else {
      value = rowData[columnName];
   }

   if (typeof value != "undefined") {
      return value;
   }

   // otherwise, this might be a process check where the rowData keys have
   // '[diagramID].[field.id]'
   for (const k in rowData) {
      const key = k.split(".")[1];
      if (key && key == field.id) {
         value = rowData[k];
      }
   }
   return value;
}

function getConnectFieldValue(rowData, field) {
   let connectedVal = "";

   if (rowData) {
      let relationName = field.relationName();
      if (rowData[relationName]) {
         connectedVal =
            (field.indexField
               ? rowData[relationName][field.indexField.columnName]
               : null) ?? // custom index
            (field.indexField2
               ? rowData[relationName][field.indexField2.columnName]
               : null) ?? // custom index 2
            rowData[relationName].id ??
            rowData[relationName];
      } else {
         let fieldVal = getFieldVal(rowData, field);
         if (fieldVal != null) {
            connectedVal = fieldVal;
         }
      }
   }
   return connectedVal;
}

module.exports = class FilterComplexCore extends ABComponent {
   constructor(idBase, AB) {
      idBase = idBase || "ab_filter_complex";

      if (typeof AB === "undefined") {
         console.error("FilterComplexCore(): being called without an AB!");
      }

      super(null, idBase, AB);

      this.Account = { username: "??" };
      this._settings = {};
      this.condition = {};
      // const batchName; // we need to revert to this default when switching away from a in/by query field

      this._QueryFields = [];
      this._Fields;

      // internal business logic
      const _logic = (this._logic = {
         callbacks: {
            onChange: () => {},
         },

         removeHtmlTags: function (text) {
            const div = document.createElement("div");
            div.innerHTML = text;

            return div.textContent || div.innerText || "";
         },
      });

      // Interface methods for parent component:
      // this.objectLoad = _logic.objectLoad;
      // this.viewLoad = _logic.viewLoad;
      // this.setValue = _logic.setValue;
      // this.isValid = _logic.isValid;
   }

   init(options) {
      if (options?.showObjectName) {
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
      const condition = this.condition;
      const _logic = this._logic;

      // If no conditions, then return true
      if (
         condition == null ||
         condition.rules == null ||
         condition.rules.length == 0
      )
         return true;

      if (rowData == null) return false;

      let result = condition.glue === "and" ? true : false;

      condition.rules.forEach((filter) => {
         if (!filter.key || !filter.rule) return;

         const fieldInfo = (this._Fields || []).filter(
            (f) => f.id == filter.key
         )[0];

         if (!fieldInfo) return;

         let condResult = null;

         // Filters that have "this_object" don't have a fieldInfo.key, so in that case,
         // define a special .key == "this_object"
         let ruleFieldType = fieldInfo.key;

         if (typeof fieldInfo.key == "undefined") {
            if (fieldInfo.id != "this_object") {
               fieldInfo.key = "connectField"; // if you are looking at the parent object it won't have a key to analyze
               ruleFieldType = fieldInfo.key;
            } else ruleFieldType = "this_object";
         }

         let value = null;

         if (fieldInfo.relationName) {
            value = getConnectFieldValue(rowData, fieldInfo);
         } else {
            value = getFieldVal(rowData, fieldInfo);
         }

         switch (ruleFieldType) {
            case "string":
            case "LongText":
            case "email":
               if (value == null) value = "";

               condResult = this.textValid(value, filter.rule, filter.value);
               break;
            case "date":
            case "datetime":
               condResult = this.dateValid(value, filter.rule, filter.value);
               break;
            case "number":
               condResult = this.numberValid(value, filter.rule, filter.value);
               break;
            case "list":
               condResult = this.listValid(value, filter.rule, filter.value);
               break;
            case "boolean":
               condResult = this.booleanValid(value, filter.rule, filter.value);
               break;
            case "user":
               condResult = this.userValid(value, filter.rule, filter.value);
               break;
            case "connectField":
            case "connectObject":
               condResult = this.connectFieldValid(
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

         if (condition.glue === "and") {
            result = result && condResult;
         } else {
            result = result || condResult;
         }
      });

      return result;
   }

   textValid(value, rule, compareValue) {
      let result = false;

      value = value.trim().toLowerCase();
      value = this._logic.removeHtmlTags(value); // remove html tags - rich text editor

      compareValue = compareValue.trim().toLowerCase().replace(/  +/g, " ");

      // support "john smith" => "john" OR/AND "smith"
      const compareArray = compareValue.split(" ");

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
            result = value == "" || value == null;
            break;
         case "is_not_empty":
            result = value != "" && value != null;
            break;
         default:
            result = this.queryFieldValid(value, rule, compareValue);
            break;
      }

      return result;
   }

   dateValid(value, rule, compareValue) {
      let result = false;

      if (!(value instanceof Date)) value = new Date(value);

      if (!(compareValue instanceof Date))
         compareValue = new Date(compareValue);

      switch (rule) {
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
            result = this.queryFieldValid(value, rule, compareValue);
            break;
      }

      return result;
   }

   numberValid(value, rule, compareValue) {
      let result = false;

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
            result = this.queryFieldValid(value, rule, compareValue);
            break;
      }

      return result;
   }

   listValid(value, rule, compareValue) {
      let result = false;

      // compareValue = compareValue.toLowerCase();

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
            result = this.queryFieldValid(value, rule, compareValue);
            break;
      }

      return result;
   }

   booleanValid(value, rule, compareValue) {
      let result = false;

      switch (rule) {
         case "equals":
            result = value == compareValue;
            break;
         default:
            result = this.queryFieldValid(value, rule, compareValue);
            break;
      }

      return result;
   }

   userValid(value, rule, compareValue) {
      if (!value) return false;
      let result = false;

      // if (Array.isArray(value)) value = [value];

      switch (rule) {
         case "is_current_user":
            result = value == this.Account.username;
            break;
         case "is_not_current_user":
            result = value != this.Account.username;
            break;
         case "contain_current_user":
            if (!Array.isArray(value)) value = [value];

            result =
               value.filter((v) => (v.username || v) == this.Account.username)
                  .length > 0;
            break;
         case "not_contain_current_user":
            if (!Array.isArray(value)) value = [value];

            result =
               value.filter((v) => (v.username || v) == this.Account.username)
                  .length < 1;
            break;
         case "equals":
            result = value.indexOf(compareValue) > -1;
            break;
         case "not_equal":
            result = value.indexOf(compareValue) < 0;
            break;
         default:
            result = this.queryFieldValid(value, rule, compareValue);
            break;
      }

      return result;
   }

   queryFieldValid(rowData, rule, compareValue) {
      let result = false;

      if (!compareValue) return result;

      // queryId:fieldId
      const queryId = compareValue.split(":")[0],
         fieldId = compareValue.split(":")[1];

      // if no query
      const query = this.AB.queries((q) => q.id == queryId)[0];
      if (!query) return result;

      // if no field
      const field = query.fields((f) => f.id == fieldId)[0];
      if (!field) return result;

      let qIdBase = "{idBase}-query-field-{id}"
            .replace("{idBase}", this.idBase)
            .replace("{id}", query.id),
         inQueryFieldFilter = new this.constructor(qIdBase, this.AB);
      inQueryFieldFilter.Account = this.Account;
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
   }

   inQueryValid(rowData, rule, compareValue) {
      let result = false;

      if (!compareValue || !this.AB) return result;

      // if no query
      let query = this.AB.queries((q) => q.id == compareValue)[0];
      if (!query) return result;

      let qIdBase = "{idBase}-query-{id}"
            .replace("{idBase}", this.idBase)
            .replace("{id}", query.id),
         inQueryFilter = new this.constructor(qIdBase, this.AB);
      inQueryFilter.Account = this.Account;
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
   }

   dataCollectionValid(value, rule, compareValue) {
      let result = false;

      if (!compareValue) return result;

      let dc = this.AB.datacollections((d) => d.id == compareValue)[0];

      switch (rule) {
         case "in_data_collection":
            if (!dc) return false;

            result = dc.getData((d) => d.id == value.id).length > 0;
            break;
         case "not_in_data_collection":
            if (!dc) return true;

            result = dc.getData((d) => d.id == value.id).length < 1;
            break;
      }

      return result;
   }

   connectFieldValid(rowData, field, rule, compareValue) {
      let relationName = field.relationName();

      let connectedVal = "";

      if (rowData) {
         if (rowData[relationName]) {
            connectedVal = (
               (field.indexField
                  ? rowData[relationName][field.indexField.columnName]
                  : null) ?? // custom index
               (field.indexField2
                  ? rowData[relationName][field.indexField2.columnName]
                  : null) ?? // custom index 2
               rowData[relationName].id ??
               rowData[relationName]
            )
               .toString()
               .toLowerCase();
         } else {
            let fieldVal = getFieldVal(rowData, field);
            if (fieldVal != null) {
               connectedVal = fieldVal;
            }
         }
      }

      let compareValueLowercase = (compareValue || "").toLowerCase();

      switch (rule) {
         case "contains":
            return connectedVal.toString().indexOf(compareValueLowercase) > -1;
         case "not_contains":
            return connectedVal.toString().indexOf(compareValueLowercase) == -1;
         case "equals":
            return connectedVal == compareValueLowercase;
         case "not_equal":
            return connectedVal != compareValueLowercase;
         case "in_query":
         case "not_in_query":
            return this.inQueryValid(rowData[relationName], rule, compareValue);
         case "is_current_user":
         case "is_not_current_user":
         case "contain_current_user":
         case "not_contain_current_user":
            return this.userValid(connectedVal, rule, compareValue);
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
            return this.dataCollectionValid(connectedVal, rule, compareValue);
      }
   }

   thisObjectValid(rowData, rule, compareValue) {
      let result = false;
      let query = null;
      let listThisObjects = null;
      let alias = null;
      let newRowData = null;

      switch (rule) {
         // if in_query condition
         case "in_query":
         case "not_in_query":
            if (!this._Object) return result;

            // if > 1 copy of this object in query ==> Error!
            query = this.AB.queries((q) => q.id == compareValue)[0];

            if (!query) return result;

            listThisObjects = query.objects((o) => {
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
            alias = query.objectAlias(this._Object.id);

            // make sure all my columns in rowData are prefixed by "alias".columnName
            newRowData = {};

            Object.keys(rowData).forEach((key) => {
               newRowData[`${alias}.${key}`] = rowData[key];
            });

            // then pass this on to the _logic.queryValid();
            return this.inQueryValid(newRowData, rule, compareValue);

         // if in_datacollection condition
         case "in_data_collection":
         case "not_in_data_collection":
            // send rowData, null to datacollectionValid()
            return this.dataCollectionValid(rowData, rule, compareValue);
      }
   }

   processFieldsLoad(processFields = []) {
      if (processFields && !Array.isArray(processFields)) {
         processFields = [processFields];
      }
      this._ProcessFields = processFields;

      this.uiInit();
   }

   /**
    * @method fieldsLoad
    * set fields
    *
    * @param array {ABField}
    * @param object {ABObject} [optional]
    */
   fieldsLoad(fields = [], object = null) {
      this._Fields = fields.filter(
         (f) => f && f.fieldIsFilterable && f.fieldIsFilterable()
      );
      this._QueryFields = this._Fields
         ? this._Fields.filter((f) => f && f.isConnection && f.key != "user")
         : [];

      // insert our 'this object' entry if an Object was given.
      if (object) {
         this._Object = object;

         // insert our uuid in addition to the rest of our fields
         let thisObjOption = {
            id: "this_object",
            label: object.label,
            key: "uuid",
         };

         // If object is query ,then should define default alias: "BASE_OBJECT"
         // NOTE: Could not reference ABObjectQuery because recursive looping reference
         // if (object instanceof ABObjectQuery) {
         if (object.viewName) {
            thisObjOption.alias = "BASE_OBJECT";
         }

         this._Fields.unshift(thisObjOption);
      } else {
         delete this._Object;
      }
   }

   fieldsToQB() {
      /*
      let mapTypes = {
         LongText: "string",
         email: "string",
         datetime: "date",
         connectField: "connectObject"
      };

      const fields = this._Fields.map((f) => {
         // Label
         let label = f.label;
         if (this._settings.showObjectName && f.object && f.object.label)
            label = `${f.object.label}.${f.label}`;

         // Type
         let type = f.key || f.type;
         if (mapTypes[type]) type = mapTypes[type];

         // the format for webix querybuilder:
         // { id  value:"label" type }
         //      type: {string} the type of value it is.
         //            since we want to tailor value selectors per field,
         //            we will make a unique type for each field. and then
         //            add value selectors for that specific .type
         return { id: f.columnName, value: label, type: type };
      });
      return fields;
      */

      let fields = (this._Fields || []).map((f) => {
         let label = f.label;
         if (this._settings.showObjectName && f.object && f.object.label)
            label = `${f.object.label}.${f.label}`;

         let type = "text"; // "text", "number", "date"
         let conditions = [];
         switch (f.key) {
            case "boolean":
               conditions = conditions
                  .concat(this.fieldsAddFiltersBoolean(f))
                  .concat(this.fieldsAddFiltersQueryField(f));
               break;
            case "connectObject":
               conditions = this.fieldsAddFiltersQuery(f);
               break;
            case "date":
            case "datetime":
               type = "date";
               conditions = conditions
                  .concat(this.fieldsAddFiltersDate(f))
                  .concat(this.fieldsAddFiltersQueryField(f));
               break;
            case "calculate":
            case "formula":
            case "number":
               type = "number";
               conditions = conditions
                  .concat(this.fieldsAddFiltersNumber(f))
                  .concat(this.fieldsAddFiltersQueryField(f));
               break;
            case "string":
            case "LongText":
            case "email":
            case "AutoIndex":
               conditions = conditions
                  .concat(this.fieldsAddFiltersString(f))
                  .concat(this.fieldsAddFiltersQueryField(f));
               break;
            case "list":
               conditions = conditions
                  .concat(this.fieldsAddFiltersList(f))
                  .concat(this.fieldsAddFiltersQueryField(f));
               break;
            case "user":
               conditions = conditions
                  .concat(this.fieldsAddFiltersUser(f))
                  .concat(this.fieldsAddFiltersQueryField(f));
               break;
            case "uuid":
               conditions = conditions.concat(
                  this.fieldsAddFiltersThisObject(f)
               );
               break;
            default:
               type = "text";
               break;
         }

         if (this._isRecordRule) {
            conditions = conditions.concat(this.fieldsAddFiltersRecordRule(f));
         }

         let isProcessField =
            (this._ProcessFields || []).filter((processField) => {
               if (!processField) return false;

               if (processField.field) {
                  return processField.field.id == f.id;
               } else if (processField.key) {
                  // uuid
                  let processFieldId = processField.key.split(".").pop();
                  return processFieldId == f.id || processFieldId == f.key;
               }
            }).length > 0;

         if (isProcessField) {
            conditions = conditions.concat(this.fieldsAddFiltersContext(f));
         }

         // let type = f.id; // the default unique identifier for our filter types
         // if (f.id == "this_object") {
         //    // if this happens to be our special "this_object" field, then our
         //    // type needs to be the "uuid" type in the definition:
         //    type = f.type;
         // }

         // the format for webix querybuilder:
         // { id  value:"label" type }
         //      type: {string} the type of value it is.
         //            since we want to tailor value selectors per field,
         //            we will make a unique type for each field. and then
         //            add value selectors for that specific .type
         return {
            id: f.columnName || f.id,
            value: label,
            type: type,
            conditions: conditions,
            // format: () => {},
         };
      });

      // !!! Process Fields of ABProcess
      // https://github.com/digi-serve/appbuilder_class_core/blob/master/FilterComplexCore.js#L636
      // https://github.com/digi-serve/appbuilder_class_core/blob/master/FilterComplexCore.js#L564
      // (this._ProcessFields || [])
      //    // if there is no .field, it is probably an embedded special field
      //    .filter((pField) => pField.field == null)
      //    .forEach((pField) => {
      //       // like: .uuid
      //       let key = pField.key.split(".").pop();
      //       if (key == "uuid" && this._Object) {
      //          fields.unshift({
      //             id: pField.key,
      //             value: this._Object.label,
      //             type: "text",
      //             conditions: this.fieldsAddFiltersContext(),
      //          });
      //       }
      //    });

      return fields;
   }

   fieldsAddFiltersDate(field) {
      let dateConditions = {
         less: this.labels.component.beforeCondition,
         greater: this.labels.component.afterCondition,
         less_or_equal: this.labels.component.onOrBeforeCondition,
         greater_or_equal: this.labels.component.onOrAfterCondition,
         less_current: this.labels.component.beforeCurrentCondition,
         greater_current: this.labels.component.afterCurrentCondition,
         less_or_equal_current:
            this.labels.component.onOrBeforeCurrentCondition,
         greater_or_equal_current:
            this.labels.component.onOrAfterCurrentCondition,
         last_days: this.labels.component.onLastDaysCondition,
         next_days: this.labels.component.onNextDaysCondition,
      };

      let result = [];

      for (let condKey in dateConditions) {
         result.push({
            id: condKey,
            value: dateConditions[condKey],
            batch: "datepicker",
            handler: (a, b) => this.dateValid(a, condKey, b),
         });
      }

      return result;
   }

   fieldsAddFiltersString(field) {
      let stringConditions = {
         contains: {
            batch: "text",
            label: this.labels.component.containsCondition,
         },
         not_contains: {
            batch: "text",
            label: this.labels.component.notContainsCondition,
         },
         equals: {
            batch: "text",
            label: this.labels.component.isCondition,
         },
         not_equal: {
            batch: "text",
            label: this.labels.component.isNotCondition,
         },
         is_empty: {
            batch: "none",
            label: this.labels.component.isEmpty,
         },
         is_not_empty: {
            batch: "none",
            label: this.labels.component.isNotEmpty,
         },
      };

      let result = [];

      for (let condKey in stringConditions) {
         result.push({
            id: condKey,
            value: stringConditions[condKey].label,
            batch: stringConditions[condKey].batch,
            handler: (a, b) => this.textValid(a, condKey, b),
         });
      }

      return result;
   }

   fieldsAddFiltersNumber(field) {
      let numberConditions = {
         equals: this.labels.component.equalCondition,
         not_equal: this.labels.component.notEqualCondition,
         less: this.labels.component.lessThanCondition,
         greater: this.labels.component.moreThanCondition,
         less_or_equal: this.labels.component.lessThanOrEqualCondition,
         greater_or_equal: this.labels.component.moreThanOrEqualCondition,
      };

      let result = [];

      for (let condKey in numberConditions) {
         result.push({
            id: condKey,
            value: numberConditions[condKey],
            batch: "text",
            handler: (a, b) => this.numberValid(a, condKey, b),
         });
      }

      return result;
   }

   fieldsAddFiltersList(field) {
      let listConditions = {
         equals: this.labels.component.equalListCondition,
         not_equal: this.labels.component.notEqualListCondition,
      };

      let result = [];

      for (let condKey in listConditions) {
         result.push({
            id: condKey,
            value: listConditions[condKey],
            batch: "list",
            handler: (a, b) => this.listValid(a, condKey, b),
         });
      }

      return result;
   }

   fieldsAddFiltersBoolean(field) {
      let booleanConditions = {
         equals: this.labels.component.equalListCondition,
      };

      let result = [];

      for (let condKey in booleanConditions) {
         result.push({
            id: condKey,
            value: booleanConditions[condKey],
            batch: "boolean",
            handler: (a, b) => this.booleanValid(a, condKey, b),
         });
      }

      return result;
   }

   fieldsAddFiltersUser(field) {
      let userConditions = {
         is_current_user: {
            batch: "none",
            label: this.labels.component.isCurrentUserCondition,
         },
         is_not_current_user: {
            batch: "none",
            label: this.labels.component.isNotCurrentUserCondition,
         },
         contain_current_user: {
            batch: "none",
            label: this.labels.component.containsCurrentUserCondition,
         },
         not_contain_current_user: {
            batch: "none",
            label: this.labels.component.notContainsCurrentUserCondition,
         },
         equals: {
            batch: "user",
            label: this.labels.component.equalListCondition,
         },
         not_equal: {
            batch: "user",
            label: this.labels.component.notEqualListCondition,
         },
      };

      let result = [];

      for (let condKey in userConditions) {
         result.push({
            id: condKey,
            value: userConditions[condKey].label,
            batch: userConditions[condKey].batch,
            handler: (a, b) => this.userValid(a, condKey, b),
         });
      }

      return result;
   }

   fieldsAddFiltersQuery(field) {
      let connectConditions = {
         in_query: {
            batch: "query",
            label: this.labels.component.inQuery,
            handler: (a, b) => this.inQueryValid(a, "in_query", b),
         },
         not_in_query: {
            batch: "query",
            label: this.labels.component.notInQuery,
            handler: (a, b) => this.inQueryValid(a, "not_in_query", b),
         },
         same_as_user: {
            batch: "user",
            label: this.labels.component.sameAsUser,
            handler: (a, b) => this.userValid(a, "same_as_user", b),
         },
         not_same_as_user: {
            batch: "user",
            label: this.labels.component.notSameAsUser,
            handler: (a, b) => this.userValid(a, "not_same_as_user", b),
         },
         in_data_collection: {
            batch: "datacollection",
            label: this.labels.component.inDataCollection,
            handler: (a, b) =>
               this.dataCollectionValid(a, "in_data_collection", b),
         },
         not_in_data_collection: {
            batch: "datacollection",
            label: this.labels.component.notInDataCollection,
            handler: (a, b) =>
               this.dataCollectionValid(a, "not_in_data_collection", b),
         },
         // TODO
         // contains: this.labels.component.containsCondition,
         // not_contains: this.labels.component.notContainCondition,
         // equals: this.labels.component.isCondition,
         // not_equal: this.labels.component.isNotCondition
      };

      let result = [];

      for (let condKey in connectConditions) {
         result.push({
            id: condKey,
            value: connectConditions[condKey].label,
            batch: connectConditions[condKey].batch,
            handler: connectConditions[condKey].handler,
         });
      }

      // Add filter options to Custom index
      if (
         field.settings.isCustomFK &&
         // 1:M
         ((field.settings.linkType == "one" &&
            field.settings.linkViaType == "many") ||
            // 1:1 isSource = true
            (field.settings.linkType == "one" &&
               field.settings.linkViaType == "one" &&
               field.settings.isSource))
      ) {
         const stringResults = this.fieldsAddFiltersString(field);
         result = stringResults.concat(result);
      }

      return result;
   }

   fieldsAddFiltersQueryField(field) {
      let queryFieldConditions = {
         in_query_field: this.labels.component.inQueryField,
         not_in_query_field: this.labels.component.notInQueryField,
      };

      let result = [];

      for (let condKey in queryFieldConditions) {
         result.push({
            id: condKey,
            value: queryFieldConditions[condKey],
            batch: "queryField",
            handler: (a, b) => this.queryFieldValid(a, condKey, b),
         });
      }

      return result;
   }

   fieldsAddFiltersThisObject(field) {
      let thisObjectConditions = {
         in_query: {
            batch: "query",
            label: this.labels.component.inQuery,
         },
         not_in_query: {
            batch: "query",
            label: this.labels.component.notInQuery,
         },
         in_data_collection: {
            batch: "datacollection",
            label: this.labels.component.inDataCollection,
         },
         not_in_data_collection: {
            batch: "datacollection",
            label: this.labels.component.notInDataCollection,
         },
      };

      let result = [];

      for (let condKey in thisObjectConditions) {
         result.push({
            id: condKey,
            value: thisObjectConditions[condKey].label,
            batch: thisObjectConditions[condKey].batch,
            handler: (a, b) => this.thisObjectValid(a, condKey, b),
         });
      }

      return result;
   }

   fieldsAddFiltersRecordRule(field) {
      let recordRuleConditions = {
         same_as_field: this.labels.component.sameAsField,
         not_same_as_field: this.labels.component.notSameAsField,
      };

      let result = [];

      for (let condKey in recordRuleConditions) {
         result.push({
            id: condKey,
            value: recordRuleConditions[condKey],
            batch: "recordRule",
            handler: (a, b) => true, // TODO: record rule validation
         });
      }

      return result;
   }

   fieldsAddFiltersContext(field) {
      let contextConditions = {
         context_equals: {
            batch: "context",
            label: this.labels.component.equalsProcessValue,
            handler: (a, b) => a == b,
         },
         context_not_equal: {
            batch: "context",
            label: this.labels.component.notEqualsProcessValueCondition,
            handler: (a, b) => a != b,
         },
         context_in: {
            batch: "context",
            label: this.labels.component.inProcessValueCondition,
            handler: (a, b) => a.indexOf(b) > -1,
         },
         context_not_in: {
            batch: "context",
            label: this.labels.component.notInProcessValueCondition,
            handler: (a, b) => a.indexOf(b) == -1,
         },
      };

      let result = [];

      for (let condKey in contextConditions) {
         result.push({
            id: condKey,
            value: contextConditions[condKey].label,
            batch: contextConditions[condKey].batch,
            handler: contextConditions[condKey].handler,
         });
      }

      return result;
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
   queries(filter = () => true) {
      const queryList = this._Queries ?? this.AB?.queries?.() ?? [];

      return queryList.filter((q) => filter(q));
   }

   setValue(settings) {
      this.condition = settings || {};

      this.condition.rules = this.condition.rules || [];
   }

   /**
    * @method getValue
    * return the current condition of the filter.
    * @return {JSON} -
    * {
    * 	glue: '', // 'and', 'or'
    *		rules: [
    *			{
    *				key:	'uuid',
    *				rule:	'rule',
    *				value:	'value'
    *			}
    *		]
    * }
    */
   getValue() {
      // When asked for a value before a condition is set, default the
      // unset glue to "and";
      if (typeof this.condition.glue == "undefined") {
         this.condition.glue = "and";
      }
      return this.condition;
   }

   isComplete() {
      let result = true;

      const noValueRules = [
         "is_current_user",
         "is_not_current_user",
         "contain_current_user",
         "not_contain_current_user",
         "same_as_user",
         "not_same_as_user",
      ];

      const isCompleteRules = (rules = []) => {
         if (result == false) return;

         rules.forEach((r) => {
            if (r?.rules && Array.isArray(r?.rules)) {
               isCompleteRules(r?.rules);
            } else {
               result =
                  result &&
                  r?.key != null &&
                  r?.key != "" &&
                  r?.rule != null &&
                  r?.rule != "" &&
                  ((r?.value != null && r?.value != "") ||
                     noValueRules.indexOf(r?.rule) > -1);
            }
         });
      };

      isCompleteRules(this.condition?.rules);

      return result;
   }
};
