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
        define(["require", "exports", "protractor", "./NewContactPageObject", "../helpers/Condition"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const protractor_1 = require("protractor");
    const NewContactPageObject_1 = require("./NewContactPageObject");
    const Condition_1 = require("../helpers/Condition");
    class ContactListPageObject {
        constructor() {
            this.condition = new Condition_1.Condition();
            this.plusButton = protractor_1.element(protractor_1.by.id('add-contact'));
        }
        clickPlusButton() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.condition.shouldBeClickable(this.plusButton, 10);
                yield this.plusButton.click();
                return new NewContactPageObject_1.NewContactPageObject();
            });
        }
        navigateTo() {
            return __awaiter(this, void 0, void 0, function* () {
                yield protractor_1.browser.get('/#/');
                yield this.condition.urlShouldContain('/#/', 10);
            });
        }
    }
    exports.ContactListPageObject = ContactListPageObject;
});
//# sourceMappingURL=ContactListPageObject.js.map