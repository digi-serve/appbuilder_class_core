//
// Labels.js
//
// The index into our label library.

var Labels = {};
// {hash}  { /* language_code : { key: label} */ }
// all the <lang_code>.js files supported by the AppBuilder

Labels.en = require("./en.js");

module.exports = Labels;
