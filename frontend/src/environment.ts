type EnvName = "local" | "production";
type Environment = { name: EnvName; apiUrl: string };

function getEnvironment(): Environment {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/infrared/api/v1";
  const name: EnvName = import.meta.env.PROD ? "production" : "local";
  return { name, apiUrl };
}

const environment = getEnvironment();

export default environment;
