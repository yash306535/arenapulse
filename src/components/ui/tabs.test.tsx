import { describe, expect, it } from "vitest";

import { Tabs } from "./tabs";

import { render, screen, userEvent } from "@/test/render";

const items = [
  { id: "one", label: "First", content: <p>First panel</p> },
  { id: "two", label: "Second", content: <p>Second panel</p> },
];

describe("Tabs", () => {
  it("renders a labeled tablist with the first tab selected", () => {
    render(<Tabs items={items} label="Sections" />);
    expect(screen.getByRole("tablist", { name: "Sections" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "First", selected: true })).toBeInTheDocument();
    expect(screen.getByText("First panel")).toBeInTheDocument();
  });

  it("moves selection with the arrow keys (roving focus)", async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} label="Sections" />);
    await user.click(screen.getByRole("tab", { name: "First" }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Second", selected: true })).toBeInTheDocument();
    expect(screen.getByText("Second panel")).toBeInTheDocument();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "First", selected: true })).toBeInTheDocument();
  });
});
