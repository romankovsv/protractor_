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
const WebElement_1 = require("../../wrappers/WebElement");
const protractor_1 = require("protractor");
const BasePage_1 = require("./BasePage");
const Log_1 = require("../../helpers/Log");
const LocalStorage_1 = require("../../helpers/LocalStorage");
class SMSHomePage extends BasePage_1.BasePage {
    constructor() {
        super();
        this.sideBar_Suppliers_Menu = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("li[data-section-name='suppliers'] .menu-text")));
        this.sidebar_suppliers_users = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.xpath("//a[@data-name='pages.users']")));
        this.addUserButton = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("button[href='/profiles/add']")));
        this.userTypeSelector = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.id("new_user_type")));
        this.firstNameField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.id("new_user_firstName")));
        this.lastNameField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.id("new_user_lastName")));
        this.emailField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.id("new_user_email")));
        this.saveUserButton = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css("form[name='new_user'] .btn-success")));
        this.successMessage = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css(".callout-success")));
        this.condition.shouldBeClickable(this.sideBar_Suppliers_Menu, 30);
    }
    clickAddNewUser() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sideBar_Suppliers_Menu.customClick();
            yield this.sidebar_suppliers_users.customClick();
            yield this.addUserButton.customClick();
            return this;
        });
    }
    addNewUser(user, sessionCookie) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Log_1.Log.log().debug("Add new user: " + user);
            yield this.userTypeSelector.selectByValue(user.userType);
            yield this.firstNameField.type(user.firstName);
            yield this.lastNameField.type(user.lastName);
            yield this.emailField.type(user.email);
            yield this.saveUserButton.customClick();
            yield protractor_1.browser.manage().getCookie("PHPSESSID").then(function (cookie) {
                console.log("Cookies");
                console.log(cookie);
                console.dir(cookie);
                sessionCookie = cookie.value;
                console.dir("sessionCookie: " + sessionCookie);
                LocalStorage_1.LocalStorage.setKeyValue("sessionCookie", sessionCookie);
            });
            return this;
        });
    }
    getMessage() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.successMessage.getText();
        });
    }
}
exports.SMSHomePage = SMSHomePage;
//# sourceMappingURL=SMSHomePage.js.map