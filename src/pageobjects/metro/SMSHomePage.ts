import {Condition} from "../../helpers/Condition";
import {WebElement} from "../../wrappers/WebElement";
import {browser, By, element} from "protractor";
import {Generator} from "../../helpers/Generator";
import {User} from "../../models/User";
import {BasePage} from "./BasePage";
import {Log} from "../../helpers/Log";
import {LocalStorage} from "../../helpers/LocalStorage";

export class SMSHomePage extends BasePage{

    private sideBar_Suppliers_Menu: WebElement;
    private sidebar_suppliers_users: WebElement;
    private addUserButton: WebElement;
    private userTypeSelector: WebElement;
    private saveUserButton: WebElement;
    private firstNameField: WebElement;
    private lastNameField: WebElement;
    private emailField: WebElement;
    private successMessage:WebElement;


    constructor() {
        super();
        this.sideBar_Suppliers_Menu = new WebElement(element(By.css("li[data-section-name='suppliers'] .menu-text")));
        this.sidebar_suppliers_users = new WebElement(element(By.xpath("//a[@data-name='pages.users']")))
        this.addUserButton = new WebElement(element(By.css("button[href='/profiles/add']")))
        this.userTypeSelector = new WebElement(element(By.id("new_user_type")))
        this.firstNameField = new WebElement(element(By.id("new_user_firstName")))
        this.lastNameField = new WebElement(element(By.id("new_user_lastName")))
        this.emailField = new WebElement(element(By.id("new_user_email")))
        this.saveUserButton = new WebElement(element(By.css("form[name='new_user'] .btn-success")))
        this.successMessage = new WebElement(element(By.css(".callout-success")))
        this.condition.shouldBeClickable(this.sideBar_Suppliers_Menu, 30)

    }

    public async clickAddNewUser(): Promise<SMSHomePage> {

        await this.sideBar_Suppliers_Menu.customClick();
        await this.sidebar_suppliers_users.customClick();
        await this.addUserButton.customClick()
        return this;
    }

    public async addNewUser(user:User, sessionCookie:string): Promise<SMSHomePage> {
        await Log.log().debug("Add new user: " + user)
        await this.userTypeSelector.selectByValue(user.userType);
        await this.firstNameField.type(user.firstName);
        await this.lastNameField.type(user.lastName);
        await this.emailField.type(user.email);
        await this.saveUserButton.customClick();
        await browser.manage().getCookie("PHPSESSID").then(function(cookie) {
            console.log("Cookies")
            console.log(cookie)
            console.dir(cookie);
            sessionCookie = cookie.value;
            console.dir("sessionCookie: "+sessionCookie);
            LocalStorage.setKeyValue("sessionCookie",sessionCookie)
        });
        return this;
    }

    public async getMessage():Promise<string>{
        return await this.successMessage.getText();
    }





}