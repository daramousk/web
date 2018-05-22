// © 2018 Therp BV <http://therp.nl>
// License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
openerp.web_widget_keyboard_navigation_mixin = function (instance) {
    "use strict";
    var instance = openerp;
    var BrowserDetection = instance.web_widget_keyboard_navigation_mixin.BrowserDetection;
    /**
     * list of the key that should not be used as accesskeys. Either because we want to reserve them for a specific behavior in Odoo or
     * because they will not work in certain browser/OS
     */
    var knownUnusableAccessKeys = [' ',
        'A', // reserved for Odoo Edit
        'C', // reserved for Odoo Create
        'H', // reserved for Odoo Home
        'J', // reserved for Odoo Discard
        'K', // reserved for Odoo Kanban view
        'L', // reserved for Odoo List view
        'N', // reserved for Odoo pager Next
        'P', // reserved for Odoo pager Previous
        'S', // reserved for Odoo Save
        'Q', // reserved for Odoo Search
        'E', // chrome does not support 'E' access key --> go to address bar to search google
        'F', // chrome does not support 'F' access key --> go to menu
        'D', // chrome does not support 'D' access key --> go to address bar
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' // reserved for Odoo menus
    ];

    openerp.web_widget_keyboard_navigation_mixin.KeyboardNavigationMixin = instance.web.Widget.extend({
        events: {
            'keydown': '_onKeyDown',
            'keypress': '_onKeyPress',
            'keyup': '_onKeyUp',
        },

        init: function (parent) {
            console.log('widget init')
            this._areAccessKeyVisible = false;
            this._super(parent);
        },

        _addAccessKeyOverlays: function () {
            var accesskeyElements = $(document).find('[accesskey]').filter(':visible');
            _.each(accesskeyElements, function (elem) {
                var overlay = $(_.str.sprintf("<div class='o_web_accesskey_overlay'>%s</div>", $(elem).attr('accesskey').toUpperCase()));
                if (elem.tagName.toUpperCase() === "INPUT") {
                    // special case for the search input that has an access key defined. We cannot set the overlay on the input itself, only on its parent
                    overlay.appendTo($(elem).parent().css('position', 'relative'));
                }
                else {
                    overlay.appendTo($(elem).css('position', 'relative'));
                }
            });
        },

        _getAllUsedAccessKeys: function () {
            var usedAccessKeys = knownUnusableAccessKeys.slice();
            this.$el.find('[accesskey]').each(function (_, elem) {
                usedAccessKeys.push(elem.accessKey.toUpperCase());
            });
            return usedAccessKeys;
        },

        _hideAccessKeyOverlay: function () {
            this._areAccessKeyVisible = false;
            var overlays = this.$el.find('.o_web_accesskey_overlay');
            if (overlays.length) {
                return overlays.remove();
            }
        },
        
        _setAccessKeyOnTopNavigation: function () {
            this.$el.find('.o_menu_sections>li>a').each(function (number, item) {
                item.accessKey = number + 1;
            });
        },

        //--------------------------------------------------------------------------
        // Handlers
        //--------------------------------------------------------------------------

        /**
         * Assign access keys to all buttons inside $el and sets an overlay to show the access key
         * The access keys will be assigned using first the name of the button, letter by letter until we find one available,
         * after that we will assign any available letters.
         * Not all letters should be used as access keys, some of the should be reserved for standard odoo behavior or browser behavior
         *
         * @private
         * @param keyDownEvent {jQueryKeyboardEvent} the keyboard event triggered
         * return {undefined|false}
         */
        _onKeyDown: function (keyDownEvent) {
            if (!this._areAccessKeyVisible &&
                (keyDownEvent.altKey || keyDownEvent.key === 'Alt') &&
                !keyDownEvent.ctrlKey) {
                this._areAccessKeyVisible = true;
                this._setAccessKeyOnTopNavigation();
                var usedAccessKey = this._getAllUsedAccessKeys();
                var buttonsWithoutAccessKey = this.$el.find('button.btn:visible').not('[accesskey]').not('[disabled]');
                _.each(buttonsWithoutAccessKey, function (elem) {
                    var buttonString = [elem.innerText, elem.title, "ABCDEFGHIJKLMNOPQRSTUVWXYZ"].join('');
                    for (var letterIndex = 0; letterIndex < buttonString.length; letterIndex++) {
                        var candidateAccessKey = buttonString[letterIndex].toUpperCase();
                        if (candidateAccessKey >= 'A' && candidateAccessKey <= 'Z' &&
                            !_.includes(usedAccessKey, candidateAccessKey)) {
                            elem.accessKey = candidateAccessKey;
                            usedAccessKey.push(candidateAccessKey);
                            break;
                        }
                    }
                });
                this._addAccessKeyOverlays();
            }
            if (keyDownEvent.altKey && !keyDownEvent.ctrlKey && keyDownEvent.key.length === 1) { // we don't want to catch the Alt key down, only the characters A to Z and number keys
                var elementWithAccessKey = [];
                if (keyDownEvent.keyCode >= 65 && keyDownEvent.keyCode <= 90 || keyDownEvent.keyCode >= 97 && keyDownEvent.keyCode <= 122) {
                    // 65 = A, 90 = Z, 97 = a, 122 = z
                    elementWithAccessKey = document.querySelectorAll('[accesskey="' + String.fromCharCode(keyDownEvent.keyCode).toLowerCase() +
                        '"], [accesskey="' + String.fromCharCode(keyDownEvent.keyCode).toUpperCase() + '"]');
                    if (elementWithAccessKey.length) {
                        if (BrowserDetection.isOsMac() ||
                            !BrowserDetection.isBrowserChrome()) { // on windows and linux, chrome does not prevent the default of the accesskeys
                            elementWithAccessKey[0].click();
                            if (keyDownEvent.preventDefault) keyDownEvent.preventDefault(); else keyDownEvent.returnValue = false;
                            if (keyDownEvent.stopPropagation) keyDownEvent.stopPropagation();
                            if (keyDownEvent.cancelBubble) keyDownEvent.cancelBubble = true;
                            return false;
                        }
                    }
                }
                else {
                    // identify if the user has tapped on the number keys above the text keys.
                    // this is not trivial because alt is a modifier and will not input the actual number in most keyboard layouts
                    var numberKey;
                    if (keyDownEvent.originalEvent.code && keyDownEvent.originalEvent.code.indexOf('Digit') === 0) {
                        //chrome & FF have the key Digit set correctly for the numbers
                        numberKey = keyDownEvent.originalEvent.code[keyDownEvent.originalEvent.code.length - 1];
                    } else if (keyDownEvent.originalEvent.key &&
                        keyDownEvent.originalEvent.key.length === 1 &&
                        keyDownEvent.originalEvent.key >= '0' &&
                        keyDownEvent.originalEvent.key <= '9') {
                        //edge does not use 'code' on the original event, but the 'key' is set correctly
                        numberKey = keyDownEvent.originalEvent.key;
                    } else if (keyDownEvent.keyCode >= 48 && keyDownEvent.keyCode <= 57) {
                        //fallback on keyCode if both code and key are either not set or not digits
                        numberKey = keyDownEvent.keyCode - 48;
                    }

                    if (numberKey >= '0' && numberKey <= '9') {
                        elementWithAccessKey = document.querySelectorAll('[accesskey="' + numberKey + '"]');
                        if (elementWithAccessKey.length) {
                            elementWithAccessKey[0].click();
                            if (keyDownEvent.preventDefault) keyDownEvent.preventDefault(); else keyDownEvent.returnValue = false;
                            if (keyDownEvent.stopPropagation) keyDownEvent.stopPropagation();
                            if (keyDownEvent.cancelBubble) keyDownEvent.cancelBubble = true;
                            return false;
                        }
                    }
                }
            }
        },
        /**
         * hides the shortcut overlays when key press event is triggered on the ALT key
         *
         * @private
         * @param keyPressEvent {jQueryKeyboardEvent} the keyboard event triggered
         * @return {undefined|false}
         */
        _onKeyPress: function (keyPressEvent) {
            if ((keyPressEvent.altKey || keyPressEvent.key === 'Alt') && !keyPressEvent.ctrlKey) {
                if (keyPressEvent.preventDefault) keyPressEvent.preventDefault(); else keyPressEvent.returnValue = false;
                if (keyPressEvent.stopPropagation) keyPressEvent.stopPropagation();
                if (keyPressEvent.cancelBubble) keyPressEvent.cancelBubble = true;
                return false;
            }
        },
        /**
         * hides the shortcut overlays when keyup event is triggered on the ALT key
         *
         * @private
         * @param keyUpEvent {jQueryKeyboardEvent} the keyboard event triggered
         * @return {undefined|false}
         */
        _onKeyUp: function (keyUpEvent) {
            if ((keyUpEvent.altKey || keyUpEvent.key === 'Alt') && !keyUpEvent.ctrlKey) {
                this._hideAccessKeyOverlay();
                if (keyUpEvent.preventDefault) keyUpEvent.preventDefault(); else keyUpEvent.returnValue = false;
                if (keyUpEvent.stopPropagation) keyUpEvent.stopPropagation();
                if (keyUpEvent.cancelBubble) keyUpEvent.cancelBubble = true;
                return false;
            }
        },
    });
    var KeyboardNavigationMixin = instance.web_widget_keyboard_navigation_mixin.KeyboardNavigationMixin;

    instance.web.WebClient = instance.web.WebClient.extend({
        events: _.extend(KeyboardNavigationMixin.events, {}),

        init: function(parent, client_options) {
            this._super(parent, client_options);
            // TODO what is this supposed to do? Can we change it?
            new KeyboardNavigationMixin().init.call(this);
        }
    });
       
    instance.web_widget_keyboard_navigation_mixin.BrowserDetection = instance.web.Class.extend({
            init: function () {

            },
            isOsMac: function () {
                return navigator.platform.toLowerCase().indexOf('mac') !== -1;
            },
            isBrowserChrome: function () {
                return $.browser.chrome && // depends on jquery 1.x, removed in jquery 2 and above
                    navigator.userAgent.toLocaleLowerCase().indexOf('edge') === -1; // as far as jquery is concerned, Edge is chrome
                }

        });
};
