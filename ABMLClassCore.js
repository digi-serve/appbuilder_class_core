/**
 * ABMLClassCore
 * manage the multilingual information of an instance of a AB Defined Class.
 *
 * these classes have certain fields ("label", "description"), that can be
 * represented in different language options as defined by our platform.
 *
 * This core ABMLClass will internally track the multilingual fields
 * (this.mlFields) and auto
 */
import ABEmitter from "../platform/ABEmitter";
export default class ABMLClassCore extends ABEmitter {
   constructor(fieldList, AB) {
      super();
      this.mlFields = fieldList || ["label"];
      // {array}
      // field names of values that are multilingual

      this.AB = AB;
      // {ABFactory}
      // our common source of references for other AB objects
   }

   ///
   /// Static Methods
   ///
   /// Available to the Class level object.  These methods are not dependent
   /// on the instance values of the Application.
   ///

   /**
    * @method fromValues
    * called during the .fromValues() work chain.  Should be called
    * AFTER all the current data is already populated.
    */
   fromValues(attributes) {
      this.translations = attributes.translations;

      // if translations were provided
      if (this.translations) {
         // multilingual fields: label, description
         this.translate();
      } else {
         // maybe this came from a form that has ML values in the attributes, but
         // no .translations[] yet:
         // check for mlFields in attributes and record them here:
         (this.mlFields || []).forEach((field) => {
            if (attributes[field]) {
               this[field] = attributes[field];
            }
         });
      }
   }

   /**
    * @function defaultTranslations()
    * return an initial .translations entry to initialize the
    * translations values of a given translateable object.
    * @param {array} fields  the multilingual fields this obj manages.
    * @param {json}  values  a default set of values for this object.
    * @return {array}  of translation entries.
    */
   defaultTranslations(fields, values) {
      values = values || {};

      var entry = {
         // Question: should this be this.AB.Multilingual.currentLanguage() || "en"
         // currently since the defaults are sent in programattically, we are
         // expecting the labels to be in "en"
         language_code: "en",
      };

      fields.forEach((f) => {
         entry[f] = values[f] || f;
      });

      return [entry];
   }

   /**
    * @method languageDefault
    * return a default language code.
    * @return {string}
    */
   languageDefault() {
      return "en";
   }

   /**
    * @method toObj()
    * called during the .toObj() work chain.  Should be called
    * BEFORE the current data is populated.
    */
   toObj() {
      this.unTranslate();

      return {
         translations: this.translations,
      };
   }

   /**
    * @method toDefinition()
    * convert this instance into an ABDefinition object.
    * @return {ABDefinition}
    */
   toDefinition() {
      return this.AB.definitionNew({
         id: this.id,
         name: this.name,
         type: this.type,
         json: this.toObj(),
      });
   }

   /**
    * @method translate
    * Given a set of json data, pull out any multilingual translations
    * and flatten those values to the base object.
    * @param {obj} obj  The instance of the object being translated
    * @param {json} json The json data being used for translation.
    *                      There should be json.translations = [ {transEntry}, ...]
    *                      where transEntry = {
    *                          language_code:'en',
    *                          field1:'value',
    *                          ...
    *                      }
    * @param {array} fields an Array of multilingual fields to pull to
    *                       the obj[field] value.
    */
   translate(obj, json, fields, languageCode = null) {
      if (!obj) obj = this;
      if (!json) json = this;
      if (!fields) fields = this.mlFields || [];

      if (!json.translations) {
         json.translations = [];
      }

      if (typeof json.translations == "string") {
         json.translations = JSON.parse(json.translations);
      }

      var currLanguage = languageCode || this.languageDefault();

      if (fields && fields.length > 0) {
         // [fix] if no matching translation is in our json.translations
         //       object, then just use the 1st one.
         var first = null; // the first translation entry encountered
         var found = false; // did we find a matching translation?

         json.translations.forEach(function (t) {
            if (!first) first = t;

            // find the translation for the current language code
            if (t.language_code == currLanguage) {
               found = true;

               // copy each field to the root object
               fields.forEach(function (f) {
                  if (t[f] != null) obj[f] = t[f];

                  obj[f] = t[f] || ""; // default to '' if not found.
               });
            }
         });

         // if !found, then use the 1st entry we did find.  prepend desired
         // [language_code] to each of the fields.
         if (!found && first) {
            // copy each field to the root object
            fields.forEach(function (f) {
               if (first[f] != null && first[f] != "")
                  obj[f] = `[${currLanguage}]${first[f]}`;
               else obj[f] = ""; // default to '' if not found.
            });
         }
      }
   }

   /**
    * @method unTranslate
    * Take the multilingual information in the base obj, and push that
    * down into the json.translations data.
    * @param {obj} obj  The instance of the object with the translation
    * @param {json} json The json data being used for translation.
    *                      There should be json.translations = [ {transEntry}, ...]
    *                      where transEntry = {
    *                          language_code:'en',
    *                          field1:'value',
    *                          ...
    *                      }
    * @param {array} fields an Array of multilingual fields to pull from
    *                       the obj[field] value.
    */
   unTranslate(obj, json, fields) {
      if (!obj) obj = this;
      if (!json) json = this;
      if (!fields) fields = this.mlFields || [];

      if (!json.translations) {
         json.translations = [];
      }

      var currLanguage = this.languageDefault();

      if (fields && fields.length > 0) {
         var foundOne = false;

         json.translations.forEach(function (t) {
            // find the translation for the current language code
            if (t.language_code == currLanguage) {
               // copy each field to the root object
               fields.forEach(function (f) {
                  // verify obj[f] is defined
                  // --> DONT erase the existing translation
                  if (obj[f] != null) {
                     t[f] = obj[f];
                  }
               });

               foundOne = true;
            }
         });

         // if we didn't update an existing translation
         if (!foundOne) {
            // create a translation entry:
            var trans = {};

            // assume current languageCode:
            trans.language_code = currLanguage;

            fields.forEach(function (field) {
               if (obj[field] != null) {
                  trans[field] = obj[field];
               }
            });

            json.translations.push(trans);
         }
      }
   }
}
