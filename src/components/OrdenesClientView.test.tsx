import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OrdenesClientView from "./OrdenesClientView";

const mocks = vi.hoisted(() => ({
  saveOrderSignatureAction: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));

vi.mock("@/app/(authenticated)/ordenes/actions", () => ({
  addOrderCommentAction: vi.fn(),
  deleteDeliveryPdfAction: vi.fn(),
  downloadOrderPdfAction: vi.fn(),
  hideOrderFromOrdersPanelAction: vi.fn(),
  saveOrderSignatureAction: mocks.saveOrderSignatureAction,
  updateOrderStatusAction: vi.fn(),
  uploadDeliveryPdfAction: vi.fn(),
}));

const buildOrder = (id: number, code: string, plate: string) => ({
  id,
  code,
  mileage: null,
  signatureUrl: null,
  observations: null,
  serviceDescription: null,
  checklist: null,
  createdAt: new Date("2026-09-07T12:00:00.000Z"),
  status: { name: "ENTREGADO" },
  client: {
    name: `Cliente ${id}`,
    phone: "3001234567",
    phone2: null,
    documentNumber: null,
    documentType: null,
  },
  car: {
    plate,
    type: "Automóvil",
    model: "Modelo",
    year: 2026,
    brand: { name: "Marca", logo: null },
  },
  services: [{ service: { name: "Servicio" } }],
  deliveryPdfUrl: null,
  comments: [],
});

describe("OrdenesClientView signature handoff", () => {
  beforeEach(() => {
    mocks.saveOrderSignatureAction.mockReset();
    mocks.showToast.mockReset();

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      beginPath: vi.fn(),
      clearRect: vi.fn(),
      lineTo: vi.fn(),
      moveTo: vi.fn(),
      stroke: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/png;base64,stale-signature",
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("no conserva una firma dibujada al abrir otra orden desde Firmar ahora", async () => {
    const user = userEvent.setup();
    render(
      <OrdenesClientView
        orders={[
          buildOrder(27, "OT-0027", "ABC123"),
          buildOrder(28, "OT-0028", "XYZ789"),
        ]}
      />,
    );

    await user.click(screen.getByText("OT-0027"));
    await user.click(screen.getByRole("button", { name: "Ver Ficha" }));

    const firstCanvas = document.getElementById("details-sig-canvas");
    expect(firstCanvas).toBeInstanceOf(HTMLCanvasElement);
    fireEvent.mouseDown(firstCanvas as HTMLCanvasElement);
    fireEvent.mouseUp(firstCanvas as HTMLCanvasElement);
    expect(screen.getByText("Dibujado ✓")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cerrar Ficha" }));
    await user.click(screen.getByText("OT-0028"));
    await user.click(
      screen.getByRole("button", { name: "Ocultar orden OT-0028" }),
    );
    await user.click(screen.getByRole("button", { name: "Firmar ahora" }));

    expect(screen.queryByText("Dibujado ✓")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar Firma" }));

    expect(mocks.saveOrderSignatureAction).not.toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith(
      "Por favor, dibuje la firma primero.",
      "warning",
    );
  });
});
