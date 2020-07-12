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
exports.GmailMainPage = void 0;
const WebElement_1 = require("../../wrappers/WebElement");
const Logger_1 = require("../../helpers/Logger");
const protractor_1 = require("protractor");
const ResetPasswordPage_1 = require("./ResetPasswordPage");
class GmailMainPage {
    constructor() {
        this.searchInPost = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.name("q")));
        this.firstEmail = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.xpath("(//tbody/tr[1]//span[1]/span[@name='Vendor Office'])[last()]")));
        this.goToVendorOfficeButton = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.xpath("(//a[contains(@href, 'grid')])[1]")));
    }
    activateAccount() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Logger_1.Logger.logs("Activate account");
            yield protractor_1.browser.wait(protractor_1.ExpectedConditions.elementToBeClickable(protractor_1.element(protractor_1.By.xpath("(//tbody/tr[1]//span[1]/span[@name='Vendor Office'])[last()]"))));
            yield protractor_1.element(protractor_1.By.xpath("(//tbody/tr[1]//span[1]/span[@name='Vendor Office'])[last()]")).click();
            // await this.firstEmail.click();
            yield this.goToVendorOfficeButton.customClick();
            yield protractor_1.browser.getAllWindowHandles().then(function (handles) {
                protractor_1.browser.switchTo().window(handles[1]).then(function () {
                });
            });
            return new ResetPasswordPage_1.ResetPasswordPage();
        });
    }
}
exports.GmailMainPage = GmailMainPage;
//# sourceMappingURL=GmailMainPage.js.map