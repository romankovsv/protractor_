"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
const WebElement_1 = require("../../wrappers/WebElement");
const Log_1 = require("../../helpers/Log");
const SMSHomePage_1 = require("./SMSHomePage");
const Properties_1 = require("../../properties/Properties");
const BasePage_1 = require("./BasePage");
class VendorCentralLoginPage extends BasePage_1.BasePage {
    constructor() {
        super();
        this.emailField = new WebElement_1.WebElement(protractor_1.element(protractor_1.by.id('emailInput')));
        this.passwordField = new WebElement_1.WebElement(protractor_1.element(protractor_1.by.id('passInput')));
        this.loginButton = new WebElement_1.WebElement(protractor_1.element(protractor_1.by.id('submit_btn')));
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            Log_1.Log.log().debug(`Login with email:${Properties_1.Properties.VendorCentralEmail} and password: ${Properties_1.Properties.VendorCentralPassword}`);
            yield this.emailField.type(Properties_1.Properties.VendorCentralEmail);
            yield this.passwordField.type(Properties_1.Properties.VendorCentralPassword);
            yield this.loginButton.customClick();
            return new SMSHomePage_1.SMSHomePage();
        });
    }
}
exports.VendorCentralLoginPage = VendorCentralLoginPage;
//# sourceMappingURL=VendorCentralLoginPage.js.map