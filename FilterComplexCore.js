const ABComponent = require("../platform/ABComponent");
const ABObjectQuery = require("../platform/ABObjectQuery");

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
      this.config_settings = {};
      // var batchName; // we need to revert to this default when switching away from a in/by query field

      this._QueryFields = [];
      this._Fields;

      // internal business logic
      var _logic = (this._logic = {
         /**
          * @method getValue
          *
          * @return {JSON} -
          * {
          *    glue: '', // 'and', 'or'
          *    rules: [
          *      {
          *        key:  'column name',
          *        rule: 'rule',
          *        value:  'value'
          *      }
          *    ]
          * }
          */
         getValue: () => {
            return this.config_settings;
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
    * @method fieldsLoad
    * set fields
    *
    * @param array {ABField}
    * @param object {ABObject} [optional]
    */
   fieldsLoad(fields = [], object = null) {
      this._Fields = fields.filter((f) => {
         return (
            f &&
            (f.fieldIsFilterable ? f.fieldIsFilterable() : f.type == "uuid")
         );
      });

      this._QueryFields = this._Fields
         ? this._Fields.filter((f) => f && f.key == "connectObject")
         : [];

      // // insert our 'this object' entry if an Object was given.
      // if (object) {
      //     this._Object = object;

      //     let thisObjOption = {
      //         id: "this_object",
      //         value: object.label,
      //         type: "uuid"
      //     };

      //     // If object is query ,then should define default alias: "BASE_OBJECT"
      //     if (object instanceof ABObjectQuery) {
      //         thisObjOption.alias = "BASE_OBJECT";
      //     }

      //     this._Fields.unshift(thisObjOption);
      // }
      this.fieldsToFilters();
      this.uiInit();
   }

   objectLoad(object) {
      this._Object = object;

      if (object) {
         var fields = object.fields();

         let thisObjOption = {
            id: "uuid",
            label: object.label,
            type: "uuid"
         };

         // If object is query ,then should define default alias: "BASE_OBJECT"
         if (object instanceof ABObjectQuery) {
            thisObjOption.alias = "BASE_OBJECT";
         }

         fields.unshift(thisObjOption);
         this.fieldsLoad(fields);
      }
   }

   fieldsToQB() {
      var fields = this._Fields.map((f) => {
         // the format for webix querybuilder:
         // { id  value:"label" type }
         //      type: {string} the type of value it is.
         //            since we want to tailor value selectors per field,
         //            we will make a unique type for each field. and then
         //            add value selectors for that specific .type
         return { id: f.id, value: f.label, type: f.id };
      });
      return fields;
   }

   fieldsToFilters() {
      this._Filters = [];
      this._Fields.forEach((f) => {
         switch (f.key || f.type) {
            case "uuid":
               // { id:"radio", name:"One From", type:{ "rating" : ratingEditor }, fn:(a,b) => a == b }
               break;

            case "string":
               this.fieldsAddFiltersString(f);
               break;
            case "date":
               this.fieldsAddFiltersDate(f);
               break;
         }
      });
   }

   filterAdd(filter) {
      if (filter) {
         if (!Array.isArray(filter)) {
            filter = [filter];
         }
         this._Filters = this._Filters.concat(filter);
         this.uiInit();
      }
   }

   filtersToQB() {
      return this._Filters;
   }

   uiInit() {
      var el = this.ui.rows[0].elements[0];
      el.fields = this.fieldsToQB();
      el.filters = this.filtersToQB();
   }

   toShortHand() {
      if (!this.condition) {
         return "all";
      } else {
         var parseCond = (cond) => {
            if (cond.glue) {
               var subs = [];
               cond.rules.forEach((rule) => {
                  subs.push(parseCond(rule));
               });
               if (cond.glue == "and") {
                  return `{ ${subs.join(",")} }`;
               } else {
                  return `{ "or":[ ${subs.join(",")} ] }`;
               }
            } else if (cond.key) {
               // worst case, display a raw condition text:
               var condVal = `${cond.key} ${cond.rule} ${cond.value}`;
               if (!this._Fields) {
                  return condVal;
               }

               // now see if we can decode the display text from
               // our field + filter options:
               var field = this._Fields.find((f) => {
                  return (f.id = cond.key);
               });
               var filter = this._Filters.find((f) => {
                  return f.id == cond.rule && f.type[field.id];
               });
               if (filter && filter.type && filter.type[field.type]) {
                  var label = cond.value;
                  if (filter.type[field.type].options) {
                     var option = filter.type[field.type].options.find((o) => {
                        return o.id == cond.value;
                     });
                     if (option) {
                        label = option.value;
                     }
                  }
                  return `${field.label} ${filter.name} ${label}`;
               } else {
                  // nope: just return our cond view:
                  return condVal;
               }
            } else {
               // maybe it is just a string already?
               return cond;
            }
         };
         return parseCond(this.condition);
      }
   }

   fieldsAddFiltersDate(field) {
      var dateEditor = {
         // inputView.format = field.getDateFormat();
         id: "value",
         view: "datepicker",
         on: {
            onChange: function() {
               // _logic.onChange();
            }
         }
      };
      var type = {};
      type[field.id] = dateEditor;

      this._Filters = this._Filters.concat([
         {
            id: "less",
            name: this.labels.component.beforeCondition,
            type,
            fn: (a, b) => {
               return a < b;
            }
         },
         {
            id: "greater",
            name: this.labels.component.afterCondition,
            type,
            fn: (a, b) => {
               return a > b;
            }
         },
         {
            id: "on_or_less",
            name: this.labels.component.onOrBeforeCondition,
            type,
            fn: (a, b) => {
               return a <= b;
            }
         },
         {
            id: "on_or_greater",
            name: this.labels.component.onOrAfterCondition,
            type,
            fn: (a, b) => {
               return a >= b;
            }
         }
      ]);
   }

   fieldsAddFiltersString(field) {
      var textEditor = {
         view: "text"
      };
      var type = {};
      type[field.id] = textEditor;

      this._Filters = this._Filters.concat([
         {
            id: "contains",
            name: this.labels.component.containsCondition,
            type,
            fn: (a, b) => {
               return a.indexOf(b) != -1;
            }
         },
         {
            id: "not_contains",
            name: this.labels.component.notContainsCondition,
            type,
            fn: (a, b) => {
               return a.indexOf(b) == -1;
            }
         },
         {
            id: "equals",
            name: this.labels.component.equalCondition,
            type,
            fn: (a, b) => a == b
         },
         {
            id: "not_equals",
            name: this.labels.component.notEqualCondition,
            type,
            fn: (a, b) => a != b
         }
      ]);
   }

   //////
   /////
   /////

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
   }
};
