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
const Condition_1 = require("../../helpers/Condition");
const Log_1 = require("../../helpers/Log");
class BasePage {
    constructor() {
        this.condition = new Condition_1.Condition();
    }
    enableAngularSync(on) {
        return __awaiter(this, void 0, void 0, function* () {
            yield protractor_1.browser.waitForAngularEnabled(on);
        });
    }
    navigateTo(url) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Log_1.Log.log().debug("\nNavigate to Url: " + url);
            yield protractor_1.browser.waitForAngularEnabled(true);
            yield protractor_1.browser.get(url);
            yield this.condition.urlShouldContain(url, 15);
        });
    }
    navigateToWithDisabledAngularWait(url) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Log_1.Log.log().debug("\nNavigate to Url: " + url);
            yield protractor_1.browser.waitForAngularEnabled(false);
            yield protractor_1.browser.sleep(1000);
            yield protractor_1.browser.navigate().to(url);
            yield this.condition.urlShouldContain(url, 15);
        });
    }
}
exports.BasePage = BasePage;
//# sourceMappingURL=BasePage.js.map