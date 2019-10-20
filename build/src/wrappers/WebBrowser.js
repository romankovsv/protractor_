"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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