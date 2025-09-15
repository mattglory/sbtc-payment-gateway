import { render } from "@testing-library/react";
import App from "./App";

test("renders Payment Widget Demo heading", () => {
  const { getByText } = render(<App />);
  const headingElement = getByText("Payment Widget Demo");
  expect(headingElement).toBeInTheDocument();
});
