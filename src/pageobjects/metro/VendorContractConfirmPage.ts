import {BasePage} from "./BasePage";
import {WebElement} from "../../wrappers/WebElement";
import {element, By, ExpectedConditions, browser} from "protractor";
import {Log} from "../../helpers/Log";
import {VendorPortalCompanyFields} from "./VendorPortalCompanyFields";

export class VendorContractConfirmPage extends BasePage{


    private checboxTermsOfUse:WebElement;
    private buttonProceed:WebElement;
    //private uploadProductData  = new WebElement(By.css(".button.button__upload"));
   // private nextButton = new WebElement(By.css(".vendor-contract--footer button[kind='primaryRaised']"));


    constructor(){
        super();
        this.checboxTermsOfUse = new WebElement(element(By.css(".modal-dialog .m-checkbox-inputIcon")))
        this.buttonProceed = new WebElement(element(By.css(".send-email-modal--footer button")))
       // this.nextButton = new WebElement(By.css(".vendor-contract--footer button[kind='primaryRaised']"))
        //this.uploadProductData = new WebElement(By.css(".button.button__upload"))
    }

    public async acceptTerms():Promise<VendorPortalCompanyFields>{
        await Log.log().debug("Accept terms")
        browser.wait(ExpectedConditions.elementToBeClickable(element(By.css(".send-email-modal--content .m-checkbox svg"))),30000)
        await new WebElement(element(By.css(".send-email-modal--content .m-checkbox svg"))).customClick();
        await this.buttonProceed.customClick();
        await new WebElement(element(By.css(".m-checkbox .m-checkbox-inputIcon svg"))).customClick()
       // await this.nextButton.customClick()
        element(By.css(".vendor-contract--footer button[kind='primaryRaised']")).click()
        return new VendorPortalCompanyFields();
    }

}