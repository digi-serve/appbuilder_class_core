const ABComponent = require("../platform/ABComponent");
// const ABObjectQuery = require("../platform/ABObjectQuery");

/**
 *  support get data from objects and queries
 */
function getFieldVal(rowData, columnName) {
   if (!columnName) return null;

   if (columnName.indexOf(".") > -1) {
      let colName = columnName.split(".")[1];
      return rowData[columnName] || rowData[colName];
   } else {
      return rowData[columnName];
   }
}

module.exports = class FilterComplexCore extends ABComponent {
   constructor(App, idBase) {
      idBase = idBase || "ab_filter_complex";

      super(App, idBase);

      this.Account = { username: "??" };
      this._settings = {};
      this.condition = {};
      // var batchName; // we need to revert to this default when switching away from a in/by query field

      this._QueryFields = [];
      this._Fields;

      // internal business logic
      var _logic = (this._logic = {
         callbacks: {
            onChange: () => {}
         },

         removeHtmlTags: function(text) {
            var div = document.createElement("div");
            div.innerHTML = text;

            return div.textContent || div.innerText || "";
         }
      });

      // Interface methods for parent component:
      // this.objectLoad = _logic.objectLoad;
      // this.viewLoad = _logic.viewLoad;
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
      var condition = this.condition;
      var _logic = this._logic;

      // If no conditions, then return true
      if (
         condition == null ||
         condition.rules == null ||
         condition.rules.length == 0
      )
         return true;

      if (rowData == null) return false;

      var result = condition.glue === "and" ? true : false;

      condition.rules.forEach((filter) => {
         if (!filter.key || !filter.rule) return;

         var fieldInfo = (this._Fields || []).filter(
            (f) => f.id == filter.key
         )[0];
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
         var value = getFieldVal(rowData, fieldInfo.columnName);

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
                  fieldInfo.relationName(),
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
      var result = false;

      value = value.trim().toLowerCase();
      value = this._logic.removeHtmlTags(value); // remove html tags - rich text editor

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
         default:
            result = this.queryFieldValid(value, rule, compareValue);
            break;
      }

      return result;
   }

   dateValid(value, rule, compareValue) {
      var result = false;

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
      var result = false;

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
      var result = false;

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
            result = this.queryFieldValid(value, rule, compareValue);
            break;
      }

      return result;
   }

   booleanValid(value, rule, compareValue) {
      var result = false;

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
      var result = false;

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
               (value || []).filter((v) => (v.id || v) == this.Account.username)
                  .length > 0;
            break;
         case "not_contain_current_user":
            if (!Array.isArray(value)) value = [value];

            result =
               (value || []).filter((v) => (v.id || v) == this.Account.username)
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
            .replace("{idBase}", this.idBase)
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
   }

   inQueryValid(value, rule, compareValue) {
      let result = false;

      if (!compareValue || !this._Application) return result;

      // if no query
      let query = this.queries((q) => q.id == compareValue)[0];
      if (!query) return result;

      let qIdBase = "{idBase}-query-{id}"
            .replace("{idBase}", this.idBase)
            .replace("{id}", query.id),
         inQueryFilter = new RowFilter(this.App, qIdBase);
      inQueryFilter.Account = this.Account;
      inQueryFilter.applicationLoad(this.application);
      inQueryFilter.fieldsLoad(query.fields());
      inQueryFilter.setValue(query.workspaceFilterConditions);

      switch (rule) {
         case "in_query":
            result = inQueryFilter.isValid(value);
            break;
         case "not_in_query":
            result = !inQueryFilter.isValid(value);
            break;
      }

      return result;
   }

   dataCollectionValid(value, rule, compareValue) {
      var result = false;

      if (!compareValue || !this._Application) return result;

      let dc = this._Application.datacollections(
         (d) => d.id == compareValue
      )[0];

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

   connectFieldValid(value, rule, compareValue) {
      switch (rule) {
         case "contains":
            return (value.id || value).toString().indexOf(compareValue) > -1;
         case "not_contains":
            return (value.id || value).toString().indexOf(compareValue) == -1;
         case "equals":
            return (value.id || value).toString() == compareValue;
         case "not_equal":
            return (value.id || value).toString() != compareValue;
         case "in_query":
         case "not_in_query":
            return this.inQueryValid(value, rule, compareValue);
         case "is_current_user":
         case "is_not_current_user":
         case "contain_current_user":
         case "not_contain_current_user":
            return this.userValid(value, rule, compareValue);
         case "in_data_collection":
         case "not_in_data_collection":
            return this.dataCollectionValid(value, rule, compareValue);
      }
   }

   thisObjectValid(rowData, rule, compareValue) {
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
            return this.inQueryValid(newRowData, rule, compareValue);

         // if in_datacollection condition
         case "in_data_collection":
         case "not_in_data_collection":
            // send rowData, null to datacollectionValid()
            return this.dataCollectionValid(rowData, rule, compareValue);
      }
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

   processFieldsLoad(processFields = []) {
      if (!Array.isArray(processFields)) {
         processFields = [processFields];
      }
      processFields.forEach((processField) => {
         var type = {};

         // some processfields have .field definitions, others don't.
         // if they do, process this using the field.id
         if (processField.field) {
            type[processField.field.id] = {
               view: "select",
               options: [
                  {
                     id: "empty",
                     value: "choose option"
                  },
                  {
                     id: processField.key,
                     value: `context(${processField.label})`
                  }
               ]
            };
         } else {
            // if there is no .field, it is probably an embedded special field
            // like: .uuid
            var key = processField.key.split(".").pop();
            type[key] = {
               view: "select",
               options: [
                  {
                     id: "empty",
                     value: "choose option"
                  },
                  {
                     id: processField.key,
                     value: `context(${processField.label})`
                  }
               ]
            };
         }

         // add an "equals" and "not equals" filter for each:
         this._Filters = this._Filters.concat([
            {
               id: `context_equals`,
               name: `equals process value`,
               type,
               fn: (a, b) => {
                  return a == b;
               }
            },
            {
               id: `context_not_equal`,
               name: `not equals process value`,
               type,
               fn: (a, b) => {
                  return a != b;
               }
            }
         ]);
      });
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
      this._Fields = fields.filter((f) => f && f.fieldIsFilterable());
      this._QueryFields = this._Fields
         ? this._Fields.filter((f) => f && f.key == "connectObject")
         : [];

      // insert our 'this object' entry if an Object was given.
      if (object) {
         this._Object = object;

         let thisObjOption = {
            id: "this_object",
            label: object.label,
            type: "uuid"
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

      this.fieldsToFilters();
   }

   fieldsToQB() {
      /*
      let mapTypes = {
         LongText: "string",
         email: "string",
         datetime: "date",
         connectField: "connectObject"
      };

      var fields = this._Fields.map((f) => {
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

      var fields = (this._Fields || []).map((f) => {
         let label = f.label;
         if (this._settings.showObjectName && f.object && f.object.label)
            label = `${f.object.label}.${f.label}`;

         let type = f.id; // the default unique identifier for our filter types
         if (f.id == "this_object") {
            // if this happens to be our special "this_object" field, then our
            // type needs to be the "uuid" type in the definition:
            type = f.type;
         }

         // the format for webix querybuilder:
         // { id  value:"label" type }
         //      type: {string} the type of value it is.
         //            since we want to tailor value selectors per field,
         //            we will make a unique type for each field. and then
         //            add value selectors for that specific .type
         return { id: f.id, value: label, type };
      });
      return fields;
   }

   filtersToQB() {
      return this._Filters;
   }

   fieldsToFilters() {
      this._Filters = [];

      (this._Fields || []).forEach((f) => {
         switch (f.key || f.type) {
            // case "uuid":
            //    { id:"radio", name:"One From", type:{ "rating" : ratingEditor }, fn:(a,b) => a == b }
            //    break;
            case "connectObject":
               this.fieldsAddFiltersQuery(f);
               break;
            case "date":
               this.fieldsAddFiltersDate(f);
               break;
            case "string":
               this.fieldsAddFiltersString(f);
               break;
            case "number":
               this.fieldsAddFiltersNumber(f);
               break;
            case "list":
               this.fieldsAddFiltersList(f);
               break;
            case "boolean":
               this.fieldsAddFiltersBoolean(f);
               break;
            case "user":
               this.fieldsAddFiltersUser(f);
               break;
         }
      });
   }

   fieldsAddFiltersDate(field) {
      var dateEditor = {
         // inputView.format = field.getDateFormat();
         id: "value",
         view: "datepicker"
      };
      var type = {};
      type[field.id] = dateEditor;

      let dateConditions = {
         less: this.labels.component.beforeCondition,
         greater: this.labels.component.afterCondition,
         less_or_equal: this.labels.component.onOrBeforeCondition,
         greater_or_equal: this.labels.component.onOrAfterCondition,
         less_current: this.labels.component.beforeCurrentCondition,
         greater_current: this.labels.component.afterCurrentCondition,
         less_or_equal_current: this.labels.component
            .onOrBeforeCurrentCondition,
         greater_or_equal_current: this.labels.component
            .onOrAfterCurrentCondition,
         last_days: this.labels.component.onLastDaysCondition,
         next_days: this.labels.component.onNextDaysCondition
         // TODO: query field option
         // TODO: record rule option
      };

      for (let condKey in dateConditions) {
         this._Filters.push({
            id: condKey,
            name: dateConditions[condKey],
            type,
            fn: (a, b) => this.dateValid(a, condKey, b)
         });
      }
   }

   fieldsAddFiltersString(field) {
      var textEditor = {
         view: "text"
      };
      var type = {};
      type[field.id] = textEditor;

      let stringConditions = {
         contains: this.labels.component.containsCondition,
         not_contains: this.labels.component.notContainsCondition,
         equals: this.labels.component.isCondition,
         not_equals: this.labels.component.isNotCondition
         // TODO: query field option
         // TODO: record rule option
      };

      for (let condKey in stringConditions) {
         this._Filters.push({
            id: condKey,
            name: stringConditions[condKey],
            type,
            fn: (a, b) => this.textValid(a, condKey, b)
         });
      }
   }

   fieldsAddFiltersNumber(field) {
      var textEditor = {
         view: "text"
      };
      var type = {};
      type[field.id] = textEditor;

      let numberConditions = {
         equals: this.labels.component.equalCondition,
         not_equal: this.labels.component.notEqualCondition,
         less: this.labels.component.lessThanCondition,
         greater: this.labels.component.moreThanCondition,
         less_or_equal: this.labels.component.lessThanOrEqualCondition,
         greater_or_equal: this.labels.component.moreThanOrEqualCondition
         // TODO : query field option
         // TODO : record rule
      };

      for (let condKey in numberConditions) {
         this._Filters.push({
            id: condKey,
            name: numberConditions[condKey],
            type,
            fn: (a, b) => this.numberValid(a, condKey, b)
         });
      }
   }

   fieldsAddFiltersList(field) {
      let editor = {
         view: "richselect",
         options: field.options().map((o) => {
            return { id: o.id, value: o.text };
         }),
         customEdit: true
      };
      let type = {};
      type[field.id] = editor;

      let listConditions = {
         equals: this.labels.component.equalListCondition,
         not_equal: this.labels.component.notEqualListCondition
         // TODO : query field option
         // TODO : record rule
      };

      for (let condKey in listConditions) {
         this._Filters.push({
            id: condKey,
            name: listConditions[condKey],
            type,
            fn: (a, b) => this.listValid(a, condKey, b)
         });
      }
   }

   fieldsAddFiltersBoolean(field) {
      var textEditor = {
         view: "checkbox"
      };
      var type = {};
      type[field.id] = textEditor;

      let booleanConditions = {
         equals: this.labels.component.equalListCondition
         // TODO : query field option
         // TODO : record rule
      };

      for (let condKey in booleanConditions) {
         this._Filters.push({
            id: condKey,
            name: booleanConditions[condKey],
            type,
            fn: (a, b) => this.booleanValid(a, condKey, b)
         });
      }
   }

   fieldsAddFiltersUser(field) {
      var textEditor = {
         view: "richselect",
         options: OP.User.userlist()
      };
      var type = {};
      type[field.id] = textEditor;

      let userConditions = {
         is_current_user: this.labels.component.isCurrentUserCondition,
         is_not_current_user: this.labels.component.isNotCurrentUserCondition,
         contain_current_user: this.labels.component
            .containsCurrentUserCondition,
         not_contain_current_user: this.labels.component
            .notContainsCurrentUserCondition,
         equals: this.labels.component.equalListCondition,
         not_equal: this.labels.component.notEqualListCondition
         // TODO : query field option
         // TODO : record rule
      };

      for (let condKey in userConditions) {
         this._Filters.push({
            id: condKey,
            name: userConditions[condKey],
            type,
            fn: (a, b) => this.userValid(a, condKey, b)
         });
      }
   }

   fieldsAddFiltersQuery(field) {
      var editor = {
         view: "richselect",
         options: [], // TODO
         customEdit: true
      };
      var type = {};
      type[field.id] = editor;

      let connectConditions = {
         in_query: this.labels.component.inQuery,
         not_in_query: this.labels.component.notInQuery,
         same_as_user: this.labels.component.sameAsUser,
         not_same_as_user: this.labels.component.notSameAsUser,
         in_data_collection: this.labels.component.inDataCollection,
         not_in_data_collection: this.labels.component.notInDataCollection
         // TODO
         // contains: this.labels.component.containsCondition,
         // not_contains: this.labels.component.notContainCondition,
         // equals: this.labels.component.isCondition,
         // not_equal: this.labels.component.isNotCondition
         // TODO: record rule
      };

      for (let condKey in connectConditions) {
         this._Filters.push({
            id: condKey,
            name: connectConditions[condKey],
            type,
            fn: (a, b) => this.inQueryValid(a, condKey, b)
         });
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
   queries(filter = () => true) {
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
      this.condition = settings || {};

      this.condition.rules = this.condition.rules || [];
   }

   /**
    * @method getValue
    *
    * @return {JSON} -
    * {
    * 		glue: '', // 'and', 'or'
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
      return this.condition;
   }
};
