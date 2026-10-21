import { ColumnDef } from "@tanstack/react-table";
import { Badge, Dropdown } from "react-bootstrap";
import { IconDotsVertical, IconPencil, IconTrash, IconCheck, IconKey } from "@tabler/icons-react";
import { UserItemType } from "types/DataUserTypes";

// Hapus isAdmin dan roleColorMap
interface ColumnHandlers {
  onEdit: (user: UserItemType) => void;
  onDeactivate: (user: UserItemType) => void;
  onActivate: (user: UserItemType) => void;
  onResetPassword: (user: UserItemType) => void;
}

export const getDataUserColumns = ({
  onEdit,
  onDeactivate,
  onActivate,
  onResetPassword,
}: ColumnHandlers): ColumnDef<UserItemType>[] => [
  {
    accessorKey: "full_name",
    header: "Nama Lengkap",
    cell: (info) => <span className="fw-semibold text-dark">{info.getValue() as string}</span>,
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: (info) => info.getValue() ? info.getValue() as string : <span className="text-muted">-</span>,
  },
  {
    accessorKey: "divisi",
    header: "Divisi",
    cell: (info) => info.getValue() ? info.getValue() as string : <span className="text-muted">-</span>,
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: (info) => {
      const isActive = info.getValue() as boolean;
      return (
        <Badge bg={isActive ? "success" : "danger"} className="rounded-pill">
          {isActive ? "Aktif" : "Nonaktif"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <Dropdown align="end">
          <Dropdown.Toggle variant="light" size="sm" className="btn-icon rounded-circle no-caret">
            <IconDotsVertical size={16} />
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => onEdit(user)} className="d-flex align-items-center gap-2">
              <IconPencil size={16} className="text-primary" /> Edit
            </Dropdown.Item>
            <Dropdown.Item onClick={() => onResetPassword(user)} className="d-flex align-items-center gap-2">
              <IconKey size={16} className="text-warning" /> Reset Password
            </Dropdown.Item>
            {user.is_active ? (
              <Dropdown.Item onClick={() => onDeactivate(user)} className="d-flex align-items-center gap-2 text-danger">
                <IconTrash size={16} /> Nonaktifkan
              </Dropdown.Item>
            ) : (
              <Dropdown.Item onClick={() => onActivate(user)} className="d-flex align-items-center gap-2 text-success">
                <IconCheck size={16} /> Aktifkan
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>
      );
    },
  },
];