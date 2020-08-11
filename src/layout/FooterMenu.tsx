import React, { Component } from "react";
import { Link } from "react-router-dom";

interface IFooterMenuProps {
  isMobileMedia: boolean;
  isRiskDisclosureModalOpen: () => void;
}

/* Footer menu item: 
        <div className="footer-menu__item">
          <a href="https://fulcrum.trade/tos/">Terms of use</a>
        </div>
*/

export class FooterMenu extends Component<IFooterMenuProps> {
  public render() {
    return (
      <div className="footer-menu"></div>
    );
  }
}
