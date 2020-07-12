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
exports.GmailSignInPage = void 0;
const protractor_1 = require("protractor");
const WebElement_1 = require("../../wrappers/WebElement");
const GmailMainPage_1 = require("./GmailMainPage");
const Logger_1 = require("../../helpers/Logger");
const Properties_1 = require("../../properties/Properties");
const BasePage_1 = require("./BasePage");
class GmailSignInPage extends BasePage_1.BasePage {
    constructor() {
        super();
        this.emailField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.id("identifierId")));
        this.nextButton = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.xpath("(//div[@role='button']//span/span)[1]")));
        this.nextButtonForPassword = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.xpath("(//div[@role='button']//span/span)[last()-1]")));
        this.passwordField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("input[type='password']")));
        this.doneButton = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.xpath("//span[contains(text(), 'Done')]")));
    }
    loginToGmail() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Logger_1.Logger.logs(`Login to gmail with : ${Properties_1.Properties.Gmail_email}`);
            yield this.navigateToWithDisabledAngularWait("http://www.gmail.com");
            yield this.emailField.type(Properties_1.Properties.Gmail_email);
            yield this.nextButton.customClick();
            yield this.passwordField.type(Properties_1.Properties.Gmail_password);
            yield this.nextButtonForPassword.customClick();
            return new GmailMainPage_1.GmailMainPage();
        });
    }
}
exports.GmailSignInPage = GmailSignInPage;
//# sourceMappingURL=GmailSignInPage.js.map