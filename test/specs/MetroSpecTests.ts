import {VendorCentralLoginPage} from "../../src/pageobjects/metro/VendorCentralLoginPage";
import {SMSHomePage} from "../../src/pageobjects/metro/SMSHomePage";
import {User} from "../../src/models/User";
import {UserBuilder} from "../../src/models/UserBuilder";
import {Generator} from "../../src/helpers/Generator";
import {Log} from "../../src/helpers/Log";


describe('registration', () => {
    let loginPage: VendorCentralLoginPage;

    beforeEach(async () => {
        loginPage = await new VendorCentralLoginPage();
        await loginPage.navigateTo();

    });

    it('user can register', async () => {

        let user: User = new UserBuilder(Generator.generateStringWithLenght(8))
            .setLastName(Generator.generateStringWithLenght(8))
            .setEmail('autotest.metro+'+Generator.generateNumber()+'@gmail.com')
            .setUserType('vendor')
            .build();

        Log.log().debug(user);

        let homePage: SMSHomePage = await loginPage.login();
        await homePage.clickAddNewUser();
        await homePage.addNewUser(user);

    });


});
