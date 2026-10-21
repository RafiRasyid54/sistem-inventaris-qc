import apiFetch from "lib/api";
import { UserItemType, UserFormValues, ResetPasswordValues } from "types/DataUserTypes";

interface CreateUserPayload {
  full_name: string;
  username: string;
  email?: string;
  password?: string;
  divisi?: string;
}

interface UpdateUserPayload {
  full_name?: string;
  username?: string;
  email?: string;
  password?: string;
  divisi?: string;
}

export async function getUsers(): Promise<UserItemType[]> {
  return apiFetch<UserItemType[]>("/users");
}

export async function createUser(
  values: UserFormValues
): Promise<UserItemType> {
  const payload: CreateUserPayload = {
    full_name: values.full_name,
    username: values.username,
    email: values.email, // <-- EMAIL DITAMBAHKAN DI SINI
    password: values.password,
    divisi: values.divisi,
  };

  return apiFetch<UserItemType>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(
  id: string,
  values: UserFormValues
): Promise<UserItemType> {
  const payload: UpdateUserPayload = {
    full_name: values.full_name,
    username: values.username,
    email: values.email, // <-- EMAIL DITAMBAHKAN DI SINI
    divisi: values.divisi,
  };

  // Jika password diisi, ikut sertakan dalam update
  if (values.password) {
    payload.password = values.password;
  }

  return apiFetch<UserItemType>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await apiFetch(`/users/${id}`, { method: "DELETE" });
}

export async function resetUserPassword(
  id: string,
  values: ResetPasswordValues
): Promise<void> {
  await apiFetch(`/users/${id}/reset-password`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export async function activateUser(id: string): Promise<void> {
  await apiFetch(`/users/${id}/aktifkan`, { method: "PATCH" });
}