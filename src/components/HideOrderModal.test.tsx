import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import HideOrderModal from "./HideOrderModal";

afterEach(cleanup);

const signedOrder = {
  id: 27,
  code: "OT-0027",
  car: { plate: "ABC123" },
  signatureUrl: "https://example.com/signatures/27.png",
};

const unsignedOrder = {
  ...signedOrder,
  signatureUrl: null,
};

function renderModal(
  overrides: Partial<React.ComponentProps<typeof HideOrderModal>> = {},
) {
  const props: React.ComponentProps<typeof HideOrderModal> = {
    order: signedOrder,
    open: true,
    pending: false,
    error: null,
    onClose: vi.fn(),
    onRequestSignature: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  };

  return { ...render(<HideOrderModal {...props} />), props };
}

describe("HideOrderModal", () => {
  it("solicita la firma pendiente sin confirmar la ocultación", async () => {
    const user = userEvent.setup();
    const onRequestSignature = vi.fn();
    const onConfirm = vi.fn();
    renderModal({ order: unsignedOrder, onRequestSignature, onConfirm });

    expect(
      screen.getByText(
        "Esta orden aún no tiene firma. Debes registrar la firma para completar esta acción.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Firmar ahora" }));

    expect(onRequestSignature).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("empieza con la explicación y exige una segunda confirmación", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    const dialog = screen.getByRole("dialog", { name: "Ocultar orden OT-0027" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/ABC123/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ocultar orden" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(props.onConfirm).not.toHaveBeenCalled();
    expect(
      screen.getByText(/no podrás restaurarla desde la interfaz/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ocultar orden" }));

    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("deshabilita la confirmación final mientras la acción está pendiente", async () => {
    const user = userEvent.setup();
    const { rerender, props } = renderModal();

    await user.click(screen.getByRole("button", { name: "Continuar" }));
    rerender(<HideOrderModal {...props} pending />);

    const confirmButton = screen.getByRole("button", { name: "Ocultando orden" });
    expect(confirmButton).toBeDisabled();
    await user.click(confirmButton);
    expect(props.onConfirm).not.toHaveBeenCalled();
  });

  it("muestra el error y conserva abierto el paso final", async () => {
    const user = userEvent.setup();
    const { rerender, props } = renderModal();

    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Ocultar orden" }));
    rerender(<HideOrderModal {...props} error="No fue posible ocultar la orden." />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No fue posible ocultar la orden.",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ocultar orden" }),
    ).toBeInTheDocument();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("reinicia la explicación al abrir otra orden", async () => {
    const user = userEvent.setup();
    const { rerender, props } = renderModal();

    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(
      screen.getByRole("button", { name: "Ocultar orden" }),
    ).toBeInTheDocument();

    rerender(
      <HideOrderModal
        {...props}
        order={{ ...signedOrder, id: 28, code: "OT-0028" }}
      />,
    );

    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ocultar orden" }),
    ).not.toBeInTheDocument();
  });

  it("reinicia la explicación al cerrar y reabrir la misma orden", async () => {
    const user = userEvent.setup();
    const { rerender, props } = renderModal();

    await user.click(screen.getByRole("button", { name: "Continuar" }));
    rerender(<HideOrderModal {...props} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(<HideOrderModal {...props} />);

    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ocultar orden" }),
    ).not.toBeInTheDocument();
  });
});
