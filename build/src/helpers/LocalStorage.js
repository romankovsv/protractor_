"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const protractor_1 = require("protractor");
class LocalStorage {
    static getValue(key) {
        return protractor_1.browser.executeScript("return window.localStorage.getItem('" + key + "');")
            .then((value) => value);
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