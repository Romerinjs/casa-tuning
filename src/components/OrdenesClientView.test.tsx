import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import OrdenesClientView from "./OrdenesClientView";

const mocks = vi.hoisted(() => ({
  saveOrderSignatureAction: vi.fn(),
  notifyCustomerOrderReadyAction: vi.fn(),
  updateOrderStatusAction: vi.fn(),
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
  notifyCustomerOrderReadyAction: mocks.notifyCustomerOrderReadyAction,
  updateOrderStatusAction: mocks.updateOrderStatusAction,
  uploadDeliveryPdfAction: vi.fn(),
}));

const buildOrder = (
  id: number,
  code: string,
  plate: string,
  statusName: string = "ENTREGADO",
  signatureUrl: string | null = null,
) => ({
  id,
  code,
  mileage: null,
  signatureUrl,
  observations: null,
  serviceDescription: null,
  checklist: null,
  createdAt: new Date("2026-09-07T12:00:00.000Z"),
  status: { name: statusName },
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

describe("OrdenesClientView notification and signature flows", () => {
  beforeEach(() => {
    mocks.saveOrderSignatureAction.mockReset();
    mocks.notifyCustomerOrderReadyAction.mockReset();
    mocks.updateOrderStatusAction.mockReset();
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

  it("envía notificación de vehículo listo sin alterar estado ni entregar la orden", async () => {
    mocks.notifyCustomerOrderReadyAction.mockResolvedValueOnce({
      success: true,
    });
    const user = userEvent.setup();
    render(
      <OrdenesClientView
        orders={[buildOrder(30, "OT-0030", "NOT123", "EN_PROCESO")]}
      />,
    );

    const notifyButton = screen.getByRole("button", {
      name: "Notificar al cliente de la orden OT-0030",
    });
    expect(notifyButton).toBeInTheDocument();

    await user.click(notifyButton);

    expect(mocks.notifyCustomerOrderReadyAction).toHaveBeenCalledWith(30);
    expect(mocks.updateOrderStatusAction).not.toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith(
      "Notificación enviada a Cliente 30 vía WhatsApp.",
      "success",
    );
  });

  it("requiere firma para entregar desde el modal de entrega", async () => {
    mocks.saveOrderSignatureAction.mockResolvedValueOnce({ success: true });
    mocks.updateOrderStatusAction.mockResolvedValueOnce({ success: true });

    const user = userEvent.setup();
    render(
      <OrdenesClientView
        orders={[buildOrder(31, "OT-0031", "DEL123", "EN_PROCESO")]}
      />,
    );

    // Abrir modal de entrega
    await user.click(screen.getByRole("button", { name: "Entregar" }));
    expect(
      screen.getByText("Confirmar Entrega de Vehículo"),
    ).toBeInTheDocument();

    const submitDeliveryBtn = screen.getByRole("button", {
      name: "Guardar y Entregar",
    });
    expect(submitDeliveryBtn).toBeDisabled();

    // Dibujar firma
    const deliveryCanvas = document.getElementById("delivery-sig-canvas");
    expect(deliveryCanvas).toBeInstanceOf(HTMLCanvasElement);
    fireEvent.mouseDown(deliveryCanvas as HTMLCanvasElement);
    fireEvent.mouseUp(deliveryCanvas as HTMLCanvasElement);

    expect(submitDeliveryBtn).toBeEnabled();

    await user.click(submitDeliveryBtn);

    expect(mocks.saveOrderSignatureAction).toHaveBeenCalledWith(
      31,
      "data:image/png;base64,stale-signature",
    );
    expect(mocks.updateOrderStatusAction).toHaveBeenCalledWith(
      31,
      "ENTREGADO",
    );
    expect(mocks.showToast).toHaveBeenCalledWith(
      "Vehículo entregado y firmado con éxito.",
      "success",
    );
  });
});
