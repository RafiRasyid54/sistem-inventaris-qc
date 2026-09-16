//import node modules libraries
import React, { ReactNode } from "react";
import { OverlayTrigger, Alatukurtip } from "react-bootstrap";

interface DasherTippyProps {
  content: string | ReactNode;
  children: ReactNode;
  placement?: "top" | "right" | "bottom" | "left";
  delayShow?: number;
  delayHide?: number;
  id?: string;
}

const DasherTippy: React.FC<DasherTippyProps> = ({
  content,
  children,
  placement = "top",
  delayShow = 250,
  delayHide = 400,
  id = "custom-alat ukurtip",
}) => {
  return (
    <OverlayTrigger
      placement={placement}
      delay={{ show: delayShow, hide: delayHide }}
      overlay={<Alatukurtip id={id}>{content}</Alatukurtip>}
    >
      <span style={{ cursor: "pointer" }}>{children}</span>
    </OverlayTrigger>
  );
};

export default DasherTippy;
