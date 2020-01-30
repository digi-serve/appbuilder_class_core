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
                onChange: () => { }
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

                if (!(compareValue instanceof Date) && (
					rule == "less" ||
					rule == "greater" ||
					rule == "less_or_equal" ||
					rule == "greater_or_equal"
				))
                    compareValue = new Date(compareValue);

                let now = new Date();

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
                    case "less_current":
                        result = value < now;
                        break;
                    case "greater_current":
                        result = value > now;
                        break;
                    case "less_or_equal_current":
                        result = value <= now;
                        break;
                    case "greater_or_equal_current":
                        result = value >= now;
                        break;
                    case "last_days":
                        if (value <= now) {
                            let startDate = now.setDate(now.getDate() - compareValue); // Minus days
                            result = value > startDate;
                        }
                        else
                            result = false;
                        break;
                    case "next_days":
                        if (value >= now) {
                            let endDate = now.setDate(now.getDate() + compareValue); // Add days
                            result = value < endDate;
                        }
                        else
                            result = false;
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

                // if (Array.isArray(value)) value = [value];

                switch (rule) {
                    case "is_current_user":
                        result = value == this.Account.username;
                        break;
                    case "is_not_current_user":
                        result = value != this.Account.username;
                        break;
                    case "contain_current_user":

                        if (!Array.isArray(value))
                            value = [value];

                        result = (value || []).filter(v => (v.id || v) == this.Account.username).length > 0;
                        break;
                    case "not_contain_current_user":

                        if (!Array.isArray(value))
                            value = [value];

                        result = (value || []).filter(v => (v.id || v) == this.Account.username).length < 1;
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
                var query = this._Application.queries(
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

                if (!compareValue) return result;

                // if no query
                let query = this._Application.queries(
                    (q) => q.id == compareValue
                )[0];
                if (!query) return result;

                let qIdBase = "{idBase}-query-{id}"
                        .replace("{idBase}", idBase)
                        .replace("{id}", query.id),
                    inQueryFilter = new RowFilter(App, qIdBase);
                inQueryFilter.Account = this.Account;
                inQueryFilter.applicationLoad(this.application);
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

                if (!compareValue) return result;

                if (columnName) {
                    rowData = rowData[columnName] || {};
                }

                var dc = this._Application.datacollections(
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
                    case "contain_current_user":
                    case "not_contain_current_user":
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

                        if (this._Object == null)
                            return result;

                        // if > 1 copy of this object in query ==> Error!
                        let query = this._Application.queries(
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

        this._Fields = fields.filter(f => f && f.fieldIsFilterable());
        this._QueryFields = this._Fields ? this._Fields.filter(f => f && f.key == 'connectObject') : [];

        // insert our 'this object' entry if an Object was given.
        if (object) {

            this._Object = object;

            let thisObjOption = {
                id: 'this_object',
                label: object.label
            };

            // If object is query ,then should define default alias: "BASE_OBJECT"
            if (object instanceof ABObjectQuery) {
                thisObjOption.alias = 'BASE_OBJECT';
            }

            this._Fields.unshift(thisObjOption);
        }
        else {
            delete this._Object;
        }

    }

    setValue(settings) {
        this.config_settings = settings || {};

        this.config_settings.rules = this.config_settings.rules || [];
    }

};
