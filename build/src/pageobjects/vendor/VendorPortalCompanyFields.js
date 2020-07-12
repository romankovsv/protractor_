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
exports.VendorPortalCompanyFields = void 0;
const BasePage_1 = require("./BasePage");
const WebElement_1 = require("../../wrappers/WebElement");
const protractor_1 = require("protractor");
const Logger_1 = require("../../helpers/Logger");
const RegistrationNumberFieldsPage_1 = require("./RegistrationNumberFieldsPage");
class VendorPortalCompanyFields extends BasePage_1.BasePage {
    constructor() {
        super();
        this.companyNameField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.name('companyName')));
        this.companyLegalField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.name('legalForm')));
        this.taxNumberField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.name('taxId')));
        this.vatNumberField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.name('vatNumber')));
        this.glnField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.name("gln")));
        this.emailField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.name('emails')));
        this.emailForOrderField = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.name('emailForOrderNotifications')));
        this.nextButton = new WebElement_1.WebElement(protractor_1.element(protractor_1.By.css('.m-button')));
    }
    populateGeneralCompanyData(company) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger_1.Logger.logs("In populateGeneralCompanyData");
            yield this.companyNameField.type(company.companyName);
            yield this.companyLegalField.type(company.companyLegal);
            yield this.taxNumberField.type(company.taxNumber);
            yield this.vatNumberField.type(company.vatNumber);
            yield this.glnField.type(company.gln);
            yield this.emailField.type(company.email);
            yield this.emailForOrderField.type(company.emailForOrder);
            yield this.stopWatch();
            yield this.nextButton.customClick();
            return new RegistrationNumberFieldsPage_1.RegistrationNumberFieldsPage();
        });
    }
}
exports.VendorPortalCompanyFields = VendorPortalCompanyFields;
//# sourceMappingURL=VendorPortalCompanyFields.js.map