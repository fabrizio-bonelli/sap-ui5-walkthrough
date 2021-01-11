sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function(Controller) {
    'use strict';

    return Controller.extend("ss",{
        onShowHello : function () {
            // show a native JavaScript alert
            alert("Hello UI5! (from event handler)")
        }
    });
});