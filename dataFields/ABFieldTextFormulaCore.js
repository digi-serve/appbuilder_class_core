/*
 * ABFieldTextFormula
 *
 * An ABFieldTextFormula defines a TextFormula field type.
 *
 */

const ABField = require("../../platform/dataFields/ABField");

function L(key, altText) {
   // TODO:
   return altText; // AD.lang.label.getLabel(key) || altText;
}

const ABFieldTextFormulaDefaults = {
   key: "TextFormula",
   // unique key to reference this specific DataField

   description: "Text Formula",
   // description: what gets displayed in the Editor description.
   // NOTE: this will be displayed using a Label: L(description)

   icon: "question",
   // font-awesome icon reference.  (without the 'fa-').  so 'question'  to
   // reference 'fa-question'

   isFilterable: false,
   // {bool} / {fn}
   // determines if the current ABField can be used to filter (FilterComplex
   // or Query) data.
   // if a {fn} is provided, it will be called with the ABField as a parameter:
   //  (field) => field.setting.something == true

   isSortable: false,
   // {bool} / {fn}
   // determines if the current ABField can be used to Sort data.
   // if a {fn} is provided, it will be called with the ABField as a parameter:
   //  (field) => true/false

   menuName: "Text Formula",
   // menuName: what gets displayed in the Editor drop list
   // NOTE: this will be displayed using a Label: L(menuName)

   supportRequire: false,
   // {bool}
   // does this ABField support the Required setting?

   supportUnique: false,
   // {bool}
   // does this ABField support the Unique setting?

   useAsLabel: true,
   // {bool} / {fn}
   // determines if this ABField can be used in the display of an ABObject's
   // label.

   compatibleOrmTypes: ["string"],
   // {array}
   // what types of Sails ORM attributes can be imported into this data type?
   // http://sailsjs.org/documentation/concepts/models-and-orm/attributes#?attribute-options

   compatibleMysqlTypes: ["text", "mediumtext", "longtext"],
   // {array}
   // what types of MySql column types can be imported into this data type?
   // https://www.techonthenet.com/mysql/datatypes.php
};

// defaultValues: the keys must match a .name of your elements to set it's default value.
const defaultValues = {
   textFormula: "",
   // {string} "some text or text with formula ..."
   // This tells us what the formula we need to do with text included text string.
   // if we don't have this, the old value which we filled out won't be cleared when we do "Add field" this type again.

   // 'imageWidth':'',
   // 'useHeight': 0,
   // 'imageHeight': ''
};

/** Private methods */

/**
 * @method setValueToFormula
 *
 * @param {ABOBject} object
 * @param {string} formulaString
 * @param {object} rowData
 */

function setValueToFormula(object, formulaString, rowData) {
   if (!formulaString) return;

   const fieldRegExp = /{[^{}]+}/gm;
   const matches_field_array = formulaString.match(fieldRegExp);
   matches_field_array.forEach((element) => {
      const columnName = element.replace(/{|}|"/g, "");
      object.fields().forEach((field) => {
         if (field.columnName == columnName) {
            if (field.key == "AutoIndex") {
               //Check AutoIndex Field
               const autoIndexVal = field.format(rowData) || 0;
               formulaString = formulaString.replace(element, autoIndexVal);
            } else if (field.key == "calculate") {
               //Calculate Field
               const calVal = `(${field.format(rowData) || 0})`;
               formulaString = formulaString.replace(element, eval(calVal));
            } else if (field.key == "date") {
               formulaString = formulaString.replace(
                  element,
                  rowData[columnName]
                     ? field.exportValue(rowData[columnName])
                     : ""
               );
            } else {
               formulaString = formulaString.replace(
                  element,
                  rowData[columnName] ? field.format(rowData) : ""
               );
            }
         }
      });
   });

   return formulaString;
}

/**
 * @method setBuildinValueToFormula
 *
 * @param {ABFactory} AB
 * @param {string} formulaString
 */

function setBuildinValueToFormula(AB, formulaString) {
   const buildInRegExp = /\w+\(.*?\)/gm;
   const matches_buildin_array = formulaString.match(buildInRegExp);
   if (matches_buildin_array) {
      const buildinList = getBuildInFunction();
      matches_buildin_array.forEach((element) => {
         const formula_array = element.split(/\(|\)/);
         const isBracketInBracket =
            formula_array.length > 2 && formula_array[2] != "";
         const functionName = formula_array[0];
         const parameters_array = formula_array[1].split(",");
         let isMatch = false;
         for (let i = 0; i < buildinList.length; i++) {
            let resultParameters = element;
            if (functionName == buildinList[i].id) {
               if (parameters_array.length == buildinList[i].parameter_size) {
                  switch (functionName) {
                     case "left":
                        resultParameters = getLeft(
                           parameters_array[0],
                           parameters_array[1]
                        );
                        break;
                     case "right":
                        resultParameters = getRight(
                           parameters_array[0],
                           parameters_array[1]
                        );
                        break;
                     case "mid":
                        resultParameters = getMid(
                           parameters_array[0],
                           parameters_array[1],
                           parameters_array[2]
                        );
                        break;
                     case "trim":
                        resultParameters = getTrim(parameters_array[0]);
                        break;
                     case "trimLeft":
                        resultParameters = getTrimLeft(parameters_array[0]);
                        break;
                     case "trimRight":
                        resultParameters = getTrimRight(parameters_array[0]);
                        break;
                     case "length":
                        resultParameters = getLength(parameters_array[0]);
                        break;
                     case "regexReplace":
                        resultParameters = getRegExpReplace(
                           parameters_array[0],
                           parameters_array[1].trimLeft(),
                           parameters_array[2].trimLeft()
                        );
                        break;
                     case "extractRegex":
                        resultParameters = getExtractRegex(
                           parameters_array[0],
                           parameters_array[1].trimLeft()
                        );
                        break;
                     case "replace":
                        resultParameters = getReplace(
                           parameters_array[0],
                           parameters_array[1].trimLeft(),
                           parameters_array[2].trimLeft()
                        );
                        break;
                     case "lower":
                        resultParameters = getLower(parameters_array[0]);
                        break;
                     case "upper":
                        resultParameters = getUpper(parameters_array[0]);
                        break;
                     case "capitalize":
                        resultParameters = getCapitalize(parameters_array[0]);
                        break;
                     case "random":
                        resultParameters = getRandom(parameters_array[0]);
                        break;
                     case "numberToWords":
                        resultParameters = getNumberToWords(
                           parameters_array[0]
                        );
                        break;
                     case "getDateDayOfWeekName":
                        if (isBracketInBracket) {
                           element = element + ")";
                        }
                        resultParameters = getDateDayOfWeekName(
                           AB,
                           parameters_array[0]
                        );
                        break;
                     case "getDateMonthOfYearName":
                        if (isBracketInBracket) {
                           element = element + ")";
                        }
                        resultParameters = getDateMonthOfYearName(
                           AB,
                           parameters_array[0]
                        );
                        break;
                     case "formatDate":
                        resultParameters = getFormatDate(
                           parameters_array[0],
                           parameters_array[1].trimLeft()
                        );
                        break;
                     default:
                        break;
                  }
                  isMatch = true;
                  formulaString = formulaString.replace(
                     element,
                     resultParameters
                  );
                  return;
               } else {
                  resultParameters = functionName + "(Bad Parameter)";
                  formulaString = formulaString.replace(
                     element,
                     resultParameters
                  );
               }
            }
         }
      });
   }
   return formulaString;
}

function getBuildInFunction() {
   const functionList = [
      {
         id: "left",
         value: "left({COLUMN_NAME}, 1)",
         type: "build-in",
         parameter_size: 2,
      },
      {
         id: "right",
         value: "right({COLUMN_NAME}, 1)",
         type: "build-in",
         parameter_size: 2,
      },
      {
         id: "mid",
         value: "mid({COLUMN_NAME}, 1, 1)",
         type: "build-in",
         parameter_size: 3,
      },
      {
         id: "trim",
         value: "trim({COLUMN_NAME})",
         type: "build-in",
         parameter_size: 1,
      },
      {
         id: "trimLeft",
         value: "trimLeft({COLUMN_NAME})",
         type: "build-in",
         parameter_size: 1,
      },
      {
         id: "trimRight",
         value: "trimRight({COLUMN_NAME})",
         type: "build-in",
         parameter_size: 1,
      },
      {
         id: "length",
         value: "length({COLUMN_NAME})",
         type: "build-in",
         parameter_size: 1,
      },
      {
         id: "regexReplace",
         value: "regexReplace({COLUMN_NAME}, [*], REPLACE_VALUE)",
         type: "build-in",
         parameter_size: 3,
      },
      {
         id: "extractRegex",
         value: "extractRegex({COLUMN_NAME}, [*])",
         type: "build-in",
         parameter_size: 2,
      },
      {
         id: "replace",
         value: "replace({COLUMN_NAME}, SEARCH_VALUE, REPLACE_VALUE)",
         type: "build-in",
         parameter_size: 3,
      },
      {
         id: "lower",
         value: "lower({COLUMN_NAME})",
         type: "build-in",
         parameter_size: 1,
      },
      {
         id: "upper",
         value: "upper({COLUMN_NAME})",
         type: "build-in",
         parameter_size: 1,
      },
      {
         id: "capitalize",
         value: "capitalize({COLUMN_NAME})",
         type: "build-in",
         parameter_size: 1,
      },
      { id: "random", value: "random(1)", type: "build-in", parameter_size: 1 },
      {
         id: "numberToWords",
         value: "numberToWords({NUMBER_COLUMN} or 012...)",
         type: "build-in",
         parameter_size: 1,
      },
      {
         id: "getDateDayOfWeekName",
         value: "getDateDayOfWeekName({DATE_COLUMN})",
         type: "build-in",
         parameter_size: 1,
      },
      {
         id: "getDateMonthOfYearName",
         value: "getDateMonthOfYearName({DATE_COLUMN})",
         type: "build-in",
         parameter_size: 1,
      },
      {
         id: "formatDate",
         value: "formatDate({DATE_COLUMN}, OUTPUT_FORMAT)",
         type: "build-in",
         parameter_size: 2,
      },
   ];
   return functionList;
}

function getLeft(string, endPosition) {
   return string.substring(0, parseInt(endPosition));
}

function getRight(string, endposition) {
   const reverseStr = reverseString(string).substring(0, parseInt(endposition));
   return reverseString(reverseStr);
}

function reverseString(string) {
   return string.split(" ").reverse().join(" ");
}

function getMid(string, startPosition, length) {
   if (string.length < startPosition) return "mid(Bad Parameter)";
   return string.substring(
      parseInt(startPosition),
      parseInt(startPosition) + parseInt(length)
   );
}

function getTrim(string) {
   return string.trim();
}

function getTrimLeft(string) {
   return string.trimLeft();
}

function getTrimRight(string) {
   return string.trimRight();
}

function getLength(string) {
   return string.length;
}

function getRegExpReplace(string, regexp, replaceString) {
   return string.replace(regexp, replaceString);
}

function getExtractRegex(string, regexp) {
   const extractResult = string.match(regexp);
   if (Array.isArray(extractResult)) {
      return extractResult[0];
   }
   return extractResult;
}

function getReplace(string, searchValue, replaceValue) {
   return string.replace(searchValue, replaceValue);
}

function getLower(string) {
   return string.toLowerCase();
}

function getUpper(string) {
   return string.toUpperCase();
}

function getCapitalize(string) {
   return string
      .toLowerCase()
      .split(" ")
      .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
      .join(" ");
}

function getRandom(max) {
   return Math.floor(Math.random() * (max + 1));
}

function getNumberToWords(number) {
   const string = number.trim(",").toString();

   let units,
      tens,
      scales,
      start,
      end,
      chunks,
      chunksLen,
      chunk,
      ints,
      i,
      word,
      words;

   const and = "";

   /* Is number zero? */
   if (parseInt(string) === 0) {
      return "zero";
   }

   /* Array of units as words */
   units = [
      "",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
   ];

   /* Array of tens as words */
   tens = [
      "",
      "",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
   ];

   /* Array of scales as words */
   scales = [
      "",
      "thousand",
      "million",
      "billion",
      "trillion",
      "quadrillion",
      "quintillion",
      "sextillion",
      "septillion",
      "octillion",
      "nonillion",
      "decillion",
      "undecillion",
      "duodecillion",
      "tredecillion",
      "quatttuor-decillion",
      "quindecillion",
      "sexdecillion",
      "septen-decillion",
      "octodecillion",
      "novemdecillion",
      "vigintillion",
      "centillion",
   ];

   /* Split user arguemnt into 3 digit chunks from right to left */
   start = string.length;
   chunks = [];
   while (start > 0) {
      end = start;
      chunks.push(string.slice((start = Math.max(0, start - 3)), end));
   }

   /* Check if function has enough scale words to be able to stringify the user argument */
   chunksLen = chunks.length;
   if (chunksLen > scales.length) {
      return "";
   }

   /* Stringify each integer in each chunk */
   words = [];
   for (i = 0; i < chunksLen; i++) {
      chunk = parseInt(chunks[i]);

      if (chunk) {
         /* Split chunk into array of individual integers */
         ints = chunks[i].split("").reverse().map(parseFloat);

         /* If tens integer is 1, i.e. 10, then add 10 to units integer */
         if (ints[1] === 1) {
            ints[0] += 10;
         }

         /* Add scale word if chunk is not zero and array item exists */
         if ((word = scales[i])) {
            words.push(word);
         }

         /* Add unit word if array item exists */
         if ((word = units[ints[0]])) {
            words.push(word);
         }

         /* Add tens word if array item exists */
         if ((word = tens[ints[1]])) {
            words.push(word);
         }

         /* Add 'and' string after units or tens integer if: */
         if (ints[0] || ints[1]) {
            /* Chunk has a hundreds integer or chunk is the first of multiple chunks */
            if (ints[2] || (!i && chunksLen)) {
               words.push(and);
            }
         }

         /* Add hundreds word if array item exists */
         if ((word = units[ints[2]])) {
            words.push(word + " hundred");
         }
      }
   }

   return words.reverse().join(" ");
}

function getDateDayOfWeekName(AB, date) {
   // const localizeDT = moment(date);
   // localizeDT.locale(AD.lang.currentLanguage);
   // return localizeDT.format("dddd");

   return AB.toDateFormat(date, {
      format: "dddd",
      localeCode: AB.Account.language(),
   });
}

function getDateMonthOfYearName(AB, date) {
   // const localizeDT = moment(date);
   // localizeDT.locale(AD.lang.currentLanguage);
   // return localizeDT.format("MMMM");

   return AB.toDateFormat(date, {
      format: "MMMM",
      localeCode: AB.Account.language(),
   });
}

function getFormatDate(date, format) {
   const dt = new Date(date);
   return dt.toString(format);
}

module.exports = class ABFieldTextFormulaCore extends ABField {
   constructor(values, object) {
      super(values, object, ABFieldTextFormulaDefaults);

      /*
    	{
			settings: {
				textDefault: 'string',
				supportMultilingual: true/false
			}
    	}
    	*/

      // // text to Int:
      // this.settings.supportMultilingual = parseInt(this.settings.supportMultilingual);
   }

   // return the default values for this DataField
   static defaults() {
      return ABFieldTextFormulaDefaults;
   }

   static defaultValues() {
      return defaultValues;
   }

   static getBuildInFunction() {
      return getBuildInFunction();
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method defaultValue
    * insert a key=>value pair that represent the default value
    * for this field.
    * @param {obj} values a key=>value hash of the current values.
    */
   defaultValue(values) {
      // if no default value is set, then don't insert a value.
      if (!values[this.columnName]) {
         // Set default value
         // values[this.columnName] = this.settings.DEFAULT_VALUE;
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
      validator = super.isValid();

      // validator.addError(this.columnName, L('ab.validation.object.name.unique', 'Field columnName must be unique (#name# already used in this Application)').replace('#name#', this.name) );

      return validator;
   }

   /*
    * @property isMultilingual
    * does this field represent multilingual data?
    * @return {bool}
    */
   get isMultilingual() {
      // return this.settings.supportMultilingual == 1;
      return false;
   }

   format(rowData) {
      try {
         if (!this.settings.textFormula) return "";

         let resultFormula = this.settings.textFormula;

         //Set Field value first
         resultFormula = setValueToFormula(this.object, resultFormula, rowData);

         //then Check Build-in Function
         resultFormula = setBuildinValueToFormula(this.AB, resultFormula);

         return resultFormula;
      } catch (err) {
         return "";
      }
   }
};

//// NOTE: if you need a unique [edit_type] by your returned config.editor above:
// webix.editors = {
//   "[edit_type]": {
//     focus: function () {...}
//     getValue: function () {...},
//     setValue: function (value) {...},
//     render: function () {...}
//   }
// };

//// NOTE: if you need a unique [sort_type] by your returned config.sort above:
// webix.DataStore.prototype.sorting.as.[sort_type] = function(a,b){
//     return a > b ? 1 : -1;
// }
