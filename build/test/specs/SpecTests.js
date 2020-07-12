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
const VendorCentralLoginPage_1 = require("../../src/pageobjects/vendor/VendorCentralLoginPage");
const UserBuilder_1 = require("../../src/models/UserBuilder");
const Generator_1 = require("../../src/helpers/Generator");
const Logger_1 = require("../../src/helpers/Logger");
const Properties_1 = require("../../src/properties/Properties");
const GmailSignInPage_1 = require("../../src/pageobjects/vendor/GmailSignInPage");
const protractor_1 = require("protractor");
const CompanyBuilder_1 = require("../../src/models/CompanyBuilder");
const RegistrationNumbersDataBuilder_1 = require("../../src/models/RegistrationNumbersDataBuilder");
const AddressDataBuilder_1 = require("../../src/models/AddressDataBuilder");
const BDataBuilder_1 = require("../../src/models/BDataBuilder");
describe('registration', function () {
    let loginPage;
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            loginPage = yield new VendorCentralLoginPage_1.VendorCentralLoginPage();
            yield loginPage.navigateToWithDisabledAngularWait(Properties_1.Properties.VendroCentralUrl);
        });
    });
    it('user can register', function () {
        return __awaiter(this, void 0, void 0, function* () {
            let user = new UserBuilder_1.UserBuilder(Generator_1.Generator.generateStringWithLenght(8))
                .setLastName(Generator_1.Generator.generateStringWithLenght(8))
                .setEmail(Properties_1.Properties.Gmail_WithNumber)
                .setPassword(Generator_1.Generator.generateStringWithLenght(10))
                .setUserType('vendor')
                .build();
            let companyData = new CompanyBuilder_1.CompanyBuilder(Generator_1.Generator.generateStringWithLenght(8))
                .setCompanyLegal(Generator_1.Generator.generateStringWithLenght(8))
                .setEmail(Generator_1.Generator.generateEmail())
                .setCompanyEmailForOrder(Generator_1.Generator.generateEmail())
                .setGln(Generator_1.Generator.generateStringWithLenght(8))
                .setTaxNumber(Generator_1.Generator.generateStringWithLenght(8))
                .setVatNumber(Generator_1.Generator.generateStringWithLenght(8))
                .build();
            let registrationData = new RegistrationNumbersDataBuilder_1.RegistrationNumbersDataBuilder(Generator_1.Generator.generateStringWithLenght(8))
                .setcommercialRegistrationNumber(Generator_1.Generator.generateStringWithLenght(8))
                .setcommercialRegisterExcertpt(Generator_1.Generator.generateStringWithLenght(8))
                .setpowerOfAttorney(Generator_1.Generator.generateStringWithLenght(8))
                .build();
            let addressData = new AddressDataBuilder_1.AddressDataBuilder('Ukraine')
                .setAddressLine1(Generator_1.Generator.generateStringWithLenght(10))
                .setAddressLine2(Generator_1.Generator.generateStringWithLenght(10))
                .setCity(Generator_1.Generator.generateStringWithLenght(10))
                .setEmail(Generator_1.Generator.generateEmail())
                .setFax(Generator_1.Generator.generateStringWithLenght(6))
                .setPostalCode(Generator_1.Generator.generateStringWithLenght(8))
                .setPhone(Generator_1.Generator.generateStringWithLenght(8))
                .build();
            let bankData = new BDataBuilder_1.BDataBuilder(Generator_1.Generator.generateStringWithLenght(10))
                .setIban(Generator_1.Generator.generateStringWithLenght(7))
                .setBic(Generator_1.Generator.generateStringWithLenght(7))
                .setAccountHolder(Generator_1.Generator.generateStringWithLenght(7))
                .build();
            Logger_1.Logger.logs(user.toString());
            let homePage = yield loginPage.login();
            yield homePage.clickAddNewUser();
            yield homePage.addNewUser(user);
            let gmail = yield new GmailSignInPage_1.GmailSignInPage()
                .loginToGmail();
            let resetPage = yield gmail.activateAccount();
            let confirmPage = yield resetPage.enterPassword(user.password);
            let companyFields = yield confirmPage.acceptTerms();
            let registrationFields = yield companyFields.populateGeneralCompanyData(companyData);
            let addressFieldsPage = yield registrationFields.fillRegistrationNumbers(registrationData);
            let bankFieldsPage = yield addressFieldsPage.fillAddressData(addressData);
            let vendorPortalHomePage = yield bankFieldsPage.populateBankFields(bankData);
            yield expect(yield protractor_1.browser.wait(protractor_1.ExpectedConditions
                .textToBePresentInElement(protractor_1.element(protractor_1.By.css(".m-alert-message")), "Your information has been saved and stored in your profile"))).toBe(true, "Successful pop wasn`t displayed");
            yield expect(vendorPortalHomePage.verifyThatHomePageIsOpen());
        });
    });
});
//# sourceMappingURL=SpecTests.js.map