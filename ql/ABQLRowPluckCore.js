/*
/*
 * ABQLRowPluckCore
 *
 * An ABQLRowPluckCore can process a value of data and puck out a specified
 * field to then make an object of values that only contain that field.
 *
 */

const ABQLValue = require("./ABQLValue.js");
const ABQLSetPluck = require("../../platform/ql/ABQLSetPluck.js");

class ABQLRowPluckCore extends ABQLSetPluck {
}

ABQLRowPluckCore.key = "row_pluck";
ABQLRowPluckCore.label = "pluck";
ABQLRowPluckCore.NextQLOps = ABQLValue;

module.exports = ABQLRowPluckCore;
