import {VendorCentralLoginPage} from "../../src/pageobjects/metro/VendorCentralLoginPage";
import {SMSHomePage} from "../../src/pageobjects/metro/SMSHomePage";
import {User} from "../../src/models/User";
import {UserBuilder} from "../../src/models/UserBuilder";
import {Generator} from "../../src/helpers/Generator";
import {Logger} from "../../src/helpers/Logger";
import {Properties} from "../../src/properties/Properties";
import {GmailSignInPage} from "../../src/pageobjects/metro/GmailSignInPage";
import {GmailMainPage} from "../../src/pageobjects/metro/GmailMainPage";
import {ResetPasswordPage} from "../../src/pageobjects/metro/ResetPasswordPage";
import {VendorContractConfirmPage} from "../../src/pageobjects/metro/VendorContractConfirmPage";
import {browser, Session} from "protractor"


describe('registration', function () {
    let loginPage: VendorCentralLoginPage;

    beforeEach(async function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000
        loginPage = await new VendorCentralLoginPage();
        await loginPage.navigateToWithDisabledAngularWait(Properties.VendroCentralUrl);
    });

    it('user can register', async function () {

        let user: User = new UserBuilder(Generator.generateStringWithLenght(8))
            .setLastName(Generator.generateStringWithLenght(8))
            .setEmail(Properties.Gmail_WithNumber)
            .setPassword(Generator.generateStringWithLenght(10))
            .setUserType('vendor')
            .build();

        Logger.logs(user.toString());


        const sessionCookie: string = null;

        let homePage: SMSHomePage = await loginPage.login();
        await homePage.clickAddNewUser();
        await homePage.addNewUser(user);

        let gmail: GmailMainPage = await new GmailSignInPage()
            .loginToGmail();


        let resetPage: ResetPasswordPage = await gmail.activateAccount()
        let confirmPage: VendorContractConfirmPage =
            await resetPage.enterPassword(user.password);
        await confirmPage.acceptTerms();


    });



});
