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
exports.VendorContractConfirmPage = void 0;
const BasePage_1 = require("./BasePage");
const WebElement_1 = require("../../wrappers/WebElement");
const protractor_1 = require("protractor");
const Logger_1 = require("../../helpers/Logger");
const VendorPortalCompanyFields_1 = require("./VendorPortalCompanyFields");
class VendorContractConfirmPage extends BasePage_1.BasePage {
    //private uploadProductData  = new WebElement(By.css(".button.button__upload"));
    //private nextButton = new WebElement(By.css(".vendor-contract--footer button[kind='primaryRaised']"));
    constructor() {
        super();
        this.checboxTermsOfUse = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css(".modal-dialog .m-checkbox-inputIcon")));
        // this.buttonProceed = new WebElement(element(By.css(".send-email-modal--footer button")))
        // this.nextButton = new WebElement(By.css(".vendor-contract--footer button[kind='primaryRaised']"))
        //this.uploadProductData = new WebElement(By.css(".button.button__upload"))
    }
    acceptTerms() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Logger_1.Logger.logs("Accept terms");
            yield protractor_1.browser.wait(protractor_1.ExpectedConditions.elementToBeClickable(protractor_1.element(protractor_1.By.css(".m-checkbox svg"))), 30000);
            yield protractor_1.browser.wait(protractor_1.ExpectedConditions.visibilityOf(protractor_1.element(protractor_1.By.css(".m-checkbox svg"))), 30000);
            yield new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css(".m-checkbox svg"))).customClick();
            yield this.condition.shouldBeClickable(protractor_1.element(protractor_1.By.css(".vendor-contract--footer button[kind='primaryRaised']")), 10);
            yield this.condition.shouldBeVisible(protractor_1.element(protractor_1.By.css(".vendor-contract--footer button[kind='primaryRaised']")), 10);
            let scrolldown = yield protractor_1.$$(".vendor-contract--footer button[kind='primaryRaised']").get(0);
            yield protractor_1.browser.controlFlow().execute(function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield protractor_1.browser.executeScript('arguments[0].scrollIntoView(true)', scrolldown.getWebElement());
                });
            });
            yield protractor_1.element(protractor_1.By.css(".vendor-contract--footer button[kind='primaryRaised']")).click();
            return new VendorPortalCompanyFields_1.VendorPortalCompanyFields();
        });
    }
}
exports.VendorContractConfirmPage = VendorContractConfirmPage;
//# sourceMappingURL=VendorContractConfirmPage.js.map