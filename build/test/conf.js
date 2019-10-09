(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.config = {
        framework: 'jasmine',
        capabilities: {
            browserName: 'chrome'
        },
        suites: {
            "first": "./FirstTestSpec.js",
            "second": "./SecondTestspec.js"
        },
        specs: ['./FirstTestSpec.js'],
        seleniumAddress: 'http://localhost:7777/wd/hub',
        // You could set no globals to true to avoid jQuery '$' and protractor '$'
        // collisions on the global namespace.
        noGlobals: true
    };
});
//# sourceMappingURL=conf.js.map