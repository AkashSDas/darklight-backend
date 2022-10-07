import { app } from "./api";

var port = process.env.PORT || 5002;
app.listen(port, function initApp() {
  console.log(`API is available on http://localhost:${port}/api`);
});
