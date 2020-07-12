import {BasePage} from "./BasePage";
import {WebElement} from "../../wrappers/WebElement";
import {element,By, browser} from "protractor";
import {Logger} from "../../helpers/Logger";
import {Company} from "../../models/Company";
import {RegistrationNumberFieldsPage} from "./RegistrationNumberFieldsPage";

export class VendorPortalCompanyFields extends BasePage{


    private companyNameField:WebElement;
    private companyLegalField:WebElement;
    private taxNumberField:WebElement;
    private vatNumberField:WebElement;
    private glnField:WebElement;
    private emailField:WebElement;
    private emailForOrderField:WebElement;
    private nextButton:WebElement;

    constructor() {
        super();
        this.companyNameField = new WebElement(element(By.name('companyName')))
        this.companyLegalField = new WebElement(element(By.name('legalForm')))
        this.taxNumberField = new WebElement(element(By.name('taxId')))
        this.vatNumberField = new WebElement(element(By.name('vatNumber')))
        this.glnField = new WebElement(element(By.name("gln")))
        this.emailField = new WebElement(element(By.name('emails')))
        this.emailForOrderField = new WebElement(element(By.name('emailForOrderNotifications')))
        this.nextButton = new WebElement(element(By.css('.m-button')))
    }

    public async populateGeneralCompanyData(company:Company):Promise<RegistrationNumberFieldsPage>{
        Logger.logs("In populateGeneralCompanyData")

        await this.companyNameField.type(company.companyName);
        await this.companyLegalField.type(company.companyLegal);
        await this.taxNumberField.type(company.taxNumber);
        await this.vatNumberField.type(company.vatNumber);
        await this.glnField.type(company.gln);
        await this.emailField.type(company.email);
        await this.emailForOrderField.type(company.emailForOrder)
        await this.stopWatch()
        await this.nextButton.customClick();
        return new RegistrationNumberFieldsPage();
    }
}