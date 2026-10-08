"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React, { Fragment } from "react";
import { Accordion, Image, ListGroup, Nav } from "react-bootstrap";
import { IconLogout, IconBolt } from "@tabler/icons-react";

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

// Sidebar PLN v2: navy, ikon dalam kotak, menu aktif ditandai strip + ikon kuning,
// kartu akun di bagian bawah. Semua selector diawali .pln-sb agar tidak bocor.
const CSS = `
.pln-sb{--navy:#06355f;--blue:#0b6bb8;--yellow:#ffc20e;--red:#ff7a70;
  display:flex;flex-direction:column;min-height:100%;color:#fff;position:relative;overflow:hidden;
  background:linear-gradient(180deg,#05294a 0%,#06355f 45%,#0a5a9c 130%);
  border-right:3px solid var(--yellow)}
.pln-sb::before{content:"";position:absolute;right:-60px;bottom:-40px;width:260px;height:260px;opacity:.07;pointer-events:none;
  background:#fff;clip-path:polygon(55% 0,12% 56%,44% 56%,30% 100%,88% 38%,56% 38%)}

/* versi desktop: menempel setinggi layar, hanya daftar menu yang scroll di dalamnya.
   !important dipakai karena CSS template (#miniSidebar) punya prioritas lebih tinggi. */
.pln-sb.is-sticky{position:fixed!important;top:0!important;bottom:0!important;left:0!important;
  height:100vh!important;height:100dvh!important}

.pln-sb .pln-body{position:relative;flex:1;min-height:0;overflow-y:auto;padding-bottom:12px}

.pln-sb .brand-card{margin:16px 14px 6px;padding:10px 14px;background:#fff;border-radius:14px;
  display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.28)}
.pln-sb .brand-card img{max-width:100%;height:auto;max-height:52px;object-fit:contain}

.pln-sb .nav-heading{display:flex;align-items:center;gap:10px;color:#8fbbe3;letter-spacing:.12em;font-size:.66rem}
.pln-sb .nav-heading::after{content:"";flex:1;height:1px;background:rgba(255,255,255,.14)}

/* item menu: tinggi seragam, ikon dalam kotak */
.pln-sb .nav-link{position:relative;min-height:44px;color:rgba(255,255,255,.8)!important;
  transition:background .15s,color .15s}
.pln-sb .nav-link:hover{background:rgba(255,255,255,.09)!important;color:#fff!important}
.pln-sb .nav-link .nav-icon{width:32px;height:32px;flex:none;border-radius:9px;
  background:rgba(255,255,255,.1);transition:background .15s,color .15s}
.pln-sb .nav-link:hover .nav-icon{background:rgba(255,255,255,.18)}
.pln-sb .nav-link.active{background:rgba(255,255,255,.12)!important;color:#fff!important;font-weight:700}
.pln-sb .nav-link.active .nav-icon{background:var(--yellow);color:var(--navy)}
.pln-sb .nav-link.active::before{content:"";position:absolute;left:-8px;top:20%;bottom:20%;width:4px;
  border-radius:0 4px 4px 0;background:var(--yellow)}
.pln-sb .nav-link:focus-visible,.pln-sb button:focus-visible{outline:2px solid var(--yellow);outline-offset:2px}

/* submenu */
.pln-sb .dropdown-menu{position:static!important;transform:none!important;background:transparent!important;
  margin:2px 0 8px 27px!important;padding:0 0 0 10px!important;border:0!important;
  border-left:1px dashed rgba(255,255,255,.22)!important;box-shadow:none!important}
.pln-sb .pln-child{min-height:38px;font-size:.88rem;color:rgba(255,255,255,.68)!important}
.pln-sb .pln-child.active{background:transparent!important;color:var(--yellow)!important;font-weight:700}
.pln-sb .pln-child.active::before{left:-14px;top:50%;bottom:auto;width:8px;height:8px;transform:translateY(-50%);
  border-radius:50%;background:var(--yellow);box-shadow:0 0 0 4px rgba(255,194,14,.25)}

/* kartu akun di bawah */
.pln-sb .pln-account{position:relative;flex:none;margin:0 12px 14px;padding:10px;border-radius:14px;
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14);
  display:flex;align-items:center;gap:10px}
.pln-sb .pln-account.is-collapsed{justify-content:center;padding:8px 4px}
.pln-sb .pln-avatar{width:38px;height:38px;border-radius:11px;background:var(--yellow);color:var(--navy);
  display:grid;place-items:center;flex:none}
.pln-sb .pln-who{min-width:0;flex:1;line-height:1.25}
.pln-sb .pln-who b{display:block;font-size:.85rem}
.pln-sb .pln-who span{font-size:.72rem;color:#9ec6ea}
.pln-sb .pln-logout{width:34px;height:34px;border:0;border-radius:9px;display:grid;place-items:center;flex:none;
  background:rgba(255,122,112,.16);color:var(--red);cursor:pointer;transition:background .15s}
.pln-sb .pln-logout:hover{background:rgba(255,122,112,.32);color:#ffd2ce}
`;

const Sidebar: React.FC<SidebarProps> = ({ hideLogo = false, containerId }) => {
  const location = usePathname();
  const router = useRouter();

  const { handleCollapsed } = useMenu();
  const collapsed = useAppSelector((state) => state.app.collapsed);
  const isCollapsed = collapsed === "collapsed";

  // Versi laci (Offcanvas) memakai hideLogo dan tetap h-100;
  // versi desktop dibuat sticky setinggi layar.
  const isDrawer = hideLogo;

  const handleSidebarMouseEnter = () => {
    if (isCollapsed) handleCollapsed("expanded");
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/signin");
  };

  const isMenuActive = (menu: MenuItemType): boolean => {
    if (menu.link && location === menu.link) return true;
    if (menu.children) {
      return menu.children.some((child) => isMenuActive(child as MenuItemType));
    }
    return false;
  };

  return (
    <div
      id={containerId}
      onMouseEnter={handleSidebarMouseEnter}
      className={`pln-sb ${isDrawer ? "h-100" : "is-sticky"}`}
    >
      <style>{CSS}</style>

      <div className="pln-body">
        {/* LOGO */}
        {!hideLogo && (
          <div className="brand-card">
            <Link href="/" className="d-none d-md-flex align-items-center text-decoration-none">
              <Image
                src={getAssetPath("/images/png/PLN_Logo_QC.png")}
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
          {DashboardMenu.map((menu: MenuItemType, index: number) => {
            if (menu.grouptitle) {
              if (isCollapsed) return null;
              return (
                <Nav.Item key={`group-${index}`} as="li" className="px-3 pt-3 pb-1">
                  <div className="nav-heading text-uppercase fw-semibold">{menu.title}</div>
                </Nav.Item>
              );
            }

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
                    <Accordion.Collapse eventKey={index.toString()}>
                      <ListGroup as="ul" className="dropdown-menu flex-column">
                        {menu.children.map((child, childIndex) => (
                          <ListGroup.Item as="li" bsPrefix="nav-item" key={`child-${index}-${childIndex}`}>
                            <Link
                              href={child.link || "#"}
                              className={`nav-link pln-child d-flex align-items-center rounded-3 py-2 px-3 ${
                                location === child.link ? "active" : ""
                              }`}
                            >
                              {child.name || child.title}
                            </Link>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Accordion.Collapse>
                  )}
                </Fragment>
              );
            }

            return (
              <Nav.Item as="li" key={`single-${index}`} className={`${isCollapsed ? "px-1" : "px-2"} my-1`}>
                <Link
                  href={menu.link || "#"}
                  title={isCollapsed ? menu.title : undefined}
                  className={`nav-link pln-link rounded-3 d-flex align-items-center ${
                    isCollapsed ? "justify-content-center py-2 px-0" : "gap-3 py-2 px-2"
                  } ${location === menu.link ? "active" : ""}`}
                >
                  <span className="nav-icon d-flex align-items-center justify-content-center">{menu.icon}</span>
                  {!isCollapsed && <span className="text text-truncate">{menu.title}</span>}
                </Link>
              </Nav.Item>
            );
          })}
        </Accordion>
      </div>

      {/* KARTU AKUN + LOGOUT */}
      <div className={`pln-account ${isCollapsed ? "is-collapsed" : ""}`}>
        {!isCollapsed && (
          <>
            <span className="pln-avatar"><IconBolt size={20} /></span>
            <div className="pln-who">
              <b className="text-truncate d-block">Pengelola</b>
              <span>Alat Ukur PLN</span>
            </div>
          </>
        )}
        <button
          type="button"
          className="pln-logout"
          onClick={handleLogout}
          title="Keluar"
          aria-label="Keluar"
        >
          <IconLogout size={18} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;