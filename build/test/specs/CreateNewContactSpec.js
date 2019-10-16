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
        define(["require", "exports", "../../src/pageobjects/ContactListPageObject", "protractor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const ContactListPageObject_1 = require("../../src/pageobjects/ContactListPageObject");
    const protractor_1 = require("protractor");
    describe('create new contact', () => {
        let contactList;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            contactList = new ContactListPageObject_1.ContactListPageObject();
            yield contactList.navigateTo();
        }));
        it('should click the + button', () => __awaiter(void 0, void 0, void 0, function* () {
            let newContact;
            newContact = yield contactList.clickPlusButton();
            expect(yield protractor_1.browser.getCurrentUrl())
                .toBe(protractor_1.browser.baseUrl + '/#/add');
        }));
        it('should fill out form for a new contact', () => __awaiter(void 0, void 0, void 0, function* () {
            let newContact;
            newContact = yield contactList.clickPlusButton();
            yield newContact.setContactInfo('Mr. Newton', 'mr.newton@example.com', null);
            expect(yield newContact.getName()).toBe('Mr. Newton');
            expect(yield newContact.getEmail())
                .toBe('mr.newton@example.com');
            expect(yield newContact.getPhone()).toBe('');
        }));
    });
});
//# sourceMappingURL=CreateNewContactSpec.js.map