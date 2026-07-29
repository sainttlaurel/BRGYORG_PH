import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import NotFoundPage from "../NotFoundPage";

describe("NotFoundPage", () => {
  it("renders the heading and message", () => {
    render(
      <MemoryRouter initialEntries={["/some/missing/page"]}>
        <NotFoundPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(screen.getByText(/\/some\/missing\/page/)).toBeInTheDocument();
  });

  it("renders a back-to-home link", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
    const link = screen.getByRole("link", { name: /back to home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });
});
