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
        define(["require", "exports", "protractor"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const protractor_1 = require("protractor");
    exports.config = {
        onPrepare: () => __awaiter(void 0, void 0, void 0, function* () {
            yield protractor_1.browser.waitForAngularEnabled(false);
        }),
        framework: 'jasmine',
        capabilities: {
            browserName: 'chrome'
        },
        suites: {
            "first": "./FirstTestSpec.js",
            "second": "./SecondTestspec.js"
        },
        specs: ['./test/FirstTestSpec.js'],
        SELENIUM_PROMISE_MANAGER: false,
        seleniumAddress: 'http://localhost:7777/wd/hub',
        // You could set no globals to true to avoid jQuery '$' and protractor '$'
        // collisions on the global namespace.
        noGlobals: true
    };
});
//# sourceMappingURL=protractor.conf.js.map