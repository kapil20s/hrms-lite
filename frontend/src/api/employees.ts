import { api, unwrap } from "./client";
import type {
  Employee,
  EmployeeCreate,
  EmployeeUpdate,
} from "@/types";

export interface EmployeeListParams {
  department?: string;
  search?: string;
}

export const employeesApi = {
  list: (params?: EmployeeListParams) =>
    api.get("/employees", { params }).then(unwrap<Employee[]>),

  getById: (id: number) =>
    api.get(`/employees/${id}`).then(unwrap<Employee>),

  create: (data: EmployeeCreate) =>
    api.post("/employees", data).then(unwrap<Employee>),

  update: (id: number, data: EmployeeUpdate) =>
    api.put(`/employees/${id}`, data).then(unwrap<Employee>),

  delete: (id: number) =>
    api.delete(`/employees/${id}`).then(unwrap<null>),

  getDepartments: () =>
    api.get("/employees/departments").then(unwrap<string[]>),
};
