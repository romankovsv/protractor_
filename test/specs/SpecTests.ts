import {VendorCentralLoginPage} from "../../src/pageobjects/vendor/VendorCentralLoginPage";
import {HomePage} from "../../src/pageobjects/vendor/HomePage";
import {User} from "../../src/models/User";
import {UserBuilder} from "../../src/models/UserBuilder";
import {Generator} from "../../src/helpers/Generator";
import {Logger} from "../../src/helpers/Logger";
import {Properties} from "../../src/properties/Properties";
import {GmailSignInPage} from "../../src/pageobjects/vendor/GmailSignInPage";
import {GmailMainPage} from "../../src/pageobjects/vendor/GmailMainPage";
import {ResetPasswordPage} from "../../src/pageobjects/vendor/ResetPasswordPage";
import {VendorContractConfirmPage} from "../../src/pageobjects/vendor/VendorContractConfirmPage";
import {browser, By, element, ExpectedConditions} from "protractor"
import {VendorPortalCompanyFields} from "../../src/pageobjects/vendor/VendorPortalCompanyFields";
import {CompanyBuilder} from "../../src/models/CompanyBuilder";
import {RegistrationNumberFieldsPage} from "../../src/pageobjects/vendor/RegistrationNumberFieldsPage";
import {RegistrationNumbersData} from "../../src/models/RegistrationNumbersData";
import {RegistrationNumbersDataBuilder} from "../../src/models/RegistrationNumbersDataBuilder";
import {AddressFieldsPage} from "../../src/pageobjects/vendor/AddressFieldsPage";
import {Company} from "../../src/models/Company";
import {AddressData} from "../../src/models/AddressData";
import {AddressDataBuilder} from "../../src/models/AddressDataBuilder";
import {BankFieldsPage} from "../../src/pageobjects/vendor/BankFieldsPage";
import {BData} from "../../src/models/BData";
import {BDataBuilder} from "../../src/models/BDataBuilder";
import {VendorPortalHomePage} from "../../src/pageobjects/vendor/VendorPortalHomePage";


describe('registration', function () {
    let loginPage: VendorCentralLoginPage;

    beforeEach(async function () {
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

        let companyData: Company = new CompanyBuilder(Generator.generateStringWithLenght(8))
            .setCompanyLegal(Generator.generateStringWithLenght(8))
            .setEmail(Generator.generateEmail())
            .setCompanyEmailForOrder(Generator.generateEmail())
            .setGln(Generator.generateStringWithLenght(8))
            .setTaxNumber(Generator.generateStringWithLenght(8))
            .setVatNumber(Generator.generateStringWithLenght(8))
            .build();

        let registrationData: RegistrationNumbersData = new RegistrationNumbersDataBuilder(Generator.generateStringWithLenght(8))
            .setcommercialRegistrationNumber(Generator.generateStringWithLenght(8))
            .setcommercialRegisterExcertpt(Generator.generateStringWithLenght(8))
            .setpowerOfAttorney(Generator.generateStringWithLenght(8))
            .build();

        let addressData: AddressData = new AddressDataBuilder(
            'Ukraine')
            .setAddressLine1(Generator.generateStringWithLenght(10))
            .setAddressLine2(Generator.generateStringWithLenght(10))
            .setCity(Generator.generateStringWithLenght(10))
            .setEmail(Generator.generateEmail())
            .setFax(Generator.generateStringWithLenght(6))
            .setPostalCode(Generator.generateStringWithLenght(8))
            .setPhone(Generator.generateStringWithLenght(8))
            .build();

        let bankData: BData = new BDataBuilder(
            Generator.generateStringWithLenght(10))
            .setIban(Generator.generateStringWithLenght(7))
            .setBic(Generator.generateStringWithLenght(7))
            .setAccountHolder(Generator.generateStringWithLenght(7))
            .build()

        Logger.logs(user.toString());

        let homePage: HomePage = await loginPage.login();
        await homePage.clickAddNewUser();
        await homePage.addNewUser(user);

        let gmail: GmailMainPage = await new GmailSignInPage()
            .loginToGmail();

        let resetPage: ResetPasswordPage = await gmail.activateAccount()
        let confirmPage: VendorContractConfirmPage = await resetPage.enterPassword(user.password);
        let companyFields: VendorPortalCompanyFields = await confirmPage.acceptTerms();
        let registrationFields: RegistrationNumberFieldsPage = await companyFields.populateGeneralCompanyData(companyData);
        let addressFieldsPage: AddressFieldsPage = await registrationFields.fillRegistrationNumbers(registrationData);
        let bankFieldsPage: BankFieldsPage = await addressFieldsPage.fillAddressData(addressData);
        let vendorPortalHomePage: VendorPortalHomePage = await bankFieldsPage.populateBankFields(bankData);

        await expect(await browser.wait(ExpectedConditions
            .textToBePresentInElement(element(By.css(".m-alert-message")),
                "Your information has been saved and stored in your profile"))).toBe(true,
            "Successful pop wasn`t displayed");

        await expect(vendorPortalHomePage.verifyThatHomePageIsOpen());

    });
});
