import {BasePage} from "./BasePage";
import {WebElement} from "../../wrappers/WebElement";
import {element, By, browser} from "protractor";
import {Logger} from "../../helpers/Logger";
import {BankData} from "../../models/BankData";
import {VendorPortalHomePage} from "./VendorPortalHomePage";

export class BankFieldsPage extends BasePage{

    submitButton:WebElement;
    bankField:WebElement;
    ibanField:WebElement;
    bicField:WebElement
    accountHolderField:WebElement;


    constructor(){
        super();
        this.submitButton = new WebElement(element(By.css("#cdkPortalButton")))
        this.bankField = new WebElement(element(By.name("bankInstitute")))
        this.ibanField = new WebElement(element(By.name("iban")))
        this.bicField = new WebElement(element(By.name("bic")))
        this.accountHolderField = new WebElement(element(By.name("accountHolder")))
    }

    public async populateBankFields(data:BankData):Promise<VendorPortalHomePage>{
        Logger.logs("In populateBankFields with data: " + data.toString());
        await this.bankField.type(data.bank);
        await this.ibanField.type(data.iban);
        await this.bicField.type(data.bic);
        await this.accountHolderField.type(data.accountHolder);
        await this.stopWatch();
        await this.submitButton.customClick();
        return new VendorPortalHomePage();
    }

}