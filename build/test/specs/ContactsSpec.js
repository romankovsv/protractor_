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
const log4js = require('log4js');
describe('your first protractor test', function () {
    it('should load a page and verify the url', function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield protractor_1.browser.get('/#/');
            let EC = protractor_1.protractor.ExpectedConditions;
            yield protractor_1.browser.wait(EC.urlContains(protractor_1.browser.baseUrl));
            expect(protractor_1.browser.getCurrentUrl())
                .toEqual(protractor_1.browser.baseUrl + '/#/');
        });
    });
});
//# sourceMappingURL=ContactsSpec.js.map