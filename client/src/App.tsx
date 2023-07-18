import { QueryClient, QueryClientProvider } from "react-query";
import { Properties } from "./pages/properties";

const queryClient = new QueryClient();

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Properties />
    </QueryClientProvider>
  );
};
