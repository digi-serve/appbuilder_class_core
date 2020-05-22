// // Import our Custom Components here:
// import CustomComponentManager from '../webix_custom_components/customComponentManager'

var EventEmitter = require("events").EventEmitter;

// just keep a running counter for ABComponents
var _countUID = 0;
function uid() {
   return _countUID++;
}

module.exports = class ABComponentCore extends EventEmitter {
   /**
    * @param {object} App
    *      ?what is this?
    * @param {string} idBase
    *      Identifier for this component
    */
   constructor(App, idBase) {
      super();

      var L = this.Label;

      if (!App) {
         App = {
            uuid: uid(),

            /*
             * actions:
             * a hash of exposed application methods that are shared among our
             * components, so one component can invoke an action that updates
             * another component.
             */
            actions: {},

            /*
             * config
             * webix configuration settings for our current browser
             */
            config: {},

            /*
             * custom
             * a collection of custom components for this App Instance.
             */
            custom: {},

            Label: L,

            /*
             * labels
             * a collection of labels that are common for the Application.
             */
            labels: {},

            /*
             * unique()
             * A function that returns a globally unique Key.
             * @param {string} key   The key to modify and return.
             * @return {string}
             */
            unique: function(key) {
               return key + this.uuid;
            }
         };
      }

      // var componentManager = new CustomComponentManager();
      // componentManager.initComponents(App);

      this.App = App;

      this.idBase = idBase || "?idbase?";
   }

   actions(_actions) {
      if (_actions) {
         for (var a in _actions) {
            this.App.actions[a] = _actions[a];
         }
      }
   }

   Label(key, altText) {
      return altText;
   }

   unique(key) {
      return this.App.unique(this.idBase + "_" + key);
   }
};
