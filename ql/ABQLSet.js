/*
 * ABQLSet
 *
 * Here we define the group of operations that can be performed on a SET of data.
 * A SET is an array of objects/row data.
 *
 */

export default [
   await import("../../platform/ql/ABQLSetFirst.js"),
   await import("../../platform/ql/ABQLSetPluck.js"),
   await import("../../platform/ql/ABQLSetSave.js"),
];
