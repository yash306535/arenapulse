import { describe, expect, it, vi } from "vitest";

import { LabeledCheckbox, LabeledInput, LabeledSelect, LabeledTextarea } from "./field";

import { render, screen, userEvent } from "@/test/render";

describe("field primitives", () => {
  it("LabeledSelect associates a label and reports typed changes", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <LabeledSelect
        label="Mode"
        value="a"
        onValueChange={onValueChange}
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
      />,
    );
    await user.selectOptions(screen.getByLabelText("Mode"), "b");
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  it("LabeledInput forwards typed characters", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<LabeledInput label="Origin" value="" onValueChange={onValueChange} />);
    await user.type(screen.getByLabelText("Origin"), "x");
    expect(onValueChange).toHaveBeenCalledWith("x");
  });

  it("LabeledTextarea forwards input", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<LabeledTextarea label="Notes" value="" onValueChange={onValueChange} />);
    await user.type(screen.getByLabelText("Notes"), "y");
    expect(onValueChange).toHaveBeenCalledWith("y");
  });

  it("LabeledCheckbox toggles", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(
      <LabeledCheckbox label="Step-free" checked={false} onCheckedChange={onCheckedChange} />,
    );
    await user.click(screen.getByLabelText("Step-free"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
