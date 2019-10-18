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
const Condition_1 = require("../../helpers/Condition");
const Element_1 = require("../../wrappers/Element");
const SMSHomePage_1 = require("./SMSHomePage");
class VendorCentralLoginPage {
    constructor() {
        this.condition = new Condition_1.Condition();
        this.emailField = new Element_1.Element(protractor_1.element(protractor_1.by.id('emailInput')));
        this.passwordField = new Element_1.Element(protractor_1.element(protractor_1.by.id('passInput')));
        this.loginButton = new Element_1.Element(protractor_1.element(protractor_1.by.id('submit_btn')));
    }
    navigateTo() {
        return __awaiter(this, void 0, void 0, function* () {
            protractor_1.browser.waitForAngularEnabled(false);
            yield protractor_1.browser.get('https://sms:GHnRgg4G3qf43gvdsgds@www.qa.metro-vendorcentral.com');
            yield this.condition.urlShouldContain('metro-vendorcentral.com', 10);
        });
    }
    login() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.emailField.type('admin@sms.com');
            yield this.passwordField.type('admin');
            yield this.loginButton.customClick();
            return new SMSHomePage_1.SMSHomePage();
        });
    }
}
exports.VendorCentralLoginPage = VendorCentralLoginPage;
//# sourceMappingURL=VendorCentralLoginPage.js.map