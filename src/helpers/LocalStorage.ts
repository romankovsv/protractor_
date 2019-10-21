import {browser} from "protractor";
export class LocalStorage {

    static async getValue(key:string):Promise<any>{
        return  await browser.executeScript("return window.localStorage.getItem('" + key + "');")
            .then(value =>  {
                console.dir("ConsoleDir:"+value)
                return value;
            });
    }

    static setKeyValue(key:string, value:string){
        browser.executeScript("return window.localStorage.setItem('"+key +"','"+value+"')")
    }

    static getLocalStorage(){
        return browser.executeScript("return window.localStorage;");
    }

    static clearLocalStorage(){
        browser.executeScript("return window.localStorage.clear();");
    }
}