var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "protractor", "./ContactListPageObject", "../helpers/Condition"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const protractor_1 = require("protractor");
    const ContactListPageObject_1 = require("./ContactListPageObject");
    const Condition_1 = require("../helpers/Condition");
    class NewContactPageObject {
        constructor() {
            this.condition = new Condition_1.Condition();
            this.inputName = protractor_1.element(protractor_1.by.id('contact-name'));
            this.inputEmail = protractor_1.element(protractor_1.by.id('contact-email'));
            this.inputPhone = protractor_1.element(protractor_1.by.css('input[type="tel"]'));
            this.createButton = protractor_1.element(protractor_1.by.css('.create-button'));
        }
        setContactInfo(name, email, phoneNumber) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.condition.shouldBeVisible(this.inputName, 10);
                yield this.inputName.sendKeys(name);
                if (email) {
                    yield this.inputEmail.sendKeys(email);
                }
                if (phoneNumber) {
                    yield this.inputPhone.sendKeys(phoneNumber);
                }
            });
        }
        clickCreateButton() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.condition.shouldBeClickable(this.createButton, 10);
                yield this.createButton.click();
                return new ContactListPageObject_1.ContactListPageObject();
            });
        }
        getName() {
            return __awaiter(this, void 0, void 0, function* () {
                return yield this.inputName.getAttribute('value');
            });
        }
        getPhone() {
            return __awaiter(this, void 0, void 0, function* () {
                return yield this.inputPhone.getAttribute('value');
            });
        }
        getEmail() {
            return __awaiter(this, void 0, void 0, function* () {
                return yield this.inputEmail.getAttribute('value');
            });
        }
    }
    exports.NewContactPageObject = NewContactPageObject;
});
//# sourceMappingURL=NewContactPageObject.js.map