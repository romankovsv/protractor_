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
describe('registration', () => {
    let loginPage;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        loginPage = yield new VendorCentralLoginPage_1.VendorCentralLoginPage();
        yield loginPage.navigateTo();
    }));
    it('user can register', () => __awaiter(void 0, void 0, void 0, function* () {
        let user = new UserBuilder_1.UserBuilder(Generator_1.Generator.generateStringWithLenght(8))
            .setLastName(Generator_1.Generator.generateStringWithLenght(8))
            .setEmail('autotest.metro+' + Generator_1.Generator.generateNumber() + '@gmail.com')
            .setUserType('vendor')
            .build();
        Log_1.Log.log().debug(user);
        let homePage = yield loginPage.login();
        yield homePage.clickAddNewUser();
        yield homePage.addNewUser(user);
    }));
});
//# sourceMappingURL=MetroSpecTests.js.map