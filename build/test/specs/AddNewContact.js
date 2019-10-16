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
    describe('adding a new contact with only a name', () => {
        beforeAll(() => {
            protractor_1.browser.get('/#/');
        });
        it('should find the add contact button', () => {
            protractor_1.element(protractor_1.by.id('add-contact')).click();
            expect(protractor_1.browser.getCurrentUrl())
                .toEqual(protractor_1.browser.baseUrl + '/#/add');
        });
        it('should write a name', () => {
            let contactName = protractor_1.element(protractor_1.by.id('contact-name'));
            contactName.sendKeys('Ada');
            expect(contactName.getAttribute('value'))
                .toEqual('Ada');
        });
        it('should click the create button', () => {
            protractor_1.element(protractor_1.by.css('.create-button')).click();
            expect(protractor_1.browser.getCurrentUrl())
                .toEqual(protractor_1.browser.baseUrl + '/#/');
        });
    });
});
//# sourceMappingURL=AddNewContact.js.map