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
const BasePage_1 = require("./BasePage");
const WebElement_1 = require("../../wrappers/WebElement");
const protractor_1 = require("protractor");
const Logger_1 = require("../../helpers/Logger");
const VendorContractConfirmPage_1 = require("./VendorContractConfirmPage");
const Properties_1 = require("../../properties/Properties");
class ResetPasswordPage extends BasePage_1.BasePage {
    constructor() {
        super();
        this.resetPasswordField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("#reset_password_newPassword_first")));
        this.createPasswordButton = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("#submit_btn_cp")));
        this.passordConfirmField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("#reset_password_newPassword_second")));
    }
    enterPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Logger_1.Logger.log().debug("Enter passwrd: Auto1" + password);
            yield protractor_1.browser.wait(protractor_1.ExpectedConditions.visibilityOf(this.resetPasswordField), 10000);
            yield this.navigateToWithDisabledAngularWait(Properties_1.Properties.VendroQAEnv);
            /* await browser.manage().getCookies().then(function(cookies) {
                 console.log("Cookies Before")
                 console.dir(cookies);
             });*/
            yield protractor_1.browser.navigate().back();
            /*await (browser.manage() as any).addCookie({ name: 'PHPSESSID',
                value: `${await LocalStorage.getValue("sessionCookie")}`,httpOnly:true, domain: 'www.qa.metro-vendorcentral.com' });
            await browser.manage().getCookies().then(function(cookies) {
                console.log("Cookies After")
                console.dir(cookies);
            });*/
            yield protractor_1.browser.navigate().back();
            yield this.resetPasswordField.type("Auto1" + password);
            yield this.passordConfirmField.type("Auto1" + password);
            yield this.createPasswordButton.customClick();
            return new VendorContractConfirmPage_1.VendorContractConfirmPage();
        });
    }
}
exports.ResetPasswordPage = ResetPasswordPage;
//# sourceMappingURL=ResetPasswordPage.js.map