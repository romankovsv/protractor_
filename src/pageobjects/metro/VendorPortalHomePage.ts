import {BasePage} from "./BasePage";
import {WebElement} from "../../wrappers/WebElement";
import {element, By} from "protractor";
import {Logger} from "../../helpers/Logger";

export class VendorPortalHomePage extends BasePage{

    uploadButton:WebElement;
    confirmationPopUp:WebElement;

    constructor(){
        super();
        this.uploadButton =  new WebElement(element(By.css(".m-page-container .button__upload")))
        this.confirmationPopUp = new WebElement(element(By.css(".m-alert-containe")))
    }

    public verifyThatHomePageIsOpen(){
        Logger.logs("In verifyThatHomePageIsOpen")

        this.condition.shouldBeVisible(this.uploadButton,10)
        this.condition.shouldBeVisible(this.confirmationPopUp,10)
        return this;
    }

}