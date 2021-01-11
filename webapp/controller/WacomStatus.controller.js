jQuery.sap.registerModulePath('libs.wacom.WgssSigCaptX', "wacom/wgssSigCaptX");
jQuery.sap.registerModulePath('libs.wacom.SigCaptX-Globals', "wacom/SigCaptX-Globals");

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "libs/wacom/WgssSigCaptX",
    "libs/wacom/SigCaptX-Globals"
], function (Controller, JSONModel, WgssSigCaptX) {
    'use strict';

    // pass the starting service port  number as configured in the registry
    var wgssSignatureSDK = new WacomGSS_SignatureSDK(onDetectRunning, 8000)
    var timeout = setTimeout(timedDetect, 1500);
    var oModel;
    var sigObj;
    var sigCtl;
    var dynCapt;


    function onDetectRunning() {
        oModel.setProperty("/status", "Signature SDK Service detected");
        clearTimeout(timeout);
    }

    function timedDetect() {

        if (wgssSignatureSDK.running) {
            oModel.setProperty("/status", "Signature SDK Service detected");
        }
        else {
            oModel.setProperty("/status", "Signature SDK Service not detected");
        }
    }

    function restartSession(onRestartSession) {
        //document.getElementById("statusText").innerHTML += "<br>Restarting the session";
        wgssSignatureSDK = new WacomGSS_SignatureSDK(onRestartSession, 8000)
    }

    function onPutSigData(sigObjV, status) {
        if (wgssSignatureSDK.ResponseStatus.OK == status) {
            //document.getElementById("statusText").innerHTML += "<br>PutSigData called";
        }
        else {
            //document.getElementById("statusText").innerHTML += "<br>error on PutSigData: " + status;
        }
    }

    function onGetSigText(sigObjV, data, status) {
        if (wgssSignatureSDK.ResponseStatus.OK == status) {
            //document.getElementById("statusText").innerHTML += "<br>SigText: " + data;
            oModel.setProperty("/status", data);
            var vData = new wgssSignatureSDK.Variant();
            vData.type = wgssSignatureSDK.VariantType.VARIANT_BASE64;
            vData.base64 = data;
            sigObjV.PutSigData(vData, onPutSigData);
        }
        else {
            //document.getElementById("statusText").innerHTML += "<br>error on GetSigData: " + status;
        }
    }

    function onGetAdditionalData(sigObjV, additionalData, status) {
        if (wgssSignatureSDK.ResponseStatus.OK == status) {
            //document.getElementById("statusText").innerHTML += "<br>Additional Data/MachineOS: " + additionalData;
            sigObjV.GetSigText(onGetSigText);
        }
        else {
            //document.getElementById("statusText").innerHTML += "<br>error on GetAdditionalData: " + status;
        }
    }

    function onRenderBitmap(sigObjV, bmpObj, status) {
        if (wgssSignatureSDK.ResponseStatus.OK == status) {
            if (bmpObj.isBase64) {
                //document.getElementById("statusText").innerHTML += "<br>Base64 bitmap retrieved:<br>";
                //document.getElementById("statusText").innerHTML += "<br>" + bmpObj.image.src;
            }
            else {
                //document.getElementById("statusText").innerHTML += "<br>Bitmap retrieved, rendering image...";
            }
            //ctx.drawImage(bmpObj.image, 0, 0);
            sigObjV.GetAdditionalData(wgssSignatureSDK.CaptData.CaptMachineOS, onGetAdditionalData);
        }
        else {
            document.getElementById("statusText").innerHTML += "<br>Signature Render Bitmap error: " + status;
        }
    }

    function onPutExtraData(sigObjV, status) {
        if (wgssSignatureSDK.ResponseStatus.OK == status) {
            //document.getElementById("statusText").innerHTML += "<br>Rendering bitmap";
            var flags = wgssSignatureSDK.RBFlags.RenderOutputPicture |
                wgssSignatureSDK.RBFlags.RenderColor24BPP;
            //sigObjV.RenderBitmap("bmp", canvas.width, canvas.height, 0.7, 0x00000000, 0x00FFFFFF, flags, 0, 0, onRenderBitmap);
            sigObjV.RenderBitmap("bmp", 200, 100, 0.7, 0x00000000, 0x00FFFFFF, flags, 0, 0, onRenderBitmap);
            sigObj = sigObjV;
        }
        else {
            document.getElementById("statusText").innerHTML += "<br>Signature PutExtraData error: " + status;
        }
    }

    function onDynCaptCapture(dynCaptV, sigObjV, status) {
        if (wgssSignatureSDK.ResponseStatus.OK == status) {
            //document.getElementById("statusText").innerHTML += "<br>Adding extra data";
            oModel.setProperty("/status", "0");
            sigObjV.PutExtraData("extra key", "extra value", onPutExtraData);
        }
        else if (1 == status) {
            //document.getElementById("statusText").innerHTML += "<br>Signature capture cancelled by the user";
            oModel.setProperty("/status", "1");
        }
        else {
            //document.getElementById("statusText").innerHTML += "<br>Signature capture error: " + status;
            oModel.setProperty("/status", "2");
        }
    }

    function onSigCtlPutLicence(sigCtlV, status) {
        if (wgssSignatureSDK.ResponseStatus.OK == status) {
            dynCapt.Capture(sigCtlV, "name surnam e", "reason rr e a son", null, null, onDynCaptCapture);
        }
        else {
            document.getElementById("statusText").innerHTML += "<br>SigCtl constructor error: " + status;
        }
    }

    function onSigCtlConstructor(sigCtlV, status) {
        if (wgssSignatureSDK.ResponseStatus.OK == status) {
            sigCtlV.PutLicence(LICENCEKEY, onSigCtlPutLicence);
        }
        else {
            //document.getElementById("statusText").innerHTML += "<br>SigCtl constructor error: " + status;
        }
    }

    function onDynCaptConstructor(dynCaptV, status) {
        if (wgssSignatureSDK.ResponseStatus.OK == status) {
            sigCtl = new wgssSignatureSDK.SigCtl(onSigCtlConstructor);
        }
        else {
            //document.getElementById("statusText").innerHTML += "<br>Dynamic Capture constructor error: " + status;
            if (wgssSignatureSDK.ResponseStatus.INVALID_SESSION == status) {
                restartSession(captureSignature);
            }
        }
    }

    var oController = Controller.extend("sap.ui.demo.walkthrough.controller.WacomStatus", {
        onInit: function () {
            // set data model on view
            var oData = {
                status: "Status"
            };
            oModel = new JSONModel(oData);
            this.getView().setModel(oModel);
        },
        onCapture: function () {
            if (wgssSignatureSDK.running) {
                dynCapt = new wgssSignatureSDK.DynamicCapture(onDynCaptConstructor);
            }
        }
    });

    return oController;
});