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
class LocalStorage {
    static getValue(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield protractor_1.browser.executeScript("return window.localStorage.getItem('" + key + "');")
                .then(value => {
                console.dir("ConsoleDir:" + value);
                return value;
            });
        });
    }
    static setKeyValue(key, value) {
        protractor_1.browser.executeScript("return window.localStorage.setItem('" + key + "','" + value + "')");
    }
    static getLocalStorage() {
        return protractor_1.browser.executeScript("return window.localStorage;");
    }
    static clearLocalStorage() {
        protractor_1.browser.executeScript("return window.localStorage.clear();");
    }
}
exports.LocalStorage = LocalStorage;
//# sourceMappingURL=LocalStorage.js.map