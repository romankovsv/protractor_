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
const ContactListPageObject_1 = require("../../src/pageobjects/ContactListPageObject");
const protractor_1 = require("protractor");
const Logger_1 = require("../../src/helpers/Logger");
describe('create new contact', function () {
    let contactList;
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            contactList = yield new ContactListPageObject_1.ContactListPageObject();
            yield contactList.navigateTo();
        });
    });
    it('should click the + button', function () {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.Logger.log().debug("In Test");
            let newContact;
            newContact = yield contactList.clickPlusButton();
            expect(yield protractor_1.browser.getCurrentUrl())
                .toBe(protractor_1.browser.baseUrl + '/#/add');
        });
    });
    it('should fill out form for a new contact', function () {
        return __awaiter(this, void 0, void 0, function* () {
            let newContact;
            newContact = yield contactList.clickPlusButton();
            yield newContact.setContactInfo('Mr. Newton', 'mr.newton@example.com', null);
            expect(yield newContact.getName()).toBe('Mr. Newton');
            expect(yield newContact.getEmail())
                .toBe('mr.newton@example.com');
            expect(yield newContact.getPhone()).toBe('1', "Phone field should be empty");
        });
    });
});
//# sourceMappingURL=CreateNewContactSpec.js.map