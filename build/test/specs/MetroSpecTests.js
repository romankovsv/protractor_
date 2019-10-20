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
const VendorCentralLoginPage_1 = require("../../src/pageobjects/metro/VendorCentralLoginPage");
const UserBuilder_1 = require("../../src/models/UserBuilder");
const Generator_1 = require("../../src/helpers/Generator");
const Log_1 = require("../../src/helpers/Log");
const Properties_1 = require("../../src/properties/Properties");
const GmailSignInPage_1 = require("../../src/pageobjects/metro/GmailSignInPage");
const protractor_1 = require("protractor");
describe('registration', function () {
    let loginPage;
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
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
            Log_1.Log.log().debug(user);
            const sessionCookie = null;
            let homePage = yield loginPage.login();
            yield homePage.clickAddNewUser();
            yield homePage.addNewUser(user, sessionCookie);
            console.dir("sessionCookie: " + sessionCookie);
            let gmail = yield new GmailSignInPage_1.GmailSignInPage()
                .loginToGmail();
            let resetPage = yield gmail.activateAccount();
            let confirmPage = yield resetPage.enterPassword(user.password);
            yield confirmPage.acceptTerms();
        });
    });
    afterEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            yield protractor_1.browser.quit();
        });
    });
});
//# sourceMappingURL=MetroSpecTests.js.map