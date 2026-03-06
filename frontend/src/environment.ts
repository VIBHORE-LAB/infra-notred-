type EnvName = "local";
type Environment = { name: EnvName; apiUrl: string };

function getEnvironment(): Environment {
  return { name: "local", apiUrl: "http://127.0.0.1:5001/infrared/api/v1" };
}

const environment = getEnvironment();

export default environment;
