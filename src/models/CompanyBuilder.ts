import {Company} from "./Company";

export class CompanyBuilder{

    company:Company;

    constructor(companyName:string){
        this.company = new Company(companyName);
    }

    public setCompanyLegal(legal:string){
        this.company.companyLegal = legal;
        return this;
    }

    public setCompanyEmailForOrder(email:string){
        this.company.emailForOrder = email;
        return this;
    }

    public setTaxNumber(taxNumber:string){
        this.company.taxNumber = taxNumber;
        return this;
    }

    public setGln(gln:string){
        this.company.gln = gln;
        return this;
    }

    public setVatNumber(vatNumber:string){
        this.company.vatNumber = vatNumber;
        return this;
    }

    public setEmail(email:string){
        this.company.email = email;
        return this;
    }

    public build():Company{
        return this.company;
    }

}