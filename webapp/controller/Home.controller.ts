import Controller from "sap/ui/core/mvc/Controller";
import MessageToast from "sap/m/MessageToast";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import Component from "../Component";

/** @namespace com.example.boilerplate.controller */
export default class Home extends Controller {
  public async onTest(): Promise<void> {
    const model = this.getOwnerComponent()!.getModel("i18n") as ResourceModel;
    const bundle = await model.getResourceBundle();
    MessageToast.show(bundle.getText("testSuccess") ?? "testSuccess");
  }

  public onAbout(): void {
    (this.getOwnerComponent() as Component).getRouter().navTo("about");
  }
}
