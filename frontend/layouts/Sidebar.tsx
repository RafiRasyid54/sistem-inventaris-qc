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

  const isCollapsed = collapsed === "collapsed";

  const handleSidebarMouseEnter = () => {
    if (isCollapsed) {
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
      className="h-100 bg-white"
    >
      <div>
        {/* LOGO */}
        {!hideLogo && (
          <div className={`brand-logo px-4 py-3 ${isCollapsed ? "text-center px-2" : ""}`}>
            <Link
              href="/"
              className={`d-none d-md-flex align-items-center pln-brand text-decoration-none ${isCollapsed ? "justify-content-center" : ""}`}
            >
              <Image
                src={getAssetPath(
                  "/images/png/PLN_Logo_QC.png"
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
          bsPrefix={`navbar-nav flex-column ${isCollapsed ? "px-1" : "px-2"}`}
        >
          {DashboardMenu.map(
            (menu: MenuItemType, index: number) => {
              // GROUP TITLE (Sembunyikan saat collapsed agar tidak merusak tampilan)
              if (menu.grouptitle) {
                if (isCollapsed) return null;
                return (
                  <Nav.Item
                    key={`group-${index}`}
                    as="li"
                    className="px-3 pt-3 pb-1"
                  >
                    <div className="nav-heading text-uppercase fs-xs fw-semibold text-muted">
                      {menu.title}
                    </div>
                  </Nav.Item>
                );
              }

              // MENU WITH CHILDREN
              if (menu.children) {
                return (
                  <Fragment key={`menu-${index}`}>
                    <CustomToggle
                      eventKey={index.toString()}
                      icon={menu.icon}
                      isActive={isMenuActive(menu)}
                      isCollapsed={isCollapsed}
                    >
                      {menu.title}
                    </CustomToggle>

                    {!isCollapsed && (
                      <Accordion.Collapse
                        eventKey={index.toString()}
                      >
                        <ListGroup
                          as="ul"
                          className="dropdown-menu flex-column border-0 shadow-none bg-transparent ps-3"
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
                                  className={`nav-link rounded-3 py-2 px-3 ${
                                    location ===
                                    menuLevel1Item.link
                                      ? "active fw-semibold"
                                      : "text-dark"
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
                    )}
                  </Fragment>
                );
              }

              // SINGLE MENU
              return (
                <Nav.Item
                  as="li"
                  key={`single-${index}`}
                  className={`${isCollapsed ? "px-1" : "px-2"} my-1`}
                >
                  <Link
                    href={menu.link || "#"}
                    title={isCollapsed ? menu.title : undefined}
                    className={`nav-link rounded-3 d-flex align-items-center ${
                      isCollapsed ? "justify-content-center py-2 px-0" : "gap-2 py-2 px-3"
                    } ${
                      location === menu.link
                        ? "active fw-semibold bg-primary text-white"
                        : "text-dark"
                    }`}
                  >
                    <span className="nav-icon d-flex align-items-center justify-content-center">
                      {menu.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="text text-truncate">
                        {menu.title}
                      </span>
                    )}
                  </Link>
                </Nav.Item>
              );
            }
          )}

          {/* LOGOUT */}
          <Nav.Item as="li" className={`${isCollapsed ? "px-1" : "px-2"} mt-4`}>
            <button
              type="button"
              onClick={handleLogout}
              title={isCollapsed ? "Logout" : undefined}
              className={`nav-link rounded-3 border-0 bg-transparent w-100 d-flex align-items-center ${
                isCollapsed ? "justify-content-center py-2 px-0" : "text-start gap-2 py-2 px-3"
              } text-danger`}
            >
              <span className="nav-icon d-flex align-items-center justify-content-center">
                <IconLogout size={18} />
              </span>
              {!isCollapsed && (
                <span className="text fw-semibold">
                  Logout
                </span>
              )}
            </button>
          </Nav.Item>
        </Accordion>
      </div>
    </div>
  );
};

export default Sidebar;