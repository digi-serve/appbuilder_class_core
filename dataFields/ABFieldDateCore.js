/*
 * ABFieldDate
 *
 * An ABFieldDate defines a date/datetime field type.
 *
 */

var ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
    // TODO:
    return altText; // AD.lang.label.getLabel(key) || altText;
}

var ABFieldDateDefaults = {
    key: "date", // unique key to reference this specific DataField

    icon: "calendar", // font-awesome icon reference.  (without the 'fa-').  so 'user'  to reference 'fa-user'

    // menuName: what gets displayed in the Editor drop list
    menuName: L("ab.dataField.date.menuName", "*Date"),

    // description: what gets displayed in the Editor description.
    description: L(
        "ab.dataField.date.description",
        "*Pick one from a calendar."
    ),

    supportRequire: true
};

var defaultValues = {
    includeTime: 0,
    defaultCurrentDate: 0,
    default: "",
    dayFormat: "%d",
    dayOrder: 1,
    dayDelimiter: "slash",
    monthFormat: "%m",
    monthOrder: 2,
    monthDelimiter: "slash",
    yearFormat: "%Y",
    yearOrder: 3,
    yearDelimiter: "slash",

    hourFormat: "%h",
    periodFormat: "none",
    timeDelimiter: "colon",

    validateCondition: "none",
    validateRangeUnit: "days",
    validateRangeBefore: 0,
    validateRangeAfter: 0,
    validateStartDate: null,
    validateEndDate: null
};

var delimiterList = [
    { id: "comma", value: "Comma", sign: ", " },
    { id: "slash", value: "Slash", sign: "/" },
    { id: "space", value: "Space", sign: " " },
    { id: "dash", value: "Dash", sign: "-" },
    { id: "colon", value: "Colon", sign: ":" }
];

/** Private methods **/
function getDelimiterSign(text) {
    var delimiterItem = delimiterList.filter((item) => {
        return item.id == text;
    })[0];

    return delimiterItem ? delimiterItem.sign : "";
}

function getDateFormat(setting) {
    var dateFormat = "";

    // Date format
    for (var i = 1; i <= 3; i++) {
        if (setting.dayOrder == i) {
            dateFormat += setting.dayFormat;
            dateFormat += i != 3 ? getDelimiterSign(setting.dayDelimiter) : "";
        }
        if (setting.monthOrder == i) {
            dateFormat += setting.monthFormat;
            dateFormat +=
                i != 3 ? getDelimiterSign(setting.monthDelimiter) : "";
        }
        if (setting.yearOrder == i) {
            dateFormat += setting.yearFormat;
            dateFormat += i != 3 ? getDelimiterSign(setting.yearDelimiter) : "";
        }
    }

    // Time format
    if (setting.includeTime == true) {
        dateFormat += " {hour}{delimiter}{minute}{period}"
            .replace("{hour}", setting.hourFormat)
            .replace("{delimiter}", getDelimiterSign(setting.timeDelimiter))
            .replace("{minute}", "%i")
            .replace(
                "{period}",
                setting.periodFormat != "none" ? " " + setting.periodFormat : ""
            );
    }

    return dateFormat;
}

function getDateDisplay(dateData, settings) {
    var dateFormat = getDateFormat(settings);

    return webix.Date.dateToStr(dateFormat)(dateData);
}

module.exports = class ABFieldDateCore extends ABField {
    constructor(values, object) {
        super(values, object, ABFieldDateDefaults);

        // we're responsible for setting up our specific settings:
        for (var dv in defaultValues) {
            this.settings[dv] = values.settings[dv] || defaultValues[dv];
        }

        // text to Int:
        this.settings.includeTime = parseInt(this.settings.includeTime);
        this.settings.defaultCurrentDate = parseInt(
            this.settings.defaultCurrentDate
        );
        this.settings.dayOrder = parseInt(this.settings.dayOrder);
        this.settings.monthOrder = parseInt(this.settings.monthOrder);
        this.settings.yearOrder = parseInt(this.settings.yearOrder);
    }

    // return the default values for this DataField
    static defaults() {
        return ABFieldDateDefaults;
    }

    ///
    /// Instance Methods
    ///

    ///
    /// Working with Actual Object Values:
    ///

    /**
     * @method defaultValue
     * insert a key=>value pair that represent the default value
     * for this field.
     * @param {obj} values a key=>value hash of the current values.
     */
    defaultValue(values) {
        // if no default value is set, then don't insert a value.
        if (values[this.columnName] == null) {
            // Set current date as default
            if (this.settings.defaultCurrentDate) {
                values[this.columnName] = new Date().toISOString();
            }
            // Specfic default date
            else if (this.settings.default) {
                values[this.columnName] = new Date(
                    this.settings.default
                ).toISOString();
            }
        }
    }

    /**
     * @method isValidData
     * Parse through the given data and return an error if this field's
     * data seems invalid.
     * @param {obj} data  a key=>value hash of the inputs to parse.
     * @param {OPValidator} validator  provided Validator fn
     * @return {array}
     */
    isValidData(data, validator) {
        super.isValidData(data, validator);

        if (data[this.columnName]) {
            var value = data[this.columnName];

            if (!(value instanceof Date)) {
                value = new Date(value);
            }

            // verify we didn't end up with an InValid Date result.
            if (
                Object.prototype.toString.call(value) === "[object Date]" &&
                isFinite(value)
            ) {
                var isValid = true;

                // Custom vaildate is here
                if (this.settings && this.settings.validateCondition) {
                    var startDate = this.settings.validateStartDate
                            ? new Date(this.settings.validateStartDate)
                            : null,
                        endDate = this.settings.validateEndDate
                            ? new Date(this.settings.validateEndDate)
                            : null,
                        startDateDisplay = getDateDisplay(
                            startDate,
                            this.settings
                        ),
                        endDateDisplay = getDateDisplay(endDate, this.settings);

                    switch (this.settings.validateCondition) {
                        case "dateRange":
                            //// TODO: Refactor this to move moment() into a platform specific solution:
                            // like this.minDate(), this.maxDate();
                            var minDate = moment()
                                .subtract(
                                    this.settings.validateRangeBefore,
                                    this.settings.validateRangeUnit
                                )
                                .toDate();
                            var maxDate = moment()
                                .add(
                                    this.settings.validateRangeAfter,
                                    this.settings.validateRangeUnit
                                )
                                .toDate();

                            if (minDate < value && value < maxDate)
                                isValid = true;
                            else {
                                isValid = false;
                                validator.addError(
                                    this.columnName,
                                    L(
                                        "ab.dataField.date.error.dateRange",
                                        "*Should be in between {startdate} and {enddate}"
                                    )
                                        .replace(
                                            "{startdate}",
                                            getDateDisplay(
                                                minDate,
                                                this.settings
                                            )
                                        )
                                        .replace(
                                            "{enddate}",
                                            getDateDisplay(
                                                maxDate,
                                                this.settings
                                            )
                                        )
                                );
                            }

                            break;
                        case "between":
                            if (startDate < value && value < endDate)
                                isValid = true;
                            else {
                                isValid = false;
                                validator.addError(
                                    this.columnName,
                                    L(
                                        "ab.dataField.date.error.between",
                                        "*Should be in between {startdate} and {enddate}"
                                    )
                                        .replace(
                                            "{startdate}",
                                            startDateDisplay
                                        )
                                        .replace("{enddate}", endDateDisplay)
                                );
                            }
                            break;
                        case "notBetween":
                            if (value < startDate && endDate < value)
                                isValid = true;
                            else {
                                isValid = false;
                                validator.addError(
                                    this.columnName,
                                    L(
                                        "ab.dataField.date.error.notBetween",
                                        "*Should not be in between {startdate} and {enddate}"
                                    )
                                        .replace(
                                            "{startdate}",
                                            startDateDisplay
                                        )
                                        .replace("{enddate}", endDateDisplay)
                                );
                            }
                            break;
                        case "=":
                            isValid = value.getTime() == startDate.getTime();
                            if (!isValid)
                                validator.addError(
                                    this.columnName,
                                    L(
                                        "ab.dataField.date.error.equal",
                                        "*Should equal {startdate}"
                                    ).replace("{startdate}", startDateDisplay)
                                );
                            break;
                        case "<>":
                            isValid = value.getTime() != startDate.getTime();
                            if (!isValid)
                                validator.addError(
                                    this.columnName,
                                    L(
                                        "ab.dataField.date.error.notEqual",
                                        "*Should not equal {startdate}"
                                    ).replace("{startdate}", startDateDisplay)
                                );
                            break;
                        case ">":
                            isValid = value.getTime() > startDate.getTime();
                            if (!isValid)
                                validator.addError(
                                    this.columnName,
                                    L(
                                        "ab.dataField.date.error.after",
                                        "*Should after {startdate}"
                                    ).replace("{startdate}", startDateDisplay)
                                );
                            break;
                        case "<":
                            isValid = value.getTime() < startDate.getTime();
                            if (!isValid)
                                validator.addError(
                                    this.columnName,
                                    L(
                                        "ab.dataField.date.error.before",
                                        "*Should before {startdate}"
                                    ).replace("{startdate}", startDateDisplay)
                                );
                            break;
                        case ">=":
                            isValid = value.getTime() >= startDate.getTime();
                            if (!isValid)
                                validator.addError(
                                    this.columnName,
                                    L(
                                        "ab.dataField.date.error.afterOrEqual",
                                        "*Should after or equal {startdate}"
                                    ).replace("{startdate}", startDateDisplay)
                                );
                            break;
                        case "<=":
                            isValid = value.getTime() <= startDate.getTime();
                            if (!isValid)
                                validator.addError(
                                    this.columnName,
                                    L(
                                        "ab.dataField.date.error.beforeOrEqual",
                                        "*Should before or equal {startdate}"
                                    ).replace("{startdate}", startDateDisplay)
                                );
                            break;
                    }
                }

                if (isValid) {
                    // all good, so store as ISO format string.
                    data[this.columnName] = value.toISOString();
                }
            } else {
                // return a validation error
                validator.addError(this.columnName, "Should be a Date!");
            }
        }
    }

    format(rowData) {
        var d = rowData[this.columnName];

        if (d == "" || d == null) {
            return "";
        }
        // convert ISO string -> Date() -> our formatted string

        // pull format from settings.
        return getDateDisplay(new Date(d), this.settings);
    }

    getDateFormat() {
        var setting = this.settings;
        var dateFormat = "";

        // Date format
        for (var i = 1; i <= 3; i++) {
            if (setting.dayOrder == i) {
                dateFormat += setting.dayFormat;
                dateFormat +=
                    i != 3 ? getDelimiterSign(setting.dayDelimiter) : "";
            }
            if (setting.monthOrder == i) {
                dateFormat += setting.monthFormat;
                dateFormat +=
                    i != 3 ? getDelimiterSign(setting.monthDelimiter) : "";
            }
            if (setting.yearOrder == i) {
                dateFormat += setting.yearFormat;
                dateFormat +=
                    i != 3 ? getDelimiterSign(setting.yearDelimiter) : "";
            }
        }

        // Time format
        if (setting.includeTime == true) {
            dateFormat += " {hour}{delimiter}{minute}{period}"
                .replace("{hour}", setting.hourFormat)
                .replace("{delimiter}", getDelimiterSign(setting.timeDelimiter))
                .replace("{minute}", "%i")
                .replace(
                    "{period}",
                    setting.periodFormat != "none"
                        ? " " + setting.periodFormat
                        : ""
                );
        }

        return dateFormat;
    }
};
