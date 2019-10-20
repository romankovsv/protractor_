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
const Condition_1 = require("../../src/helpers/Condition");
const WebElement_1 = require("../../src/wrappers/WebElement");
describe('adding a new contact with an invalid email', function () {
    let condition = new Condition_1.Condition();
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield protractor_1.browser.get('/#/');
            let EC = protractor_1.protractor.ExpectedConditions;
            yield protractor_1.browser.wait(EC.urlContains(protractor_1.browser.baseUrl));
            expect(protractor_1.browser.getCurrentUrl())
                .toEqual(protractor_1.browser.baseUrl + '/#/');
            let addContactButton = yield new WebElement_1.WebElement(protractor_1.element(protractor_1.by.id('add-contact')));
            yield addContactButton.customClick();
            let contactNameField = yield new WebElement_1.WebElement(protractor_1.element(protractor_1.by.css('#contact-name')));
            yield contactNameField.type('Bad Email');
        });
    });
    it('shouldn’t create a new contact with baduser.com', function () {
        return __awaiter(this, void 0, void 0, function* () {
            let email = protractor_1.element(protractor_1.by.id('contact-email'));
            yield condition.shouldBeVisible(email, 10);
            yield email.sendKeys('baduser.com');
            yield condition.shouldBeClickable(protractor_1.element(protractor_1.by.buttonText('Create')), 10);
            protractor_1.element(protractor_1.by.buttonText('Create')).click();
            expect(protractor_1.browser.getCurrentUrl()).toEqual(protractor_1.browser.baseUrl + '/#/add');
        });
    });
});
//# sourceMappingURL=InvalidContactSpec.js.map