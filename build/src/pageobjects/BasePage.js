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
class BasePage {
    constructor() {
        this.url = "https://rozetka.com.ua/";
    }
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            return protractor_1.browser.driver.get(this.url);
        });
    }
}
exports.BasePage = BasePage;
BasePage.EC = protractor_1.protractor.ExpectedConditions;
//# sourceMappingURL=BasePage.js.map