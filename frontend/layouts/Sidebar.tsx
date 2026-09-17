"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React, { Fragment } from "react";
import {
  Accordion,
  Image,
  ListGroup,
  Nav,
} from "react-bootstrap";
import { IconLogout } from "@tabler/icons-react";

import { MenuItemType } from "types/menuTypes";
import CustomToggle from "./SidebarMenuToggle";
import useMenu from "hooks/useMenu";
import { useAppSelector } from "store/store";
import { getAssetPath } from "helper/assetPath";
import { DashboardMenu } from "routes/DashboardRoute";

interface SidebarProps {
  hideLogo: boolean;
  containerId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  hideLogo = false,
  containerId,
}) => {
  const location = usePathname();
  const router = useRouter();

  const { handleCollapsed } = useMenu();
  const collapsed = useAppSelector(
    (state) => state.app.collapsed
  );

  const handleSidebarMouseEnter = () => {
    if (collapsed === "collapsed") {
      handleCollapsed("expanded");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/signin");
  };

  const isMenuActive = (menu: MenuItemType): boolean => {
    if (menu.link && location === menu.link) {
      return true;
    }

    if (menu.children) {
      return menu.children.some((child) =>
        isMenuActive(child as MenuItemType)
      );
    }

    return false;
  };

  return (
    <div
      id={containerId}
      onMouseEnter={handleSidebarMouseEnter}
    >
      <div>
        {/* LOGO */}
        {!hideLogo && (
          <div className="brand-logo">
            <Link
              href="/"
              className="d-none d-md-flex align-items-center pln-brand"
            >
              <Image
                src={getAssetPath(
                  "/images/png/PLN-logo.png"
                )}
                alt="PT PLN (Persero)"
                className="pln-logo"
              />
            </Link>
          </div>
        )}

        {/* SIDEBAR MENU */}
        <Accordion
          defaultActiveKey="0"
          as="ul"
          bsPrefix="navbar-nav flex-column"
        >
          {DashboardMenu.map(
            (menu: MenuItemType, index: number) => {
              {/* GROUP TITLE */}
              if (menu.grouptitle) {
                return (
                  <Nav.Item
                    key={`group-${index}`}
                    as="li"
                  >
                    <div className="nav-heading">
                      {menu.title}
                    </div>

                    <hr className="mx-5 nav-line mb-1" />
                  </Nav.Item>
                );
              }

              {/* MENU WITH CHILDREN */}
              if (menu.children) {
                return (
                  <Fragment key={`menu-${index}`}>
                    <CustomToggle
                      eventKey={index.toString()}
                      icon={menu.icon}
                      isActive={isMenuActive(menu)}
                    >
                      {menu.title}
                    </CustomToggle>

                    <Accordion.Collapse
                      eventKey={index.toString()}
                    >
                      <ListGroup
                        as="ul"
                        className="dropdown-menu flex-column"
                      >
                        {menu.children.map(
                          (
                            menuLevel1Item,
                            menuLevel1Index
                          ) => (
                            <ListGroup.Item
                              as="li"
                              bsPrefix="nav-item"
                              key={`child-${index}-${menuLevel1Index}`}
                            >
                              <Link
                                href={
                                  menuLevel1Item.link || "#"
                                }
                                className={`nav-link ${
                                  location ===
                                  menuLevel1Item.link
                                    ? "active"
                                    : ""
                                }`}
                              >
                                {menuLevel1Item.name ||
                                  menuLevel1Item.title}
                              </Link>
                            </ListGroup.Item>
                          )
                        )}
                      </ListGroup>
                    </Accordion.Collapse>
                  </Fragment>
                );
              }

              {/* SINGLE MENU */}
              return (
                <Nav.Item
                  as="li"
                  key={`single-${index}`}
                >
                  <Link
                    href={menu.link || "#"}
                    className={`nav-link ${
                      location === menu.link
                        ? "active"
                        : ""
                    }`}
                  >
                    <span className="nav-icon">
                      {menu.icon}
                    </span>

                    <span className="text">
                      {menu.title}
                    </span>
                  </Link>
                </Nav.Item>
              );
            }
          )}

          {/* LOGOUT */}
          <Nav.Item as="li">
            <button
              type="button"
              onClick={handleLogout}
              className="nav-link border-0 bg-transparent w-100 text-start"
            >
              <span className="nav-icon">
                <IconLogout size={18} />
              </span>

              <span className="text">
                Logout
              </span>
            </button>
          </Nav.Item>
        </Accordion>
      </div>
    </div>
  );
};

export default Sidebar;