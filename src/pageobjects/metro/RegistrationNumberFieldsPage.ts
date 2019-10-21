import {BasePage} from "./BasePage";
import {WebElement} from "../../wrappers/WebElement";
import {element,By, browser} from "protractor";
import {Logger} from "../../helpers/Logger";
import {RegistrationNumbersData} from "../../models/RegistrationNumbersData";
import {AddressFieldsPage} from "./AddressFieldsPage";

export class RegistrationNumberFieldsPage extends BasePage{

    competentCommercialRegistryField:WebElement;
    commercialRegistrationNumberField:WebElement;
    commercialRegisterExcertpt:WebElement;
    powerOfAttorney:WebElement;
    nextButton:WebElement;

    constructor(){
        super()
        this.competentCommercialRegistryField = new WebElement(element(By.name("competentRegistry")))
        this.commercialRegistrationNumberField = new WebElement(element(By.name("commercialRegistrationNumber")))
        this.commercialRegisterExcertpt = new WebElement(element(By.css("input[id='registerExcerpt']+*+input[type='file']")))
        this.powerOfAttorney = new WebElement(element(By.css("input[id='powerOfAttorney']+*+input[type='file']")))
        this.nextButton  = new WebElement(element(By.id("cdkPortalButton")))
    }

    public async fillRegistrationNumbers(data:RegistrationNumbersData):Promise<AddressFieldsPage>{
        Logger.logs("In fillRegistrationNumbers")
        await this.competentCommercialRegistryField.type(data.competentCommercialRegistry);
        await this.commercialRegistrationNumberField.type(data.commercialRegistrationNumber)
        await this.commercialRegisterExcertpt.type(data.commercialRegisterExcertpt);
        await this.powerOfAttorney.type(data.powerOfAttorney);
        await this.nextButton.customClick();
        return new AddressFieldsPage();
    }
}