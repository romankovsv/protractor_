"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BasePage_1 = require("./BasePage");
const WebElement_1 = require("../../wrappers/WebElement");
const protractor_1 = require("protractor");
const Logger_1 = require("../../helpers/Logger");
class VendorPortalHomePage extends BasePage_1.BasePage {
    constructor() {
        super();
        this.uploadButton = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css(".m-page-container .button__upload")));
        this.confirmationPopUp = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css(".m-alert-containe")));
    }
    verifyThatHomePageIsOpen() {
        Logger_1.Logger.logs("In verifyThatHomePageIsOpen");
        this.condition.shouldBeVisible(this.uploadButton, 10);
        this.condition.shouldBeVisible(this.confirmationPopUp, 10);
        return this;
    }
}
exports.VendorPortalHomePage = VendorPortalHomePage;
//# sourceMappingURL=VendorPortalHomePage.js.map