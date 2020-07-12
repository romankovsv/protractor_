import {browser, By, element} from "protractor";
import {Condition} from "../../helpers/Condition";
import {WebElement} from "../../wrappers/WebElement";
import {GmailMainPage} from "./GmailMainPage";
import {Logger} from "../../helpers/Logger";
import {Properties} from "../../properties/Properties";
import {BasePage} from "./BasePage";
export class GmailSignInPage extends BasePage{

    private emailField:WebElement;
    private nextButton:WebElement;
    private nextButtonForPassword:WebElement;
    private passwordField:WebElement;
    private doneButton:WebElement;

    constructor(){
        super();
        this.emailField = new WebElement(element(By.id("identifierId")));
        this.nextButton = new WebElement(element(By.xpath("(//div[@role='button']//span/span)[1]")))
        this.nextButtonForPassword = new WebElement(element(By.xpath("(//div[@role='button']//span/span)[last()-1]")))
        this.passwordField = new WebElement(element(By.css("input[type='password']")))
        this.doneButton = new WebElement(element(By.xpath("//span[contains(text(), 'Done')]")))
    }

    public async loginToGmail():Promise<GmailMainPage>{
        await Logger.logs(`Login to gmail with : ${Properties.Gmail_email}`);
        await this.navigateToWithDisabledAngularWait("http://www.gmail.com");
        await this.emailField.type(Properties.Gmail_email);
        await this.nextButton.customClick();
        await this.passwordField.type(Properties.Gmail_password);
        await this.nextButtonForPassword.customClick();
        return new GmailMainPage();
    }
}
