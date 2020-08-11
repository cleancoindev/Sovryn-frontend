import React, { Component } from "react";
import { Link } from "react-router-dom";

//import {ReactComponent as FulcrumLogo} from "../assets/images/fulcrum_logo.svg";
//import {ReactComponent as FulcrumLogoPartial} from "../assets/images/fulcrum_logo_partial.svg";
import {ReactComponent as SovrynLogo} from "../assets/images/sovryn-logo-white.svg";

export class HeaderLogo extends Component {
  public render() {
    return (
      <div className="header-logo">
        <Link to="/">
          <div className="header-logo-full">
            <SovrynLogo />
          </div>
          <div className="header-logo-partial">
            <SovrynLogo />
          </div>
        </Link>
      </div>
    );
  }
}
