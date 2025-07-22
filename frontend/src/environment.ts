type EnvName = "local";
type Environment = { name: EnvName; apiUrl: string };

function getEnvironment(): Environment {
  return { name: "local", apiUrl: "http://localhost:8000/" };
}

const environment = getEnvironment();

export default environment;
