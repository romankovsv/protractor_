import {browser} from 'protractor';
import {Log} from "../../src/helpers/Log";
import {ContactListPageObject} from "../../src/pageobjects/ContactListPageObject";
import {NewContactPageObject} from "../../src/pageobjects/NewContactPageObject";
import {VendorCentralLoginPage} from "../../src/pageobjects/metro/VendorCentralLoginPage";
import {SMSHomePage} from "../../src/pageobjects/metro/SMSHomePage";


describe('registration', () => {
    let loginPage: VendorCentralLoginPage;

    beforeEach(async () => {
        loginPage = await new VendorCentralLoginPage();
        await loginPage.navigateTo();

    });

    it('user can register', async () => {

        //TODO generate user object and fill with data

        let homePage: SMSHomePage  = await loginPage.login();
        await homePage.clickAddNewUser();
        await homePage.addNewUser();

    });


});
