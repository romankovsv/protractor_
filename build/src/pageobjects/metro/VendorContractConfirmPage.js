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
const BasePage_1 = require("./BasePage");
const WebElement_1 = require("../../wrappers/WebElement");
const protractor_1 = require("protractor");
const Log_1 = require("../../helpers/Log");
const VendorPortalCompanyFields_1 = require("./VendorPortalCompanyFields");
class VendorContractConfirmPage extends BasePage_1.BasePage {
    //private uploadProductData  = new WebElement(By.css(".button.button__upload"));
    // private nextButton = new WebElement(By.css(".vendor-contract--footer button[kind='primaryRaised']"));
    constructor() {
        super();
        this.checboxTermsOfUse = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css(".modal-dialog .m-checkbox-inputIcon")));
        this.buttonProceed = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css(".send-email-modal--footer button")));
        // this.nextButton = new WebElement(By.css(".vendor-contract--footer button[kind='primaryRaised']"))
        //this.uploadProductData = new WebElement(By.css(".button.button__upload"))
    }
    acceptTerms() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Log_1.Log.log().debug("Accept terms");
            protractor_1.browser.wait(protractor_1.ExpectedConditions.elementToBeClickable(protractor_1.element(protractor_1.By.css(".send-email-modal--content .m-checkbox svg"))), 30000);
            yield new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css(".send-email-modal--content .m-checkbox svg"))).customClick();
            yield this.buttonProceed.customClick();
            yield new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css(".m-checkbox .m-checkbox-inputIcon svg"))).customClick();
            // await this.nextButton.customClick()
            protractor_1.element(protractor_1.By.css(".vendor-contract--footer button[kind='primaryRaised']")).click();
            return new VendorPortalCompanyFields_1.VendorPortalCompanyFields();
        });
    }
}
exports.VendorContractConfirmPage = VendorContractConfirmPage;
//# sourceMappingURL=VendorContractConfirmPage.js.map