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
const Condition_1 = require("../../helpers/Condition");
const Element_1 = require("../../wrappers/Element");
const protractor_1 = require("protractor");
const Generator_1 = require("../../helpers/Generator");
class SMSHomePage {
    constructor() {
        this.condition = new Condition_1.Condition();
        this.sideBar_Suppliers_Menu = new Element_1.Element(protractor_1.element(protractor_1.By.css("li[data-section-name='suppliers'] .menu-text")));
        this.sidebar_suppliers_users = new Element_1.Element(protractor_1.element(protractor_1.By.xpath("//a[@data-name='pages.users']")));
        this.addUserButton = new Element_1.Element(protractor_1.element(protractor_1.By.css("button[href='/profiles/add']")));
        this.userTypeSelector = new Element_1.Element(protractor_1.element(protractor_1.By.id("new_user_type")));
        this.firstNameField = new Element_1.Element(protractor_1.element(protractor_1.By.id("new_user_firstName")));
        this.lastNameField = new Element_1.Element(protractor_1.element(protractor_1.By.id("new_user_lastName")));
        this.emailField = new Element_1.Element(protractor_1.element(protractor_1.By.id("new_user_email")));
        this.saveUserButton = new Element_1.Element(protractor_1.element(protractor_1.By.css("form[name='new_user'] .btn-success")));
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
    addNewUser() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.userTypeSelector.selectByValue("vendor");
            yield this.firstNameField.type(Generator_1.Generator.generateStringWithLenght(7));
            yield this.lastNameField.type(Generator_1.Generator.generateStringWithLenght(7));
            yield this.emailField.type(Generator_1.Generator.generateEmail());
            yield this.saveUserButton.customClick();
            yield protractor_1.browser.sleep(10000);
            return this;
        });
    }
}
exports.SMSHomePage = SMSHomePage;
//# sourceMappingURL=SMSHomePage.js.map