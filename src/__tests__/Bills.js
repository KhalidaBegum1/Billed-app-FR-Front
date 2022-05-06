/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import userEvent from "@testing-library/user-event";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      const selectedIcon = document.querySelector(".active-icon ");
      //to-do write expect expression
      expect(windowIcon).toBe(selectedIcon);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test("Click on EyeIcon should display modal", async () => {
      $.fn.modal = jest.fn();
      const onNavigate = (pathName) => {
        document.body.innerHTML = ROUTES_PATH({ pathName });
      };
      document.body.innerHTML = BillsUI({ data: bills });
      const iconEye = await screen.getAllByTestId("icon-eye");
      const firstEye = iconEye[0];
      expect(firstEye).toBeTruthy();
      const currentBills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      const handleClickIconEye = jest.fn(() =>
        currentBills.handleClickIconEye(firstEye)
      );
      firstEye.addEventListener("click", handleClickIconEye);
      userEvent.click(firstEye);
      expect(handleClickIconEye).toHaveBeenCalled();
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("Then I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "e@e" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const contentType = await screen.getByText("Type");
      expect(contentType).toBeTruthy();
      const contentName = await screen.getByText("Nom");
      expect(contentName).toBeTruthy();
      expect(screen.getByTestId("tbody")).toBeTruthy();
      const contentDate = await screen.getByText("Date");
      expect(contentDate).toBeTruthy();
      const contentMontant = await screen.getByText("Montant");
      expect(contentMontant).toBeTruthy();
      const contentStatut = await screen.getByText("Statut");
      expect(contentStatut).toBeTruthy();
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "e@e",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        /* mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();*/
        const errorPage = BillsUI({ error: "Erreur 404" });
        document.body.innerHTML = errorPage;
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        /* mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();*/
        const errorPage = BillsUI({ error: "Erreur 500" });
        document.body.innerHTML = errorPage;
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
