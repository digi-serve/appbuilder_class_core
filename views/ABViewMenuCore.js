const ABViewWidget = require("../../platform/views/ABViewWidget");

const ABViewMenuPropertyComponentDefaults = {
   orientation: "x",
   buttonStyle: "ab-menu-default",
   menuAlignment: "ab-menu-left",
   menuInToolbar: 1,
   menuPadding: 10,
   menuTheme: "bg_gray",
   menuPosition: "left",
   menuTextLeft: "",
   menuTextRight: "",
   menuTextCenter: "",
   // [
   // 		{
   //			pageId: uuid,
   //			tabId: uuid,
   //			type: string, // "page", "tab"
   //			isChecked: bool,
   //			aliasname: string,
   //			translations: []
   //		}
   // ]
   pages: [],
   order: []
};

const ABMenuDefaults = {
   key: "menu", // {string} unique key for this view
   icon: "th-large", // {string} fa-[icon] reference for this view
   labelKey: "ab.components.menu" // {string} the multilingual label key for the class label
};

module.exports = class ABViewMenuCore extends ABViewWidget {
   /**
    * @param {obj} values  key=>value hash of ABView values
    * @param {ABApplication} application the application object this view is under
    * @param {ABViewWidget} parent the ABViewWidget this view is a child of. (can be null)
    */
   constructor(values, application, parent, defaultValues) {
      super(values, application, parent, defaultValues || ABMenuDefaults);
   }

   static common() {
      return ABMenuDefaults;
   }

   static defaultValues() {
      return ABViewMenuPropertyComponentDefaults;
   }

   ///
   /// Instance Methods
   ///

   /**
    * @method toObj()
    *
    * properly compile the current state of this ABViewMenu instance
    * into the values needed for saving.
    *
    * @return {json}
    */
   toObj() {
      this.unTranslate(this, this, [
         "menuTextLeft",
         "menuTextCenter",
         "menuTextRight"
      ]);
      if (this.settings.pages) {
         this.settings.pages.forEach((page) => {
            this.unTranslate(page, page, ["aliasname"]);
         });
      }

      var obj = super.toObj();
      obj.viewIDs = [];
      return obj;
   }

   /**
    * @method fromValues()
    *
    * initialze this object with the given set of values.
    * @param {obj} values
    */
   fromValues(values) {
      super.fromValues(values);

      this.translate(this, this, [
         "menuTextLeft",
         "menuTextCenter",
         "menuTextRight"
      ]);

      this.settings.pages =
         this.settings.pages || ABViewMenuPropertyComponentDefaults.pages;

      for (var i = 0; i < this.settings.pages.length; i++) {
         var page = this.settings.pages[i];
         if (page instanceof Object) {
            page.isChecked = JSON.parse(page.isChecked || false);

            this.translate(page, page, ["aliasname"]);
         }
         // Compatible with old data
         else if (typeof page == "string") {
            this.settings.pages[i] = {
               pageId: page,
               isChecked: true
            };
         }
      }
   }

   /**
    * @method componentList
    * return the list of components available on this view to display in the editor.
    */
   componentList() {
      return [];
   }

   ClearPagesInView(view) {
      // clear menu items
      if (view && view.count() > 1) {
         view.find({}).forEach((item) => {
            view.remove(item.id);
         });
      }
   }

   AddPagesToView(view, pages) {
      if (!view || !pages) return;

      (pages || []).forEach((displayPage) => {
         if (displayPage.isChecked) {
            let existsPage = this.application.pages(
               (p) => p.id == displayPage.pageId,
               true
            )[0];
            if (!existsPage) return;

            var pageAccessLevel = existsPage.getUserAccess();
            if (pageAccessLevel == 0) return;

            if (displayPage.tabId) {
               let existsTab = this.application.views(
                  (v) => v.id == displayPage.tabId,
                  true
               )[0];
               if (!existsTab) return;

               var tabAccessLevel = existsTab.getUserAccess();
               if (tabAccessLevel == 0) return;
            }

            let label = this.getAliasname(displayPage);
            // create a temporaty store for the menu item
            var menuItem;
            // check if page has a parent or not
            if (displayPage.parent && displayPage.parent != "0") {
               // if page has a parent attempt to grab its submenu
               menuItem = view.getSubMenu(displayPage.parent);
            } else {
               // if the page doesn't have parent use the current menu
               menuItem = view;
            }
            // if the menu item doesn't have a menu selected find it
            if (menuItem == null) {
               // get the menu item
               var curMenu = view.getMenuItem(displayPage.parent);
               // create a submenu placeholder
               curMenu.submenu = [];
               // update the menu with the new submenu included
               view.refresh(displayPage.parent);
               // get the submenu we just created
               menuItem = view.getSubMenu(displayPage.parent);
            }
            if (menuItem.exists(displayPage.tabId || displayPage.pageId))
               return;
            // add a new item to the menu/submenu
            menuItem.add(
               {
                  id: displayPage.tabId || displayPage.pageId,
                  value: label,
                  type: displayPage.type,
                  pageId: displayPage.pageId,
                  icon: displayPage.icon
                     ? "fa fa-fw fa-" + displayPage.icon
                     : ""
               },
               displayPage.position ? parseInt(displayPage.position) : 0
            );
         }
      });
   }

   /**
    * @method getAliasname
    * @param {object} pageInfo - an object in settings
    * @param {uuid} pageInfo.pageId
    * @param {uuid} pageInfo.tabId
    * @param {string} pageInfo.type "page" or "tab"
    * @param {boolean} pageInfo.isChecked
    * @param {string} pageInfo.aliasname
    * @param {Array} pageInfo.translations
    * @return {string}
    */
   getAliasname(pageInfo) {
      var translation = pageInfo.translations.filter((t) => {
         return t.language_code == AD.lang.currentLanguage;
      });

      var label = "";

      if (translation.length) {
         if (translation[0].aliasname) {
            label = translation[0].aliasname;
         } else if (translation[0].label) {
            label = translation[0].label;
         }
      }

      // Just in case there isn't one stored in the translations yet
      if (!label && pageInfo.aliasname) {
         label = pageInfo.aliasname;
      }

      // if alias is empty, then find label of page or tab
      if (
         !label ||
         // remove [en] or [th] etc.
         !label.replace(/\[.{2,}\]/g, "")
      ) {
         // first check to see if we are actually on a page
         // if not recursivly look up for the nearest parent page
         var pageId;
         if (pageInfo.pageId) {
            pageId = pageInfo.pageId;
         } else {
            pageId = this.getParentPageId(pageInfo);
         }
         // find label of the actual page
         var page = this.application.pages((p) => p.id == pageId, true)[0];
         if (page) {
            // find label of the tab view
            if (pageInfo.type == "tab" || pageInfo.key == "viewcontainer") {
               var tabView = page.views(
                  (v) => v.id == pageInfo.tabId || v.id == pageInfo.id,
                  true
               )[0];
               if (tabView) {
                  label = tabView.label;
               }
            } else {
               label = page.label;
            }
         }
      }

      return label;
   }

   getParentPageId(currentView) {
      if (currentView.key != "page") {
         return this.getParentPageId(currentView.parent);
      } else {
         return currentView.id;
      }
   }

   copy(lookUpIds, parent) {
      return super.copy(lookUpIds, parent).then((result) => {
         // update ids of page's settings
         (result.settings.pages || []).forEach((p, i) => {
            let page = result.settings.pages[i];

            // Compatible with old data
            if (typeof page == "string") {
               result.settings.pages[i] = lookUpIds[page];
            } else {
               page.pageId = lookUpIds[page.pageId];
               page.tabId = lookUpIds[page.tabId];
            }
         });

         return result.save().then(() => {
            return result;
         });
      });
   }
};
