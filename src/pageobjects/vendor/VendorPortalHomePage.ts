import {BasePage} from "./BasePage";
import {WebElement} from "../../wrappers/WebElement";
import {By, element} from "protractor";
import {Logger} from "../../helpers/Logger";

export class VendorPortalHomePage extends BasePage {

    uploadButton: WebElement;
    confirmationPopUp: WebElement;

    constructor() {
        super();
        this.uploadButton = new WebElement(element(By.css(".m-page-container .button__upload")))
        this.confirmationPopUp = new WebElement(element(By.css(".m-alert-containe")))
    }

    public async verifyThatHomePageIsOpen() {
        await Logger.logs("In verifyThatHomePageIsOpen");
        await expect(this.condition.shouldBeVisible(this.uploadButton, 10))
            .toBe(true, `Upload button wasnt visible by locator:
             ${this.uploadButton.locator()}`);

        await expect(this.condition.shouldBeVisible(this.confirmationPopUp, 10))
            .toBe(true, `ConfirmationPopUp wasnt visible by locator:
             ${this.confirmationPopUp.locator()}`);
    }

}