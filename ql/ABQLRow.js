/*
 * ABQLRow
 *
 * Defines all the QL operations that can be performed on a Row of data. This is a
 * Single row/instance of an object.
 *
 */

const QLUpdate = require("../../platform/ql/ABQLRowUpdate.js");
const QLSave = require("../../platform/ql/ABQLRowSave");
const QLPluck = require("../../platform/ql/ABQLRowPluck");

module.exports = [QLUpdate, QLSave, QLPluck];
