import ABQLSetFirst from "../../platform/ql/ABQLSetFirst.js";
import ABQLSetPluck from "../../platform/ql/ABQLSetPluck.js";
import ABQLSetSave from "../../platform/ql/ABQLSetSave.js";

/*
 * ABQLSet
 *
 * Here we define the group of operations that can be performed on a SET of data.
 * A SET is an array of objects/row data.
 *
 */

export default [ABQLSetFirst, ABQLSetPluck, ABQLSetSave];
