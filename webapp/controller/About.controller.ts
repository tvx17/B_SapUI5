import Controller from "sap/ui/core/mvc/Controller";
import Component from "../Component";

/** @namespace com.example.boilerplate.controller */
export default class About extends Controller {
  public onBack(): void {
    (this.getOwnerComponent() as Component).getRouter().navTo("home", {}, true);
  }
}
