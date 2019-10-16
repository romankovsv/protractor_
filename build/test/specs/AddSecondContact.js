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
        define(["require", "exports", "protractor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const protractor_1 = require("protractor");
    describe('adding a new contact with name, email,' +
        'and phone number', () => {
        beforeAll(() => {
            protractor_1.browser.get('/#/');
            protractor_1.element(protractor_1.by.id('add-contact')).click();
            protractor_1.element(protractor_1.by.id('contact-name')).sendKeys('Grace');
        });
        it('should type in an email address', () => __awaiter(void 0, void 0, void 0, function* () {
            let email = protractor_1.element(protractor_1.by.id('contact-email'));
            yield email.sendKeys('grace@hopper.com');
            expect(email.getAttribute('value'))
                .toEqual('grace@hopper.com');
        }));
    });
});
//# sourceMappingURL=AddSecondContact.js.map