import {RegistrationNumbersData} from "./RegistrationNumbersData";
import {Company} from "./Company";

export class RegistrationNumbersDataBuilder {
    company:Company;

    data:RegistrationNumbersData;

    constructor(competentCommercialRegistry:string){
        this.data = new RegistrationNumbersData(competentCommercialRegistry);
    }

    public setcommercialRegistrationNumber(number:string){
        this.data.commercialRegistrationNumber = number;
        return this;
    }

    public setcommercialRegisterExcertpt(excertpt:string){
        this.data.commercialRegisterExcertpt = excertpt;
        return this;
    }

    public setpowerOfAttorney(powerOfAttorney:string){
        this.data.powerOfAttorney = powerOfAttorney;
        return this;
    }

    public build():RegistrationNumbersData{
        return this.data;
    }
}