import UIComponent from "sap/ui/core/UIComponent";
import JSONModel from "sap/ui/model/json/JSONModel";

/** @namespace com.example.boilerplate */
export default class Component extends UIComponent {
  static readonly metadata = {
    manifest: "json",
    interfaces: ["sap.ui.core.IAsyncContentCreation"]
  };

  public override init(): void {
    super.init();
    this.setModel(new JSONModel({
      runtime: window.desktop ? "Electron" : "Browser",
      platform: window.desktop?.platform ?? "Web"
    }), "environment");
    this.getRouter().initialize();
  }
}
