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
exports.BasePage = void 0;
const Condition_1 = require("../../helpers/Condition");
const protractor_1 = require("protractor");
const Logger_1 = require("../../helpers/Logger");
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
            yield Logger_1.Logger.logs("\nNavigate to Url: " + url);
            yield protractor_1.browser.waitForAngularEnabled(true);
            yield protractor_1.browser.get(url);
        });
    }
    navigateToWithDisabledAngularWait(url) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Logger_1.Logger.logs("\nNavigate to Url: " + url);
            yield protractor_1.browser.waitForAngularEnabled(false);
            yield protractor_1.browser.sleep(1000);
            yield protractor_1.browser.get(url);
        });
    }
    stopWatch() {
        return __awaiter(this, void 0, void 0, function* () {
            yield protractor_1.browser.sleep(2000);
        });
    }
}
exports.BasePage = BasePage;
//# sourceMappingURL=BasePage.js.map