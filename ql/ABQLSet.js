/*
 * ABQLSet
 *
 * Here we define the group of operations that can be performed on a SET of data.
 * A SET is an array of objects/row data.
 *
 */

module.exports = [
   require("../../platform/ql/ABQLSetFirst.js"),
   require("../../platform/ql/ABQLSetPluck.js"),
   require("../../platform/ql/ABQLSetSave.js")
];
