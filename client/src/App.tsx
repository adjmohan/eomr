import { Switch, Route } from "wouter";
import UploadPage from "./pages/upload";
import ResultsPage from "./pages/results";
import NotFound from "./pages/not-found";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Switch>
        <Route path="/" component={UploadPage} />
        <Route path="/results/:batchCode" component={ResultsPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

export default App;
