"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebBrowser = void 0;
const protractor_1 = require("protractor");
class WebBrowser {
    constructor() {
        this.browser = protractor_1.browser;
    }
    static getInstance() {
        if (!WebBrowser.instance) {
            WebBrowser.instance = new WebBrowser();
        }
        return WebBrowser.instance;
    }
}
exports.WebBrowser = WebBrowser;
//# sourceMappingURL=WebBrowser.js.map