import {BasePage} from "../BasePage";
import {WebElement} from "../../wrappers/WebElement";
import {Logger} from "../../helpers/Logger";
import {element, By} from "protractor";
import {AddressData} from "../../models/AddressData";
import {BankFieldsPage} from "./BankFieldsPage";

export class AddressFieldsPage extends BasePage{

    countryField:WebElement;
    postalCodeField:WebElement;
    cityField:WebElement;
    addressLine1:WebElement;
    addressLine2:WebElement;
    emailField:WebElement;
    phoneField:WebElement;
    nextButton:WebElement;
    faxField:WebElement;


    constructor(){
        super()
        this.countryField = new WebElement(element(By.css("input[placeholder='Type in country']")))
        this.postalCodeField = new WebElement(element(By.css("input[name='zip']")))
        this.cityField = new WebElement(element(By.css("input[name='city']")))
        this.addressLine1 = new WebElement(element(By.css("input[name='address'][ng-reflect-name='line1']")))
        this.addressLine2 = new WebElement(element(By.css("input[name='address'][ng-reflect-name='line2']")))
        this.emailField = new WebElement(element(By.css("input[name='email']")))
        this.phoneField = new WebElement(element(By.css("input[name='phone']")))
        this.nextButton = new WebElement(element(By.id("cdkPortalButton")))
        this.faxField = new WebElement(element(By.css("input[name='fax']")))
    }

    public async fillAddressData(data:AddressData):Promise<BankFieldsPage>{
        Logger.logs("In Fill address data")
        await this.countryField.type(data.country);
        await this.postalCodeField.type(data.postalCode);
        await this.cityField.type(data.city);
        await this.addressLine1.type(data.addressLine1);
        await this.addressLine2.type(data.addressLine2);
        await this.emailField.type(data.email);
        await this.phoneField.type(data.phone);
        await this.faxField.type(data.fax);
        await this.nextButton.customClick();

        return new BankFieldsPage();
    }

}