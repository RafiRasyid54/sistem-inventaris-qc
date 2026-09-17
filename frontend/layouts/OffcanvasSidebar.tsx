"use client";

import { Image } from "react-bootstrap";
import Offcanvas from "react-bootstrap/Offcanvas";
import OffcanvasBody from "react-bootstrap/OffcanvasBody";
import OffcanvasHeader from "react-bootstrap/OffcanvasHeader";
import Link from "next/link";

import Sidebar from "./Sidebar";

import useMenu from "hooks/useMenu";
import { getAssetPath } from "helper/assetPath";

const OffcanvasSidebar = () => {
  const { showMenu, toggleMenuHandler } = useMenu();

  console.log("OFFCANVAS SHOW:", showMenu);

  return (
    <Offcanvas
      show={showMenu}
      onHide={() => toggleMenuHandler(false)}
      placement="start"
      backdrop={true}
      className="offcanvasNav"
    >
      <OffcanvasHeader closeButton>
        <Link
          href="/"
          className="d-flex align-items-center gap-2 pln-brand"
        >
          <Image
            src={getAssetPath("/images/png/PLN-logo.png")}
            alt="PT PLN (Persero)"
            className="pln-logo"
          />
        </Link>
      </OffcanvasHeader>

      <OffcanvasBody className="p-0">
        <Sidebar hideLogo />
      </OffcanvasBody>
    </Offcanvas>
  );
};

export default OffcanvasSidebar;