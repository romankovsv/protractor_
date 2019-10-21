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
import {VendorPortalCompanyFields} from "../../src/pageobjects/metro/VendorPortalCompanyFields";
import {CompanyBuilder} from "../../src/models/CompanyBuilder";
import {RegistrationNumberFieldsPage} from "../../src/pageobjects/metro/RegistrationNumberFieldsPage";
import {RegistrationNumbersData} from "../../src/models/RegistrationNumbersData";
import {RegistrationNumbersDataBuilder} from "../../src/models/RegistrationNumbersDataBuilder";
import {AddressFieldsPage} from "../../src/pageobjects/metro/AddressFieldsPage";
import {Company} from "../../src/models/Company";
import {AddressData} from "../../src/models/AddressData";
import {AddressDataBuilder} from "../../src/models/AddressDataBuilder";
import {BankFieldsPage} from "../../src/pageobjects/metro/BankFieldsPage";
import {BankData} from "../../src/models/BankData";
import {BankDataBuilder} from "../../src/models/BankDataBuilder";
import {VendorPortalHomePage} from "../../src/pageobjects/metro/VendorPortalHomePage";


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

        let companyData:Company = new CompanyBuilder(Generator.generateStringWithLenght(8))
            .setCompanyLegal(Generator.generateStringWithLenght(8))
            .setEmail(Generator.generateEmail())
            .setGln(Generator.generateStringWithLenght(8))
            .setTaxNumber(Generator.generateStringWithLenght(8))
            .setVatNumber(Generator.generateStringWithLenght(8))
            .build();

        let registrationData:RegistrationNumbersData = new RegistrationNumbersDataBuilder(Generator.generateStringWithLenght(8))
            .setcommercialRegistrationNumber(Generator.generateStringWithLenght(8))
            .setcommercialRegisterExcertpt(Generator.generateStringWithLenght(8))
            .setpowerOfAttorney(Generator.generateStringWithLenght(8))
            .build();

        let addressData:AddressData = new AddressDataBuilder(
            Generator.generateStringWithLenght(8))
            .setAddressLine1(Generator.generateStringWithLenght(10))
            .setAddressLine2(Generator.generateStringWithLenght(10))
            .setCity(Generator.generateStringWithLenght(10))
            .setEmail(Generator.generateEmail())
            .setFax(Generator.generateStringWithLenght(6))
            .setPostalCode(Generator.generateStringWithLenght(8))
            .setPhone(Generator.generateStringWithLenght(8))
            .build();

        let bankData:BankData = new BankDataBuilder(
            Generator.generateStringWithLenght(10))
            .setIban(Generator.generateStringWithLenght(7))
            .setBic(Generator.generateStringWithLenght(7))
            .setAccountHolder(Generator.generateStringWithLenght(7))
            .build()

        Logger.logs(user.toString());

        let homePage: SMSHomePage = await loginPage.login();
        await homePage.clickAddNewUser();
        await homePage.addNewUser(user);

        let gmail: GmailMainPage = await new GmailSignInPage()
            .loginToGmail();

        let resetPage: ResetPasswordPage = await gmail.activateAccount()
        let confirmPage: VendorContractConfirmPage = await resetPage.enterPassword(user.password);
        let companyFields:VendorPortalCompanyFields   = await confirmPage.acceptTerms();
        let registrationFields:RegistrationNumberFieldsPage = await companyFields.populateGeneralCompanyData(companyData);
        let addressFieldsPage:AddressFieldsPage = await registrationFields.fillRegistrationNumbers(registrationData);
        let bankFieldsPage:BankFieldsPage = await addressFieldsPage.fillAddressData(addressData);

        let vendorPortalHomePage:VendorPortalHomePage = await bankFieldsPage.populateBankFields(bankData);
        await expect(vendorPortalHomePage.verifyThatHomePageIsOpen).toBe(true,"Vendor home page is not open");


    });



});
