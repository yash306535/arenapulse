import { useState } from "react";
import { describe, expect, it } from "vitest";

import { Dialog } from "./dialog";

import { render, screen, userEvent, waitFor } from "@/test/render";

function Harness(): React.JSX.Element {
  const [open, setOpen] = useState(true);
  return (
    <Dialog
      open={open}
      onClose={() => {
        setOpen(false);
      }}
      title="Log an incident"
      closeLabel="Close"
    >
      <button type="button">Inside action</button>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("renders a modal dialog with an accessible name and moves focus in", () => {
    render(<Harness />);
    const dialog = screen.getByRole("dialog", { name: "Log an incident" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveFocus();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes via the labeled close button", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
