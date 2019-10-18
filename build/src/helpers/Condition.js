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
const Log_1 = require("./Log");
class Condition {
    shouldBeVisible(el, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            Log_1.Log.log().info("Inside should be visable");
            let EC = protractor_1.protractor.ExpectedConditions;
            yield protractor_1.browser.wait(EC.visibilityOf(el), timeout * 1000, `Element ${el.locator()} is not visible`)
                .catch((error) => {
                Log_1.Log.log().error(error);
            });
        });
    }
    shouldBeClickable(el, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            Log_1.Log.log().info("Inside should be clickable");
            let EC = protractor_1.protractor.ExpectedConditions;
            yield protractor_1.browser.wait(EC.elementToBeClickable(el), timeout * 1000, `Element ${el.locator()} is not clickable`)
                .catch((error) => {
                Log_1.Log.log().error(error);
            });
        });
    }
    urlShouldContain(urlPart, timeout) {
        return __awaiter(this, void 0, void 0, function* () {
            Log_1.Log.log().info("Inside url should contains:" + urlPart);
            let EC = protractor_1.protractor.ExpectedConditions;
            yield protractor_1.browser.wait(EC.urlContains(urlPart), timeout * 1000)
                .catch((error) => {
                Log_1.Log.log().error(error);
            });
        });
    }
}
exports.Condition = Condition;
//# sourceMappingURL=Condition.js.map