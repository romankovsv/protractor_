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
exports.VendorCentralLoginPage = void 0;
const protractor_1 = require("protractor");
const WebElement_1 = require("../../wrappers/WebElement");
const Logger_1 = require("../../helpers/Logger");
const HomePage_1 = require("./HomePage");
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
            Logger_1.Logger.logs(`Login with email:${Properties_1.Properties.VendorCentralEmail} and password: ${Properties_1.Properties.VendorCentralPassword}`);
            yield this.emailField.type(Properties_1.Properties.VendorCentralEmail);
            yield this.passwordField.type(Properties_1.Properties.VendorCentralPassword);
            yield this.loginButton.customClick();
            return new HomePage_1.HomePage();
        });
    }
}
exports.VendorCentralLoginPage = VendorCentralLoginPage;
//# sourceMappingURL=VendorCentralLoginPage.js.map