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
var ABComponent = require("../platform/ABComponent");

module.exports = class RowFilter extends ABComponent {
    constructor(App, idBase) {
        idBase = idBase || "ab_row_filter";

        super(App, idBase);

        this.Account = { username: "??" };
        this._Object;
        this._Fields;
        this._QueryFields = [];
        this._View;
        this._settings = {};
        this.config_settings = {};
        // var batchName; // we need to revert to this default when switching away from a in/by query field

        // internal business logic
        var _logic = (this._logic = {
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
                var div = document.createElement("div");
                div.innerHTML = text;

                return div.textContent || div.innerText || "";
            },

            textValid: function(rowData, columnName, rule, compareValue) {
                var result = false;

                var value = getFieldVal(rowData, columnName);
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
                    default:
                        result = _logic.queryValid(rowData, rule, compareValue);
                        break;
                }

                return result;
            },

            dateValid: function(rowData, columnName, rule, compareValue) {
                var result = false;

                var value = getFieldVal(rowData, columnName);
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
                        result = _logic.queryValid(rowData, rule, compareValue);
                        break;
                }

                return result;
            },

            numberValid: function(rowData, columnName, rule, compareValue) {
                var result = false;

                var value = getFieldVal(rowData, columnName);
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

            listValid: function(rowData, columnName, rule, compareValue) {
                var result = false;

                var value = getFieldVal(rowData, columnName);

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

            booleanValid: function(rowData, columnName, rule, compareValue) {
                var result = false;

                var value = getFieldVal(rowData, columnName);

                switch (rule) {
                    case "equals":
                        result = value == compareValue;
                        break;
                    default:
                        result = _logic.queryValid(rowData, rule, compareValue);
                        break;
                }

                return result;
            },

            userValid: (rowData, columnName, rule, compareValue) => {
                var result = false;

                var value = getFieldVal(rowData, columnName);

                if (Array.isArray(value)) value = [value];

                switch (rule) {
                    case "is_current_user":
                        result = value == this.Account.username;
                        break;
                    case "is_not_current_user":
                        result = value != this.Account.username;
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

                if (!compareValue) return result;

                // queryId:fieldId
                var queryId = compareValue.split(":")[0],
                    fieldId = compareValue.split(":")[1];

                // if no query
                var query = this._Object.application.queries(
                    (q) => q.id == queryId
                )[0];
                if (!query) return result;

                // if no field
                var field = query.fields((f) => f.id == fieldId)[0];
                if (!field) return result;

                let qIdBase = "{idBase}-query-field-{id}"
                        .replace("{idBase}", idBase)
                        .replace("{id}", query.id),
                    inQueryFieldFilter = new RowFilter(App, qIdBase);
                inQueryFieldFilter.Account = this.Account;
                inQueryFieldFilter.objectLoad(query);
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

                if (!compareValue) return result;

                // if no query
                let query = this._Object.application.queries(
                    (q) => q.id == compareValue
                )[0];
                if (!query) return result;

                let qIdBase = "{idBase}-query-{id}"
                        .replace("{idBase}", idBase)
                        .replace("{id}", query.id),
                    inQueryFilter = new RowFilter(App, qIdBase);
                inQueryFilter.Account = this.Account;
                inQueryFilter.objectLoad(query);
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

                if (!compareValue) return result;

                if (!this._View) return result;

                if (columnName) {
                    rowData = rowData[columnName] || {};
                }

                // var dc = this._View.pageRoot().dataCollections(dc => dc.id == compareValue)[0];
                var dc = this._View.application.datacollections(
                    (dc) => dc.id == compareValue
                )[0];

                switch (rule) {
                    case "in_data_collection":
                        if (!dc) return false;

                        result =
                            dc.getData((d) => d.id == rowData.id).length > 0;
                        break;
                    case "not_in_data_collection":
                        if (!dc) return true;

                        result =
                            dc.getData((d) => d.id == rowData.id).length < 1;
                        break;
                }

                return result;
            },

            connectFieldValid: function(
                rowData,
                columnName,
                rule,
                compareValue
            ) {
                switch (rule) {
                    case "contains":
                        return (
                            (rowData[columnName].id || rowData[columnName])
                                .toString()
                                .indexOf(compareValue) > -1
                        );
                        break;
                    case "not_contains":
                        return (
                            (rowData[columnName].id || rowData[columnName])
                                .toString()
                                .indexOf(compareValue) == -1
                        );
                        break;
                    case "equals":
                        return (
                            (
                                rowData[columnName].id || rowData[columnName]
                            ).toString() == compareValue
                        );
                        break;
                    case "not_equal":
                        return (
                            (
                                rowData[columnName].id || rowData[columnName]
                            ).toString() != compareValue
                        );
                        break;
                    case "in_query":
                    case "not_in_query":
                        return _logic.inQueryValid(
                            rowData,
                            columnName,
                            rule,
                            compareValue
                        );
                        break;
                    case "is_current_user":
                    case "is_not_current_user":
                        return _logic.userValid(
                            rowData,
                            columnName,
                            rule,
                            compareValue
                        );
                        break;
                    case "in_data_collection":
                    case "not_in_data_collection":
                        return _logic.dataCollectionValid(
                            rowData,
                            columnName,
                            rule,
                            compareValue
                        );
                        break;
                }
            },

            thisObjectValid: (rowData, rule, compareValue) => {
                let result = false;

                switch (rule) {
                    // if in_query condition
                    case "in_query":
                    case "not_in_query":
                        // if > 1 copy of this object in query ==> Error!
                        let query = this._Object.application.queries(
                            (q) => q.id == compareValue
                        )[0];
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
                        fieldInfo.columnName,
                        filter.rule,
                        filter.value
                    );
                    break;
                case "date":
                case "datetime":
                    condResult = _logic.dateValid(
                        rowData,
                        fieldInfo.columnName,
                        filter.rule,
                        filter.value
                    );
                    break;
                case "number":
                    condResult = _logic.numberValid(
                        rowData,
                        fieldInfo.columnName,
                        filter.rule,
                        filter.value
                    );
                    break;
                case "list":
                    condResult = _logic.listValid(
                        rowData,
                        fieldInfo.columnName,
                        filter.rule,
                        filter.value
                    );
                    break;
                case "boolean":
                    condResult = _logic.booleanValid(
                        rowData,
                        fieldInfo.columnName,
                        filter.rule,
                        filter.value
                    );
                    break;
                case "user":
                    condResult = _logic.userValid(
                        rowData,
                        fieldInfo.columnName,
                        filter.rule,
                        filter.value
                    );
                    break;
                case "connectField":
                case "connectObject":
                    condResult = _logic.connectFieldValid(
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

            if (config_settings.glue === "and") {
                result = result && condResult;
            } else {
                result = result || condResult;
            }
        });

        return result;
    }

    /**
     * @method objectLoad
     * set object
     *
     * @param object {ABObject}
     */
    objectLoad(object) {
        this._Object = object;
        this._Fields = this._Object
            ? this._Object.fields((f) => f.fieldIsFilterable())
            : [];
        this._QueryFields = this._Object ? this._Object.connectFields() : [];

        // insert our 'this object' entry if an Object was given.
        if (this._Object) {
            this._Fields.unshift({
                id: "this_object",
                label: this._Object.label || this._Object.name
            });
        }
    }

    setValue(settings) {
        this.config_settings = settings || {};

        this.config_settings.rules = this.config_settings.rules || [];
    }

    /**
     * @method viewLoad
     * set view
     *
     * @param view {ABView}
     */
    viewLoad(view) {
        this._View = view;
    }
};
