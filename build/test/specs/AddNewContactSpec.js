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
describe('adding a new contact with only a name', function () {
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield protractor_1.browser.get('/#/');
        });
    });
    let EC = protractor_1.ExpectedConditions;
    it('should find the add contact button', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield protractor_1.browser.wait(EC.elementToBeClickable(protractor_1.element(protractor_1.by.id('add-contact'))));
            yield protractor_1.element(protractor_1.by.id('add-contact')).click();
            expect(yield protractor_1.browser.getCurrentUrl())
                .toEqual(protractor_1.browser.baseUrl + '/#/add');
        });
    });
});
//# sourceMappingURL=AddNewContactSpec.js.map