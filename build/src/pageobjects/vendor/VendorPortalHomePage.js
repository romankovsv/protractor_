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
exports.VendorPortalHomePage = void 0;
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
        return __awaiter(this, void 0, void 0, function* () {
            yield Logger_1.Logger.logs("In verifyThatHomePageIsOpen");
            yield expect(this.condition.shouldBeVisible(this.uploadButton, 10))
                .toBe(true, `Upload button wasnt visible by locator:
             ${this.uploadButton.locator()}`);
            yield expect(this.condition.shouldBeVisible(this.confirmationPopUp, 10))
                .toBe(true, `ConfirmationPopUp wasnt visible by locator:
             ${this.confirmationPopUp.locator()}`);
        });
    }
}
exports.VendorPortalHomePage = VendorPortalHomePage;
//# sourceMappingURL=VendorPortalHomePage.js.map