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
describe('adding a new contact with name, email,' +
    'and phone number', function () {
    let EC = protractor_1.protractor.ExpectedConditions;
    let condition;
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            condition = new Condition_1.Condition();
            yield protractor_1.browser.get('/#/');
            yield protractor_1.browser.wait(EC.elementToBeClickable(protractor_1.element(protractor_1.by.id('add-contact'))));
            yield protractor_1.element(protractor_1.by.id('add-contact')).click();
            yield protractor_1.browser.wait(protractor_1.ExpectedConditions.visibilityOf(protractor_1.element(protractor_1.by.css('#contact-name'))));
            yield protractor_1.element(protractor_1.by.css('#contact-name')).sendKeys('Grace');
        });
    });
    it('should type in an email address', function () {
        return __awaiter(this, void 0, void 0, function* () {
            let email = protractor_1.element(protractor_1.by.id('contact-email'));
            yield email.sendKeys('grace@hopper.com');
            expect(yield email.getAttribute('value'))
                .toEqual('grace@hopper.com');
        });
    });
    it('should type in a phone number', function () {
        return __awaiter(this, void 0, void 0, function* () {
            let tel = protractor_1.element(protractor_1.by.css('input[type="tel"]'));
            yield tel.sendKeys('1234567890');
            expect(yield tel.getAttribute('value'))
                .toEqual('1234567890');
        });
    });
});
//# sourceMappingURL=AddSecondContactSpec.js.map