import {BasePage} from "./BasePage";
import {WebElement} from "../../wrappers/WebElement";
import {browser, By, element, $$, ExpectedConditions} from "protractor";
import {Logger} from "../../helpers/Logger";
import {RegistrationNumbersData} from "../../models/RegistrationNumbersData";
import {AddressFieldsPage} from "./AddressFieldsPage";

let path = require('path')

export class RegistrationNumberFieldsPage extends BasePage {

    competentCommercialRegistryField: WebElement;
    commercialRegistrationNumberField: WebElement;
    commercialRegisterExcertpt: WebElement;
    powerOfAttorney: WebElement;
    nextButton: WebElement;

    constructor() {
        super()
        this.competentCommercialRegistryField = new WebElement(element(By.name("competentRegistry")))
        this.commercialRegistrationNumberField = new WebElement(element(By.name("commercialRegistrationNumber")))
        this.commercialRegisterExcertpt = new WebElement(element(By.css("input[id='registerExcerpt']+*+input[type='file']")))
        this.powerOfAttorney = new WebElement(element(By.css("input[id='powerOfAttorney']+*+input[type='file']")))
        this.nextButton = new WebElement(element(By.id("cdkPortalButton")))
    }

    public async fillRegistrationNumbers(data: RegistrationNumbersData): Promise<AddressFieldsPage> {
        Logger.logs("In fillRegistrationNumbers")
        await this.competentCommercialRegistryField.type(data.competentCommercialRegistry);
        await this.commercialRegistrationNumberField.type(data.commercialRegistrationNumber)

        let fileToUploadExcerpt = "./resources/contract.pdf";
        let fileToUploadPowerToAttoreney = "./resources/someinfo.pdf";

        let absolutePathExcerpt = await path.resolve("../", fileToUploadExcerpt);
        let absolutePathPowerToAttoreney = await path.resolve("../", fileToUploadPowerToAttoreney);

        await this.commercialRegisterExcertpt.sendKeys(absolutePathExcerpt);
        await browser.wait(ExpectedConditions.visibilityOf($$("div[class$='info-name']>span")));
        await this.powerOfAttorney.sendKeys(absolutePathPowerToAttoreney);
        await this.condition.shouldBeVisible(element(By.css("div[class$='info-name']>span")),5);
        await this.nextButton.customClick();
        return new AddressFieldsPage();
    }
}