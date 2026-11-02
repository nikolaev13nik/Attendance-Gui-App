import { describe, expect, it } from "vitest";
import { isPlatformAdmin, selectableUserId, workingTenantId } from "./roles.js";

const employee = { idUser: 2, tenantId: 100, roles: ["USER"] };
const companyAdmin = { idUser: 1, tenantId: 100, roles: ["USER", "ADMINISTRATOR"] };
const platformAdmin = { idUser: 123456789, tenantId: 0, roles: ["PLATFORM_ADMIN"] };
const acme = { tenantId: 2, companyName: "Acme Corp" };

describe("isPlatformAdmin", () => {
  it("needs the PLATFORM_ADMIN role in the platform tenant", () => {
    expect(isPlatformAdmin(platformAdmin)).toBe(true);
    expect(isPlatformAdmin({ ...platformAdmin, tenantId: 100 })).toBe(false);
    expect(isPlatformAdmin(companyAdmin)).toBe(false);
    expect(isPlatformAdmin(null)).toBe(false);
  });
});

describe("workingTenantId", () => {
  it("keeps an employee in their own company, whatever was chosen", () => {
    expect(workingTenantId(employee, null)).toBe(100);
    expect(workingTenantId(employee, acme)).toBe(100);
  });

  it("keeps a company administrator in their own company", () => {
    expect(workingTenantId(companyAdmin, acme)).toBe(100);
  });

  it("gives the platform admin the company they chose", () => {
    expect(workingTenantId(platformAdmin, acme)).toBe(2);
  });

  it("gives the platform admin no company until one is chosen", () => {
    expect(workingTenantId(platformAdmin, null)).toBeNull();
  });

  it("has no company when nobody is signed in", () => {
    expect(workingTenantId(null, null)).toBeNull();
  });
});

describe("selectableUserId", () => {
  const users = [{ idUser: 1 }, { idUser: 2 }];

  it("keeps a selection that is in the company", () => {
    expect(selectableUserId(users, "2")).toBe("2");
  });

  it("switches to the first user when the selection is not in the company", () => {
    expect(selectableUserId(users, "123456789")).toBe("1");
  });

  it("keeps the selection while the list is empty", () => {
    expect(selectableUserId([], "123456789")).toBe("123456789");
  });
});
