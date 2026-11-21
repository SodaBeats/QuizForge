import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../app/providers/AuthProvider";
import { AdminSidebar } from "../features/admin/components/AdminSidebar";

describe("AdminSidebar", () => {
  it("shows a log out button and confirms before calling logout", async () => {
    const logout = vi.fn();

    render(
      <AuthContext.Provider value={{ logout }}>
        <MemoryRouter initialEntries={["/admin"]}>
          <AdminSidebar />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(screen.getByText("Are you sure you want to log out?")).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "Log out" })[1]);
    expect(logout).toHaveBeenCalledTimes(1);
  });
});
