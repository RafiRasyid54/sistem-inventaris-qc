/***************************
Component : Avatar
****************************

Available Parameters

size        : Required, possible options are xxl, xl, lg, md, sm, xs
type        : Required, possible options are image , initial
src         : Image source is required if type = image
name        : Name is required if type = initial
alt         : Optional, it's used for alt tag of image avatar, which is helpful for invalid url or broken link.
className   : Optional class list e.g. circle, rounded, rounded-circle, bg-info etc...
status      : Optional, possible options are online, away, offline, busy
soft        : Optional, if it's set it will show soft background color which is only useful for type = initial
showExact   : Optional, specify this parameter with name para, if you want to show exactly name value rather acronym format.
bodyClasses : Optional, if you want to apply classes to avatar body i.e. span like me-3, ms-3 etc... you can use this property.
imgAlatTooltip : Optional - Boolean - Default=false, if you specify this parameter, it will show name para value in tooltip.

*/

// import node module libraries
import { Image } from "react-bootstrap";
import React, { ReactNode } from "react";

// import custom components
import DasherTippy from "./DasherTippy";
import { getAssetPath } from "helper/assetPath";

type AvatarSize = "xxl" | "xl" | "lg" | "md" | "sm" | "xs";
type AvatarType = "image" | "initial";
type AvatarStatus = "online" | "away" | "offline" | "busy";
type AvatarVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "light"
  | "dark";

interface AvatarProps {
  size?: AvatarSize;
  type: AvatarType;
  src?: string;
  alt?: string;
  name?: string;
  status?: AvatarStatus;
  className?: string;
  variant?: AvatarVariant;
  soft?: boolean;
  showExact?: boolean;
  imgAlatTooltip?: boolean;
  bodyClasses?: string;
}

const Avatar: React.FC<AvatarProps> = (props) => {
  const {
    size = "md",
    type,
    src,
    alt,
    name,
    className = "",
    status,
    soft = false,
    variant = "primary",
    showExact = false,
    imgAlatTooltip = false,
    bodyClasses,
  } = props;

  const renderAvatar = () => {
    if (type === "initial" && name) {
      const matches = name.match(/\b(\w)/g);
      const acronym = showExact ? name : matches?.join("") ?? "";

      if (soft) {
        const softAvatarNode = (
          <span
            className={`avatar avatar-${size} avatar-${variant}-soft me-0 mb-2 mb-lg-0`}
          >
            <span className={`avatar-initials ${className}`}>{acronym}</span>
          </span>
        );

        return imgAlatTooltip ? (
          <DasherTippy content={name}>{softAvatarNode}</DasherTippy>
        ) : (
          softAvatarNode
        );
      }

      const standardAvatarNode = (
        <span
          title={alt}
          className={`avatar avatar-${size} avatar-primary me-0 mb-2 mb-lg-0 ${
            status ? "avatar-indicators avatar-" + status : ""
          }`}
        >
          <span className={`avatar-initials bg-${variant} ${className}`}>
            {acronym}
          </span>
        </span>
      );

      return imgAlatTooltip && name ? (
        <DasherTippy content={name}>{standardAvatarNode}</DasherTippy>
      ) : (
        standardAvatarNode
      );
    }

    if (type === "image" && src) {
      if (imgAlatTooltip && name) {
        return (
          <span
            className={`avatar avatar-${size} me-1 ${
              status ? "avatar-indicators mb-2 mb-lg-0 avatar-" + status : ""
            } ${bodyClasses ? bodyClasses : ""}`}
          >
            <DasherTippy content={name}>
              <Image
                src={getAssetPath(src)}
                alt={alt}
                className={`mb-2 mb-lg-0 ${className}`}
              />
            </DasherTippy>
          </span>
        );
      }

      return (
        <span
          className={`avatar avatar-${size} me-0 ${
            status ? "avatar-indicators mb-2 mb-lg-0 avatar-" + status : ""
          }`}
        >
          <Image
            src={getAssetPath(src)}
            alt={alt}
            className={`mb-2 mb-lg-0 ${className}`}
          />
        </span>
      );
    }

    return <span>Required Avatar parameter not found</span>;
  };

  return renderAvatar();
};

/***************************
Component : AvatarGroup
****************************/

interface AvatarGroupProps {
  className?: string;
  children: ReactNode;
}

const AvatarGroup: React.FC<AvatarGroupProps> = (props) => {
  return (
    <div className={`avatar-group ${props.className ? props.className : ""}`}>
      {props.children}
    </div>
  );
};

/***************************
Component : Ratio
****************************/

interface RatioProps {
  src: string;
  size: string;
  className?: string;
}

const Ratio: React.FC<RatioProps> = (props) => {
  const { src, size, className } = props;
  return (
    <span>
      <Image
        src={getAssetPath(src)}
        alt=""
        className={`img-4by3-${size} mb-2 mb-lg-0 ${className}`}
      />
    </span>
  );
};

export { Avatar, AvatarGroup, Ratio };
export type {
  AvatarProps,
  AvatarGroupProps,
  RatioProps,
  AvatarSize,
  AvatarType,
  AvatarStatus,
  AvatarVariant,
};